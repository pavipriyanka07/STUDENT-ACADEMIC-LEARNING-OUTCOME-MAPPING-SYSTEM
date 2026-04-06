import { useEffect, useState } from 'react';
import api from '../services/api';
import EntityForm from '../components/EntityForm';
import EntityTable from '../components/EntityTable';

const defaultForm = { name: '', code: '', department: '', duration: 4, description: '' };

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (form) => {
    try {
      setError('');
      const payload = { ...form, duration: Number(form.duration) };
      if (editItem) await api.put(`/courses/${editItem._id}`, payload);
      else await api.post('/courses', payload);
      setEditItem(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete course and related data?')) return;
    try {
      await api.delete(`/courses/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <section>
      <h2>Course Management</h2>
      {error && <p className="error">{error}</p>}
      <EntityForm
        fields={[
          { name: 'name', label: 'Course Name', required: true },
          { name: 'code', label: 'Course Code', required: true },
          { name: 'department', label: 'Department', required: true },
          { name: 'duration', label: 'Program Duration (Years)', type: 'number', required: true, min: 1, max: 10 },
          { name: 'description', label: 'Description' }
        ]}
        initialValues={editItem || defaultForm}
        onSubmit={save}
        submitLabel={editItem ? 'Update Course' : 'Add Course'}
        onCancel={editItem ? () => setEditItem(null) : null}
      />
      <EntityTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'code', label: 'Code' },
          { key: 'department', label: 'Department' },
          { key: 'duration', label: 'Duration' },
          { key: 'description', label: 'Description' }
        ]}
        data={courses}
        onEdit={setEditItem}
        onDelete={remove}
      />
    </section>
  );
};

export default CoursesPage;
