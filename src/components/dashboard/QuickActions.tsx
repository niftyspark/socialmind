import { useState } from "react";
import { FiZap, FiEdit3, FiRefreshCw, FiDownload, FiLoader } from "react-icons/fi";
import { FaXTwitter, FaFacebook, FaInstagram } from "react-icons/fa6";
import type { AgentConfig } from "../../types/agent";
import { postNow } from "../../utils/api";

interface Props {
  agent: AgentConfig | null;
  onEditAgent: () => void;
}

export function QuickActions({ agent, onEditAgent }: Props) {
  const [posting, setPosting] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handlePostNow = async (platform?: string) => {
    setPosting(platform || "all");
    setLastResult(null);
    try {
      const result = await postNow(platform);
      const outcomes = result.results || [];
      const summary = outcomes
        .map((r: { platform: string; success: boolean; error?: string; postUrl?: string }) =>
          r.success
            ? `${r.platform}: Posted${r.postUrl ? ` (${r.postUrl})` : ""}`
            : `${r.platform}: Failed — ${r.error || "unknown error"}`
        )
        .join("\n");
      setLastResult(summary);
    } catch (err) {
      setLastResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPosting(null);
    }
  };

  return (
    <div className="quick-actions">
      <h3 className="quick-actions-title">Quick Actions</h3>

      <div className="quick-actions-list">
        <button
          className="quick-action-btn"
          onClick={() => handlePostNow()}
          disabled={!!posting}
        >
          {posting === "all" ? <FiLoader className="spin" /> : <FiZap />}
          <div className="quick-action-info">
            <span className="quick-action-label">Post to All</span>
            <span className="quick-action-desc">AI-generate and post to all connected</span>
          </div>
        </button>

        <button
          className="quick-action-btn"
          onClick={() => handlePostNow("instagram")}
          disabled={!!posting}
        >
          {posting === "instagram" ? <FiLoader className="spin" /> : <FaInstagram />}
          <div className="quick-action-info">
            <span className="quick-action-label">Post to Instagram</span>
            <span className="quick-action-desc">Generate and post to Instagram now</span>
          </div>
        </button>

        <button
          className="quick-action-btn"
          onClick={() => handlePostNow("twitter")}
          disabled={!!posting}
        >
          {posting === "twitter" ? <FiLoader className="spin" /> : <FaXTwitter />}
          <div className="quick-action-info">
            <span className="quick-action-label">Post to X</span>
            <span className="quick-action-desc">Generate and post to X (Twitter) now</span>
          </div>
        </button>

        <button
          className="quick-action-btn"
          onClick={() => handlePostNow("facebook")}
          disabled={!!posting}
        >
          {posting === "facebook" ? <FiLoader className="spin" /> : <FaFacebook />}
          <div className="quick-action-info">
            <span className="quick-action-label">Post to Facebook</span>
            <span className="quick-action-desc">Generate and post to Facebook now</span>
          </div>
        </button>

        <button className="quick-action-btn" onClick={onEditAgent}>
          <FiEdit3 />
          <div className="quick-action-info">
            <span className="quick-action-label">Edit Agent</span>
            <span className="quick-action-desc">Update personality and settings</span>
          </div>
        </button>

        <button className="quick-action-btn" onClick={() => window.location.reload()}>
          <FiRefreshCw />
          <div className="quick-action-info">
            <span className="quick-action-label">Refresh Data</span>
            <span className="quick-action-desc">Reload posts and status</span>
          </div>
        </button>

        <button
          className="quick-action-btn"
          onClick={() => {
            const data = JSON.stringify({ agent }, null, 2);
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `socialmind-agent-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <FiDownload />
          <div className="quick-action-info">
            <span className="quick-action-label">Export Config</span>
            <span className="quick-action-desc">Download agent configuration</span>
          </div>
        </button>
      </div>

      {lastResult && (
        <div className="quick-action-result">
          <pre>{lastResult}</pre>
        </div>
      )}
    </div>
  );
}
