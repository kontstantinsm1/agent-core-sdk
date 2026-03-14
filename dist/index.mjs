var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/types.ts
var AgentCoreError = class extends Error {
  constructor(status, detail) {
    super(`AgentCore API error ${status}: ${detail}`);
    this.name = "AgentCoreError";
    this.status = status;
    this.detail = detail;
  }
};

// src/client.ts
var AgentCore = class {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.webhookSecret = config.webhookSecret;
    this.defaultAgentId = config.defaultAgentId;
    this.defaultWebhookUrl = config.defaultWebhookUrl;
    this.defaultCallerId = config.defaultCallerId;
    this.defaultStepSave = config.defaultStepSave ?? true;
    this.calls = new CallsAPI(this);
    this.agents = new AgentsAPI(this);
    this.numbers = new NumbersAPI(this);
    this.webhooks = new WebhooksAPI(this);
  }
  async request(method, path, body) {
    const url = `${this.baseUrl}/api/v1${path}`;
    const headers = {
      "X-API-Key": this.apiKey,
      "Content-Type": "application/json"
    };
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : void 0
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new AgentCoreError(res.status, error.detail || res.statusText);
    }
    return res.json();
  }
  verifyWebhook(payload, signature) {
    if (!this.webhookSecret) {
      throw new Error("webhookSecret not configured");
    }
    const crypto = globalThis.crypto || __require("crypto");
    if ("subtle" in crypto) {
      throw new Error("Use verifyWebhookAsync() in browser/edge environments");
    }
    const { createHmac } = __require("crypto");
    const expected = createHmac("sha256", this.webhookSecret).update(payload).digest("hex");
    if (expected !== signature) {
      throw new Error("Invalid webhook signature");
    }
    return JSON.parse(payload);
  }
  async verifyWebhookAsync(payload, signature) {
    if (!this.webhookSecret) {
      throw new Error("webhookSecret not configured");
    }
    try {
      const { createHmac } = await import("crypto");
      const expected = createHmac("sha256", this.webhookSecret).update(payload).digest("hex");
      if (expected !== signature) {
        throw new Error("Invalid webhook signature");
      }
      return JSON.parse(payload);
    } catch (e) {
      if (e.message === "Invalid webhook signature") throw e;
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
      const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
      if (expected !== signature) {
        throw new Error("Invalid webhook signature");
      }
      return JSON.parse(payload);
    }
  }
};
var CallsAPI = class {
  constructor(client) {
    this.client = client;
  }
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
  async create(params) {
    const p = typeof params === "string" ? { phone: params } : params;
    return this.client.request("POST", "/calls", {
      phone: p.phone,
      agent_id: p.agentId || this.client.defaultAgentId,
      webhook_url: p.webhookUrl || this.client.defaultWebhookUrl,
      caller_id: p.callerId || this.client.defaultCallerId,
      step_save: p.stepSave ?? this.client.defaultStepSave ?? true,
      metadata: p.metadata
    });
  }
  async get(callId) {
    return this.client.request("GET", `/calls/${callId}`);
  }
  async list(limit = 50, offset = 0) {
    return this.client.request(
      "GET",
      `/calls?limit=${limit}&offset=${offset}`
    );
  }
  async transcript(callId) {
    return this.client.request(
      "GET",
      `/calls/${callId}/transcript`
    );
  }
  async hangup(callId) {
    return this.client.request("POST", `/calls/${callId}/hangup`);
  }
};
var AgentsAPI = class {
  constructor(client) {
    this.client = client;
  }
  async create(params) {
    return this.client.request("POST", "/agents", params);
  }
  async get(agentId) {
    return this.client.request("GET", `/agents/${agentId}`);
  }
  async list() {
    return this.client.request("GET", "/agents");
  }
  async update(agentId, params) {
    return this.client.request("PUT", `/agents/${agentId}`, params);
  }
  async delete(agentId) {
    return this.client.request("DELETE", `/agents/${agentId}`);
  }
  async schema() {
    return this.client.request("GET", "/agents/schema");
  }
};
var NumbersAPI = class {
  constructor(client) {
    this.client = client;
  }
  async list() {
    return this.client.request("GET", "/numbers");
  }
  async providers() {
    return this.client.request("GET", "/providers");
  }
};
var WebhooksAPI = class {
  constructor(client) {
    this.client = client;
  }
  async create(params) {
    return this.client.request("POST", "/webhooks", params);
  }
  async list() {
    return this.client.request("GET", "/webhooks");
  }
  async delete(webhookId) {
    return this.client.request("DELETE", `/webhooks/${webhookId}`);
  }
};
export {
  AgentCore,
  AgentCoreError
};
