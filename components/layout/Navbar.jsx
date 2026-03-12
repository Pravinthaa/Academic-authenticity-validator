import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { ShieldCheck, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'institution': return '/university';
      case 'verifier': return '/verifier';
      case 'admin': return '/government';
      default: return '/';
    }
  };

  return (
    <nav className="glass-panel" style={{ margin: '1rem', padding: '1rem 2rem', borderRadius: '100px' }}>
      <div className="flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-gradient">
          <ShieldCheck size={28} color="var(--accent-primary)" />
          VERI-CHAIN
        </Link>

        <div className="flex gap-4 items-center">
          {isAuthenticated ? (
            <>
              <Link to={getDashboardLink()} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                Dashboard
              </Link>
              <div className="flex items-center gap-2 text-sm text-secondary border-l border-[var(--border-glass)] pl-4 ml-2">
                <UserIcon size={16} />
                <span>{user?.name} ({user?.role})</span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
