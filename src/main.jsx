import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import './styles/tailwind.css';
import './styles/swoop-dark.css';

// Initialize Sentry only when a DSN is configured. Dev builds without a DSN
// keep working identically — no network calls, no init side-effects.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    release: import.meta.env.VITE_GIT_SHA || undefined,
    tracesSampleRate: 0,
  });
}

const App = lazy(() => import('./App.jsx'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={null}>
          <App />
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
// deploy trigger Thu Mar  5 18:41:19 UTC 2026
