const ConfigReader = require('../../migration/config-reader');

describe('ConfigReader', () => {
  function mockGateway() {
    return { mode: 'mock' };
  }

  describe('constructor', () => {
    it('creates an instance in mock mode', () => {
      const reader = new ConfigReader(mockGateway());
      expect(reader).toBeDefined();
      expect(reader.gateway.mode).toBe('mock');
    });
  });

  describe('read()', () => {
    let config;

    beforeEach(async () => {
      const reader = new ConfigReader(mockGateway());
      config = await reader.read();
    });

    it('returns config with orgStructure', () => {
      expect(config).toHaveProperty('orgStructure');
      expect(config.orgStructure).toBeDefined();
    });

    it('orgStructure has companyCode array', () => {
      expect(Array.isArray(config.orgStructure.companyCode)).toBe(true);
      expect(config.orgStructure.companyCode.length).toBeGreaterThan(0);
    });

    it('orgStructure has plant array', () => {
      expect(Array.isArray(config.orgStructure.plant)).toBe(true);
      expect(config.orgStructure.plant.length).toBeGreaterThan(0);
    });

    it('orgStructure has salesOrg array', () => {
      expect(Array.isArray(config.orgStructure.salesOrg)).toBe(true);
      expect(config.orgStructure.salesOrg.length).toBeGreaterThan(0);
    });

    it('orgStructure has purchaseOrg array', () => {
      expect(Array.isArray(config.orgStructure.purchaseOrg)).toBe(true);
      expect(config.orgStructure.purchaseOrg.length).toBeGreaterThan(0);
    });

    it('orgStructure has controllingArea array', () => {
      expect(Array.isArray(config.orgStructure.controllingArea)).toBe(true);
      expect(config.orgStructure.controllingArea.length).toBeGreaterThan(0);
    });

    it('returns glAccounts with chart of accounts and ranges', () => {
      expect(config).toHaveProperty('glAccounts');
      expect(config.glAccounts.chartOfAccounts).toBeDefined();
      expect(config.glAccounts.totalAccounts).toBeGreaterThan(0);
      expect(Array.isArray(config.glAccounts.ranges)).toBe(true);
    });

    it('returns taxCodes array', () => {
      expect(Array.isArray(config.taxCodes)).toBe(true);
      expect(config.taxCodes.length).toBeGreaterThan(0);
    });

    it('returns paymentTerms array', () => {
      expect(Array.isArray(config.paymentTerms)).toBe(true);
      expect(config.paymentTerms.length).toBeGreaterThan(0);
    });

    it('company codes have required fields (code, name, country, currency)', () => {
      for (const cc of config.orgStructure.companyCode) {
        expect(cc).toHaveProperty('code');
        expect(cc).toHaveProperty('name');
        expect(cc).toHaveProperty('country');
        expect(cc).toHaveProperty('currency');
        expect(typeof cc.code).toBe('string');
        expect(typeof cc.name).toBe('string');
      }
    });

    it('plants reference valid company codes', () => {
      const validCodes = config.orgStructure.companyCode.map((cc) => cc.code);
      for (const plant of config.orgStructure.plant) {
        expect(plant).toHaveProperty('companyCode');
        expect(validCodes).toContain(plant.companyCode);
      }
    });
  });
});
