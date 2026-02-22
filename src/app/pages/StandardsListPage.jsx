import React, { useEffect, useMemo, useState } from "react";
import {
  setDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  collection,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../services/firebase/firebase";

import StandardModal from "../components/StandardsPage/StandardModal";
import StandardsCard from "../components/StandardsPage/StandardsCard";

// Drag and Drop imports/dependencies
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { writeBatch } from "firebase/firestore";

export default function StandardsListPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);

  const teacherId = auth.currentUser?.uid;

  function normalizeCode(code) {
    return code
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9._-]/g, "_");
  }

  const standardsQuery = useMemo(() => {
    if (!teacherId) return null;
    return query(
      collection(db, "teachers", teacherId, "standards"),
      orderBy("sortIndex", "asc")
    );
  }, [teacherId]);

  useEffect(() => {
    if (!standardsQuery) {
      setStandards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(
      standardsQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setStandards(rows);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setStandards([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [standardsQuery]);

  const openAdd = () => setIsModalOpen(true);

  const handleAddStandard = async ({ code, text }) => {
    if (!teacherId) throw new Error("Not signed in.");

    const cleanCode = code.trim();
    const cleanText = text.trim();
    const standardId = normalizeCode(cleanCode);

    const ref = doc(db, "teachers", teacherId, "standards", standardId);
    const existing = await getDoc(ref);

    if (existing.exists()) {
      throw new Error(`Code "${cleanCode}" already exists. Choose a different code.`);
    }

    await setDoc(
      ref,
      {
        code: cleanCode,
        text: cleanText,
        createdAt: serverTimestamp(),
        sortIndex: Date.now(),
      },
      { merge: false }
    );
  };

  const handleDeleteStandard = async (standardId) => {
    if (!teacherId) return;

    const standard = standards.find((s) => s.id === standardId);
    const label = standard ? `${standard.code} — ${standard.text}` : standardId;

    const confirmed = window.confirm(
      `Delete this standard?\n\n${label}\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    await deleteDoc(doc(db, "teachers", teacherId, "standards", standardId));
  };

  // Drag and Drop Logic:
  const standardIds = standards.map((s) => s.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = standards.findIndex((s) => s.id === active.id);
    const newIndex = standards.findIndex((s) => s.id === over.id);

    const reordered = arrayMove(standards, oldIndex, newIndex);

    // Optimistic UI update
    setStandards(reordered);

    try {
      if (!teacherId) return;

      const batch = writeBatch(db);
      reordered.forEach((s, idx) => {
        const ref = doc(db, "teachers", teacherId, "standards", s.id);
        batch.update(ref, { sortIndex: (idx + 1) * 1000 });
      });

      await batch.commit();
    } catch (err) {
      console.error("Reorder failed:", err);
      alert("Could not save new order. Try again.");
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Standards</h1>

        <button className="btn btn-primary" onClick={openAdd}>
          Add Standard
        </button>
      </header>

      <section className="section">
        <div className="section__head">
          <h2>Standards</h2>
        </div>

        {loading ? <p>Loading...</p> : null}

        {!loading && standards.length === 0 ? (
          <p>No standards yet. Add your first one.</p>
        ) : null}

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={standardIds} strategy={verticalListSortingStrategy}>
            <div className="standards-list">
              {standards.map((s) => (
                <StandardsCard
                  key={s.id}
                  standard={s}
                  onDelete={handleDeleteStandard}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <StandardModal
        isOpen={isModalOpen}
        mode="add"
        initialValue={null}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddStandard}
      />
    </div>
  );
}