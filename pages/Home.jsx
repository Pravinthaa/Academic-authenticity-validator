import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileCheck, Search, BarChart3, ArrowRight, Building2, UserSearch, Landmark, CheckCircle } from 'lucide-react';

const PortalCard = ({ icon: Icon, title, subtitle, description, href, color, badge }) => (
  <Link to={href} className="glass-card p-7 flex flex-col gap-4 animate-fade-in" style={{ textDecoration: 'none', color: 'inherit' }}>
    <div className="flex items-start justify-between">
      <div style={{ 
        width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}18`, border: `1px solid ${color}33`
      }}>
        <Icon size={26} style={{ color }} />
      </div>
      <span className="badge" style={{ background: `${color}12`, color, border: `1px solid ${color}28`, fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: 20, fontWeight: 600 }}>
        {badge}
      </span>
    </div>
    <div>
      <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>{title}</h3>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{subtitle}</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{description}</p>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color, fontSize: '0.85rem', fontWeight: 600, marginTop: 'auto' }}>
      Access Portal <ArrowRight size={15} />
    </div>
  </Link>
);

const FeatureChip = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 glass-panel px-4 py-2" style={{ borderRadius: 10, fontSize: '0.85rem' }}>
    <Icon size={16} style={{ color: 'var(--accent-primary)' }} />
    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
  </div>
);

const Home = () => {
  return (
    <div>
      {/* Hero */}
      <section style={{ 
        minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '5rem 2rem 3rem',
        background: 'radial-gradient(ellipse at 60% 0%, rgba(0,240,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 10% 80%, rgba(112,0,255,0.07) 0%, transparent 60%)'
      }}>
        <div style={{ maxWidth: 700, textAlign: 'center' }} className="animate-fade-in">
          <div className="inline-flex items-center gap-2 glass-panel px-5 py-2 mb-8" style={{ borderRadius: 99, borderColor: 'rgba(0,240,255,0.2)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>System Online — All verification services active</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '1.25rem', lineHeight: 1.1 }}>
            The Future of<br />
            <span className="text-gradient">Academic Integrity</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 2.5rem' }}>
            VERI-CHAIN provides cryptographically secured certificate management for institutions, verifiers, and government oversight — all in one platform.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              Sign In
            </Link>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap" style={{ opacity: 0.8 }}>
            <FeatureChip icon={Shield} label="Tamper-Proof Records" />
            <FeatureChip icon={CheckCircle} label="OCR Verification" />
            <FeatureChip icon={BarChart3} label="Gov. Analytics" />
          </div>
        </div>
      </section>

      {/* Portal Cards */}
      <section style={{ padding: '2rem 2rem 5rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="animate-fade-in delay-100">
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Choose Your Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Role-based access for every stakeholder in the credential ecosystem.</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <PortalCard
            icon={Building2}
            title="University Portal"
            subtitle="For Institutions"
            description="Issue single or bulk certificates. Manage your institution's graduate records securely on the chain."
            href="/register"
            color="#00f0ff"
            badge="Institutions"
          />
          <PortalCard
            icon={UserSearch}
            title="Verifier Portal"
            subtitle="For Employers & Orgs"
            description="Upload any certificate document and our AI-powered OCR will cross-check it against institutional records instantly."
            href="/login"
            color="#a78bfa"
            badge="Verifiers"
          />
          <PortalCard
            icon={Landmark}
            title="Government Portal"
            subtitle="For Authorities"
            description="System-wide oversight with real-time analytics on certificate issuance, verification rates, and forgery alerts."
            href="/login"
            color="#f59e0b"
            badge="Oversight"
          />
        </div>
      </section>

      {/* Bottom Strip */}
      <div style={{ borderTop: '1px solid var(--border-glass)', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          VERI-CHAIN — Secure · Transparent · Immutable
        </p>
      </div>
    </div>
  );
};

export default Home;
