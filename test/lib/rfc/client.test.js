/**
 * Tests for RFC Client Wrapper
 */
const RfcClient = require('../../../lib/rfc/client');

describe('RfcClient', () => {
  const connParams = { ashost: '10.0.0.1', sysnr: '00', client: '100', user: 'TEST', passwd: 'pass' };
  let client;
  let mockNodeRfcClient;

  beforeEach(() => {
    mockNodeRfcClient = {
      open: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      call: vi.fn().mockResolvedValue({}),
    };

    // Stub _loadNodeRfc to return mock
    vi.spyOn(RfcClient, '_loadNodeRfc').mockReturnValue({
      Client: vi.fn().mockImplementation(() => mockNodeRfcClient),
    });

    client = new RfcClient(connParams, { timeout: 5000, retries: 1 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should store connection params and options', () => {
      expect(client.connectionParams).toStrictEqual(connParams);
      expect(client.timeout).toBe(5000);
      expect(client.retries).toBe(1);
      expect(client.isConnected).toBe(false);
    });
  });

  describe('open', () => {
    it('should open a connection', async () => {
      await client.open();
      expect(client.isConnected).toBe(true);
    });

    it('should throw RfcError on failure', async () => {
      mockNodeRfcClient.open.mockRejectedValueOnce(new Error('Connection refused'));
      const badClient = new RfcClient(connParams);
      await expect(badClient.open()).rejects.toThrow('Failed to open RFC connection');
    });
  });

  describe('close', () => {
    it('should close a connected client', async () => {
      await client.open();
      await client.close();
      expect(client.isConnected).toBe(false);
    });

    it('should be safe to call when not connected', async () => {
      await client.close();
      expect(client.isConnected).toBe(false);
    });
  });

  describe('call', () => {
    it('should call a function module', async () => {
      mockNodeRfcClient.call.mockResolvedValueOnce({ ET_DATA: [{ VALUE: '100' }] });
      const result = await client.call('BAPI_COMPANY_GETLIST', {});
      expect(result).toEqual({ ET_DATA: [{ VALUE: '100' }] });
    });

    it('should auto-open if not connected', async () => {
      await client.call('RFC_PING');
      expect(client.isConnected).toBe(true);
    });

    it('should retry on transient errors', async () => {
      mockNodeRfcClient.call
        .mockRejectedValueOnce(new Error('Connection reset'))
        .mockResolvedValueOnce({ OK: true });
      const c = new RfcClient(connParams, { retries: 2, timeout: 5000 });
      const result = await c.call('RFC_PING');
      expect(result).toEqual({ OK: true });
    });
  });

  describe('ping', () => {
    it('should return true on success', async () => {
      expect(await client.ping()).toBe(true);
    });

    it('should return false on failure', async () => {
      mockNodeRfcClient.call.mockRejectedValue(new Error('Ping failed'));
      const c = new RfcClient(connParams, { retries: 0 });
      expect(await c.ping()).toBe(false);
    });
  });
});
