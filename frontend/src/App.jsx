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
import CertificateUpload from './components/CertificateUpload';
import CertificateVerifier from './components/CertificateVerifier';
import AdminDashboard from './components/AdminDashboard';
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
      <Routes>
        {/* Home has its own full-page design with its own nav, no global Navbar */}
        <Route path="/" element={<Home />} />

        {/* All other routes use the global Navbar + layout */}
        <Route path="/*" element={
          <div className="app-container flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Certificate Verification (Public) */}
                <Route path="/verify" element={<CertificateVerifier />} />

                {/* Institution Routes */}
                <Route
                  path="/certificate/upload"
                  element={
                    <ProtectedRoute allowedRoles={['institution', 'admin']}>
                      <CertificateUpload />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/university/*"
                  element={
                    <ProtectedRoute allowedRoles={['institution', 'admin']}>
                      <UniversityDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Verifier Routes */}
                <Route
                  path="/verifier/*"
                  element={
                    <ProtectedRoute allowedRoles={['verifier', 'admin']}>
                      <VerifierDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
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
        } />
      </Routes>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;
