import { useState, useEffect } from "react";
import { FiSettings, FiLogOut, FiMenu } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getAgentConfig, getPostHistory, updateAgentConfig } from "../utils/api";
import type { AgentConfig, PostLog } from "../types/agent";
import { AgentStatus } from "./dashboard/AgentStatus";
import { ActivityFeed } from "./dashboard/ActivityFeed";
import { QuickActions } from "./dashboard/QuickActions";
import { Analytics } from "./dashboard/Analytics";

interface Props {
  onEditAgent: () => void;
}

export function Dashboard({ onEditAgent }: Props) {
  const { user, logout } = useAuth();
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [posts, setPosts] = useState<PostLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [agentData, postData] = await Promise.all([
          getAgentConfig(),
          getPostHistory(20),
        ]);
        setAgent(agentData.agent);
        setPosts(postData.posts || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleStatusToggle = async () => {
    if (!agent) return;
    const newStatus = agent.status === "active" ? "paused" : "active";
    setAgent({ ...agent, status: newStatus });
    // Update via API
    try {
      await updateAgentConfig({ status: newStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      {/* Top bar */}
      <header className="dashboard-topbar">
        <div className="topbar-left">
          <button
            className="icon-btn mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FiMenu />
          </button>
          <div className="topbar-brand">
            <span className="topbar-logo">SM</span>
            <span className="topbar-title">SocialMind</span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="topbar-user">
            <span className="user-name">{user?.name}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="icon-btn" onClick={onEditAgent} title="Edit Agent">
            <FiSettings />
          </button>
          <button className="icon-btn" onClick={logout} title="Logout">
            <FiLogOut />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="dashboard-content">
        <div className={`dashboard-sidebar ${sidebarOpen ? "open" : "closed"}`}>
          {agent && (
            <AgentStatus
              agent={agent}
              onToggleStatus={handleStatusToggle}
              onEdit={onEditAgent}
            />
          )}
          <QuickActions
            agent={agent}
            onEditAgent={onEditAgent}
          />
        </div>

        <main className="dashboard-main">
          <div className="dashboard-grid">
            <Analytics posts={posts} agent={agent} />
            <ActivityFeed posts={posts} />
          </div>
        </main>
      </div>
    </div>
  );
}
