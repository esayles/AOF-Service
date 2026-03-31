import React, { useState } from 'react';


function ServiceLogForm() {
    const [selectedValue, setSelectedValue] = useState('');
    const [comments, setComments] = useState('');
    const [hours, setHours] = useState('');

    const handleSelectChange = (e) => {
        setSelectedValue(e.target.value);
    };

    const handleCommentsChange = (e) => {
        setComments(e.target.value);
    };

    const handleHoursChange = (e) => {
        setHours(e.target.value);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', { selectedValue, comments });

        setSelectedValue('');
        setComments('');
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
                    value={comments}
                    onChange={handleCommentsChange}
                    rows="1"
                ></textarea>
            </div>
            <div className="mb-3">
                <label htmlFor="hoursInput" className="form-label">Hours</label>
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
                    value={selectedValue}
                    onChange={handleSelectChange}
                >
                    <option value="">-- Choose an option --</option>
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                </select>
            </div>

            <button type="submit" className="btn btn-primary">Submit</button>
        </form>
    );
}

export default ServiceLogForm;