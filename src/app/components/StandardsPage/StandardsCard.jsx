import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";

export default function StandardsCard({ standard, onDelete }) {
  const navigate = useNavigate();
  const { id, code, text } = standard;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`standard-card ${isDragging ? "is-dragging" : ""}`}
    >
      <div className="standard-card__main">
        <button
          className="drag-handle"
          type="button"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ☰
        </button>

        <div className="standard-card__code">{code}</div>
        <div className="standard-card__text">{text}</div>
      </div>

      <div className="standard-card__actions">
        <button
          type="button"
          className="btn"
          onClick={() => navigate(`/standard/${id}`)}
        >
          View
        </button>

        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onDelete(id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}