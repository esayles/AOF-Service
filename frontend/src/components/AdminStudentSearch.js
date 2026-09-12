import React, { useMemo, useState } from 'react';
import { Button, Spinner, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTableRowLimit } from './TableRowLimit';

function AdminStudentSearch({ users, loading, onRefresh }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Only include users who are currently students.
  const students = useMemo(() => {
    return (users || []).filter((user) => user.role === 'student');
  }, [users]);

  // Search by first name, last name, full name, or email.
  const filteredStudents = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return students;
    }

    return students.filter((student) => {
      const firstName = student.first_name?.toLowerCase() || '';
      const lastName = student.last_name?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const email = student.email?.toLowerCase() || '';

      return (
        firstName.includes(searchValue) ||
        lastName.includes(searchValue) ||
        fullName.includes(searchValue) ||
        email.includes(searchValue)
      );
    });
  }, [students, search]);

  const { visibleRows, rowLimitControl } =
    useTableRowLimit(filteredStudents);

  return (
    <div className="section-card">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h5 className="mb-1">Student Search</h5>
          <p className="text-muted mb-0">
            Search for any student to view their service hours and activity history.
          </p>
        </div>

        <Button
          variant="outline-primary"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <div className="mb-3">
        <label htmlFor="student-search" className="form-label">
          Search students
        </label>

        <input
          id="student-search"
          type="search"
          className="form-control"
          placeholder="Search by name or email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-muted">
          <Spinner animation="border" size="sm" />
          Loading students...
        </div>
      ) : filteredStudents.length === 0 ? (
        <p className="text-muted mb-0">
          No students match your search.
        </p>
      ) : (
        <>
          <p className="text-muted small mb-2">
            {filteredStudents.length} student
            {filteredStudents.length === 1 ? '' : 's'} found
          </p>

          <Table responsive hover bordered className="bg-white mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Profile</th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((student) => {
                const studentName =
                  `${student.first_name} ${student.last_name}`.trim() ||
                  student.email;

                return (
                  <tr key={student.id}>
                    <td>
                      <Button
                        variant="link"
                        className="p-0 text-start"
                        onClick={() =>
                          navigate(`/admin/students/${student.id}`)
                        }
                      >
                        {studentName}
                      </Button>
                    </td>

                    <td>{student.email}</td>

                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() =>
                          navigate(`/admin/students/${student.id}`)
                        }
                      >
                        View Profile
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          {rowLimitControl}
        </>
      )}
    </div>
  );
}

export default AdminStudentSearch;