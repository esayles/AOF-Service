// Page for faculty members to review and approve pending service logs submitted by students. This page fetches the list of pending logs from the backend API and displays them in a table, allowing faculty to approve each log individually.

import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Spinner, Table } from 'react-bootstrap';
import { getServiceLogs, approveServiceLog } from '../API';
import { canAccessFacultyApproval } from '../auth/auth';

// The FacultyApprovalPage component fetches pending service logs and allows faculty members to approve them.
function FacultyApprovalPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const canView = canAccessFacultyApproval();

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getServiceLogs();
      setLogs(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load pending logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Handles the approval of a service log by calling the approveServiceLog function and updating the list of logs upon success.
  const handleApprove = async (id) => {
    try {
      setActioningId(id);
      await approveServiceLog(id);
      await loadLogs();
    } catch (err) {
      setError(err.message || 'Unable to approve this log.');
    } finally {
      setActioningId(null);
    }
  };

  const pendingLogs = logs.filter((log) => !log.confirmed_by && !log.approved_by);

  // Render the faculty approval page, including the table of pending logs and the approval buttons.
  return (
    <div className="container py-4">
      <div className="p-4 border rounded-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #f7fbff 0%, #eef5ff 100%)' }}>
        <h3 className="mb-3">Faculty Approval Queue</h3>
        <p className="text-muted">Review student service submissions and approve them.</p>

        {!canView ? (
          <Alert variant="warning">Only faculty or admin users can access this page. To test it as a developer, turn on localStorage.setItem('developerTestMode', 'true') in the browser console.</Alert>
        ) : loading ? (
          <div className="d-flex align-items-center gap-2 text-muted">
            <Spinner animation="border" size="sm" />
            Loading submissions...
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : pendingLogs.length === 0 ? (
          <Alert variant="success">No pending logs to review.</Alert>
        ) : (
          <Table bordered hover responsive>
            <thead>
              <tr>
                <th>Student</th>
                <th>Description</th>
                <th>Hours</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.student_name || 'Student'}</td>
                  <td>{log.description}</td>
                  <td>{log.hours}</td>
                  <td>{log.date_performed}</td>
                  <td><Badge bg="warning" text="dark">Pending</Badge></td>
                  <td>
                    <Button size="sm" variant="success" onClick={() => handleApprove(log.id)} disabled={actioningId === log.id}>
                      {actioningId === log.id ? 'Approving...' : 'Approve'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}

export default FacultyApprovalPage;
