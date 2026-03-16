import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; 
import { AuthProvider } from "./app/context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  
  <React.StrictMode>
    <AuthProvider>
      <div>
        <p>do you see me Frank</p>
      </div>
      <App />
    </AuthProvider>
  </React.StrictMode>
);