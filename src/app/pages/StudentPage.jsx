import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase/firebase";
import { useAuth } from "../context/AuthContext";

// --- helpers ---
function levelToLabel(level) {
  if (level === 4) return "Exceeding";
  if (level === 3) return "Meeting";
  if (level === 2) return "Approaching";
  if (level === 1) return "Emerging";
  return "—";
}

function safeNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pick the newest score (by timestamp) from a list of score docs
 * Each score doc should have { level, timestamp }
 */
function newestScore(scores) {
  if (!scores?.length) return null;
  // scores are often already ordered desc, but don't trust it blindly
  let best = scores[0];
  for (const s of scores) {
    const tBest = best?.timestamp?.toMillis?.() ?? 0;
    const t = s?.timestamp?.toMillis?.() ?? 0;
    if (t > tBest) best = s;
  }
  return best ?? null;
}

export default function StudentPage() {
  const { user, loading } = useAuth();
  const { classId, studentId } = useParams();
  const navigate = useNavigate();

  const [klass, setKlass] = useState(null);
  const [student, setStudent] = useState(null);

  const [standards, setStandards] = useState([]); // class standards
  const [evidence, setEvidence] = useState([]); // class evidence
  const [scores, setScores] = useState([]); // scores for this student (in this class)

  const [err, setErr] = useState("");

  // --- class doc ---
  useEffect(() => {
    if (!user || !classId) return;
    const ref = doc(db, "teachers", user.uid, "classes", classId);
    return onSnapshot(
      ref,
      (snap) =>
        setKlass(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (e) => {
        console.error("Scores listener error:", e);
        console.error("code:", e.code);
        console.error("message:", e.message);
        console.error("name:", e.name);
        console.error("stack:", e.stack);
        setErr(`${e.code ?? "error"}: ${e.message ?? "Failed to load class."}`);
      },
    );
  }, [user, classId]);

  // --- student doc ---
  useEffect(() => {
    if (!user || !classId || !studentId) return;
    const ref = doc(
      db,
      "teachers",
      user.uid,
      "classes",
      classId,
      "students",
      studentId,
    );
    return onSnapshot(
      ref,
      (snap) =>
        setStudent(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (e) => {
        console.error("Scores listener error:", e);
        console.error("code:", e.code);
        console.error("message:", e.message);
        console.error("name:", e.name);
        console.error("stack:", e.stack);
        setErr(
          `${e.code ?? "error"}: ${e.message ?? "Failed to load students"}`,
        );
      },
    );
  }, [user, classId, studentId]);

  // --- standards (class) ---
  useEffect(() => {
    if (!user || !classId) return;

    // If you have an explicit order field, use that instead of createdAt
    const qRef = query(
      collection(db, "teachers", user.uid, "standards"),

      orderBy("createdAt", "asc"),
    );

    return onSnapshot(
      qRef,
      (snap) => {
        const rows = [];
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
        setStandards(rows);
      },
      (e) => {
        console.error("Scores listener error:", e);
        console.error("code:", e.code);
        console.error("message:", e.message);
        console.error("name:", e.name);
        console.error("stack:", e.stack);
        setErr(
          `${e.code ?? "error"}: ${e.message ?? "Failed to load standards."}`,
        );
      },
    );
  }, [user, classId]);

  // --- evidence (fan-out: evidence lives under each standard) ---
  useEffect(() => {
    if (!user) return;
    if (!standards?.length) {
      setEvidence([]);
      return;
    }

    setErr("");

    const unsubs = [];

    // aggregate all evidence docs here
    const byEvidenceId = new Map(); // key: `${standardId}_${evidenceId}` -> evidenceDoc

    // helper to publish combined list
    const publish = () => {
      const merged = Array.from(byEvidenceId.values());

      // optional global sort: by createdAt then title
      merged.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        if (ta !== tb) return ta - tb;
        return (a.title ?? "").localeCompare(b.title ?? "");
      });

      setEvidence(merged);
    };

    for (const st of standards) {
      const standardId = st.id;
      if (!standardId) continue;

      const qRef = query(
        collection(
          db,
          "teachers",
          user.uid,
          "standards",
          standardId,
          "evidence",
        ),
        orderBy("createdAt", "asc"),
      );

      const unsub = onSnapshot(
        qRef,
        (snap) => {
          // remove old evidence for this standardId first
          for (const key of byEvidenceId.keys()) {
            if (key.startsWith(`${standardId}_`)) byEvidenceId.delete(key);
          }

          // add current evidence for this standardId
          snap.forEach((d) => {
            byEvidenceId.set(`${standardId}_${d.id}`, {
              id: d.id,
              standardId, // important for grouping later
              ...d.data(),
            });
          });

          publish();
        },
        (e) => {
          console.error("Scores listener error:", e);
          console.error("code:", e.code);
          console.error("message:", e.message);
          console.error("name:", e.name);
          console.error("stack:", e.stack);
          setErr(
            `${e.code ?? "error"}: ${e.message ?? "Failed to load evidence."}`,
          );
        },
      );

      unsubs.push(unsub);
    }

    return () => {
      unsubs.forEach((fn) => fn && fn());
    };
  }, [user, standards]);

  // --- scores for this student (class) ---
  useEffect(() => {
    if (!user || !classId || !studentId) return;

    // Expect each score doc has { studentId, standardId, evidenceId, level, scoreAt }
    const qRef = query(
      collection(db, "teachers", user.uid, "classes", classId, "scores"),
      where("studentId", "==", studentId),
      orderBy("scoreAt", "desc"),
    );

    return onSnapshot(
      qRef,
      (snap) => {
        const rows = [];
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
        setScores(rows);
      },
      (e) => {
        console.error("Scores listener error:", e);
        console.error("code:", e.code);
        console.error("message:", e.message);
        console.error("name:", e.name);
        console.error("stack:", e.stack);
        setErr(
          `${e.code ?? "error"}: ${e.message ?? "Failed to load scores."}`,
        );
      },
    );
  }, [user, classId, studentId]);

  /**
   * Build:
   * - evidenceByStandard: standardId -> evidence[]
   * - newestScoreByEvidence: evidenceId -> newest score doc
   * - newestScoreByStandard: standardId -> newest score doc (overall/mastery)
   */
  const viewModel = useMemo(() => {
    const evidenceByStandard = new Map();
    for (const ev of evidence) {
      const sid = ev.standardId;
      if (!sid) continue;
      if (!evidenceByStandard.has(sid)) evidenceByStandard.set(sid, []);
      evidenceByStandard.get(sid).push(ev);
    }

    // group scores by evidence and by standard
    const scoresByEvidence = new Map();
    const scoresByStandard = new Map();

    for (const sc of scores) {
      const evId = sc.evidenceId;
      const stId = sc.standardId;

      if (evId) {
        if (!scoresByEvidence.has(evId)) scoresByEvidence.set(evId, []);
        scoresByEvidence.get(evId).push(sc);
      }
      if (stId) {
        if (!scoresByStandard.has(stId)) scoresByStandard.set(stId, []);
        scoresByStandard.get(stId).push(sc);
      }
    }

    const newestScoreByEvidence = new Map();
    for (const [evId, arr] of scoresByEvidence.entries()) {
      newestScoreByEvidence.set(evId, newestScore(arr));
    }

    const newestScoreByStandard = new Map();
    for (const [stId, arr] of scoresByStandard.entries()) {
      newestScoreByStandard.set(stId, newestScore(arr));
    }

    return { evidenceByStandard, newestScoreByEvidence, newestScoreByStandard };
  }, [evidence, scores]);

  if (loading) return <p>Loading…</p>;
  if (!user) return <p>Auth error. Please refresh.</p>;
  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (!klass) return <p>Class not found.</p>;
  if (!student) return <p>Student not found.</p>;

  return (
    <div className="page">
      {/* --- header --- */}
      <div className="page-head">
        <div>
          <h2 style={{ marginBottom: 4 }}>{student.name}</h2>
          <p style={{ marginTop: 0, opacity: 0.8 }}>
            Class: <strong>{klass.className ?? "Untitled class"}</strong>
            {klass.period ? ` • Period ${klass.period}` : ""}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn"
            onClick={() => navigate(`/classes/${classId}`)}
          >
            ← Back to class
          </button>
        </div>
      </div>

      {/* --- standards rows --- */}
      <div className="card">
        <div className="card-top">
          <h3 style={{ margin: 0 }}>Standards</h3>
          <p style={{ margin: 0, opacity: 0.7 }}>
            One row per standard. Overall is “most recent score” for that
            standard.
          </p>
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {standards.length === 0 ? (
            <p style={{ opacity: 0.8 }}>No standards yet.</p>
          ) : (
            standards.map((st) => {
              const stId = st.id;
              const evs = viewModel.evidenceByStandard.get(stId) ?? [];
              const overall = viewModel.newestScoreByStandard.get(stId) ?? null;

              const overallLevel = safeNum(overall?.level);
              const overallText =
                overallLevel == null
                  ? "—"
                  : `${overallLevel} • ${levelToLabel(overallLevel)}`;

              return (
                <div key={stId} className="standard-row">
                  {/* Left: Standard title + link */}
                  <div className="standard-row-left">
                    <Link
                      to={`/classes/${classId}/standard/${stId}`}
                      className="standard-title-link"
                      style={{ textDecoration: "none" }}
                    >
                      <div style={{ fontWeight: 700 }}>
                        {st.code ? `${st.code} — ` : ""}
                        {st.text ?? "Untitled standard"}
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.75 }}>
                        Click to score →
                      </div>
                    </Link>
                  </div>

                  {/* Middle: Evidence “mini boxes” */}
                  <div className="standard-row-graph">
                    {evs.length === 0 ? (
                      <div style={{ opacity: 0.7, fontSize: 13 }}>
                        No evidence for this standard yet.
                      </div>
                    ) : (
                      <div className="evidence-strip">
                        {evs.map((ev) => {
                          const sc =
                            viewModel.newestScoreByEvidence.get(ev.id) ?? null;
                          const lvl = safeNum(sc?.level);

                          return (
                            <div
                              key={ev.id}
                              className="evidence-box"
                              title={`${ev.title ?? "Evidence"}: ${
                                lvl == null ? "—" : lvl
                              }`}
                            >
                              <div className="evidence-box-top">
                                <span className="evidence-title">
                                  {ev.title ?? "Evidence"}
                                </span>
                              </div>
                              <div className="evidence-level">
                                {lvl == null ? "—" : lvl}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Overall */}
                  <div className="standard-row-overall">
                    <div className="overall-label">Overall</div>
                    <div className="overall-badge">{overallText}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Minimal styles (move to CSS file later) */}
      <style>{`
        .page { padding: 16px; }
        .page-head { display:flex; align-items:flex-start; justify-content:space-between; gap: 12px; margin-bottom: 16px; }
        .card { padding: 14px; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; }
        .card-top { display:flex; align-items:baseline; justify-content:space-between; gap: 12px; }
        .standard-row { display:grid; grid-template-columns: 280px 1fr 160px; gap: 12px; align-items: stretch; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 12px; }
        .standard-row-left { display:flex; align-items:center; }
        .standard-row-graph { display:flex; align-items:center; overflow:hidden; }
        .standard-row-overall { display:flex; flex-direction:column; justify-content:center; align-items:flex-end; gap: 6px; }
        .overall-label { font-size: 12px; opacity: 0.7; }
        .overall-badge { font-weight: 700; padding: 6px 10px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.15); }
        .evidence-strip { display:flex; gap: 8px; overflow-x:auto; padding-bottom: 4px; }
        .evidence-box { min-width: 120px; border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; padding: 8px; display:flex; flex-direction:column; justify-content:space-between; }
        .evidence-title { font-size: 12px; opacity: 0.8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }
        .evidence-level { font-size: 18px; font-weight: 800; text-align:right; }
      `}</style>
    </div>
  );
}
