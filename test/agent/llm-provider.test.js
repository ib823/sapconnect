const {
  LLMProvider,
  LLMResponse,
  LLMError,
  LLMRateLimitError,
  AnthropicProvider,
  OpenAIProvider,
  AzureOpenAIProvider,
  createProvider,
  PROVIDER_MAP,
} = require('../../agent/llm-provider');

// ─────────────────────────────────────────────────────────────────────────────
// LLMResponse
// ─────────────────────────────────────────────────────────────────────────────

describe('LLMResponse', () => {
  it('should detect tool calls', () => {
    const resp = new LLMResponse({
      stopReason: 'tool_use',
      text: null,
      toolCalls: [{ id: 'tc1', name: 'read_abap_source', input: { object_name: 'ZCL_TEST' } }],
      usage: { inputTokens: 100, outputTokens: 50 },
    });
    expect(resp.hasToolCalls).toBe(true);
    expect(resp.isTextResponse).toBe(false);
  });

  it('should detect text-only responses', () => {
    const resp = new LLMResponse({
      stopReason: 'end_turn',
      text: 'Hello world',
      toolCalls: null,
      usage: { inputTokens: 10, outputTokens: 5 },
    });
    expect(resp.hasToolCalls).toBe(false);
    expect(resp.isTextResponse).toBe(true);
  });

  it('should handle empty tool calls array', () => {
    const resp = new LLMResponse({
      stopReason: 'end_turn',
      text: 'Done',
      toolCalls: [],
      usage: { inputTokens: 0, outputTokens: 0 },
    });
    expect(resp.hasToolCalls).toBe(false);
    expect(resp.isTextResponse).toBe(true);
  });

  it('should default usage to zero', () => {
    const resp = new LLMResponse({ stopReason: 'end_turn', text: 'Hi' });
    expect(resp.usage.inputTokens).toBe(0);
    expect(resp.usage.outputTokens).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LLMError classes
// ─────────────────────────────────────────────────────────────────────────────

describe('LLMError', () => {
  it('should extend SapConnectError', () => {
    const err = new LLMError('test error', { provider: 'test' });
    expect(err.name).toBe('LLMError');
    expect(err.code).toBe('ERR_LLM');
    expect(err.message).toBe('test error');
    expect(err.details.provider).toBe('test');
  });
});

describe('LLMRateLimitError', () => {
  it('should include retry-after info', () => {
    const err = new LLMRateLimitError(30, { provider: 'anthropic' });
    expect(err.name).toBe('LLMRateLimitError');
    expect(err.retryAfter).toBe(30);
    expect(err.message).toContain('30');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Base LLMProvider
// ─────────────────────────────────────────────────────────────────────────────

describe('LLMProvider base class', () => {
  it('should throw on unimplemented complete()', async () => {
    const provider = new LLMProvider({ apiKey: 'test' });
    await expect(provider.complete([], [])).rejects.toThrow('must be implemented');
  });

  it('should have base providerName', () => {
    const provider = new LLMProvider({});
    expect(provider.providerName).toBe('base');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AnthropicProvider
// ─────────────────────────────────────────────────────────────────────────────

describe('AnthropicProvider', () => {
  let mockClient;
  let originalLoadSDK;

  beforeEach(() => {
    mockClient = {
      messages: {
        create: vi.fn(),
      },
    };
    originalLoadSDK = AnthropicProvider._loadSDK;
    AnthropicProvider._loadSDK = () => function MockAnthropic() { return mockClient; };
  });

  afterEach(() => {
    AnthropicProvider._loadSDK = originalLoadSDK;
  });

  it('should have correct providerName', () => {
    const provider = new AnthropicProvider({ apiKey: 'test' });
    expect(provider.providerName).toBe('anthropic');
  });

  it('should use default model', () => {
    const provider = new AnthropicProvider({ apiKey: 'test' });
    expect(provider.model).toBe('claude-sonnet-4-5-20250929');
  });

  it('should parse text-only response', async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: '## Analysis\n\nThis is a test output.' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 100, output_tokens: 50 },
    });

    const provider = new AnthropicProvider({ apiKey: 'test-key' });
    const result = await provider.complete(
      [{ role: 'system', content: 'You are a test agent' }, { role: 'user', content: 'Hello' }],
      [],
    );

    expect(result).toBeInstanceOf(LLMResponse);
    expect(result.isTextResponse).toBe(true);
    expect(result.text).toContain('Analysis');
    expect(result.usage.inputTokens).toBe(100);
    expect(result.usage.outputTokens).toBe(50);
  });

  it('should parse tool_use response', async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [
        { type: 'text', text: 'Let me read the source.' },
        { type: 'tool_use', id: 'toolu_123', name: 'read_abap_source', input: { object_name: 'ZCL_TEST' } },
      ],
      stop_reason: 'tool_use',
      usage: { input_tokens: 200, output_tokens: 80 },
    });

    const provider = new AnthropicProvider({ apiKey: 'test-key' });
    const result = await provider.complete(
      [{ role: 'user', content: 'Analyze ZCL_TEST' }],
      [{ name: 'read_abap_source', description: 'Read source', input_schema: { type: 'object', properties: {} } }],
    );

    expect(result.hasToolCalls).toBe(true);
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].id).toBe('toolu_123');
    expect(result.toolCalls[0].name).toBe('read_abap_source');
    expect(result.toolCalls[0].input.object_name).toBe('ZCL_TEST');
    expect(result.text).toBe('Let me read the source.');
    expect(result.stopReason).toBe('tool_use');
  });

  it('should separate system messages', async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: 'OK' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 50, output_tokens: 10 },
    });

    const provider = new AnthropicProvider({ apiKey: 'key' });
    await provider.complete([
      { role: 'system', content: 'System prompt' },
      { role: 'user', content: 'Hello' },
    ]);

    const callArgs = mockClient.messages.create.mock.calls[0][0];
    expect(callArgs.system).toBe('System prompt');
    expect(callArgs.messages).toHaveLength(1);
    expect(callArgs.messages[0].role).toBe('user');
  });

  it('should map tools to Anthropic format', async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: 'Done' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const provider = new AnthropicProvider({ apiKey: 'key' });
    await provider.complete(
      [{ role: 'user', content: 'Hi' }],
      [{ name: 'my_tool', description: 'A test tool', input_schema: { type: 'object', properties: { foo: { type: 'string' } } } }],
    );

    const callArgs = mockClient.messages.create.mock.calls[0][0];
    expect(callArgs.tools).toHaveLength(1);
    expect(callArgs.tools[0].name).toBe('my_tool');
    expect(callArgs.tools[0].description).toBe('A test tool');
    expect(callArgs.tools[0].input_schema.type).toBe('object');
  });

  it('should handle rate limit (429)', async () => {
    mockClient.messages.create.mockRejectedValue({
      status: 429,
      headers: { 'retry-after': '30' },
      message: 'Rate limited',
    });

    const provider = new AnthropicProvider({ apiKey: 'key' });
    await expect(provider.complete([{ role: 'user', content: 'Hi' }])).rejects.toThrow(LLMRateLimitError);
  });

  it('should handle API errors', async () => {
    mockClient.messages.create.mockRejectedValue({
      status: 500,
      message: 'Internal error',
    });

    const provider = new AnthropicProvider({ apiKey: 'key' });
    await expect(provider.complete([{ role: 'user', content: 'Hi' }])).rejects.toThrow(LLMError);
  });

  it('should pass temperature option', async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: 'OK' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const provider = new AnthropicProvider({ apiKey: 'key' });
    await provider.complete(
      [{ role: 'user', content: 'Hi' }],
      [],
      { temperature: 0.7 },
    );

    const callArgs = mockClient.messages.create.mock.calls[0][0];
    expect(callArgs.temperature).toBe(0.7);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OpenAIProvider
// ─────────────────────────────────────────────────────────────────────────────

describe('OpenAIProvider', () => {
  let mockClient;
  let originalLoadSDK;

  beforeEach(() => {
    mockClient = {
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    };
    originalLoadSDK = OpenAIProvider._loadSDK;
    OpenAIProvider._loadSDK = () => function MockOpenAI() { return mockClient; };
  });

  afterEach(() => {
    OpenAIProvider._loadSDK = originalLoadSDK;
  });

  it('should have correct providerName', () => {
    const provider = new OpenAIProvider({ apiKey: 'test' });
    expect(provider.providerName).toBe('openai');
  });

  it('should use default model', () => {
    const provider = new OpenAIProvider({ apiKey: 'test' });
    expect(provider.model).toBe('gpt-4o');
  });

  it('should parse text-only response', async () => {
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [{
        message: { content: 'Analysis complete', tool_calls: null },
        finish_reason: 'stop',
      }],
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const provider = new OpenAIProvider({ apiKey: 'key' });
    const result = await provider.complete([{ role: 'user', content: 'Hi' }]);

    expect(result.isTextResponse).toBe(true);
    expect(result.text).toBe('Analysis complete');
    expect(result.usage.inputTokens).toBe(100);
    expect(result.usage.outputTokens).toBe(50);
  });

  it('should parse tool_calls response', async () => {
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          content: null,
          tool_calls: [{
            id: 'call_abc',
            function: {
              name: 'list_objects',
              arguments: '{"package":"ZTEST"}',
            },
          }],
        },
        finish_reason: 'tool_calls',
      }],
      usage: { prompt_tokens: 150, completion_tokens: 30 },
    });

    const provider = new OpenAIProvider({ apiKey: 'key' });
    const result = await provider.complete(
      [{ role: 'user', content: 'List objects' }],
      [{ name: 'list_objects', description: 'List objects', input_schema: {} }],
    );

    expect(result.hasToolCalls).toBe(true);
    expect(result.toolCalls[0].name).toBe('list_objects');
    expect(result.toolCalls[0].input.package).toBe('ZTEST');
    expect(result.stopReason).toBe('tool_use');
  });

  it('should map tools to OpenAI function format', async () => {
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const provider = new OpenAIProvider({ apiKey: 'key' });
    await provider.complete(
      [{ role: 'user', content: 'Hi' }],
      [{ name: 'my_tool', description: 'Test', input_schema: { type: 'object' } }],
    );

    const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
    expect(callArgs.tools[0].type).toBe('function');
    expect(callArgs.tools[0].function.name).toBe('my_tool');
    expect(callArgs.tools[0].function.parameters.type).toBe('object');
  });

  it('should throw on empty response', async () => {
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [],
      usage: { prompt_tokens: 10, completion_tokens: 0 },
    });

    const provider = new OpenAIProvider({ apiKey: 'key' });
    await expect(provider.complete([{ role: 'user', content: 'Hi' }])).rejects.toThrow('Empty response');
  });

  it('should handle rate limit', async () => {
    mockClient.chat.completions.create.mockRejectedValue({
      status: 429,
      headers: { 'retry-after': '60' },
      message: 'Rate limited',
    });

    const provider = new OpenAIProvider({ apiKey: 'key' });
    await expect(provider.complete([{ role: 'user', content: 'Hi' }])).rejects.toThrow(LLMRateLimitError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AzureOpenAIProvider
// ─────────────────────────────────────────────────────────────────────────────

describe('AzureOpenAIProvider', () => {
  it('should have correct providerName', () => {
    const provider = new AzureOpenAIProvider({ apiKey: 'test', baseUrl: 'https://my.openai.azure.com' });
    expect(provider.providerName).toBe('azure');
  });

  it('should set default api version', () => {
    const provider = new AzureOpenAIProvider({ apiKey: 'test' });
    expect(provider.apiVersion).toBe('2024-10-21');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createProvider factory
// ─────────────────────────────────────────────────────────────────────────────

describe('createProvider', () => {
  it('should create AnthropicProvider by default', () => {
    const provider = createProvider({ apiKey: 'test-key' });
    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  it('should create OpenAIProvider when specified', () => {
    const provider = createProvider({ provider: 'openai', apiKey: 'test-key' });
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('should create AzureOpenAIProvider', () => {
    const provider = createProvider({ provider: 'azure', apiKey: 'test-key', baseUrl: 'https://az.com' });
    expect(provider).toBeInstanceOf(AzureOpenAIProvider);
  });

  it('should throw without API key', () => {
    expect(() => createProvider({ provider: 'anthropic' })).toThrow('AI_API_KEY is required');
  });

  it('should throw for unknown provider', () => {
    expect(() => createProvider({ provider: 'unknown', apiKey: 'key' })).toThrow('Unknown AI provider');
  });

  it('should pass custom model', () => {
    const provider = createProvider({ apiKey: 'key', model: 'claude-opus-4-6' });
    expect(provider.model).toBe('claude-opus-4-6');
  });

  it('should pass custom maxTokens', () => {
    const provider = createProvider({ apiKey: 'key', maxTokens: 8192 });
    expect(provider.maxTokens).toBe(8192);
  });

  it('should read from env vars', () => {
    const origKey = process.env.AI_API_KEY;
    const origProvider = process.env.AI_PROVIDER;
    process.env.AI_API_KEY = 'env-key';
    process.env.AI_PROVIDER = 'openai';

    try {
      const provider = createProvider();
      expect(provider).toBeInstanceOf(OpenAIProvider);
      expect(provider.apiKey).toBe('env-key');
    } finally {
      if (origKey) process.env.AI_API_KEY = origKey;
      else delete process.env.AI_API_KEY;
      if (origProvider) process.env.AI_PROVIDER = origProvider;
      else delete process.env.AI_PROVIDER;
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER_MAP
// ─────────────────────────────────────────────────────────────────────────────

describe('PROVIDER_MAP', () => {
  it('should have three providers', () => {
    expect(Object.keys(PROVIDER_MAP)).toEqual(['anthropic', 'openai', 'azure']);
  });
});
