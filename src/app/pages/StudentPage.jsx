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
 * Pick the newest score (by scoredAt) from a list of score docs
 * Each score doc should have { level, scoredAt }
 */
function newestScore(scores) {
  if (!scores?.length) return null;
  // scores are often already ordered desc, but don't trust it blindly
  console.log("scores:", scores);
  let best = scores[0];
  for (const s of scores) {
    const tBest = best?.scoredAt?.toMillis?.() ?? 0;
    const t = s?.scoredAt?.toMillis?.() ?? 0;
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
        console.error("stduents listener error:", e);
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
        console.error("Standards listener error:", e);
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
          console.error("evidence listener error:", e);
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
      orderBy("scoredAt", "desc"),
    );

    return onSnapshot(
      qRef,
      (snap) => {
        const rows = [];
        //console.log("snap:", snap);
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
        //console.log("Scores from query:", rows);
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
    <div className="page studentPage">
      {/* --- header --- */}
      <header className="studentPage__head page-header page-header--row">
        <div>
          <h1 className="page-title studentPage__title">{student.name}</h1>
          <p className="studentPage__meta">
            Class: <strong>{klass.className ?? "Untitled class"}</strong>
            {klass.classPeriod ? ` • Period ${klass.classPeriod}` : ""}
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn"
            onClick={() => navigate(`/class/${classId}`)}
          >
            ← Back to class
          </button>
        </div>
      </header>

      {/* --- standards rows --- */}
      <section className="studentPage__card">
        <div className="studentPage__cardTop">
          <h2 className="studentPage__cardTitle">Standards</h2>
          <p className="studentPage__cardHint">
            Overall is “most recent score” for that standard.
          </p>
        </div>

        <div className="studentPage__rows">
          {standards.length === 0 ? (
            <p className="muted">No standards yet.</p>
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
                <div key={stId} className="studentPage__standardRow">
                  {/* Left: Standard title + link */}
                  <div className="studentPage__standardLeft">
                    <Link
                      to={`/class/${classId}/standard/${stId}`}
                      className="studentPage__standardLink"
                    >
                      <div className="studentPage__standardTitle">
                        {st.code ? `${st.code} — ` : ""}
                        {st.text ?? "Untitled standard"}
                      </div>
                      <div className="studentPage__standardSub">
                        Click to score →
                      </div>
                    </Link>
                  </div>

                  {/* Middle: Evidence “mini boxes” */}
                  <div className="studentPage__standardGraph">
                    {evs.length === 0 ? (
                      <div className="studentPage__noEvidence">
                        No evidence for this standard yet.
                      </div>
                    ) : (
                      <div className="studentPage__evidenceStrip">
                        {evs.map((ev) => {
                          const sc =
                            viewModel.newestScoreByEvidence.get(ev.id) ?? null;
                          const lvl = safeNum(sc?.level);

                          return (
                            <div
                              key={ev.id}
                              className="studentPage__evidenceBox"
                              title={`${ev.title ?? "Evidence"}: ${
                                lvl == null ? "—" : lvl
                              }`}
                            >
                              <div className="studentPage__evidenceBoxTop">
                                <span className="studentPage__evidenceTitle">
                                  {ev.title ?? "Evidence"}
                                </span>
                              </div>
                              <div className="studentPage__evidenceLevel">
                                {lvl == null ? "—" : lvl}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Overall */}
                  <div className="studentPage__overall">
                    <div className="studentPage__overallLabel">Overall</div>
                    <div className="studentPage__overallBadge">{overallText}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
