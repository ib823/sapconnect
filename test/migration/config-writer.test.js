const ConfigWriter = require('../../migration/config-writer');
const ConfigReader = require('../../migration/config-reader');

describe('ConfigWriter', () => {
  function mockGateway() {
    return { mode: 'mock' };
  }

  let sourceConfig;

  beforeEach(async () => {
    const reader = new ConfigReader(mockGateway());
    sourceConfig = await reader.read();
  });

  describe('constructor', () => {
    it('creates an instance in mock mode', () => {
      const writer = new ConfigWriter(mockGateway());
      expect(writer).toBeDefined();
      expect(writer.gateway.mode).toBe('mock');
    });
  });

  describe('write()', () => {
    it('returns results array', async () => {
      const writer = new ConfigWriter(mockGateway());
      const { results } = await writer.write(sourceConfig);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns stats with correct shape', async () => {
      const writer = new ConfigWriter(mockGateway());
      const { stats } = await writer.write(sourceConfig);

      expect(stats).toHaveProperty('totalItems');
      expect(stats).toHaveProperty('applied');
      expect(stats).toHaveProperty('skipped');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('status');
    });

    it('stats totalItems > 0', async () => {
      const writer = new ConfigWriter(mockGateway());
      const { stats } = await writer.write(sourceConfig);

      expect(stats.totalItems).toBeGreaterThan(0);
    });

    it('stats applied > 0', async () => {
      const writer = new ConfigWriter(mockGateway());
      const { stats } = await writer.write(sourceConfig);

      expect(stats.applied).toBeGreaterThan(0);
    });

    it('respects dryRun mode (default is true)', () => {
      const writer = new ConfigWriter(mockGateway(), { dryRun: true });
      expect(writer.dryRun).toBe(true);

      const writer2 = new ConfigWriter(mockGateway(), { dryRun: false });
      expect(writer2.dryRun).toBe(false);
    });

    it('handles org structure writing', async () => {
      const writer = new ConfigWriter(mockGateway());
      const { results } = await writer.write(sourceConfig);

      const orgResult = results.find((r) => r.category === 'Organizational Structure');
      expect(orgResult).toBeDefined();
      expect(orgResult.items).toBeGreaterThan(0);
      expect(orgResult.applied).toBeGreaterThan(0);
    });

    it('handles GL accounts writing', async () => {
      const writer = new ConfigWriter(mockGateway());
      const { results } = await writer.write(sourceConfig);

      const glResult = results.find((r) => r.category === 'GL Account Master');
      expect(glResult).toBeDefined();
      expect(glResult.items).toBeGreaterThan(0);
    });

    it('handles tax codes writing', async () => {
      const writer = new ConfigWriter(mockGateway());
      const { results } = await writer.write(sourceConfig);

      const taxResult = results.find((r) => r.category === 'Tax Configuration');
      expect(taxResult).toBeDefined();
      expect(taxResult.items).toBe(sourceConfig.taxCodes.length);
    });

    it('handles payment terms writing', async () => {
      const writer = new ConfigWriter(mockGateway());
      const { results } = await writer.write(sourceConfig);

      const payResult = results.find((r) => r.category === 'Payment Terms');
      expect(payResult).toBeDefined();
      expect(payResult.items).toBe(sourceConfig.paymentTerms.length);
    });
  });
});
