const {
  BasicAuthProvider,
  OAuth2ClientCredentialsProvider,
  OAuth2SAMLBearerProvider,
  X509CertificateProvider,
} = require('../../../lib/odata/auth');

describe('BasicAuthProvider', () => {
  it('should return Base64-encoded Authorization header', async () => {
    const provider = new BasicAuthProvider('USER', 'PASS');
    const headers = await provider.getHeaders();
    const expected = Buffer.from('USER:PASS').toString('base64');
    expect(headers.Authorization).toBe(`Basic ${expected}`);
  });

  it('should return null agent', () => {
    const provider = new BasicAuthProvider('u', 'p');
    expect(provider.getAgent()).toBeNull();
  });
});

describe('OAuth2ClientCredentialsProvider', () => {
  it('should fetch token on first getHeaders call', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ access_token: 'tok123', expires_in: 3600 }),
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    try {
      const provider = new OAuth2ClientCredentialsProvider(
        'https://auth.example.com/token',
        'client-id',
        'client-secret',
        'api-scope'
      );
      const headers = await provider.getHeaders();

      expect(headers.Authorization).toBe('Bearer tok123');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      const [url, options] = globalThis.fetch.mock.calls[0];
      expect(url).toBe('https://auth.example.com/token');
      expect(options.method).toBe('POST');
      expect(options.body).toContain('grant_type=client_credentials');
      expect(options.body).toContain('client_id=client-id');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should cache token across calls', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ access_token: 'cached', expires_in: 3600 }),
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    try {
      const provider = new OAuth2ClientCredentialsProvider(
        'https://auth.example.com/token', 'cid', 'csec'
      );
      await provider.getHeaders();
      await provider.getHeaders();
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should throw on failed token request', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    try {
      const provider = new OAuth2ClientCredentialsProvider(
        'https://auth.example.com/token', 'cid', 'csec'
      );
      await expect(provider.getHeaders()).rejects.toThrow('OAuth2 token request failed');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should return null agent', () => {
    const provider = new OAuth2ClientCredentialsProvider('u', 'c', 's');
    expect(provider.getAgent()).toBeNull();
  });
});

describe('OAuth2SAMLBearerProvider', () => {
  it('should fetch token using SAML assertion', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ access_token: 'saml-tok', expires_in: 1800 }),
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    try {
      const provider = new OAuth2SAMLBearerProvider(
        'https://auth.example.com/token', 'cid', 'csec', 'saml-assertion-base64'
      );
      const headers = await provider.getHeaders();
      expect(headers.Authorization).toBe('Bearer saml-tok');

      const body = globalThis.fetch.mock.calls[0][1].body;
      expect(body).toContain('grant_type=urn');
      expect(body).toContain('saml2-bearer');
      expect(body).toContain('assertion=saml-assertion-base64');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('X509CertificateProvider', () => {
  it('should return empty headers', async () => {
    const provider = new X509CertificateProvider('/tmp/cert.pem', '/tmp/key.pem');
    const headers = await provider.getHeaders();
    expect(headers).toEqual({});
  });

  // Note: getAgent() reads cert files, so we can't test it without real files
  // We just verify it doesn't return null conceptually
  it('should have cert and key paths', () => {
    const provider = new X509CertificateProvider('/tmp/cert.pem', '/tmp/key.pem');
    expect(provider.certPath).toBe('/tmp/cert.pem');
    expect(provider.keyPath).toBe('/tmp/key.pem');
  });
});
