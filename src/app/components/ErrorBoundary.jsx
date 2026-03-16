import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "24px",
            fontFamily: "sans-serif",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <h1>Something crashed</h1>
          <p>
            A component threw an error while rendering. Check the details below.
          </p>

          <button
            onClick={this.handleReset}
            style={{
              marginBottom: "16px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Try reset
          </button>

          {this.state.error && (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#f5f5f5",
                padding: "12px",
                borderRadius: "8px",
                overflowX: "auto",
              }}
            >
              {String(this.state.error)}
            </pre>
          )}

          {this.state.errorInfo?.componentStack && (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#f5f5f5",
                padding: "12px",
                borderRadius: "8px",
                overflowX: "auto",
                marginTop: "12px",
              }}
            >
              {this.state.errorInfo.componentStack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}