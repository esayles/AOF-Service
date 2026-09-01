import React, { useEffect, useState } from 'react';
import { createServiceLog, getFaculty, getStudents } from '../API';
import { isFacultyOrAdmin } from '../auth/auth';


function ServiceLogForm({ onSubmissionSuccess, showHeading = true }) {
    const staffUser = isFacultyOrAdmin();
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [teacherSearch, setTeacherSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [description, setDescription] = useState('');
    const [hours, setHours] = useState('');
    const [faculty, setFaculty] = useState([]);
    const [students, setStudents] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    useEffect(() => {
        if (!staffUser){
            getFaculty()
                .then((data) => setFaculty(Array.isArray(data) ? data : []))
                .catch((error) => console.error('Error loading faculty list:', error));
        }
        if (staffUser) {
            getStudents()
                .then((data) => setStudents(Array.isArray(data) ? data : []))
                .catch((error) => console.error('Error loading student list:', error));
        } 
    }, [staffUser]);

    const getStudentLabel = (student) => {
        if (student.first_name || student.last_name) {
            return `${student.last_name}, ${student.first_name}`;
        }
    
        return student.email;
    };
    
    
    const getTeacherLabel = (teacher) => {
        if (teacher.first_name || teacher.last_name) {
            return `${teacher.last_name}, ${teacher.first_name}`;
        }
    
        return teacher.email;
    };

    const handleTeacherChange = (e) => {
        const value = e.target.value;

        setTeacherSearch(value);

        const teacher = faculty.find(
            (teacher) => getTeacherLabel(teacher) === value
        );

        if (teacher) {
            setSelectedTeacher(teacher.id);
        } else {
            setSelectedTeacher('');
    }
    };

    const handleStudentChange = (e) => {
        const value = e.target.value;
    
        setStudentSearch(value);
    
        const student = students.find(
            (student) => getStudentLabel(student) === value
        );
    
        if (student) {
            setSelectedStudent(student.id);
        } else {
            setSelectedStudent('');
        }
    };

    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
    };

    const handleHoursChange = (e) => {
        setHours(e.target.value);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ type: '', message: '' });

        if (!description.trim() || !hours) {
            setFeedback({ type: 'error', message: 'Please add a description and hours before submitting.' });
            return;
        }

        if (staffUser && !selectedStudent) {
            setFeedback({
                type: 'error',
                message: 'Please choose the student whose hours are being logged.'
            });
            return;
        }

        const payload = {
            description: description.trim(),
            hours: parseFloat(hours),
            date_performed: new Date().toISOString().slice(0, 10),
            ...(staffUser && selectedStudent
                ? { student: parseInt(selectedStudent, 10) }
                : {}),
            
            ...(!staffUser && selectedTeacher
                ? { request_verifier: parseInt(selectedTeacher, 10) }
                : {}),
        };

        setIsSubmitting(true);

        try {
            const result = await createServiceLog(payload);
            setFeedback({ type: 'success', message: 'Your service hours were submitted successfully.' });
            setSelectedTeacher('');
            setSelectedStudent('');
            setDescription('');
            setHours('');
            setTeacherSearch('');
            setStudentSearch('');
            
            if (onSubmissionSuccess) {
                onSubmissionSuccess(result);
            }
        // Handle any errors that occur during the submission
        } catch (error) {
            setFeedback({ type: 'error', message: error.message || 'Something went wrong while submitting your hours.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="section-card service-log-form" onSubmit={handleSubmit}>
            {showHeading && (
                <>
                    <p className="page-eyebrow">New submission</p>
                    <h2 className="page-heading mb-3">Log Service Hours</h2>
                </>
            )}
            {staffUser && (
                <div className="mb-3">
                    <label htmlFor="studentSelect" className="form-label">
                        Choose Student
                    </label>

                    <input
                        id="studentSelect"
                        className="form-control"
                        list="studentOptions"
                        placeholder="Type or choose a student"
                        value={studentSearch}
                        onChange={handleStudentChange}
                        autoComplete="off"
                    />

                    <datalist id="studentOptions">
                        {students.map((student) => (
                            <option
                                key={student.id}
                                value={getStudentLabel(student)}
                            />
                        ))}
                    </datalist>
                </div>
            )}
            <div className="mb-3">
                <label htmlFor="floatingTextarea" className="form-label">Short Job Description</label>
                <textarea 
                    className="form-control" 
                    id="floatingTextarea" 
                    placeholder="Leave a comment here"
                    value={description}
                    onChange={handleDescriptionChange}
                    rows="1"
                ></textarea>
            </div>
            <div className="mb-3">
                <label htmlFor="hoursInput" className="form-label">Number of Hours</label>
                <input 
                    type="number"
                    id="hoursInput"
                    className="form-control"
                    placeholder='Enter Hours (e.g., 1.25)'
                    value={hours}
                    onChange={handleHoursChange}
                    step="0.25"
                    min="0.25"
                />
            </div>
            {!staffUser && (
                <div className="mb-3">
                    <label htmlFor="selectOption" className="form-label">Choose a faculty member to approve this activity</label>
                    
                    <input 
                         id="teacherSelect"
                         className="form-control"
                         list="teacherOptions"
                         placeholder="Type or choose a faculty member"
                         value={teacherSearch}
                         onChange={handleTeacherChange}
                         autoComplete="off"
                    />
                    <datalist id="teacherOptions">
                        {faculty.map((teacher) => (
                            <option
                                key={teacher.id}
                                value={getTeacherLabel(teacher)}
                            />
                        ))}
                    </datalist>
                </div>
            )}
            
            {feedback.message ? (
                <div className={`alert ${feedback.type === 'error' ? 'alert-danger' : 'alert-success'}`} role="alert">
                    {feedback.message}
                </div>
            ) : null}

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
        </form>
    );
}

export default ServiceLogForm;
