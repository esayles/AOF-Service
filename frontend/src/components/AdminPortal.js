/*
This page serves as a portal for admins (developers) to manage users and import the school user directory.
FYI — after the inital CSV upload, you can also update users by uploading a new CSV with the same email addresses and new roles. 
Users not included in the CSV will be kept.
*/

import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Spinner, Tab, Table, Tabs } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  deleteAdminUser,
  getAdminUsers,
  getAdminPreferences,
  getAdminActivities,
  importAdminUsers,
  updateAdminUserRole,
  updateAdminPreferences,
} from '../API';
import { getUserId, isAdmin, setUserRole } from '../auth/auth';
import { useTableRowLimit } from './TableRowLimit';
import AdminStudentSearch from './AdminStudentSearch';

function AdminPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actioningUserId, setActioningUserId] = useState(null);
  const [autoApproveHours, setAutoApproveHours] = useState(true);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const { visibleRows, rowLimitControl } = useTableRowLimit(users);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      setPreferencesLoading(true);
  
      const data = await getAdminPreferences();
  
      setAutoApproveHours(data.auto_approve_service_hours);
    } catch (err) {
      setError(err.message || 'Unable to load admin preferences.');
    } finally {
      setPreferencesLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);
      const data = await getAdminActivities();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load school activities.');
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadPreferences();
  }, []);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const result = await importAdminUsers(file);
      setSuccess(
        `Imported ${result.total_processed} users: ${result.created} created, ${result.updated} updated, and ${result.unchanged} unchanged.`
      );
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Unable to import users.');
    } finally {
      event.target.value = '';
      setUploading(false);
    }
  };

  // Method for changing/promoting a user's role (PUT request to the backend).
  const handleRoleChange = async (user, role) => {
    if (role === user.role) return;

    setError('');
    setSuccess('');
    setActioningUserId(user.id);
    try {
      await updateAdminUserRole(user.id, role);
      if (String(user.id) === getUserId()) {
        setUserRole(role);
        if (!isAdmin()) {
          window.location.assign('/dashboard');
          return;
        }
      }
      setSuccess(`Updated ${user.email} to ${role}.`);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Unable to update this user role.');
      await loadUsers();
    } finally {
      setActioningUserId(null);
    }
  };

  const handleAutoApproveChange = async (event) => {
    const newValue = event.target.checked;
  
    setError('');
    setSuccess('');
    setPreferencesSaving(true);
  
    try {
      const data = await updateAdminPreferences({
        auto_approve_service_hours: newValue,
      });
  
      setAutoApproveHours(data.auto_approve_service_hours);
  
      setSuccess(
        data.auto_approve_service_hours
          ? 'Admin-created service hours will now be automatically approved.'
          : 'Admin-created service hours will now remain pending for testing.'
      );
    } catch (err) {
      setError(err.message || 'Unable to update admin preferences.');
    } finally {
      setPreferencesSaving(false);
    }
  };

  //Method for deleting a user from the program (DELETE request to the backend). This also deletes all service-hour records associated with the user.
  const handleDelete = async (user) => {
    if (!window.confirm(`Remove ${user.email}? This permanently deletes the account and related service-hour records.`)) {
      return;
    }

    setError('');
    setSuccess('');
    setActioningUserId(user.id);
    try {
      await deleteAdminUser(user.id);
      setSuccess(`Removed ${user.email}.`);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Unable to remove this user.');
    } finally {
      setActioningUserId(null);
    }
  };
  
  return (
    <div className="portal-page container px-0">
      <div className="portal-surface">
        <p className="page-eyebrow">Administration</p>
        <h2 className="page-heading">Admin Portal</h2>
        <p className="page-description">Manage application users and import the school user directory.</p>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Tabs activeKey={searchParams.get('tab') || 'users'} onSelect={(key) => navigate(key === 'users' ? '/admin' : `/admin?tab=${key}`)} className="mb-3">
          <Tab eventKey="users" title="Manage Users">
            <div className="section-card mb-4">
              <h5>Import users from CSV</h5>
              <p className="text-muted mb-3">
                Upload the school CSV with <code>First Name</code>, <code>Last Name</code>, <code>Email 1</code>, and <code>Roles</code> columns. Existing users are updated; users not included in the CSV are kept.
              </p>
              <label className="form-label" htmlFor="users-csv">Users CSV</label>
              <div className="d-flex align-items-center gap-2">
                <input
                  className="form-control"
                  id="users-csv"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                {uploading && <Spinner animation="border" size="sm" aria-label="Uploading" />}
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">All Users ({users.length})</h5>
              <Button variant="outline-primary" size="sm" onClick={loadUsers} disabled={loading}>Refresh</Button>
            </div>

            {loading ? (
              <div className="text-muted"><Spinner animation="border" size="sm" className="me-2" />Loading users...</div>
            ) : (
              <>
                <Table responsive hover bordered className="bg-white mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((user) => (
                      <tr key={user.id}>
                        <td>
                          {['student', 'student_admin'].includes(user.role) ? (
                            <Button
                              variant="link"
                              className="p-0 text-start"
                              onClick={() => navigate(`/admin/students/${user.id}`)}
                            >
                              {`${user.first_name} ${user.last_name}`.trim() || user.email}
                            </Button>
                          ) : (
                            `${user.first_name} ${user.last_name}`.trim() || '—'
                          )}
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <select
                            className="form-select form-select-sm text-capitalize"
                            value={user.role}
                            onChange={(event) => handleRoleChange(user, event.target.value)}
                            disabled={actioningUserId === user.id}
                            aria-label={`Role for ${user.email}`}
                          >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="student_admin">Student Admin</option>
                            <option value="faculty_admin">Faculty Admin</option>
                            <option value="admin">Admin (legacy)</option>
                          </select>
                        </td>
                        <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            disabled={actioningUserId === user.id}
                          >
                            {actioningUserId === user.id ? 'Working...' : 'Remove'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {rowLimitControl}
              </>
            )}
          </Tab>

          <Tab eventKey="testing" title="Testing">
            <div className="section-card">
              <h5>Service Hour Testing</h5>

              <p className="text-muted">
                These settings only affect your administrator account and are intended
                for testing application behavior.
              </p>

              {preferencesLoading ? (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <Spinner animation="border" size="sm" />
                  Loading preferences...
                </div>
              ) : (
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="autoApproveHours"
                    checked={autoApproveHours}
                    onChange={handleAutoApproveChange}
                    disabled={preferencesSaving}
                  />

                  <label
                    className="form-check-label"
                    htmlFor="autoApproveHours"
                  >
                    Auto-approve service hours I create
                  </label>
                </div>
              )}
              <p className="text-muted mt-2 mb-0">
                When disabled, service hours you create will remain pending so you can
                test the approval workflow.
              </p>
            </div>
            <AdminStudentSearch
                  users={users}
                  loading={loading}
                  onRefresh={loadUsers}
            />
          </Tab>

          <Tab eventKey="activities" title="Activities" onEnter={loadActivities}>
            <div className="section-card">
              <h5>School Activities</h5>
              <p className="text-muted">Previously logged service activities across the school.</p>
              {activitiesLoading ? (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <Spinner animation="border" size="sm" />
                  Loading activities...
                </div>
              ) : activities.length === 0 ? (
                <p className="text-muted mb-0">No activities have been logged yet.</p>
              ) : (
                <Table responsive hover bordered className="bg-white mb-0">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Description</th>
                      <th>Hours</th>
                      <th>Date</th>
                      <th>Verifier</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => (
                      <tr key={activity.id}>
                        <td>{activity.student_name}</td>
                        <td>{activity.description}</td>
                        <td>{activity.hours}</td>
                        <td>{activity.date_performed}</td>
                        <td>{activity.verifier_name || '—'}</td>
                        <td>
                          {activity.status === 'declined' ? <Badge bg="danger">Declined</Badge> : activity.status === 'confirmed' ? <Badge bg="success">Confirmed</Badge> : <Badge bg="warning" text="dark">Pending</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}

export default AdminPortal;
