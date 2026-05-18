import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AI_PROVIDERS, getAIConfig, setAIConfig, hasAIKey, aiComplete } from './providers.js';

describe('AI_PROVIDERS catalog', () => {
  it('exposes the expected providers with url + models', () => {
    for (const k of ['anthropic', 'openai', 'gemini', 'groq', 'openrouter', 'ollama', 'custom']) {
      expect(AI_PROVIDERS[k]).toBeDefined();
      expect(typeof AI_PROVIDERS[k].label).toBe('string');
      expect(Array.isArray(AI_PROVIDERS[k].models)).toBe(true);
    }
  });
});

describe('getAIConfig / setAIConfig / hasAIKey', () => {
  beforeEach(() => {
    localStorage.removeItem('mgn-ai');
  });

  it('round-trips a config object', () => {
    setAIConfig({ enabled: true, provider: 'openai', model: 'gpt-4o', key: 'sk-x' });
    expect(getAIConfig()).toEqual({ enabled: true, provider: 'openai', model: 'gpt-4o', key: 'sk-x' });
    expect(hasAIKey()).toBe(true);
  });

  it('clears config when called with falsy value and hasAIKey is false', () => {
    setAIConfig({ enabled: true, provider: 'openai', key: 'sk' });
    setAIConfig(null);
    expect(getAIConfig()).toBeNull();
    expect(hasAIKey()).toBe(false);
  });

  it('returns null when localStorage holds invalid JSON', () => {
    localStorage.setItem('mgn-ai', '{not json');
    expect(getAIConfig()).toBeNull();
  });
});

describe('aiComplete', () => {
  beforeEach(() => {
    localStorage.removeItem('mgn-ai');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws if no AI config is set', async () => {
    await expect(aiComplete({ user: 'hi' })).rejects.toThrow(/not configured/);
  });

  it('calls the OpenAI-compat endpoint and returns parsed text', async () => {
    setAIConfig({ enabled: true, provider: 'openai', model: 'gpt-4o', key: 'sk-test' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hello world' } }] }),
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await aiComplete({ user: 'say hi' });
    expect(result).toBe('hello world');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(AI_PROVIDERS.openai.url);
    expect(init.headers['Authorization']).toBe('Bearer sk-test');
  });

  it('throws with status on non-ok response', async () => {
    setAIConfig({ enabled: true, provider: 'openai', model: 'gpt-4o', key: 'sk' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 500, text: async () => 'boom',
    }));
    await expect(aiComplete({ user: 'q' })).rejects.toThrow(/AI 500/);
  });
});
