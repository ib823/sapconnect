const Scanner = require('../../discovery/scanner');

describe('Discovery Scanner', () => {
  describe('mock mode', () => {
    it('should default to mock mode', () => {
      const scanner = new Scanner();
      expect(scanner.mode).toBe('mock');
    });

    it('should return scan result with expected shape', async () => {
      const scanner = new Scanner();
      const result = await scanner.scan();

      expect(result).toHaveProperty('mode', 'mock');
      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('communicationScenarios');
      expect(result).toHaveProperty('releasedAPIs');
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('extensionPoints');
      expect(result).toHaveProperty('summary');
    });

    it('should have APIs with required fields', async () => {
      const scanner = new Scanner();
      const result = await scanner.scan();

      expect(result.releasedAPIs.length).toBeGreaterThan(0);
      for (const api of result.releasedAPIs) {
        expect(api).toHaveProperty('name');
        expect(api).toHaveProperty('category');
      }
    });

    it('should compute summary counts', async () => {
      const scanner = new Scanner();
      const result = await scanner.scan();

      expect(result.summary.totalAPIs).toBe(result.releasedAPIs.length);
      expect(result.summary.totalScenarios).toBe(result.communicationScenarios.length);
      expect(result.summary.totalEvents).toBe(result.events.length);
    });

    it('should extract categories', async () => {
      const scanner = new Scanner();
      const result = await scanner.scan();

      expect(result.summary.categories.length).toBeGreaterThan(0);
      expect(Array.isArray(result.summary.categories)).toBe(true);
    });
  });
});
