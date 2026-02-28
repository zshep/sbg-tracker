import { Link } from "react-router-dom";

export default function ClassCard({ klass, onDelete }) {
  return (
    <div className="class-card">
      <div className="class-card-top">
        <div className="class-card-main">
          <h4 className="class-card-title">{klass.className}</h4>
          <p className="class-card-subtitle">Period: {klass.classPeriod}</p>
        </div>

        <div className="class-card-actions">
          <Link className="btn" to={`/class/${klass.id}`}>
            View class
          </Link>

          <button
            onClick={() => onDelete(klass)}
            className="btn btn-danger"
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}