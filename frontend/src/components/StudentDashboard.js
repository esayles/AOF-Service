import react from 'react';
import Leaderboard from "./Leaderboard";
import ServiceLogForm from './ServiceLogForm';


function StudentDashboard() {
    return (             
        <div class="container overflow-hidden text-center">
            <div class="row gy-5">
                <div class="col-6">
                    <div class="p-3"><ServiceLogForm></ServiceLogForm></div>
                </div>
                <div class="col-6">
                    <div class="p-3"><Leaderboard></Leaderboard></div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;