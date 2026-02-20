import { Link } from "react-router-dom";

export function ClassCard({ uid, klass, onDelete }) {
  return (
    <div className="class-card">
      <div className="class-card-top">
        <div>
          <h4>{klass.className}</h4>
          <p>Period: {klass.classPeriod}</p>
        </div>

        <div className="class-card-actions">
          <Link to={`/teacher/${uid}/classes/${klass.id}/students`}>
            View class
          </Link>

          <button
            onClick={() => onDelete(klass)}
            className="danger"
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
