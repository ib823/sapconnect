const Logger = require('../lib/logger');

/**
 * Migration Test Runner
 *
 * Runs generated tests against the target system.
 * Produces pass/fail report with details.
 * Mock mode simulates test execution with realistic results.
 */
class TestRunner {
  constructor(gateway, options = {}) {
    this.gateway = gateway;
    this.verbose = options.verbose || false;
    this.logger = new Logger('test-runner', { level: options.logLevel || 'info' });
  }

  _log(msg) {
    this.logger.info(msg);
  }

  /**
   * Run all tests
   * @param {object} testSuite - Output from TestGenerator.generate()
   * @returns {object} { comparisonResults[], processResults[], stats }
   */
  async run(testSuite) {
    this._log('Running migration tests...');

    const comparisonResults = await this._runComparisonTests(testSuite.comparisonTests);
    const processResults = await this._runProcessTests(testSuite.processTests);

    const allResults = [...comparisonResults, ...processResults];
    const passed = allResults.filter((r) => r.result === 'pass').length;
    const failed = allResults.filter((r) => r.result === 'fail').length;
    const skipped = allResults.filter((r) => r.result === 'skip').length;

    return {
      comparisonResults,
      processResults,
      stats: {
        total: allResults.length,
        passed,
        failed,
        skipped,
        passRate: allResults.length > 0
          ? Math.round((passed / allResults.length) * 100)
          : 0,
        duration: '12m 34s',
        status: failed === 0 ? 'ALL_PASSED' : 'HAS_FAILURES',
      },
    };
  }

  async _runComparisonTests(tests) {
    const results = [];

    for (const test of tests) {
      this._log(`Running comparison: ${test.id} - ${test.name}`);

      // Mock: simulate comparison results
      const mockResults = this._mockComparisonResult(test);
      results.push({
        ...test,
        result: mockResults.result,
        sourceValue: mockResults.sourceValue,
        targetValue: mockResults.targetValue,
        variance: mockResults.variance,
        details: mockResults.details,
        executedAt: new Date().toISOString(),
      });
    }

    return results;
  }

  async _runProcessTests(tests) {
    const results = [];

    for (const test of tests) {
      this._log(`Running process test: ${test.id} - ${test.name}`);

      // Mock: simulate process test execution
      const mockResults = this._mockProcessResult(test);
      results.push({
        ...test,
        result: mockResults.result,
        stepResults: mockResults.stepResults,
        details: mockResults.details,
        executedAt: new Date().toISOString(),
      });
    }

    return results;
  }

  _mockComparisonResult(test) {
    // Simulate realistic test results — most pass, a few fail
    const failTests = ['CMP-FI-005', 'CMP-SD-003'];
    const isFail = failTests.includes(test.id);

    if (isFail) {
      return {
        result: 'fail',
        sourceValue: test.id === 'CMP-FI-005' ? 66000 : 14520,
        targetValue: test.id === 'CMP-FI-005' ? 65680 : 14380,
        variance: test.id === 'CMP-FI-005' ? 320 : 140,
        details: test.id === 'CMP-FI-005'
          ? '320 customer/vendor records not merged into BP (duplicate resolution needed)'
          : '140 pricing condition records missing (custom condition types)',
      };
    }

    const values = {
      'CMP-FI-001': { source: 0, target: 0, unit: 'balance variance' },
      'CMP-FI-002': { source: 1800000, target: 1800000, unit: 'records' },
      'CMP-FI-003': { source: 950000, target: 950000, unit: 'records' },
      'CMP-FI-004': { source: 12450000, target: 12450000, unit: 'documents' },
      'CMP-MM-001': { source: 185000, target: 185000, unit: 'materials' },
      'CMP-MM-002': { source: 45200, target: 45200, unit: 'open POs' },
      'CMP-MM-003': { source: 420000, target: 420000, unit: 'stock records' },
      'CMP-SD-001': { source: 28400, target: 28400, unit: 'open SOs' },
      'CMP-SD-002': { source: 42000, target: 42000, unit: 'customers' },
    };

    const v = values[test.id] || { source: 1000, target: 1000, unit: 'records' };

    return {
      result: 'pass',
      sourceValue: v.source,
      targetValue: v.target,
      variance: 0,
      details: `${v.unit}: source and target match`,
    };
  }

  _mockProcessResult(test) {
    // Simulate: most pass, one fails
    const failTests = ['PROC-MM-003'];
    const isFail = failTests.includes(test.id);

    const stepResults = test.steps.map((step, i) => {
      if (isFail && i === 2) {
        return { step, status: 'fail', message: '3-way match tolerance exceeded for custom PO types' };
      }
      return { step, status: 'pass', message: 'OK' };
    });

    return {
      result: isFail ? 'fail' : 'pass',
      stepResults,
      details: isFail
        ? 'Invoice verification failed: 3-way match config needs adjustment for custom PO document types'
        : `All ${test.steps.length} steps completed successfully`,
    };
  }
}

module.exports = TestRunner;
