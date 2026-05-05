import React, { useState } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  LayoutDashboard, FilePlus, UploadCloud, ShieldCheck,
  GraduationCap, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'single',   label: 'Issue Certificate', icon: FilePlus },
  { id: 'bulk',     label: 'Bulk Upload (CSV)', icon: UploadCloud },
];

const StatCard = ({ title, value, icon: Icon, color, sub }) => (
  <div className="stat-card" style={{ '--stat-color': color }}>
    <div className="flex justify-between items-start mb-3">
      <div>
        <p className="text-sm text-secondary mb-1">{title}</p>
        <p style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{value}</p>
      </div>
      <div style={{ padding: '0.6rem', borderRadius: 10, background: `${color}18`, color }}>
        <Icon size={20} />
      </div>
    </div>
    {sub && <p className="text-xs text-muted">{sub}</p>}
  </div>
);

const UniversityDashboard = () => {
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [singleData, setSingleData] = useState({
    studentName: '', rollNumber: '', registerNumber: '', schoolName: '', graduationYear: '', totalMarks: '', certificateId: ''
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      await axios.post('http://localhost:5000/api/institutions/upload-single', singleData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Certificate recorded on VERI-CHAIN!');
      setSingleData({ studentName: '', rollNumber: '', registerNumber: '', schoolName: '', graduationYear: '', totalMarks: '', certificateId: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a CSV file');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post('http://localhost:5000/api/institutions/upload-records', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || 'Bulk upload complete!');
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk upload failed');
    } finally {
      setUploading(false);
    }
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div className="form-group" style={{ marginBottom: '1rem' }}>
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-input"
        placeholder={placeholder}
        required
        value={singleData[key]}
        onChange={(e) => setSingleData({ ...singleData, [key]: e.target.value })}
      />
    </div>
  );

  const Sidebar = (
    <>
      <div className="sidebar-header">
        <span className="sidebar-badge university"><ShieldCheck size={12} /> Verified Institution</span>
        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.name || 'University Portal'}</p>
        <p className="text-xs text-muted mt-1">{user?.email}</p>
      </div>

      <div className="sidebar-nav">
        <p className="sidebar-section-title">Navigation</p>
        {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`sidebar-nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-glass)', marginTop: 'auto' }}>
        <div className="glass-panel p-3" style={{ borderRadius: 10 }}>
          <p className="text-xs text-secondary mb-1">Need help?</p>
          <p className="text-xs text-muted">Check the CSV template format before bulk uploads.</p>
        </div>
      </div>
    </>
  );

  return (
    <DashboardLayout sidebar={Sidebar}>
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          <div className="page-header">
            <div>
              <h1>Board Portal</h1>
              <p>Welcome back, {user?.name}. Manage board exam records.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setActiveTab('single')}>
              <FilePlus size={16} /> Issue Certificate
            </button>
          </div>

          <div className="grid grid-cols-3 gap-5 mb-8">
            <StatCard title="Total Issued" value="1,248" icon={GraduationCap} color="#00f0ff" sub="All-time certificates" />
            <StatCard title="This Month" value="84" icon={CheckCircle2} color="#10b981" sub="Issued in March 2025" />
            <StatCard title="Pending Review" value="3" icon={Clock} color="#f59e0b" sub="Awaiting confirmation" />
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} style={{ color: 'var(--accent-primary)' }} /> Recent Issuances
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    {['Student', 'Roll No.', 'School', 'Year', 'Total Marks', 'Status'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'THIRUVARASAN R K', roll: '6150916', school: 'C E O A MATRIC. HR. SEC. SCHOOL', year: 2024, marks: '589', status: 'Recorded' },
                    { name: 'ARUN KUMAR S', roll: '6150917', school: 'C E O A MATRIC. HR. SEC. SCHOOL', year: 2024, marks: '545', status: 'Recorded' },
                    { name: 'RAHUL MENON',  roll: '882910', school: 'Govt Model Boys HSS', year: 2024, marks: '1180', status: 'Recorded' },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 500 }}>{r.name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{r.roll}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{r.school}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{r.year}</td>
                      <td style={{ padding: '0.75rem' }}>{r.marks}</td>
                      <td style={{ padding: '0.75rem' }}><span className="badge badge-success">{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Single Issue Tab */}
      {activeTab === 'single' && (
        <div className="animate-fade-in">
          <div className="page-header">
            <div>
              <h1>Issue Certificate</h1>
              <p>Record a single student's certificate on the chain.</p>
            </div>
          </div>

          <div className="glass-card p-8" style={{ maxWidth: 700 }}>
            <form onSubmit={handleSingleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                {field('Student Full Name', 'studentName', 'text', 'e.g. THIRUVARASAN R K')}
                {field('Examination Roll No.', 'rollNumber', 'text', 'e.g. 6150916')}
                {field('Permanent Register No.', 'registerNumber', 'text', 'e.g. 2313150825')}
                {field('School Name', 'schoolName', 'text', 'e.g. C E O A MATRIC. HR. SEC. SCHOOL')}
                {field('Year of Passing', 'graduationYear', 'number', '2024')}
                {field('Total Marks Obtained', 'totalMarks', 'number', 'e.g. 589')}
                {field('Certificate Serial No.', 'certificateId', 'text', 'e.g. 35141174')}
              </div>

              <div style={{ height: '1px', background: 'var(--border-glass)', margin: '1.5rem 0' }} />
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Recording...' : <><ShieldCheck size={16} /> Record on VERI-CHAIN</>}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() =>
                  setSingleData({ studentName: '', rollNumber: '', registerNumber: '', schoolName: '', graduationYear: '', totalMarks: '', certificateId: '' })
                }>
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Tab */}
      {activeTab === 'bulk' && (
        <div className="animate-fade-in">
          <div className="page-header">
            <div>
              <h1>Bulk Upload</h1>
              <p>Upload a CSV file to record multiple certificates at once.</p>
            </div>
          </div>

          <div className="glass-card p-8" style={{ maxWidth: 600 }}>
            <form onSubmit={handleBulkSubmit}>
              <input type="file" accept=".csv" id="csv-upload" className="hidden"
                onChange={(e) => setFile(e.target.files[0])} />
              <label htmlFor="csv-upload" className="upload-zone" style={{ display: 'block', cursor: 'pointer', marginBottom: '1.5rem' }}>
                <UploadCloud size={44} style={{ color: 'var(--accent-primary)', margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.4rem' }}>
                  {file ? file.name : 'Click to select CSV file'}
                </h3>
                <p className="text-sm text-muted">Required columns: studentName, rollNumber, registerNumber, schoolName, graduationYear, totalMarks, certificateId</p>
              </label>

              <div className="glass-panel p-4 mb-6" style={{ borderRadius: 10 }}>
                <p className="text-xs text-secondary mb-2" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CSV Format Example</p>
                <code style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontFamily: 'monospace', display: 'block', lineHeight: 1.8 }}>
                  studentName,rollNumber,registerNumber,schoolName,graduationYear,totalMarks,certificateId<br/>
                  John Doe,6150916,2313150825,C E O A SCHOOL,2024,589,35141174
                </code>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={uploading || !file}>
                {uploading ? 'Processing...' : <><UploadCloud size={16} /> Upload & Record Batch</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default UniversityDashboard;
