import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import logo from "../assets/images/logo.png"; // Import the logo image

//first thing I've written whith bootstrap, only makes sense if you're looking at the sintax
//the design of the nav bar should change at some point 
function MenuBar() {
  return (
    <Navbar bg="light" variant="light" expand="lg">
      <Container fluid className="px-2">
        {/* makes the brand name a link to the home page, which is the leaderboard */}
        <Navbar.Brand as={Link} to ="/leaderboard">
          <img
            src={logo}
            height="40"
            width="180"
            style={{objectFit: "contain"}} // Adjust the logo size to fit within the navbar
          />
        </Navbar.Brand>

{/* Note: the links must be placed in the app.js file, also the files they path to must exist */}
        <Nav className="ms-auto">
          <Nav.Link as={Link} to="/leaderboard">Home</Nav.Link>
          <Nav.Link as={Link} to="/log">Log Hours</Nav.Link>
          <Nav.Link as={Link} to="/LoginPage">Login</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
} 

export default MenuBar;