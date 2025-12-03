import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>⚠️ Something went wrong</h2>
            <p>The application encountered an error. This helps us improve the platform.</p>
            
            <div className="error-details">
              <details>
                <summary>Error Details</summary>
                <p><strong>Error:</strong> {this.state.error?.toString()}</p>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            </div>

            <div className="error-actions">
              <button onClick={this.handleReset} className="reload-button">
                🔄 Reload Application
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                className="home-button"
              >
                🏠 Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;