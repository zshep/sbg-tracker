import { Link } from "react-router-dom";

export default function StudentCard({ classId, student, onDelete }) {
  return (
    <div className="student-card">
      <div className="student-card-top">
        <div>
          <h5 className="student-name">{student.name}</h5>
        </div>

        <div className="student-card-actions">
          <Link className="btn small" to={`/classes/${classId}/students`}>
            View student
          </Link>

          <button
            type="button"
            className="btn small danger"
            onClick={() => onDelete(student)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}