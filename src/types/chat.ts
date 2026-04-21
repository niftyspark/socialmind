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
  apiKey: "",
  model: "llama-3.3-70b-versatile",
  theme: "dark",
  temperature: 1,
  topP: 1,
  maxTokens: 4096,
  systemPrompt: "You are a helpful AI assistant for SocialMind, a social media automation platform.",
  siteUrl: "",
  siteName: "SocialMind",
};

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "Groq" },
  { id: "llama-3.1-70b-versatile", name: "Llama 3.1 70B", provider: "Groq" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", provider: "Groq" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "Groq" },
  { id: "gemma2-9b-8192", name: "Gemma 2 9B", provider: "Groq" },
];
