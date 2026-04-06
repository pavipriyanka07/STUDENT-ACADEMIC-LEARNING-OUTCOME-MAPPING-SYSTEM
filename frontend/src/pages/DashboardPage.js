import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';

const StatCard = ({ title, value, subtitle, tone = 'default' }) => (
  <div className={`card metric-card metric-${tone}`}>
    <p className="metric-title">{title}</p>
    <h3 className="metric-value">{value}</h3>
    {subtitle && <p className="subtle">{subtitle}</p>}
  </div>
);

const LevelBadge = ({ label }) => (
  <span className={`level-badge level-${label?.toLowerCase() || 'low'}`}>{label}</span>
);

const PercentageBars = ({ title, rows, codeKey = 'code', valueKey = 'attainmentPercentage', levelKey = 'levelLabel' }) => (
  <div className="card">
    <h3>{title}</h3>
    {rows.length === 0 ? (
      <p className="subtle">No data available.</p>
    ) : (
      <div className="bar-list">
        {rows.map((item) => (
          <div className="bar-item" key={item[codeKey]}>
            <div className="bar-meta">
              <strong>{item[codeKey]}</strong>
              <span>{item[valueKey].toFixed(2)}%</span>
              <LevelBadge label={item[levelKey]} />
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, item[valueKey]))}%` }} />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const DashboardPage = () => {
  const admin = localStorage.getItem('admin') || 'Admin';
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/summary');
        setSummary(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard summary');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return <div className="card"><p>Loading dashboard...</p></div>;
  if (error) return <div className="card"><p className="error">{error}</p></div>;

  return (
    <section>
      <div className="card">
        <h1>Welcome, {admin}</h1>
        <p className="subtle">Dashboard shows CO attainment %, PO attainment %, achievement levels, and mapping summary for quick outcome analysis.</p>
      </div>

      <div className="metrics-grid">
        <StatCard
          title="CO Attainment %"
          value={`${summary?.overall?.coAttainmentPercentage?.toFixed(2) || '0.00'}%`}
          subtitle={<LevelBadge label={summary?.overall?.coLevel || 'Low'} />}
          tone="co"
        />
        <StatCard
          title="PO Attainment %"
          value={`${summary?.overall?.poAttainmentPercentage?.toFixed(2) || '0.00'}%`}
          subtitle={<LevelBadge label={summary?.overall?.poLevel || 'Low'} />}
          tone="po"
        />
        <StatCard
          title="Mapping Coverage"
          value={`${summary?.totals?.mappingCoveragePercentage?.toFixed(2) || '0.00'}%`}
          subtitle={`${summary?.totals?.mappings || 0} / ${summary?.totals?.totalCoPoPairs || 0} mapped`}
          tone="map"
        />
      </div>

      <div className="metrics-grid">
        <StatCard title="Courses" value={summary?.totals?.courses || 0} />
        <StatCard title="Subjects" value={summary?.totals?.subjects || 0} />
        <StatCard title="COs" value={summary?.totals?.courseOutcomes || 0} />
        <StatCard title="POs" value={summary?.totals?.programOutcomes || 0} />
      </div>

      <div className="grid-2">
        <PercentageBars title="CO Attainment Levels" rows={summary?.coStats || []} />
        <PercentageBars title="PO Attainment Levels" rows={summary?.poStats || []} />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>CO Achievement Chart</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={summary?.coStats || []}>
                <XAxis dataKey="code" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attainmentPercentage" fill="#1d7bb8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3>PO Achievement Chart</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={summary?.poStats || []}>
                <XAxis dataKey="code" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="attainmentPercentage" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Course Performance</h3>
        {summary?.coursePerformance?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Average CO Attainment %</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>
                {summary.coursePerformance.map((course) => (
                  <tr key={course.courseId}>
                    <td>{course.courseCode}</td>
                    <td>{course.averageCoAttainment.toFixed(2)}%</td>
                    <td>{course.levelLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="subtle">No course performance data available.</p>
        )}
      </div>
    </section>
  );
};

export default DashboardPage;
