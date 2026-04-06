import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const MappingPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [cos, setCos] = useState([]);
  const [pos, setPos] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [error, setError] = useState('');

  const loadBase = async () => {
    try {
      const [subjectRes, poRes] = await Promise.all([api.get('/subjects'), api.get('/program-outcomes')]);
      setSubjects(subjectRes.data);
      setPos(poRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load mapping data');
    }
  };

  useEffect(() => { loadBase(); }, []);

  useEffect(() => {
    const loadBySubject = async () => {
      if (!subjectId) {
        setCos([]);
        setMatrix(null);
        return;
      }
      try {
        const selected = subjects.find((s) => s._id === subjectId);
        const courseId = selected?.course?._id || selected?.course;
        const [coRes, matrixRes] = await Promise.all([
          api.get(`/course-outcomes?subjectId=${subjectId}`),
          api.get(`/mappings/matrix?subjectId=${subjectId}`)
        ]);
        let poCount = 0;
        if (courseId) {
          const poRes = await api.get(`/program-outcomes?courseId=${courseId}`);
          setPos(poRes.data);
          poCount = poRes.data.length;
        } else {
          poCount = matrixRes.data?.programOutcomes?.length || 0;
        }
        setCos(coRes.data);
        setMatrix(matrixRes.data);
        console.debug('Matrix loaded', {
          subjectId,
          courseOutcomes: coRes.data.length,
          programOutcomes: poCount,
          rows: matrixRes.data?.rows?.length || 0
        });
      } catch (err) {
        console.debug('Matrix load failed', err?.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load matrix');
      }
    };

    loadBySubject();
  }, [subjectId, subjects]);

  const saveLevel = async (coId, poId, level) => {
    try {
      const levelNum = Number(level);
      const payload = { courseOutcome: coId, programOutcome: poId, level: levelNum };
      await api.post('/mappings', payload);
      const matrixRes = await api.get(`/mappings/matrix?subjectId=${subjectId}`);
      setMatrix(matrixRes.data);
    } catch (err) {
      console.debug('Mapping save failed', err?.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to save mapping');
    }
  };

  const subjectOptions = useMemo(() => subjects.map((s) => ({ id: s._id, label: `${s.code} - ${s.name}` })), [subjects]);
  const matrixPos = matrix?.programOutcomes?.length ? matrix.programOutcomes : pos;

  return (
    <section>
      <h2>CO-PO Mapping</h2>
      {error && <p className="error">{error}</p>}
      <div className="card form-grid">
        <label className="form-field">
          <span>Select Subject</span>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select</option>
            {subjectOptions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {subjectId && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>CO / PO</th>
                {matrixPos.map((po) => <th key={po._id}>{po.code}</th>)}
              </tr>
            </thead>
            <tbody>
              {cos.map((co) => (
                <tr key={co._id}>
                  <td>{co.code}</td>
                  {matrixPos.map((po) => {
                    const row = matrix?.rows?.find((r) => String(r.coId) === String(co._id));
                    const currentRaw = row?.values?.[po.code];
                    const current = Number.isFinite(Number(currentRaw)) ? Number(currentRaw) : 0;
                    if (currentRaw === undefined && matrix?.rows?.length) {
                      console.debug('Missing mapping cell', {
                        coId: co._id,
                        poId: po._id,
                        poCode: po.code
                      });
                    }
                    return (
                      <td key={`${co._id}_${po._id}`}>
                        <select value={current} onChange={(e) => saveLevel(co._id, po._id, e.target.value)}>
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="subtle">Scale: 0-No mapping, 1-Low, 2-Medium, 3-High.</p>
        </div>
      )}
    </section>
  );
};

export default MappingPage;
