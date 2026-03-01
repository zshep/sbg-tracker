import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./app/context/AuthContext.jsx";
import "./index.css";
import App from "./App.jsx";

console.log("MAIN.JSX LOADED");
document.body.insertAdjacentHTML("afterbegin", "<div>main.jsx loaded</div>");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
