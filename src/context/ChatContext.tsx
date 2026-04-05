import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type { ChatMessage, ChatSession, AppSettings } from "../types/chat";
import { streamChatCompletion } from "../utils/api";
import {
  loadSettings,
  saveSettings,
  loadSessions,
  saveSessions,
  loadActiveSessionId,
  saveActiveSessionId,
} from "../utils/storage";

// State
interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  settings: AppSettings;
  isStreaming: boolean;
  streamingText: string;
  error: string | null;
  sidebarOpen: boolean;
  settingsOpen: boolean;
  searchQuery: string;
  commandPaletteOpen: boolean;
}

// Actions
type ChatAction =
  | { type: "SET_SESSIONS"; sessions: ChatSession[] }
  | { type: "SET_ACTIVE_SESSION"; id: string }
  | { type: "ADD_SESSION"; session: ChatSession }
  | { type: "DELETE_SESSION"; id: string }
  | { type: "UPDATE_SESSION"; id: string; updates: Partial<ChatSession> }
  | { type: "ADD_MESSAGE"; sessionId: string; message: ChatMessage }
  | { type: "UPDATE_MESSAGE"; sessionId: string; messageId: string; updates: Partial<ChatMessage> }
  | { type: "DELETE_MESSAGE"; sessionId: string; messageId: string }
  | { type: "SET_SETTINGS"; settings: AppSettings }
  | { type: "SET_STREAMING"; isStreaming: boolean }
  | { type: "SET_STREAMING_TEXT"; text: string }
  | { type: "APPEND_STREAMING_TEXT"; text: string }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR"; open: boolean }
  | { type: "TOGGLE_SETTINGS" }
  | { type: "SET_SETTINGS_OPEN"; open: boolean }
  | { type: "SET_SEARCH_QUERY"; query: string }
  | { type: "SET_COMMAND_PALETTE"; open: boolean }
  | { type: "CLEAR_SESSION"; sessionId: string };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_SESSIONS":
      return { ...state, sessions: action.sessions };

    case "SET_ACTIVE_SESSION":
      return { ...state, activeSessionId: action.id };

    case "ADD_SESSION":
      return {
        ...state,
        sessions: [action.session, ...state.sessions],
        activeSessionId: action.session.id,
      };

    case "DELETE_SESSION": {
      const filtered = state.sessions.filter((s) => s.id !== action.id);
      const newActiveId =
        state.activeSessionId === action.id
          ? filtered[0]?.id || null
          : state.activeSessionId;
      return { ...state, sessions: filtered, activeSessionId: newActiveId };
    }

    case "UPDATE_SESSION":
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.id ? { ...s, ...action.updates, updatedAt: Date.now() } : s
        ),
      };

    case "ADD_MESSAGE":
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.sessionId
            ? {
                ...s,
                messages: [...s.messages, action.message],
                updatedAt: Date.now(),
              }
            : s
        ),
      };

    case "UPDATE_MESSAGE":
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.sessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === action.messageId ? { ...m, ...action.updates } : m
                ),
              }
            : s
        ),
      };

    case "DELETE_MESSAGE":
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.sessionId
            ? {
                ...s,
                messages: s.messages.filter((m) => m.id !== action.messageId),
                updatedAt: Date.now(),
              }
            : s
        ),
      };

    case "CLEAR_SESSION":
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.sessionId
            ? { ...s, messages: [], updatedAt: Date.now(), title: "New Chat" }
            : s
        ),
      };

    case "SET_SETTINGS":
      return { ...state, settings: action.settings };

    case "SET_STREAMING":
      return { ...state, isStreaming: action.isStreaming };

    case "SET_STREAMING_TEXT":
      return { ...state, streamingText: action.text };

    case "APPEND_STREAMING_TEXT":
      return { ...state, streamingText: state.streamingText + action.text };

    case "SET_ERROR":
      return { ...state, error: action.error };

    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case "SET_SIDEBAR":
      return { ...state, sidebarOpen: action.open };

    case "TOGGLE_SETTINGS":
      return { ...state, settingsOpen: !state.settingsOpen };

    case "SET_SETTINGS_OPEN":
      return { ...state, settingsOpen: action.open };

    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.query };

    case "SET_COMMAND_PALETTE":
      return { ...state, commandPaletteOpen: action.open };

    default:
      return state;
  }
}

