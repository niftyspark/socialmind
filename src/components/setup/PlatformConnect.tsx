import { useState, useEffect, useCallback } from "react";
import { FiCheck, FiLink, FiLoader, FiRefreshCw, FiXCircle } from "react-icons/fi";
import { FaXTwitter, FaFacebook, FaInstagram } from "react-icons/fa6";
import type { PlatformConnections, Platform } from "../../types/agent";
import {
  connectPlatform,
  disconnectPlatform,
  getSocialStatus,
  pollConnectionStatus,
} from "../../utils/api";

interface Props {
  platforms: PlatformConnections;
  onChange: (platforms: PlatformConnections) => void;
}

const PLATFORM_INFO: Record<
  Platform,
  {
    name: string;
    icon: React.ReactNode;
    color: string;
    description: string;
    note: string;
  }
> = {
  twitter: {
    name: "X (Twitter)",
    icon: <FaXTwitter />,
    color: "#ffffff",
    description:
      "Post tweets, replies, and threads automatically to your X account.",
    note: "Requires Twitter Developer API credentials configured in your Composio dashboard.",
  },
  facebook: {
    name: "Facebook Page",
    icon: <FaFacebook />,
    color: "#1877F2",
    description:
      "Auto-post to your Facebook Page. Requires admin access to the Page.",
    note: "Uses Composio managed OAuth. Personal profiles are not supported — Pages only.",
  },
  instagram: {
    name: "Instagram",
    icon: <FaInstagram />,
    color: "#E4405F",
    description:
      "Post to your Instagram Business or Creator account.",
    note: "Uses Composio managed OAuth. Personal accounts are not supported. Image posts require an image URL.",
  },
};

export function PlatformConnect({ platforms, onChange }: Props) {
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [polling, setPolling] = useState<Platform | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, refresh status from Composio
  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshStatus = useCallback(async () => {
    setRefreshing(true);
    try {
      const status = await getSocialStatus(true);
      const updated = { ...platforms };
      for (const p of ["twitter", "facebook", "instagram"] as Platform[]) {
        if (status[p]) {
          updated[p] = { ...updated[p], ...status[p] };
        }
      }
      onChange(updated);
    } catch {
      // Silently fail — user can retry
    } finally {
      setRefreshing(false);
    }
  }, [platforms, onChange]);

  const handleConnect = async (platform: Platform) => {
    setConnecting(platform);
    setError(null);

    try {
      const result = await connectPlatform(platform);

      if (result.authUrl) {
        // Open Composio OAuth Connect Link in a popup
        const popup = window.open(
          result.authUrl,
          `composio-${platform}-auth`,
          "width=620,height=720,scrollbars=yes"
        );

        // Store the pending connection ID
        onChange({
          ...platforms,
          [platform]: {
            ...platforms[platform],
            connected: false,
            connectedAccountId: result.connectionId,
          },
        });

        setConnecting(null);
        setPolling(platform);

        // Poll for connection completion
        const connected = await pollConnectionStatus(platform, 3000, 60);

        if (connected) {
          // Refresh to get the final handle/display name
          const status = await getSocialStatus(true);
          if (status[platform]) {
            onChange({
              ...platforms,
              [platform]: {
                ...platforms[platform],
                ...status[platform],
                connected: true,
                connectedAt: Date.now(),
              },
            });
          }
        } else {
          // Check if popup was closed early
          if (popup && popup.closed) {
            setError(
              `${PLATFORM_INFO[platform].name} authorization was cancelled or timed out. Please try again.`
            );
          } else {
            setError(
              `Timed out waiting for ${PLATFORM_INFO[platform].name} connection. If you completed authorization, click "Refresh Status".`
            );
          }
        }

        setPolling(null);
      } else {
        throw new Error("No authorization URL returned from Composio");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect platform"
      );
      setConnecting(null);
      setPolling(null);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    setError(null);
    try {
      await disconnectPlatform(platform);
      onChange({
        ...platforms,
        [platform]: { connected: false },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to disconnect platform"
      );
    }
  };

  return (
    <div className="wizard-form">
      <div className="form-section">
        <p className="form-section-desc">
          Connect your social media accounts through Composio to enable
          autonomous posting. All OAuth authorization and API access is handled
          securely by Composio — your credentials are never stored on our
          servers.
        </p>

        {error && (
          <div className="form-error">
            <FiXCircle style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Refresh button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={refreshStatus}
            disabled={refreshing}
            type="button"
          >
            <FiRefreshCw className={refreshing ? "spin" : ""} />
            <span>Refresh Status</span>
          </button>
        </div>

        <div className="platform-connect-list">
          {(
            Object.entries(PLATFORM_INFO) as [
              Platform,
              (typeof PLATFORM_INFO)[Platform]
            ][]
          ).map(([platform, info]) => {
            const connection = platforms[platform];
            const isConnecting = connecting === platform;
            const isPolling = polling === platform;

            return (
              <div
                key={platform}
                className={`platform-connect-card ${
                  connection.connected ? "connected" : ""
                }`}
              >
                <div className="platform-connect-header">
                  <div
                    className="platform-connect-icon"
                    style={{ color: info.color }}
                  >
                    {info.icon}
                  </div>
                  <div className="platform-connect-info">
                    <h3>{info.name}</h3>
                    <p>{info.description}</p>
                  </div>
                </div>

                <div className="platform-connect-status">
                  {connection.connected ? (
                    <div className="connected-status">
                      <span className="status-badge status-connected">
                        <FiCheck /> Connected via Composio
                      </span>
                      {connection.handle && (
                        <span className="connected-handle">
                          @{connection.handle}
                        </span>
                      )}
                      {connection.displayName && !connection.handle && (
                        <span className="connected-handle">
                          {connection.displayName}
                        </span>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDisconnect(platform)}
                        type="button"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <div className="connect-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleConnect(platform)}
                        disabled={isConnecting || isPolling}
                        type="button"
                      >
                        {isConnecting ? (
                          <>
                            <FiLoader className="spin" /> Opening Composio...
                          </>
                        ) : isPolling ? (
                          <>
                            <FiLoader className="spin" /> Waiting for
                            authorization...
                          </>
                        ) : (
                          <>
                            <FiLink /> Connect with Composio
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="platform-connect-note">
                  <p>{info.note}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="platform-connect-note" style={{ marginTop: 16 }}>
          <p>
            <strong>How it works:</strong> Clicking "Connect with Composio" opens a secure
            authorization page. Sign in to your social account and grant permissions.
            Once complete, SocialMind will detect the connection automatically.
            All platform integrations are managed exclusively through{" "}
            <a href="https://composio.dev" target="_blank" rel="noopener noreferrer">
              Composio
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
