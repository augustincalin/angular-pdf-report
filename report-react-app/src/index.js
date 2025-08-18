import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

// Create a root and render the application.  React 18's root API is used
// here to support concurrent features.  StrictMode helps surface
// unexpected side effects during development.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);