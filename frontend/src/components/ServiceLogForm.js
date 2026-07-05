import React, { useEffect, useState } from 'react';
import { createServiceLog, getFaculty } from '../API';


function ServiceLogForm() {
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [description, setDescription] = useState('');
    const [hours, setHours] = useState('');
    const [faculty, setFaculty] = useState([]);

    useEffect(() => {
        getFaculty()
            .then((data) => setFaculty(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error loading faculty list:', error));
    }, []);

    const handleTeacherChange = (e) => {
        setSelectedTeacher(e.target.value);
    };

    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
    };

    const handleHoursChange = (e) => {
        setHours(e.target.value);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            description: description,
            hours: parseFloat(hours),
            date_performed: new Date().toISOString().slice(0, 10), // Format as YYYY-MM-DD
            ...(selectedTeacher ? { request_verifier: parseInt(selectedTeacher, 10) } : {}),
        };

        try {
            const result = await createServiceLog(payload);
            console.log('Service log created:', result);
        } catch (error) {
            console.error('Error creating service log:', error);
        }  

        setSelectedTeacher('');
        setDescription('');
        setHours('');


    };

    return (
        <form onSubmit={handleSubmit}>
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
                    min="0"
                />
            </div>
            <div className="mb-3">
                <label htmlFor="selectOption" className="form-label">Choose a faculty member to approve this activity</label>
                <select 
                    id="selectOption"
                    className="form-select" 
                    aria-label="Default select example"
                    value={selectedTeacher}
                    onChange={handleTeacherChange}
                >
                    <option value="">-- Choose an option --</option>
                    {faculty.map((f) => (
                        <option key={f.id} value={f.id}>
                            {f.last_name}, {f.first_name}
                        </option>
                    ))}
                </select>
            </div>

            <button type="submit" className="btn btn-primary">Submit</button>
        </form>
    );
}

export default ServiceLogForm;