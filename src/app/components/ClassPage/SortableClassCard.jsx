import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import ClassCard from "../Dashboard/ClassCard";

export default function SortableClassCard({ klass, onDelete }) {
  const navigate = useNavigate();
  const { id } = klass;

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
      className={`class-card ${isDragging ? "is-dragging" : ""}`}
    >
      {/* Left side: drag handle + your existing card content */}
      <div className="class-card__main">
        <button
          className="drag-handle"
          type="button"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ☰
        </button>

        {/* Render your existing ClassCard content, but prevent clicks while dragging */}
        <ClassCard
          klass={klass}
          onDelete={onDelete}
          disableActions={isDragging}
          onView={() => {
            if (isDragging) return;
            navigate(`/classes/${id}`);
          }}
        />
      </div>
    </div>
  );
}