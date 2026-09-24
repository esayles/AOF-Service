// Page for faculty members to review and approve pending service logs submitted by students—the page they go to when recieving an email notification prompting this approval.

import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Spinner, Table } from 'react-bootstrap';
// Import API functions for interacting with the backend
import {
  approveServiceLog,
  declineServiceLog,
  getServiceLogs,
} from '../API';
import { useTableRowLimit } from './TableRowLimit';

// The FacultyApprovalPage component fetches pending service logs and allows faculty members to approve them.
function FacultyApprovalPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actioningId, setActioningId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const logsData = await getServiceLogs();
      setLogs(Array.isArray(logsData) ? logsData : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load service logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handles the approval of a service log by calling the approveServiceLog function and updating the list of logs upon success.
  const handleApprove = async (id) => {
    try {
      setActioningId(id);
      await approveServiceLog(id);
      setSuccess('Service hours confirmed.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to approve this log.');
    } finally {
      setActioningId(null);
    }
  };

  const handleDecline = async (id) => {
    if (!window.confirm('Decline this submission? It will remain visible to the student as declined.')) {
      return;
    }

    try {
      setActioningId(id);
      await declineServiceLog(id);
      setSuccess('Service hour submission declined.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to decline this log.');
    } finally {
      setActioningId(null);
    }
  };

  const pendingLogs = logs.filter((log) => log.status === 'pending');
  const sortedLogs = [...pendingLogs].sort((a, b) => {
    const dateOrder = new Date(b.date_performed) - new Date(a.date_performed);
    return dateOrder || b.id - a.id;
  });
  const { visibleRows, rowLimitControl } = useTableRowLimit(sortedLogs);

  return (
    <div className="portal-page container px-0">
      <div className="portal-surface">
        <p className="page-eyebrow">Faculty portal</p>
        <h3 className="page-heading">Faculty Service Hours</h3>
        <p className="page-description">Approve or decline service-hour requests assigned to you as verifier.</p>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {loading ? (
          <div className="d-flex align-items-center gap-2 text-muted">
            <Spinner animation="border" size="sm" />
            Loading submissions...
          </div>
        ) : pendingLogs.length === 0 ? (
          <Alert variant="success">No service logs to review.</Alert>
        ) : (
          <>
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
                {visibleRows.map((log) => (
                  <tr key={log.id}>
                    <td>{log.student_name}</td>
                    <td>{log.description}</td>
                    <td>{log.hours}</td>
                    <td>{log.date_performed}</td>
                    <td>{log.status === 'declined' ? <Badge bg="danger">Declined</Badge> : log.confirmed_by ? <Badge bg="success">Confirmed</Badge> : <Badge bg="warning" text="dark">Pending</Badge>}</td>
                    <td>
                      {!log.confirmed_by && log.status !== 'declined' && <Button className="me-2" size="sm" variant="success" onClick={() => handleApprove(log.id)} disabled={actioningId === log.id}>{actioningId === log.id ? 'Approving...' : 'Approve'}</Button>}
                      <Button size="sm" variant="danger" onClick={() => handleDecline(log.id)} disabled={actioningId === log.id}>{actioningId === log.id ? 'Declining...' : 'Decline'}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {rowLimitControl}
          </>
        )}
      </div>
    </div>
  );
}

export default FacultyApprovalPage;
