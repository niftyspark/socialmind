import { FiPlay, FiPause, FiEdit3 } from "react-icons/fi";
import { FaXTwitter, FaFacebook, FaInstagram } from "react-icons/fa6";
import type { AgentConfig, Platform } from "../../types/agent";

interface Props {
  agent: AgentConfig;
  onToggleStatus: () => void;
  onEdit: () => void;
}

const platformIcon = (p: Platform) => {
  switch (p) {
    case "twitter": return <FaXTwitter />;
    case "facebook": return <FaFacebook />;
    case "instagram": return <FaInstagram />;
  }
};

export function AgentStatus({ agent, onToggleStatus, onEdit }: Props) {
  const isActive = agent.status === "active";

  return (
    <div className="agent-status-card">
      <div className="agent-status-header">
        {agent.identity.avatar ? (
          <img src={agent.identity.avatar} alt="" className="agent-avatar" />
        ) : (
          <div className="agent-avatar-placeholder">
            {agent.identity.name?.charAt(0) || "?"}
          </div>
        )}
        <div className="agent-identity">
          <h3>{agent.identity.name || "Unnamed Agent"}</h3>
          <p className="agent-tagline">{agent.identity.tagline}</p>
        </div>
      </div>

      <div className="agent-status-indicator">
        <span className={`status-dot ${isActive ? "active" : "paused"}`} />
        <span className="status-text">
          {isActive ? "Active — Auto-posting" : "Paused"}
        </span>
      </div>

      <div className="agent-platforms-status">
        {(["twitter", "facebook", "instagram"] as Platform[]).map((p) => {
          const connected = agent.platforms?.[p]?.connected;
          const scheduled = agent.schedule?.[p]?.enabled;
          const postsPerDay = agent.schedule?.[p]?.postsPerDay || 0;
          return (
            <div key={p} className={`platform-status-item ${connected ? "connected" : ""}`}>
              <span className="platform-icon">{platformIcon(p)}</span>
              <span className={`platform-badge ${connected && scheduled ? "active" : connected ? "idle" : "off"}`}>
                {connected && scheduled ? `${postsPerDay}/day` : connected ? "Idle" : "Off"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="agent-status-actions">
        <button
          className={`btn ${isActive ? "btn-secondary" : "btn-primary"} btn-sm`}
          onClick={onToggleStatus}
        >
          {isActive ? <><FiPause /> Pause</> : <><FiPlay /> Activate</>}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onEdit}>
          <FiEdit3 /> Edit
        </button>
      </div>
    </div>
  );
}
