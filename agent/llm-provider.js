/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * LLM Provider Abstraction Layer
 *
 * Provides a unified interface for AI model interactions across multiple providers.
 * Supports Anthropic Claude, OpenAI, and Azure OpenAI with automatic provider
 * selection via environment variables.
 *
 * Environment Variables:
 *   AI_PROVIDER   — 'anthropic' | 'openai' | 'azure' (default: 'anthropic')
 *   AI_API_KEY    — API key for the selected provider
 *   AI_MODEL      — Model name (defaults per provider)
 *   AI_BASE_URL   — Custom endpoint (required for Azure)
 *   AI_API_VERSION — Azure API version (default: '2024-10-21')
 *   AI_MAX_TOKENS — Max tokens per response (default: 4096)
 */

'use strict';

const Logger = require('../lib/logger');
const { SapConnectError } = require('../lib/errors');

// ─────────────────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────────────────

class LLMError extends SapConnectError {
  constructor(message, details) {
    super(message, 'ERR_LLM', details);
    this.name = 'LLMError';
  }
}

class LLMRateLimitError extends LLMError {
  constructor(retryAfter, details) {
    super(`Rate limited. Retry after ${retryAfter}s`, details);
    this.name = 'LLMRateLimitError';
    this.retryAfter = retryAfter;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Base Provider
// ─────────────────────────────────────────────────────────────────────────────

class LLMProvider {
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.maxTokens = options.maxTokens || 4096;
    this.logger = options.logger || new Logger('llm-provider');
  }

  /**
   * Send a completion request to the LLM.
   * @param {object[]} messages — Conversation messages [{role, content}]
   * @param {object[]} [tools] — Tool definitions for function calling
   * @param {object} [options] — Additional options (temperature, etc.)
   * @returns {Promise<LLMResponse>}
   */
  async complete(messages, tools, options) {
    throw new Error('LLMProvider.complete() must be implemented by subclass');
  }

  /** Provider name for logging */
  get providerName() {
    return 'base';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM Response (normalized across providers)
// ─────────────────────────────────────────────────────────────────────────────

class LLMResponse {
  /**
   * @param {object} data
   * @param {'text'|'tool_use'|'end_turn'} data.stopReason
   * @param {string|null} data.text — Text content if any
   * @param {object[]|null} data.toolCalls — [{id, name, input}] if tool_use
   * @param {object} data.usage — {inputTokens, outputTokens}
   */
  constructor(data) {
    this.stopReason = data.stopReason;
    this.text = data.text || null;
    this.toolCalls = data.toolCalls || null;
    this.usage = data.usage || { inputTokens: 0, outputTokens: 0 };
  }

  get hasToolCalls() {
    return Array.isArray(this.toolCalls) && this.toolCalls.length > 0;
  }

  get isTextResponse() {
    return this.text !== null && !this.hasToolCalls;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Anthropic Provider
// ─────────────────────────────────────────────────────────────────────────────

class AnthropicProvider extends LLMProvider {
  constructor(options = {}) {
    super(options);
    this.model = options.model || 'claude-sonnet-4-5-20250929';
    this.baseUrl = options.baseUrl || undefined;
    this._client = null;
  }

  get providerName() {
    return 'anthropic';
  }

  _getClient() {
    if (!this._client) {
      const Anthropic = AnthropicProvider._loadSDK();
      const clientOpts = { apiKey: this.apiKey };
      if (this.baseUrl) clientOpts.baseURL = this.baseUrl;
      this._client = new Anthropic(clientOpts);
    }
    return this._client;
  }

  /**
   * Overridable SDK loader — allows test mocking without vi.mock()
   */
  static _loadSDK() {
    return require('@anthropic-ai/sdk').default || require('@anthropic-ai/sdk');
  }

  async complete(messages, tools, options = {}) {
    const client = this._getClient();

    // Separate system message from conversation
    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    const params = {
      model: this.model,
      max_tokens: options.maxTokens || this.maxTokens,
      messages: conversationMessages,
    };

    if (systemMessage) {
      params.system = systemMessage.content;
    }

    if (tools && tools.length > 0) {
      params.tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema,
      }));
    }

    if (options.temperature !== undefined) {
      params.temperature = options.temperature;
    }

    this.logger.debug(`Anthropic request: model=${this.model}, messages=${conversationMessages.length}`);

    try {
      const response = await client.messages.create(params);
      return this._parseResponse(response);
    } catch (err) {
      return this._handleError(err);
    }
  }

  _parseResponse(response) {
    let text = null;
    const toolCalls = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        text = (text || '') + block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input,
        });
      }
    }

    return new LLMResponse({
      stopReason: response.stop_reason === 'tool_use' ? 'tool_use' : 'end_turn',
      text,
      toolCalls: toolCalls.length > 0 ? toolCalls : null,
      usage: {
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
      },
    });
  }

  _handleError(err) {
    if (err?.status === 429) {
      const retryAfter = parseInt(err.headers?.['retry-after'] || '60', 10);
      throw new LLMRateLimitError(retryAfter, { provider: 'anthropic', model: this.model });
    }
    throw new LLMError(`Anthropic API error: ${err.message}`, {
      provider: 'anthropic',
      model: this.model,
      status: err?.status,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI Provider
// ─────────────────────────────────────────────────────────────────────────────

class OpenAIProvider extends LLMProvider {
  constructor(options = {}) {
    super(options);
    this.model = options.model || 'gpt-4o';
    this.baseUrl = options.baseUrl || undefined;
    this._client = null;
  }

  get providerName() {
    return 'openai';
  }

  _getClient() {
    if (!this._client) {
      const OpenAI = OpenAIProvider._loadSDK();
      const clientOpts = { apiKey: this.apiKey };
      if (this.baseUrl) clientOpts.baseURL = this.baseUrl;
      this._client = new OpenAI(clientOpts);
    }
    return this._client;
  }

  static _loadSDK() {
    return require('openai').default || require('openai');
  }

  async complete(messages, tools, options = {}) {
    const client = this._getClient();

    const params = {
      model: this.model,
      max_tokens: options.maxTokens || this.maxTokens,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };

    if (tools && tools.length > 0) {
      params.tools = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
        },
      }));
    }

    if (options.temperature !== undefined) {
      params.temperature = options.temperature;
    }

    this.logger.debug(`OpenAI request: model=${this.model}, messages=${messages.length}`);

    try {
      const response = await client.chat.completions.create(params);
      return this._parseResponse(response);
    } catch (err) {
      return this._handleError(err);
    }
  }

  _parseResponse(response) {
    const choice = response.choices?.[0];
    if (!choice) {
      throw new LLMError('Empty response from OpenAI', { provider: 'openai' });
    }

    const message = choice.message;
    const toolCalls = [];

    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const tc of message.tool_calls) {
        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments),
        });
      }
    }

    return new LLMResponse({
      stopReason: choice.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn',
      text: message.content || null,
      toolCalls: toolCalls.length > 0 ? toolCalls : null,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    });
  }

  _handleError(err) {
    if (err?.status === 429) {
      const retryAfter = parseInt(err.headers?.['retry-after'] || '60', 10);
      throw new LLMRateLimitError(retryAfter, { provider: 'openai', model: this.model });
    }
    throw new LLMError(`OpenAI API error: ${err.message}`, {
      provider: 'openai',
      model: this.model,
      status: err?.status,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Azure OpenAI Provider
// ─────────────────────────────────────────────────────────────────────────────

class AzureOpenAIProvider extends OpenAIProvider {
  constructor(options = {}) {
    super(options);
    this.model = options.model || 'gpt-4o';
    this.apiVersion = options.apiVersion || '2024-10-21';
  }

  get providerName() {
    return 'azure';
  }

  _getClient() {
    if (!this._client) {
      const { AzureOpenAI } = AzureOpenAIProvider._loadAzureSDK();
      this._client = new AzureOpenAI({
        apiKey: this.apiKey,
        endpoint: this.baseUrl,
        apiVersion: this.apiVersion,
        deployment: this.model,
      });
    }
    return this._client;
  }

  static _loadAzureSDK() {
    return require('openai');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER_MAP = {
  anthropic: AnthropicProvider,
  openai: OpenAIProvider,
  azure: AzureOpenAIProvider,
};

/**
 * Create an LLM provider from environment variables or explicit config.
 *
 * @param {object} [options]
 * @param {string} [options.provider] — Override AI_PROVIDER env var
 * @param {string} [options.apiKey] — Override AI_API_KEY env var
 * @param {string} [options.model] — Override AI_MODEL env var
 * @param {string} [options.baseUrl] — Override AI_BASE_URL env var
 * @param {number} [options.maxTokens] — Override AI_MAX_TOKENS env var
 * @returns {LLMProvider}
 */
function createProvider(options = {}) {
  const provider = options.provider || process.env.AI_PROVIDER || 'anthropic';
  const apiKey = options.apiKey || process.env.AI_API_KEY;
  const model = options.model || process.env.AI_MODEL;
  const baseUrl = options.baseUrl || process.env.AI_BASE_URL;
  const maxTokens = options.maxTokens || parseInt(process.env.AI_MAX_TOKENS || '4096', 10);

  if (!apiKey) {
    throw new LLMError('AI_API_KEY is required for live mode', { provider });
  }

  const ProviderClass = PROVIDER_MAP[provider];
  if (!ProviderClass) {
    throw new LLMError(`Unknown AI provider: ${provider}. Use: ${Object.keys(PROVIDER_MAP).join(', ')}`, { provider });
  }

  return new ProviderClass({
    apiKey,
    model: model || undefined,
    baseUrl: baseUrl || undefined,
    maxTokens,
    apiVersion: options.apiVersion || process.env.AI_API_VERSION,
  });
}

module.exports = {
  LLMProvider,
  LLMResponse,
  LLMError,
  LLMRateLimitError,
  AnthropicProvider,
  OpenAIProvider,
  AzureOpenAIProvider,
  createProvider,
  PROVIDER_MAP,
};
