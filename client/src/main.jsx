import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Musync Error Boundary caught exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif", textAlign: "center", color: "#fff", background: "#0f172a", minHeight: "100vh" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Musync Application Error</h2>
          <p style={{ color: "#ef4444", marginBottom: "1.5rem" }}>{this.state.error?.toString()}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "0.6rem 1.2rem", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
