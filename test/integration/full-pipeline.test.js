/**
 * Integration Test — Full 8-Phase Migration Pipeline (End-to-End, Mock Mode)
 *
 * Runs all migration phases in sequence and verifies cross-phase
 * data integrity. Every module is exercised with a mock gateway
 * so that no live SAP connection is required.
 */

const Scanner = require('../../migration/scanner');
const Analyzer = require('../../migration/analyzer');
const Remediator = require('../../migration/remediator');
const Profiler = require('../../migration/profiler');
const TestGenerator = require('../../migration/test-gen');
const ConfigReader = require('../../migration/config-reader');
const ConfigWriter = require('../../migration/config-writer');
const MigrationObjectRegistry = require('../../migration/objects/registry');
const TestRunner = require('../../migration/test-runner');
const CutoverPlan = require('../../migration/cutover-plan');
const ReconciliationEngine = require('../../migration/reconciliation-engine');
const TestScenarioEngine = require('../../migration/test-scenario-engine');
const DashboardAPI = require('../../migration/dashboard/api');

// Shared mock gateway used across all phases
function mockGateway() {
  return { mode: 'mock' };
}

describe('Full 8-Phase Migration Pipeline (Integration)', () => {
  // Shared state accumulated as the pipeline progresses
  let gateway;
  let scanResult;
  let analysisResult;
  let remediationResult;
  let profileResult;
  let testSuite;
  let sourceConfig;
  let configWriteResult;
  let provisionResult;
  let testRunResult;
  let cutoverPlan;

  beforeEach(() => {
    gateway = mockGateway();
  });

  // ────────────────────────────────────────────────────────────
  // Phase 1 — Assess
  // ────────────────────────────────────────────────────────────
  describe('Phase 1: Assess', () => {
    it('Scanner finds custom objects with source code', async () => {
      const scanner = new Scanner(gateway);
      scanResult = await scanner.scan();

      expect(scanResult).toBeDefined();
      expect(scanResult.objects).toBeInstanceOf(Array);
      expect(scanResult.objects.length).toBeGreaterThan(0);
      expect(scanResult.sources).toBeDefined();
      expect(Object.keys(scanResult.sources).length).toBeGreaterThan(0);
      expect(scanResult.stats).toBeDefined();
      expect(scanResult.stats.objects).toBeGreaterThan(0);

      // Every object must have a name and type
      for (const obj of scanResult.objects) {
        expect(obj).toHaveProperty('name');
        expect(obj).toHaveProperty('type');
      }
    });

    it('Analyzer produces findings with severity counts and risk matrix', () => {
      // Depends on scanResult from previous test — run scanner inline as safety net
      if (!scanResult) {
        const scanner = new Scanner(gateway);
        scanResult = scanner._scanMock();
      }

      const analyzer = new Analyzer();
      analysisResult = analyzer.analyze(scanResult);

      expect(analysisResult).toBeDefined();
      expect(analysisResult.summary).toBeDefined();
      expect(analysisResult.summary.totalObjects).toBeGreaterThan(0);
      expect(analysisResult.summary.totalFindings).toBeGreaterThanOrEqual(0);
      expect(typeof analysisResult.summary.readinessScore).toBe('number');
      expect(analysisResult.summary.readinessGrade).toMatch(/^[A-F]$/);

      // Severity counts must have the four standard keys
      expect(analysisResult.severityCounts).toBeDefined();
      expect(analysisResult.severityCounts).toHaveProperty('critical');
      expect(analysisResult.severityCounts).toHaveProperty('high');
      expect(analysisResult.severityCounts).toHaveProperty('medium');
      expect(analysisResult.severityCounts).toHaveProperty('low');

      // Category counts should be an object
      expect(analysisResult.categoryCounts).toBeDefined();
      expect(typeof analysisResult.categoryCounts).toBe('object');

      // Risk matrix must exist
      expect(analysisResult.riskMatrix).toBeDefined();
      expect(analysisResult.riskMatrix).toHaveProperty('critical');
      expect(analysisResult.riskMatrix).toHaveProperty('clean');

      // rulesChecked should be a positive integer
      expect(analysisResult.rulesChecked).toBeGreaterThan(0);

      // Findings array
      expect(analysisResult.findings).toBeInstanceOf(Array);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Phase 2 — Remediate
  // ────────────────────────────────────────────────────────────
  describe('Phase 2: Remediate', () => {
    it('Remediator produces remediation suggestions for scanned code', async () => {
      const remediator = new Remediator(gateway, { dryRun: true });
      remediationResult = await remediator.remediate();

      expect(remediationResult).toBeDefined();
      expect(remediationResult.remediations).toBeInstanceOf(Array);
      expect(remediationResult.stats).toBeDefined();
      expect(remediationResult.stats.totalFindings).toBeGreaterThanOrEqual(0);
      expect(typeof remediationResult.stats.autoFixed).toBe('number');
      expect(typeof remediationResult.stats.manualReview).toBe('number');
      expect(typeof remediationResult.stats.noTransform).toBe('number');

      // The remediator should also carry scanResult and analysis internally
      expect(remediationResult.scanResult).toBeDefined();
      expect(remediationResult.analysis).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  // Phase 3 — Profile
  // ────────────────────────────────────────────────────────────
  describe('Phase 3: Profile', () => {
    it('Profiler produces data quality results with summary', async () => {
      const profiler = new Profiler(gateway);
      profileResult = await profiler.profile();

      expect(profileResult).toBeDefined();
      expect(profileResult.tables).toBeDefined();
      expect(typeof profileResult.tables).toBe('object');

      // Summary statistics
      expect(profileResult.summary).toBeDefined();
      expect(profileResult.summary.totalTables).toBeGreaterThan(0);
      expect(profileResult.summary.totalRecords).toBeGreaterThan(0);
      expect(typeof profileResult.summary.dataQualityScore).toBe('number');

      // Stale, duplicate and orphan sections should exist
      expect(profileResult).toHaveProperty('staleData');
      expect(profileResult).toHaveProperty('duplicates');
      expect(profileResult).toHaveProperty('orphans');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Phase 4 — SDT (Test Generation)
  // ────────────────────────────────────────────────────────────
  describe('Phase 4: SDT (Test Generation)', () => {
    it('TestGenerator produces comparison and process test scripts', () => {
      const generator = new TestGenerator();
      testSuite = generator.generate();

      expect(testSuite).toBeDefined();
      expect(testSuite.comparisonTests).toBeInstanceOf(Array);
      expect(testSuite.comparisonTests.length).toBeGreaterThan(0);
      expect(testSuite.processTests).toBeInstanceOf(Array);
      expect(testSuite.processTests.length).toBeGreaterThan(0);

      // Stats
      expect(testSuite.stats).toBeDefined();
      expect(testSuite.stats.totalTests).toBe(
        testSuite.stats.comparisonTests + testSuite.stats.processTests
      );
      expect(testSuite.stats.modules).toBeInstanceOf(Array);

      // Each comparison test has required fields
      for (const t of testSuite.comparisonTests) {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('name');
        expect(t).toHaveProperty('module');
        expect(t).toHaveProperty('priority');
      }

      // Each process test has steps
      for (const t of testSuite.processTests) {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('steps');
        expect(t.steps.length).toBeGreaterThan(0);
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // Phase 5 — Configure
  // ────────────────────────────────────────────────────────────
  describe('Phase 5: Configure', () => {
    it('ConfigReader reads source config and ConfigWriter writes it', async () => {
      const reader = new ConfigReader(gateway);
      sourceConfig = await reader.read();

      expect(sourceConfig).toBeDefined();
      expect(sourceConfig.orgStructure).toBeDefined();
      expect(sourceConfig.orgStructure.companyCode).toBeInstanceOf(Array);
      expect(sourceConfig.orgStructure.companyCode.length).toBeGreaterThan(0);
      expect(sourceConfig.glAccounts).toBeDefined();
      expect(sourceConfig.taxCodes).toBeInstanceOf(Array);
      expect(sourceConfig.paymentTerms).toBeInstanceOf(Array);
      expect(sourceConfig.summary).toBeDefined();

      // Write configuration to target
      const writer = new ConfigWriter(gateway, { dryRun: true });
      configWriteResult = await writer.write(sourceConfig);

      expect(configWriteResult).toBeDefined();
      expect(configWriteResult.results).toBeInstanceOf(Array);
      expect(configWriteResult.results.length).toBeGreaterThan(0);
      expect(configWriteResult.stats).toBeDefined();
      expect(configWriteResult.stats.totalItems).toBeGreaterThan(0);
      expect(configWriteResult.stats.applied).toBeGreaterThan(0);
      expect(configWriteResult.stats.status).toMatch(/^completed/);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Phase 6 — Provision (Migration Object Execution)
  // ────────────────────────────────────────────────────────────
  describe('Phase 6: Provision', () => {
    it('Registry runs all migration objects in mock mode', async () => {
      const registry = new MigrationObjectRegistry();
      const objectIds = registry.listObjectIds();

      expect(objectIds).toBeInstanceOf(Array);
      // The registry has many built-in objects (>= 6 as specified)
      expect(objectIds.length).toBeGreaterThanOrEqual(6);

      provisionResult = await registry.runAll(gateway);

      expect(provisionResult).toBeDefined();
      expect(provisionResult.results).toBeInstanceOf(Array);
      expect(provisionResult.results.length).toBe(objectIds.length);
      expect(provisionResult.stats).toBeDefined();
      expect(provisionResult.stats.total).toBe(objectIds.length);
      expect(typeof provisionResult.stats.completed).toBe('number');
      expect(typeof provisionResult.stats.failed).toBe('number');
      expect(provisionResult.stats.totalDurationMs).toBeGreaterThanOrEqual(0);
    }, 30000); // allow up to 30s for all objects
  });

  // ────────────────────────────────────────────────────────────
  // Phase 7 — Test
  // ────────────────────────────────────────────────────────────
  describe('Phase 7: Test', () => {
    it('TestRunner executes generated test suite and returns results', async () => {
      // Ensure we have a test suite
      if (!testSuite) {
        const generator = new TestGenerator();
        testSuite = generator.generate();
      }

      const runner = new TestRunner(gateway);
      testRunResult = await runner.run(testSuite);

      expect(testRunResult).toBeDefined();
      expect(testRunResult.comparisonResults).toBeInstanceOf(Array);
      expect(testRunResult.comparisonResults.length).toBe(testSuite.comparisonTests.length);
      expect(testRunResult.processResults).toBeInstanceOf(Array);
      expect(testRunResult.processResults.length).toBe(testSuite.processTests.length);

      // Stats
      expect(testRunResult.stats).toBeDefined();
      expect(testRunResult.stats.total).toBe(
        testRunResult.comparisonResults.length + testRunResult.processResults.length
      );
      expect(typeof testRunResult.stats.passed).toBe('number');
      expect(typeof testRunResult.stats.failed).toBe('number');
      expect(typeof testRunResult.stats.passRate).toBe('number');
      expect(testRunResult.stats.passRate).toBeGreaterThanOrEqual(0);
      expect(testRunResult.stats.passRate).toBeLessThanOrEqual(100);

      // Each result has a result field
      for (const r of testRunResult.comparisonResults) {
        expect(['pass', 'fail', 'skip']).toContain(r.result);
      }
      for (const r of testRunResult.processResults) {
        expect(['pass', 'fail', 'skip']).toContain(r.result);
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // Phase 8 — Cutover
  // ────────────────────────────────────────────────────────────
  describe('Phase 8: Cutover', () => {
    it('CutoverPlan generates phases with milestones and risks', () => {
      const planner = new CutoverPlan();
      cutoverPlan = planner.generate();

      expect(cutoverPlan).toBeDefined();
      expect(cutoverPlan.phases).toBeInstanceOf(Array);
      expect(cutoverPlan.phases.length).toBeGreaterThan(0);

      // Each phase has tasks
      for (const phase of cutoverPlan.phases) {
        expect(phase).toHaveProperty('id');
        expect(phase).toHaveProperty('name');
        expect(phase.tasks).toBeInstanceOf(Array);
        expect(phase.tasks.length).toBeGreaterThan(0);

        for (const task of phase.tasks) {
          expect(task).toHaveProperty('id');
          expect(task).toHaveProperty('name');
          expect(task).toHaveProperty('owner');
          expect(task).toHaveProperty('durationHours');
          expect(task.durationHours).toBeGreaterThan(0);
        }
      }

      // Milestones
      expect(cutoverPlan.milestones).toBeInstanceOf(Array);
      expect(cutoverPlan.milestones.length).toBeGreaterThan(0);
      for (const m of cutoverPlan.milestones) {
        expect(m).toHaveProperty('id');
        expect(m).toHaveProperty('name');
        expect(m).toHaveProperty('date');
      }

      // Stats
      expect(cutoverPlan.stats).toBeDefined();
      expect(cutoverPlan.stats.totalPhases).toBe(cutoverPlan.phases.length);
      expect(cutoverPlan.stats.totalTasks).toBeGreaterThan(0);
      expect(cutoverPlan.stats.totalHours).toBeGreaterThan(0);
      expect(cutoverPlan.stats.goLiveDate).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  // Cross-Phase Integration
  // ────────────────────────────────────────────────────────────
  describe('Cross-Phase Integration', () => {
    it('Reconciliation engine processes migration results', async () => {
      // Ensure provision results exist
      if (!provisionResult) {
        const registry = new MigrationObjectRegistry();
        provisionResult = await registry.runAll(gateway);
      }

      const reconciler = new ReconciliationEngine();
      const reconciliation = reconciler.reconcileAll(provisionResult.results);

      expect(reconciliation).toBeDefined();
      expect(reconciliation.summary).toBeDefined();
      expect(typeof reconciliation.summary.objectsReconciled).toBe('number');
      expect(typeof reconciliation.summary.totalChecks).toBe('number');
      expect(typeof reconciliation.summary.totalPassed).toBe('number');
      expect(typeof reconciliation.summary.totalFailed).toBe('number');
      expect(reconciliation.summary.overallStatus).toMatch(/^(PASSED|FAILED)$/);
      expect(reconciliation.reports).toBeInstanceOf(Array);
    }, 30000);

    it('Test scenario engine generates scenarios from migration results', async () => {
      if (!provisionResult) {
        const registry = new MigrationObjectRegistry();
        provisionResult = await registry.runAll(gateway);
      }

      const engine = new TestScenarioEngine();
      const scenarioSuite = engine.generateFromMigrationResults(provisionResult.results);

      expect(scenarioSuite).toBeDefined();
      expect(scenarioSuite.scenarios).toBeDefined();
      expect(scenarioSuite.scenarios.comparison).toBeInstanceOf(Array);
      expect(scenarioSuite.scenarios.process).toBeInstanceOf(Array);
      expect(scenarioSuite.scenarios.regression).toBeInstanceOf(Array);
      expect(scenarioSuite.stats).toBeDefined();
      expect(typeof scenarioSuite.stats.total).toBe('number');
      expect(scenarioSuite.stats.total).toBeGreaterThan(0);
    }, 30000);

    it('Dashboard API provides summary after a migration run', async () => {
      const registry = new MigrationObjectRegistry();
      const dashboard = new DashboardAPI({
        registry,
        gateway,
      });

      const summary = dashboard.getSummary();

      expect(summary).toBeDefined();
      expect(typeof summary.totalObjects).toBe('number');
      expect(summary.totalObjects).toBeGreaterThan(0);
      expect(summary.timestamp).toBeDefined();

      // Objects listing
      const objects = dashboard.getObjects();
      expect(objects).toBeInstanceOf(Array);
      expect(objects.length).toBeGreaterThan(0);
      for (const obj of objects) {
        expect(obj).toHaveProperty('objectId');
        expect(obj).toHaveProperty('name');
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // Full Sequence
  // ────────────────────────────────────────────────────────────
  describe('Full Pipeline Sequence', () => {
    it('runs all 8 phases in sequence without errors', async () => {
      const gw = mockGateway();

      // Phase 1 — Assess
      const scanner = new Scanner(gw);
      const scan = await scanner.scan();
      expect(scan.objects.length).toBeGreaterThan(0);

      const analyzer = new Analyzer();
      const analysis = analyzer.analyze(scan);
      expect(analysis.summary).toBeDefined();

      // Phase 2 — Remediate
      const remediator = new Remediator(gw, { dryRun: true });
      const remediation = await remediator.remediate();
      expect(remediation.stats).toBeDefined();

      // Phase 3 — Profile
      const profiler = new Profiler(gw);
      const profile = await profiler.profile();
      expect(profile.summary).toBeDefined();

      // Phase 4 — SDT
      const testGen = new TestGenerator();
      const tests = testGen.generate();
      expect(tests.stats.totalTests).toBeGreaterThan(0);

      // Phase 5 — Configure
      const configReader = new ConfigReader(gw);
      const config = await configReader.read();
      expect(config.orgStructure).toBeDefined();

      const configWriter = new ConfigWriter(gw, { dryRun: true });
      const writeResult = await configWriter.write(config);
      expect(writeResult.stats.applied).toBeGreaterThan(0);

      // Phase 6 — Provision
      const registry = new MigrationObjectRegistry();
      const provision = await registry.runAll(gw);
      expect(provision.stats.total).toBeGreaterThan(0);

      // Phase 7 — Test
      const testRunner = new TestRunner(gw);
      const testRun = await testRunner.run(tests);
      expect(testRun.stats.total).toBeGreaterThan(0);

      // Phase 8 — Cutover
      const planner = new CutoverPlan();
      const plan = planner.generate();
      expect(plan.phases.length).toBeGreaterThan(0);
    }, 60000);

    it('produces coherent data across phases', async () => {
      const gw = mockGateway();

      // Phase 1
      const scanner = new Scanner(gw);
      const scan = await scanner.scan();
      const analyzer = new Analyzer();
      const analysis = analyzer.analyze(scan);

      // Phase 6
      const registry = new MigrationObjectRegistry();
      const registeredIds = registry.listObjectIds();

      // The registry should have many migration objects
      expect(registeredIds.length).toBeGreaterThan(0);

      // Phase 4 — SDT tests cover modules like FI, MM, SD
      const testGen = new TestGenerator();
      const tests = testGen.generate();
      const testModules = new Set(tests.comparisonTests.map(t => t.module));
      expect(testModules.size).toBeGreaterThanOrEqual(2);

      // Phase 5 config should have org structure that lines up with standard modules
      const configReader = new ConfigReader(gw);
      const config = await configReader.read();
      expect(config.orgStructure.companyCode.length).toBeGreaterThan(0);

      // Phase 8 cutover should reference go-live
      const planner = new CutoverPlan();
      const plan = planner.generate();
      const goLiveMilestone = plan.milestones.find(m => m.name.toLowerCase().includes('go-live'));
      expect(goLiveMilestone).toBeDefined();

      // Analyzer readiness score is a percentage 0-100
      expect(analysis.summary.readinessScore).toBeGreaterThanOrEqual(0);
      expect(analysis.summary.readinessScore).toBeLessThanOrEqual(100);

      // Assessment findings count should be consistent with severity totals
      const totalSeverities =
        analysis.severityCounts.critical +
        analysis.severityCounts.high +
        analysis.severityCounts.medium +
        analysis.severityCounts.low;
      expect(totalSeverities).toBe(analysis.summary.totalFindings);
    }, 60000);
  });
});
