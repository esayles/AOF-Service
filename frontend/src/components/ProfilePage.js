// A page displaying the user's profile, including their service log summary and a table of their logged activities.

import React, { useEffect, useRef, useState } from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { getMyServiceLogs } from '../API';
import { getStudentSummary } from './dashboardUtils';
import { useTableRowLimit } from './TableRowLimit';

function MilestoneProgress({ hours, goal, label, colorClass }) {
  const safeHours = Number(hours) || 0;
  const percentage = Math.min(
    Math.round((safeHours / goal) * 100),
    100
  );

  return (
    <div className="milestone-item">
      <div
        className={`milestone-circle ${colorClass}`}
        style={{ '--progress': `${percentage}%` }}
      >
        <div className="milestone-circle-inner">
          <strong>{percentage}%</strong>
        </div>
      </div>

      <div className="milestone-label">{label}</div>
      <div className="milestone-hours">
        {Math.min(safeHours, goal)} / {goal} hours
      </div>
    </div>
  );
}


function ProfilePage() {
  const [serviceLogs, setServiceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const clickedCorners = useRef(new Set());

  const handleCornerClick = (corner) => {
    clickedCorners.current.add(corner);

    if (clickedCorners.current.size === 4) {
      setSecretUnlocked(true);
    }
  };

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
  const orderedServiceLogs = [...serviceLogs].sort((a, b) => {
    const dateDifference = new Date(b.date_performed) - new Date(a.date_performed);
    return dateDifference || b.id - a.id;
  });
  const { visibleRows, rowLimitControl } = useTableRowLimit(orderedServiceLogs);

  const approvedHours = serviceLogs
  .filter((log) => {
    const confirmedBy = log.confirmed_by ?? log.approved_by;

    return log.status !== 'declined' && confirmedBy;
  })
  .reduce((sum, log) => sum + Number(log.hours || 0), 0);

// Render the profile page, including the summary of service logs and a table of logged activities.
  return (
    <div className="portal-page container px-0">
      <Card className="portal-surface border-0 secret-profile-card">
        <button
          type="button"
          className="secret-corner secret-corner-top-left"
          onClick={() => handleCornerClick('top-left')}
          aria-label="Top left corner"
        />

        <button
          type="button"
          className="secret-corner secret-corner-top-right"
          onClick={() => handleCornerClick('top-right')}
          aria-label="Top right corner"
        />

        <button
          type="button"
          className="secret-corner secret-corner-bottom-left"
          onClick={() => handleCornerClick('bottom-left')}
          aria-label="Bottom left corner"
        />

        <button
          type="button"
          className="secret-corner secret-corner-bottom-right"
          onClick={() => handleCornerClick('bottom-right')}
          aria-label="Bottom right corner"
        />
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <p className="page-eyebrow">Profile</p>
              <h2 className="page-heading">Your Contribution Profile</h2>
            </div>
          </div>

          <div className="d-flex gap-2 mb-4">
            <button
              className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>

            {secretUnlocked && (
              <button
                className={`btn ${activeTab === 'secret' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setActiveTab('secret')}
              >
                Secret
              </button>
            )}
          </div>

          {activeTab === 'profile' && (
            <>
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
                          {summary.latestEntry
                            ? summary.latestEntry.description
                            : 'No entries yet'}
                        </strong>
                      </div>
                    </div>
                  </div>
                  
                  <div className="section-card milestone-section mb-4">
                    <h5 className="mb-4">Milestones</h5>

                    <div className="milestone-container">
                      <MilestoneProgress
                        hours={approvedHours}
                        goal={30}
                        label="30 Hour Milestone"
                        colorClass="milestone-blue"
                      />

                      <MilestoneProgress
                        hours={approvedHours}
                        goal={100}
                        label="100 Hour Milestone"
                        colorClass="milestone-red"
                      />
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
                                  ) : (log.confirmed_by ?? log.approved_by) ? (
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
            </>
          )}
          {activeTab === 'secret' && secretUnlocked && (
            <div className="section-card">
              <h5 className="mb-3">Thank You</h5>
              <p className="mb-0">Created by: Luca Coletti & Nick Campisi</p>
            </div> 
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default ProfilePage;
