import { useEffect, useState } from 'react';
import api from '../services/api';
import EntityTable from '../components/EntityTable';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

const downloadExcel = (data, sheetName, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
};

const downloadPdf = (title, data, fileName) => {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 18);

  let y = 28;
  data.slice(0, 35).forEach((row) => {
    const line = Object.values(row).join(' | ').slice(0, 120);
    doc.setFontSize(9);
    doc.text(line, 14, y);
    y += 6;
  });

  doc.save(fileName);
};

const ReportsPage = () => {
  const [report, setReport] = useState({ coReport: [], poReport: [], subjectReport: [] });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/reports');
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <section>
      <h2>Reports</h2>
      {report.generatedAt && <p className="subtle">Generated at {new Date(report.generatedAt).toLocaleString()}</p>}
      {error && <p className="error">{error}</p>}

      <div className="report-header">
        <h3>CO Attainment Report</h3>
        <div className="row gap-sm">
          <button className="btn btn-small" onClick={() => downloadExcel(report.coReport, 'CO Report', 'co-attainment.xlsx')}>Export Excel</button>
          <button className="btn btn-muted btn-small" onClick={() => downloadPdf('CO Attainment Report', report.coReport, 'co-attainment.pdf')}>Export PDF</button>
        </div>
      </div>
      <EntityTable
        columns={[
          { key: 'coCode', label: 'CO' },
          { key: 'subjectCode', label: 'Subject' },
          { key: 'courseCode', label: 'Course' },
          { key: 'attainmentPercentage', label: 'Attainment %' },
          { key: 'levelLabel', label: 'Level' }
        ]}
        data={report.coReport}
      />

      <div className="report-header">
        <h3>PO Attainment Report</h3>
        <div className="row gap-sm">
          <button className="btn btn-small" onClick={() => downloadExcel(report.poReport, 'PO Report', 'po-attainment.xlsx')}>Export Excel</button>
          <button className="btn btn-muted btn-small" onClick={() => downloadPdf('PO Attainment Report', report.poReport, 'po-attainment.pdf')}>Export PDF</button>
        </div>
      </div>
      <EntityTable
        columns={[
          { key: 'poCode', label: 'PO' },
          { key: 'courseCode', label: 'Course' },
          { key: 'attainmentPercentage', label: 'Attainment %' },
          { key: 'levelLabel', label: 'Level' }
        ]}
        data={report.poReport}
      />

      <div className="report-header">
        <h3>Subject Performance Report</h3>
        <div className="row gap-sm">
          <button className="btn btn-small" onClick={() => downloadExcel(report.subjectReport, 'Subject Report', 'subject-performance.xlsx')}>Export Excel</button>
          <button className="btn btn-muted btn-small" onClick={() => downloadPdf('Subject Performance Report', report.subjectReport, 'subject-performance.pdf')}>Export PDF</button>
        </div>
      </div>
      <EntityTable
        columns={[
          { key: 'subjectCode', label: 'Subject' },
          { key: 'courseCode', label: 'Course' },
          { key: 'averageCoAttainment', label: 'Avg CO %' },
          { key: 'levelLabel', label: 'Level' }
        ]}
        data={report.subjectReport}
      />
    </section>
  );
};

export default ReportsPage;
