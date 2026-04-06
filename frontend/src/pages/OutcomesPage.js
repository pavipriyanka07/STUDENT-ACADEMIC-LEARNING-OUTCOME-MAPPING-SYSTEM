import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import EntityForm from '../components/EntityForm';
import EntityTable from '../components/EntityTable';

const OutcomesPage = () => {
  const role = localStorage.getItem('role') || 'Admin';
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [cos, setCos] = useState([]);
  const [pos, setPos] = useState([]);
  const [coEdit, setCoEdit] = useState(null);
  const [poEdit, setPoEdit] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const baseRequests = [
        api.get('/subjects'),
        api.get('/course-outcomes')
      ];
      if (role === 'Admin') {
        baseRequests.push(api.get('/program-outcomes'));
        baseRequests.push(api.get('/courses'));
      } else {
        baseRequests.push(Promise.resolve({ data: [] }));
        baseRequests.push(Promise.resolve({ data: [] }));
      }

      const [subjectRes, coRes, poRes, courseRes] = await Promise.all(baseRequests);
      setSubjects(subjectRes.data);
      setCos(coRes.data);
      setPos(poRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load outcomes');
    }
  };

  useEffect(() => { load(); }, []);

  const subjectOptions = useMemo(() => subjects.map((s) => ({ label: `${s.code} - ${s.name}`, value: s._id })), [subjects]);
  const courseOptions = useMemo(() => courses.map((c) => ({ label: `${c.code} - ${c.name}`, value: c._id })), [courses]);

  const saveCO = async (form) => {
    try {
      const payload = {
        ...form,
        targetPercentage: Number(form.targetPercentage || 0),
        totalStudents: Number(form.totalStudents || 0),
        studentsAchievedTarget: Number(form.studentsAchievedTarget || 0)
      };
      if (payload.studentsAchievedTarget > payload.totalStudents) {
        setError('Students achieved target cannot exceed total students');
        return;
      }
      if (coEdit) await api.put(`/course-outcomes/${coEdit._id}`, payload);
      else await api.post('/course-outcomes', payload);
      setCoEdit(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'CO save failed');
    }
  };

  const savePO = async (form) => {
    try {
      if (poEdit) await api.put(`/program-outcomes/${poEdit._id}`, form);
      else await api.post('/program-outcomes', form);
      setPoEdit(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'PO save failed');
    }
  };

  return (
    <section>
      <h2>Outcome Management</h2>
      {error && <p className="error">{error}</p>}
      <div className="grid-2">
        <div>
          <h3>Course Outcomes (CO)</h3>
          <EntityForm
            fields={[
              { name: 'subject', label: 'Subject', type: 'select', required: true, options: subjectOptions },
              { name: 'code', label: 'CO Code', required: true },
              { name: 'description', label: 'Description', required: true },
              { name: 'targetPercentage', label: 'Target %', type: 'number', min: 1, max: 100, required: true },
              { name: 'totalStudents', label: 'Final Exam Total Students', type: 'number', min: 0, required: true },
              { name: 'studentsAchievedTarget', label: 'Students Achieved Target', type: 'number', min: 0, required: true }
            ]}
            initialValues={coEdit ? { ...coEdit, subject: coEdit.subject?._id || coEdit.subject } : { subject: '', code: '', description: '', targetPercentage: 50, totalStudents: 0, studentsAchievedTarget: 0 }}
            onSubmit={saveCO}
            submitLabel={coEdit ? 'Update CO' : 'Add CO'}
            onCancel={coEdit ? () => setCoEdit(null) : null}
          />
          <EntityTable
            columns={[
              { key: 'code', label: 'Code' },
              { key: 'subject', label: 'Subject', render: (r) => r.subject?.code || '' },
              { key: 'description', label: 'Description' },
              { key: 'targetPercentage', label: 'Target %', render: (r) => `${r.targetPercentage || 0}%` },
              { key: 'totalStudents', label: 'Total Students' },
              { key: 'studentsAchievedTarget', label: 'Achieved Target' },
              {
                key: 'coAttainmentPercentage',
                label: 'CO Attainment %',
                render: (r) => `${((Number(r.studentsAchievedTarget || 0) / (Number(r.totalStudents || 0) || 1)) * 100).toFixed(2)}%`
              }
            ]}
            data={cos}
            onEdit={setCoEdit}
            onDelete={async (id) => { await api.delete(`/course-outcomes/${id}`); load(); }}
          />
        </div>

        {role === 'Admin' && (
          <div>
          <h3>Program Outcomes (PO)</h3>
          <EntityForm
            fields={[
              { name: 'code', label: 'PO Code', required: true },
              { name: 'description', label: 'Description', required: true },
              { name: 'course', label: 'Course', type: 'select', required: true, options: courseOptions }
            ]}
            initialValues={poEdit ? { ...poEdit, course: poEdit.course?._id || poEdit.course } : { code: '', description: '', course: '' }}
            onSubmit={savePO}
            submitLabel={poEdit ? 'Update PO' : 'Add PO'}
            onCancel={poEdit ? () => setPoEdit(null) : null}
          />
          <EntityTable
            columns={[
              { key: 'code', label: 'Code' },
              { key: 'description', label: 'Description' },
              { key: 'course', label: 'Course', render: (r) => r.course?.code || '' }
            ]}
            data={pos}
            onEdit={setPoEdit}
            onDelete={async (id) => { await api.delete(`/program-outcomes/${id}`); load(); }}
          />
        </div>
        )}
      </div>
    </section>
  );
};

export default OutcomesPage;
