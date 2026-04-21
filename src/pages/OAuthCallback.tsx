import { useEffect, useState } from "react";
import { FiLoader } from "react-icons/fi";

export function OAuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");

    if (errorParam) {
      setError(errorParam);
      window.opener?.postMessage({ type: "google-oauth-error", error: errorParam }, "*");
      setTimeout(() => window.close(), 2000);
      return;
    }

    if (code) {
      fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "google-code", code }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.token && data.user) {
            window.opener?.postMessage(
              { type: "google-oauth-success", token: data.token, user: data.user },
              "*"
            );
            setTimeout(() => window.close(), 1000);
          } else {
            throw new Error(data.error || "Failed to complete sign-in");
          }
        })
        .catch((err) => {
          setError(err.message);
          window.opener?.postMessage(
            { type: "google-oauth-error", error: err.message },
            "*"
          );
          setTimeout(() => window.close(), 2000);
        });
    }
  }, []);

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-error">
            <span>{error}</span>
          </div>
          <p>Closing window...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-loading">
        <FiLoader className="spin" size={32} />
        <p>Completing sign-in...</p>
      </div>
    </div>
  );
}