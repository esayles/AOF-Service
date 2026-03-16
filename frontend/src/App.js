import React from 'react';
import ServiceLogForm from './components/ServiceLogForm';
import MenuBar from './components/MenuBar';

function App() {
  return (
    <div style={{ fontFamily: 'Arial' }}>
      <MenuBar />

      <div style={{ padding: '20px' }}>
        <h1>AOF Service</h1>
        <ServiceLogForm />
      </div>
    </div>
  );
}

export default App;