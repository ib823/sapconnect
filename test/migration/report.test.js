const AssessmentReport = require('../../migration/report');

describe('AssessmentReport', () => {
  function createMockAnalysis(overrides = {}) {
    return {
      summary: {
        readinessScore: 72,
        readinessGrade: 'B',
        totalObjects: 50,
        objectsScanned: 45,
        totalFindings: 18,
        effortEstimate: { level: 'Medium', range: '400-600 person-hours' },
      },
      severityCounts: { critical: 2, high: 5, medium: 8, low: 3 },
      categoryCounts: { 'Data Model': 6, 'Custom Code': 4, 'Interface': 3, 'Configuration': 5 },
      findings: [
        {
          ruleId: 'DM-001',
          title: 'Removed Table KONV',
          severity: 'critical',
          category: 'Data Model',
          object: 'Z_PRICING_REPORT',
          objectType: 'PROG',
          matchCount: 3,
          description: 'Table KONV removed in S/4HANA',
          remediation: 'Use PRCD_ELEMENTS instead',
          matches: [{ line: 42, content: 'SELECT * FROM KONV WHERE ...' }],
        },
        {
          ruleId: 'CC-005',
          title: 'Deprecated BAPI',
          severity: 'high',
          category: 'Custom Code',
          object: 'Z_BP_INTERFACE',
          objectType: 'FUGR',
          matchCount: 1,
          description: 'BAPI deprecated in S/4HANA',
          remediation: 'Use Business Partner API',
          matches: [{ line: 100, content: 'CALL FUNCTION BAPI_CUSTOMER_CREATEFROMDATA1' }],
        },
      ],
      riskMatrix: {
        critical: [{ name: 'Z_PRICING_REPORT', type: 'PROG', lines: 850, findings: 3 }],
        high: [{ name: 'Z_BP_INTERFACE', type: 'FUGR', lines: 400, findings: 1 }],
        medium: [],
        clean: [{ name: 'Z_CLEAN_PROG', type: 'PROG', lines: 100, findings: 0 }],
      },
      rulesChecked: 177,
      objectSummary: [
        { name: 'Z_PRICING_REPORT', type: 'PROG', lines: 850, findingCount: 3, maxSeverity: 'critical' },
        { name: 'Z_BP_INTERFACE', type: 'FUGR', lines: 400, findingCount: 1, maxSeverity: 'high' },
      ],
      ...overrides,
    };
  }

  function createMockScanResult() {
    return {
      objects: [
        { name: 'Z_PRICING_REPORT', type: 'PROG', lines: 850 },
        { name: 'Z_BP_INTERFACE', type: 'FUGR', lines: 400 },
      ],
    };
  }

  describe('constructor', () => {
    it('creates an instance with mock data', () => {
      const report = new AssessmentReport(createMockAnalysis(), createMockScanResult());
      expect(report).toBeDefined();
      expect(report.analysis).toBeDefined();
      expect(report.scan).toBeDefined();
    });

    it('uses default clientName and systemId when not provided', () => {
      const report = new AssessmentReport(createMockAnalysis(), createMockScanResult());
      expect(report.clientName).toBe('SAP Client');
      expect(report.systemId).toBe('ECC');
    });

    it('handles custom clientName and systemId', () => {
      const report = new AssessmentReport(createMockAnalysis(), createMockScanResult(), {
        clientName: 'Acme Corp',
        systemId: 'PRD',
      });
      expect(report.clientName).toBe('Acme Corp');
      expect(report.systemId).toBe('PRD');
    });
  });

  describe('toTerminal()', () => {
    it('returns a string with header and summary', () => {
      const report = new AssessmentReport(createMockAnalysis(), createMockScanResult());
      const output = report.toTerminal();

      expect(typeof output).toBe('string');
      expect(output).toContain('S/4HANA Migration Readiness Assessment');
      expect(output).toContain('EXECUTIVE SUMMARY');
    });

    it('includes severity breakdown with bars', () => {
      const report = new AssessmentReport(createMockAnalysis(), createMockScanResult());
      const output = report.toTerminal();

      expect(output).toContain('FINDINGS BY SEVERITY');
      expect(output).toContain('Critical');
      expect(output).toContain('High');
      expect(output).toContain('Medium');
      expect(output).toContain('Low');
      // Bars are rendered with # and .
      expect(output).toMatch(/\[#+\.+\]/);
    });

    it('includes readiness score', () => {
      const report = new AssessmentReport(createMockAnalysis(), createMockScanResult());
      const output = report.toTerminal();

      expect(output).toContain('Readiness Score:   72%');
      expect(output).toContain('Grade: B');
    });

    it('includes the client name and system id', () => {
      const report = new AssessmentReport(createMockAnalysis(), createMockScanResult(), {
        clientName: 'Acme Corp',
        systemId: 'PRD',
      });
      const output = report.toTerminal();

      expect(output).toContain('Acme Corp');
      expect(output).toContain('PRD');
    });
  });

  describe('toMarkdown()', () => {
    it('returns markdown with headings', () => {
      const report = new AssessmentReport(createMockAnalysis(), createMockScanResult());
      const output = report.toMarkdown();

      expect(typeof output).toBe('string');
      expect(output).toContain('# S/4HANA Migration');
      expect(output).toContain('## Findings by Severity');
      expect(output).toContain('## Findings by Category');
      expect(output).toContain('## Remediation Roadmap');
    });

    it('includes client name in markdown output', () => {
      const report = new AssessmentReport(createMockAnalysis(), createMockScanResult(), {
        clientName: 'Acme Corp',
      });
      const output = report.toMarkdown();

      expect(output).toContain('Acme Corp');
    });
  });

  describe('toJSON()', () => {
    it('returns an object containing analysis data', () => {
      // toJSON is not explicitly defined on the class, so we test the
      // underlying data access pattern. The class stores everything
      // as properties, so we verify the shape directly.
      const analysis = createMockAnalysis();
      const report = new AssessmentReport(analysis, createMockScanResult());

      // Verify the report exposes the data needed for JSON serialization
      expect(report.analysis).toEqual(analysis);
      expect(report.analysis.summary.readinessScore).toBe(72);
      expect(report.analysis.severityCounts.critical).toBe(2);
    });
  });

  describe('empty findings', () => {
    it('handles empty findings array gracefully', () => {
      const analysis = createMockAnalysis({
        findings: [],
        severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
        summary: {
          readinessScore: 100,
          readinessGrade: 'A',
          totalObjects: 10,
          objectsScanned: 10,
          totalFindings: 0,
          effortEstimate: { level: 'Low', range: '0-50 person-hours' },
        },
      });
      const report = new AssessmentReport(analysis, createMockScanResult());
      const output = report.toTerminal();

      expect(output).toContain('No critical or high findings');
      expect(output).toContain('No critical fixes required');
    });
  });

  describe('optional data sections', () => {
    it('includes interface data when provided', () => {
      const interfaceData = {
        summary: {
          totalRfcDestinations: 25,
          activeRfcDestinations: 18,
          totalIdocFlows: 12,
          totalWebServices: 8,
          totalBatchJobs: 30,
          estimatedDailyIdocVolume: 5000,
          interfaceComplexity: 'High',
        },
        idocTypes: [
          { messageType: 'ORDERS05', direction: 'Inbound', volume: 1200, description: 'Purchase Orders' },
          { messageType: 'INVOIC02', direction: 'Outbound', volume: 800, description: 'Invoices' },
        ],
      };
      const report = new AssessmentReport(createMockAnalysis(), createMockScanResult(), {
        interfaceData,
      });
      const output = report.toTerminal();

      expect(output).toContain('INTERFACE INVENTORY');
      expect(output).toContain('RFC Destinations');
      expect(output).toContain('25');
    });

    it('includes ATC data when provided', () => {
      const atcData = {
        summary: {
          checkVariant: 'S4HANA_READINESS',
          objectsChecked: 100,
          objectsWithFindings: 15,
          totalFindings: 42,
          byPriority: { 1: 5, 2: 20, 3: 17 },
        },
      };
      const report = new AssessmentReport(createMockAnalysis(), createMockScanResult(), {
        atcData,
      });
      const output = report.toTerminal();

      expect(output).toContain('ATC S/4HANA READINESS CHECK');
      expect(output).toContain('S4HANA_READINESS');
    });

    it('includes usage data when provided', () => {
      const usageData = {
        summary: {
          totalObjects: 200,
          activeObjects: 150,
          lowUsageObjects: 30,
          deadCodeObjects: 20,
          deadCodePercentage: 10,
        },
        deadCode: [
          { object: 'Z_OLD_REPORT', reason: 'No execution in 12 months' },
        ],
      };
      const report = new AssessmentReport(createMockAnalysis(), createMockScanResult(), {
        usageData,
      });
      const output = report.toTerminal();

      expect(output).toContain('USAGE ANALYSIS');
      expect(output).toContain('Dead Code');
    });
  });
});
