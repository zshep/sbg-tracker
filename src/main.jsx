import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./app/context/AuthContext.jsx";
import "./index.css";
import App from "./App.jsx";

console.log("DEPLOY MARKER: b01fa7c"); 

window.addEventListener("error", (e) => {
  console.log("WINDOW ERROR:", e.error || e.message);
});

window.addEventListener("unhandledrejection", (e) => {
  console.log("UNHANDLED REJECTION:", e.reason);
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

/*
//debugging
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <div style={{ padding: 20 }}>SBG Tracker is rendering.</div>
  </StrictMode>
);
*/