import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase/firebase"; 
import { useAuth } from "../../context/AuthContext";

import ClassCard from "./ClassCard";


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
            <h3>Add Class</h3>
    
            <form onSubmit={handleSubmit} className="modal-form">
              <label>
                Class Name
                <input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Physics"
                />
              </label>
    
              <label>
                Period
                <input
                  value={classPeriod}
                  onChange={(e) => setClassPeriod(e.target.value)}
                  placeholder="1"
                />
              </label>
    
              <div className="modal-actions">
                <button type="button" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" disabled={!canSubmit}>
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

  useEffect(() => {
    if (!user) return;

    const classesRef = collection(db, "teachers", user.uid, "classes");
    const q = query(classesRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setClasses(rows);
    });

    return () => unsub();
  }, [user]);

  if (loading) return null;
  if (!user) return null;

  const handleCreate = async ({ className, classPeriod }) => {
    const classesRef = collection(db, "teachers", user.uid, "classes");

    await addDoc(classesRef, {
      className,
      classPeriod,
      createdAt: serverTimestamp(),
    });

    setOpen(false);
  };

  const handleDelete = async (klass) => {
    const ok = window.confirm(
      `Delete "${klass.className}" (Period ${klass.classPeriod})?`
    );
    if (!ok) return;

    await deleteDoc(
      doc(db, "teachers", user.uid, "classes", klass.id)
    );
  };

  return (
    <div>
      <h3>Classes</h3>

      {classes.length === 0 ? (
        <p>No classes yet.</p>
      ) : (
        <div className="class-list">
          {classes.map((klass) => (
            <ClassCard
              key={klass.id}
              klass={klass}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <button onClick={() => setOpen(true)} type="button">
        Add Class
      </button>

      <AddClassModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}