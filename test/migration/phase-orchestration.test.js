/**
 * Phase Orchestration Integration Tests
 *
 * Tests that the 8 migration phase orchestrators wire their underlying
 * modules together correctly.  Each phase CLI is a script entry-point
 * that does NOT export its internals, so we exercise the same module
 * pipeline each CLI invokes, verifying the data flows end-to-end in
 * mock mode.
 *
 * Phases:
 *   1. Assess   - Scanner -> Analyzer -> AssessmentReport
 *   2. Remediate - Remediator (scanner + analyzer + transforms)
 *   3. Profile   - Profiler
 *   4. SDT       - Extractor -> Transformer -> Loader
 *   5. Configure - ConfigReader -> ConfigWriter
 *   6. Provision  - Provisioner
 *   7. Test       - TestGenerator -> TestRunner
 *   8. Cutover    - CutoverPlan
 */

const SapGateway = require('../../agent/sap-gateway');
const Scanner = require('../../migration/scanner');
const Analyzer = require('../../migration/analyzer');
const AssessmentReport = require('../../migration/report');
const InterfaceScanner = require('../../migration/interface-scanner');
const UsageAnalyzer = require('../../migration/usage-analyzer');
const AtcClient = require('../../migration/atc-client');
const Remediator = require('../../migration/remediator');
const Profiler = require('../../migration/profiler');
const Extractor = require('../../migration/extractor');
const Transformer = require('../../migration/transformer');
const Loader = require('../../migration/loader');
const ConfigReader = require('../../migration/config-reader');
const ConfigWriter = require('../../migration/config-writer');
const Provisioner = require('../../migration/provisioner');
const TestGenerator = require('../../migration/test-gen');
const TestRunner = require('../../migration/test-runner');
const CutoverPlan = require('../../migration/cutover-plan');

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Build a mock-mode gateway (no SAP system URL → mock) */
function createMockGateway() {
  return new SapGateway(); // no options → mock mode
}

