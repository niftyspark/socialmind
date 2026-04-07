import { useState, useEffect } from "react";
import { FiZap, FiPause, FiClock, FiCheck } from "react-icons/fi";

interface AutoPostState {
  isRunning: boolean;
  lastCheck: number | null;
  lastPost: number | null;
  nextCheck: number | null;
  recentResults: Array<{
    platform: string;
    success: boolean;
    error?: string;
    time: number;
  }>;
}

interface Props {
  state: AutoPostState;
}

function formatTimeUntil(timestamp: number | null): string {
  if (!timestamp) return "--";
  const diff = timestamp - Date.now();
  if (diff <= 0) return "checking...";
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatTimeAgo(timestamp: number | null): string {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function AutoPostIndicator({ state }: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!state.isRunning) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [state.isRunning]);

  // Find the most recent SUCCESS result (not failures from stale connections)
  const lastSuccess = state.recentResults.find((r) => r.success);
  // Only show failure badge if the most recent result (not just any) failed
  // AND it happened in the last 10 minutes (not stale)
  const lastResult = state.recentResults[0];
  const showBadge = lastResult && Date.now() - lastResult.time < 10 * 60 * 1000;

  if (!state.isRunning) {
    return (
      <div className="autopost-indicator paused">
        <FiPause />
        <span>Auto-post paused</span>
      </div>
    );
  }

  return (
    <div className="autopost-indicator running">
      <div className="autopost-dot" />
      <FiZap className="autopost-icon" />
      <div className="autopost-info">
        <span className="autopost-label">Auto-posting active</span>
        <span className="autopost-detail">
          <FiClock />
          Next: {formatTimeUntil(state.nextCheck)}
          {state.lastPost ? ` | Posted: ${formatTimeAgo(state.lastPost)}` : ""}
        </span>
      </div>
      {showBadge && lastResult && (
        <span
          className={`autopost-badge ${lastResult.success ? "success" : "error"}`}
          title={lastResult.error || `Posted to ${lastResult.platform}`}
        >
          {lastResult.success ? (
            <><FiCheck /> {lastResult.platform}</>
          ) : (
            `${lastResult.platform} retry`
          )}
        </span>
      )}
      {!showBadge && lastSuccess && (
        <span className="autopost-badge success" title={`Last posted to ${lastSuccess.platform}`}>
          <FiCheck /> {lastSuccess.platform}
        </span>
      )}
    </div>
  );
}
