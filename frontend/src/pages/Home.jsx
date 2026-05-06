import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InteractiveSphere from '../components/InteractiveSphere';
import AbstractFigure from '../components/AbstractFigure';
import WireframeSphere from '../components/WireframeSphere';
import useAuthStore from '../store/authStore';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const sectionRef = React.useRef(null);

  React.useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Calculate progress based on vertical offset
      // Start splitting when section top enters viewport, finish when bottom leaves
      const totalHeight = rect.height;
      const progress = Math.min(Math.max(-rect.top / (totalHeight - viewportHeight), 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div id="site" style={{ width: '100%', background: '#07070d', color: '#fff', fontFamily: 'Inter, sans-serif', position: 'relative' }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 40px',
        background: 'rgba(7,7,13,0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '0.5px solid rgba(255,255,255,0.07)'
      }}>
        <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: 3, color: '#fff', opacity: 0.9 }}>
          AUTHENTICITY VALIDATOR
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {['HOW IT WORKS', 'TECH STACK', 'ABOUT'].map(l => (
            <span key={l} style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#f97316'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
            >{l}</span>
          ))}
          {isAuthenticated ? (
            <>
              <span 
                onClick={() => {
                  const link = user?.role === 'admin' ? '/admin/dashboard' : (user?.role === 'institution' ? '/university' : '/verifier');
                  navigate(link);
                }}
                style={{ fontSize: 11, letterSpacing: 2, color: '#f97316', fontWeight: 'bold', cursor: 'pointer' }}
              >DASHBOARD</span>
              <span 
                onClick={() => { logout(); navigate('/'); }}
                style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}
              >LOGOUT</span>
            </>
          ) : (
            <span 
              onClick={() => navigate('/login')}
              style={{ fontSize: 11, letterSpacing: 2, color: '#f97316', fontWeight: 'bold', cursor: 'pointer' }}
            >LOGIN</span>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" style={{ height: 580, position: 'relative', overflow: 'hidden', background: '#07070d' }}>
        {/* Sphere as fullscreen hero background */}
        <InteractiveSphere height={580} />
        {/* Hero text content layered on top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', pointerEvents: 'none' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#f97316', marginBottom: 14, opacity: 0.9 }}>
              SIH 2025 · PS #25029 · GOVT OF JHARKHAND
            </div>
            <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.0, letterSpacing: -2, color: '#fff' }}>
              DETECT<br />FAKE<br /><span style={{ color: '#f97316' }}>DEGREES.</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginTop: 16, lineHeight: 2 }}>
              AI · OCR · BLOCKCHAIN<br />CERTIFICATE VALIDATION AT SCALE
            </div>
          </div>

          {/* Right content */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: 1, lineHeight: 2, maxWidth: 200, marginLeft: 'auto', marginBottom: 20 }}>
              Protecting academic integrity across Jharkhand's higher education system.
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{ background: '#f97316', border: 'none', color: '#fff', padding: '12px 28px', fontSize: 11, letterSpacing: 2, cursor: 'pointer', borderRadius: 3, transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.target.style.opacity = 0.85}
              onMouseLeave={e => e.target.style.opacity = 1}
            >
              VALIDATE NOW
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.3)', zIndex: 2 }}>
          [SCROLL TO EXPLORE]
        </div>
      </section>

      {/* DETECT */}
      <section id="detect" style={{ padding: '60px 40px', background: 'transparent' }}>
        <div style={{ background: '#fcfcfc', color: '#111', borderRadius: '16px', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

          {/* LEFT COLUMN */}
          <div style={{ borderRight: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column' }}>

            {/* Top Left */}
            <div style={{ padding: '80px 40px', borderBottom: '1px solid #e5e5e5', flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ fontSize: 62, fontWeight: 500, letterSpacing: -1.5, color: '#111', lineHeight: 1.05 }}>
                SIX TYPES OF<br />ACADEMIC<br />FRAUD.
              </div>
            </div>

            {/* Bottom Left */}
            <div style={{ padding: '40px', position: 'relative', flex: 1, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, letterSpacing: 1.5, color: '#111', fontFamily: '"SF Mono", "Roboto Mono", Consolas, Monaco, monospace', textTransform: 'uppercase', marginBottom: 20 }}>
                / ZERO TOLERANCE
              </div>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                  <AbstractFigure height={350} />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>

            {/* Top Right (Small banner) */}
            <div style={{ padding: '24px 40px', borderBottom: '1px solid #e5e5e5', fontSize: 13, letterSpacing: 1.5, color: '#888', fontFamily: '"SF Mono", "Roboto Mono", Consolas, Monaco, monospace' }}>
              [ WHAT WE DETECT ]
            </div>

            {/* Bottom Right (Grid of 6) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1 }}>
              {[
                { num: '01', title: 'TAMPERED GRADES & PHOTOS', body: 'PIXEL-LEVEL ANALYSIS DETECTS ANY ALTERATION IN SCANNED CERTIFICATES.' },
                { num: '02', title: 'FORGED SEALS & SIGNATURES', body: 'CROSS-REFERENCES INSTITUTIONAL DATABASES TO FLAG UNAUTHORIZED STAMPS.' },
                { num: '03', title: 'INVALID CERT NUMBERS', body: 'EVERY CERTIFICATE ID IS VALIDATED AGAINST THE REGISTRY IN REAL TIME.' },
                { num: '04', title: 'NON-EXISTENT INSTITUTIONS', body: 'VERIFIES THAT THE ISSUING COLLEGE IS A RECOGNIZED AND ACCREDITED BODY.' },
                { num: '05', title: 'DUPLICATE DOCUMENTS', body: 'HASH-BASED FINGERPRINTING CATCHES CLONED OR REUSED CERTIFICATES.' },
                { num: '06', title: 'LEGACY CERTIFICATE FRAUD', body: 'OCR EXTRACTS DATA FROM OLD CERTIFICATES AND VALIDATES AGAINST RECORDS.' },
              ].map((c, i) => (
                <div key={c.num} style={{
                  padding: '40px',
                  borderBottom: (i === 4 || i === 5) ? 'none' : '1px solid #e5e5e5',
                  borderRight: i % 2 === 0 ? '1px solid #e5e5e5' : 'none'
                }}>
                  <div style={{ color: '#ff3b3b', fontSize: 15, fontFamily: '"SF Mono", "Roboto Mono", Consolas, Monaco, monospace', marginBottom: 24 }}>{c.num}.</div>
                  <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: 0.5, color: '#111', fontFamily: '"SF Mono", "Roboto Mono", Consolas, Monaco, monospace', marginBottom: 16, lineHeight: 1.4 }}>/ {c.title}.</div>
                  <div style={{ fontSize: 11, color: '#777', lineHeight: 1.8, fontFamily: '"SF Mono", "Roboto Mono", Consolas, Monaco, monospace' }}>{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how" ref={sectionRef} style={{ position: 'relative', background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.1)', paddingBottom: '100px' }}>

        {/* Main Title Overlay */}
        <div style={{ padding: '80px 40px 40px' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: '#f97316', marginBottom: 12, fontWeight: 600 }}>HOW IT WORKS</div>
          <div style={{ fontSize: 62, fontWeight: 700, letterSpacing: -2, color: '#fff', lineHeight: 1 }}>
            Three steps to <span style={{ color: 'rgba(255,255,255,0.25)' }}>the truth.</span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>

          {/* Sticky Sphere Container */}
          <div style={{
            position: 'sticky',
            top: '20vh',
            height: '60vh',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1,
            pointerEvents: 'none'
          }}>
            <div style={{ width: 350, height: 350 }}>
              <WireframeSphere height={350} progress={scrollProgress} />
            </div>
          </div>

          {/* Vertical Steps (Scroll past the sticky sphere) */}
          <div style={{ position: 'relative', zIndex: 2, marginTop: '-40vh' }}>
            {[
              { num: '01', tag: 'UPLOAD', title: 'Submit the certificate', body: 'Employers, institutions, or agencies upload a PDF or image of the certificate through our secure interface.' },
              { num: '02', tag: 'ANALYSE', title: 'AI + OCR extraction', body: 'Our engine extracts name, roll number, marks, and certificate ID — then cross-checks against verified institutional databases.' },
              { num: '03', tag: 'RESULT', title: 'Instant verdict', body: 'A verified badge or fraud alert is issued within seconds, with a full anomaly report for flagged documents.' },
            ].map((s, i) => (
              <div key={s.num} style={{
                minHeight: '80vh',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 40px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', maxWidth: 1200, margin: '0 auto' }}>

                  {/* Left: Step label */}
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 }}>
                      [STEP {s.num}.]
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>
                      {s.tag}
                    </div>
                  </div>

                  {/* Right: Heading, Description & Button */}
                  <div style={{ maxWidth: 400, textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: 32, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                      {s.body}
                    </div>
                    <div style={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <button style={{
                        background: '#fff', border: 'none', color: '#000',
                        padding: '14px 28px', fontSize: 11, fontWeight: 600,
                        letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase'
                      }}>
                        READY TO START
                      </button>
                      <div style={{
                        background: '#fff', width: 44, height: 44,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderLeft: '1px solid #eee'
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                        </svg>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}

            {/* Final bottom divider */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section id="stack" style={{ padding: '80px 40px', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: '#f97316', marginBottom: 12 }}>TECHNOLOGY</div>
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, color: '#fff' }}>
          Built on <span style={{ color: 'rgba(255,255,255,0.25)' }}>serious infrastructure.</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 48, alignItems: 'center' }}>
          {/* Tech list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'OCR Engine', desc: 'Tesseract / AWS Textract' },
              { name: 'AI Anomaly Detection', desc: 'PyTorch / OpenCV' },
              { name: 'Blockchain Ledger', desc: 'Ethereum / IPFS' },
              { name: 'Cryptographic Hashing', desc: 'SHA-256 / Digital Watermark' },
              { name: 'Secure API', desc: 'REST / JWT Auth' },
            ].map(t => (
              <div key={t.name}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 6, transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
              >
                <div style={{ width: 8, height: 8, background: '#f97316', borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>{t.desc}</div>
              </div>
            ))}
          </div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { num: '99.2%', label: 'DETECTION ACCURACY' },
              { num: '<3s', label: 'VERIFICATION TIME' },
              { num: '∞', label: 'SCALABLE INSTITUTIONS' },
              { num: '0', label: 'MANUAL STEPS' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 24 }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#f97316', lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, letterSpacing: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" style={{ padding: '100px 40px', borderTop: '0.5px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.5, marginBottom: 16 }}>
          Zero tolerance for<br /><span style={{ color: '#f97316' }}>academic fraud.</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 36, letterSpacing: 1 }}>
          PROTECTING STUDENTS · EMPLOYERS · INSTITUTIONS
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: '#f97316', border: 'none', color: '#fff', padding: '12px 28px', fontSize: 11, letterSpacing: 2, cursor: 'pointer', borderRadius: 3, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.target.style.opacity = 0.85}
            onMouseLeave={e => e.target.style.opacity = 1}
          >VERIFY A CERTIFICATE</button>

          <button
            onClick={() => navigate('/register')}
            style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.3)', color: '#fff', padding: '12px 28px', fontSize: 11, letterSpacing: 2, cursor: 'pointer', borderRadius: 3, transition: 'border-color 0.2s, color 0.2s' }}
            onMouseEnter={e => { e.target.style.borderColor = '#f97316'; e.target.style.color = '#f97316'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.color = '#fff'; }}
          >INSTITUTION PORTAL</button>

          <button
            onClick={() => {
              if (isAuthenticated && user?.role === 'admin') {
                navigate('/admin/dashboard');
              } else {
                navigate('/login');
              }
            }}
            style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.3)', color: '#fff', padding: '12px 28px', fontSize: 11, letterSpacing: 2, cursor: 'pointer', borderRadius: 3, transition: 'border-color 0.2s, color 0.2s' }}
            onMouseEnter={e => { e.target.style.borderColor = '#f97316'; e.target.style.color = '#f97316'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.color = '#fff'; }}
          >ADMIN PORTAL</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '32px 40px', borderTop: '0.5px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.5 }}>
          © 2025 AUTHENTICITY VALIDATOR · GOVT OF JHARKHAND · SIH #25029
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>
          BUILT FOR <span style={{ color: '#f97316' }}>SMART INDIA HACKATHON</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
