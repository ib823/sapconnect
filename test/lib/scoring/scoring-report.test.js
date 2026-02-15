const ComplexityScorer = require('../../../lib/scoring/complexity-scorer');
const ScoringReport = require('../../../lib/scoring/scoring-report');

describe('ScoringReport', () => {
  let scorer;
  let mediumData;
  let mediumResult;

  beforeEach(() => {
    scorer = new ComplexityScorer();
    mediumData = {
      customizationCount: 200,
      interfaceCount: 50,
      interfaceComplexity: 1,
      dataVolume: 5000000,
      dataQualityScore: 0.7,
      processVariantCount: 100,
      sodViolationCount: 20,
      moduleCount: 8,
      configComplexity: 1,
      batchJobCount: 200,
    };
    mediumResult = scorer.score(mediumData);
  });

  // ── generate() ─────────────────────────────────────────────────────

  describe('generate()', () => {
    it('throws on missing score result', () => {
      expect(() => ScoringReport.generate(null, {})).toThrow(/Valid score result/);
    });

    it('throws on invalid score result', () => {
      expect(() => ScoringReport.generate({}, {})).toThrow(/Valid score result/);
    });

    it('returns a ScoringReport instance', () => {
      const report = ScoringReport.generate(mediumResult, mediumData);
      expect(report).toBeInstanceOf(ScoringReport);
    });

    it('populates all report fields', () => {
      const report = ScoringReport.generate(mediumResult, mediumData, {
        projectName: 'ACME Migration',
        clientName: 'ACME Corp',
        assessmentDate: '2025-06-15',
      });

      expect(report.projectName).toBe('ACME Migration');
      expect(report.clientName).toBe('ACME Corp');
      expect(report.assessmentDate).toBe('2025-06-15');
      expect(report.overallScore).toBe(mediumResult.overallScore);
      expect(report.complexityLevel).toBeDefined();
      expect(report.estimatedTimeline).toBeDefined();
      expect(report.dimensionBreakdown).toBeInstanceOf(Array);
      expect(report.riskFactors).toBeInstanceOf(Array);
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(typeof report.executiveSummary).toBe('string');
    });

    it('uses defaults for missing options', () => {
      const report = ScoringReport.generate(mediumResult, mediumData);
      expect(report.projectName).toBe('SAP Migration Assessment');
      expect(report.clientName).toBe('Unknown Client');
      expect(report.assessmentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('dimension breakdown includes all seven dimensions', () => {
      const report = ScoringReport.generate(mediumResult, mediumData);
      expect(report.dimensionBreakdown).toHaveLength(7);

      for (const dim of report.dimensionBreakdown) {
        expect(dim).toHaveProperty('dimension');
        expect(dim).toHaveProperty('label');
        expect(dim).toHaveProperty('weight');
        expect(dim).toHaveProperty('rawScore');
        expect(dim).toHaveProperty('weightedScore');
      }
    });

    it('generates recommendations for high customization', () => {
      const highCustomData = { ...mediumData, customizationCount: 500 };
      const highResult = scorer.score(highCustomData);
      const report = ScoringReport.generate(highResult, highCustomData);

      const customRec = report.recommendations.find(r => r.title.includes('Custom Code'));
      expect(customRec).toBeDefined();
      expect(customRec.description).toContain('500');
    });

    it('always includes testing recommendation', () => {
      const report = ScoringReport.generate(mediumResult, mediumData);
      const testRec = report.recommendations.find(r => r.title.includes('Test'));
      expect(testRec).toBeDefined();
    });

    it('executive summary includes score and level', () => {
      const report = ScoringReport.generate(mediumResult, mediumData, {
        clientName: 'Contoso Ltd',
      });
      expect(report.executiveSummary).toContain('Contoso Ltd');
      expect(report.executiveSummary).toContain(String(mediumResult.overallScore));
    });
  });

  // ── toJSON() ───────────────────────────────────────────────────────

  describe('toJSON()', () => {
    it('returns a plain object with all fields', () => {
      const report = ScoringReport.generate(mediumResult, mediumData, {
        projectName: 'Test Project',
      });
      const json = report.toJSON();

      expect(json.projectName).toBe('Test Project');
      expect(json.overallScore).toBe(mediumResult.overallScore);
      expect(json.complexityLevel).toBeDefined();
      expect(json.estimatedTimeline).toBeDefined();
      expect(json.dimensionBreakdown).toBeInstanceOf(Array);
      expect(json.riskFactors).toBeInstanceOf(Array);
      expect(json.recommendations).toBeInstanceOf(Array);
      expect(typeof json.executiveSummary).toBe('string');
    });

    it('is JSON-serializable', () => {
      const report = ScoringReport.generate(mediumResult, mediumData);
      const json = report.toJSON();
      const serialized = JSON.stringify(json);
      const parsed = JSON.parse(serialized);

      expect(parsed.overallScore).toBe(json.overallScore);
      expect(parsed.dimensionBreakdown).toHaveLength(7);
    });
  });

  // ── toMarkdown() ──────────────────────────────────────────────────

  describe('toMarkdown()', () => {
    it('returns a string', () => {
      const report = ScoringReport.generate(mediumResult, mediumData);
      const md = report.toMarkdown();
      expect(typeof md).toBe('string');
    });

    it('contains report header', () => {
      const report = ScoringReport.generate(mediumResult, mediumData, {
        projectName: 'ACME Migration',
        clientName: 'ACME Corp',
      });
      const md = report.toMarkdown();
      expect(md).toContain('# Migration Complexity Report');
      expect(md).toContain('ACME Migration');
      expect(md).toContain('ACME Corp');
    });

    it('contains executive summary section', () => {
      const report = ScoringReport.generate(mediumResult, mediumData);
      const md = report.toMarkdown();
      expect(md).toContain('## Executive Summary');
    });

    it('contains overall score table', () => {
      const report = ScoringReport.generate(mediumResult, mediumData);
      const md = report.toMarkdown();
      expect(md).toContain('## Overall Score');
      expect(md).toContain('/10');
    });

    it('contains dimension breakdown table', () => {
      const report = ScoringReport.generate(mediumResult, mediumData);
      const md = report.toMarkdown();
      expect(md).toContain('## Dimension Breakdown');
      expect(md).toContain('Customization Complexity');
      expect(md).toContain('Interface Complexity');
      expect(md).toContain('Data Volume & Quality');
    });

    it('contains recommendations section', () => {
      const report = ScoringReport.generate(mediumResult, mediumData);
      const md = report.toMarkdown();
      expect(md).toContain('## Recommendations');
    });

    it('includes risk factors when present', () => {
      const highData = {
        customizationCount: 2000,
        interfaceCount: 500,
        interfaceComplexity: 3,
        dataQualityScore: 0.1,
        processVariantCount: 800,
        sodViolationCount: 200,
        moduleCount: 30,
        configComplexity: 2,
        batchJobCount: 2000,
      };
      const highResult = scorer.score(highData);
      const report = ScoringReport.generate(highResult, highData);
      const md = report.toMarkdown();

      expect(md).toContain('## Risk Factors');
      expect(md).toContain('**Risk:**');
      expect(md).toContain('**Recommendation:**');
    });
  });
});
