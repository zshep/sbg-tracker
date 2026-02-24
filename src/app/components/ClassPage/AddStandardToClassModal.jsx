import { useState, useEffect } from "react";

export default function AddStandardToClassModal({
  open,
  onClose,
  standards,
  onLink,
  onCreateNew,
}) {
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
        <h3>Add Standard</h3>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Select existing standard
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">-- choose one --</option>
              {standards.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.text.length > 50 ? s.text.slice(0, 50) + "…" : s.text}
                </option>
              ))}
            </select>
          </label>

          <div className="modal-actions" style={{ justifyContent: "space-between" }}>
            <button type="button" className="btn" onClick={onCreateNew}>
              Create New Standard
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
                Add
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}