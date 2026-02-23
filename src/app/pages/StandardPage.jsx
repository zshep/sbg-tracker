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
import EvidenceModal from "../components/StandardsPage/EvidenceModal";
import EvidenceCard from "../components/StandardsPage/EvidenceCard";

export default function StandardPage() {
  const { standardId } = useParams();
  const teacherId = auth.currentUser?.uid;

  const [standard, setStandard] = useState(null);
  const [loadingStandard, setLoadingStandard] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);

  // Evidence state
  const [evidence, setEvidence] = useState([]);
  const [loadingEvidence, setLoadingEvidence] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState(null); // {id,title, type}

  const EVIDENCE_TYPES = [
    { value: "quiz", label: "Quiz" },
    { value: "test", label: "Test" },
    { value: "lab", label: "Lab" },
    { value: "homework", label: "Homework" },
    { value: "exit_ticket", label: "Exit Ticket" },
    { value: "project", label: "Project" },
    { value: "discussion", label: "Discussion" },
    { value: "other", label: "Other" },
  ];

  //filter helper
  const filteredEvidence = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return evidence.filter((ev) => {
      const evType = ev.type || "other";
      const typeOk = typeFilter === "all" ? true : evType === typeFilter;

      const textOk =
        !normalizedSearch ||
        (ev.title || "").toLowerCase().includes(normalizedSearch);

      return typeOk && textOk;
    });
  }, [evidence, typeFilter, search]);

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

  const handleSubmitEvidence = async ({ title, type }) => {
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
        type,
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

    await updateDoc(ref, {
      title: title.trim(),
      type,
    });
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

      <div className="evidence-toolbar">
        <div className="filter-row">
          <label className="field" style={{ margin: 0, minWidth: 220 }}>
            <span className="field__label">Filter by type</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All</option>
              {EVIDENCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field" style={{ margin: 0, flex: 1 }}>
            <span className="field__label">Search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search evidence..."
            />
          </label>

          {(typeFilter !== "all" || search) && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setTypeFilter("all");
                setSearch("");
              }}
              style={{ alignSelf: "end" }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

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

        {!loadingEvidence && evidence.length === 0 ? (
          <p>No evidence yet for this standard.</p>
        ) : null}

        {!loadingEvidence &&
        evidence.length > 0 &&
        filteredEvidence.length === 0 ? (
          <p>No evidence matches this filter.</p>
        ) : null}

        <div className="evidence-list">
          {filteredEvidence.map((ev) => (
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
        initialValue={
          editingEvidence
            ? { title: editingEvidence.title, type: editingEvidence.type }
            : null
        }
        onClose={() => setIsEvidenceModalOpen(false)}
        onSubmit={handleSubmitEvidence}
      />
    </div>
  );
}
