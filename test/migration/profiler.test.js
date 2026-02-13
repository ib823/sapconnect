const Profiler = require('../../migration/profiler');

describe('Profiler', () => {
  function mockGateway() {
    return { mode: 'mock' };
  }

  describe('mock mode', () => {
    it('should return profile data with expected shape', async () => {
      const profiler = new Profiler(mockGateway());
      const result = await profiler.profile();

      expect(result).toHaveProperty('tables');
      expect(result).toHaveProperty('staleData');
      expect(result).toHaveProperty('duplicates');
      expect(result).toHaveProperty('orphans');
      expect(result).toHaveProperty('summary');
    });

    it('should have summary with totals', async () => {
      const profiler = new Profiler(mockGateway());
      const result = await profiler.profile();

      expect(result.summary.totalTables).toBeGreaterThan(0);
      expect(result.summary.totalRecords).toBeGreaterThan(0);
      expect(result.summary.dataQualityScore).toBeDefined();
    });
  });

  describe('module filtering', () => {
    it('should filter by requested modules', async () => {
      const profiler = new Profiler(mockGateway(), { modules: ['FI'] });
      const result = await profiler.profile();

      const moduleKeys = Object.keys(result.tables);
      expect(moduleKeys).toContain('FI');
      // Should not contain unfiltered modules
      expect(moduleKeys.length).toBeLessThanOrEqual(1);
    });

    it('should return all modules when no filter specified', async () => {
      const profiler = new Profiler(mockGateway());
      const result = await profiler.profile();

      expect(Object.keys(result.tables).length).toBeGreaterThan(1);
    });
  });
});
