import { FiZap, FiCalendar, FiTrendingUp, FiMessageCircle } from "react-icons/fi";

interface Props {
  onSuggestion: (text: string) => void;
}

const suggestions = [
  {
    icon: <FiZap />,
    label: "Generate a post",
    prompt: "Generate an engaging tweet about the latest trends in AI and social media automation",
  },
  {
    icon: <FiCalendar />,
    label: "Content calendar",
    prompt: "Help me plan a week of social media content for a tech startup brand",
  },
  {
    icon: <FiTrendingUp />,
    label: "Trending topics",
    prompt: "What are the top trending topics on social media right now that I should post about?",
  },
  {
    icon: <FiMessageCircle />,
    label: "Engagement tips",
    prompt: "Give me 5 strategies to increase engagement on my social media posts",
  },
];

export function WelcomeScreen({ onSuggestion }: Props) {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-logo">
          <span className="welcome-logo-icon">SM</span>
        </div>
        <h1 className="welcome-title">SocialMind</h1>
        <p className="welcome-subtitle">
          Chat with your AI agent to test its voice and generate content
        </p>

        <div className="suggestion-grid">
          {suggestions.map((s) => (
            <button
              key={s.label}
              className="suggestion-card"
              onClick={() => onSuggestion(s.prompt)}
            >
              <span className="suggestion-icon">{s.icon}</span>
              <span className="suggestion-label">{s.label}</span>
              <span className="suggestion-prompt">{s.prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
