export default function ClassStandardRow({ standard, onRemove }) {
  return (
    <div className="standard-row">
      <div>
        <div className="standard-row__code">{standard.code}</div>
        <div className="standard-row__text">{standard.text}</div>
      </div>

      <div className="standard-row__actions">
        <button type="button" className="btn btn-danger" onClick={() => onRemove(standard)} >
          Remove
        </button>
      </div>
    </div>
  );
}