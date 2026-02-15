/**
 * Tests for Infor Basic Authentication Provider
 */
const InforBasicAuthProvider = require('../../../../lib/infor/auth/basic-provider');
const { AuthenticationError } = require('../../../../lib/errors');

describe('InforBasicAuthProvider', () => {
  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should store config values', () => {
      const provider = new InforBasicAuthProvider({
        username: 'admin',
        password: 'secret',
        mode: 'live',
      });
      expect(provider.username).toBe('admin');
      expect(provider.password).toBe('secret');
      expect(provider.mode).toBe('live');
    });

    it('should default mode to live', () => {
      const provider = new InforBasicAuthProvider({});
      expect(provider.mode).toBe('live');
    });

    it('should default username and password to empty strings', () => {
      const provider = new InforBasicAuthProvider({});
      expect(provider.username).toBe('');
      expect(provider.password).toBe('');
    });
  });

  // ── getAuthHeader ─────────────────────────────────────────────

  describe('getAuthHeader', () => {
    it('should return Base64-encoded Authorization header', () => {
      const provider = new InforBasicAuthProvider({
        username: 'testuser',
        password: 'testpass',
        mode: 'live',
      });

      const header = provider.getAuthHeader();
      expect(header).toMatch(/^Basic /);

      // Decode and verify
      const encoded = header.replace('Basic ', '');
      const decoded = Buffer.from(encoded, 'base64').toString();
      expect(decoded).toBe('testuser:testpass');
    });

    it('should return fixed mock header in mock mode', () => {
      const provider = new InforBasicAuthProvider({ mode: 'mock' });
      const header = provider.getAuthHeader();
      expect(header).toMatch(/^Basic /);
      expect(header).toBe('Basic bW9jay11c2VyOm1vY2stcGFzcw==');
    });

    it('should throw when credentials are empty in live mode', () => {
      const provider = new InforBasicAuthProvider({
        username: '',
        password: '',
        mode: 'live',
      });

      expect(() => provider.getAuthHeader()).toThrow(AuthenticationError);
    });

    it('should handle special characters in credentials', () => {
      const provider = new InforBasicAuthProvider({
        username: 'user@domain.com',
        password: 'p@ss:w0rd!',
        mode: 'live',
      });

      const header = provider.getAuthHeader();
      const encoded = header.replace('Basic ', '');
      const decoded = Buffer.from(encoded, 'base64').toString();
      expect(decoded).toBe('user@domain.com:p@ss:w0rd!');
    });
  });

  // ── validate ──────────────────────────────────────────────────

  describe('validate', () => {
    it('should return valid for valid credentials', () => {
      const provider = new InforBasicAuthProvider({
        username: 'admin',
        password: 'secret',
        mode: 'live',
      });

      const result = provider.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when username is empty', () => {
      const provider = new InforBasicAuthProvider({
        username: '',
        password: 'secret',
        mode: 'live',
      });

      const result = provider.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Username');
    });

    it('should return invalid when password is empty', () => {
      const provider = new InforBasicAuthProvider({
        username: 'admin',
        password: '',
        mode: 'live',
      });

      const result = provider.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Password');
    });

    it('should return invalid when both are empty', () => {
      const provider = new InforBasicAuthProvider({
        username: '',
        password: '',
        mode: 'live',
      });

      const result = provider.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should always return valid in mock mode', () => {
      const provider = new InforBasicAuthProvider({
        username: '',
        password: '',
        mode: 'mock',
      });

      const result = provider.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ── getHeaders ────────────────────────────────────────────────

  describe('getHeaders', () => {
    it('should return headers object with Authorization', async () => {
      const provider = new InforBasicAuthProvider({
        username: 'admin',
        password: 'secret',
        mode: 'live',
      });

      const headers = await provider.getHeaders();
      expect(headers.Authorization).toBeDefined();
      expect(headers.Authorization).toMatch(/^Basic /);
    });
  });

  // ── getAgent ──────────────────────────────────────────────────

  describe('getAgent', () => {
    it('should return null (no mTLS for basic auth)', () => {
      const provider = new InforBasicAuthProvider({ mode: 'mock' });
      expect(provider.getAgent()).toBeNull();
    });
  });
});