// Context
interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  sendMessage: (content: string) => void;
  abortStream: () => void;
  createSession: () => void;
  deleteSession: (id: string) => void;
  switchSession: (id: string) => void;
  clearSession: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  activeSession: ChatSession | null;
  deleteMessage: (sessionId: string, messageId: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

// Auto-generate title from first user message
function generateTitle(content: string): string {
  const cleaned = content.replace(/\n/g, " ").trim();
  if (cleaned.length <= 40) return cleaned;
  return cleaned.slice(0, 37) + "...";
}

// Provider
export function ChatProvider({ children }: { children: ReactNode }) {
  const abortRef = useRef<AbortController | null>(null);

  const initialState: ChatState = {
    sessions: loadSessions(),
    activeSessionId: loadActiveSessionId(),
    settings: loadSettings(),
    isStreaming: false,
    streamingText: "",
    error: null,
    sidebarOpen: true,
    settingsOpen: false,
    searchQuery: "",
    commandPaletteOpen: false,
  };

  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Persist sessions whenever they change
  useEffect(() => {
    saveSessions(state.sessions);
  }, [state.sessions]);

  // Persist active session id
  useEffect(() => {
    if (state.activeSessionId) {
      saveActiveSessionId(state.activeSessionId);
    }
  }, [state.activeSessionId]);

  // Persist settings
  useEffect(() => {
    saveSettings(state.settings);
  }, [state.settings]);

  const activeSession =
    state.sessions.find((s) => s.id === state.activeSessionId) || null;

  const createSession = useCallback(() => {
    const session: ChatSession = {
      id: uuidv4(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: state.settings.model,
    };
    dispatch({ type: "ADD_SESSION", session });
  }, [state.settings.model]);

  const deleteSession = useCallback((id: string) => {
    dispatch({ type: "DELETE_SESSION", id });
  }, []);

  const switchSession = useCallback((id: string) => {
    dispatch({ type: "SET_ACTIVE_SESSION", id });
  }, []);

  const clearSession = useCallback((id: string) => {
    dispatch({ type: "CLEAR_SESSION", sessionId: id });
  }, []);

  const deleteMessage = useCallback((sessionId: string, messageId: string) => {
    dispatch({ type: "DELETE_MESSAGE", sessionId, messageId });
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    dispatch({
      type: "SET_SETTINGS",
      settings: { ...state.settings, ...updates },
    });
  }, [state.settings]);

  const abortStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "SET_STREAMING", isStreaming: false });
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || state.isStreaming) return;
      // API key is handled server-side, no client-side check needed

      let sessionId = state.activeSessionId;

      // Create session if none exists
      if (!sessionId) {
        const session: ChatSession = {
          id: uuidv4(),
          title: generateTitle(content),
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: state.settings.model,
        };
        dispatch({ type: "ADD_SESSION", session });
        sessionId = session.id;
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };
      dispatch({ type: "ADD_MESSAGE", sessionId, message: userMessage });

      // Update title if first message
      const currentSession = state.sessions.find((s) => s.id === sessionId);
      if (currentSession && currentSession.messages.length === 0) {
        dispatch({
          type: "UPDATE_SESSION",
          id: sessionId,
          updates: { title: generateTitle(content) },
        });
      }

      // Add placeholder assistant message
      const assistantMessageId = uuidv4();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        model: state.settings.model,
        isStreaming: true,
      };
      dispatch({ type: "ADD_MESSAGE", sessionId, message: assistantMessage });

      // Start streaming
      dispatch({ type: "SET_STREAMING", isStreaming: true });
      dispatch({ type: "SET_STREAMING_TEXT", text: "" });
      dispatch({ type: "SET_ERROR", error: null });

      const abortController = new AbortController();
      abortRef.current = abortController;

      // Gather all messages for context
      const allMessages = [
        ...(currentSession?.messages || []),
        userMessage,
      ];

      const capturedSessionId = sessionId;

      streamChatCompletion(
        allMessages,
        state.settings,
        {
          onToken: (token) => {
            dispatch({ type: "APPEND_STREAMING_TEXT", text: token });
          },
          onDone: (fullText, usage) => {
            dispatch({
              type: "UPDATE_MESSAGE",
              sessionId: capturedSessionId,
              messageId: assistantMessageId,
              updates: {
                content: fullText,
                isStreaming: false,
                tokenUsage: usage,
              },
            });
            dispatch({ type: "SET_STREAMING", isStreaming: false });
            dispatch({ type: "SET_STREAMING_TEXT", text: "" });
          },
          onError: (error) => {
            dispatch({
              type: "UPDATE_MESSAGE",
              sessionId: capturedSessionId,
              messageId: assistantMessageId,
              updates: {
                content: `Error: ${error.message}`,
                isStreaming: false,
              },
            });
            dispatch({ type: "SET_STREAMING", isStreaming: false });
            dispatch({ type: "SET_STREAMING_TEXT", text: "" });
            dispatch({ type: "SET_ERROR", error: error.message });
          },
        },
        abortController.signal
      );
    },
    [state.activeSessionId, state.isStreaming, state.settings, state.sessions]
  );

  return (
    <ChatContext.Provider
      value={{
        state,
        dispatch,
        sendMessage,
        abortStream,
        createSession,
        deleteSession,
        switchSession,
        clearSession,
        updateSettings,
        activeSession,
        deleteMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
