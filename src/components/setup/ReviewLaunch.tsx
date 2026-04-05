import { FiCheck, FiAlertCircle, FiZap } from "react-icons/fi";
import { FaXTwitter, FaFacebook, FaInstagram } from "react-icons/fa6";
import type { AgentConfig, Platform } from "../../types/agent";

interface Props {
  config: AgentConfig;
  onLaunch: () => void;
  saving: boolean;
}

export function ReviewLaunch({ config, onLaunch, saving }: Props) {
  const connectedPlatforms = (["twitter", "facebook", "instagram"] as Platform[]).filter(
    (p) => config.platforms?.[p]?.connected
  );

  const enabledPlatforms = (["twitter", "facebook", "instagram"] as Platform[]).filter(
    (p) => config.schedule?.[p]?.enabled
  );

  const issues: string[] = [];
  if (!config.identity?.name) issues.push("Agent name is required");
  if (!config.identity?.bio) issues.push("Agent bio is required");
  if (connectedPlatforms.length === 0) issues.push("No social platforms connected");
  if (enabledPlatforms.length === 0) issues.push("No platform schedules enabled");

  const platformIcon = (p: Platform) => {
    switch (p) {
      case "twitter": return <FaXTwitter />;
      case "facebook": return <FaFacebook />;
      case "instagram": return <FaInstagram />;
    }
  };

  return (
    <div className="wizard-form">
      <div className="review-container">
        {/* Agent Preview */}
        <div className="review-card">
          <h3 className="review-card-title">Agent Identity</h3>
          <div className="review-agent-preview">
            {config.identity?.avatar ? (
              <img src={config.identity.avatar} alt="" className="review-avatar" />
            ) : (
              <div className="review-avatar-placeholder">
                {config.identity?.name?.charAt(0) || "?"}
              </div>
            )}
            <div className="review-agent-info">
              <h4>{config.identity?.name || "Unnamed Agent"}</h4>
              <p className="review-tagline">{config.identity?.tagline || "No tagline"}</p>
              <p className="review-bio">{config.identity?.bio || "No bio set"}</p>
            </div>
          </div>
        </div>

        {/* Personality */}
        <div className="review-card">
          <h3 className="review-card-title">Personality</h3>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label">Tone</span>
              <span className="review-value">{config.personality?.tone || "Not set"}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Topics</span>
              <span className="review-value">
                {config.personality?.topics?.length
                  ? config.personality.topics.join(", ")
                  : "None set"}
              </span>
            </div>
            <div className="review-item">
              <span className="review-label">Example Posts</span>
              <span className="review-value">
                {config.personality?.examplePosts?.length || 0} samples
              </span>
            </div>
          </div>
        </div>

        {/* Platforms */}
        <div className="review-card">
          <h3 className="review-card-title">Connected Platforms</h3>
          <div className="review-platforms">
            {(["twitter", "facebook", "instagram"] as Platform[]).map((p) => {
              const connected = config.platforms?.[p]?.connected;
              const scheduled = config.schedule?.[p]?.enabled;
              return (
                <div key={p} className={`review-platform ${connected ? "connected" : "disconnected"}`}>
                  <span className="review-platform-icon">{platformIcon(p)}</span>
                  <span className="review-platform-name">
                    {p === "twitter" ? "X" : p.charAt(0).toUpperCase() + p.slice(1)}
                  </span>
                  <div className="review-platform-badges">
                    <span className={`review-badge ${connected ? "badge-ok" : "badge-warn"}`}>
                      {connected ? "Connected" : "Not connected"}
                    </span>
                    {connected && (
                      <span className={`review-badge ${scheduled ? "badge-ok" : "badge-muted"}`}>
                        {scheduled
                          ? `${config.schedule?.[p]?.postsPerDay || 0}/day`
                          : "Schedule off"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inspiration */}
        {config.inspiration && config.inspiration.length > 0 && (
          <div className="review-card">
            <h3 className="review-card-title">Inspiration Accounts</h3>
            <div className="review-list">
              {config.inspiration.map((acc, i) => (
                <div key={i} className="review-list-item">
                  <span>{platformIcon(acc.platform)}</span>
                  <span>@{acc.handle}</span>
                  {acc.notes && <span className="review-muted">- {acc.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Rules Summary */}
        <div className="review-card">
          <h3 className="review-card-title">Content Rules</h3>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label">Hashtags</span>
              <span className="review-value">{config.rules?.hashtagStrategy || "moderate"}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Emojis</span>
              <span className="review-value">{config.rules?.includeEmojis ? "Yes" : "No"}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Links</span>
              <span className="review-value">{config.rules?.includeLinks ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div className="review-issues">
            <h3><FiAlertCircle /> Issues to Fix</h3>
            <ul>
              {issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Launch Button */}
        <div className="review-launch">
          <button
            className="btn btn-primary btn-large launch-btn"
            onClick={onLaunch}
            disabled={saving || issues.length > 0}
          >
            {saving ? (
              <div className="loading-spinner small" />
            ) : (
              <>
                <FiZap />
                <span>Launch Agent</span>
              </>
            )}
          </button>
          {issues.length > 0 && (
            <p className="launch-hint">Fix the issues above before launching</p>
          )}
          {issues.length === 0 && (
            <p className="launch-hint">
              <FiCheck /> Everything looks good! Your agent will start posting automatically.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
