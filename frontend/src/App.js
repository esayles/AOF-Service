import React from 'react';
import ServiceLogForm from './components/ServiceLogForm';
import MenuBar from './components/MenuBar';
import { Routes, Route, Navigate } from 'react-router-dom';
import Leaderboard from "./components/Leaderboard";
import StudentDashboard from './components/StudentDashboard';
import ProfilePage from './components/ProfilePage';
import FacultyApprovalPage from './components/FacultyApprovalPage';
import LoginPage from "./components/LoginPage";
import { isAuthenticated } from './auth/auth';


// Protects cetain routes from being accessed by unauthenticated users.
function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/LoginPage" replace />;
}

function App() {
  return (
    // font to be replaced with AOF font
    <div style={{ fontFamily: 'Arial' }}>
      <MenuBar />

      <div style={{ padding: '20px' }}>
        <h1>AOF Service</h1>
        <Routes>
          {/* Note: the "/" route is the default route, since I've made the default page the home page it takes the user there */}
          <Route path="/" element={<Navigate to="/leaderboard" replace />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/log" element={<ProtectedRoute><ServiceLogForm /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/faculty-approval" element={<ProtectedRoute><FacultyApprovalPage /></ProtectedRoute>} />
          <Route path="/LoginPage" element={<LoginPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;