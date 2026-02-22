import React from "react";

export default function StandardsCard({ standard, onDelete }) {
  const { id, code, text } = standard;

  return (
    <div className="standard-card">
      <div className="standard-card__main">
        <div className="standard-card__code">{code}</div>
        <div className="standard-card__text">{text}</div>
      </div>

      <div className="standard-card__actions">
        <button className="btn btn-danger" onClick={() => onDelete(id)}>
          Delete
        </button>
      </div>
    </div>
  );
}