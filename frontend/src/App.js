import React from 'react';
import ServiceLogForm from './components/ServiceLogForm';
import MenuBar from './components/MenuBar';
import { Routes, Route, Navigate } from 'react-router-dom';
import Leaderboard from "./components/Leaderboard";
import StudentDashboard from './components/StudentDashboard';
import ProfilePage from './components/ProfilePage';
import FacultyApprovalPage from './components/FacultyApprovalPage';
import AdminPortal from './components/AdminPortal';
import LoginPage from "./components/LoginPage";
import { isAdmin, isAuthenticated, isFacultyOrAdmin } from './auth/auth';


// Protects cetain routes from being accessed by unauthenticated users.
function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/LoginPage" replace />;
}

function FacultyRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/LoginPage" replace />;
  }
  return isFacultyOrAdmin() ? children : <Navigate to="/dashboard" replace />;
}

function AdminRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/LoginPage" replace />;
  }
  return isAdmin() ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <div className="app-shell">
      <MenuBar />

      <main className="app-content">
        <h1 className="app-page-title">AOF Service</h1>
        <Routes>
          {/* Note: the "/" route is the default route, since I've made the default page the home page it takes the user there */}
          <Route path="/" element={<Navigate to="/leaderboard" replace />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/log" element={<ProtectedRoute><ServiceLogForm /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/faculty-approval" element={<FacultyRoute><FacultyApprovalPage /></FacultyRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPortal /></AdminRoute>} />
          <Route path="/LoginPage" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
