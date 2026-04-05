import { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { LoginPage } from "./components/auth/LoginPage";
import { SetupWizard } from "./components/SetupWizard";
import { Dashboard } from "./components/Dashboard";
import { getAgentConfig } from "./utils/api";
import type { AgentConfig } from "./types/agent";

type AppView = "loading" | "login" | "setup" | "dashboard";

function AppRouter() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [view, setView] = useState<AppView>("loading");
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);

  // Apply dark theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  // Determine view based on auth state and agent config
  useEffect(() => {
    if (authLoading) {
      setView("loading");
      return;
    }

    if (!isAuthenticated) {
      setView("login");
      return;
    }

    // Check if user has an agent configured
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
      .catch(() => {
        setView("setup");
      });
  }, [isAuthenticated, authLoading]);

  const handleSetupComplete = useCallback(() => {
    getAgentConfig().then((data) => {
      setAgentConfig(data.agent);
      setView("dashboard");
    });
  }, []);

  const handleEditAgent = useCallback(() => {
    setView("setup");
  }, []);

  if (view === "loading") {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p className="loading-text">SocialMind</p>
      </div>
    );
  }

  if (view === "login") {
    return <LoginPage />;
  }

  if (view === "setup") {
    return (
      <SetupWizard
        existingConfig={agentConfig}
        onComplete={handleSetupComplete}
      />
    );
  }

  return (
    <ChatProvider>
      <Dashboard onEditAgent={handleEditAgent} />
    </ChatProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
