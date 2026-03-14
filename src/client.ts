import type {
  AgentCoreConfig,
  CreateCallParams,
  Call,
  Transcript,
  CreateAgentParams,
  UpdateAgentParams,
  Agent,
  PhoneNumber,
  Provider,
  CreateWebhookParams,
  Webhook,
  WebhookPayload,
} from "./types";
import { AgentCoreError } from "./types";

export class AgentCore {
  private apiKey: string;
  private baseUrl: string;
  private webhookSecret?: string;

  public calls: CallsAPI;
  public agents: AgentsAPI;
  public numbers: NumbersAPI;
  public webhooks: WebhooksAPI;

  constructor(config: AgentCoreConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.webhookSecret = config.webhookSecret;

    this.calls = new CallsAPI(this);
    this.agents = new AgentsAPI(this);
    this.numbers = new NumbersAPI(this);
    this.webhooks = new WebhooksAPI(this);
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`;
    const headers: Record<string, string> = {
      "X-API-Key": this.apiKey,
      "Content-Type": "application/json",
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new AgentCoreError(res.status, error.detail || res.statusText);
    }

    return res.json() as Promise<T>;
  }

  verifyWebhook(payload: string, signature: string): WebhookPayload {
    if (!this.webhookSecret) {
      throw new Error("webhookSecret not configured");
    }

    const crypto = globalThis.crypto || require("crypto");

    if ("subtle" in crypto) {
      // Can't do sync HMAC with Web Crypto — use simple comparison
      // For full async verification, use verifyWebhookAsync
      throw new Error("Use verifyWebhookAsync() in browser/edge environments");
    }

    const { createHmac } = require("crypto") as typeof import("crypto");
    const expected = createHmac("sha256", this.webhookSecret)
      .update(payload)
      .digest("hex");

    if (expected !== signature) {
      throw new Error("Invalid webhook signature");
    }

    return JSON.parse(payload);
  }

  async verifyWebhookAsync(
    payload: string,
    signature: string
  ): Promise<WebhookPayload> {
    if (!this.webhookSecret) {
      throw new Error("webhookSecret not configured");
    }

    // Node.js crypto
    try {
      const { createHmac } = await import("crypto");
      const expected = createHmac("sha256", this.webhookSecret)
        .update(payload)
        .digest("hex");

      if (expected !== signature) {
        throw new Error("Invalid webhook signature");
      }

      return JSON.parse(payload);
    } catch (e) {
      if ((e as Error).message === "Invalid webhook signature") throw e;

      // Web Crypto fallback
      const enc = new TextEncoder();
      const key = await globalThis.crypto.subtle.importKey(
        "raw",
        enc.encode(this.webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sig = await globalThis.crypto.subtle.sign(
        "HMAC",
        key,
        enc.encode(payload)
      );
      const expected = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (expected !== signature) {
        throw new Error("Invalid webhook signature");
      }

      return JSON.parse(payload);
    }
  }
}

// ── Calls ──

class CallsAPI {
  constructor(private client: AgentCore) {}

  async create(params: CreateCallParams): Promise<Call> {
    return this.client.request<Call>("POST", "/calls", {
      phone: params.phone,
      agent_id: params.agentId,
      webhook_url: params.webhookUrl,
      metadata: params.metadata,
    });
  }

  async get(callId: string): Promise<Call> {
    return this.client.request<Call>("GET", `/calls/${callId}`);
  }

  async list(limit = 50, offset = 0): Promise<Call[]> {
    return this.client.request<Call[]>(
      "GET",
      `/calls?limit=${limit}&offset=${offset}`
    );
  }

  async transcript(callId: string): Promise<Transcript> {
    return this.client.request<Transcript>(
      "GET",
      `/calls/${callId}/transcript`
    );
  }

  async hangup(callId: string): Promise<{ call_id: string; status: string }> {
    return this.client.request("POST", `/calls/${callId}/hangup`);
  }
}

// ── Agents ──

class AgentsAPI {
  constructor(private client: AgentCore) {}

  async create(params: CreateAgentParams): Promise<Agent> {
    return this.client.request<Agent>("POST", "/agents", params);
  }

  async get(agentId: string): Promise<Agent> {
    return this.client.request<Agent>("GET", `/agents/${agentId}`);
  }

  async list(): Promise<{ agents: Agent[] }> {
    return this.client.request<{ agents: Agent[] }>("GET", "/agents");
  }

  async update(agentId: string, params: UpdateAgentParams): Promise<Agent> {
    return this.client.request<Agent>("PUT", `/agents/${agentId}`, params);
  }

  async delete(agentId: string): Promise<{ status: string }> {
    return this.client.request("DELETE", `/agents/${agentId}`);
  }

  async schema(): Promise<Record<string, unknown>> {
    return this.client.request("GET", "/agents/schema");
  }
}

// ── Numbers ──

class NumbersAPI {
  constructor(private client: AgentCore) {}

  async list(): Promise<{ numbers: PhoneNumber[] }> {
    return this.client.request("GET", "/numbers");
  }

  async providers(): Promise<{ providers: Provider[] }> {
    return this.client.request("GET", "/providers");
  }
}

// ── Webhooks ──

class WebhooksAPI {
  constructor(private client: AgentCore) {}

  async create(params: CreateWebhookParams): Promise<Webhook> {
    return this.client.request<Webhook>("POST", "/webhooks", params);
  }

  async list(): Promise<{ webhooks: Webhook[] }> {
    return this.client.request("GET", "/webhooks");
  }

  async delete(webhookId: string): Promise<{ status: string }> {
    return this.client.request("DELETE", `/webhooks/${webhookId}`);
  }
}
