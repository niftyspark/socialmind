import { useState } from "react";
import { useChat } from "../context/ChatContext";
import { AVAILABLE_MODELS } from "../types/chat";
import { FiX, FiEye, FiEyeOff, FiSave } from "react-icons/fi";

export function SettingsPanel() {
  const { state, dispatch, updateSettings } = useChat();
  const [showKey, setShowKey] = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...state.settings });
  const [saved, setSaved] = useState(false);

  if (!state.settingsOpen) return null;

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClose = () => {
    dispatch({ type: "SET_SETTINGS_OPEN", open: false });
  };

  // Group models by provider
  const providers = AVAILABLE_MODELS.reduce(
    (acc, m) => {
      if (!acc[m.provider]) acc[m.provider] = [];
      acc[m.provider].push(m);
      return acc;
    },
    {} as Record<string, typeof AVAILABLE_MODELS>
  );

  return (
    <div className="settings-overlay" onClick={handleClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <div className="settings-body">
          {/* API Key */}
          <div className="settings-section">
            <h3>API Configuration</h3>

            <label className="settings-label">
              4everland API Key
              <div className="api-key-input">
                <input
                  type={showKey ? "text" : "password"}
                  value={localSettings.apiKey}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, apiKey: e.target.value })
                  }
                  placeholder="Enter your 4everland API key"
                  className="settings-input"
                />
                <button
                  className="icon-btn"
                  onClick={() => setShowKey(!showKey)}
                  type="button"
                >
                  {showKey ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <span className="settings-hint">
                Get your API key from{" "}
                <a
                  href="https://dashboard.4everland.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  4everland Dashboard
                </a>
              </span>
            </label>

            <label className="settings-label">
              Site URL (optional)
              <input
                type="url"
                value={localSettings.siteUrl}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, siteUrl: e.target.value })
                }
                placeholder="https://yoursite.com"
                className="settings-input"
              />
              <span className="settings-hint">Sent as HTTP-Referer header</span>
            </label>

            <label className="settings-label">
              Site Name (optional)
              <input
                type="text"
                value={localSettings.siteName}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, siteName: e.target.value })
                }
                placeholder="My App"
                className="settings-input"
              />
              <span className="settings-hint">Sent as X-Title header</span>
            </label>
          </div>

          {/* Model */}
          <div className="settings-section">
            <h3>Model</h3>

            <label className="settings-label">
              Model
              <select
                value={localSettings.model}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, model: e.target.value })
                }
                className="settings-select"
              >
                {Object.entries(providers).map(([provider, models]) => (
                  <optgroup key={provider} label={provider}>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          {/* Parameters */}
          <div className="settings-section">
            <h3>Parameters</h3>

            <label className="settings-label">
              Temperature: {localSettings.temperature}
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={localSettings.temperature}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    temperature: parseFloat(e.target.value),
                  })
                }
                className="settings-range"
              />
              <span className="settings-hint">
                0 = deterministic, 2 = very creative
              </span>
            </label>

            <label className="settings-label">
              Top P: {localSettings.topP}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.topP}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    topP: parseFloat(e.target.value),
                  })
                }
                className="settings-range"
              />
            </label>

            <label className="settings-label">
              Max Tokens
              <input
                type="number"
                min="1"
                max="128000"
                value={localSettings.maxTokens}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    maxTokens: parseInt(e.target.value) || 4096,
                  })
                }
                className="settings-input"
              />
            </label>
          </div>

          {/* System Prompt */}
          <div className="settings-section">
            <h3>System Prompt</h3>
            <label className="settings-label">
              <textarea
                value={localSettings.systemPrompt}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    systemPrompt: e.target.value,
                  })
                }
                className="settings-textarea"
                rows={4}
                placeholder="You are a helpful AI assistant."
              />
            </label>
          </div>

          {/* Theme */}
          <div className="settings-section">
            <h3>Appearance</h3>
            <label className="settings-label">
              Theme
              <div className="theme-toggle">
                <button
                  className={`theme-btn ${
                    localSettings.theme === "dark" ? "active" : ""
                  }`}
                  onClick={() =>
                    setLocalSettings({ ...localSettings, theme: "dark" })
                  }
                >
                  Dark
                </button>
                <button
                  className={`theme-btn ${
                    localSettings.theme === "light" ? "active" : ""
                  }`}
                  onClick={() =>
                    setLocalSettings({ ...localSettings, theme: "light" })
                  }
                >
                  Light
                </button>
              </div>
            </label>
          </div>
        </div>

        <div className="settings-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <FiSave />
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
