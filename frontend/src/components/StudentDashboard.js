import react from 'react';

import Leaderboard from "./Leaderboard";
import ServiceLogForm from './ServiceLogForm';


function StudentDashboard() {
    return (
        <div className="container overflow-hidden text-center">
            <div className="row gy-5">
                <div className="col-lg-6">
                    <div className="p-3"><ServiceLogForm /></div>
                </div>
                <div className="col-lg-6">
                    <div className="p-3"><Leaderboard /></div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;