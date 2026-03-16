import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

//creates the root elemen for HTML, and prepares it for react 
const root = ReactDOM.createRoot(document.getElementById('root'));

//Renders the app into the router so that the links in the menu bar work, and the app is displayed on the page
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);