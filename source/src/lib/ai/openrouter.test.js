import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OR_VERIFIER_KEY, exchangeOpenRouterCode, startOpenRouterLogin } from './openrouter.js';

describe('OpenRouter PKCE', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('exports the PKCE verifier storage key', () => {
    expect(OR_VERIFIER_KEY).toBe('mgn-or-pkce');
  });

  it('exchangeOpenRouterCode throws if verifier missing in sessionStorage', async () => {
    await expect(exchangeOpenRouterCode('abc')).rejects.toThrow(/Missing PKCE verifier/);
  });

  it('exchangeOpenRouterCode posts to OpenRouter and returns the key on success', async () => {
    sessionStorage.setItem(OR_VERIFIER_KEY, 'fake-verifier');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ key: 'sk-or-test' }),
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock);

    const key = await exchangeOpenRouterCode('the-code');
    expect(key).toBe('sk-or-test');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/openrouter\.ai\/api\/v1\/auth\/keys/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({ code: 'the-code', code_verifier: 'fake-verifier' });
    // Should clear verifier on success
    expect(sessionStorage.getItem(OR_VERIFIER_KEY)).toBeNull();
  });

  it('exchangeOpenRouterCode throws on non-ok response', async () => {
    sessionStorage.setItem(OR_VERIFIER_KEY, 'fake-verifier');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 400, text: async () => 'bad request',
    }));
    await expect(exchangeOpenRouterCode('the-code')).rejects.toThrow(/Exchange 400/);
  });

  it('startOpenRouterLogin stores verifier and navigates to the auth URL', async () => {
    let assignedHref = null;
    // Build a stub location that captures href assignment
    const origLoc = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: 'http://localhost',
        pathname: '/',
        get href() { return assignedHref; },
        set href(v) { assignedHref = v; },
      },
    });
    try {
      await startOpenRouterLogin();
      expect(sessionStorage.getItem(OR_VERIFIER_KEY)).toBeTruthy();
      expect(assignedHref).toMatch(/^https:\/\/openrouter\.ai\/auth\?/);
      expect(assignedHref).toMatch(/code_challenge=/);
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: origLoc });
    }
  });
});
