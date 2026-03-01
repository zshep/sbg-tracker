import { Link } from "react-router-dom";

export default function StudentListCard({ student, classId, className, period }) {
  return (
    <div className="student-list-card">
      <div className="student-list-card__row">
        <div className="student-list-card__main">
          <div className="student-list-card__name">
            {student?.name ?? "Unnamed student"}
          </div>

          <div className="student-list-card__meta">
            Class:{" "}
            <Link to={`/classes/${classId}`} className="student-list-card__classLink">
              {className ?? "View class"}
            </Link>
            {period ? ` • Period ${period}` : ""}
          </div>
        </div>

        <div className="student-list-card__actions">
          <Link className="btn btn-sm" to={`/classes/${classId}/studentpage/${student.id}`}>
            View
          </Link>
        </div>
      </div>
    </div>
  );
}