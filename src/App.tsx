/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import TypingPage from './pages/TypingPage';
import { Loader2 } from 'lucide-react';

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : !profile ? <Register /> : <Navigate to="/" />} />
      
      <Route 
        path="/" 
        element={
          !user ? (
            <Navigate to="/login" />
          ) : !profile ? (
            <Navigate to="/register" />
          ) : profile.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <UserDashboard />
          )
        } 
      />

      <Route 
        path="/typing/:textId" 
        element={
          user && profile && profile.role === 'user' ? (
            <TypingPage />
          ) : (
            <Navigate to="/" />
          )
        } 
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#0A0A0B] font-sans text-gray-100">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}
