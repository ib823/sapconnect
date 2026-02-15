/**
 * Tests for LiveTestHarness.
 */

const { LiveTestHarness } = require('../../lib/test-harness');

describe('LiveTestHarness', () => {
  let harness;

  beforeEach(() => {
    harness = new LiveTestHarness({ dryRun: true });
  });

  describe('isEnabled', () => {
    it('should check SAP_LIVE_TEST env var', () => {
      const orig = process.env.SAP_LIVE_TEST;
      try {
        delete process.env.SAP_LIVE_TEST;
        expect(harness.isEnabled()).toBe(false);

        process.env.SAP_LIVE_TEST = '1';
        expect(harness.isEnabled()).toBe(true);

        process.env.SAP_LIVE_TEST = 'true';
        expect(harness.isEnabled()).toBe(true);

        process.env.SAP_LIVE_TEST = '0';
        expect(harness.isEnabled()).toBe(false);
      } finally {
        if (orig) process.env.SAP_LIVE_TEST = orig;
        else delete process.env.SAP_LIVE_TEST;
      }
    });
  });

  describe('dryRun', () => {
    it('should default to true', () => {
      const h = new LiveTestHarness();
      expect(h.dryRun).toBe(true);
    });

    it('should respect explicit false', () => {
      const h = new LiveTestHarness({ dryRun: false });
      expect(h.dryRun).toBe(false);
    });
  });

  describe('runTest', () => {
    it('should run a passing test', async () => {
      const result = await harness.runTest('simple-pass', (ctx) => {
        ctx.assert(true, 'Should pass');
      });

      expect(result.name).toBe('simple-pass');
      expect(result.passed).toBe(true);
      expect(result.assertions).toBe(1);
      expect(result.failures).toHaveLength(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should capture assertion failures', async () => {
      const result = await harness.runTest('assertion-fail', (ctx) => {
        ctx.assert(true, 'First passes');
        ctx.assert(false, 'Second fails');
        ctx.assert(true, 'Third passes');
      });

      expect(result.passed).toBe(false);
      expect(result.assertions).toBe(3);
      expect(result.failures).toEqual(['Second fails']);
    });

    it('should capture thrown errors', async () => {
      const result = await harness.runTest('throws', () => {
        throw new Error('Unexpected error');
      });

      expect(result.passed).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });

    it('should accumulate results', async () => {
      await harness.runTest('test-1', (ctx) => ctx.assert(true));
      await harness.runTest('test-2', (ctx) => ctx.assert(false, 'fail'));

      expect(harness.results).toHaveLength(2);
    });
  });

  describe('context assertions', () => {
    it('assertEqual should compare values', async () => {
      const result = await harness.runTest('equal', (ctx) => {
        ctx.assertEqual(42, 42, 'Should be equal');
        ctx.assertEqual('a', 'b', 'Should differ');
      });
      expect(result.assertions).toBe(2);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0]).toContain('Should differ');
    });

    it('assertTruthy should check truthiness', async () => {
      const result = await harness.runTest('truthy', (ctx) => {
        ctx.assertTruthy('hello');
        ctx.assertTruthy(null, 'Should be truthy');
      });
      expect(result.failures).toHaveLength(1);
    });

    it('assertMinLength should check array length', async () => {
      const result = await harness.runTest('min-length', (ctx) => {
        ctx.assertMinLength([1, 2, 3], 2);
        ctx.assertMinLength([1], 5, 'Need 5 items');
        ctx.assertMinLength('not-array', 1, 'Not array');
      });
      expect(result.failures).toHaveLength(2);
    });
  });

  describe('context.writeOp', () => {
    it('should skip write operations in dry-run mode', async () => {
      const writeFn = vi.fn().mockResolvedValue('written');
      const result = await harness.runTest('dry-run-write', async (ctx) => {
        const val = await ctx.writeOp(writeFn, 'skipped');
        ctx.assertEqual(val, 'skipped');
      });

      expect(writeFn).not.toHaveBeenCalled();
      expect(result.passed).toBe(true);
    });

    it('should execute write operations when not dry-run', async () => {
      const h = new LiveTestHarness({ dryRun: false });
      const writeFn = vi.fn().mockResolvedValue('written');

      await h.runTest('real-write', async (ctx) => {
        const val = await ctx.writeOp(writeFn, 'skipped');
        ctx.assertEqual(val, 'written');
      });

      expect(writeFn).toHaveBeenCalled();
    });
  });

  describe('runSuite', () => {
    it('should run multiple tests and return summary', async () => {
      const suite = await harness.runSuite([
        { name: 'pass-1', fn: (ctx) => ctx.assert(true) },
        { name: 'pass-2', fn: (ctx) => ctx.assert(true) },
        { name: 'fail-1', fn: (ctx) => ctx.assert(false) },
      ]);

      expect(suite.total).toBe(3);
      expect(suite.passed).toBe(2);
      expect(suite.failed).toBe(1);
      expect(suite.results).toHaveLength(3);
    });
  });

  describe('cleanup', () => {
    it('should run cleanup callbacks in reverse order', async () => {
      const order = [];
      harness.onCleanup(async () => order.push('first'));
      harness.onCleanup(async () => order.push('second'));
      harness.onCleanup(async () => order.push('third'));

      await harness.cleanup();
      expect(order).toEqual(['third', 'second', 'first']);
    });

    it('should handle cleanup errors gracefully', async () => {
      harness.onCleanup(async () => { throw new Error('cleanup error'); });
      harness.onCleanup(async () => { /* succeeds */ });

      // Should not throw
      await harness.cleanup();
    });

    it('should clear callbacks after cleanup', async () => {
      let count = 0;
      harness.onCleanup(async () => { count++; });

      await harness.cleanup();
      expect(count).toBe(1);

      await harness.cleanup();
      expect(count).toBe(1); // Not called again
    });
  });

  describe('getSummary', () => {
    it('should aggregate results', async () => {
      await harness.runTest('p1', (ctx) => ctx.assert(true));
      await harness.runTest('p2', (ctx) => ctx.assert(true));
      await harness.runTest('f1', (ctx) => ctx.assert(false));

      const summary = harness.getSummary();
      expect(summary.total).toBe(3);
      expect(summary.passed).toBe(2);
      expect(summary.failed).toBe(1);
      expect(summary.passRate).toBe(67);
      expect(summary.totalDuration).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 passRate when no tests', () => {
      const summary = harness.getSummary();
      expect(summary.passRate).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear results and cleanup callbacks', async () => {
      await harness.runTest('test', (ctx) => ctx.assert(true));
      harness.onCleanup(async () => {});

      harness.reset();
      expect(harness.results).toHaveLength(0);
    });
  });
});
