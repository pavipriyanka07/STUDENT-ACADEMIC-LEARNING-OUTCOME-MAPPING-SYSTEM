import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import EntityTable from '../components/EntityTable';

const MarksPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [courseOutcomes, setCourseOutcomes] = useState([]);
  const [form, setForm] = useState({ studentId: '', subject: '', courseOutcome: '', marks: '', maxMarks: '' });
  const [marks, setMarks] = useState([]);
  const [error, setError] = useState('');

  const loadBase = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subjects');
    }
  };

  const loadMarks = async (subjectFilter) => {
    try {
      const url = subjectFilter ? `/marks?subjectId=${subjectFilter}` : '/marks';
      const res = await api.get(url);
      setMarks(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load marks');
    }
  };

  useEffect(() => {
    loadBase();
    loadMarks();
  }, []);

  useEffect(() => {
    const loadOutcomes = async () => {
      if (!subjectId) {
        setCourseOutcomes([]);
        setForm((prev) => ({ ...prev, subject: '', courseOutcome: '' }));
        return;
      }
      try {
        const res = await api.get(`/course-outcomes?subjectId=${subjectId}`);
        setCourseOutcomes(res.data);
        setForm((prev) => ({ ...prev, subject: subjectId, courseOutcome: '' }));
        loadMarks(subjectId);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load course outcomes');
      }
    };

    loadOutcomes();
  }, [subjectId]);

  const subjectOptions = useMemo(
    () => subjects.map((s) => ({ id: s._id, label: `${s.code} - ${s.name}` })),
    [subjects]
  );

  const coOptions = useMemo(
    () => courseOutcomes.map((co) => ({ id: co._id, label: `${co.code} - ${co.description}` })),
    [courseOutcomes]
  );

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.post('/marks', {
        studentId: form.studentId,
        subject: form.subject,
        courseOutcome: form.courseOutcome,
        marks: Number(form.marks),
        maxMarks: Number(form.maxMarks)
      });
      setForm({ studentId: '', subject: subjectId || '', courseOutcome: '', marks: '', maxMarks: '' });
      loadMarks(subjectId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save marks');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete mark entry?')) return;
    try {
      await api.delete(`/marks/${id}`);
      loadMarks(subjectId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete mark');
    }
  };

  return (
    <section>
      <h2>Student Marks Entry</h2>
      {error && <p className="error">{error}</p>}

      <div className="card form-grid">
        <label className="form-field">
          <span>Filter Subject</span>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">All Subjects</option>
            {subjectOptions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <form className="card form-grid" onSubmit={submit}>
        <label className="form-field">
          <span>Student ID</span>
          <input value={form.studentId} onChange={(e) => handleChange('studentId', e.target.value)} required />
        </label>
        <label className="form-field">
          <span>Subject</span>
          <select
            value={form.subject}
            onChange={(e) => {
              handleChange('subject', e.target.value);
              setSubjectId(e.target.value);
            }}
            required
          >
            <option value="">Select</option>
            {subjectOptions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Course Outcome</span>
          <select value={form.courseOutcome} onChange={(e) => handleChange('courseOutcome', e.target.value)} required>
            <option value="">Select</option>
            {coOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Marks</span>
          <input type="number" min="0" value={form.marks} onChange={(e) => handleChange('marks', e.target.value)} required />
        </label>
        <label className="form-field">
          <span>Max Marks</span>
          <input type="number" min="1" value={form.maxMarks} onChange={(e) => handleChange('maxMarks', e.target.value)} required />
        </label>
        <div className="row gap-sm">
          <button className="btn" type="submit">Save Marks</button>
        </div>
      </form>

      <EntityTable
        columns={[
          { key: 'studentId', label: 'Student ID' },
          { key: 'subject', label: 'Subject', render: (r) => r.subject?.code || '' },
          { key: 'courseOutcome', label: 'CO', render: (r) => r.courseOutcome?.code || '' },
          { key: 'marks', label: 'Marks' },
          { key: 'maxMarks', label: 'Max Marks' }
        ]}
        data={marks}
        onDelete={remove}
      />
    </section>
  );
};

export default MarksPage;