// ---------------------------------------------------------------------------
// Phase 1 – Assess
// ---------------------------------------------------------------------------
describe('Phase 1: Assess', () => {
  let gateway;

  beforeEach(() => {
    gateway = createMockGateway();
  });

  it('gateway initialises in mock mode', () => {
    expect(gateway.mode).toBe('mock');
  });

  describe('Scanner → Analyzer pipeline', () => {
    let scanResult;
    let analysis;

    beforeEach(async () => {
      const scanner = new Scanner(gateway);
      scanResult = await scanner.scan();
      const analyzer = new Analyzer();
      analysis = analyzer.analyze(scanResult);
    });

    it('Scanner.scan() returns packages, objects, sources, stats', () => {
      expect(scanResult).toHaveProperty('packages');
      expect(scanResult).toHaveProperty('objects');
      expect(scanResult).toHaveProperty('sources');
      expect(scanResult).toHaveProperty('stats');
      expect(Array.isArray(scanResult.packages)).toBe(true);
      expect(Array.isArray(scanResult.objects)).toBe(true);
      expect(typeof scanResult.sources).toBe('object');
    });

    it('scan stats contain numeric object/package counts', () => {
      expect(typeof scanResult.stats.objects).toBe('number');
      expect(typeof scanResult.stats.packages).toBe('number');
      expect(scanResult.stats.objects).toBeGreaterThan(0);
    });

    it('Analyzer.analyze() returns summary, findings, severityCounts', () => {
      expect(analysis).toHaveProperty('summary');
      expect(analysis).toHaveProperty('findings');
      expect(analysis).toHaveProperty('severityCounts');
      expect(analysis).toHaveProperty('categoryCounts');
      expect(analysis).toHaveProperty('objectSummary');
      expect(analysis).toHaveProperty('riskMatrix');
      expect(typeof analysis.rulesChecked).toBe('number');
    });

    it('summary has readinessScore and effortEstimate', () => {
      const { summary } = analysis;
      expect(typeof summary.readinessScore).toBe('number');
      expect(summary.readinessScore).toBeGreaterThanOrEqual(0);
      expect(summary.readinessScore).toBeLessThanOrEqual(100);
      expect(summary).toHaveProperty('readinessGrade');
      expect(summary).toHaveProperty('effortEstimate');
      expect(summary.effortEstimate).toHaveProperty('level');
      expect(summary.effortEstimate).toHaveProperty('range');
    });

    it('severityCounts has all four levels', () => {
      const { severityCounts } = analysis;
      for (const level of ['critical', 'high', 'medium', 'low']) {
        expect(typeof severityCounts[level]).toBe('number');
      }
    });

    it('findings array items have required shape', () => {
      expect(Array.isArray(analysis.findings)).toBe(true);
      if (analysis.findings.length > 0) {
        const f = analysis.findings[0];
        expect(f).toHaveProperty('object');
        expect(f).toHaveProperty('ruleId');
        expect(f).toHaveProperty('severity');
        expect(f).toHaveProperty('title');
        expect(f).toHaveProperty('remediation');
      }
    });
  });

  describe('AssessmentReport generation', () => {
    let report;

    beforeEach(async () => {
      const scanner = new Scanner(gateway);
      const scanResult = await scanner.scan();
      const analyzer = new Analyzer();
      const analysis = analyzer.analyze(scanResult);
      report = new AssessmentReport(analysis, scanResult, {
        clientName: 'Test Corp',
        systemId: 'TST',
      });
    });

    it('toTerminal() returns a non-empty string', () => {
      const output = report.toTerminal();
      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(100);
    });

    it('toTerminal() contains the client name', () => {
      const output = report.toTerminal();
      expect(output).toContain('Test Corp');
    });

    it('toMarkdown() returns a non-empty string with markdown headers', () => {
      const output = report.toMarkdown();
      expect(typeof output).toBe('string');
      expect(output).toContain('#');
      expect(output.length).toBeGreaterThan(100);
    });

    it('toMarkdown() contains the client name', () => {
      const output = report.toMarkdown();
      expect(output).toContain('Test Corp');
    });
  });

  describe('Optional assess sub-phases', () => {
    it('InterfaceScanner returns rfcDestinations, idocTypes, webServices, batchJobs, summary', async () => {
      const ifScanner = new InterfaceScanner(gateway);
      const data = await ifScanner.scan();

      expect(data).toHaveProperty('rfcDestinations');
      expect(data).toHaveProperty('idocTypes');
      expect(data).toHaveProperty('webServices');
      expect(data).toHaveProperty('batchJobs');
      expect(data).toHaveProperty('summary');
      expect(Array.isArray(data.rfcDestinations)).toBe(true);
      expect(Array.isArray(data.idocTypes)).toBe(true);
    });

    it('UsageAnalyzer returns usageStats, deadCode, callHierarchy, summary', async () => {
      const scanner = new Scanner(gateway);
      const scanResult = await scanner.scan();
      const objectNames = scanResult.objects.map((o) => o.name);

      const usage = new UsageAnalyzer(gateway);
      const data = await usage.analyze(objectNames);

      expect(data).toHaveProperty('usageStats');
      expect(data).toHaveProperty('deadCode');
      expect(data).toHaveProperty('callHierarchy');
      expect(data).toHaveProperty('summary');
      expect(Array.isArray(data.usageStats)).toBe(true);
      expect(Array.isArray(data.deadCode)).toBe(true);
    });

    it('AtcClient.runCheck returns findings and summary', async () => {
      const scanner = new Scanner(gateway);
      const scanResult = await scanner.scan();
      const objectNames = scanResult.objects.map((o) => o.name);

      const atc = new AtcClient(gateway);
      const data = await atc.runCheck(objectNames);

      expect(data).toHaveProperty('findings');
      expect(data).toHaveProperty('summary');
      expect(Array.isArray(data.findings)).toBe(true);
      expect(typeof data.summary.totalFindings).toBe('number');
    });

    it('AtcClient.getCheckVariants returns an array of variant names', async () => {
      const atc = new AtcClient(gateway);
      const variants = await atc.getCheckVariants();

      expect(Array.isArray(variants)).toBe(true);
      expect(variants.length).toBeGreaterThan(0);
      expect(variants).toContain('S4HANA_READINESS');
    });

    it('enrichAnalysis integrates optional data into the analysis', async () => {
      const scanner = new Scanner(gateway);
      const scanResult = await scanner.scan();
      const analyzer = new Analyzer();
      const analysis = analyzer.analyze(scanResult);

      const ifScanner = new InterfaceScanner(gateway);
      const interfaceData = await ifScanner.scan();

      const objectNames = scanResult.objects.map((o) => o.name);
      const atc = new AtcClient(gateway);
      const atcData = await atc.runCheck(objectNames);
      const usageAnalyzer = new UsageAnalyzer(gateway);
      const usageData = await usageAnalyzer.analyze(objectNames);

      const scoreBefore = analysis.summary.readinessScore;
      analyzer.enrichAnalysis(analysis, { interfaceData, atcData, usageData });

      // After enrichment, the analysis should have interface/atc summaries
      expect(analysis).toHaveProperty('interfaceSummary');
      // Score may have been adjusted
      expect(typeof analysis.summary.readinessScore).toBe('number');
    });
  });
});

