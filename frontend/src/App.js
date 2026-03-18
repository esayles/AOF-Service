import React from 'react';
import ServiceLogForm from './components/ServiceLogForm';
import MenuBar from './components/MenuBar';
import { Routes, Route } from 'react-router-dom';
import Leaderboard from "./components/Leaderboard";
import LoginPage from "./components/LoginPage";

function App() {
  return (
    // font to be replaced with AOF font
    <div style={{ fontFamily: 'Arial' }}>
      <MenuBar />

      <div style={{ padding: '20px' }}>
        <h1>AOF Service</h1>
        <Routes>
          {/* Note: the "/" route is the default route, since I've made the default page the home page it takes the user there */}
          <Route path="/" element={<Leaderboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/log" element={<ServiceLogForm />} />
          <Route path="/LoginPage" element={<LoginPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;