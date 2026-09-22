import React from 'react';
import ServiceLogForm from './components/ServiceLogForm';
import MenuBar from './components/MenuBar';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Leaderboard from "./components/Leaderboard";
import RoleDashboard from './components/RoleDashboard';
import ProfilePage from './components/ProfilePage';
import FacultyApprovalPage from './components/FacultyApprovalPage';
import AdminPortal from './components/AdminPortal';
import AdminStudentProfilePage from './components/AdminStudentProfilePage';
import LoginPage from "./components/LoginPage";
import { isAdmin, isAuthenticated, isFacultyAdmin, isFacultyOrAdmin } from './auth/auth';


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
    return <Navigate to="/dashboard" replace />;
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
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/leaderboard"
          element={<Leaderboard />}
        />

        <Route
          path="/log"
          element={isFacultyAdmin() ? <Navigate to="/faculty-approval" replace /> : <ServiceLogForm />}
        />

        <Route
          path="/dashboard"
          element={<RoleDashboard />}
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

        <Route
          path="/admin/students/:userId"
          element={
            <AdminRoute>
              <AdminStudentProfilePage />
            </AdminRoute>
          }
        />

      </Route>

      {/* Handles bad/random URLs */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated() ? "/dashboard" : "/login"}
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;
