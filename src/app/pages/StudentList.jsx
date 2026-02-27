import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  doc,
  where,
  onSnapshot,
  query,
  orderBy,
  collectionGroup,
} from "firebase/firestore";
import { db } from "../services/firebase/firebase";
import { useAuth } from "../context/AuthContext";
import StudentListCard from "../components/StudentListPage/StudentListCard";

export default function StudentListPage() {
  const { user, loading } = useAuth();

  const [classes, setClasses] = useState([]);      // class docs
  const [students, setStudents] = useState([]);    // all students across all classes
  const [err, setErr] = useState("");

  // --- load all classes  ---
  useEffect(() => {
    if (!user) return;

    const qRef = query(
      collection(db, "teachers", user.uid, "classes"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(
      qRef,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setClasses(rows);
      },
      (e) => {
        console.error("Classes listener error:", e);
        setErr(`${e.code ?? "error"}: ${e.message ?? "Failed to load classes."}`);
      }
    );
  }, [user]);

  // Map classId -> class doc for quick lookup
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
          orderBy("name", "asc"));

    return onSnapshot(
      qRef,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const data = d.data();

          // d.ref.path looks like:
          // teachers/{uid}/classes/{classId}/students/{studentId}
          const parts = d.ref.path.split("/");
          const classId = parts[3]; // teachers/{uid}/classes/{classId}/students/{studentId}

          return {
            id: d.id,
            classId,
            ...data,
          };
        });

        // Filter down to only this teacher's docs (defense-in-depth)
        
        const mine = rows.filter((r) => {
          // if your student docs include ownerId/teacherId, use that instead
          return true;
        });

        setStudents(mine);
      },
      (e) => {
        console.error("Students (collectionGroup) listener error:", e);
        setErr(`${e.code ?? "error"}: ${e.message ?? "Failed to load students."}`);
      }
    );
  }, [user]);

  if (loading) return <p>Loading…</p>;
  if (!user) return <p>Auth error. Please refresh.</p>;
  if (err) return <p style={{ color: "crimson" }}>{err}</p>;

  return (
    <div className="page">
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>All Students</h2>
          <p style={{ marginTop: 0, opacity: 0.8 }}>
            Across {classes.length} class{classes.length === 1 ? "" : "es"}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {students.length === 0 ? (
          <p style={{ opacity: 0.8 }}>No students yet.</p>
        ) : (
          students.map((s) => {
            const klass = classById.get(s.classId);
            return (
              <StudentListCard
                key={`${s.classId}_${s.id}`}
                student={s}
                classId={s.classId}
                className={klass?.className}
                period={klass?.period}
              />
            );
          })
        )}
      </div>
    </div>
  );
}