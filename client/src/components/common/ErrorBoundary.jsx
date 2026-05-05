/**
 * @fileoverview Error Boundary Component
 * Catches JavaScript errors anywhere in their child component tree.
 */
import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center glass-card m-4">
          <div className="w-16 h-16 bg-warning/10 text-warning rounded-full flex items-center justify-center mb-4">
            <FiAlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Something went wrong</h2>
          <p className="text-sm text-text-muted mb-6 max-w-md">
            We encountered an unexpected error while loading this component. 
            Our team has been notified.
          </p>
          <button 
            onClick={this.handleReset}
            className="btn-primary flex items-center gap-2"
          >
            <FiRefreshCw size={16} /> Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
