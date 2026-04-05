import { FiPlus, FiX } from "react-icons/fi";
import { useState } from "react";
import type { PersonalityConfig, ToneStyle } from "../../types/agent";

interface Props {
  personality: PersonalityConfig;
  onChange: (personality: PersonalityConfig) => void;
}

const TONE_OPTIONS: { value: ToneStyle; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Polished, authoritative, business-like" },
  { value: "casual", label: "Casual", description: "Relaxed, conversational, approachable" },
  { value: "witty", label: "Witty", description: "Clever, humorous, sharp observations" },
  { value: "informative", label: "Informative", description: "Educational, data-driven, insightful" },
  { value: "provocative", label: "Provocative", description: "Bold, controversial, thought-provoking" },
  { value: "friendly", label: "Friendly", description: "Warm, supportive, community-focused" },
  { value: "authoritative", label: "Authoritative", description: "Expert-level, commanding, decisive" },
];

export function PersonalityVoice({ personality, onChange }: Props) {
  const [newTopic, setNewTopic] = useState("");
  const [newExample, setNewExample] = useState("");
  const [newForbidden, setNewForbidden] = useState("");

  const update = <K extends keyof PersonalityConfig>(field: K, value: PersonalityConfig[K]) => {
    onChange({ ...personality, [field]: value });
  };

  const addTopic = () => {
    if (newTopic.trim()) {
      update("topics", [...personality.topics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const removeTopic = (index: number) => {
    update("topics", personality.topics.filter((_, i) => i !== index));
  };

  const addExample = () => {
    if (newExample.trim()) {
      update("examplePosts", [...personality.examplePosts, newExample.trim()]);
      setNewExample("");
    }
  };

  const removeExample = (index: number) => {
    update("examplePosts", personality.examplePosts.filter((_, i) => i !== index));
  };

  const addForbidden = () => {
    if (newForbidden.trim()) {
      update("doNotMention", [...personality.doNotMention, newForbidden.trim()]);
      setNewForbidden("");
    }
  };

  const removeForbidden = (index: number) => {
    update("doNotMention", personality.doNotMention.filter((_, i) => i !== index));
  };

  return (
    <div className="wizard-form">
      {/* Tone selector */}
      <div className="form-group">
        <label className="form-label">Communication Tone <span className="required">*</span></label>
        <div className="tone-grid">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone.value}
              className={`tone-card ${personality.tone === tone.value ? "selected" : ""}`}
              onClick={() => update("tone", tone.value)}
              type="button"
            >
              <span className="tone-label">{tone.label}</span>
              <span className="tone-desc">{tone.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Writing style */}
      <div className="form-group">
        <label className="form-label">Writing Style Description</label>
        <textarea
          className="form-textarea"
          placeholder="Describe how your agent writes. Be specific about sentence length, vocabulary level, use of jargon, paragraph structure, etc.&#10;&#10;Example: 'Uses short, punchy sentences. Mixes technical terms with plain language. Often starts posts with a bold statement or question. Frequently uses bullet points and numbered lists.'"
          value={personality.writingStyle}
          onChange={(e) => update("writingStyle", e.target.value)}
          rows={4}
        />
      </div>

      {/* Topics */}
      <div className="form-group">
        <label className="form-label">Topics of Expertise</label>
        <div className="tag-input-row">
          <input
            type="text"
            className="form-input"
            placeholder="Add a topic (e.g., AI, Web3, Marketing...)"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
          />
          <button className="btn btn-secondary btn-sm" onClick={addTopic} type="button">
            <FiPlus />
          </button>
        </div>
        <div className="tag-list">
          {personality.topics.map((topic, i) => (
            <span key={i} className="tag">
              {topic}
              <button onClick={() => removeTopic(i)} type="button"><FiX /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Example posts */}
      <div className="form-group">
        <label className="form-label">Example Posts (for style reference)</label>
        <div className="tag-input-row">
          <textarea
            className="form-textarea"
            placeholder="Paste an example post that represents the style you want..."
            value={newExample}
            onChange={(e) => setNewExample(e.target.value)}
            rows={2}
          />
          <button className="btn btn-secondary btn-sm" onClick={addExample} type="button">
            <FiPlus />
          </button>
        </div>
        <div className="example-list">
          {personality.examplePosts.map((example, i) => (
            <div key={i} className="example-item">
              <p>"{example}"</p>
              <button onClick={() => removeExample(i)} type="button" className="remove-btn"><FiX /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Forbidden topics */}
      <div className="form-group">
        <label className="form-label">Do NOT Mention (forbidden topics)</label>
        <div className="tag-input-row">
          <input
            type="text"
            className="form-input"
            placeholder="Topics to avoid (e.g., competitors, politics...)"
            value={newForbidden}
            onChange={(e) => setNewForbidden(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addForbidden())}
          />
          <button className="btn btn-secondary btn-sm" onClick={addForbidden} type="button">
            <FiPlus />
          </button>
        </div>
        <div className="tag-list">
          {personality.doNotMention.map((item, i) => (
            <span key={i} className="tag tag-danger">
              {item}
              <button onClick={() => removeForbidden(i)} type="button"><FiX /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Custom system prompt override */}
      <div className="form-group">
        <label className="form-label">Advanced: Custom System Prompt (optional)</label>
        <textarea
          className="form-textarea"
          placeholder="Override or extend the auto-generated system prompt with custom instructions..."
          value={personality.systemPrompt}
          onChange={(e) => update("systemPrompt", e.target.value)}
          rows={3}
        />
        <span className="form-hint">Leave empty to auto-generate from your settings above</span>
      </div>
    </div>
  );
}
