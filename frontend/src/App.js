import React from 'react';
import ServiceLogForm from './components/ServiceLogForm';
import MenuBar from './components/MenuBar';
import { Routes, Route } from 'react-router-dom';
import Leaderboard from "./components/Leaderboard";

function App() {
  return (
    <div style={{ fontFamily: 'Arial' }}>
      <MenuBar />

      <div style={{ padding: '20px' }}>
        <h1>AOF Service</h1>
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/log" element={<ServiceLogForm />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;