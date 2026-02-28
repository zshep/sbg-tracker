import { Link } from "react-router-dom";

export default function StudentCard({ classId, student, onDelete, studentId }) {
  return (
    <div className="student-card">
      <div className="student-card-top">
        <div>
          <h5 className="student-name">{student.name}</h5>
        </div>

        <div className="student-card-actions">
          <Link
            className="btn btn-sm"
            to={`/classes/${classId}/studentpage/${studentId}`}
          >
            View student
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
    </div>
  );
}
