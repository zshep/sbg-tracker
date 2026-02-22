import React, { useEffect, useState } from "react";

export default function AddStandardModal({ isOpen, onClose, onSubmit }) {
  const [code, setCode] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setCode("");
      setText("");
      setSaving(false);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedCode = code.trim();
    const trimmedText = text.trim();

    if (!trimmedCode || !trimmedText) {
      setError("Please enter both a code and a standard.");
      return;
    }

    try {
      setSaving(true);
      await onSubmit({ code: trimmedCode, text: trimmedText });
      onClose();
    } catch (err) {
      console.error(err);
      setError("Could not save standard. Try again.");
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
        aria-label="Add Standard"
      >
        <div className="modal__header">
          <h3>Add Standard</h3>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          <label className="field">
            <span className="field__label">Code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., F.1a"
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field__label">Standard</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write the learning target..."
              rows={4}
            />
          </label>

          {error ? <div className="error">{error}</div> : null}

          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Standard"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}