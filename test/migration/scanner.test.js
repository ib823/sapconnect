const Scanner = require('../../migration/scanner');

describe('Migration Scanner', () => {
  function mockGateway() {
    return { mode: 'mock' };
  }

  describe('mock mode', () => {
    it('should return scan result with expected shape', async () => {
      const scanner = new Scanner(mockGateway());
      const result = await scanner.scan();

      expect(result).toHaveProperty('packages');
      expect(result).toHaveProperty('objects');
      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('stats');
      expect(Array.isArray(result.packages)).toBe(true);
      expect(Array.isArray(result.objects)).toBe(true);
      expect(typeof result.sources).toBe('object');
    });

    it('should have objects with required fields', async () => {
      const scanner = new Scanner(mockGateway());
      const result = await scanner.scan();

      for (const obj of result.objects) {
        expect(obj).toHaveProperty('name');
        expect(obj).toHaveProperty('type');
      }
    });

    it('should have sources with source code and line count', async () => {
      const scanner = new Scanner(mockGateway());
      const result = await scanner.scan();

      for (const [name, info] of Object.entries(result.sources)) {
        expect(info).toHaveProperty('source');
        expect(info).toHaveProperty('lines');
        expect(typeof info.source).toBe('string');
        expect(info.lines).toBeGreaterThan(0);
      }
    });

    it('should have stats with counts', async () => {
      const scanner = new Scanner(mockGateway());
      const result = await scanner.scan();

      expect(result.stats.objects).toBeGreaterThan(0);
      expect(result.stats.sourcesRead).toBeGreaterThan(0);
    });
  });
});
