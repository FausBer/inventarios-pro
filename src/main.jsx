import React, { Component } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
const queryClient = new QueryClient();

class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main
          role="alert"
          style={{
            boxSizing: "border-box",
            minHeight: "100vh",
            padding: "48px 24px",
            fontFamily: "system-ui, sans-serif",
            color: "#222",
            background: "#f7f7f7",
          }}
        >
          <h1>La pantalla tuvo un problema</h1>
          <p>Recargá la página para volver a intentarlo.</p>
          <details>
            <summary>Ver detalle del error</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.error.message}</pre>
          </details>
          <button type="button" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>
);
