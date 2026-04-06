import { useEffect, useState } from 'react';

const EntityForm = ({ fields, onSubmit, initialValues, submitLabel = 'Save', onCancel }) => {
  const [form, setForm] = useState(initialValues || {});

  useEffect(() => {
    setForm(initialValues || {});
  }, [initialValues]);

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <label key={field.name} className="form-field">
          <span>{field.label}</span>
          {field.type === 'select' ? (
            <select value={form[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} required={field.required}>
              <option value="">Select</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type || 'text'}
              value={form[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              min={field.min}
              max={field.max}
            />
          )}
        </label>
      ))}
      <div className="row gap-sm">
        <button className="btn" type="submit">{submitLabel}</button>
        {onCancel && <button className="btn btn-muted" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
};

export default EntityForm;
