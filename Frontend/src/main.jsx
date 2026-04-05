import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import { store } from "./redux/store";
import { ThemeProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";
import "./index.css";
import App from "./App.jsx";

// ── Global Error Boundary ──────────────────────────────────
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.error("[ErrorBoundary]", err); }
  render() {
    if (this.state.hasError) return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12 }}>
        <p style={{ fontSize: 16, color: "var(--t1)" }}>Something went wrong.</p>
        <button onClick={() => window.location.reload()}
          style={{ padding: "8px 20px", background: "var(--accent)", color: "#fff", borderRadius: 8, border: "none", cursor: "pointer" }}>
          Reload
        </button>
      </div>
    );
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <ThemeProvider>
            <SocketProvider>
              <App />
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: "var(--bg-card)",
                    color: "var(--t1)",
                    border: "1px solid var(--border)",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: 13,
                  },
                  success: { iconTheme: { primary: "var(--accent)", secondary: "#fff" } },
                  error:   { iconTheme: { primary: "var(--danger)", secondary: "#fff" } },
                }}
              />
            </SocketProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
