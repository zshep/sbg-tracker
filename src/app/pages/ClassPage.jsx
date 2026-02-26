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
    <div>
      <header style={{ marginBottom: "12px" }}>
        <h3>{klass.className}</h3>
        <p>Period: {klass.classPeriod}</p>
        {/*<p>ClassId: {classId}</p> */}
        <button
          type="button"
          className="btn"
          onClick={() => navigate(`/class/${classId}/mastery`)}
        >
          Mastery Grid
        </button>
      </header>

      {/*Students Section */}
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
                studentId={s.id}
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

      <section style={{ marginTop: "16px" }}>
        {/* Standards section */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h4>Standards</h4>
          <button type="button" onClick={() => setAddStandardOpen(true)}>
            Add Standard
          </button>
        </div>

        {allStandardsLoading || classStandardsLoading ? (
          <p>Loading standards…</p>
        ) : linkedStandards.length === 0 ? (
          <p>No standards linked to this class yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
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
