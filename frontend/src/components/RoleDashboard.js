import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getUserRole } from '../auth/auth';

const dashboardContent = {
  student: {
    eyebrow: 'Student portal',
    title: 'Your Service Dashboard',
    description: 'Record your impact, follow approvals, and see how your hours compare.',
    actions: [
      ['Log service hours', 'Submit an activity and choose a faculty verifier.', '/log'],
      ['See the leaderboard', 'Explore the school-wide service rankings.', '/leaderboard'],
      ['View my activity', 'Review pending, approved, and declined submissions.', '/profile'],
    ],
  },
  faculty: {
    eyebrow: 'Faculty portal',
    title: 'Faculty Dashboard',
    description: 'Review assigned requests, record hours for students, and monitor your own profile.',
    actions: [
      ['Add student hours', 'Record confirmed hours for a student.', '/log'],
      ['View leaderboard', 'See the school service rankings.', '/leaderboard'],
      ['Approve requests', 'Review only the service logs requested from you.', '/faculty-approval'],
    ],
  },
  student_admin: {
    eyebrow: 'Student administrator',
    title: 'Student Admin Dashboard',
    description: 'Work as a student while managing users and viewing school activity.',
    actions: [
      ['Log service hours', 'Submit your own hours to a faculty verifier.', '/log'],
      ['School activities', 'Review all previously logged service activities.', '/admin?tab=activities'],
      ['Manage users', 'Update user roles and account access.', '/admin'],
    ],
  },
  faculty_admin: {
    eyebrow: 'Faculty administrator',
    title: 'Faculty Admin Dashboard',
    description: 'Approve assigned requests, manage users, and review the school activity record.',
    actions: [
      ['Log student hours', 'Record confirmed hours on behalf of a student.', '/log'],
      ['Approve requests', 'Review only service logs requested from you.', '/faculty-approval'],
      ['School activities', 'Review all previously logged service activities.', '/admin?tab=activities'],
      ['Manage users', 'Update roles, import users, and manage access.', '/admin'],
    ],
  },
};

function RoleDashboard() {
  const content = dashboardContent[getUserRole()] || dashboardContent.student;

  return (
    <div className="portal-page container px-0">
      <div className="portal-surface">
        <p className="page-eyebrow">{content.eyebrow}</p>
        <h2 className="page-heading mb-2">{content.title}</h2>
        <p className="page-description mb-4">{content.description}</p>

        <div className="row g-3">
          {content.actions.map(([title, description, path]) => (
            <div className="col-lg-4" key={title}>
              <Card className="h-100 dashboard-action-card">
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{title}</Card.Title>
                  <Card.Text className="text-muted flex-grow-1">{description}</Card.Text>
                  <Button as={Link} to={path} variant="primary">Open</Button>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoleDashboard;