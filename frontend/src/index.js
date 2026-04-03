import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from "@react-oauth/google";
import 'bootstrap/dist/css/bootstrap.min.css';

//creates the root elemen for HTML, and prepares it for react 
const root = ReactDOM.createRoot(document.getElementById('root'));

//Renders the app into the router so that the links in the menu bar work, and the app is displayed on the page
root.render(
  <React.StrictMode>
  <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}> {/* there is a file in the backend that contains the client id for the web app */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </GoogleOAuthProvider>
</React.StrictMode>
);