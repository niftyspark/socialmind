import { useState, useEffect } from "react";
import { FiZap, FiPause, FiClock } from "react-icons/fi";

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
  if (diff <= 0) return "now";
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatTimeAgo(timestamp: number | null): string {
  if (!timestamp) return "never";
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function AutoPostIndicator({ state }: Props) {
  const [, setTick] = useState(0);

  // Re-render every 5 seconds to update countdown
  useEffect(() => {
    if (!state.isRunning) return;
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, [state.isRunning]);

  const lastResult = state.recentResults[0];

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
          Next check: {formatTimeUntil(state.nextCheck)}
          {state.lastPost && ` | Last post: ${formatTimeAgo(state.lastPost)}`}
        </span>
      </div>
      {lastResult && (
        <span
          className={`autopost-badge ${lastResult.success ? "success" : "error"}`}
          title={lastResult.error || `Posted to ${lastResult.platform}`}
        >
          {lastResult.success
            ? `${lastResult.platform}`
            : `${lastResult.platform} failed`}
        </span>
      )}
    </div>
  );
}
