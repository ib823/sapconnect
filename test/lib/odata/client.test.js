const ODataClient = require('../../../lib/odata/client');
const { BasicAuthProvider } = require('../../../lib/odata/auth');
const { ODataError, ConnectionError, AuthenticationError } = require('../../../lib/errors');

// Mock fetch for all tests
let mockFetch;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  mockFetch = vi.fn();
  globalThis.fetch = mockFetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Map([['x-csrf-token', 'test-token']]),
    text: async () => JSON.stringify(data),
  };
}

function textResponse(text, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    headers: new Map([['x-csrf-token', 'test-token']]),
    text: async () => text,
  };
}

describe('ODataClient', () => {
  let client;
  let auth;

  beforeEach(() => {
    auth = new BasicAuthProvider('user', 'pass');
    client = new ODataClient({
      baseUrl: 'https://sap.example.com',
      authProvider: auth,
      version: 'v2',
      timeout: 5000,
      retries: 1,
    });
  });

  describe('constructor', () => {
    it('should set defaults', () => {
      const c = new ODataClient();
      expect(c.baseUrl).toBe('');
      expect(c.version).toBe('v2');
      expect(c.timeout).toBe(30000);
      expect(c.retries).toBe(3);
    });

    it('should strip trailing slashes from baseUrl', () => {
      const c = new ODataClient({ baseUrl: 'https://host/' });
      expect(c.baseUrl).toBe('https://host');
    });
  });

  describe('get()', () => {
    it('should make GET request and return parsed JSON', async () => {
      const data = { d: { results: [{ Id: '1' }] } };
      mockFetch.mockResolvedValue(jsonResponse(data));

      const result = await client.get('/sap/opu/odata/sap/API/Orders');

      expect(result).toEqual(data);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('https://sap.example.com/sap/opu/odata/sap/API/Orders');
      expect(opts.method).toBe('GET');
    });

    it('should pass query params', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ d: { results: [] } }));

      await client.get('/api/Orders', { $top: '10', $filter: "Status eq 'Open'" });

      const [url] = mockFetch.mock.calls[0];
      // URLSearchParams encodes $ as %24
      expect(url).toContain('top=10');
      expect(url).toContain('filter=');
    });

    it('should add $format=json for V4', async () => {
      const v4Client = new ODataClient({
        baseUrl: 'https://sap.example.com',
        version: 'v4',
        retries: 0,
      });
      mockFetch.mockResolvedValue(jsonResponse({ value: [] }));

      await v4Client.get('/api/Orders');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('format=json');
    });
  });

  describe('getAll() - pagination', () => {
    it('should follow V2 __next links', async () => {
      const page1 = { d: { results: [{ Id: '1' }], __next: '/api/Orders?$skiptoken=1' } };
      const page2 = { d: { results: [{ Id: '2' }] } };

      mockFetch
        .mockResolvedValueOnce(jsonResponse(page1))
        .mockResolvedValueOnce(jsonResponse(page2));

      const results = await client.getAll('/api/Orders');

      expect(results).toEqual([{ Id: '1' }, { Id: '2' }]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should follow V4 @odata.nextLink', async () => {
      const v4Client = new ODataClient({
        baseUrl: 'https://sap.example.com',
        version: 'v4',
        retries: 0,
      });

      const page1 = {
        value: [{ Id: '1' }],
        '@odata.nextLink': 'https://sap.example.com/api/Orders?$skiptoken=abc',
      };
      const page2 = { value: [{ Id: '2' }] };

      mockFetch
        .mockResolvedValueOnce(jsonResponse(page1))
        .mockResolvedValueOnce(jsonResponse(page2));

      const results = await v4Client.getAll('/api/Orders');

      expect(results).toEqual([{ Id: '1' }, { Id: '2' }]);
    });
  });

  describe('post()', () => {
    it('should fetch CSRF token then POST', async () => {
      // CSRF HEAD response
      const csrfResponse = {
        ok: true,
        status: 200,
        headers: new Map([
          ['x-csrf-token', 'csrf-abc'],
          ['set-cookie', 'SAP_SESSIONID=xyz; path=/'],
        ]),
        text: async () => '',
      };
      // POST response
      const postResponse = jsonResponse({ d: { OrderId: '100' } }, 200);

      mockFetch
        .mockResolvedValueOnce(csrfResponse)
        .mockResolvedValueOnce(postResponse);

      const result = await client.post('/api/Orders', { Amount: 500 });

      // First call: CSRF HEAD
      expect(mockFetch.mock.calls[0][1].method).toBe('HEAD');
      expect(mockFetch.mock.calls[0][1].headers['X-CSRF-Token']).toBe('Fetch');

      // Second call: POST with CSRF token
      expect(mockFetch.mock.calls[1][1].method).toBe('POST');
      expect(mockFetch.mock.calls[1][1].headers['X-CSRF-Token']).toBe('csrf-abc');
      expect(result.d.OrderId).toBe('100');
    });
  });

  describe('patch()', () => {
    it('should send PATCH with body', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Map([['x-csrf-token', 'tok']]),
          text: async () => '',
        })
        .mockResolvedValueOnce(jsonResponse({ d: { Status: 'Updated' } }));

      const result = await client.patch('/api/Orders(1)', { Status: 'Closed' });
      expect(mockFetch.mock.calls[1][1].method).toBe('PATCH');
      expect(result.d.Status).toBe('Updated');
    });
  });

  describe('delete()', () => {
    it('should send DELETE and handle 204 No Content', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Map([['x-csrf-token', 'tok']]),
          text: async () => '',
        })
        .mockResolvedValueOnce({
          ok: true, status: 204, statusText: 'No Content',
          headers: new Map(),
          text: async () => '',
        });

      const result = await client.delete('/api/Orders(1)');
      expect(result).toBeNull();
    });
  });

  describe('getMetadata()', () => {
    it('should fetch $metadata as XML text', async () => {
      const xml = '<edmx:Edmx Version="1.0"><edmx:DataServices></edmx:DataServices></edmx:Edmx>';
      mockFetch.mockResolvedValue(textResponse(xml));

      const result = await client.getMetadata('/sap/opu/odata/sap/API');

      expect(result).toContain('edmx:Edmx');
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('$metadata');
      expect(opts.headers.Accept).toBe('application/xml');
    });
  });

  describe('error handling', () => {
    it('should throw AuthenticationError on 401', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Map(),
        text: async () => 'Unauthorized',
      });

      await expect(client.get('/api/test')).rejects.toThrow(AuthenticationError);
    });

    it('should throw ODataError on 500', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Map(),
        text: async () => '{"error":{"message":"Server error"}}',
      });

      await expect(client.get('/api/test')).rejects.toThrow(ODataError);
    });

    it('should throw ConnectionError on network failure', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(client.get('/api/test')).rejects.toThrow(ConnectionError);
    });

    it('should throw ODataError on 429 rate limit', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['retry-after', '5']]),
        text: async () => 'Rate limited',
      });

      await expect(client.get('/api/test')).rejects.toThrow(ODataError);
    });
  });

  describe('retry', () => {
    it('should retry on transient errors', async () => {
      const c = new ODataClient({
        baseUrl: 'https://sap.example.com',
        retries: 2,
        timeout: 5000,
      });

      mockFetch
        .mockRejectedValueOnce(new TypeError('network error'))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const result = await c.get('/api/test');
      expect(result).toEqual({ ok: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    }, 15000);

    it('should not retry on 401', async () => {
      mockFetch.mockResolvedValue({
        ok: false, status: 401, statusText: 'Unauthorized',
        headers: new Map(),
        text: async () => 'Unauthorized',
      });

      await expect(client.get('/api/test')).rejects.toThrow(AuthenticationError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
