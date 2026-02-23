import { useEffect, useState } from "react";

export default function EvidenceModal({
  isOpen,
  initialValue = null, // { title, type }
  onClose,
  onSubmit,
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("quiz");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (!isOpen) return;
    setSaving(false);
    setError("");

    setTitle(initialValue?.title ?? "");
    setType(initialValue?.type ?? "quiz");
  }, [isOpen, initialValue]);

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
      await onSubmit({ title: t, type });
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
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <h3>{initialValue ? "Edit Evidence" : "Add Evidence"}</h3>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close" type="button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          <label className="field">
            <span className="field__label">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {EVIDENCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

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
            <button type="button" className="btn" onClick={onClose} disabled={saving}>
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