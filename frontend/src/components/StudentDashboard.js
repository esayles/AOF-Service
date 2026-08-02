import React, { useEffect, useState } from 'react';
import Leaderboard from './Leaderboard';
import ServiceLogForm from './ServiceLogForm';
import { getServiceLogs } from '../API';
import { getStudentSummary } from './dashboardUtils';

function StudentDashboard() {
    // State variables to manage service logs, loading state, and error messages
    const [serviceLogs, setServiceLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    //Fetches data from the backend API and updates the state with the retrieved service logs. It also handles loading and error states.
    const loadServiceLogs = async () => {
        try {
            setLoading(true);
            const data = await getServiceLogs();
            setServiceLogs(Array.isArray(data) ? data : []);
            setError('');
        } catch (err) {
            setError(err.message || 'Unable to load your service history right now.');
        } finally {
            setLoading(false);
        }
    };

    //Trigger fetch of logs when loading
    useEffect(() => {
        loadServiceLogs();
    }, []);

    const summary = getStudentSummary(serviceLogs);
    
// Render the student dashboard, including the overview of service logs, the form for submitting new logs, and the leaderboard.
    return (
        <div className="container overflow-hidden">
            <div className="row gy-4">
                <div className="col-lg-5">
                    <div className="p-3 border rounded bg-light">
                        <h3 className="mb-3">Student Overview</h3>
                        {loading ? (
                            <p>Loading your activity...</p>
                        ) : error ? (
                            <div className="alert alert-danger">{error}</div>
                        ) : (
                            <>
                                <div className="row g-3 mb-3">
                                    <div className="col-6">
                                        <div className="border rounded p-3 bg-white">
                                            <strong>{summary.totalHours}</strong>
                                            <div className="text-muted">Total hours</div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="border rounded p-3 bg-white">
                                            <strong>{summary.pendingCount}</strong>
                                            <div className="text-muted">Pending approvals</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="border rounded p-3 bg-white">
                                    <h5 className="mb-2">Latest submission</h5>
                                    {summary.latestEntry ? (
                                        <>
                                            <div><strong>{summary.latestEntry.description}</strong></div>
                                            <div>{summary.latestEntry.hours} hours • {summary.latestEntry.date_performed}</div>
                                        </>
                                    ) : (
                                        <div>No submissions yet.</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="col-lg-7">
                    <div className="p-3 border rounded bg-light">
                        <ServiceLogForm onSubmissionSuccess={() => loadServiceLogs()} />
                    </div>
                </div>
            </div>

            <div className="row mt-4">
                <div className="col-12">
                    <Leaderboard />
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;