"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AgentCore: () => AgentCore,
  AgentCoreError: () => AgentCoreError
});
module.exports = __toCommonJS(index_exports);

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
    const crypto = globalThis.crypto || require("crypto");
    if ("subtle" in crypto) {
      throw new Error("Use verifyWebhookAsync() in browser/edge environments");
    }
    const { createHmac } = require("crypto");
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentCore,
  AgentCoreError
});
