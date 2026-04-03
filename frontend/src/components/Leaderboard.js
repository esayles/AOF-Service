import React from "react";
import {Table, Card, Container} from "react-bootstrap";
import { fetchLeaderboard } from "../Services/LeaderboardService";

function Leaderboard() {
    const [students, setStudents] = React.useState([]); // State to store the leaderboard data, initialized as an empty array
    const [loading, setLoading] = React.useState(true); // State to track loading status, initialized as true
    const [error, setError] = React.useState(null); // State to store any error messages, initialized as null
    const [hoveredRow, setHoveredRow] = React.useState(null);
   
    React.useEffect(() => {
        async function loadLeaderboard() {
            try {
                const data = await fetchLeaderboard();
                setStudents(data);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        }
        loadLeaderboard();
    //The empty array makes this effect runs once on component mount, then again when the count changes.
    //The dependencies can be changed with filters so the leaderboard has live updates... future integration. 
    }, []); 


    //sets custom colors for the rows, makes the top three gold, silver, and bronze respectivly. 
    function getRowStyle(index, isHovered) {
        const base = {
          fontWeight: index < 3 ? "bold" : "normal",
          transition: "all 0.2s ease-in-out",
          cursor: "pointer",
        };
      
        // default (non-top 3 rows)
        let style = {
          ...base, // spread operator to include the base styles, saves a lot of code and makes it easier to read. 
          backgroundColor: isHovered
            ? "rgba(0, 123, 255, 0.07)" // color that was recomended by google not sure I like it (0,0,0,.8) to revert to normal. 
            : "transparent",
        };
      
        // override for top 3
        if (index === 0) {
          style = {
            ...base,
            backgroundColor: isHovered
              ? "rgba(255, 215, 0, 0.22)"
              : "rgba(255, 215, 0, 0.10)",
            border: "2px solid #FFD700",
          };
        }
      
        if (index === 1) {
          style = {
            ...base,
            backgroundColor: isHovered
              ? "rgba(192, 192, 192, 0.22)"
              : "rgba(192, 192, 192, 0.10)",
            border: "2px solid #C0C0C0",
          };
        }
      
        if (index === 2) {
          style = {
            ...base,
            backgroundColor: isHovered
              ? "rgba(205, 127, 50, 0.22)"
              : "rgba(205, 127, 50, 0.10)",
            border: "2px solid #CD7F32",
          };
        }
      
        return style;
      }

    //loading message for slow connection.
    if (loading){
        return <p>loading...</p>;
    }
    //red error message if connection failed. 
    if (error){
        return <p style={{ color: "red"}}>{error}</p>;
    }

    console.log("TOKEN:", localStorage.getItem("access"));
    return (
        //mt-4 and mb-3 are bootstrap classes for margin spacing between elements and edges. 
        <Container className="mt-4">
            <Card>
                <Card.Body>
                    <h2 className= "mb-3">Leaderboard</h2>
                    <Table striped bordered hover responsive>
                            {/* defign the rows and the headers for each cell in the row */}
                        <thead>
                            <tr> 
                                <th>Rank</th>
                                <th>Name</th>
                                <th>Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/*loops through the student varible and finds the index in the array (location on the leaderboard), 
                            and the student element as a whole. This works because the array is sorted in decending order */}
                            {/*index starts at 0 so add one for accurate ranking*/}
                            {students.map((student, index) => (
                                <tr key={student.id ?? `${student.name}-${index}`}
                                    style={getRowStyle(index, true)}
                                    onMouseEnter={() => setHoveredRow(index)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    <td style={getRowStyle(index, hoveredRow === index)}>{index + 1}</td>
                                    <td style={getRowStyle(index, hoveredRow === index)}>{student.username}</td>
                                    <td style={getRowStyle(index, hoveredRow === index)}>{student.total_hours}</td>
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