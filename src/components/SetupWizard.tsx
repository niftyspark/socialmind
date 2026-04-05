import { useState, useCallback } from "react";
import { FiCheck, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { WIZARD_STEPS, DEFAULT_AGENT_CONFIG } from "../types/agent";
import type { AgentConfig, WizardStepId } from "../types/agent";
import { saveAgentConfig } from "../utils/api";

import { AgentIdentity } from "./setup/AgentIdentity";
import { PersonalityVoice } from "./setup/PersonalityVoice";
import { InspirationAccounts } from "./setup/InspirationAccounts";
import { PlatformConnect } from "./setup/PlatformConnect";
import { PostingSchedule } from "./setup/PostingSchedule";
import { ContentRules } from "./setup/ContentRules";
import { ReviewLaunch } from "./setup/ReviewLaunch";

interface Props {
  existingConfig?: AgentConfig | null;
  onComplete: () => void;
}

export function SetupWizard({ existingConfig, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Partial<AgentConfig>>(
    existingConfig || { ...DEFAULT_AGENT_CONFIG }
  );

  const updateConfig = useCallback((updates: Partial<AgentConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((index: number) => {
    if (index <= currentStep) {
      setCurrentStep(index);
    }
  }, [currentStep]);

  const handleLaunch = useCallback(async () => {
    setSaving(true);
    try {
      const finalConfig = {
        ...config,
        status: "active" as const,
      };
      await saveAgentConfig(finalConfig);
      onComplete();
    } catch (err) {
      console.error("Failed to save agent config:", err);
    } finally {
      setSaving(false);
    }
  }, [config, onComplete]);

  const currentStepDef = WIZARD_STEPS[currentStep];

  const renderStep = () => {
    switch (currentStepDef.id as WizardStepId) {
      case "identity":
        return (
          <AgentIdentity
            identity={config.identity || DEFAULT_AGENT_CONFIG.identity}
            onChange={(identity) => updateConfig({ identity })}
          />
        );
      case "personality":
        return (
          <PersonalityVoice
            personality={config.personality || DEFAULT_AGENT_CONFIG.personality}
            onChange={(personality) => updateConfig({ personality })}
          />
        );
      case "inspiration":
        return (
          <InspirationAccounts
            accounts={config.inspiration || []}
            onChange={(inspiration) => updateConfig({ inspiration })}
          />
        );
      case "platforms":
        return (
          <PlatformConnect
            platforms={config.platforms || DEFAULT_AGENT_CONFIG.platforms}
            onChange={(platforms) => updateConfig({ platforms })}
          />
        );
      case "schedule":
        return (
          <PostingSchedule
            schedule={config.schedule || DEFAULT_AGENT_CONFIG.schedule}
            onChange={(schedule) => updateConfig({ schedule })}
          />
        );
      case "rules":
        return (
          <ContentRules
            rules={config.rules || DEFAULT_AGENT_CONFIG.rules}
            onChange={(rules) => updateConfig({ rules })}
          />
        );
      case "review":
        return (
          <ReviewLaunch
            config={config as AgentConfig}
            onLaunch={handleLaunch}
            saving={saving}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="wizard-container">
      {/* Progress Steps */}
      <div className="wizard-progress">
        <div className="wizard-progress-inner">
          {WIZARD_STEPS.map((step, index) => (
            <button
              key={step.id}
              className={`wizard-step-indicator ${
                index === currentStep ? "active" : ""
              } ${index < currentStep ? "completed" : ""}`}
              onClick={() => goToStep(index)}
              disabled={index > currentStep}
            >
              <div className="step-number">
                {index < currentStep ? <FiCheck /> : index + 1}
              </div>
              <div className="step-info">
                <span className="step-title">{step.title}</span>
                <span className="step-desc">{step.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="wizard-content">
        <div className="wizard-step-header">
          <h2>{currentStepDef.title}</h2>
          <p>{currentStepDef.description}</p>
        </div>

        <div className="wizard-step-body">{renderStep()}</div>

        {/* Navigation */}
        {currentStepDef.id !== "review" && (
          <div className="wizard-nav">
            <button
              className="btn btn-secondary"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <FiChevronLeft />
              <span>Back</span>
            </button>

            <div className="wizard-step-count">
              Step {currentStep + 1} of {WIZARD_STEPS.length}
            </div>

            <button className="btn btn-primary" onClick={nextStep}>
              <span>Continue</span>
              <FiChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
