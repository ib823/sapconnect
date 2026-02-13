const UsageAnalyzer = require('../../migration/usage-analyzer');

describe('UsageAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    const mockGateway = { mode: 'mock' };
    analyzer = new UsageAnalyzer(mockGateway);
  });

  it('should analyze usage for given objects', async () => {
    const result = await analyzer.analyze(['Z_TEST_01', 'Z_TEST_02', 'Z_TEST_03']);

    expect(result).toHaveProperty('usageStats');
    expect(result).toHaveProperty('deadCode');
    expect(result).toHaveProperty('callHierarchy');
    expect(result).toHaveProperty('summary');
  });

  it('should return usage stats for each object', async () => {
    const objects = ['ZCL_FI_JOURNAL_POST', 'ZCL_MM_PO_ENHANCE', 'ZCL_SD_ORDER_PROC'];
    const result = await analyzer.analyze(objects);

    expect(result.usageStats).toHaveLength(3);
    for (const stat of result.usageStats) {
      expect(stat).toHaveProperty('object');
      expect(stat).toHaveProperty('lastUsed');
      expect(stat).toHaveProperty('callCount');
      expect(stat).toHaveProperty('status');
      expect(['active', 'low', 'unused', 'unknown']).toContain(stat.status);
    }
  });

  it('should identify dead code', async () => {
    // Use enough objects to statistically get some dead code (30-40%)
    const objects = Array.from({ length: 20 }, (_, i) => `Z_OBJ_${i}`);
    const result = await analyzer.analyze(objects);

    expect(result.deadCode.length).toBeGreaterThan(0);
    for (const dead of result.deadCode) {
      expect(dead).toHaveProperty('object');
      expect(dead).toHaveProperty('reason');
    }
  });

  it('should build call hierarchy', async () => {
    const result = await analyzer.analyze(['Z_MAIN_PROG']);

    expect(result.callHierarchy).toHaveProperty('Z_MAIN_PROG');
    expect(result.callHierarchy.Z_MAIN_PROG).toHaveProperty('callers');
    expect(result.callHierarchy.Z_MAIN_PROG).toHaveProperty('callees');
  });

  it('should produce correct summary', async () => {
    const objects = ['Z_A', 'Z_B', 'Z_C', 'Z_D', 'Z_E'];
    const result = await analyzer.analyze(objects);

    expect(result.summary.totalObjects).toBe(5);
    expect(result.summary.activeObjects + result.summary.lowUsageObjects + result.summary.deadCodeObjects).toBeLessThanOrEqual(5);
    expect(result.summary.deadCodePercentage).toBeGreaterThanOrEqual(0);
    expect(result.summary.deadCodePercentage).toBeLessThanOrEqual(100);
  });

  it('should handle empty object list', async () => {
    const result = await analyzer.analyze([]);

    expect(result.usageStats).toHaveLength(0);
    expect(result.deadCode).toHaveLength(0);
    expect(result.summary.totalObjects).toBe(0);
  });
});
