// A page displaying the user's profile, including their service log summary and a table of their logged activities.

import React, { useEffect, useState } from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { getMyServiceLogs } from '../API';
import { getStudentSummary } from './dashboardUtils';

function ProfilePage() {
  const [serviceLogs, setServiceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

// Fetches the user's service logs from the backend API and updates the state accordingly.
  const loadServiceLogs = async () => {
    try {
      setLoading(true);
      const data = await getMyServiceLogs();
      setServiceLogs(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load your profile right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServiceLogs();
  }, []);

  const summary = getStudentSummary(serviceLogs);

// Render the profile page, including the summary of service logs and a table of logged activities.
  return (
    <div className="container py-4">
      <Card className="border-0 shadow-sm rounded-4" style={{ background: 'linear-gradient(135deg, #f7fbff 0%, #eef5ff 100%)' }}>
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <p className="text-uppercase mb-1" style={{ color: '#4a6fa5', fontSize: '0.8rem', letterSpacing: '0.12em' }}>Profile</p>
              <h2 className="mb-0">Your Contribution Profile</h2>
            </div>
          </div>

          {loading ? (
            <p className="text-muted">Loading your profile...</p>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="border rounded-3 p-3 bg-white h-100">
                    <div className="text-muted small">Total Hours</div>
                    <strong style={{ fontSize: '1.4rem', color: '#1f4e79' }}>{summary.totalHours}</strong>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="border rounded-3 p-3 bg-white h-100">
                    <div className="text-muted small">Pending Approval</div>
                    <strong style={{ fontSize: '1.4rem', color: '#b05d2c' }}>{summary.pendingCount}</strong>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="border rounded-3 p-3 bg-white h-100">
                    <div className="text-muted small">Latest Entry</div>
                    <strong style={{ fontSize: '1rem', color: '#1f4e79' }}>
                      {summary.latestEntry ? summary.latestEntry.description : 'No entries yet'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="border rounded-3 bg-white p-3">
                <h5 className="mb-3">Activity Log</h5>
                {serviceLogs.length === 0 ? (
                  <p className="text-muted mb-0">No activities logged yet.</p>
                ) : (
                  <Table responsive hover size="sm" className="mb-0">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Hours</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{log.description}</td>
                          <td>{log.hours}</td>
                          <td>{log.date_performed}</td>
                          <td>
                            {log.approved_by ? (
                              <Badge bg="success">Approved</Badge>
                            ) : (
                              <Badge bg="warning" text="dark">Pending</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default ProfilePage;
