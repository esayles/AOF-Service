//Interface for editing a service log. It is a "modal" that pops up when the user clicks the "Edit" button on a service log. 
//It allows the user to edit the description, hours, and date performed of the service log. 

import React, { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

function EditServiceLogModal({ log, onHide, onSave, saving }) {
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [datePerformed, setDatePerformed] = useState('');

  useEffect(() => {
    if (!log) return;
    setDescription(log.description);
    setHours(log.hours);
    setDatePerformed(log.date_performed);
  }, [log]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({ description, hours, date_performed: datePerformed });
  };

  return (
    <Modal show={Boolean(log)} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit service log</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="edit-log-description">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="edit-log-hours">
            <Form.Label>Hours</Form.Label>
            <Form.Control
              type="number"
              min="0.25"
              step="0.25"
              required
              value={hours}
              onChange={(event) => setHours(event.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="edit-log-date">
            <Form.Label>Date performed</Form.Label>
            <Form.Control
              type="date"
              required
              value={datePerformed}
              onChange={(event) => setDatePerformed(event.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default EditServiceLogModal;