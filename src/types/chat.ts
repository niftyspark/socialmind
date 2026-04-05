export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  model?: string;
  tokenUsage?: TokenUsage;
  isStreaming?: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  model: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

export interface AppSettings {
  apiKey: string;
  model: string;
  theme: "dark" | "light";
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  siteUrl: string;
  siteName: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "", // No longer needed client-side — backend proxies all requests
  model: "anthropic/claude-sonnet-4",
  theme: "dark",
  temperature: 1,
  topP: 1,
  maxTokens: 4096,
  systemPrompt: "You are a helpful AI assistant for SocialMind, a social media automation platform.",
  siteUrl: "",
  siteName: "SocialMind",
};

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: "anthropic/claude-opus-4.6", name: "Claude Opus 4.6", provider: "Anthropic" },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "openai/o3-mini", name: "o3 Mini", provider: "OpenAI" },
  { id: "google/gemini-2.5-pro-preview", name: "Gemini 2.5 Pro", provider: "Google" },
  { id: "google/gemini-2.5-flash-preview", name: "Gemini 2.5 Flash", provider: "Google" },
  { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek" },
  { id: "deepseek/deepseek-chat-v3-0324", name: "DeepSeek V3", provider: "DeepSeek" },
  { id: "mistralai/mistral-large-latest", name: "Mistral Large", provider: "Mistral" },
];
