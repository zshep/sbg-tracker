function formatTypeLabel(type) {
  if (!type) return "Other";

  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function EvidenceCard({ evidence, onEdit, onDelete }) {
  return (
    <div className="evidence-card">
      <div>
        <div className="evidence-card__meta">
          <span className={`pill pill--${evidence.type || "other"}`}>
            {formatTypeLabel(evidence.type)}
          </span>
        </div>
        <div className="evidence-card__title">{evidence.title}</div>
      </div>

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