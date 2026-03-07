import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { LandingPage } from './landing';
import './styles/global.css';

const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
const isLandingRoute = normalizedPath === '/landing';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isLandingRoute ? <LandingPage /> : <App />}
  </React.StrictMode>
);
// deploy trigger Thu Mar  5 18:41:19 UTC 2026
