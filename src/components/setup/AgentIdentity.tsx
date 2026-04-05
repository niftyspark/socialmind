import { FiUser, FiEdit3 } from "react-icons/fi";
import type { AgentIdentity as AgentIdentityType } from "../../types/agent";

interface Props {
  identity: AgentIdentityType;
  onChange: (identity: AgentIdentityType) => void;
}

export function AgentIdentity({ identity, onChange }: Props) {
  const update = (field: keyof AgentIdentityType, value: string) => {
    onChange({ ...identity, [field]: value });
  };

  return (
    <div className="wizard-form">
      <div className="form-section">
        <div className="form-row avatar-row">
          <div className="avatar-upload">
            {identity.avatar ? (
              <img src={identity.avatar} alt="Agent avatar" className="avatar-preview" />
            ) : (
              <div className="avatar-placeholder">
                <FiUser />
              </div>
            )}
            <label className="avatar-upload-btn">
              <FiEdit3 />
              <span>Upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => update("avatar", reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
                hidden
              />
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Agent Name <span className="required">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., TechSavvy Sarah, CryptoKing, BrandBot..."
            value={identity.name}
            onChange={(e) => update("name", e.target.value)}
            maxLength={50}
          />
          <span className="form-hint">This is how your agent will be identified</span>
        </div>

        <div className="form-group">
          <label className="form-label">
            Tagline
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., Sharing AI insights daily"
            value={identity.tagline}
            onChange={(e) => update("tagline", e.target.value)}
            maxLength={100}
          />
          <span className="form-hint">A short description for your agent's profile</span>
        </div>

        <div className="form-group">
          <label className="form-label">
            Bio / Description <span className="required">*</span>
          </label>
          <textarea
            className="form-textarea"
            placeholder="Describe your agent's background, expertise, and what kind of content they create. The more detail, the better the AI will understand your agent's persona.&#10;&#10;Example: 'A tech enthusiast and former startup founder who shares insights about AI, Web3, and the future of work. Known for breaking down complex topics into simple, actionable advice.'"
            value={identity.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={6}
            maxLength={1000}
          />
          <span className="form-hint">{identity.bio.length}/1000 characters</span>
        </div>
      </div>
    </div>
  );
}
