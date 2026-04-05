import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FiMail,
  FiLock,
  FiUser,
  FiArrowRight,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function LoginPage() {
  const { login, register, loginWithGoogle, error, clearError, isLoading } =
    useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name);
    } catch {
      // Error handled by context
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      // Error handled by context
    } finally {
      setGoogleLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">SM</span>
          </div>
          <h1 className="auth-title">SocialMind</h1>
          <p className="auth-subtitle">Autonomous AI Social Media Agent</p>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || submitting}
        >
          {googleLoading ? (
            <FiLoader className="spin" />
          ) : (
            <GoogleIcon />
          )}
          <span>Sign in with Google</span>
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        {error && (
          <div className="auth-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="auth-field">
              <div className="auth-input-wrapper">
                <FiUser className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <div className="auth-input-wrapper">
              <FiMail className="auth-input-icon" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-input-wrapper">
              <FiLock className="auth-input-icon" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="auth-input"
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={submitting || googleLoading}
          >
            {submitting ? (
              <div className="loading-spinner small" />
            ) : (
              <>
                <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                <FiArrowRight />
              </>
            )}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button className="auth-toggle-btn" onClick={() => { setMode("register"); clearError(); }}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button className="auth-toggle-btn" onClick={() => { setMode("login"); clearError(); }}>
                Sign in
              </button>
            </p>
          )}
        </div>

        <div className="auth-features">
          <div className="auth-feature">
            <span className="feature-dot" />
            <span>Setup once, auto-post forever</span>
          </div>
          <div className="auth-feature">
            <span className="feature-dot" />
            <span>X, Facebook & Instagram</span>
          </div>
          <div className="auth-feature">
            <span className="feature-dot" />
            <span>AI-powered personality engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
