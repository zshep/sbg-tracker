import { useNavigate } from "react-router-dom";

export default function ClassStandardRow({ standard, onRemove, classId }) {
  const navigate = useNavigate();

  return (
    <div className="row-card">
      <div className="row-card__main">
        <div className="row-card__title">
          {standard.code}
        </div>
        <div className="row-card__subtitle">
          {standard.text}
        </div>
      </div>

      <div className="row-card__actions">
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => navigate(`/class/${classId}/standard/${standard.id}`)}
        >
          Score
        </button>

        <button
          type="button"
          className="btn btn-sm"
          onClick={() => navigate(`/standard/${standard.id}`)}
        >
          View
        </button>

        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={() => onRemove(standard)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}