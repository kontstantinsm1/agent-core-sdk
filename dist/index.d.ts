interface AgentCoreConfig {
    apiKey: string;
    baseUrl: string;
    webhookSecret?: string;
    defaultAgentId?: string;
    defaultWebhookUrl?: string;
    defaultCallerId?: string;
}
interface CreateCallParams {
    phone: string;
    agentId?: string;
    webhookUrl?: string;
    callerId?: string;
    metadata?: Record<string, string>;
}
/**
 * Minimal call params — phone only, rest from defaults.
 */
type QuickCallParams = string | CreateCallParams;
interface Call {
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
interface Transcript {
    callId: string;
    transcript: TranscriptEntry[] | string;
}
interface TranscriptEntry {
    role: "bot" | "user" | "assistant";
    text: string;
    timestamp?: number;
}
interface CreateAgentParams {
    name: string;
    config?: AgentConfig;
}
interface UpdateAgentParams {
    name?: string;
    config?: AgentConfig;
}
interface Agent {
    id: string;
    name: string;
    config: AgentConfig;
    created_at: string;
    updated_at: string;
}
interface AgentConfig {
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
interface PhoneNumber {
    number: string;
    provider: string;
    country: string;
}
interface Provider {
    key: string;
    name: string;
    country: string;
    dial_mode: string;
    numbers_count: number;
    is_default: boolean;
}
interface CreateWebhookParams {
    url: string;
    events?: string[];
}
interface Webhook {
    id: string;
    url: string;
    events: string[];
    created_at: string;
}
type WebhookEvent = "call.queued" | "call.started" | "call.completed" | "call.failed";
interface WebhookPayload {
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
declare class AgentCoreError extends Error {
    status: number;
    detail: string;
    constructor(status: number, detail: string);
}

declare class AgentCore {
    private apiKey;
    private baseUrl;
    private webhookSecret?;
    readonly defaultAgentId?: string;
    readonly defaultWebhookUrl?: string;
    readonly defaultCallerId?: string;
    calls: CallsAPI;
    agents: AgentsAPI;
    numbers: NumbersAPI;
    webhooks: WebhooksAPI;
    constructor(config: AgentCoreConfig);
    request<T>(method: string, path: string, body?: unknown): Promise<T>;
    verifyWebhook(payload: string, signature: string): WebhookPayload;
    verifyWebhookAsync(payload: string, signature: string): Promise<WebhookPayload>;
}
declare class CallsAPI {
    private client;
    constructor(client: AgentCore);
    /**
     * Create a call. Pass a phone string or full params object.
     *
     * @example
     * // Quick — uses defaultAgentId & defaultWebhookUrl from config
     * await agent.calls.create("+380501234567")
     *
     * // Full
     * await agent.calls.create({ phone: "+380501234567", agentId: "..." })
     */
    create(params: QuickCallParams): Promise<Call>;
    get(callId: string): Promise<Call>;
    list(limit?: number, offset?: number): Promise<Call[]>;
    transcript(callId: string): Promise<Transcript>;
    hangup(callId: string): Promise<{
        call_id: string;
        status: string;
    }>;
}
declare class AgentsAPI {
    private client;
    constructor(client: AgentCore);
    create(params: CreateAgentParams): Promise<Agent>;
    get(agentId: string): Promise<Agent>;
    list(): Promise<{
        agents: Agent[];
    }>;
    update(agentId: string, params: UpdateAgentParams): Promise<Agent>;
    delete(agentId: string): Promise<{
        status: string;
    }>;
    schema(): Promise<Record<string, unknown>>;
}
declare class NumbersAPI {
    private client;
    constructor(client: AgentCore);
    list(): Promise<{
        numbers: PhoneNumber[];
    }>;
    providers(): Promise<{
        providers: Provider[];
    }>;
}
declare class WebhooksAPI {
    private client;
    constructor(client: AgentCore);
    create(params: CreateWebhookParams): Promise<Webhook>;
    list(): Promise<{
        webhooks: Webhook[];
    }>;
    delete(webhookId: string): Promise<{
        status: string;
    }>;
}

export { type Agent, type AgentConfig, AgentCore, type AgentCoreConfig, AgentCoreError, type Call, type CreateAgentParams, type CreateCallParams, type CreateWebhookParams, type PhoneNumber, type Provider, type Transcript, type TranscriptEntry, type UpdateAgentParams, type Webhook, type WebhookEvent, type WebhookPayload };
