// Page for faculty members to review and approve pending service logs submitted by students—the page they go to when recieving an email notification prompting this approval.

import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Spinner, Table } from 'react-bootstrap';
// Import API functions for interacting with the backend
import {
  approveServiceLog,
  createServiceLog,
  getServiceLogs,
  getStudents,
  updateServiceLog,
} from '../API';

const emptyForm = () => ({
  student: '',
  description: '',
  hours: '',
  date_performed: new Date().toISOString().slice(0, 10),
});

// The FacultyApprovalPage component fetches pending service logs and allows faculty members to approve them.
function FacultyApprovalPage() {
  const [logs, setLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, studentsData] = await Promise.all([getServiceLogs(), getStudents()]);
      setLogs(Array.isArray(logsData) ? logsData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setEditingLog(null);
    setForm(emptyForm());
  };

  // Handles the submission of the form for adding or editing a service log. It calls either createServiceLog or updateServiceLog based on whether a log is being edited.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      description: form.description.trim(),
      hours: Number(form.hours),
      date_performed: form.date_performed,
    };

    try {
      setActioningId(editingLog ? editingLog.id : 'new');
      if (editingLog) {
        await updateServiceLog(editingLog.id, payload);
        setSuccess('Service log updated.');
      } else {
        await createServiceLog({ ...payload, student: Number(form.student) });
        setSuccess('Confirmed service hours added for the student.');
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to save this service log.');
    } finally {
      setActioningId(null);
    }
  };

  const startEditing = (log) => {
    setSuccess('');
    setError('');
    setEditingLog(log);
    setForm({
      student: String(log.student),
      description: log.description,
      hours: String(log.hours),
      date_performed: log.date_performed,
    });
  };

  const newestFirstLogs = [...logs].sort((a, b) => {
    const dateOrder = new Date(b.date_performed) - new Date(a.date_performed);
    return dateOrder || b.id - a.id;
  });

  return (
    <div className="portal-page container px-0">
      <div className="portal-surface">
        <p className="page-eyebrow">Faculty portal</p>
        <h3 className="page-heading">Faculty Service Hours</h3>
        <p className="page-description">Approve submissions, correct records, or add confirmed hours for a student.</p>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <form className="section-card mb-4" onSubmit={handleSubmit}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">{editingLog ? 'Edit Service Log' : 'Add Confirmed Hours'}</h5>
            {editingLog && <Button variant="outline-secondary" size="sm" type="button" onClick={resetForm}>Cancel edit</Button>}
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label" htmlFor="student">Student</label>
              <select
                className="form-select"
                id="student"
                name="student"
                value={form.student}
                onChange={handleChange}
                disabled={Boolean(editingLog)}
                required
              >
                <option value="">Choose a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.last_name}, {student.first_name} ({student.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="description">Description</label>
              <input className="form-control" id="description" name="description" value={form.description} onChange={handleChange} required />
            </div>
            <div className="col-md-2">
              <label className="form-label" htmlFor="hours">Hours</label>
              <input className="form-control" id="hours" name="hours" type="number" min="0.25" step="0.25" value={form.hours} onChange={handleChange} required />
            </div>
            <div className="col-md-2">
              <label className="form-label" htmlFor="date_performed">Date</label>
              <input className="form-control" id="date_performed" name="date_performed" type="date" max={new Date().toISOString().slice(0, 10)} value={form.date_performed} onChange={handleChange} required />
            </div>
          </div>
          <Button className="mt-3" type="submit" disabled={actioningId === 'new' || Boolean(editingLog && actioningId === editingLog.id)}>
            {editingLog ? 'Save Changes' : 'Add Confirmed Hours'}
          </Button>
        </form>

        {loading ? (
          <div className="d-flex align-items-center gap-2 text-muted">
            <Spinner animation="border" size="sm" />
            Loading submissions...
          </div>
        ) : logs.length === 0 ? (
          <Alert variant="success">No service logs to review.</Alert>
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
              {newestFirstLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.student_name}</td>
                  <td>{log.description}</td>
                  <td>{log.hours}</td>
                  <td>{log.date_performed}</td>
                  <td>{log.confirmed_by ? <Badge bg="success">Confirmed</Badge> : <Badge bg="warning" text="dark">Pending</Badge>}</td>
                  <td>
                    {!log.confirmed_by && <Button className="me-2" size="sm" variant="success" onClick={() => handleApprove(log.id)} disabled={actioningId === log.id}>{actioningId === log.id ? 'Approving...' : 'Approve'}</Button>}
                    <Button size="sm" variant="outline-primary" onClick={() => startEditing(log)}>Edit</Button>
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
