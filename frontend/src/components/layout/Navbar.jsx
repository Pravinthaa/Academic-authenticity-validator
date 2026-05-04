import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { ShieldCheck, LogOut, User as UserIcon, Upload, Search, BarChart3 } from 'lucide-react';

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
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  };

  return (
    <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gradient hover:text-purple-300 transition-colors">
            <ShieldCheck size={28} className="text-purple-400" />
            <span>VERI-CHAIN</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex gap-6 items-center">
            {isAuthenticated && (
              <>
                {/* Public Verification Link (for all roles) */}
                <Link to="/verify" className="flex items-center gap-2 text-gray-300 hover:text-purple-300 transition-colors text-sm">
                  <Search size={16} />
                  Verify
                </Link>

                {/* Institution-only Links */}
                {(user?.role === 'institution' || user?.role === 'admin') && (
                  <Link to="/certificate/upload" className="flex items-center gap-2 text-gray-300 hover:text-purple-300 transition-colors text-sm">
                    <Upload size={16} />
                    Upload
                  </Link>
                )}

                {/* Admin Links */}
                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" className="flex items-center gap-2 text-gray-300 hover:text-purple-300 transition-colors text-sm">
                    <BarChart3 size={16} />
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Side Items */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* User Profile */}
                <div className="flex items-center gap-2 text-xs text-gray-400 border-l border-purple-500/20 pl-4">
                  <UserIcon size={16} className="text-purple-300" />
                  <div className="hidden sm:flex flex-col">
                    <span className="text-gray-200 font-medium">{user?.name}</span>
                    <span className="text-purple-300 text-xs capitalize">{user?.role}</span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-500/20 rounded-lg text-red-300 hover:text-red-200 transition-all text-sm"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
