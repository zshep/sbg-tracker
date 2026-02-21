import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  onSnapshot,
  collection,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase/firebase";
import { useAuth } from "../context/AuthContext";
import StudentCard from "../components/ClassPage/StudentCard";

function AddStudentModal({ open, onClose, onCreate }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  if (!open) return null;

  const canSubmit = name.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onCreate({ name: name.trim() });
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3>Add Student</h3>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Student name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              autoFocus
            />
          </label>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={!canSubmit}>
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClassPage() {
  const { user, loading } = useAuth();
  const { classId } = useParams();

  const [klass, setKlass] = useState(null);
  const [klassLoading, setKlassLoading] = useState(true);

  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);

  // --- Read class doc ---
  useEffect(() => {
    if (!user || !classId) return;

    const classRef = doc(db, "teachers", user.uid, "classes", classId);

    const unsub = onSnapshot(
      classRef,
      (snap) => {
        setKlassLoading(false);
        if (!snap.exists()) {
          setKlass(null);
          return;
        }
        setKlass({ id: snap.id, ...snap.data() });
      },
      (err) => {
        console.error("Class doc listen failed:", err);
        setKlassLoading(false);
      },
    );

    return () => unsub();
  }, [user, classId]);

  // --- Read students subcollection ---
  useEffect(() => {
    if (!user || !classId) return;

    const studentsRef = collection(
      db,
      "teachers",
      user.uid,
      "classes",
      classId,
      "students",
    );

    const q = query(studentsRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setStudentsLoading(false);
        setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("Students listen failed:", err);
        setStudentsLoading(false);
      },
    );

    return () => unsub();
  }, [user, classId]);

  if (loading) return null;
  if (!user) return null;

  if (klassLoading) return <p>Loading class…</p>;
  if (!klass) return <p>Class not found.</p>;

  const handleAddStudent = async ({ name }) => {
    const studentsRef = collection(
      db,
      "teachers",
      user.uid,
      "classes",
      classId,
      "students",
    );

    await addDoc(studentsRef, {
      name,
      createdAt: serverTimestamp(),
    });

    setModalOpen(false);
  };

  const handleDeleteStudent = async (student) => {
    const ok = window.confirm(`Delete student "${student.name}"?`);
    if (!ok) return;

    await deleteDoc(
      doc(db, "teachers", user.uid, "classes", classId, "students", student.id),
    );
  };

  return (
    <div>
      <header style={{ marginBottom: "12px" }}>
        <h3>{klass.className}</h3>
        <p>Period: {klass.classPeriod}</p>
      </header>

      <section style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h4>Students</h4>
        </div>

        {studentsLoading ? (
          <p>Loading students…</p>
        ) : students.length === 0 ? (
          <p>No students yet.</p>
        ) : (
          <div className="student-list">
            {students.map((s) => (
              <StudentCard
                key={s.id}
                classId={classId}
                student={s}
                onDelete={handleDeleteStudent}
              />
            ))}
          </div>
        )}

        <button type="button" onClick={() => setModalOpen(true)}>
          Add Student
        </button>
      </section>

      <AddStudentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleAddStudent}
      />
    </div>
  );
}
