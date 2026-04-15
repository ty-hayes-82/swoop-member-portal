import { Component, useState } from 'react';

// Fire-and-forget client error telemetry. Single-flight: de-duplicates
// identical error signatures within a session so one broken widget doesn't
// flood the endpoint. Fails silently — telemetry is never allowed to
// cascade into another error.
const _reportedErrors = new Set();
function reportClientError(error, errorInfo, level) {
  try {
    const stack = (error?.stack || String(error || '')).slice(0, 500);
    const key = `${level}:${stack.slice(0, 200)}`;
    if (_reportedErrors.has(key)) return;
    _reportedErrors.add(key);
    const payload = {
      level,
      message: String(error?.message || error || '').slice(0, 500),
      stack,
      componentStack: (errorInfo?.componentStack || '').slice(0, 1000),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
    };
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('swoop_auth_token') : null;
    fetch('/api/client-errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch { /* telemetry must never throw */ }
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorHash: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, errorHash: window.location.hash };
  }

  componentDidMount() {
    this._onHashChange = () => {
      if (this.state.hasError) {
        this.setState({ hasError: false, error: null, errorHash: null });
      }
    };
    window.addEventListener('hashchange', this._onHashChange);

    // Fallback: poll for hash changes (covers page.goto in tests)
    this._hashPoll = setInterval(() => {
      if (this.state.hasError && window.location.hash !== this.state.errorHash) {
        this.setState({ hasError: false, error: null, errorHash: null });
      }
    }, 500);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this._onHashChange);
    clearInterval(this._hashPoll);
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Swoop ErrorBoundary]', error, errorInfo);
    reportClientError(error, errorInfo, 'app');
  }

  handleReset = () => {
    try {
      sessionStorage.removeItem('swoop_demo_files');
    } catch {}
    this.setState({ hasError: false, error: null, errorHash: null });
    // Navigate to Today as a safe page
    window.location.hash = '#/today';
  };

  render() {
    if (this.state.hasError) {
      // Inline fallback mode: widgets pass `fallback` to keep other cards
      // on the page alive when one of them throws.
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(this.state.error)
          : this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-swoop-row font-sans">
          <div className="max-w-md text-center p-8">
            <div className="text-4xl mb-4">&#x26A0;&#xFE0F;</div>
            <h1 className="text-xl font-bold text-swoop-text mb-2">Something went wrong</h1>
            <p className="text-sm text-swoop-text-muted mb-6">
              An unexpected error occurred. Try going back to the dashboard or refreshing the page.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 rounded-lg bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors cursor-pointer border-none"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-lg border border-swoop-border bg-swoop-panel text-swoop-text-2 text-sm font-semibold hover:bg-swoop-row-hover transition-colors cursor-pointer"
              >
                Refresh Page
              </button>
            </div>
            {this.state.error && (
              <ErrorDetails error={this.state.error} />
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * ErrorDetails — functional component with useState so the disclosure
 * toggle works reliably (Bug #16: native <details> can conflict with
 * React's event system in class components).
 */
function ErrorDetails({ error }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-swoop-text-label cursor-pointer bg-transparent border-none p-0 flex items-center gap-1"
      >
        <span className="inline-block transition-transform duration-150" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#x25B6;</span>
        Error details
      </button>
      {open && (
        <pre className="mt-2 text-xs text-error-500 bg-error-50 p-3 rounded-lg overflow-auto max-h-40">
          {error.toString()}
        </pre>
      )}
    </div>
  );
}

/**
 * RouteErrorBoundary — lightweight per-page error boundary that shows
 * an inline error card instead of replacing the entire app shell.
 * Wrap this around <Suspense> inside AppShell so layout/sidebar survive.
 */
export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorHash: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, errorHash: window.location.hash };
  }

  componentDidMount() {
    this._onHashChange = () => {
      if (this.state.hasError) {
        this.setState({ hasError: false, error: null, errorHash: null });
      }
    };
    window.addEventListener('hashchange', this._onHashChange);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Swoop RouteErrorBoundary]', error, errorInfo);
    reportClientError(error, errorInfo, 'route');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
          <div className="text-3xl">&#x26A0;&#xFE0F;</div>
          <h2 className="text-lg font-bold text-swoop-text">Page failed to load</h2>
          <p className="text-sm text-swoop-text-muted max-w-sm">
            This page encountered an error. You can try navigating elsewhere or refreshing.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorHash: null });
                window.location.hash = '#/today';
              }}
              className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors cursor-pointer border-none"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg border border-swoop-border bg-swoop-panel text-swoop-text-2 text-sm font-semibold hover:bg-swoop-row-hover transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
