import React from "react";
import {Table, Card, Container} from "react-bootstrap";

function Leaderboard() {
    //Temparary fake student data, I don't know how to fetch the data from the backend yet
    const students = [
        { id: 1, name: "Luca", hours: 50 },
        { id: 2, name: "Nick", hours: 40 },
        { id: 3, name: "Zach", hours: 30 },
    ];

    return (
        //mt-4 and mb-3 are bootstrap classes for margin spacing between elements and edges. 
        <Container className="mt-4">
            <Card>
                <Card.Header as="h5">Leaderboard</Card.Header>
                <Card.Body>
                    <h2 className= "mb-3">Leaderboard</h2>

                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Name</th>
                                <th>Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => (
                                <tr key={student.id}>
                                    <td>{index + 1}</td>
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