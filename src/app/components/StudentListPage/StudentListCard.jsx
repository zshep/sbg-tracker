import { Link } from "react-router-dom";

export default function StudentListCard({ student, classId, className, period }) {
  return (
    <div
      className="student-list-card"
      style={{
        border: "1px solid rgba(0,0,0,0.1)",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800 }}>{student?.name ?? "Unnamed student"}</div>
          <div style={{ opacity: 0.75, fontSize: 13 }}>
            Class:{" "}
            <Link to={`/classes/${classId}`} style={{ fontWeight: 700 }}>
              {className ?? "View class"}
            </Link>
            {period ? ` • Period ${period}` : ""}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn small" to={`/classes/${classId}/studentpage/${student.id}`}>
            View
          </Link>
        </div>
      </div>
    </div>
  );
}