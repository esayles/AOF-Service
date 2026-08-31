import React from 'react';
import ServiceLogForm from './components/ServiceLogForm';
import MenuBar from './components/MenuBar';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Leaderboard from "./components/Leaderboard";
import StudentDashboard from './components/StudentDashboard';
import ProfilePage from './components/ProfilePage';
import FacultyApprovalPage from './components/FacultyApprovalPage';
import AdminPortal from './components/AdminPortal';
import LoginPage from "./components/LoginPage";
import { isAdmin, isAuthenticated, isFacultyOrAdmin } from './auth/auth';


// Everything inside this layout requires login
function ProtectedLayout() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <MenuBar />

      <main className="app-content">
        <h1 className="app-page-title">AOF Service</h1>
        <Outlet />
      </main>
    </div>
  );
}


// Stops logged-in users from going back to the login page
function LoginRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/leaderboard" replace />;
  }

  return <LoginPage />;
}


function FacultyRoute({ children }) {
  return isFacultyOrAdmin()
    ? children
    : <Navigate to="/dashboard" replace />;
}


function AdminRoute({ children }) {
  return isAdmin()
    ? children
    : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <Routes>

      {/* The ONLY page available while logged out */}
      <Route path="/login" element={<LoginRoute />} />

      {/* Everything inside here requires authentication */}
      <Route element={<ProtectedLayout />}>

        <Route
          path="/"
          element={<Navigate to="/leaderboard" replace />}
        />

        <Route
          path="/leaderboard"
          element={<Leaderboard />}
        />

        <Route
          path="/log"
          element={<ServiceLogForm />}
        />

        <Route
          path="/dashboard"
          element={<StudentDashboard />}
        />

        <Route
          path="/profile"
          element={<ProfilePage />}
        />

        <Route
          path="/faculty-approval"
          element={
            <FacultyRoute>
              <FacultyApprovalPage />
            </FacultyRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPortal />
            </AdminRoute>
          }
        />

      </Route>

      {/* Handles bad/random URLs */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated() ? "/leaderboard" : "/login"}
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;
