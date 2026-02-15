const ComplexityScorer = require('../../../lib/scoring/complexity-scorer');
const { TIMELINE_RANGES } = require('../../../lib/scoring/complexity-weights');

describe('ComplexityScorer', () => {
  let scorer;

  beforeEach(() => {
    scorer = new ComplexityScorer();
  });

  // ── Constructor ────────────────────────────────────────────────────

  describe('constructor', () => {
    it('creates with default weights', () => {
      expect(scorer.weights.customization.weight).toBe(0.25);
      expect(scorer.weights.interfaces.weight).toBe(0.15);
      expect(scorer.weights.dataQuality.weight).toBe(0.25);
    });

    it('accepts weight overrides', () => {
      const custom = new ComplexityScorer({
        customization: { weight: 0.20 },
        dataQuality: { weight: 0.30 },
      });
      expect(custom.weights.customization.weight).toBe(0.20);
      expect(custom.weights.dataQuality.weight).toBe(0.30);
    });

    it('throws if weights do not sum to 1.0', () => {
      expect(() => new ComplexityScorer({
        customization: { weight: 0.50 },
      })).toThrow(/weights must sum to 1\.0/);
    });
  });

  // ── score() ────────────────────────────────────────────────────────

  describe('score()', () => {
    it('throws on missing assessment data', () => {
      expect(() => scorer.score(null)).toThrow(/Assessment data is required/);
      expect(() => scorer.score()).toThrow(/Assessment data is required/);
    });

    it('returns score structure with all fields', () => {
      const result = scorer.score({
        customizationCount: 100,
        interfaceCount: 20,
        interfaceComplexity: 1,
        dataVolume: 1000000,
        dataQualityScore: 0.8,
        processVariantCount: 50,
        sodViolationCount: 10,
        moduleCount: 5,
        configComplexity: 1,
        batchJobCount: 100,
      });

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('dimensions');
      expect(result).toHaveProperty('timeline');
      expect(result).toHaveProperty('riskFactors');
      expect(typeof result.overallScore).toBe('number');
      expect(result.overallScore).toBeGreaterThanOrEqual(1);
      expect(result.overallScore).toBeLessThanOrEqual(10);
    });

    it('scores low complexity system correctly', () => {
      const result = scorer.score({
        customizationCount: 10,
        interfaceCount: 5,
        interfaceComplexity: 1,
        dataVolume: 10000,
        dataQualityScore: 0.95,
        processVariantCount: 10,
        sodViolationCount: 2,
        moduleCount: 2,
        configComplexity: 1,
        batchJobCount: 20,
      });

      expect(result.overallScore).toBeLessThanOrEqual(3);
      expect(result.timeline.label).toBe('Low Complexity');
    });

    it('scores medium complexity system correctly', () => {
      const result = scorer.score({
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
      });

      expect(result.overallScore).toBeGreaterThanOrEqual(4);
      expect(result.overallScore).toBeLessThanOrEqual(6);
    });

    it('scores high complexity system correctly', () => {
      const result = scorer.score({
        customizationCount: 500,
        interfaceCount: 80,
        interfaceComplexity: 1.5,
        dataVolume: 50000000,
        dataQualityScore: 0.4,
        processVariantCount: 300,
        sodViolationCount: 50,
        moduleCount: 10,
        configComplexity: 1.5,
        batchJobCount: 500,
      });

      expect(result.overallScore).toBeGreaterThanOrEqual(7);
      expect(result.overallScore).toBeLessThanOrEqual(9);
    });

    it('scores very high complexity system correctly', () => {
      const result = scorer.score({
        customizationCount: 2000,
        interfaceCount: 500,
        interfaceComplexity: 3,
        dataVolume: 500000000,
        dataQualityScore: 0.1,
        processVariantCount: 800,
        sodViolationCount: 150,
        moduleCount: 20,
        configComplexity: 3,
        batchJobCount: 2000,
      });

      expect(result.overallScore).toBeGreaterThanOrEqual(9);
      expect(result.overallScore).toBeLessThanOrEqual(10);
    });

    it('handles zero/missing values gracefully', () => {
      const result = scorer.score({});
      expect(result.overallScore).toBeGreaterThanOrEqual(1);
      expect(result.overallScore).toBeLessThanOrEqual(10);
    });

    it('includes all seven dimensions in breakdown', () => {
      const result = scorer.score({
        customizationCount: 100,
        interfaceCount: 20,
        interfaceComplexity: 1,
        dataQualityScore: 0.8,
        processVariantCount: 50,
        sodViolationCount: 10,
        moduleCount: 5,
        configComplexity: 1,
        batchJobCount: 100,
      });

      expect(Object.keys(result.dimensions)).toHaveLength(7);
      expect(result.dimensions.customization).toBeDefined();
      expect(result.dimensions.interfaces).toBeDefined();
      expect(result.dimensions.dataQuality).toBeDefined();
      expect(result.dimensions.processVariants).toBeDefined();
      expect(result.dimensions.sodViolations).toBeDefined();
      expect(result.dimensions.moduleComplexity).toBeDefined();
      expect(result.dimensions.batchJobs).toBeDefined();
    });

    it('each dimension has label, weight, rawScore, weightedScore', () => {
      const result = scorer.score({ customizationCount: 100 });

      for (const dim of Object.values(result.dimensions)) {
        expect(dim).toHaveProperty('label');
        expect(dim).toHaveProperty('weight');
        expect(dim).toHaveProperty('rawScore');
        expect(dim).toHaveProperty('weightedScore');
        expect(typeof dim.rawScore).toBe('number');
        expect(dim.rawScore).toBeGreaterThanOrEqual(1);
        expect(dim.rawScore).toBeLessThanOrEqual(10);
      }
    });
  });

  // ── scoreDimension() ──────────────────────────────────────────────

  describe('scoreDimension()', () => {
    it('returns 1 for unknown dimension', () => {
      expect(scorer.scoreDimension('nonexistent', {})).toBe(1);
    });

    it('scores customization correctly', () => {
      expect(scorer.scoreDimension('customization', { customizationCount: 10 })).toBeLessThanOrEqual(3);
      expect(scorer.scoreDimension('customization', { customizationCount: 200 })).toBeGreaterThanOrEqual(4);
      expect(scorer.scoreDimension('customization', { customizationCount: 1500 })).toBeGreaterThanOrEqual(9);
    });

    it('scores interfaces using count * complexity', () => {
      // 10 interfaces * complexity 1 = 10 (low)
      expect(scorer.scoreDimension('interfaces', { interfaceCount: 10, interfaceComplexity: 1 })).toBeLessThanOrEqual(4);
      // 50 interfaces * complexity 3 = 150 (high)
      expect(scorer.scoreDimension('interfaces', { interfaceCount: 50, interfaceComplexity: 3 })).toBeGreaterThanOrEqual(6);
    });

    it('scores dataQuality inversely', () => {
      // Perfect quality = low complexity
      expect(scorer.scoreDimension('dataQuality', { dataQualityScore: 0.95 })).toBe(1);
      // Poor quality = high complexity
      expect(scorer.scoreDimension('dataQuality', { dataQualityScore: 0.1 })).toBeGreaterThanOrEqual(9);
    });

    it('scores batch jobs', () => {
      expect(scorer.scoreDimension('batchJobs', { batchJobCount: 10 })).toBeLessThanOrEqual(3);
      expect(scorer.scoreDimension('batchJobs', { batchJobCount: 1500 })).toBeGreaterThanOrEqual(9);
    });
  });

  // ── getTimeline() ─────────────────────────────────────────────────

  describe('getTimeline()', () => {
    it('maps low scores to 6-12 months', () => {
      const timeline = scorer.getTimeline(2);
      expect(timeline.months).toBe('6-12');
      expect(timeline.label).toBe('Low Complexity');
    });

    it('maps medium scores to 12-24 months', () => {
      const timeline = scorer.getTimeline(5);
      expect(timeline.months).toBe('12-24');
      expect(timeline.label).toBe('Medium Complexity');
    });

    it('maps high scores to 18-36 months', () => {
      const timeline = scorer.getTimeline(7.5);
      expect(timeline.months).toBe('18-36');
      expect(timeline.label).toBe('High Complexity');
    });

    it('maps very high scores to 24-48 months', () => {
      const timeline = scorer.getTimeline(9.5);
      expect(timeline.months).toBe('24-48');
      expect(timeline.label).toBe('Very High Complexity');
    });
  });

  // ── getRiskFactors() ──────────────────────────────────────────────

  describe('getRiskFactors()', () => {
    it('returns empty array for low-risk system', () => {
      const risks = scorer.getRiskFactors({
        customizationCount: 10,
        interfaceCount: 5,
        interfaceComplexity: 1,
        dataQualityScore: 0.95,
        processVariantCount: 10,
        sodViolationCount: 2,
        moduleCount: 2,
        configComplexity: 1,
        batchJobCount: 20,
      });
      expect(risks).toHaveLength(0);
    });

    it('identifies high customization risk', () => {
      const risks = scorer.getRiskFactors({
        customizationCount: 1500,
        interfaceCount: 5,
        interfaceComplexity: 1,
        dataQualityScore: 0.95,
        processVariantCount: 10,
        sodViolationCount: 2,
        moduleCount: 2,
        configComplexity: 1,
        batchJobCount: 20,
      });

      const customRisk = risks.find(r => r.dimension === 'customization');
      expect(customRisk).toBeDefined();
      expect(customRisk.label).toBe('High Customization');
    });

    it('identifies multiple risk factors and sorts by score', () => {
      const risks = scorer.getRiskFactors({
        customizationCount: 1500,
        interfaceCount: 500,
        interfaceComplexity: 2,
        dataQualityScore: 0.1,
        processVariantCount: 800,
        sodViolationCount: 150,
        moduleCount: 20,
        configComplexity: 3,
        batchJobCount: 2000,
      });

      expect(risks.length).toBeGreaterThan(1);
      // Sorted by score descending
      for (let i = 1; i < risks.length; i++) {
        expect(risks[i].score).toBeLessThanOrEqual(risks[i - 1].score);
      }
    });

    it('each risk has required fields', () => {
      const risks = scorer.getRiskFactors({
        customizationCount: 2000,
        interfaceCount: 500,
        interfaceComplexity: 3,
        dataQualityScore: 0.1,
        processVariantCount: 800,
        sodViolationCount: 200,
        moduleCount: 30,
        configComplexity: 2,
        batchJobCount: 2000,
      });

      for (const risk of risks) {
        expect(risk).toHaveProperty('dimension');
        expect(risk).toHaveProperty('label');
        expect(risk).toHaveProperty('score');
        expect(risk).toHaveProperty('risk');
        expect(risk).toHaveProperty('recommendation');
      }
    });
  });
});
