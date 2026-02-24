import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  serverTimestamp,
  writeBatch,
  setDoc,
} from "firebase/firestore";
import { db } from "../services/firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function ScoringPage() {
  const { user, loading } = useAuth();
  const { classId, standardId } = useParams();
  const navigate = useNavigate();

  const [klass, setKlass] = useState(null);
  const [standard, setStandard] = useState(null);

  const [students, setStudents] = useState([]);
  const [evidence, setEvidence] = useState([]);

  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [existingScores, setExistingScores] = useState({}); // studentId -> level

  // local edits (what you type)
  const [draftScores, setDraftScores] = useState({}); // studentId -> level (string/number)

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --- Load class (for header) ---
  useEffect(() => {
    if (!user || !classId) return;

    const ref = doc(db, "teachers", user.uid, "classes", classId);
    return onSnapshot(ref, (snap) => {
      setKlass(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, [user, classId]);

  // --- Load standard details ---
  useEffect(() => {
    if (!user || !standardId) return;

    const ref = doc(db, "teachers", user.uid, "standards", standardId);
    return onSnapshot(ref, (snap) => {
      setStandard(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, [user, standardId]);

  // --- Load students in class ---
  useEffect(() => {
    if (!user || !classId) return;

    const ref = collection(db, "teachers", user.uid, "classes", classId, "students");
    const q = query(ref, orderBy("createdAt", "asc"));

    return onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [user, classId]);

  // --- Load evidence for this standard ---
  useEffect(() => {
    if (!user || !standardId) return;

    const ref = collection(db, "teachers", user.uid, "standards", standardId, "evidence");
    const q = query(ref, orderBy("createdAt", "desc"));

    return onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvidence(rows);

      // Auto-select first evidence if none selected
      if (!selectedEvidenceId && rows.length > 0) {
        setSelectedEvidenceId(rows[0].id);
      }

      // If the selected evidence got deleted, reset
      if (selectedEvidenceId && rows.length > 0 && !rows.find((r) => r.id === selectedEvidenceId)) {
        setSelectedEvidenceId(rows[0].id);
      }
      if (rows.length === 0) setSelectedEvidenceId("");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, standardId]);

  // --- Load existing scores for this class + standard + evidence ---
  useEffect(() => {
    if (!user || !classId || !standardId || !selectedEvidenceId) {
      setExistingScores({});
      setDraftScores({});
      return;
    }

    const scoresRef = collection(db, "teachers", user.uid, "classes", classId, "scores");
    const q = query(
      scoresRef,
      where("standardId", "==", standardId),
      where("evidenceId", "==", selectedEvidenceId)
    );

    return onSnapshot(
      q,
      (snap) => {
        const map = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.studentId) map[data.studentId] = data.level;
        });
        setExistingScores(map);

        // initialize drafts from existing (but don’t wipe user typing mid-edit if possible)
        setDraftScores((prev) => {
          // If user already started editing, keep their edits; otherwise seed from existing.
          const hasAnyEdits = Object.keys(prev || {}).length > 0;
          return hasAnyEdits ? prev : map;
        });
      },
      (err) => {
        console.error(err);
        setExistingScores({});
      }
    );
  }, [user, classId, standardId, selectedEvidenceId]);

  const selectedEvidence = useMemo(
    () => evidence.find((e) => e.id === selectedEvidenceId) || null,
    [evidence, selectedEvidenceId]
  );

  const setScoreForStudent = (studentId, level) => {
    setDraftScores((prev) => ({ ...prev, [studentId]: level }));
  };

  const handleSave = async () => {
    setError("");
    if (!user) return;
    if (!classId || !standardId) return;
    if (!selectedEvidenceId) {
      setError("Please select an evidence item first.");
      return;
    }

    // Gather changed scores only 
    const changes = [];
    for (const s of students) {
      const studentId = s.id;
      const raw = draftScores[studentId];

      if (raw === undefined || raw === "" || raw === null) continue;

      const level = Number(raw);
      if (![1, 2, 3, 4].includes(level)) continue;

      const existing = existingScores[studentId];
      if (existing === level) continue;

      changes.push({ studentId, level });
    }

    if (changes.length === 0) {
      alert("No changes to save.");
      return;
    }

    try {
      setSaving(true);
      const batch = writeBatch(db);

      changes.forEach(({ studentId, level }) => {
        const scoreDocId = `${selectedEvidenceId}__${studentId}`; // deterministic => update same doc
        const ref = doc(db, "teachers", user.uid, "classes", classId, "scores", scoreDocId);

        batch.set(
          ref,
          {
            studentId,
            standardId,
            evidenceId: selectedEvidenceId,
            level,
            scoredAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      await batch.commit();

      // After save, re-seed drafts from existing on next snapshot
      setDraftScores({});
    } catch (err) {
      console.error(err);
      setError("Could not save scores. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="page">
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1>Scoring</h1>
          {klass ? (
            <p style={{ marginTop: 4 }}>
              {klass.className} — Period {klass.classPeriod}
            </p>
          ) : null}
        </div>

        <button type="button" className="btn" onClick={() => navigate(`/class/${classId}`)}>
          Back to Class
        </button>
      </header>

      <section className="section">
        <div className="section__head">
          <h2>Standard</h2>
        </div>

        {!standard ? (
          <p>Standard not found.</p>
        ) : (
          <div className="standard-detail">
            <div className="standard-card__code">{standard.code}</div>
            <div className="standard-card__text" style={{ marginTop: 10 }}>
              {standard.text}
            </div>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section__head" style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>Evidence</h2>
        </div>

        {evidence.length === 0 ? (
            <div>
          <p>No evidence exists for this standard yet. Go add evidence first.</p>
          <button
          type="button"
          className="btn"
          onClick={() => navigate(`/standard/${standard.id}`)}
        >
          View Standard
        </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
            <label className="field">
              <span className="field__label">Pick evidence</span>
              <select
                value={selectedEvidenceId}
                onChange={(e) => {
                  setDraftScores({});
                  setSelectedEvidenceId(e.target.value);
                }}
              >
                {evidence.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({(ev.type || "other").replace(/_/g, " ")})
                  </option>
                ))}
              </select>
            </label>

            {selectedEvidence ? (
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                Scoring: <strong>{selectedEvidence.title}</strong>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section__head" style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>Scores</h2>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || !selectedEvidenceId}>
            {saving ? "Saving..." : "Save Scores"}
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}

        {students.length === 0 ? (
          <p>No students in this class yet.</p>
        ) : !selectedEvidenceId ? (
          <p>Select an evidence item to start scoring.</p>
        ) : (
          <div className="scores-list" style={{ display: "grid", gap: 10 }}>
            {students.map((s) => {
              const existing = existingScores[s.id];
              const value = draftScores[s.id] ?? existing ?? "";

              return (
                <div key={s.id} className="score-row" style={{ display: "flex", justifyContent: "space-between", gap: 12, border: "1px solid #e5e5e5", borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "grid" }}>
                    <strong>{s.name}</strong>
                    <span style={{ fontSize: 12, opacity: 0.75 }}>
                      {existing ? `Current: ${existing}` : "No score yet"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <select
                      value={value}
                      onChange={(e) => setScoreForStudent(s.id, e.target.value)}
                      style={{ width: 90 }}
                    >
                      <option value="">--</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}