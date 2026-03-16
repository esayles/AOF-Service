import React, { useState } from 'react';
//import Select from 'react-select';

// Note: this can be changed to howeever you want, this is for Sayles

function ServiceLogForm() {       //dont need this bc it is can be fetched from logged google account.
    const [email, setEmail] = useState(''); // State to store email input value
    const [jobDescription, setJobDescription] = useState('');
    const [hoursWorked, setHoursWorked] = useState('');
    const [teacherList, setTeacherList] = useState(null);

    const handleChange = (event) => {
        setEmail(event.target.value); // Update state on input change
    };

    const handleJobDescriptionChange = (event) => {
        setJobDescription(event.target.value); // Update state on job description input change
    };

    const handleHoursWorkedChange = (event) => {
        setHoursWorked(event.target.value); // Update state on hours worked input change
    }

    const handleTeacherListChange = (selectedOption) => {
        setTeacherList(selectedOption);
    };

    const handleSubmit = (event) => {
        event.preventDefault(); // Prevent default form submission behavior
        console.log('Submitted Email:', email); // Log the submitted email
        console.log("Submitted Job Description:", jobDescription); // Log the submitted job description
        console.log("Submitted Hours Worked: ", hoursWorked); // Log the submitted hours worked
        console.log("Submitted Teacher: ", teacherList); // Log the submitted teacher
        setEmail(''); // Clear the input field after submission
        setJobDescription(''); // Clear job description field after submission
        setHoursWorked(''); // Clear hours worked field after submission
        setTeacherList(null); // Clear selected teacher after submission
    };

    return (
        <form onSubmit = {handleSubmit}>
            <div>
            <label htmlFor = "emailInput">Email: </label>
            <input 
                type = "email"
                id = "emailInput"
                value={email}
                onChange={handleChange}
                placeholder = "Enter your email"
                style = {{width: '250px', fontSize: '16px'}}
                required
            />
            </div>
            <br/>
            <div>
            <label htmlFor = "Short Job Description">Service Activity: </label>
            <input
                type = "text"
                id = "Job Description"
                value = {jobDescription}
                onChange = {handleJobDescriptionChange}
                placeholder = "Enter a short description of the job"
                style = {{width: '300px', fontSize: '16px'}}
                required
            />
            </div>
            <br/>
            <div>
                <label htmlFor = "Number of Hours">Hours Worked: </label>
                <input
                    type = "number"
                    id = "hours Worked"
                    value = {hoursWorked}
                    onChange = {handleHoursWorkedChange}
                    placeholder = "Enter number of hours worked"
                    style = {{width: '250px', fontSize: '16px'}}
                    required
                />
            </div>
            <br/>
            <button type = "submit">Submit Application Info</button>
        </form>   
    );

}

export default ServiceLogForm;