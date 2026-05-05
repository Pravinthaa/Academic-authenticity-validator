import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }
    const success = await login(email, password);
    if (success) {
      toast.success('Logged in successfully!');
      const currentUser = useAuthStore.getState().user;
      const dashboardLink = currentUser?.role === 'admin' ? '/admin/dashboard' : (currentUser?.role === 'institution' ? '/university' : '/verifier');
      navigate(dashboardLink);
    } else {
      const currentError = useAuthStore.getState().error;
      toast.error(currentError || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="container flex justify-center items-center min-vh-100 py-20">
      <div className="glass-panel w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl mb-2 font-display text-gradient">Welcome Back</h2>
          <p className="text-secondary">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group mb-8">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full justify-center text-lg" disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : <><LogIn size={20} /> Sign In</>}
          </button>
        </form>

        <p className="text-center mt-6 text-secondary text-sm">
          Don't have an account? <Link to="/register" className="text-[var(--accent-primary)] hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
