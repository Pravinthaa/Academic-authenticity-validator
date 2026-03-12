import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import useAuthStore from '../store/authStore';
import {
  BarChart3, AlertOctagon, Users, Layers, Activity,
  ShieldAlert, Building2, TrendingUp, Globe
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { id: 'overview',      label: 'System Overview',    icon: BarChart3 },
  { id: 'institutions',  label: 'Institutions',       icon: Building2 },
  { id: 'alerts',        label: 'Forgery Alerts',     icon: ShieldAlert },
];

const StatCard = ({ title, value, change, icon: Icon, color }) => (
  <div className="stat-card" style={{ '--stat-color': color }}>
    <div className="flex justify-between items-start mb-3">
      <div>
        <p className="text-sm text-secondary mb-2">{title}</p>
        <p style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{value}</p>
      </div>
      <div style={{ padding: 10, borderRadius: 12, background: `${color}15`, color }}>
        <Icon size={22} />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: change.startsWith('+') ? 'var(--success)' : 'var(--error)' }}>
        <TrendingUp size={12} style={{ display: 'inline', marginRight: 3 }} />{change}
      </span>
      <span className="text-muted" style={{ fontSize: '0.78rem' }}>from last month</span>
    </div>
  </div>
);

const INSTITUTIONS = [
  { name: 'National Institute of Technology', state: 'Tamil Nadu', certs: '14,200', status: 'Active' },
  { name: 'Indian Institute of Technology',   state: 'Delhi',      certs: '9,841',  status: 'Active' },
  { name: 'University of Mumbai',             state: 'Maharashtra',certs: '22,304', status: 'Active' },
  { name: 'Jawaharlal Nehru University',      state: 'Delhi',      certs: '5,601',  status: 'Active' },
  { name: 'Osmania University',               state: 'Telangana',  certs: '11,093', status: 'Suspended' },
];

const ALERTS = [
  { college: 'Unknown Source', cert: 'B.E Civil Engineering', conf: '94.1%', time: '12 mins ago' },
  { college: 'Fake State Uni', cert: 'MBA Finance', conf: '88.7%', time: '1 hr ago' },
  { college: 'Unknown Source', cert: 'B.Sc Nursing', conf: '91.3%', time: '3 hrs ago' },
  { college: 'Private College XYZ', cert: 'B.A History', conf: '85.2%', time: '5 hrs ago' },
  { college: 'Unknown Source', cert: 'M.Tech CS', conf: '97.6%', time: '8 hrs ago' },
];

const GovernmentDashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [rangeFilter, setRangeFilter] = useState('30d');

  const chartBars = [40, 60, 45, 80, 50, 95, 70, 65, 85, 60, 100, 80];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const Sidebar = (
    <>
      <div className="sidebar-header">
        <span className="sidebar-badge government"><Globe size={12} /> Government Admin</span>
        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.name || 'Admin Portal'}</p>
        <p className="text-xs text-muted mt-1">{user?.email}</p>
      </div>
      <div className="sidebar-nav">
        <p className="sidebar-section-title">Navigation</p>
        {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`sidebar-nav-item ${activeTab === id ? 'active gov-active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={17} /> {label}
          </button>
        ))}
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
              <h1>Government Oversight</h1>
              <p>System-wide monitoring, verification stats, and forgery alerts.</p>
            </div>
            <div className="flex gap-2">
              {['7d','30d','12m'].map(r => (
                <button key={r}
                  onClick={() => setRangeFilter(r)}
                  className={`btn ${rangeFilter === r ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                >
                  {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '12 Months'}
                </button>
              ))}
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Verifications" value="1.24M" change="+14.5%" icon={Activity} color="#00f0ff" />
            <StatCard title="Active Institutions"  value="2,845"  change="+3.2%"  icon={Users}        color="#a78bfa" />
            <StatCard title="Certificates Issued"  value="8.51M" change="+8.1%"  icon={Layers}       color="#10b981" />
            <StatCard title="Forgeries Detected"   value="14,204" change="-2.4%" icon={AlertOctagon}  color="#ef4444" />
          </div>

          {/* Chart + Alerts */}
          <div className="grid grid-cols-3 gap-6">
            {/* Bar Chart */}
            <div className="glass-card p-6" style={{ gridColumn: 'span 2' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl">Verification Activity</h2>
                <span className="badge badge-info">Live Data</span>
              </div>
              <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0 4px', borderBottom: '1px solid var(--border-glass)' }}>
                {chartBars.map((h, i) => (
                  <div key={i} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', cursor: 'pointer' }}>
                    <div
                      title={`${months[i]}: ${h}k`}
                      style={{
                        width: '100%',
                        height: `${h}%`,
                        borderRadius: '4px 4px 0 0',
                        background: 'linear-gradient(to top, var(--accent-secondary), var(--accent-primary))',
                        opacity: 0.65,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => e.target.style.opacity = 1}
                      onMouseLeave={e => e.target.style.opacity = 0.65}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 px-1">
                {months.map(m => <span key={m} className="text-muted" style={{ fontSize: '0.68rem' }}>{m}</span>)}
              </div>
            </div>

            {/* Quick Alerts */}
            <div className="glass-card p-5">
              <h2 className="text-lg mb-4 flex items-center gap-2">
                <AlertOctagon size={17} style={{ color: 'var(--error)' }} /> Recent Alerts
              </h2>
              <div className="space-y-3">
                {ALERTS.slice(0, 4).map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.625rem', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <AlertOctagon size={14} style={{ color: 'var(--error)', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 500 }}>{a.cert}</p>
                      <p className="text-xs text-muted">{a.college} · AI: {a.conf}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="text-sm text-accent w-full mt-3" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                onClick={() => setActiveTab('alerts')}>
                View all alerts →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Institutions Tab */}
      {activeTab === 'institutions' && (
        <div className="animate-fade-in">
          <div className="page-header">
            <div><h1>Registered Institutions</h1><p>All registered universities and colleges.</p></div>
            <span className="badge badge-info">{INSTITUTIONS.length} Institutions</span>
          </div>
          <div className="glass-card p-6">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    {['Institution', 'State', 'Certs Issued', 'Status'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 0.875rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INSTITUTIONS.map((inst, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.875rem', fontWeight: 500 }}>{inst.name}</td>
                      <td style={{ padding: '0.875rem', color: 'var(--text-secondary)' }}>{inst.state}</td>
                      <td style={{ padding: '0.875rem', color: 'var(--text-secondary)' }}>{inst.certs}</td>
                      <td style={{ padding: '0.875rem' }}>
                        <span className={`badge ${inst.status === 'Active' ? 'badge-success' : 'badge-error'}`}>
                          {inst.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="animate-fade-in">
          <div className="page-header">
            <div><h1>Forgery Alerts</h1><p>Real-time forgery detection events flagged by AI.</p></div>
            <span className="badge badge-error">{ALERTS.length} Active</span>
          </div>
          <div className="glass-card p-6">
            <div className="space-y-4">
              {ALERTS.map((a, i) => (
                <div key={i} className="glass-panel p-4 flex gap-4 items-center" style={{ borderRadius: 10, borderColor: 'rgba(239,68,68,0.15)' }}>
                  <div style={{ padding: 10, borderRadius: 10, background: 'rgba(239,68,68,0.1)', color: 'var(--error)' }}>
                    <AlertOctagon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>Tampered Seal Detected</p>
                    <p className="text-secondary text-sm">{a.cert} · Source: {a.college}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-error" style={{ marginBottom: '0.3rem', display: 'inline-flex' }}>AI {a.conf}</span>
                    <p className="text-xs text-muted">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default GovernmentDashboard;
