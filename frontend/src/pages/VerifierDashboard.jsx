import React, { useState, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
  ScanLine, Search, FileCheck, AlertTriangle, ShieldCheck,
  Upload, History, HelpCircle, CheckCircle2, XCircle
} from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const SIDEBAR_ITEMS = [
  { id: 'verify',  label: 'Verify Document',  icon: ScanLine },
  { id: 'history', label: 'Verification History', icon: History },
  { id: 'help',    label: 'How It Works',     icon: HelpCircle },
];

const VerifierDashboard = () => {
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('verify');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setSelectedFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const simulate = () => {
    if (!selectedFile) return toast.error('Please upload a certificate first.');
    setIsLoading(true);
    setResult(null);
    setTimeout(() => {
      setIsLoading(false);
      setResult({
        status: 'verified',
        ocrConfidence: 97.8,
        details: {
          studentName: 'Anya Sharma',
          rollNumber: 'CS22-001',
          institution: 'Tech University',
          course: 'B.Sc Computer Science',
          graduationYear: 2024,
          grade: '9.2 CGPA',
          certificateId: 'CERT-2024-CS-001',
        }
      });
    }, 2600);
  };

  const Sidebar = (
    <>
      <div className="sidebar-header">
        <span className="sidebar-badge verifier"><CheckCircle2 size={12} /> Verifier Account</span>
        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.name || 'Verifier Portal'}</p>
        <p className="text-xs text-muted mt-1">{user?.email}</p>
      </div>
      <div className="sidebar-nav">
        <p className="sidebar-section-title">Navigation</p>
        {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`sidebar-nav-item ${activeTab === id ? 'active verifier-active' : ''}`}
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
      {/* Verification Tab */}
      {activeTab === 'verify' && (
        <div className="animate-fade-in">
          <div className="page-header">
            <div>
              <h1>Verification Portal</h1>
              <p>Upload any certificate to verify its authenticity against chain records.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6" style={{ alignItems: 'start' }}>
            {/* Upload Panel */}
            <div className="glass-card p-6">
              <h2 className="text-xl mb-5 flex items-center gap-2">
                <Upload size={18} style={{ color: '#a78bfa' }} /> Upload Document
              </h2>

              <div
                className="upload-zone"
                style={{
                  borderColor: dragOver ? '#a78bfa' : undefined,
                  background: dragOver ? 'rgba(167,139,250,0.05)' : undefined,
                  marginBottom: '1.25rem',
                  cursor: 'pointer'
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFile(e.target.files[0])} />
                <FileCheck size={44} style={{ color: selectedFile ? '#a78bfa' : 'var(--text-muted)', margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>
                  {selectedFile ? selectedFile.name : 'Drop or click to upload'}
                </h3>
                <p className="text-sm text-muted">PDF, JPG, PNG supported (max 5 MB)</p>
              </div>

              <button className="btn btn-primary w-full" onClick={simulate} disabled={isLoading}>
                {isLoading
                  ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analyzing…</>
                  : <><ScanLine size={16} /> Verify Certificate</>}
              </button>
            </div>

            {/* Result Panel */}
            <div className="glass-card p-6">
              <h2 className="text-xl mb-5 flex items-center gap-2">
                <Search size={18} style={{ color: '#a78bfa' }} /> Verification Result
              </h2>

              {!result && !isLoading && (
                <div className="flex flex-col items-center justify-center text-secondary text-center"
                  style={{ minHeight: 280 }}>
                  <Search size={44} style={{ opacity: 0.25, marginBottom: '1rem' }} />
                  <p style={{ fontSize: '0.9rem' }}>Upload a document and click Verify.</p>
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center" style={{ minHeight: 280, gap: '1rem' }}>
                  <div className="spinner" />
                  <p className="text-secondary text-sm">Running AI forgery detection models…</p>
                </div>
              )}

              {result && (
                <div className="animate-fade-in">
                  {/* Status Banner */}
                  <div style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    marginBottom: '1.25rem',
                    background: result.status === 'verified' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${result.status === 'verified' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    color: result.status === 'verified' ? 'var(--success)' : 'var(--error)',
                  }}>
                    {result.status === 'verified'
                      ? <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
                      : <XCircle size={22} style={{ flexShrink: 0 }} />}
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>
                        {result.status === 'verified' ? 'Authentic Certificate' : 'Forgery Detected'}
                      </p>
                      <p style={{ fontSize: '0.82rem', opacity: 0.85 }}>
                        {result.status === 'verified'
                          ? 'This document matches official records on VERI-CHAIN.'
                          : 'Discrepancies found. Document likely tampered.'}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '1rem 1.25rem', border: '1px solid var(--border-glass)' }}>
                    <p className="text-xs text-muted uppercase tracking-widest mb-3">
                      Extracted Data &nbsp;·&nbsp; OCR Confidence: {result.ocrConfidence}%
                    </p>
                    {Object.entries(result.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b pb-2 mb-2" style={{ borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-secondary text-sm capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-sm font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="animate-fade-in">
          <div className="page-header">
            <div><h1>Verification History</h1><p>Your recent document checks.</p></div>
          </div>
          <div className="glass-card p-8 flex flex-col items-center justify-center" style={{ minHeight: 300 }}>
            <History size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.4 }} />
            <p className="text-secondary">No verification history yet.</p>
          </div>
        </div>
      )}

      {/* How It Works */}
      {activeTab === 'help' && (
        <div className="animate-fade-in">
          <div className="page-header">
            <div><h1>How It Works</h1><p>Understanding the verification process.</p></div>
          </div>
          <div className="grid grid-cols-1 gap-4" style={{ maxWidth: 600 }}>
            {[
              { step: '01', title: 'Upload Document', desc: 'Upload a certificate image (PDF/JPG/PNG). Our OCR engine extracts all text from the document.' },
              { step: '02', title: 'AI Extraction', desc: 'The AI parses student name, roll number, course, institution, year, and grade from the document.' },
              { step: '03', title: 'Chain Lookup', desc: 'Extracted data is cross-referenced against the immutable VERI-CHAIN certificate registry.' },
              { step: '04', title: 'Result Returned', desc: 'A verified or flagged result is returned with confidence scores and full extracted details.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="glass-card p-5 flex gap-4 items-start">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: '#a78bfa', flexShrink: 0, width: 40 }}>{step}</div>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{title}</p>
                  <p className="text-secondary text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default VerifierDashboard;
