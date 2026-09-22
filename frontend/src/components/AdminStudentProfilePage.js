// A page for administrators to view a student's profile and activity history by clicking on their name in the student list or leaderboard.

import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Spinner, Table } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { getAdminStudentProfile } from '../API';
import { getStudentSummary } from './dashboardUtils';
import { useTableRowLimit } from './TableRowLimit';

function AdminStudentProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [serviceLogs, setServiceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStudentProfile() {
      try {
        setLoading(true);
        const data = await getAdminStudentProfile(userId);
        setStudent(data.student);
        setServiceLogs(Array.isArray(data.service_logs) ? data.service_logs : []);
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load this student profile.');
      } finally {
        setLoading(false);
      }
    }

    loadStudentProfile();
  }, [userId]);

  const summary = getStudentSummary(serviceLogs);
  const { visibleRows, rowLimitControl } = useTableRowLimit(serviceLogs);
  const studentName = student ? `${student.first_name} ${student.last_name}`.trim() || student.username : 'Student';

  return (
    <div className="portal-page container px-0">
      <Card className="portal-surface border-0">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
            <div>
              <p className="page-eyebrow">Administrator view</p>
              <h2 className="page-heading">{studentName}&apos;s Contribution Profile</h2>
            </div>
            <Button variant="outline-primary" size="sm" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <Spinner animation="border" size="sm" />
              Loading student profile...
            </div>
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
                      {summary.latestEntry?.description || 'No entries yet'}
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
                              {log.status === 'declined' ? (
                                <Badge bg="danger">Declined</Badge>
                              ) : log.confirmed_by ? (
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

export default AdminStudentProfilePage;
