import { useState } from "react";
import { useChat } from "../context/ChatContext";
import {
  FiPlus,
  FiMessageSquare,
  FiTrash2,
  FiSettings,
  FiSearch,
  FiX,
  FiChevronLeft,
} from "react-icons/fi";

export function Sidebar() {
  const {
    state,
    createSession,
    deleteSession,
    switchSession,
    dispatch,
  } = useChat();
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredSessions = state.sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  // Group sessions by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; sessions: typeof filteredSessions }[] = [];
  const todaySessions = filteredSessions.filter((s) => s.updatedAt >= today.getTime());
  const yesterdaySessions = filteredSessions.filter(
    (s) => s.updatedAt >= yesterday.getTime() && s.updatedAt < today.getTime()
  );
  const weekSessions = filteredSessions.filter(
    (s) => s.updatedAt >= weekAgo.getTime() && s.updatedAt < yesterday.getTime()
  );
  const olderSessions = filteredSessions.filter((s) => s.updatedAt < weekAgo.getTime());

  if (todaySessions.length) groups.push({ label: "Today", sessions: todaySessions });
  if (yesterdaySessions.length) groups.push({ label: "Yesterday", sessions: yesterdaySessions });
  if (weekSessions.length) groups.push({ label: "This Week", sessions: weekSessions });
  if (olderSessions.length) groups.push({ label: "Older", sessions: olderSessions });

  return (
    <aside className={`sidebar ${state.sidebarOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="brand-icon brand-logo">SM</span>
          <span className="brand-text">SocialMind</span>
        </div>
        <button
          className="icon-btn sidebar-collapse-btn"
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          title="Collapse sidebar"
        >
          <FiChevronLeft />
        </button>
      </div>

      <button className="new-chat-btn" onClick={createSession}>
        <FiPlus />
        <span>New Chat</span>
      </button>

      <div className="sidebar-search">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch("")}>
            <FiX />
          </button>
        )}
      </div>

      <div className="session-list">
        {groups.length === 0 && (
          <div className="empty-sessions">
            <p>No conversations yet</p>
            <p className="muted">Start a new chat to test your agent</p>
          </div>
        )}
        {groups.map((group) => (
          <div key={group.label} className="session-group">
            <div className="session-group-label">{group.label}</div>
            {group.sessions.map((session) => (
              <div
                key={session.id}
                className={`session-item ${
                  session.id === state.activeSessionId ? "active" : ""
                }`}
                onClick={() => switchSession(session.id)}
                onMouseEnter={() => setHoveredId(session.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <FiMessageSquare className="session-icon" />
                <span className="session-title">{session.title}</span>
                {hoveredId === session.id && (
                  <button
                    className="session-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    title="Delete chat"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button
          className="settings-btn"
          onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
        >
          <FiSettings />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
