import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import './styles/platform-polish.css';

const LandingPage = lazy(() => import('./landing/LandingPage.jsx'));
const App = lazy(() => import('./App.jsx'));

const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
const isLandingRoute = normalizedPath === '/landing';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      {isLandingRoute ? <LandingPage /> : <App />}
    </Suspense>
  </React.StrictMode>
);
// deploy trigger Thu Mar  5 18:41:19 UTC 2026
