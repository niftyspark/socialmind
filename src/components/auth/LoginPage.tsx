import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { FiAlertCircle, FiLoader } from "react-icons/fi";

export function LoginPage() {
  const { loginWithWallet, error, clearError, isLoading } = useAuth();
  const { openConnectModal } = useConnectModal();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [signingIn, setSigningIn] = useState(false);

  // When wallet connects, auto-trigger SIWE sign-in
  useEffect(() => {
    if (isConnected && address && !signingIn) {
      handleSignIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  const handleSignIn = async () => {
    if (!address) return;
    clearError();
    setSigningIn(true);
    try {
      await loginWithWallet(address, signMessageAsync);
    } catch {
      // If sign-in fails, disconnect wallet so user can retry
      disconnect();
    } finally {
      setSigningIn(false);
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
          <p className="auth-chain-badge">
            <span className="chain-dot" />
            Base Chain
          </p>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: 16 }}>
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {signingIn ? (
          <div className="auth-signing">
            <FiLoader className="spin" size={24} />
            <p>Sign the message in your wallet to continue...</p>
          </div>
        ) : (
          <button
            className="auth-wallet-btn"
            onClick={openConnectModal}
            disabled={signingIn}
          >
            <WalletIcon />
            <span>Connect Wallet</span>
          </button>
        )}

        <div className="auth-wallet-info">
          <p>Connect your wallet on Base chain to sign in.</p>
          <p>No email or password needed.</p>
        </div>

        <div className="auth-wallets-supported">
          <span>Supports</span>
          <div className="wallet-logos">
            <span className="wallet-tag">MetaMask</span>
            <span className="wallet-tag">Coinbase Wallet</span>
            <span className="wallet-tag">WalletConnect</span>
            <span className="wallet-tag">Rainbow</span>
          </div>
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

function WalletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
