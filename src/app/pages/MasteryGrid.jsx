import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../services/firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function MasteryGrid() {
  const { user, loading } = useAuth();
  const { classId } = useParams();
  const navigate = useNavigate();

  const [klass, setKlass] = useState(null);

  const [students, setStudents] = useState([]);
  const [standards, setStandards] = useState([]); // linked standards full docs in class order
  const [scores, setScores] = useState([]); // raw scores docs

  // --- class header ---
  useEffect(() => {
    if (!user || !classId) return;
    const ref = doc(db, "teachers", user.uid, "classes", classId);
    return onSnapshot(ref, (snap) => {
      setKlass(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, [user, classId]);

  // --- students ---
  useEffect(() => {
    if (!user || !classId) return;
    const ref = collection(
      db,
      "teachers",
      user.uid,
      "classes",
      classId,
      "students",
    );
    const q = query(ref, orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [user, classId]);

  // --- classStandards join + standards library ---
  useEffect(() => {
    if (!user || !classId) return;

    const joinRef = collection(
      db,
      "teachers",
      user.uid,
      "classes",
      classId,
      "classStandards",
    );
    const joinQ = query(joinRef, orderBy("sortIndex", "asc"));

    const standardsRef = collection(db, "teachers", user.uid, "standards");
    const standardsQ = query(standardsRef, orderBy("sortIndex", "asc")); // only used for map

    let joinUnsub = null;
    let standardsUnsub = null;

    let joinDocs = [];
    let standardsMap = new Map();

    const recompute = () => {
      const linked = joinDocs
        .map((j) => standardsMap.get(j.id))
        .filter(Boolean);
      setStandards(linked);
    };

    joinUnsub = onSnapshot(joinQ, (snap) => {
      joinDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      recompute();
    });

    standardsUnsub = onSnapshot(standardsQ, (snap) => {
      standardsMap = new Map(
        snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]),
      );
      recompute();
    });

    return () => {
      if (joinUnsub) joinUnsub();
      if (standardsUnsub) standardsUnsub();
    };
  }, [user, classId]);

  // --- scores (all scores in this class) ---
  useEffect(() => {
    if (!user || !classId) return;

    const ref = collection(
      db,
      "teachers",
      user.uid,
      "classes",
      classId,
      "scores",
    );
    // scoredAt desc so “first seen wins” in reduce
    const q = query(ref, orderBy("scoredAt", "desc"));

    return onSnapshot(q, (snap) => {
      setScores(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [user, classId]);

  // --- latest mastery map: mastery[studentId][standardId] = level ---
  const mastery = useMemo(() => {
    const map = new Map(); // key = `${studentId}__${standardId}` => level

    for (const s of scores) {
      const studentId = s.studentId;
      const standardId = s.standardId;
      const level = s.level;

      if (!studentId || !standardId) continue;
      const key = `${studentId}__${standardId}`;

      // scores are ordered by scoredAt desc, so first one encountered is latest
      if (!map.has(key)) map.set(key, level);
    }

    return map;
  }, [scores]);

  if (loading) return null;
  if (!user) return null;

  //csv file helpers
  function csvEscape(value) {
  const s = value === null || value === undefined ? "" : String(value);
  // Wrap in quotes if it contains comma, quote, or newline
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const handleExportCsv = () => {
  // Header: Student Name, then each standard code
  const header = ["Student", ...standards.map((st) => st.code)];

  const rows = students.map((stu) => {
    const cells = [stu.name];

    standards.forEach((st) => {
      const key = `${stu.id}__${st.id}`;
      const level = mastery.get(key);
      cells.push(level ?? "");
    });

    return cells;
  });

  const lines = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const safeClass = (klass?.className || "class")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");

  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const safePeriod = klass?.classPeriod
  ? String(klass.classPeriod).trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "")
  : "";

const filename = `${safeClass}${safePeriod ? "_P" + safePeriod : ""}_mastery_${date}.csv`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
};

  return (
    <div className="page">
      <header
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <div>
          <h1>Mastery</h1>
          {klass ? (
            <p style={{ marginTop: 4 }}>
              {klass.className} — Period {klass.classPeriod}
            </p>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="btn"
            onClick={() => navigate(`/class/${classId}`)}
          >
            Back to Class
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExportCsv}
            disabled={students.length === 0 || standards.length === 0}
          >
            Export CSV
          </button>
        </div>
      </header>

      {students.length === 0 ? <p>No students yet.</p> : null}
      {standards.length === 0 ? (
        <p>No standards linked to this class yet.</p>
      ) : null}

      {students.length > 0 && standards.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table
            className="mastery-table"
            style={{ borderCollapse: "collapse", minWidth: 700 }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: 10,
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  Student
                </th>
                {standards.map((st) => (
                  <th
                    key={st.id}
                    onClick={() =>
                      navigate(`/class/${classId}/standard/${st.id}`)
                    }
                    style={{
                      padding: 10,
                      borderBottom: "1px solid #e5e5e5",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                      textDecoration: "underline",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    title="Click to score this standard"
                  >
                    {st.code}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {students.map((stu) => (
                <tr key={stu.id}>
                  <td
                    style={{
                      padding: 10,
                      borderBottom: "1px solid #f0f0f0",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {stu.name}
                  </td>

                  {standards.map((st) => {
                    const key = `${stu.id}__${st.id}`;
                    const level = mastery.get(key);
                    const cls =
                      level === 1
                        ? "mcell mcell--1"
                        : level === 2
                          ? "mcell mcell--2"
                          : level === 3
                            ? "mcell mcell--3"
                            : level === 4
                              ? "mcell mcell--4"
                              : "mcell mcell--empty";

                    return (
                      <td
                        key={st.id}
                        className={cls}
                        style={{
                          padding: 10,
                          borderBottom: "1px solid #f0f0f0",
                          textAlign: "center",
                          fontWeight: 700,
                        }}
                      >
                        {level ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
