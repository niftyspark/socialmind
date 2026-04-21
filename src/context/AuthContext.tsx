import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authGetMe } from "../utils/api";

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const TOKEN_KEY = "socialmind-token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      authGetMe()
        .then((data) => setUser(data.user))
        .catch(() => localStorage.removeItem(TOKEN_KEY))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "google-oauth-success") {
        const { token, user: userData } = event.data;
        localStorage.setItem(TOKEN_KEY, token);
        setUser(userData);
      } else if (event.data?.type === "google-oauth-error") {
        setError(event.data.error || "Google sign-in failed");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      // Check if running in dev mode (no backend)
      const isDev = !window.location.port || window.location.port === "5173";

      if (isDev) {
        // For local dev without backend, create mock user
        const devUser = { id: "dev-user-" + Date.now(), email: "dev@local.test", name: "Dev User", createdAt: Date.now() };
        const devToken = "dev-token-" + Date.now();
        localStorage.setItem(TOKEN_KEY, devToken);
        setUser(devUser);
        return;
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID";
      const redirectUri = `${window.location.origin}/oauth/callback`;
      const scope = "openid email profile";
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline`;

      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const oauthWindow = window.open(authUrl, "google-oauth", `width=${width},height=${height},left=${left},top=${top}`);

      if (!oauthWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      if (!msg.includes("rejected") && !msg.includes("denied")) {
        setError(msg);
      }
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signInWithGoogle,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}