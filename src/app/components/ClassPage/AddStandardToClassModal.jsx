import { useState, useEffect } from "react";

export default function AddStandardToClassModal({ open, onClose, standards, onLink }) {
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!open) setSelectedId("");
  }, [open]);

  if (!open) return null;

  const canSubmit = !!selectedId;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onLink(selectedId);
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3>Add Standard to Class</h3>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Select standard
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">-- choose one --</option>
              {standards.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.text.length > 50 ? s.text.slice(0, 50) + "…" : s.text}
                </option>
              ))}
            </select>
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