import React from "react";
import {Table, Card, Container} from "react-bootstrap";
import { fetchLeaderboard } from "../Services/LeaderboardService";

function Leaderboard() {
    const [students, setStudents] = React.useState([]); // State to store the leaderboard data, initialized as an empty array
    const [loading, setLoading] = React.useState(true); // State to track loading status, initialized as true
    const [error, setError] = React.useState("null"); // State to store any error messages, initialized as null
   
    React.useEffect(() => {
        async function loadLeaderboard() {
            try {
                const data = await fetchLeaderboard();
                setStudents(data);
                setLoading(false);
            } catch (error) {
                setError("Failed to fetch leaderboard data");
                setLoading(false);
            }
        }
        loadLeaderboard();
    //The empty array makes this effect runs once on component mount, then again when the count changes.
    //The dependencies can be changed with filters so the leaderboard has live updates... future integration. 
    }, []); 
    

    return (
        //mt-4 and mb-3 are bootstrap classes for margin spacing between elements and edges. 
        <Container className="mt-4">
            <Card>
                <Card.Body>
                    <h2 className= "mb-3">Leaderboard</h2>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>{/* defign the rows and the headers for each cell in the row */}
                                <th>Rank</th>
                                <th>Name</th>
                                <th>Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/*loops through the student varible and finds the index in the array (location on the leaderboard), 
                            and the student element as a whole. This works because the array is sorted in decending order */}
                            {students.map((student, index) => (
                                <tr key={student.id}>
                                    <td>{index + 1}</td> {/*index starts at 0 so add one for accurate ranking*/}
                                    <td>{student.name}</td>
                                    <td>{student.hours}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
}
export default Leaderboard;