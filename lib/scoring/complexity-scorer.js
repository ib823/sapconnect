/**
 * Migration Complexity Scoring Engine
 *
 * Calculates a composite complexity score (1-10) from SAP extraction
 * assessment data across seven weighted dimensions. The score drives
 * timeline estimates, risk identification, and migration planning.
 *
 * Formula: Score = sum(dimension_value x weight) for all dimensions,
 *          normalized to a 1-10 scale.
 */

const Logger = require('../logger');
const { SapConnectError } = require('../errors');
const {
  COMPLEXITY_WEIGHTS,
  TIMELINE_RANGES,
  DIMENSION_THRESHOLDS,
} = require('./complexity-weights');

const log = new Logger('scoring:complexity');

class ComplexityScorer {
  /**
   * @param {Object} [weightOverrides] - Optional overrides for default weights.
   *   Keys must match COMPLEXITY_WEIGHTS dimension names.
   */
  constructor(weightOverrides = {}) {
    this.weights = { ...COMPLEXITY_WEIGHTS };

    for (const [key, override] of Object.entries(weightOverrides)) {
      if (this.weights[key]) {
        this.weights[key] = { ...this.weights[key], ...override };
      }
    }

    this._validateWeights();
  }

  /**
   * Score a full assessment data set.
   *
   * @param {Object} assessmentData - Extraction results shaped as:
   *   { customizationCount, interfaceCount, interfaceComplexity,
   *     dataVolume, dataQualityScore, processVariantCount,
   *     sodViolationCount, moduleCount, configComplexity, batchJobCount }
   * @returns {Object} { overallScore, dimensions, timeline, riskFactors }
   */
  score(assessmentData) {
    if (!assessmentData || typeof assessmentData !== 'object') {
      throw new SapConnectError(
        'Assessment data is required for scoring',
        'ERR_SCORING_INPUT'
      );
    }

    log.debug('Scoring assessment data', { keys: Object.keys(assessmentData) });

    const dimensions = {};
    let weightedSum = 0;

    for (const [dimKey, dimConfig] of Object.entries(this.weights)) {
      const dimScore = this.scoreDimension(dimKey, assessmentData);
      dimensions[dimKey] = {
        label: dimConfig.label,
        weight: dimConfig.weight,
        rawScore: dimScore,
        weightedScore: dimScore * dimConfig.weight,
      };
      weightedSum += dimScore * dimConfig.weight;
    }

    // Clamp to 1-10
    const overallScore = Math.max(1, Math.min(10, Math.round(weightedSum * 10) / 10));

    const timeline = this.getTimeline(overallScore);
    const riskFactors = this.getRiskFactors(assessmentData);

    log.info('Complexity score calculated', { overallScore, level: timeline.label });

    return {
      overallScore,
      dimensions,
      timeline,
      riskFactors,
    };
  }

  /**
   * Score an individual dimension on a 1-10 scale.
   *
   * @param {string} dimension - Dimension key (e.g. 'customization')
   * @param {Object} data - Assessment data
   * @returns {number} Score from 1 to 10
   */
  scoreDimension(dimension, data) {
    const thresholds = DIMENSION_THRESHOLDS[dimension];
    if (!thresholds) {
      log.warn(`Unknown dimension: ${dimension}, defaulting to 1`);
      return 1;
    }

    const rawValue = this._extractDimensionValue(dimension, data);

    // dataQuality is inverted: higher quality = lower complexity
    if (dimension === 'dataQuality') {
      return this._normalizeInverted(rawValue, thresholds);
    }

    return this._normalize(rawValue, thresholds);
  }

  /**
   * Map a composite score to a timeline range.
   *
   * @param {number} score - Overall score (1-10)
   * @returns {Object} { min, max, months, label }
   */
  getTimeline(score) {
    for (const range of Object.values(TIMELINE_RANGES)) {
      if (score >= range.min && score <= range.max) {
        return { ...range };
      }
    }
    // Score above all ranges means very high
    return { ...TIMELINE_RANGES.veryHigh };
  }

