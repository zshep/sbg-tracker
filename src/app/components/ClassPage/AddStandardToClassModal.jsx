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
        <div className="modal__header">
          <h3 className="modal__title">Add Standard</h3>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          <div className="field">
            <div className="field__label">Select existing standard</div>

            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">-- choose one --</option>
              {standards.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} —{" "}
                  {s.text.length > 50 ? s.text.slice(0, 50) + "…" : s.text}
                </option>
              ))}
            </select>
          </div>

          <div className="modal__footer modal__footer--between">
            <button type="button" className="btn" onClick={onCreateNew}>
              Create New Standard
            </button>

            <div className="modal-actions-right">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!canSubmit}
              >
                Add
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
