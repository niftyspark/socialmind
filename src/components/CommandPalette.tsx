import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "../context/ChatContext";
import {
  FiPlus,
  FiTrash2,
  FiSettings,
  FiDownload,
  FiSun,
  FiMoon,
  FiSearch,
} from "react-icons/fi";
import { exportChatAsMarkdown } from "../utils/export";

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const {
    state,
    dispatch,
    createSession,
    activeSession,
    clearSession,
    updateSettings,
  } = useChat();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    {
      id: "new-chat",
      label: "New Chat",
      icon: <FiPlus />,
      action: () => {
        createSession();
        close();
      },
      category: "Chat",
    },
    {
      id: "clear-chat",
      label: "Clear Current Chat",
      icon: <FiTrash2 />,
      action: () => {
        if (activeSession) clearSession(activeSession.id);
        close();
      },
      category: "Chat",
    },
    {
      id: "export-chat",
      label: "Export Chat as Markdown",
      icon: <FiDownload />,
      action: () => {
        if (activeSession) exportChatAsMarkdown(activeSession);
        close();
      },
      category: "Chat",
    },
    {
      id: "settings",
      label: "Open Settings",
      icon: <FiSettings />,
      action: () => {
        dispatch({ type: "SET_SETTINGS_OPEN", open: true });
        close();
      },
      category: "App",
    },
    {
      id: "toggle-theme",
      label: `Switch to ${state.settings.theme === "dark" ? "Light" : "Dark"} Mode`,
      icon: state.settings.theme === "dark" ? <FiSun /> : <FiMoon />,
      action: () => {
        updateSettings({
          theme: state.settings.theme === "dark" ? "light" : "dark",
        });
        close();
      },
      category: "App",
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const close = useCallback(() => {
    dispatch({ type: "SET_COMMAND_PALETTE", open: false });
    setQuery("");
    setSelectedIndex(0);
  }, [dispatch]);

  useEffect(() => {
    if (state.commandPaletteOpen) {
      inputRef.current?.focus();
    }
  }, [state.commandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        dispatch({
          type: "SET_COMMAND_PALETTE",
          open: !state.commandPaletteOpen,
        });
      }
      if (e.key === "Escape" && state.commandPaletteOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.commandPaletteOpen, dispatch, close]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  if (!state.commandPaletteOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={close}>
      <div
        className="command-palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="command-palette-input">
          <FiSearch />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command..."
          />
        </div>

        <div className="command-palette-list">
          {filtered.length === 0 ? (
            <div className="command-empty">No commands found</div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                className={`command-item ${i === selectedIndex ? "selected" : ""}`}
                onClick={cmd.action}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span className="command-icon">{cmd.icon}</span>
                <span className="command-label">{cmd.label}</span>
                <span className="command-category">{cmd.category}</span>
              </button>
            ))
          )}
        </div>

        <div className="command-palette-footer">
          <span>
            <kbd>↑↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> select
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
