import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authGetNonce, authWalletLogin, authGetMe } from "../utils/api";

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  walletAddress?: string;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithWallet: (address: string, signMessage: (args: { message: string }) => Promise<string>) => Promise<void>;
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

  // Check for existing session on mount
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

  const loginWithWallet = useCallback(
    async (
      address: string,
      signMessage: (args: { message: string }) => Promise<string>
    ) => {
      setError(null);
      try {
        // 1. Get a nonce from the server
        const { nonce } = await authGetNonce();

        // 2. Build the SIWE message
        const message = [
          "Sign in to SocialMind",
          "",
          `Wallet: ${address}`,
          `Chain: Base`,
          `Nonce: ${nonce}`,
          `Issued At: ${new Date().toISOString()}`,
        ].join("\n");

        // 3. Ask the wallet to sign the message
        const signature = await signMessage({ message });

        // 4. Send to backend for verification
        const data = await authWalletLogin(address, signature, message, nonce);
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser(data.user);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Wallet sign-in failed";
        if (!msg.includes("rejected") && !msg.includes("denied")) {
          setError(msg);
        }
        throw err;
      }
    },
    []
  );

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
        loginWithWallet,
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
