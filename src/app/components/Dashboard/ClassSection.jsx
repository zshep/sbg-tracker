import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../services/firebase/firebase";
import { useAuth } from "../../context/AuthContext";

import SortableClassCard from "../ClassPage/SortableClassCard";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

//add class modal
function AddClassModal({ open, onClose, onCreate }) {
  const [className, setClassName] = useState("");
  const [classPeriod, setClassPeriod] = useState("");

  useEffect(() => {
    if (!open) {
      setClassName("");
      setClassPeriod("");
    }
  }, [open]);

  if (!open) return null;

  const canSubmit =
    className.trim().length > 0 && classPeriod.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    onCreate({
      className: className.trim(),
      classPeriod: classPeriod.trim(),
    });
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 style={{ margin: 0 }}>Add Class</h3>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          <div className="field">
            <div className="field__label">Class Name</div>
            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Physics"
            />
          </div>

          <div className="field">
            <div className="field__label">Period</div>
            <input
              value={classPeriod}
              onChange={(e) => setClassPeriod(e.target.value)}
              placeholder="1"
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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClassSection() {
  const { user, loading } = useAuth();

  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);

  const classIds = classes.map((c) => c.id);

  useEffect(() => {
    if (!user) return;

    const classesRef = collection(db, "teachers", user.uid, "classes");
    const q = query(classesRef, orderBy("order", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setClasses(rows);
    });

    return () => unsub();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Lodaing User</div>;

  const handleCreate = async ({ className, classPeriod }) => {
    const classesRef = collection(db, "teachers", user.uid, "classes");

    await addDoc(classesRef, {
      className,
      classPeriod,
      createdAt: serverTimestamp(),
      order: classes.length, // append
    });

    setOpen(false);
  };

  const handleDelete = async (klass) => {
    const ok = window.confirm(
      `Delete "${klass.className}" (Period ${klass.classPeriod})?`,
    );
    if (!ok) return;

    await deleteDoc(doc(db, "teachers", user.uid, "classes", klass.id));
  };

  
  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = classes.findIndex((c) => c.id === active.id);
    const newIndex = classes.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(classes, oldIndex, newIndex);
    setClasses(next);

    // persist order
    const batch = writeBatch(db);
    next.forEach((klass, idx) => {
      batch.update(doc(db, "teachers", user.uid, "classes", klass.id), {
        order: idx,
      });
    });
    await batch.commit();
  };

  return (
    <section className="section">
      <div className="section__head section__head--row">
        <h3 className="section__title">Classes</h3>

        <button
          onClick={() => setOpen(true)}
          type="button"
          className="btn btn-primary"
        >
          Add Class
        </button>
      </div>

      {classes.length === 0 ? (
        <p className="muted">No classes yet.</p>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={classIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="class-list">
              {classes.map((klass) => (
                <SortableClassCard
                  key={klass.id}
                  klass={klass}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AddClassModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={handleCreate}
      />
    </section>
  );
}