  /**
   * Identify the top risk factors from assessment data.
   *
   * @param {Object} assessmentData
   * @returns {Array<Object>} Array of { dimension, label, score, risk, recommendation }
   */
  getRiskFactors(assessmentData) {
    const risks = [];

    const dimScores = {};
    for (const dimKey of Object.keys(this.weights)) {
      dimScores[dimKey] = this.scoreDimension(dimKey, assessmentData);
    }

    // High customization count
    if (dimScores.customization >= 7) {
      risks.push({
        dimension: 'customization',
        label: 'High Customization',
        score: dimScores.customization,
        risk: 'Large number of custom objects increases migration effort and risk of regression',
        recommendation: 'Conduct fit-to-standard workshops to identify custom code that can be replaced with standard S/4HANA functionality',
      });
    }

    // Interface complexity
    if (dimScores.interfaces >= 7) {
      risks.push({
        dimension: 'interfaces',
        label: 'Complex Interface Landscape',
        score: dimScores.interfaces,
        risk: 'High number of interfaces requires extensive integration testing and potential redesign',
        recommendation: 'Map all interfaces to SAP Integration Suite equivalents and plan phased migration',
      });
    }

    // Data quality issues
    if (dimScores.dataQuality >= 7) {
      risks.push({
        dimension: 'dataQuality',
        label: 'Data Quality Concerns',
        score: dimScores.dataQuality,
        risk: 'Poor data quality will cause migration failures and require extensive cleansing',
        recommendation: 'Implement data quality rules and cleansing procedures before migration cutover',
      });
    }

    // Process variant proliferation
    if (dimScores.processVariants >= 7) {
      risks.push({
        dimension: 'processVariants',
        label: 'Process Variant Proliferation',
        score: dimScores.processVariants,
        risk: 'Excessive process variants indicate process fragmentation that complicates testing',
        recommendation: 'Use process mining to identify variant consolidation opportunities before migration',
      });
    }

    // SOD violations
    if (dimScores.sodViolations >= 7) {
      risks.push({
        dimension: 'sodViolations',
        label: 'Segregation of Duties Violations',
        score: dimScores.sodViolations,
        risk: 'SOD violations must be resolved during migration to avoid audit findings',
        recommendation: 'Redesign role assignments using SAP IAG or GRC Access Control during migration',
      });
    }

    // Module complexity
    if (dimScores.moduleComplexity >= 7) {
      risks.push({
        dimension: 'moduleComplexity',
        label: 'Module Configuration Complexity',
        score: dimScores.moduleComplexity,
        risk: 'Complex multi-module configurations increase interdependency risk',
        recommendation: 'Plan phased go-live by module group with clear dependency mapping',
      });
    }

    // Batch job count
    if (dimScores.batchJobs >= 7) {
      risks.push({
        dimension: 'batchJobs',
        label: 'Heavy Batch Processing',
        score: dimScores.batchJobs,
        risk: 'Large number of batch jobs requires careful scheduling redesign in S/4HANA',
        recommendation: 'Analyze batch job dependencies and redesign using SAP Job Scheduling Service',
      });
    }

    // Sort by score descending
    risks.sort((a, b) => b.score - a.score);

    return risks;
  }

  // ── Private helpers ────────────────────────────────────────────────

  /**
   * Extract the raw value for a dimension from assessment data.
   */
  _extractDimensionValue(dimension, data) {
    switch (dimension) {
      case 'customization':
        return data.customizationCount || 0;
      case 'interfaces': {
        const count = data.interfaceCount || 0;
        const complexity = data.interfaceComplexity || 1;
        return count * complexity;
      }
      case 'dataQuality':
        return data.dataQualityScore !== null && data.dataQualityScore !== undefined ? data.dataQualityScore : 1.0;
      case 'processVariants':
        return data.processVariantCount || 0;
      case 'sodViolations':
        return data.sodViolationCount || 0;
      case 'moduleComplexity': {
        const modules = data.moduleCount || 0;
        const config = data.configComplexity || 1;
        return modules * config;
      }
      case 'batchJobs':
        return data.batchJobCount || 0;
      default:
        return 0;
    }
  }

  /**
   * Normalize a raw value to 1-10 using thresholds.
   * Higher raw value = higher score.
   */
  _normalize(value, thresholds) {
    if (value <= 0) return 1;
    if (value <= thresholds.low) {
      return Math.max(1, Math.round((value / thresholds.low) * 3));
    }
    if (value <= thresholds.medium) {
      const ratio = (value - thresholds.low) / (thresholds.medium - thresholds.low);
      return Math.round(3 + ratio * 3);
    }
    if (value <= thresholds.high) {
      const ratio = (value - thresholds.medium) / (thresholds.high - thresholds.medium);
      return Math.round(6 + ratio * 2);
    }
    if (value <= thresholds.veryHigh) {
      const ratio = (value - thresholds.high) / (thresholds.veryHigh - thresholds.high);
      return Math.round(8 + ratio * 2);
    }
    return 10;
  }

  /**
   * Normalize an inverted metric (higher raw value = lower score).
   * Used for dataQuality where 1.0 = perfect quality = low complexity.
   */
  _normalizeInverted(value, thresholds) {
    // thresholds for dataQuality: low=0.9, medium=0.7, high=0.4, veryHigh=0.2
    // value of 1.0 (perfect) → score 1
    // value of 0.0 (terrible) → score 10
    if (value >= thresholds.low) return 1;
    if (value >= thresholds.medium) {
      const ratio = (thresholds.low - value) / (thresholds.low - thresholds.medium);
      return Math.round(1 + ratio * 3);
    }
    if (value >= thresholds.high) {
      const ratio = (thresholds.medium - value) / (thresholds.medium - thresholds.high);
      return Math.round(4 + ratio * 3);
    }
    if (value >= thresholds.veryHigh) {
      const ratio = (thresholds.high - value) / (thresholds.high - thresholds.veryHigh);
      return Math.round(7 + ratio * 2);
    }
    return 10;
  }

  /**
   * Validate that weights sum to approximately 1.0.
   */
  _validateWeights() {
    const total = Object.values(this.weights).reduce(
      (sum, dim) => sum + dim.weight,
      0
    );
    if (Math.abs(total - 1.0) > 0.01) {
      throw new SapConnectError(
        `Complexity weights must sum to 1.0, got ${total.toFixed(4)}`,
        'ERR_SCORING_WEIGHTS'
      );
    }
  }
}

module.exports = ComplexityScorer;
