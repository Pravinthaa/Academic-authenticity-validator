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
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '24px',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
      <div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', letterSpacing: '0.5px' }}>{title}</p>
        <p style={{ fontSize: '28px', fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif' }}>{value}</p>
      </div>
      <div style={{
        padding: '12px',
        borderRadius: '12px',
        background: `${color}20`,
        color: color
      }}>
        <Icon size={20} />
      </div>
    </div>
    {sub && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{sub}</p>}
  </div>
);

const UniversityDashboard = () => {
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [singleData, setSingleData] = useState({
    studentName: '', rollNumber: '', course: '', graduationYear: '', grade: '', certificateId: ''
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
      setSingleData({ studentName: '', rollNumber: '', course: '', graduationYear: '', grade: '', certificateId: '' });
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
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        marginBottom: '6px',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '0.3px'
      }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        required
        value={singleData[key]}
        onChange={(e) => setSingleData({ ...singleData, [key]: e.target.value })}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          transition: 'all 0.3s ease',
          outline: 'none'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#f97316';
          e.target.style.boxShadow = '0 0 0 2px rgba(249, 115, 22, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255,255,255,0.1)';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );

  const Sidebar = (
    <>
      <div style={{
        padding: '0 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '16px'
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 600,
          border: '1px solid rgba(249, 115, 22, 0.3)',
          background: 'rgba(249, 115, 22, 0.08)',
          color: '#f97316',
          marginBottom: '8px'
        }}>
          <ShieldCheck size={12} /> Verified Institution
        </span>
        <p style={{ fontWeight: 600, fontSize: '15px', color: '#fff', marginBottom: '4px' }}>{user?.name || 'University Portal'}</p>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{user?.email}</p>
      </div>

      <div style={{ padding: '0 12px' }}>
        <p style={{
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'rgba(255,255,255,0.4)',
          padding: '12px 14px 4px'
        }}>Navigation</p>
        {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '8px',
              color: activeTab === id ? '#f97316' : 'rgba(255,255,255,0.6)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: 'none',
              background: activeTab === id ? 'rgba(249, 115, 22, 0.08)' : 'transparent',
              width: '100%',
              textAlign: 'left',
              marginBottom: '4px',
              border: activeTab === id ? '1px solid rgba(249, 115, 22, 0.2)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== id) {
                e.target.style.background = 'rgba(255,255,255,0.05)';
                e.target.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== id) {
                e.target.style.background = 'transparent';
                e.target.style.color = 'rgba(255,255,255,0.6)';
              }
            }}
          >
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>

      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        marginTop: 'auto'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '12px'
        }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Need help?</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Check the CSV template format before bulk uploads.</p>
        </div>
      </div>
    </>
  );

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#07070d',
      color: '#fff',
      fontFamily: 'Inter, sans-serif'
    }}>
      <aside style={{
        width: '280px',
        background: 'rgba(7,7,13,0.9)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto'
      }}>
        {Sidebar}
      </aside>

      <main style={{
        flex: 1,
        padding: '32px 40px',
        overflowY: 'auto'
      }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px',
              paddingBottom: '24px',
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>University Portal</h1>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.6)',
                  margin: 0
                }}>Welcome back, {user?.name}. Manage your graduate records.</p>
              </div>
              <button
                onClick={() => setActiveTab('single')}
                style={{
                  background: '#f97316',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 24px',
                  fontSize: '13px',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.target.style.opacity = 0.85}
                onMouseLeave={(e) => e.target.style.opacity = 1}
              >
                <FilePlus size={16} /> Issue Certificate
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              marginBottom: '32px'
            }}>
              <StatCard title="Total Issued" value="1,248" icon={GraduationCap} color="#f97316" sub="All-time certificates" />
              <StatCard title="This Month" value="84" icon={CheckCircle2} color="#10b981" sub="Issued in March 2025" />
              <StatCard title="Pending Review" value="3" icon={Clock} color="#f59e0b" sub="Awaiting confirmation" />
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#fff'
              }}>
                <Clock size={18} style={{ color: '#f97316' }} /> Recent Issuances
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                  color: '#fff'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Student', 'Roll No.', 'Course', 'Year', 'Grade', 'Status'].map(h => (
                        <th key={h} style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          color: 'rgba(255,255,255,0.5)',
                          fontWeight: 600,
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Anya Sharma', roll: 'CS22-001', course: 'B.Sc CS', year: 2024, grade: '9.2', status: 'Recorded' },
                    { name: 'Rohan Mehta', roll: 'EC22-014', course: 'B.E EEE', year: 2024, grade: '8.7', status: 'Recorded' },
                    { name: 'Priya Nair',  roll: 'ME22-031', course: 'B.E Mech', year: 2024, grade: '7.9', status: 'Recorded' },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: '#fff' }}>{r.name}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)' }}>{r.roll}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)' }}>{r.course}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)' }}>{r.year}</td>
                      <td style={{ padding: '12px 16px', color: '#fff' }}>{r.grade}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>{r.status}</span>
                      </td>
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
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>Issue Certificate</h1>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                margin: 0
              }}>Record a single student's certificate on the chain.</p>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '700px'
          }}>
            <form onSubmit={handleSingleSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                {field('Student Full Name', 'studentName', 'text', 'e.g. Rahul Kumar')}
                {field('Roll / Registration No.', 'rollNumber', 'text', 'e.g. CS2024-019')}
                {field('Course / Degree', 'course', 'text', 'e.g. B.Sc Computer Science')}
                {field('Graduation Year', 'graduationYear', 'number', '2024')}
                {field('Grade / CGPA', 'grade', 'text', 'e.g. 8.5 / A+')}
                {field('Certificate Unique ID', 'certificateId', 'text', 'e.g. CERT-2024-CS-001')}
              </div>

              <div style={{
                height: '1px',
                background: 'rgba(255,255,255,0.08)',
                margin: '24px 0'
              }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    background: '#f97316',
                    border: 'none',
                    color: '#fff',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: uploading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !uploading && (e.target.style.opacity = 0.85)}
                  onMouseLeave={(e) => !uploading && (e.target.style.opacity = 1)}
                >
                  {uploading ? 'Recording...' : <><ShieldCheck size={16} /> Record on VERI-CHAIN</>}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.8)',
                    padding: '12px 24px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
                  setSingleData({ studentName: '', rollNumber: '', course: '', graduationYear: '', grade: '', certificateId: '' })
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
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif'
              }}>Bulk Upload</h1>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                margin: 0
              }}>Upload a CSV file to record multiple certificates at once.</p>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px'
          }}>
            <form onSubmit={handleBulkSubmit}>
              <input
                type="file"
                accept=".csv"
                id="csv-upload"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files[0])}
              />
              <label
                htmlFor="csv-upload"
                style={{
                  display: 'block',
                  cursor: 'pointer',
                  marginBottom: '24px',
                  padding: '40px 20px',
                  border: '2px dashed rgba(249, 115, 22, 0.3)',
                  borderRadius: '12px',
                  background: 'rgba(249, 115, 22, 0.02)',
                  transition: 'all 0.3s',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#f97316';
                  e.target.style.background = 'rgba(249, 115, 22, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'rgba(249, 115, 22, 0.3)';
                  e.target.style.background = 'rgba(249, 115, 22, 0.02)';
                }}
              >
                <UploadCloud size={44} style={{ color: '#f97316', margin: '0 auto 16px', display: 'block' }} />
                <h3 style={{
                  fontSize: '18px',
                  marginBottom: '8px',
                  color: '#fff',
                  fontWeight: 600
                }}>
                  {file ? file.name : 'Click to select CSV file'}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.6)'
                }}>Required columns: studentName, rollNumber, course, graduationYear, grade, certificateId</p>
              </label>

              <div style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <p style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '8px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>CSV Format Example</p>
                <code style={{
                  fontSize: '12px',
                  color: '#f97316',
                  fontFamily: 'monospace',
                  display: 'block',
                  lineHeight: 1.8,
                  background: 'rgba(0,0,0,0.2)',
                  padding: '8px',
                  borderRadius: '6px'
                }}>
                  studentName,rollNumber,course,graduationYear,grade,certificateId<br/>
                  John Doe,CS24-001,B.Sc CS,2024,8.5,CERT-001
                </code>
              </div>

              <button
                type="submit"
                disabled={uploading || !file}
                style={{
                  width: '100%',
                  background: '#f97316',
                  border: 'none',
                  color: '#fff',
                  padding: '14px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: (uploading || !file) ? 'not-allowed' : 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: (uploading || !file) ? 0.6 : 1
                }}
                onMouseEnter={(e) => !(uploading || !file) && (e.target.style.opacity = 0.85)}
                onMouseLeave={(e) => !(uploading || !file) && (e.target.style.opacity = 1)}
              >
                {uploading ? 'Processing...' : <><UploadCloud size={16} /> Upload & Record Batch</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  </div>
  );
};

export default UniversityDashboard;
