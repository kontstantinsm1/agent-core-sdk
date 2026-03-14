// ── Config ──

export interface AgentCoreConfig {
  apiKey: string;
  baseUrl: string;
  webhookSecret?: string;
  defaultAgentId?: string;
  defaultWebhookUrl?: string;
}

// ── Calls ──

export interface CreateCallParams {
  phone: string;
  agentId?: string;
  webhookUrl?: string;
  metadata?: Record<string, string>;
}

/**
 * Minimal call params — phone only, rest from defaults.
 */
export type QuickCallParams = string | CreateCallParams;

export interface Call {
  callId: string;
  status: "queued" | "in_progress" | "completed" | "failed" | "cancelled";
  phone: string;
  agentId?: string | null;
  duration?: number | null;
  transcript?: string | null;
  error?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface Transcript {
  callId: string;
  transcript: TranscriptEntry[] | string;
}

export interface TranscriptEntry {
  role: "bot" | "user" | "assistant";
  text: string;
  timestamp?: number;
}

// ── Agents ──

export interface CreateAgentParams {
  name: string;
  config?: AgentConfig;
}

export interface UpdateAgentParams {
  name?: string;
  config?: AgentConfig;
}

export interface Agent {
  id: string;
  name: string;
  config: AgentConfig;
  created_at: string;
  updated_at: string;
}

export interface AgentConfig {
  system_prompt?: string;
  llm?: {
    provider?: string;
    model?: string;
    temperature?: number;
  };
  tts?: {
    provider?: string;
    voice_id?: string;
    language?: string;
    speed?: number;
    volume?: number;
    emotion?: string;
  };
  stt?: {
    provider?: string;
    language?: string;
  };
  vad?: {
    stop_secs?: number;
    start_secs?: number;
    min_volume?: number;
  };
  greeting_delay?: number;
  advanced?: {
    allow_interruptions?: boolean;
  };
  flow?: Record<string, unknown>;
}

// ── Numbers ──

export interface PhoneNumber {
  number: string;
  provider: string;
  country: string;
}

export interface Provider {
  key: string;
  name: string;
  country: string;
  dial_mode: string;
  numbers_count: number;
  is_default: boolean;
}

// ── Webhooks ──

export interface CreateWebhookParams {
  url: string;
  events?: string[];
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  created_at: string;
}

export type WebhookEvent =
  | "call.queued"
  | "call.started"
  | "call.completed"
  | "call.failed";

export interface WebhookPayload {
  event: WebhookEvent;
  call_id: string;
  status: string;
  phone: string;
  duration?: number;
  agent_id?: string;
  transcript?: TranscriptEntry[];
  fields?: Record<string, string>;
  [key: string]: unknown;
}

// ── Errors ──

export class AgentCoreError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(`AgentCore API error ${status}: ${detail}`);
    this.name = "AgentCoreError";
    this.status = status;
    this.detail = detail;
  }
}
