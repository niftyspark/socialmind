import { useEffect, useRef, useCallback } from "react";
import { useChat } from "../context/ChatContext";
import { ChatMessageBubble } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { FiMenu, FiDownload, FiTrash2, FiMoreVertical } from "react-icons/fi";
import { useState } from "react";
import { exportChatAsMarkdown } from "../utils/export";

export function ChatView() {
  const { state, dispatch, activeSession, deleteMessage, clearSession, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeSession?.messages, state.streamingText, autoScroll]);

  // Detect user scroll to disable auto-scroll
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setAutoScroll(isAtBottom);
  }, []);

  const handleExport = useCallback(() => {
    if (activeSession) {
      exportChatAsMarkdown(activeSession);
    }
    setShowMenu(false);
  }, [activeSession]);

  const handleClear = useCallback(() => {
    if (activeSession) {
      clearSession(activeSession.id);
    }
    setShowMenu(false);
  }, [activeSession, clearSession]);

  const handleSuggestion = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

  const messageCount = activeSession?.messages.length || 0;

  return (
    <div className="chat-view">
      {/* Top bar */}
      <div className="chat-topbar">
        <div className="topbar-left">
          {!state.sidebarOpen && (
            <button
              className="icon-btn"
              onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
              title="Open sidebar"
            >
              <FiMenu />
            </button>
          )}
          <div className="topbar-title">
            <h2>{activeSession?.title || "OpenClaw WebChat"}</h2>
            {messageCount > 0 && (
              <span className="topbar-count">{messageCount} messages</span>
            )}
          </div>
        </div>

        <div className="topbar-right">
          {activeSession && (
            <div className="topbar-menu-wrapper">
              <button
                className="icon-btn"
                onClick={() => setShowMenu(!showMenu)}
                title="Chat options"
              >
                <FiMoreVertical />
              </button>
              {showMenu && (
                <>
                  <div
                    className="menu-backdrop"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="dropdown-menu">
                    <button onClick={handleExport}>
                      <FiDownload /> Export as Markdown
                    </button>
                    <button onClick={handleClear} className="danger">
                      <FiTrash2 /> Clear conversation
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="chat-messages"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {!activeSession || messageCount === 0 ? (
          <WelcomeScreen onSuggestion={handleSuggestion} />
        ) : (
          <>
            {activeSession.messages.map((msg, i) => {
              const prevMsg = i > 0 ? activeSession.messages[i - 1] : null;
              const isGrouped = prevMsg?.role === msg.role;

              return (
                <ChatMessageBubble
                  key={msg.id}
                  message={msg}
                  streamingText={
                    msg.isStreaming ? state.streamingText : undefined
                  }
                  onDelete={
                    !msg.isStreaming
                      ? (id) => deleteMessage(activeSession.id, id)
                      : undefined
                  }
                  isGrouped={isGrouped}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Scroll to bottom indicator */}
        {!autoScroll && messageCount > 0 && (
          <button
            className="scroll-to-bottom"
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              setAutoScroll(true);
            }}
          >
            ↓ New messages
          </button>
        )}
      </div>

      {/* Input */}
      <ChatInput />
    </div>
  );
}
