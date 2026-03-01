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
      orderBy("createdAt", "asc"),
    );

    return onSnapshot(
      qRef,
      (snap) => {
        setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (e) => {
        console.error("Classes listener error:", e);
        setErr(`${e.code ?? "error"}: ${e.message ?? "Failed to load classes."}`);
      },
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
      orderBy("name", "asc"),
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
      },
    );
  }, [user]);

  // --- search filtering ---
  const filteredStudents = useMemo(() => {
    const term = normalize(search);
    if (!term) return students;

    return students.filter((s) => normalize(s.name).includes(term));
  }, [students, search]);

  // --- group by class (with class sorting) ---
  const grouped = useMemo(() => {
    const groups = new Map();

    for (const s of filteredStudents) {
      const cid = s.classId ?? "unknown";
      if (!groups.has(cid)) groups.set(cid, []);
      groups.get(cid).push(s);
    }

    const sections = Array.from(groups.entries()).map(([classId, kids]) => {
      const klass = classById.get(classId);
      const className = klass?.className ?? "Unknown class";
      const period = klass?.classPeriod ?? klass?.period ?? "";

      return { classId, className, period, students: kids };
    });

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
  if (err) return <p className="error">{err}</p>;

  return (
    <div className="page studentList">
      <header className="page-header page-header--row studentList__header">
        <div>
          <h1 className="page-title">All Students</h1>
          <p className="studentList__meta">
            {students.length} student{students.length === 1 ? "" : "s"} •{" "}
            {classes.length} class{classes.length === 1 ? "" : "es"}
          </p>
        </div>

        <div className="studentList__search">
          <label className="studentList__searchLabel">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a student name…"
          />
          {search ? (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setSearch("")}
            >
              Clear
            </button>
          ) : null}
        </div>
      </header>

      {grouped.length === 0 ? (
        <p className="muted">{search ? "No matches." : "No students yet."}</p>
      ) : (
        <div className="studentList__sections">
          {grouped.map((section) => (
            <div key={section.classId} className="studentList__sectionCard">
              <div className="studentList__sectionHead">
                <div>
                  <Link
                    to={`/classes/${section.classId}`}
                    className="studentList__classLink"
                  >
                    {section.className}
                  </Link>
                  {section.period ? (
                    <div className="studentList__period">
                      Period {section.period}
                    </div>
                  ) : null}
                </div>

                <div className="studentList__count">
                  {section.students.length} student
                  {section.students.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="studentList__cards">
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