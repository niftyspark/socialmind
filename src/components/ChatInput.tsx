import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import { useChat } from "../context/ChatContext";
import { FiSend, FiSquare, FiPaperclip, FiCommand } from "react-icons/fi";

export function ChatInput() {
  const { state, sendMessage, abortStream, dispatch, createSession } = useChat();
  const [input, setInput] = useState("");
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  // Focus textarea on mount and session switch
  useEffect(() => {
    textareaRef.current?.focus();
  }, [state.activeSessionId]);

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || state.isStreaming) return;

      // Handle slash commands
      if (input.startsWith("/")) {
        const cmd = input.trim().toLowerCase();
        if (cmd === "/new" || cmd === "/reset") {
          createSession();
          setInput("");
          return;
        }
        if (cmd === "/clear") {
          if (state.activeSessionId) {
            dispatch({ type: "CLEAR_SESSION", sessionId: state.activeSessionId });
          }
          setInput("");
          return;
        }
        if (cmd === "/settings") {
          dispatch({ type: "TOGGLE_SETTINGS" });
          setInput("");
          return;
        }
        if (cmd === "/help") {
          setInput("");
          return;
        }
      }

      sendMessage(input);
      setInputHistory((prev) => [input, ...prev.slice(0, 49)]);
      setHistoryIndex(-1);
      setInput("");
    },
    [input, state.isStreaming, state.activeSessionId, sendMessage, dispatch, createSession]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter to send, Shift+Enter for newline
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
        return;
      }

      // Cmd/Ctrl+K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        dispatch({ type: "SET_COMMAND_PALETTE", open: !state.commandPaletteOpen });
        return;
      }

      // Arrow up for input history
      if (e.key === "ArrowUp" && input === "") {
        e.preventDefault();
        if (inputHistory.length > 0) {
          const newIndex = Math.min(historyIndex + 1, inputHistory.length - 1);
          setHistoryIndex(newIndex);
          setInput(inputHistory[newIndex]);
        }
        return;
      }

      // Arrow down for input history
      if (e.key === "ArrowDown" && historyIndex >= 0) {
        e.preventDefault();
        const newIndex = historyIndex - 1;
        if (newIndex < 0) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(newIndex);
          setInput(inputHistory[newIndex]);
        }
        return;
      }
    },
    [handleSubmit, input, inputHistory, historyIndex, dispatch, state.commandPaletteOpen]
  );

  const charCount = input.length;
  const showCharCount = charCount > 100;

  return (
    <div className="chat-input-container">
      {state.error && (
        <div className="chat-error">
          <span>{state.error}</span>
          <button onClick={() => dispatch({ type: "SET_ERROR", error: null })}>
            Dismiss
          </button>
        </div>
      )}

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <button
            type="button"
            className="input-action-btn"
            title="Attach file (coming soon)"
            disabled
          >
            <FiPaperclip />
          </button>

          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setHistoryIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              state.settings.apiKey
                ? "Send a message... (Shift+Enter for newline)"
                : "Set your API key in Settings to start chatting"
            }
            rows={1}
            disabled={!state.settings.apiKey}
          />

          <div className="input-actions-right">
            {showCharCount && (
              <span className="char-count">{charCount.toLocaleString()}</span>
            )}

            <button
              type="button"
              className="input-action-btn"
              onClick={() =>
                dispatch({
                  type: "SET_COMMAND_PALETTE",
                  open: !state.commandPaletteOpen,
                })
              }
              title="Command palette (Ctrl+K)"
            >
              <FiCommand />
            </button>

            {state.isStreaming ? (
              <button
                type="button"
                className="send-btn stop-btn"
                onClick={abortStream}
                title="Stop generating"
              >
                <FiSquare />
              </button>
            ) : (
              <button
                type="submit"
                className="send-btn"
                disabled={!input.trim() || !state.settings.apiKey}
                title="Send message"
              >
                <FiSend />
              </button>
            )}
          </div>
        </div>

        <div className="input-footer">
          <span className="input-hint">
            <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for newline · <kbd>Ctrl+K</kbd> commands
          </span>
          <span className="model-indicator">
            {state.settings.model.split("/").pop()}
          </span>
        </div>
      </form>
    </div>
  );
}
