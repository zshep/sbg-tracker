import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../services/firebase/firebase";
import StandardModal from "../components/StandardsPage/StandardModal";

// --- Minimal Evidence UI (MVP) ---
function EvidenceCard({ evidence, onEdit, onDelete }) {
  return (
    <div className="evidence-card">
      <div className="evidence-card__title">{evidence.title}</div>
      <div className="evidence-card__actions">
        <button type="button" className="btn" onClick={() => onEdit(evidence)}>
          Edit
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onDelete(evidence.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function EvidenceModal({ isOpen, initialTitle = "", onClose, onSubmit }) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialTitle);
    setSaving(false);
    setError("");
  }, [isOpen, initialTitle]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const t = title.trim();
    if (!t) {
      setError("Please enter evidence text/title.");
      return;
    }

    try {
      setSaving(true);
      await onSubmit(t);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Could not save evidence. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal__header">
          <h3>{initialTitle ? "Edit Evidence" : "Add Evidence"}</h3>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          <label className="field">
            <span className="field__label">Evidence</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Quiz 1, Lab: Circuits, Exit Ticket 3..."
              autoFocus
            />
          </label>

          {error ? <div className="error">{error}</div> : null}

          <div className="modal__footer">
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StandardPage() {
  const { standardId } = useParams();
  const teacherId = auth.currentUser?.uid;

  const [standard, setStandard] = useState(null);
  const [loadingStandard, setLoadingStandard] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);

  // Evidence state
  const [evidence, setEvidence] = useState([]);
  const [loadingEvidence, setLoadingEvidence] = useState(true);

  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState(null); // {id,title}

  // Load standard doc
  useEffect(() => {
    if (!teacherId || !standardId) return;

    let alive = true;
    (async () => {
      try {
        setLoadingStandard(true);
        const ref = doc(db, "teachers", teacherId, "standards", standardId);
        const snap = await getDoc(ref);
        if (!alive) return;

        if (!snap.exists()) {
          setStandard(null);
        } else {
          setStandard({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
        if (alive) setStandard(null);
      } finally {
        if (alive) setLoadingStandard(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [teacherId, standardId]);

  // Evidence query
  const evidenceQuery = useMemo(() => {
    if (!teacherId || !standardId) return null;

    return query(
      collection(
        db,
        "teachers",
        teacherId,
        "standards",
        standardId,
        "evidence",
      ),
      orderBy("createdAt", "desc"),
    );
  }, [teacherId, standardId]);

  useEffect(() => {
    if (!evidenceQuery) {
      setEvidence([]);
      setLoadingEvidence(false);
      return;
    }

    setLoadingEvidence(true);
    const unsub = onSnapshot(
      evidenceQuery,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEvidence(rows);
        setLoadingEvidence(false);
      },
      (err) => {
        console.error(err);
        setEvidence([]);
        setLoadingEvidence(false);
      },
    );

    return () => unsub();
  }, [evidenceQuery]);

  const handleEditStandard = async ({ text }) => {
    if (!teacherId) throw new Error("Not signed in.");

    const ref = doc(db, "teachers", teacherId, "standards", standardId);
    await updateDoc(ref, { text: text.trim() });

    // refresh local display quickly
    setStandard((prev) => (prev ? { ...prev, text: text.trim() } : prev));
  };

  // Evidence add/edit/delete
  const openAddEvidence = () => {
    setEditingEvidence(null);
    setIsEvidenceModalOpen(true);
  };

  const openEditEvidence = (ev) => {
    setEditingEvidence(ev);
    setIsEvidenceModalOpen(true);
  };

  const handleSubmitEvidence = async (title) => {
    if (!teacherId) throw new Error("Not signed in.");

    const colRef = collection(
      db,
      "teachers",
      teacherId,
      "standards",
      standardId,
      "evidence",
    );

    if (!editingEvidence) {
      await addDoc(colRef, {
        title: title.trim(),
        createdAt: serverTimestamp(),
      });
      return;
    }

    const ref = doc(
      db,
      "teachers",
      teacherId,
      "standards",
      standardId,
      "evidence",
      editingEvidence.id,
    );
    await updateDoc(ref, { title: title.trim() });
  };

  const handleDeleteEvidence = async (evidenceId) => {
    if (!teacherId) return;

    const confirmed = window.confirm(
      "Delete this evidence? This cannot be undone.",
    );
    if (!confirmed) return;

    await deleteDoc(
      doc(
        db,
        "teachers",
        teacherId,
        "standards",
        standardId,
        "evidence",
        evidenceId,
      ),
    );
  };

  if (!teacherId) return <p>Loading...</p>;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Standard</h1>
      </header>

      <section className="section">
        <div
          className="section__head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>Details</h2>
          {standard ? (
            <button
              type="button"
              className="btn"
              onClick={() => setIsEditOpen(true)}
            >
              Edit
            </button>
          ) : null}
        </div>

        {loadingStandard ? <p>Loading standard...</p> : null}

        {!loadingStandard && !standard ? <p>Standard not found.</p> : null}

        {!loadingStandard && standard ? (
          <div className="standard-detail">
            <div className="standard-card__code">{standard.code}</div>
            <div className="standard-card__text" style={{ marginTop: 10 }}>
              {standard.text}
            </div>
          </div>
        ) : null}
      </section>

      <section className="section">
        <div
          className="section__head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>Evidence</h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddEvidence}
          >
            Add Evidence
          </button>
        </div>

        {loadingEvidence ? <p>Loading evidence...</p> : null}

        {!loadingEvidence && evidence.length === 0 ? (
          <p>No evidence yet for this standard.</p>
        ) : null}

        <div className="evidence-list">
          {evidence.map((ev) => (
            <EvidenceCard
              key={ev.id}
              evidence={ev}
              onEdit={openEditEvidence}
              onDelete={handleDeleteEvidence}
            />
          ))}
        </div>
      </section>

      <StandardModal
        isOpen={isEditOpen}
        mode="edit"
        initialValue={
          standard
            ? { id: standard.id, code: standard.code, text: standard.text }
            : null
        }
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditStandard}
      />

      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        initialTitle={editingEvidence?.title ?? ""}
        onClose={() => setIsEvidenceModalOpen(false)}
        onSubmit={handleSubmitEvidence}
      />
    </div>
  );
}
