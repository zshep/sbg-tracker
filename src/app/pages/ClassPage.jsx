
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  onSnapshot,
  collection,
  getDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../services/firebase/firebase";
import { useAuth } from "../context/AuthContext";
import StudentCard from "../components/ClassPage/StudentCard";
import AddStandardToClassModal from "../components/ClassPage/AddStandardToClassModal";
import ClassStandardRow from "../components/ClassPage/ClassStandardCard";
import StandardModal from "../components/StandardsPage/StandardModal";

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
        <div className="modal__header">
          <h3 style={{ margin: 0 }}>Add Student</h3>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          <div className="field">
            <div className="field__label">Student name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              autoFocus
            />
          </div>

          <div className="modal__footer">
            <button className="btn" type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!canSubmit}
            >
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

  // --- Standards linking (join collection) ---
  const [allStandards, setAllStandards] = useState([]);
  const [allStandardsLoading, setAllStandardsLoading] = useState(true);
  const [addStandardOpen, setAddStandardOpen] = useState(false);
  const [createStandardOpen, setCreateStandardOpen] = useState(false);

  const [classStandardLinks, setClassStandardLinks] = useState([]); // join docs
  const [classStandardsLoading, setClassStandardsLoading] = useState(true);

  const navigate = useNavigate();

  const linkedStandardIds = useMemo(
    () => new Set(classStandardLinks.map((l) => l.id)),
    [classStandardLinks],
  );

  //normalizer helper
  function normalizeCode(code) {
    return code
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9._-]/g, "_");
  }

  const linkedStandards = useMemo(() => {
    // Preserve join order (by sortIndex), map join -> actual standard doc
    const standardMap = new Map(allStandards.map((s) => [s.id, s]));

    return classStandardLinks
      .map((link) => standardMap.get(link.id))
      .filter(Boolean);
  }, [allStandards, classStandardLinks]);

  const availableStandardsToLink = useMemo(() => {
    return allStandards.filter((s) => !linkedStandardIds.has(s.id));
  }, [allStandards, linkedStandardIds]);

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

  // --- Read teacher standards library ---
  useEffect(() => {
    if (!user) return;

    const standardsRef = collection(db, "teachers", user.uid, "standards");
    const q = query(standardsRef, orderBy("sortIndex", "asc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setAllStandardsLoading(false);
        setAllStandards(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("Standards listen failed:", err);
        setAllStandardsLoading(false);
      },
    );

    return () => unsub();
  }, [user]);

  // --- Read classStandards join subcollection ---
  useEffect(() => {
    if (!user || !classId) return;

    const ref = collection(
      db,
      "teachers",
      user.uid,
      "classes",
      classId,
      "classStandards",
    );
    const q = query(ref, orderBy("sortIndex", "asc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setClassStandardsLoading(false);
        setClassStandardLinks(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })),
        );
      },
      (err) => {
        console.error("Class standards listen failed:", err);
        setClassStandardsLoading(false);
      },
    );

    return () => unsub();
  }, [user, classId]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Lodaing User</div>;

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
      classId,
      period: klass.classPeriod,
      teacherId: user.uid,
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

  //link and unlink Standards function helpers
  const handleLinkStandard = async (standardId) => {
    if (!user) return;

    // join doc id = standardId -> prevents duplicates
    const joinRef = doc(
      db,
      "teachers",
      user.uid,
      "classes",
      classId,
      "classStandards",
      standardId,
    );

    await setDoc(
      joinRef,
      {
        standardId,
        linkedAt: serverTimestamp(),
        sortIndex: Date.now(),
      },
      { merge: false },
    );

    setAddStandardOpen(false);
  };

  const openCreateStandard = () => {
    setAddStandardOpen(false);
    setCreateStandardOpen(true);
  };

  const handleRemoveStandardFromClass = async (standard) => {
    const ok = window.confirm(
      `Remove standard "${standard.code}" from this class?`,
    );
    if (!ok) return;

    await deleteDoc(
      doc(
        db,
        "teachers",
        user.uid,
        "classes",
        classId,
        "classStandards",
        standard.id,
      ),
    );
  };

  //adding standard handlers
  const handleCreateStandardAndLink = async ({ code, text }) => {
    if (!user) throw new Error("Not signed in.");

    const cleanCode = code.trim();
    const cleanText = text.trim();
    const standardId = normalizeCode(cleanCode);

    // 1) Create standard (prevent duplicates)
    const standardRef = doc(db, "teachers", user.uid, "standards", standardId);
    const existing = await getDoc(standardRef);

    if (existing.exists()) {
      throw new Error(
        `Code "${cleanCode}" already exists. Choose a different code.`,
      );
    }

    await setDoc(
      standardRef,
      {
        code: cleanCode,
        text: cleanText,
        createdAt: serverTimestamp(),
        sortIndex: Date.now(),
      },
      { merge: false },
    );

    // 2) Link standard into this class
    const joinRef = doc(
      db,
      "teachers",
      user.uid,
      "classes",
      classId,
      "classStandards",
      standardId,
    );

    await setDoc(
      joinRef,
      {
        standardId,
        linkedAt: serverTimestamp(),
        sortIndex: Date.now(),
      },
      { merge: false },
    );

    setCreateStandardOpen(false);
  };

  return (
    <div className="page">
      <header className="page-header page-header--row">
        <div>
          <h2 className="page-title">{klass.className}</h2>
          <p className="muted">Period: {klass.classPeriod}</p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn"
            onClick={() => navigate(`/class/${classId}/mastery`)}
          >
            Mastery Grid
          </button>
        </div>
      </header>

      <section className="section">
        <div className="section__head section__head--row">
          <h3 className="section__title">Students</h3>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            Add Student
          </button>
        </div>

        {studentsLoading ? (
          <p>Loading students…</p>
        ) : students.length === 0 ? (
          <p className="muted">No students yet.</p>
        ) : (
          <div className="student-list">
            {students.map((s) => (
              <StudentCard
                key={s.id}
                classId={classId}
                student={s}
                onDelete={handleDeleteStudent}
                studentId={s.id}
              />
            ))}
          </div>
        )}
      </section>

      <AddStudentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleAddStudent}
      />

      
      <section className="section">
        <div className="section__head section__head--row">
          <h3 className="section__title">Standards</h3>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAddStandardOpen(true)}
          >
            Add Standard
          </button>
        </div>

        {allStandardsLoading || classStandardsLoading ? (
          <p>Loading standards…</p>
        ) : linkedStandards.length === 0 ? (
          <p className="muted">No standards linked to this class yet.</p>
        ) : (
          <div className="stack">
            {linkedStandards.map((st) => (
              <ClassStandardRow
                key={st.id}
                standard={st}
                onRemove={handleRemoveStandardFromClass}
                classId={classId}
              />
            ))}
          </div>
        )}
      </section>

      <AddStandardToClassModal
        open={addStandardOpen}
        onClose={() => setAddStandardOpen(false)}
        standards={availableStandardsToLink}
        onLink={handleLinkStandard}
        onCreateNew={openCreateStandard}
      />

      <StandardModal
        isOpen={createStandardOpen}
        mode="add"
        initialValue={null}
        onClose={() => setCreateStandardOpen(false)}
        onSubmit={handleCreateStandardAndLink}
      />
    </div>
  );
}
