import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  collectionGroup,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase/firebase";
import { useAuth } from "../context/AuthContext";
import StudentListCard from "../components/StudentListPage/StudentListCard";

function normalize(s) {
  return (s ?? "").toString().trim().toLowerCase();
}

export default function StudentListPage() {
  const { user, loading } = useAuth();

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");

  // --- load all classes (for names / periods / sorting) ---
  useEffect(() => {
    if (!user) return;

    const qRef = query(
      collection(db, "teachers", user.uid, "classes"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(
      qRef,
      (snap) => {
        setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (e) => {
        console.error("Classes listener error:", e);
        setErr(`${e.code ?? "error"}: ${e.message ?? "Failed to load classes."}`);
      }
    );
  }, [user]);

  const classById = useMemo(() => {
    const m = new Map();
    for (const c of classes) m.set(c.id, c);
    return m;
  }, [classes]);

  // --- global students query (across all classes) ---
  useEffect(() => {
    if (!user) return;

    const qRef = query(
      collectionGroup(db, "students"),
      where("teacherId", "==", user.uid),
      orderBy("name", "asc")
    );

    return onSnapshot(
      qRef,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const data = d.data();

          // teachers/{uid}/classes/{classId}/students/{studentId}
          const parts = d.ref.path.split("/");
          const classId = parts[3];

          return {
            id: d.id,
            classId,
            ...data,
          };
        });

        setStudents(rows);
      },
      (e) => {
        console.error("Students listener error:", e);
        setErr(`${e.code ?? "error"}: ${e.message ?? "Failed to load students."}`);
      }
    );
  }, [user]);

  // --- search filtering ---
  const filteredStudents = useMemo(() => {
    const term = normalize(search);
    if (!term) return students;

    return students.filter((s) => {
      const name = normalize(s.name);
      return name.includes(term);
    });
  }, [students, search]);

  // --- group by class (with class sorting) ---
  const grouped = useMemo(() => {
    // classId -> students[]
    const groups = new Map();

    for (const s of filteredStudents) {
      const cid = s.classId ?? "unknown";
      if (!groups.has(cid)) groups.set(cid, []);
      groups.get(cid).push(s);
    }

    // turn into sorted array of sections
    const sections = Array.from(groups.entries()).map(([classId, kids]) => {
      const klass = classById.get(classId);
      const className = klass?.className ?? "Unknown class";
      const period = klass?.classPeriod ?? klass?.period ?? "";

      return {
        classId,
        className,
        period,
        students: kids,
      };
    });

    // sort classes by period then name (tweak as you like)
    sections.sort((a, b) => {
      const pa = normalize(a.period);
      const pb = normalize(b.period);
      if (pa !== pb) return pa.localeCompare(pb);
      return normalize(a.className).localeCompare(normalize(b.className));
    });

    return sections;
  }, [filteredStudents, classById]);

  if (loading) return <p>Loading…</p>;
  if (!user) return <p>Auth error. Please refresh.</p>;
  if (err) return <p style={{ color: "crimson" }}>{err}</p>;

  return (
    <div className="page" style={{ padding: 16 }}>
      {/* Header */}
      <div
        className="page-head"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-end",
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ marginBottom: 4 }}>All Students</h2>
          <p style={{ marginTop: 0, opacity: 0.8 }}>
            {students.length} student{students.length === 1 ? "" : "s"} •{" "}
            {classes.length} class{classes.length === 1 ? "" : "es"}
          </p>
        </div>

        {/* Search */}
        <div style={{ minWidth: 280 }}>
          <label style={{ display: "block", fontSize: 13, opacity: 0.8 }}>
            Search
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a student name…"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.15)",
            }}
          />
          {search ? (
            <button
              type="button"
              className="btn small"
              onClick={() => setSearch("")}
              style={{ marginTop: 8 }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {/* Body */}
      {grouped.length === 0 ? (
        <p style={{ opacity: 0.8 }}>
          {search ? "No matches." : "No students yet."}
        </p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {grouped.map((section) => (
            <div
              key={section.classId}
              style={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                padding: 12,
              }}
            >
              {/* Class header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <div>
                  <Link
                    to={`/classes/${section.classId}`}
                    style={{ fontWeight: 800, textDecoration: "none" }}
                  >
                    {section.className}
                  </Link>
                  {section.period ? (
                    <div style={{ fontSize: 13, opacity: 0.75 }}>
                      Period {section.period}
                    </div>
                  ) : null}
                </div>

                <div style={{ fontSize: 13, opacity: 0.75 }}>
                  {section.students.length} student
                  {section.students.length === 1 ? "" : "s"}
                </div>
              </div>

              {/* Students in class */}
              <div style={{ display: "grid", gap: 10 }}>
                {section.students.map((s) => (
                  <StudentListCard
                    key={`${section.classId}_${s.id}`}
                    student={s}
                    classId={section.classId}
                    className={section.className}
                    period={section.period}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}