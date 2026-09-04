// A page displaying the user's profile, including their service log summary and a table of their logged activities.

import React, { useEffect, useState } from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { getMyServiceLogs } from '../API';
import { getStudentSummary } from './dashboardUtils';
import { useTableRowLimit } from './TableRowLimit';

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
  const { visibleRows, rowLimitControl } = useTableRowLimit(serviceLogs);

// Render the profile page, including the summary of service logs and a table of logged activities.
  return (
    <div className="portal-page container px-0">
      <Card className="portal-surface border-0">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <p className="page-eyebrow">Profile</p>
              <h2 className="page-heading">Your Contribution Profile</h2>
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
                  <div className="metric-card">
                    <div className="metric-label">Total Hours</div>
                    <strong>{summary.totalHours}</strong>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="metric-card">
                    <div className="metric-label">Pending Approval</div>
                    <strong>{summary.pendingCount}</strong>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="metric-card">
                    <div className="metric-label">Latest Entry</div>
                    <strong style={{ fontSize: '1rem' }}>
                      {summary.latestEntry ? summary.latestEntry.description : 'No entries yet'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="section-card">
                <h5 className="mb-3">Activity Log</h5>
                {serviceLogs.length === 0 ? (
                  <p className="text-muted mb-0">No activities logged yet.</p>
                ) : (
                  <>
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
                        {visibleRows.map((log) => (
                          <tr key={log.id}>
                            <td>{log.description}</td>
                            <td>{log.hours}</td>
                            <td>{log.date_performed}</td>
                            <td>
                              {(log.confirmed_by ?? log.approved_by) ? (
                                <Badge bg="success">Approved</Badge>
                              ) : (
                                <Badge bg="warning" text="dark">Pending</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    {rowLimitControl}
                  </>
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
