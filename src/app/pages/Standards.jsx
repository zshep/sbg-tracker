import React, { useEffect, useMemo, useState } from "react";
import {
  setDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "../services/firebase/firebase";

import AddStandardModal from "../components/StandardsPage/AddStandardModal";
import StandardsCard from "../components/StandardsPage/StandardsCard";

export default function StandardsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState(null);


  // teacherId hydration 
  useEffect(() => {
  const unsub = auth.onAuthStateChanged((user) => {
    setTeacherId(user ? user.uid : null);
  });

  return () => unsub();
}, []);

  // code normalizer helper:
  function normalizeCode(code) {
    return code
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "") // remove spaces
      .replace(/[^a-z0-9._-]/g, "_"); // keep safe chars
  }

  const standardsQuery = useMemo(() => {
    if (!teacherId) return null;

    return query(
      collection(db, "teachers", teacherId, "standards"),
      orderBy("sortIndex", "asc"),
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
        const rows = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setStandards(rows);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setStandards([]);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [standardsQuery]);

  const handleAddStandard = async ({ code, text }) => {
    if (!teacherId) throw new Error("Not signed in.");

    const cleanCode = code.trim();
    const standardId = normalizeCode(cleanCode);

    await setDoc(
      doc(db, "teachers", teacherId, "standards", standardId),
      {
        code: cleanCode,
        text: text.trim(),
        createdAt: serverTimestamp(),
        sortIndex: Date.now(), 
      },
      { merge: false },
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

  try {
    await deleteDoc(
      doc(db, "teachers", teacherId, "standards", standardId)
    );
  } catch (err) {
    console.error("Error deleting standard:", err);
    alert("Could not delete standard. Try again.");
  }
};

  return (
    <div className="page">
      <header className="page-header">
        <h1>Standards</h1>

        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
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

        <div className="standards-list">
          {standards.map((s) => (
            <StandardsCard
              key={s.id}
              standard={s}
              onDelete={handleDeleteStandard}
            />
          ))}
        </div>
      </section>

      <AddStandardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddStandard}
      />
    </div>
  );
}
