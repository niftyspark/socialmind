import { memo, useState, useCallback, useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageType } from "../types/chat";
import { renderMarkdown, copyCodeToClipboard } from "../utils/markdown";
import { FiCopy, FiCheck, FiTrash2, FiUser, FiVolume2 } from "react-icons/fi";

interface Props {
  message: ChatMessageType;
  streamingText?: string;
  onDelete?: (id: string) => void;
  isGrouped?: boolean;
}

export const ChatMessageBubble = memo(function ChatMessageBubble({
  message,
  streamingText,
  onDelete,
  isGrouped,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const content = message.isStreaming ? streamingText || "" : message.content;
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isError = isAssistant && content.startsWith("Error:");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  const handleSpeak = useCallback(() => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [content, speaking]);

  // Handle code copy button clicks via event delegation
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("copy-code-btn")) {
        const code = target.getAttribute("data-code") || "";
        copyCodeToClipboard(code);
        target.textContent = "Copied!";
        setTimeout(() => {
          target.textContent = "Copy";
        }, 2000);
      }
    };

    el.addEventListener("click", handleClick);
    return () => el.removeEventListener("click", handleClick);
  }, [content]);

  const html = isUser ? null : renderMarkdown(content);

  return (
    <div
      className={`message ${isUser ? "message-user" : "message-assistant"} ${
        isGrouped ? "message-grouped" : ""
      } ${message.isStreaming ? "message-streaming" : ""} ${
        isError ? "message-error" : ""
      }`}
    >
      <div className="message-avatar">
        {isUser ? (
          <div className="avatar avatar-user">
            <FiUser />
          </div>
        ) : (
          <div className="avatar avatar-assistant">
            <span>🦞</span>
          </div>
        )}
      </div>

      <div className="message-body">
        <div className="message-header">
          <span className="message-role">{isUser ? "You" : "Assistant"}</span>
          {message.model && (
            <span className="message-model">{message.model.split("/").pop()}</span>
          )}
          <span className="message-time">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="message-content" ref={contentRef}>
          {isUser ? (
            <p className="user-text">{content}</p>
          ) : (
            <>
              {content ? (
                <div
                  className="markdown-body"
                  dangerouslySetInnerHTML={{ __html: html || "" }}
                />
              ) : (
                message.isStreaming && (
                  <div className="typing-indicator">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                )
              )}
            </>
          )}
        </div>

        {!message.isStreaming && content && (
          <div className="message-actions">
            <button
              className="msg-action-btn"
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy message"}
            >
              {copied ? <FiCheck /> : <FiCopy />}
            </button>
            {isAssistant && (
              <button
                className={`msg-action-btn ${speaking ? "active" : ""}`}
                onClick={handleSpeak}
                title={speaking ? "Stop speaking" : "Read aloud"}
              >
                <FiVolume2 />
              </button>
            )}
            {onDelete && (
              <button
                className="msg-action-btn msg-action-delete"
                onClick={() => onDelete(message.id)}
                title="Delete message"
              >
                <FiTrash2 />
              </button>
            )}
            {message.tokenUsage && (
              <span className="token-badge">
                {message.tokenUsage.totalTokens.toLocaleString()} tokens
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
