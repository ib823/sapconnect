const ForensicReport = require('../../../extraction/report/forensic-report');

describe('ForensicReport', () => {
  function buildMockInputs() {
    const extractionResults = {
      SYSTEM_INFO: {
        sid: 'PRD',
        release: '750',
        database: 'HANA',
        os: 'Linux',
        clients: [{ MANDT: '100' }, { MANDT: '200' }],
        components: [{ COMPONENT: 'SAP_BASIS' }],
      },
      CUSTOM_CODE: {
        customObjects: [
          { OBJ_NAME: 'ZREPORT1', OBJECT: 'PROG' },
          { OBJ_NAME: 'ZCLASS1', OBJECT: 'CLAS' },
        ],
        stats: { totalCustom: 2, byType: { PROG: 1, CLAS: 1 }, linesOfCode: 500 },
        tableUsage: [{ PROG: 'ZREPORT1', TABNAME: 'MARA' }],
      },
      SECURITY: {
        users: [{ BNAME: 'ADMIN' }, { BNAME: 'JSMITH' }],
        roleDefinitions: [{ AGR_NAME: 'SAP_ALL' }],
        usersWithSapAll: ['ADMIN'],
      },
      INTERFACES: {
        rfcDestinations: [{ RFCDEST: 'DEST1' }],
        messageTypes: [{ MESTYP: 'ORDERS' }],
        logicalSystems: [{ LOGSYS: 'PRDCLNT100' }],
      },
      DATA_DICTIONARY: {
        tables: { MARA: {}, EKKO: {}, VBAK: {} },
        stats: {},
      },
    };

    const processModel = {
      toJSON: () => ({ totalProcesses: 3, processes: [] }),
      toMarkdown: () => '## Process Catalog\n- O2C\n- P2P\n- R2R',
      getSummary: () => ({ totalProcesses: 3 }),
    };

    const configInterpretation = [
      { ruleId: 'FI-DOCTYPE', description: 'Custom Document Types', interpretation: '2 custom types', s4hanaRelevance: 'Review needed' },
    ];

    const gapAnalysis = {
      extraction: { totalTablesInSystem: 100, totalTablesExtracted: 50, coveragePct: 50 },
      authorization: { count: 2 },
      confidence: { overall: 72, grade: 'C', summary: 'Adequate coverage' },
      humanValidation: ['Verify user count', 'Confirm company codes'],
    };

    return { extractionResults, processModel, configInterpretation, gapAnalysis };
  }

  it('should generate JSON report with all sections', () => {
    const { extractionResults, processModel, configInterpretation, gapAnalysis } = buildMockInputs();
    const report = new ForensicReport(extractionResults, processModel, configInterpretation, gapAnalysis);
    const json = report.toJSON();
    expect(json.generatedAt).toBeDefined();
    expect(json.version).toBe('1.0.0');
    expect(json.systemOverview.sid).toBe('PRD');
    expect(json.systemOverview.release).toBe('750');
    expect(json.moduleInventory).toBeDefined();
    expect(json.processCatalog.totalProcesses).toBe(3);
    expect(json.configurationBlueprint.length).toBe(1);
    expect(json.customCodeInventory.stats.totalCustom).toBe(2);
    expect(json.securityModel.users.length).toBe(2);
    expect(json.interfaceLandscape.rfcDestinations.length).toBe(1);
    expect(json.gapAnalysis).toBeDefined();
  });

  it('should generate Markdown report', () => {
    const { extractionResults, processModel, configInterpretation, gapAnalysis } = buildMockInputs();
    const report = new ForensicReport(extractionResults, processModel, configInterpretation, gapAnalysis);
    const md = report.toMarkdown();
    expect(md).toContain('# SAP Forensic Extraction Report');
    expect(md).toContain('System Overview');
    expect(md).toContain('PRD');
    expect(md).toContain('Module Inventory');
    expect(md).toContain('Configuration Blueprint');
    expect(md).toContain('Custom Code Inventory');
    expect(md).toContain('Security Model');
    expect(md).toContain('Interface Landscape');
    expect(md).toContain('Gap Analysis');
    expect(md).toContain('Confidence Assessment');
  });

  it('should generate executive summary', () => {
    const { extractionResults, processModel, configInterpretation, gapAnalysis } = buildMockInputs();
    const report = new ForensicReport(extractionResults, processModel, configInterpretation, gapAnalysis);
    const summary = report.toExecutiveSummary();
    expect(summary).toContain('Executive Summary');
    expect(summary).toContain('PRD');
    expect(summary).toContain('750');
    expect(summary).toContain('Key Findings');
    expect(summary).toContain('SAP_ALL');
    expect(summary).toContain('Recommended Actions');
  });

  it('should generate module-specific report', () => {
    const { extractionResults, processModel, configInterpretation, gapAnalysis } = buildMockInputs();
    const report = new ForensicReport(extractionResults, processModel, configInterpretation, gapAnalysis);
    const moduleReport = report.toModuleReport('CUSTOM');
    expect(moduleReport.module).toBe('CUSTOM');
    expect(moduleReport.extractors).toContain('CUSTOM_CODE');
  });

  it('should generate process map', () => {
    const { extractionResults, processModel, configInterpretation, gapAnalysis } = buildMockInputs();
    const report = new ForensicReport(extractionResults, processModel, configInterpretation, gapAnalysis);
    const processMap = report.toProcessMap();
    expect(processMap.totalProcesses).toBe(3);
  });

  it('should generate dependency graph from custom code', () => {
    const { extractionResults, processModel, configInterpretation, gapAnalysis } = buildMockInputs();
    const report = new ForensicReport(extractionResults, processModel, configInterpretation, gapAnalysis);
    const graph = report.toDependencyGraph();
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.edges[0].type).toBe('table_usage');
  });

  it('should return gap report directly', () => {
    const { extractionResults, processModel, configInterpretation, gapAnalysis } = buildMockInputs();
    const report = new ForensicReport(extractionResults, processModel, configInterpretation, gapAnalysis);
    const gaps = report.toGapReport();
    expect(gaps.extraction.coveragePct).toBe(50);
  });

  it('should handle empty/null inputs gracefully', () => {
    const report = new ForensicReport(null, null, null, null);
    const json = report.toJSON();
    expect(json.generatedAt).toBeDefined();
    expect(json.systemOverview.sid).toBeUndefined();
    const md = report.toMarkdown();
    expect(md).toContain('# SAP Forensic Extraction Report');
  });

  it('should handle Map-based extraction results', () => {
    const { processModel, configInterpretation, gapAnalysis } = buildMockInputs();
    const resultsMap = new Map();
    resultsMap.set('SYSTEM_INFO', { sid: 'DEV', release: '756' });
    const report = new ForensicReport(resultsMap, processModel, configInterpretation, gapAnalysis);
    const json = report.toJSON();
    expect(json.systemOverview.sid).toBe('DEV');
  });
});
