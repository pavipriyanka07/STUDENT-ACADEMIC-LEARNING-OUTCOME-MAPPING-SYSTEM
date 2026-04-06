import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import EntityForm from '../components/EntityForm';
import EntityTable from '../components/EntityTable';

const defaultForm = { course: '', name: '', code: '', semester: 1, credits: 3 };

const SubjectsPage = () => {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [courseRes, subjectRes] = await Promise.all([api.get('/courses'), api.get('/subjects')]);
      setCourses(courseRes.data);
      setSubjects(subjectRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (form) => {
    try {
      setError('');
      const payload = { ...form, semester: Number(form.semester), credits: Number(form.credits) };
      if (editItem) await api.put(`/subjects/${editItem._id}`, payload);
      else await api.post('/subjects', payload);
      setEditItem(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete subject and related data?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const courseOptions = useMemo(() => courses.map((c) => ({ label: `${c.code} - ${c.name}`, value: c._id })), [courses]);

  return (
    <section>
      <h2>Subject Management</h2>
      {error && <p className="error">{error}</p>}
      <EntityForm
        fields={[
          { name: 'course', label: 'Course', type: 'select', required: true, options: courseOptions },
          { name: 'name', label: 'Subject Name', required: true },
          { name: 'code', label: 'Subject Code', required: true },
          { name: 'semester', label: 'Semester', type: 'number', required: true, min: 1, max: 12 },
          { name: 'credits', label: 'Credits', type: 'number', required: true, min: 1, max: 10 }
        ]}
        initialValues={editItem ? { ...editItem, course: editItem.course?._id || editItem.course } : defaultForm}
        onSubmit={save}
        submitLabel={editItem ? 'Update Subject' : 'Add Subject'}
        onCancel={editItem ? () => setEditItem(null) : null}
      />
      <EntityTable
        columns={[
          { key: 'course', label: 'Course', render: (r) => `${r.course?.code || ''}` },
          { key: 'name', label: 'Name' },
          { key: 'code', label: 'Code' },
          { key: 'semester', label: 'Semester' },
          { key: 'credits', label: 'Credits' }
        ]}
        data={subjects}
        onEdit={setEditItem}
        onDelete={remove}
      />
    </section>
  );
};

export default SubjectsPage;