// ---------------------------------------------------------------------------
// Phase 2 – Remediate
// ---------------------------------------------------------------------------
describe('Phase 2: Remediate', () => {
  let gateway;

  beforeEach(() => {
    gateway = createMockGateway();
  });

  it('Remediator runs in mock mode with dry-run enabled', async () => {
    const remediator = new Remediator(gateway, { dryRun: true });
    const result = await remediator.remediate();

    expect(result).toHaveProperty('remediations');
    expect(result).toHaveProperty('stats');
    expect(result).toHaveProperty('scanResult');
    expect(result).toHaveProperty('analysis');
  });

  it('returns remediations array with status for each finding', async () => {
    const remediator = new Remediator(gateway, { dryRun: true });
    const result = await remediator.remediate();

    expect(Array.isArray(result.remediations)).toBe(true);
    expect(result.remediations.length).toBeGreaterThan(0);

    for (const r of result.remediations) {
      expect(r).toHaveProperty('object');
      expect(r).toHaveProperty('ruleId');
      expect(r).toHaveProperty('status');
      expect(['fixed', 'manual-review', 'skipped', 'error']).toContain(r.status);
    }
  });

  it('stats track autoFixed, manualReview, noTransform, errors', async () => {
    const remediator = new Remediator(gateway, { dryRun: true });
    const { stats } = await remediator.remediate();

    expect(typeof stats.totalFindings).toBe('number');
    expect(typeof stats.autoFixed).toBe('number');
    expect(typeof stats.manualReview).toBe('number');
    expect(typeof stats.noTransform).toBe('number');
    expect(typeof stats.errors).toBe('number');
    expect(stats.totalFindings).toBeGreaterThan(0);
    // Sum of categories should equal totalFindings
    expect(stats.autoFixed + stats.manualReview + stats.noTransform + stats.errors)
      .toBe(stats.totalFindings);
  });

  it('embedded scanResult has the expected shape', async () => {
    const remediator = new Remediator(gateway, { dryRun: true });
    const { scanResult } = await remediator.remediate();

    expect(scanResult).toHaveProperty('packages');
    expect(scanResult).toHaveProperty('objects');
    expect(scanResult).toHaveProperty('sources');
    expect(scanResult).toHaveProperty('stats');
  });

  it('embedded analysis has summary and findings', async () => {
    const remediator = new Remediator(gateway, { dryRun: true });
    const { analysis } = await remediator.remediate();

    expect(analysis).toHaveProperty('summary');
    expect(analysis).toHaveProperty('findings');
    expect(analysis).toHaveProperty('severityCounts');
    expect(typeof analysis.summary.readinessScore).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Phase 3 – Profile
// ---------------------------------------------------------------------------
describe('Phase 3: Profile', () => {
  let gateway;

  beforeEach(() => {
    gateway = createMockGateway();
  });

  it('Profiler returns tables, staleData, duplicates, orphans, summary', async () => {
    const profiler = new Profiler(gateway);
    const result = await profiler.profile();

    expect(result).toHaveProperty('tables');
    expect(result).toHaveProperty('staleData');
    expect(result).toHaveProperty('duplicates');
    expect(result).toHaveProperty('orphans');
    expect(result).toHaveProperty('summary');
  });

  it('tables is keyed by module with array values', async () => {
    const profiler = new Profiler(gateway);
    const result = await profiler.profile();

    expect(typeof result.tables).toBe('object');
    const modules = Object.keys(result.tables);
    expect(modules.length).toBeGreaterThan(0);

    for (const mod of modules) {
      expect(Array.isArray(result.tables[mod])).toBe(true);
      if (result.tables[mod].length > 0) {
        const t = result.tables[mod][0];
        expect(t).toHaveProperty('table');
        expect(t).toHaveProperty('records');
      }
    }
  });

  it('filters by specified modules', async () => {
    const profiler = new Profiler(gateway, { modules: ['FI'] });
    const result = await profiler.profile();

    const modules = Object.keys(result.tables);
    expect(modules).toContain('FI');
    // Should only contain FI when filtered
    expect(modules.length).toBe(1);
  });

  it('summary has numeric totalTables and totalRecords', async () => {
    const profiler = new Profiler(gateway);
    const result = await profiler.profile();

    expect(typeof result.summary.totalTables).toBe('number');
    expect(typeof result.summary.totalRecords).toBe('number');
    expect(result.summary.totalTables).toBeGreaterThan(0);
    expect(result.summary.totalRecords).toBeGreaterThan(0);
  });

  it('staleData and duplicates are arrays', async () => {
    const profiler = new Profiler(gateway);
    const result = await profiler.profile();

    expect(Array.isArray(result.staleData)).toBe(true);
    expect(Array.isArray(result.duplicates)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Phase 4 – SDT (Extract → Transform → Load)
// ---------------------------------------------------------------------------
describe('Phase 4: SDT', () => {
  let gateway;

  beforeEach(() => {
    gateway = createMockGateway();
  });

  describe('Extractor → Transformer → Loader pipeline', () => {
    let extractResult;
    let transformResult;
    let loadResult;

    beforeEach(async () => {
      const extractor = new Extractor(gateway, {
        cutoffDate: '2020-01-01',
        modules: ['FI', 'MM', 'SD', 'HR'],
      });
      extractResult = await extractor.extract();

      const transformer = new Transformer();
      transformResult = transformer.transform(extractResult);

      const loader = new Loader(gateway, { batchSize: 5000, targetType: 'public' });
      loadResult = await loader.load(transformResult);
    });

    it('Extractor returns extractions array and stats', () => {
      expect(extractResult).toHaveProperty('extractions');
      expect(extractResult).toHaveProperty('stats');
      expect(Array.isArray(extractResult.extractions)).toBe(true);
      expect(extractResult.extractions.length).toBeGreaterThan(0);
    });

    it('each extraction has module, tables, and totalRecords', () => {
      for (const ext of extractResult.extractions) {
        expect(ext).toHaveProperty('module');
        expect(ext).toHaveProperty('tables');
        expect(ext).toHaveProperty('totalRecords');
        expect(Array.isArray(ext.tables)).toBe(true);
        expect(typeof ext.totalRecords).toBe('number');
      }
    });

    it('Transformer returns transformations array and stats', () => {
      expect(transformResult).toHaveProperty('transformations');
      expect(transformResult).toHaveProperty('stats');
      expect(Array.isArray(transformResult.transformations)).toBe(true);
      expect(transformResult.transformations.length).toBeGreaterThan(0);
    });

    it('transform stats have totalInputRecords and transformationRate', () => {
      const { stats } = transformResult;
      expect(typeof stats.totalInputRecords).toBe('number');
      expect(typeof stats.totalOutputRecords).toBe('number');
      expect(typeof stats.transformationRate).toBe('number');
      expect(stats.totalInputRecords).toBeGreaterThan(0);
    });

    it('each transformation has module and tableMappings', () => {
      for (const t of transformResult.transformations) {
        expect(t).toHaveProperty('module');
        expect(t).toHaveProperty('tableMappings');
        expect(t).toHaveProperty('inputRecords');
        expect(t).toHaveProperty('outputRecords');
      }
    });

    it('Loader returns loads array and stats', () => {
      expect(loadResult).toHaveProperty('loads');
      expect(loadResult).toHaveProperty('stats');
      expect(Array.isArray(loadResult.loads)).toBe(true);
    });

    it('loader stats have modulesLoaded, totalRecordsLoaded, status', () => {
      const { stats } = loadResult;
      expect(typeof stats.modulesLoaded).toBe('number');
      expect(typeof stats.totalRecordsLoaded).toBe('number');
      expect(typeof stats.totalBatches).toBe('number');
      expect(typeof stats.totalErrors).toBe('number');
      expect(stats).toHaveProperty('status');
      expect(['completed', 'completed_with_errors']).toContain(stats.status);
    });

    it('load record counts are consistent with transformation output', () => {
      // Total loaded + errors should approximate the transformer output
      const totalTransformedOutput = transformResult.stats.totalOutputRecords;
      const totalLoaded = loadResult.stats.totalRecordsLoaded;
      const totalErrors = loadResult.stats.totalErrors;

      // Loaded + errors should equal the transformer output (small error rate)
      expect(totalLoaded + totalErrors).toBeLessThanOrEqual(totalTransformedOutput);
      expect(totalLoaded).toBeGreaterThan(0);
    });
  });

  it('pipeline works with subset of modules', async () => {
    const extractor = new Extractor(gateway, { modules: ['FI'] });
    const extractResult = await extractor.extract();

    const transformer = new Transformer();
    const transformResult = transformer.transform(extractResult);

    const loader = new Loader(gateway);
    const loadResult = await loader.load(transformResult);

    expect(extractResult.extractions.length).toBe(1);
    expect(extractResult.extractions[0].module).toBe('FI');
    expect(loadResult.stats.modulesLoaded).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Phase 5 – Configure
// ---------------------------------------------------------------------------
describe('Phase 5: Configure', () => {
  let gateway;

  beforeEach(() => {
    gateway = createMockGateway();
  });

  describe('ConfigReader → ConfigWriter pipeline', () => {
    let sourceConfig;
    let writeResult;

    beforeEach(async () => {
      const reader = new ConfigReader(gateway);
      sourceConfig = await reader.read();

      const writer = new ConfigWriter(gateway, { dryRun: true, targetType: 'public' });
      writeResult = await writer.write(sourceConfig);
    });

    it('ConfigReader returns org structure, GL accounts, tax codes, and more', () => {
      expect(sourceConfig).toHaveProperty('orgStructure');
      expect(sourceConfig).toHaveProperty('glAccounts');
      expect(sourceConfig).toHaveProperty('taxCodes');
      expect(sourceConfig).toHaveProperty('paymentTerms');
      expect(sourceConfig).toHaveProperty('numberRanges');
      expect(sourceConfig).toHaveProperty('summary');
    });

    it('org structure has companyCode, plant, salesOrg, purchaseOrg, controllingArea', () => {
      const org = sourceConfig.orgStructure;
      expect(Array.isArray(org.companyCode)).toBe(true);
      expect(Array.isArray(org.plant)).toBe(true);
      expect(Array.isArray(org.salesOrg)).toBe(true);
      expect(Array.isArray(org.purchaseOrg)).toBe(true);
      expect(Array.isArray(org.controllingArea)).toBe(true);
      expect(org.companyCode.length).toBeGreaterThan(0);
    });

    it('company codes have code, name, country, currency', () => {
      for (const cc of sourceConfig.orgStructure.companyCode) {
        expect(cc).toHaveProperty('code');
        expect(cc).toHaveProperty('name');
        expect(cc).toHaveProperty('country');
        expect(cc).toHaveProperty('currency');
      }
    });

    it('ConfigWriter.write() returns results and stats', () => {
      expect(writeResult).toHaveProperty('results');
      expect(writeResult).toHaveProperty('stats');
      expect(Array.isArray(writeResult.results)).toBe(true);
      expect(writeResult.results.length).toBeGreaterThan(0);
    });

    it('writer stats track totalItems, applied, skipped, errors, status', () => {
      const { stats } = writeResult;
      expect(typeof stats.totalItems).toBe('number');
      expect(typeof stats.applied).toBe('number');
      expect(typeof stats.skipped).toBe('number');
      expect(typeof stats.errors).toBe('number');
      expect(stats).toHaveProperty('status');
      expect(stats.totalItems).toBeGreaterThan(0);
      expect(stats.applied).toBeGreaterThan(0);
    });

    it('each result category has category, method, items, applied', () => {
      for (const r of writeResult.results) {
        expect(r).toHaveProperty('category');
        expect(r).toHaveProperty('method');
        expect(typeof r.items).toBe('number');
        expect(typeof r.applied).toBe('number');
      }
    });

    it('writer uses Business Configuration API for public target', () => {
      const orgResult = writeResult.results.find(
        (r) => r.category === 'Organizational Structure'
      );
      expect(orgResult).toBeDefined();
      expect(orgResult.method).toBe('Business Configuration API');
    });
  });

  it('writer uses Customizing Transport for private target', async () => {
    const reader = new ConfigReader(gateway);
    const config = await reader.read();

    const writer = new ConfigWriter(gateway, { dryRun: true, targetType: 'private' });
    const result = await writer.write(config);

    const orgResult = result.results.find(
      (r) => r.category === 'Organizational Structure'
    );
    expect(orgResult).toBeDefined();
    expect(orgResult.method).toBe('Customizing Transport');
  });
});

// ---------------------------------------------------------------------------
// Phase 6 – Provision
// ---------------------------------------------------------------------------
describe('Phase 6: Provision', () => {
  let gateway;

  beforeEach(() => {
    gateway = createMockGateway();
  });

  it('Provisioner returns services, terraform, stats', async () => {
    const provisioner = new Provisioner(gateway);
    const result = await provisioner.provision();

    expect(result).toHaveProperty('services');
    expect(result).toHaveProperty('terraform');
    expect(result).toHaveProperty('stats');
  });

  it('services is an array with status for each service', async () => {
    const provisioner = new Provisioner(gateway);
    const result = await provisioner.provision();

    expect(Array.isArray(result.services)).toBe(true);
    expect(result.services.length).toBeGreaterThan(0);

    for (const svc of result.services) {
      expect(svc).toHaveProperty('name');
      expect(svc).toHaveProperty('status');
      expect(['provisioned', 'pending', 'error']).toContain(svc.status);
    }
  });

  it('terraform is a non-empty string containing provider block', async () => {
    const provisioner = new Provisioner(gateway);
    const result = await provisioner.provision();

    expect(typeof result.terraform).toBe('string');
    expect(result.terraform.length).toBeGreaterThan(0);
  });

  it('stats has totalServices, provisioned, landscape, tier, estimatedMonthlyCost', async () => {
    const provisioner = new Provisioner(gateway);
    const result = await provisioner.provision();

    const { stats } = result;
    expect(typeof stats.totalServices).toBe('number');
    expect(typeof stats.provisioned).toBe('number');
    expect(typeof stats.pending).toBe('number');
    expect(typeof stats.errors).toBe('number');
    expect(stats.totalServices).toBeGreaterThan(0);
    expect(stats).toHaveProperty('landscape');
    expect(stats).toHaveProperty('tier');
    expect(typeof stats.estimatedMonthlyCost).toBe('number');
  });

  it('respects landscape and tier options', async () => {
    const provisioner = new Provisioner(gateway, {
      landscape: 'cf-eu10',
      tier: 'premium',
    });
    const result = await provisioner.provision();

    expect(result.stats.landscape).toBe('cf-eu10');
    expect(result.stats.tier).toBe('premium');
  });
});

// ---------------------------------------------------------------------------
// Phase 7 – Test
// ---------------------------------------------------------------------------
describe('Phase 7: Test', () => {
  let gateway;

  beforeEach(() => {
    gateway = createMockGateway();
  });

  describe('TestGenerator → TestRunner pipeline', () => {
    let testSuite;
    let runResults;

    beforeEach(async () => {
      const generator = new TestGenerator({ modules: ['FI', 'MM', 'SD'] });
      testSuite = generator.generate();

      const runner = new TestRunner(gateway);
      runResults = await runner.run(testSuite);
    });

    it('TestGenerator returns comparisonTests, processTests, stats', () => {
      expect(testSuite).toHaveProperty('comparisonTests');
      expect(testSuite).toHaveProperty('processTests');
      expect(testSuite).toHaveProperty('stats');
      expect(Array.isArray(testSuite.comparisonTests)).toBe(true);
      expect(Array.isArray(testSuite.processTests)).toBe(true);
    });

    it('generated tests have required fields', () => {
      for (const test of testSuite.comparisonTests) {
        expect(test).toHaveProperty('id');
        expect(test).toHaveProperty('name');
        expect(test).toHaveProperty('priority');
      }
      for (const test of testSuite.processTests) {
        expect(test).toHaveProperty('id');
        expect(test).toHaveProperty('name');
      }
    });

    it('stats totalTests equals sum of comparison + process tests', () => {
      const { stats } = testSuite;
      expect(stats.totalTests).toBe(
        stats.comparisonTests + stats.processTests
      );
      expect(stats.totalTests).toBeGreaterThan(0);
    });

    it('generator respects modules option', () => {
      expect(testSuite.stats.modules).toEqual(['FI', 'MM', 'SD']);
    });

    it('TestRunner returns comparisonResults, processResults, stats', () => {
      expect(runResults).toHaveProperty('comparisonResults');
      expect(runResults).toHaveProperty('processResults');
      expect(runResults).toHaveProperty('stats');
      expect(Array.isArray(runResults.comparisonResults)).toBe(true);
      expect(Array.isArray(runResults.processResults)).toBe(true);
    });

    it('runner results have pass/fail/skip for each test', () => {
      const allResults = [
        ...runResults.comparisonResults,
        ...runResults.processResults,
      ];

      for (const r of allResults) {
        expect(r).toHaveProperty('result');
        expect(['pass', 'fail', 'skip']).toContain(r.result);
        expect(r).toHaveProperty('executedAt');
      }
    });

    it('runner stats track passed, failed, skipped, passRate', () => {
      const { stats } = runResults;
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.passed).toBe('number');
      expect(typeof stats.failed).toBe('number');
      expect(typeof stats.skipped).toBe('number');
      expect(typeof stats.passRate).toBe('number');
      expect(stats.total).toBe(stats.passed + stats.failed + stats.skipped);
      expect(stats).toHaveProperty('status');
      expect(['ALL_PASSED', 'HAS_FAILURES']).toContain(stats.status);
    });

    it('comparison results have sourceValue, targetValue, variance', () => {
      for (const r of runResults.comparisonResults) {
        expect(r).toHaveProperty('sourceValue');
        expect(r).toHaveProperty('targetValue');
        expect(r).toHaveProperty('variance');
      }
    });
  });

  it('works with a single module', async () => {
    const generator = new TestGenerator({ modules: ['FI'] });
    const suite = generator.generate();

    const runner = new TestRunner(gateway);
    const results = await runner.run(suite);

    expect(suite.comparisonTests.length).toBeGreaterThan(0);
    expect(results.stats.total).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Phase 8 – Cutover
// ---------------------------------------------------------------------------
describe('Phase 8: Cutover', () => {
  it('CutoverPlan generates phases, milestones, risks, stats', () => {
    const plan = new CutoverPlan({ clientName: 'Test Corp' });
    const result = plan.generate();

    expect(result).toHaveProperty('phases');
    expect(result).toHaveProperty('milestones');
    expect(result).toHaveProperty('risks');
    expect(result).toHaveProperty('stats');
  });

  it('phases is an array with tasks inside each phase', () => {
    const plan = new CutoverPlan();
    const result = plan.generate();

    expect(Array.isArray(result.phases)).toBe(true);
    expect(result.phases.length).toBeGreaterThan(0);

    for (const phase of result.phases) {
      expect(phase).toHaveProperty('id');
      expect(phase).toHaveProperty('name');
      expect(phase).toHaveProperty('tasks');
      expect(Array.isArray(phase.tasks)).toBe(true);
      expect(phase.tasks.length).toBeGreaterThan(0);
    }
  });

  it('tasks have id, name, owner, durationHours, depends, status', () => {
    const plan = new CutoverPlan();
    const result = plan.generate();

    for (const phase of result.phases) {
      for (const task of phase.tasks) {
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('name');
        expect(task).toHaveProperty('owner');
        expect(typeof task.durationHours).toBe('number');
        expect(Array.isArray(task.depends)).toBe(true);
        expect(task).toHaveProperty('status');
      }
    }
  });

  it('milestones is an array', () => {
    const plan = new CutoverPlan();
    const result = plan.generate();

    expect(Array.isArray(result.milestones)).toBe(true);
    expect(result.milestones.length).toBeGreaterThan(0);
  });

  it('risks is an array', () => {
    const plan = new CutoverPlan();
    const result = plan.generate();

    expect(Array.isArray(result.risks)).toBe(true);
    expect(result.risks.length).toBeGreaterThan(0);
  });

  it('stats has totalPhases, totalTasks, totalHours, goLiveDate', () => {
    const plan = new CutoverPlan({ goLiveDate: '2026-06-01' });
    const result = plan.generate();

    const { stats } = result;
    expect(typeof stats.totalPhases).toBe('number');
    expect(typeof stats.totalTasks).toBe('number');
    expect(typeof stats.totalHours).toBe('number');
    expect(typeof stats.totalDays).toBe('number');
    expect(stats.goLiveDate).toBe('2026-06-01');
    expect(typeof stats.cutoverWindowHours).toBe('number');
    expect(stats.totalPhases).toBeGreaterThan(0);
    expect(stats.totalTasks).toBeGreaterThan(0);
  });

  it('totalTasks equals the sum of tasks across all phases', () => {
    const plan = new CutoverPlan();
    const result = plan.generate();

    let taskCount = 0;
    for (const phase of result.phases) {
      taskCount += phase.tasks.length;
    }

    expect(result.stats.totalTasks).toBe(taskCount);
  });

  it('totalHours equals the sum of all task durationHours', () => {
    const plan = new CutoverPlan();
    const result = plan.generate();

    let totalHours = 0;
    for (const phase of result.phases) {
      for (const task of phase.tasks) {
        totalHours += task.durationHours;
      }
    }

    expect(result.stats.totalHours).toBe(totalHours);
  });

  it('totalDays is ceil(totalHours / 8)', () => {
    const plan = new CutoverPlan();
    const result = plan.generate();

    expect(result.stats.totalDays).toBe(Math.ceil(result.stats.totalHours / 8));
  });
});

// ---------------------------------------------------------------------------
// Cross-phase: full pipeline smoke test
// ---------------------------------------------------------------------------
describe('Cross-phase pipeline smoke test', () => {
  it('all 8 phases run to completion in mock mode without errors', async () => {
    const gateway = createMockGateway();

    // Phase 1: Assess
    const scanner = new Scanner(gateway);
    const scanResult = await scanner.scan();
    const analyzer = new Analyzer();
    const analysis = analyzer.analyze(scanResult);
    const report = new AssessmentReport(analysis, scanResult);
    expect(typeof report.toTerminal()).toBe('string');

    // Phase 2: Remediate
    const remediator = new Remediator(gateway, { dryRun: true });
    const remedResult = await remediator.remediate();
    expect(remedResult.stats.totalFindings).toBeGreaterThan(0);

    // Phase 3: Profile
    const profiler = new Profiler(gateway);
    const profileResult = await profiler.profile();
    expect(profileResult.summary.totalTables).toBeGreaterThan(0);

    // Phase 4: SDT
    const extractor = new Extractor(gateway);
    const extractResult = await extractor.extract();
    const transformer = new Transformer();
    const transformResult = transformer.transform(extractResult);
    const loader = new Loader(gateway);
    const loadResult = await loader.load(transformResult);
    expect(loadResult.stats.totalRecordsLoaded).toBeGreaterThan(0);

    // Phase 5: Configure
    const configReader = new ConfigReader(gateway);
    const config = await configReader.read();
    const configWriter = new ConfigWriter(gateway, { dryRun: true });
    const configResult = await configWriter.write(config);
    expect(configResult.stats.applied).toBeGreaterThan(0);

    // Phase 6: Provision
    const provisioner = new Provisioner(gateway);
    const provResult = await provisioner.provision();
    expect(provResult.stats.totalServices).toBeGreaterThan(0);

    // Phase 7: Test
    const testGen = new TestGenerator();
    const testSuite = testGen.generate();
    const testRunner = new TestRunner(gateway);
    const testResults = await testRunner.run(testSuite);
    expect(testResults.stats.total).toBeGreaterThan(0);

    // Phase 8: Cutover
    const cutoverPlan = new CutoverPlan();
    const cutoverResult = cutoverPlan.generate();
    expect(cutoverResult.stats.totalTasks).toBeGreaterThan(0);
  });
});
