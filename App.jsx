import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UniversityDashboard from './pages/UniversityDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import GovernmentDashboard from './pages/GovernmentDashboard';
import useAuthStore from './store/authStore';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" />;
  
  return children;
};

function App() {
  const { fetchProfile, isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, fetchProfile]);

  return (
    <Router>
      <div className="app-container flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route 
              path="/university/*" 
              element={
                <ProtectedRoute allowedRoles={['institution', 'admin']}>
                  <UniversityDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/verifier/*" 
              element={
                <ProtectedRoute allowedRoles={['verifier', 'admin']}>
                  <VerifierDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/government/*" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <GovernmentDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;
