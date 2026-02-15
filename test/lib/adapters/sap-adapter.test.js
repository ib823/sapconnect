/**
 * Tests for SAP Source Adapter
 */
const { SapAdapter } = require('../../../lib/adapters/sap-adapter');
const { BaseSourceAdapter } = require('../../../lib/adapters/base-source-adapter');

describe('SapAdapter', () => {
  let adapter;

  beforeEach(() => {
    adapter = new SapAdapter({ mode: 'mock' });
  });

  describe('instantiation', () => {
    it('should extend BaseSourceAdapter', () => {
      expect(adapter).toBeInstanceOf(BaseSourceAdapter);
    });

    it('should report SAP as sourceSystem', () => {
      expect(adapter.sourceSystem).toBe('SAP');
    });

    it('should default to mock mode', () => {
      expect(adapter.mode).toBe('mock');
    });

    it('should not be connected initially', () => {
      expect(adapter.isConnected).toBe(false);
    });
  });

  describe('connect', () => {
    it('should connect in mock mode', async () => {
      const result = await adapter.connect();
      expect(result.success).toBe(true);
      expect(result.systemInfo).toBeDefined();
      expect(adapter.isConnected).toBe(true);
    });

    it('should return system info on connect', async () => {
      const result = await adapter.connect();
      expect(result.systemInfo.systemType).toContain('SAP');
      expect(result.systemInfo.systemId).toBe('S4H');
    });
  });

  describe('disconnect', () => {
    it('should disconnect', async () => {
      await adapter.connect();
      await adapter.disconnect();
      expect(adapter.isConnected).toBe(false);
    });
  });

  describe('readTable', () => {
    it('should return mock table data', async () => {
      const result = await adapter.readTable('MARA', { fields: ['MATNR', 'MTART'], maxRows: 3 });
      expect(result.rows).toBeInstanceOf(Array);
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.totalRows).toBeGreaterThan(0);
      expect(result.fields).toBeInstanceOf(Array);
    });

    it('should respect maxRows', async () => {
      const result = await adapter.readTable('MARA', { maxRows: 2 });
      expect(result.rows.length).toBeLessThanOrEqual(2);
    });

    it('should use default fields when none specified', async () => {
      const result = await adapter.readTable('KNA1');
      expect(result.fields).toContain('FIELD1');
    });

    it('should include field values from table name', async () => {
      const result = await adapter.readTable('MARA', { fields: ['MATNR'] });
      expect(result.rows[0].MATNR).toContain('MARA');
    });
  });

  describe('queryEntities', () => {
    it('should return mock entities', async () => {
      const result = await adapter.queryEntities('MaterialSet');
      expect(result.entities).toBeInstanceOf(Array);
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.entities[0]).toHaveProperty('ID');
      expect(result.entities[0]).toHaveProperty('Name');
    });

    it('should include entity type in entity name', async () => {
      const result = await adapter.queryEntities('CustomerSet');
      expect(result.entities[0].Name).toContain('CustomerSet');
    });
  });

  describe('getSystemInfo', () => {
    it('should return SAP system info in mock mode', async () => {
      const info = await adapter.getSystemInfo();
      expect(info.systemId).toBe('S4H');
      expect(info.systemType).toContain('SAP');
      expect(info.release).toBeDefined();
      expect(info.hostname).toBeDefined();
      expect(info.database).toContain('HANA');
      expect(info.modules).toBeInstanceOf(Array);
      expect(info.modules).toContain('FI');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy in mock mode', async () => {
      const health = await adapter.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.latencyMs).toBeDefined();
      expect(health.details.mode).toBe('mock');
    });
  });

  describe('getStatus', () => {
    it('should return adapter status', () => {
      const status = adapter.getStatus();
      expect(status.sourceSystem).toBe('SAP');
      expect(status.mode).toBe('mock');
      expect(status.connected).toBe(false);
    });
  });

  describe('live mode without clients', () => {
    it('should throw on readTable without TableReader', async () => {
      const liveAdapter = new SapAdapter({ mode: 'live' });
      await expect(liveAdapter.readTable('MARA')).rejects.toThrow('TableReader not initialized');
    });

    it('should throw on queryEntities without ODataClient', async () => {
      const liveAdapter = new SapAdapter({ mode: 'live' });
      await expect(liveAdapter.queryEntities('MaterialSet')).rejects.toThrow('ODataClient not initialized');
    });
  });
});
