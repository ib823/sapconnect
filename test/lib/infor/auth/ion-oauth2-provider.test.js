/**
 * Tests for ION OAuth2 Service Account Provider
 */
const IONOAuth2Provider = require('../../../../lib/infor/auth/ion-oauth2-provider');
const { AuthenticationError, IONError } = require('../../../../lib/errors');

describe('IONOAuth2Provider', () => {
  let provider;

  beforeEach(() => {
    provider = new IONOAuth2Provider({
      tokenUrl: 'https://token.example.com/connect/token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      tenant: 'TESTTENANT',
      mode: 'mock',
    });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should store config values', () => {
      expect(provider.tokenUrl).toBe('https://token.example.com/connect/token');
      expect(provider.clientId).toBe('test-client-id');
      expect(provider.clientSecret).toBe('test-client-secret');
      expect(provider.tenant).toBe('TESTTENANT');
      expect(provider.mode).toBe('mock');
    });

    it('should default mode to live', () => {
      const p = new IONOAuth2Provider({});
      expect(p.mode).toBe('live');
    });

    it('should start with no cached token', () => {
      expect(provider._accessToken).toBeNull();
      expect(provider._expiresAt).toBe(0);
    });
  });

  // ── getToken ──────────────────────────────────────────────────

  describe('getToken', () => {
    it('should return a mock token', async () => {
      const token = await provider.getToken();
      expect(typeof token).toBe('string');
      expect(token).toContain('mock-ion-token');
    });

    it('should cache the token on subsequent calls', async () => {
      const token1 = await provider.getToken();
      const token2 = await provider.getToken();
      // Same token returned (cached)
      expect(token1).toBe(token2);
    });

    it('should set expiry time', async () => {
      await provider.getToken();
      expect(provider._expiresAt).toBeGreaterThan(Date.now());
    });
  });

  // ── refreshToken ──────────────────────────────────────────────

  describe('refreshToken', () => {
    it('should return a new token in mock mode', async () => {
      const token = await provider.refreshToken();
      expect(typeof token).toBe('string');
      expect(token).toContain('mock-ion-token');
    });

    it('should update the cached token', async () => {
      const token1 = await provider.refreshToken();
      // Force a new timestamp by waiting a tick
      await new Promise(r => setTimeout(r, 5));
      const token2 = await provider.refreshToken();
      expect(token2).not.toBe(token1);
    });

    it('should throw in live mode when credentials are missing', async () => {
      const liveProvider = new IONOAuth2Provider({ mode: 'live' });
      await expect(liveProvider.refreshToken())
        .rejects.toThrow(AuthenticationError);
    });
  });

  // ── isTokenExpired ────────────────────────────────────────────

  describe('isTokenExpired', () => {
    it('should return true when no token exists', () => {
      expect(provider.isTokenExpired()).toBe(true);
    });

    it('should return false after getting a token', async () => {
      await provider.getToken();
      expect(provider.isTokenExpired()).toBe(false);
    });

    it('should return true when token is past expiry', async () => {
      await provider.getToken();
      // Force expiration
      provider._expiresAt = Date.now() - 1000;
      expect(provider.isTokenExpired()).toBe(true);
    });
  });

  // ── Token caching ─────────────────────────────────────────────

  describe('token caching', () => {
    it('should return cached token on second call', async () => {
      const token1 = await provider.getToken();
      const token2 = await provider.getToken();
      expect(token1).toBe(token2);
    });

    it('should fetch new token after invalidation', async () => {
      // Control Date.now() to ensure different mock token strings
      let now = 1000000;
      const spy = vi.spyOn(Date, 'now').mockImplementation(() => now);

      const token1 = await provider.getToken();
      provider.invalidate();
      now = 2000000;
      const token2 = await provider.getToken();

      spy.mockRestore();
      expect(token2).not.toBe(token1);
    });

    it('should fetch new token after expiry', async () => {
      // Control Date.now() to ensure different mock token strings
      let now = 1000000;
      const spy = vi.spyOn(Date, 'now').mockImplementation(() => now);

      const token1 = await provider.getToken();
      provider._expiresAt = 0;
      now = 2000000;
      const token2 = await provider.getToken();

      spy.mockRestore();
      expect(token2).not.toBe(token1);
    });
  });

  // ── getHeaders ────────────────────────────────────────────────

  describe('getHeaders', () => {
    it('should return Authorization header with Bearer token', async () => {
      const headers = await provider.getHeaders();
      expect(headers.Authorization).toBeDefined();
      expect(headers.Authorization).toMatch(/^Bearer /);
    });

    it('should include tenant header when tenant is set', async () => {
      const headers = await provider.getHeaders();
      expect(headers['X-Infor-TenantId']).toBe('TESTTENANT');
    });

    it('should omit tenant header when tenant is not set', async () => {
      const noTenantProvider = new IONOAuth2Provider({ mode: 'mock' });
      const headers = await noTenantProvider.getHeaders();
      expect(headers['X-Infor-TenantId']).toBeUndefined();
    });
  });

  // ── invalidate ────────────────────────────────────────────────

  describe('invalidate', () => {
    it('should clear cached token', async () => {
      await provider.getToken();
      expect(provider._accessToken).not.toBeNull();

      provider.invalidate();
      expect(provider._accessToken).toBeNull();
      expect(provider._expiresAt).toBe(0);
    });
  });

  // ── getAgent ──────────────────────────────────────────────────

  describe('getAgent', () => {
    it('should return null (no mTLS for ION cloud)', () => {
      expect(provider.getAgent()).toBeNull();
    });
  });
});
