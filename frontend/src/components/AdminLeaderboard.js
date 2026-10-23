import React, { useEffect, useState } from 'react';
import { Alert, Button, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getAdminLeaderboard } from '../API';
import { useTableRowLimit } from './TableRowLimit';

function AdminLeaderboard({ active }) {
  const [students, setStudents] = useState([]);
  const [period, setPeriod] = useState('total');
  const [minimumHours, setMinimumHours] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { visibleRows, rowLimitControl } = useTableRowLimit(students);

  useEffect(() => {
    if (!active) return undefined;

    let isCurrentRequest = true;
    const loadLeaderboard = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAdminLeaderboard(period, minimumHours);
        if (isCurrentRequest) {
          setStudents(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isCurrentRequest) {
          setError(err.message || 'Unable to load the student leaderboard.');
        }
      } finally {
        if (isCurrentRequest) setLoading(false);
      }
    };

    loadLeaderboard();
    return () => {
      isCurrentRequest = false;
    };
  }, [active, period, minimumHours, refreshKey]);

  return (
    <section className="section-card">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h5 className="mb-1">Student Leaderboard</h5>
          <p className="text-muted mb-0">
            View every student ranked by service hours earned in the selected period.
          </p>
        </div>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-sm-6">
          <label className="form-label" htmlFor="leaderboard-period">Date</label>
          <select
            id="leaderboard-period"
            className="form-select"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <option value="total">All time</option>
            <option value="last-year">Before June 1, 2026</option>
            <option value="this-year">June 1, 2026 onward</option>
          </select>
        </div>
        <div className="col-sm-6">
          <label className="form-label" htmlFor="leaderboard-minimum-hours">Hours earned</label>
          <select
            id="leaderboard-minimum-hours"
            className="form-select"
            value={minimumHours}
            onChange={(event) => setMinimumHours(event.target.value)}
          >
            <option value="">All students</option>
            <option value="30">30+ hours</option>
            <option value="100">100+ hours</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-muted" role="status">
          <Spinner animation="border" size="sm" />
          Loading leaderboard...
        </div>
      ) : error ? (
        <Alert variant="danger" className="mb-0">{error}</Alert>
      ) : students.length === 0 ? (
        <p className="text-muted mb-0">No students match these filters.</p>
      ) : (
        <>
          <p className="text-muted small mb-2">
            {students.length} student{students.length === 1 ? '' : 's'}
          </p>
          <Table responsive hover bordered className="bg-white mb-0">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((student, index) => (
                <tr key={student.user_id}>
                  <td>{index + 1}</td>
                  <td>
                    <Button
                      variant="link"
                      className="p-0 text-start"
                      onClick={() => navigate(`/admin/students/${student.user_id}`)}
                    >
                      {`${student.first_name} ${student.last_name}`.trim() || student.username}
                    </Button>
                  </td>
                  <td>{student.total_hours}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          {rowLimitControl}
        </>
      )}
    </section>
  );
}

export default AdminLeaderboard;
