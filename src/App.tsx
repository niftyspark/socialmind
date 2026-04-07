import { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { Web3Provider } from "./lib/web3";
import { LoginPage } from "./components/auth/LoginPage";
import { SetupWizard } from "./components/SetupWizard";
import { Dashboard } from "./components/Dashboard";
import { LandingPage } from "./components/landing/LandingPage";
import { getAgentConfig } from "./utils/api";
import type { AgentConfig } from "./types/agent";

type AppView = "loading" | "landing" | "login" | "setup" | "dashboard";

function useHashRoute(): [string, (hash: string) => void] {
  const [hash, setHash] = useState(window.location.hash || "");
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const navigate = useCallback((h: string) => {
    window.location.hash = h;
    setHash(h);
  }, []);
  return [hash, navigate];
}

function AppRouter() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [hash, navigate] = useHashRoute();
  const [view, setView] = useState<AppView>("loading");
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  useEffect(() => {
    const isAppRoute = hash === "#/app" || hash.startsWith("#/app");

    if (!isAppRoute) {
      setView("landing");
      document.body.style.overflow = "auto";
      return;
    }

    document.body.style.overflow = "hidden";

    if (authLoading) {
      setView("loading");
      return;
    }

    if (!isAuthenticated) {
      setView("login");
      return;
    }

    getAgentConfig()
      .then((data) => {
        if (data.agent && data.agent.status !== "setup") {
          setAgentConfig(data.agent);
          setView("dashboard");
        } else {
          setAgentConfig(data.agent);
          setView("setup");
        }
      })
      .catch(() => setView("setup"));
  }, [hash, isAuthenticated, authLoading]);

  const handleEnterApp = useCallback(() => navigate("#/app"), [navigate]);

  const handleSetupComplete = useCallback(() => {
    getAgentConfig().then((data) => {
      setAgentConfig(data.agent);
      setView("dashboard");
    });
  }, []);

  const handleEditAgent = useCallback(() => setView("setup"), []);

  if (view === "landing") return <LandingPage onEnterApp={handleEnterApp} />;

  if (view === "loading") {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p className="loading-text">SocialMind</p>
      </div>
    );
  }

  if (view === "login") return <LoginPage />;

  if (view === "setup") {
    return <SetupWizard existingConfig={agentConfig} onComplete={handleSetupComplete} />;
  }

  return (
    <ChatProvider>
      <Dashboard onEditAgent={handleEditAgent} />
    </ChatProvider>
  );
}

function App() {
  return (
    <Web3Provider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </Web3Provider>
  );
}

export default App;
