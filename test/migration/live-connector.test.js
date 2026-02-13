const { LiveConnector, OBJECT_SERVICE_MAP } = require('../../migration/live-connector');
const { SapClientFactory } = require('../../lib/sap-client-factory');

describe('LiveConnector', () => {
  let connector;

  beforeEach(() => {
    connector = new LiveConnector({ logLevel: 'error' });
  });

  describe('hasMapping', () => {
    it('returns true for mapped objects', () => {
      expect(connector.hasMapping('GL_BALANCE')).toBe(true);
      expect(connector.hasMapping('BUSINESS_PARTNER')).toBe(true);
      expect(connector.hasMapping('MATERIAL_MASTER')).toBe(true);
    });

    it('returns false for unmapped objects', () => {
      expect(connector.hasMapping('NONEXISTENT')).toBe(false);
    });
  });

  describe('getMapping', () => {
    it('returns mapping for known object', () => {
      const mapping = connector.getMapping('GL_BALANCE');
      expect(mapping.system).toBe('source');
      expect(mapping.service).toBe('ECC_GL_BALANCE');
      expect(mapping.entitySet).toBe('FAGLFLEXT');
    });

    it('returns null for unknown object', () => {
      expect(connector.getMapping('NONEXISTENT')).toBeNull();
    });
  });

  describe('OBJECT_SERVICE_MAP', () => {
    it('has mappings for key objects', () => {
      expect(OBJECT_SERVICE_MAP.GL_BALANCE).toBeDefined();
      expect(OBJECT_SERVICE_MAP.BUSINESS_PARTNER).toBeDefined();
      expect(OBJECT_SERVICE_MAP.MATERIAL_MASTER).toBeDefined();
      expect(OBJECT_SERVICE_MAP.PURCHASE_ORDER).toBeDefined();
      expect(OBJECT_SERVICE_MAP.SALES_ORDER).toBeDefined();
      expect(OBJECT_SERVICE_MAP.FIXED_ASSET).toBeDefined();
    });

    it('all mappings have required fields', () => {
      for (const [id, mapping] of Object.entries(OBJECT_SERVICE_MAP)) {
        expect(mapping.system).toMatch(/^(source|target)$/);
        expect(mapping.service).toBeDefined();
        expect(mapping.entitySet).toBeDefined();
        expect(mapping.version).toMatch(/^v[24]$/);
      }
    });
  });

  describe('extract', () => {
    it('throws for unmapped objects', async () => {
      await expect(connector.extract('NONEXISTENT')).rejects.toThrow(/No live service mapping/);
    });

    it('throws when system not registered', async () => {
      await expect(connector.extract('GL_BALANCE')).rejects.toThrow(/Unknown SAP system/);
    });
  });

  describe('load', () => {
    it('throws for unmapped objects', async () => {
      await expect(connector.load('NONEXISTENT', [])).rejects.toThrow(/No live service mapping/);
    });
  });

  describe('getExtractionStats', () => {
    it('returns empty stats initially', () => {
      const stats = connector.getExtractionStats();
      expect(Object.keys(stats)).toHaveLength(0);
    });
  });
});
