import { Link } from "react-router-dom";

export default function StudentCard({ classId, student, onDelete, studentId }) {
  return (
    <div className="row-card">
      <div className="row-card__main">
        <h5 className="row-card__title">
          {student.name}
        </h5>
      </div>

      <div className="row-card__actions">
        <Link
          className="btn btn-sm"
          to={`/classes/${classId}/studentpage/${studentId}`}
        >
          View
        </Link>

        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={() => onDelete(student)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}