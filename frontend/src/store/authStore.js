import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api`;

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      set({ 
        user: res.data.user, 
        token: res.data.token, 
        isAuthenticated: true, 
        isLoading: false,
        error: null
      });
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Login failed. Please check your email and password.';
      set({ 
        error: errorMsg, 
        isLoading: false 
      });
      return false;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`${API_URL}/auth/register`, userData);
      localStorage.setItem('token', res.data.token);
      set({ 
        user: res.data.user, 
        token: res.data.token, 
        isAuthenticated: true, 
        isLoading: false,
        error: null
      });
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed. Please check your inputs and try again.';
      set({ 
        error: errorMsg, 
        isLoading: false 
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    const { token } = get();
    if (!token) return;
    
    set({ isLoading: true });
    try {
      const res = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: res.data.data, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }
}));

export default useAuthStore;
