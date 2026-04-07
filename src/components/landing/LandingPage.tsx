import { lazy, Suspense } from "react";
import { FiZap, FiClock, FiUsers, FiShield, FiArrowRight, FiCheck, FiStar } from "react-icons/fi";

const Scene3D = lazy(() => import("./Scene3D").then((m) => ({ default: m.Scene3D })));
import { FaXTwitter, FaFacebook, FaInstagram } from "react-icons/fa6";

interface Props {
  onEnterApp: () => void;
}

const FEATURES = [
  {
    icon: <FiZap />,
    title: "AI-Powered Content",
    desc: "Advanced AI generates engaging, on-brand posts that match your unique voice and personality.",
  },
  {
    icon: <FiClock />,
    title: "Autonomous Scheduling",
    desc: "Set it and forget it. Your agent posts at optimal times across all your connected platforms.",
  },
  {
    icon: <FiUsers />,
    title: "Multi-Platform",
    desc: "Connect Instagram, X (Twitter), and Facebook. One agent, all your social channels.",
  },
  {
    icon: <FiShield />,
    title: "Full Control",
    desc: "Define tone, topics, rules, and boundaries. Your agent stays on-brand, always.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for trying out SocialMind",
    features: [
      "1 AI agent",
      "1 connected platform",
      "3 posts per day",
      "Basic content generation",
      "Manual posting",
      "Community support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For creators and small businesses",
    features: [
      "3 AI agents",
      "All platforms (X, FB, IG)",
      "15 posts per day",
      "Advanced AI personalities",
      "Auto-posting on schedule",
      "Image library (100 images)",
      "Analytics dashboard",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$49",
    period: "/month",
    description: "For agencies and teams",
    features: [
      "Unlimited AI agents",
      "All platforms + LinkedIn",
      "Unlimited posts",
      "Custom AI model tuning",
      "Team collaboration",
      "Image library (unlimited)",
      "Advanced analytics & reports",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function LandingPage({ onEnterApp }: Props) {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <span className="landing-logo">SM</span>
            <span className="landing-brand-text">SocialMind</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
          </div>
          <button className="landing-cta-btn" onClick={onEnterApp}>
            Launch App <FiArrowRight />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <Suspense fallback={<div className="scene3d-container" />}>
          <Scene3D />
        </Suspense>
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <FiStar /> AI-Powered Social Media Automation
          </div>
          <h1 className="landing-hero-title">
            Your Social Media
            <br />
            <span className="landing-gradient-text">On Autopilot</span>
          </h1>
          <p className="landing-hero-desc">
            Setup an AI agent with your brand's personality. It creates content,
            picks the right time, and posts to Instagram, X, and Facebook — automatically.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-hero-btn primary" onClick={onEnterApp}>
              Start Free <FiArrowRight />
            </button>
            <a className="landing-hero-btn secondary" href="#features">
              See How It Works
            </a>
          </div>
          <div className="landing-hero-platforms">
            <FaInstagram />
            <FaXTwitter />
            <FaFacebook />
            <span>Works with all major platforms</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features" id="features">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">
            Everything You Need to
            <br />
            <span className="landing-gradient-text">Automate Social Media</span>
          </h2>
          <p className="landing-section-desc">
            SocialMind combines advanced AI content generation with autonomous
            scheduling to keep your social presence active 24/7.
          </p>
          <div className="landing-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="landing-feature-card">
                <div className="landing-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-steps">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">
            Live in <span className="landing-gradient-text">3 Steps</span>
          </h2>
          <div className="landing-steps-grid">
            <div className="landing-step">
              <div className="landing-step-num">1</div>
              <h3>Create Your Agent</h3>
              <p>Define your brand's personality, tone, and topics through our guided wizard.</p>
            </div>
            <div className="landing-step">
              <div className="landing-step-num">2</div>
              <h3>Connect Platforms</h3>
              <p>Link Instagram, X, and Facebook in one click via secure OAuth.</p>
            </div>
            <div className="landing-step">
              <div className="landing-step-num">3</div>
              <h3>Sit Back</h3>
              <p>Your agent generates content and posts on schedule. You stay in control.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="landing-pricing" id="pricing">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">
            Simple <span className="landing-gradient-text">Pricing</span>
          </h2>
          <p className="landing-section-desc">
            Start free. Scale when you're ready.
          </p>
          <div className="landing-pricing-grid">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`landing-plan-card ${plan.highlighted ? "highlighted" : ""}`}
              >
                {plan.highlighted && <div className="plan-badge">Most Popular</div>}
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">
                  <span className="plan-amount">{plan.price}</span>
                  {plan.period && <span className="plan-period">{plan.period}</span>}
                </div>
                <p className="plan-desc">{plan.description}</p>
                <ul className="plan-features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <FiCheck /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`plan-cta ${plan.highlighted ? "primary" : "secondary"}`}
                  onClick={onEnterApp}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <span className="landing-logo small">SM</span>
            <span>SocialMind</span>
          </div>
          <p className="landing-footer-copy">
            Autonomous AI social media agents. Built for creators and businesses.
          </p>
        </div>
      </footer>
    </div>
  );
}
