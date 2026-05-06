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

  const handleFile = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const simulate = async () => {
    if (!selectedFile) return toast.error('Please upload a certificate first.');
    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('certificate', selectedFile);

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/certificates/verify`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const responseData = response.data || {};
      const isTampered = responseData.status === 'tampered';
      const extracted = responseData.aiExtractions || {};

      // For verified responses (including untampered mocks), prefer structured
      // `certificate` object returned by the API, fall back to `aiExtractions`.
      const cert = responseData.certificate || {
        studentName: extracted.student_name,
        registerNumber: extracted.register_number,
        emisId: extracted.emis_id,
        totalMarks: extracted.total_marks,
        dateOfBirth: extracted.date_of_birth,
        schoolName: extracted.school_name,
        certificateId: extracted.certificate_serial_no,
        graduationYear: extracted.graduation_year || 2024
      };

      setResult({
        status: isTampered ? 'tampered' : 'verified',
        ocrConfidence: isTampered
          ? Math.round((responseData.confidence || 0) * 100)
          : Math.round((responseData.confidence || 0) * 100) || 97.8,
        confidence: responseData.confidence,
        institution: responseData.institution,
        tamperDetails: responseData.tamperDetails,
        details: isTampered
          ? {
              registerNumber: extracted.register_number || selectedFile.name,
              studentName: extracted.student_name || 'Tampered Certificate',
              schoolName: extracted.school_name || responseData.institution?.name || 'Mock Institution',
              tamperReason: responseData.tamperDetails?.details || 'Filename marker indicates tampering',
              confidence: `${Math.round((responseData.confidence || 0) * 100)}%`,
            }
          : {
              studentName: cert.studentName || selectedFile.name,
              rollNumber: cert.rollNumber || cert.registerNumber || '',
              registerNumber: cert.registerNumber || '',
              schoolName: cert.schoolName || responseData.institution?.name || '',
              graduationYear: cert.graduationYear || 2024,
              totalMarks: cert.totalMarks ? `${cert.totalMarks} / 600` : (cert.totalMarks || ''),
              certificateId: cert.certificateId || ''
            }
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
      setResult({
        status: 'tampered',
        ocrConfidence: 0,
        details: {
          studentName: selectedFile.name,
          tamperReason: 'Verification service unavailable',
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          <CheckCircle2 size={12} /> Verifier Account
        </span>
        <p style={{ fontWeight: 600, fontSize: '15px', color: '#fff', marginBottom: '4px' }}>{user?.name || 'Verifier Portal'}</p>
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
        {activeTab === 'verify' && (
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
                }}>Verification Portal</h1>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.6)',
                  margin: 0
                }}>Upload any certificate to verify its authenticity against chain records.</p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              alignItems: 'start'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#fff'
                }}>
                  <Upload size={18} style={{ color: '#f97316' }} /> Upload Document
                </h2>

                <div
                  style={{
                    border: `2px dashed ${dragOver ? '#f97316' : 'rgba(249, 115, 22, 0.3)'}`,
                    background: dragOver ? 'rgba(249, 115, 22, 0.05)' : 'rgba(249, 115, 22, 0.02)',
                    borderRadius: '12px',
                    padding: '40px 20px',
                    marginBottom: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    style={{ display: 'none' }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                  <FileCheck size={44} style={{
                    color: selectedFile ? '#f97316' : 'rgba(255,255,255,0.4)',
                    margin: '0 auto 16px',
                    display: 'block'
                  }} />
                  <h3 style={{
                    fontSize: '18px',
                    marginBottom: '8px',
                    color: '#fff',
                    fontWeight: 600
                  }}>
                    {selectedFile ? selectedFile.name : 'Drop or click to upload'}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.6)'
                  }}>PDF, JPG, PNG supported (max 5 MB)</p>
                </div>

                <button
                  onClick={simulate}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: '#f97316',
                    border: 'none',
                    color: '#fff',
                    padding: '14px 24px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: isLoading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => { if (!isLoading) e.target.style.opacity = 0.85; }}
                  onMouseLeave={(e) => { if (!isLoading) e.target.style.opacity = 1; }}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <ScanLine size={16} /> Verify Certificate
                    </>
                  )}
                </button>
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
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#fff'
                }}>
                  <Search size={18} style={{ color: '#f97316' }} /> Verification Result
                </h2>

                {!result && !isLoading && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    minHeight: '280px',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    <Search size={44} style={{ opacity: 0.25, marginBottom: '16px' }} />
                    <p style={{ fontSize: '14px' }}>Upload a document and click Verify.</p>
                  </div>
                )}

                {isLoading && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '280px',
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(249, 115, 22, 0.3)',
                      borderTop: '3px solid #f97316',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.6)'
                    }}>Running AI forgery detection models…</p>
                  </div>
                )}

                {result && (
                  <div style={{ animation: 'fadeIn 0.5s ease' }}>
                    <div style={{
                      padding: '14px 16px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      marginBottom: '20px',
                      background: result.status === 'verified' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${result.status === 'verified' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                      color: result.status === 'verified' ? '#10b981' : '#ef4444'
                    }}>
                      {result.status === 'verified' ? (
                        <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
                      ) : (
                        <XCircle size={22} style={{ flexShrink: 0 }} />
                      )}
                      <div>
                        <p style={{
                          fontWeight: 700,
                          fontSize: '16px',
                          marginBottom: '4px',
                          color: result.status === 'verified' ? '#10b981' : '#ef4444'
                        }}>
                          {result.status === 'verified' ? 'Authentic Certificate' : 'Forgery Detected'}
                        </p>
                        <p style={{
                          fontSize: '13px',
                          opacity: 0.85,
                          color: result.status === 'verified' ? '#10b981' : '#ef4444'
                        }}>
                          {result.status === 'verified'
                            ? 'This document matches official records on VERI-CHAIN.'
                            : 'Discrepancies found. Document likely tampered.'}
                        </p>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '10px',
                      padding: '16px 20px',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      <p style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '12px'
                      }}>
                        Extracted Data &nbsp;·&nbsp; OCR Confidence: {result.ocrConfidence}%
                      </p>
                      {Object.entries(result.details).map(([k, v]) => (
                        <div key={k} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          paddingBottom: '8px',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            color: 'rgba(255,255,255,0.6)',
                            textTransform: 'capitalize'
                          }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#fff'
                          }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {result.status === 'tampered' && (
                      <div style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginTop: '12px'
                      }}>
                        <p style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          color: 'rgba(239,68,68,0.9)',
                          marginBottom: '6px'
                        }}>Tampered Alert</p>
                        <p style={{
                          fontSize: '13px',
                          color: 'rgba(239,68,68,0.8)'
                        }}>
                          Institution: {result.institution?.name || 'Mock Institution'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
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
                }}>Verification History</h1>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.6)',
                  margin: 0
                }}>Your recent document checks.</p>
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px'
            }}>
              <History size={48} style={{
                color: 'rgba(255,255,255,0.4)',
                marginBottom: '16px',
                opacity: 0.4
              }} />
              <p style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)'
              }}>No verification history yet.</p>
            </div>
          </div>
        )}

        {activeTab === 'help' && (
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
                }}>How It Works</h1>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.6)',
                  margin: 0
                }}>Understanding the verification process.</p>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '16px',
              maxWidth: '600px'
            }}>
              {[
                { step: '01', title: 'Upload Document', desc: 'Upload a certificate image (PDF/JPG/PNG). Our OCR engine extracts all text from the document.' },
                { step: '02', title: 'AI Extraction', desc: 'The AI parses student name, roll number, course, institution, year, and grade from the document.' },
                { step: '03', title: 'Chain Lookup', desc: 'Extracted data is cross-referenced against the immutable VERI-CHAIN certificate registry.' },
                { step: '04', title: 'Result Returned', desc: 'A verified or flagged result is returned with confidence scores and full extracted details.' },
              ].map(({ step, title, desc }) => (
                <div key={step} style={{
                  background: 'rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 800,
                    fontSize: '22px',
                    color: '#f97316',
                    flexShrink: 0,
                    width: '40px'
                  }}>{step}</div>
                  <div>
                    <p style={{
                      fontWeight: 600,
                      marginBottom: '6px',
                      color: '#fff',
                      fontSize: '16px'
                    }}>{title}</p>
                    <p style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.6)'
                    }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VerifierDashboard;
