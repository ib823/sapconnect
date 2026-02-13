const Remediator = require('../../migration/remediator');

describe('Remediator', () => {
  function mockGateway() {
    return { mode: 'mock' };
  }

  it('should run full remediation pipeline', async () => {
    const remediator = new Remediator(mockGateway());
    const result = await remediator.remediate();

    expect(result).toHaveProperty('remediations');
    expect(result).toHaveProperty('stats');
    expect(result).toHaveProperty('scanResult');
    expect(result).toHaveProperty('analysis');
    expect(Array.isArray(result.remediations)).toBe(true);
  });

  it('should track stats correctly', async () => {
    const remediator = new Remediator(mockGateway());
    const result = await remediator.remediate();

    const { stats } = result;
    expect(stats.totalFindings).toBeGreaterThan(0);
    expect(stats.autoFixed + stats.manualReview + stats.noTransform + stats.errors)
      .toBe(stats.totalFindings);
  });

  it('should produce remediations with status', async () => {
    const remediator = new Remediator(mockGateway());
    const result = await remediator.remediate();

    for (const r of result.remediations) {
      expect(r).toHaveProperty('object');
      expect(r).toHaveProperty('ruleId');
      expect(r).toHaveProperty('status');
      expect(['fixed', 'manual-review', 'skipped', 'error']).toContain(r.status);
    }
  });

  it('should generate diffs for fixed items', async () => {
    const remediator = new Remediator(mockGateway());
    const result = await remediator.remediate();

    const fixed = result.remediations.filter((r) => r.status === 'fixed');
    if (fixed.length > 0) {
      // At least some fixed items should have diffs
      const withDiff = fixed.filter((r) => r.diff);
      expect(withDiff.length).toBeGreaterThan(0);
    }
  });

  it('should default to dry-run mode', () => {
    const remediator = new Remediator(mockGateway());
    expect(remediator.dryRun).toBe(true);
  });
});
