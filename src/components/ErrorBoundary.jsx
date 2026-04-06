import { Component } from 'react';

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
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorHash: null });
    // Navigate to Today as a safe page
    window.location.hash = '#/today';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 font-sans">
          <div className="max-w-md text-center p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
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
                className="px-6 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
              >
                Refresh Page
              </button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-gray-400 cursor-pointer">Error details</summary>
                <pre className="mt-2 text-xs text-error-500 bg-error-50 dark:bg-error-500/10 p-3 rounded-lg overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
