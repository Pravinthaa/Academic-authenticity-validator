import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'verifier',
    organizationName: '',
    registrationNumber: ''
  });
  
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(formData);
    if (success) {
      toast.success('Successfully registered');
      navigate('/');
    } else {
      toast.error('Registration failed. Please check inputs.');
    }
  };

  return (
    <div className="container flex justify-center items-center py-12">
      <div className="glass-panel w-full max-w-xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl mb-2 font-display text-gradient">Create Account</h2>
          <p className="text-secondary">Join VERI-CHAIN today</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" name="name" className="form-input" 
                value={formData.name} onChange={handleChange} required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input 
                type="email" name="email" className="form-input" 
                value={formData.email} onChange={handleChange} required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" name="password" className="form-input" 
                value={formData.password} onChange={handleChange} required minLength="6"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select 
                name="role" className="form-input" 
                value={formData.role} onChange={handleChange}
              >
                <option value="verifier">Verifier (Employer/Agency)</option>
                <option value="institution">Educational Institution</option>
                <option value="admin">Government Admin</option>
              </select>
            </div>
          </div>

          {formData.role === 'institution' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div className="form-group">
                  <label className="form-label">Organization Name</label>
                  <input 
                    type="text" name="organizationName" className="form-input" 
                    value={formData.organizationName} onChange={handleChange} required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Number</label>
                  <input 
                    type="text" name="registrationNumber" className="form-input" 
                    value={formData.registrationNumber} onChange={handleChange} required 
                  />
                </div>
             </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary w-full justify-center text-lg mt-4" 
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : <><UserPlus size={20} /> Register</>}
          </button>
        </form>

        <p className="text-center mt-6 text-secondary text-sm">
          Already have an account? <Link to="/login" className="text-[var(--accent-primary)] hover:underline">Log in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
