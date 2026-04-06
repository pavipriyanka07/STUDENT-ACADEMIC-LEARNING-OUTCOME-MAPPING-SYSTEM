const EntityTable = ({ columns, data, onEdit, onDelete }) => {
  const showActions = Boolean(onEdit || onDelete);
  return (
    <div className="card table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => <th key={c.key}>{c.label}</th>)}
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length + (showActions ? 1 : 0)}>No records found.</td></tr>
          ) : (
            data.map((item) => (
              <tr key={item._id}>
                {columns.map((c) => <td key={c.key}>{c.render ? c.render(item) : item[c.key]}</td>)}
                {showActions && (
                  <td className="row gap-sm">
                    {onEdit && <button className="btn btn-small" onClick={() => onEdit(item)}>Edit</button>}
                    {onDelete && <button className="btn btn-danger btn-small" onClick={() => onDelete(item._id)}>Delete</button>}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EntityTable;
