import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/auth.css";
import "./styles/wizard.css";
import "./styles/dashboard.css";
import "./styles/chat.css";
import "./styles/settings.css";
import "./styles/command-palette.css";
import "./styles/landing.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
