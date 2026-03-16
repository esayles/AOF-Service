import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

//first thing I've written whith bootstrap, only makes sense if you're looking at the sintax
//the "/___" needs to be replaced with the url to the new page. 
function MenuBar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        {/* makes the brand name a link to the home page, which is the leaderboard */}
        <Navbar.Brand as={Link} to ="/leaderboard">
        AOF Service
        </Navbar.Brand>

{/* Note: the links must be placed in the app.js file, also the files they path to must exist */}
        <Nav className="ms-auto">
          <Nav.Link as={Link} to="/leaderboard">Home</Nav.Link>
          <Nav.Link as={Link} to="/log">Log Hours</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default MenuBar;