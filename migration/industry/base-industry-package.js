/**
 * Base Industry Package
 *
 * Abstract base class for industry-specific migration packages.
 * Each subclass provides compliance requirements, gap analysis,
 * vertical transforms, and recommendations for a specific industry.
 *
 * Compliance requirement shape:
 *   { id, name, description, regulation, sapSolution, priority }
 *
 * Gap shape:
 *   { id, name, description, inforCapability, sapGap, mitigation, effort }
 *
 * Transform shape:
 *   { id, name, sourceField, targetField, transformLogic, description }
 */

const Logger = require('../../lib/logger');

const log = new Logger('industry:base');

class BaseIndustryPackage {
  /**
   * Unique identifier for this industry package.
   * @returns {string}
   */
  get industryId() {
    throw new Error('Subclass must implement industryId getter');
  }

  /**
   * Display name for the industry.
   * @returns {string}
   */
  get name() {
    throw new Error('Subclass must implement name getter');
  }

  /**
   * Industry description.
   * @returns {string}
   */
  get description() {
    throw new Error('Subclass must implement description getter');
  }

  /**
   * Get compliance requirements for this industry.
   * @returns {Array<Object>} Array of compliance requirement objects
   */
  getComplianceRequirements() {
    return [];
  }

  /**
   * Get gap analysis identifying Infor capabilities that require
   * mitigation or custom development in SAP S/4HANA.
   * @returns {Array<Object>} Array of gap analysis objects
   */
  getGapAnalysis() {
    return [];
  }

  /**
   * Get vertical-specific field transforms for data migration.
   * @returns {Array<Object>} Array of transform objects
   */
  getVerticalTransforms() {
    return [];
  }

  /**
   * Get industry-specific migration recommendations.
   * @returns {Array<Object>} Array of recommendation objects
   */
  getRecommendations() {
    return [];
  }

  /**
   * Analyze extraction results for this industry context.
   *
   * @param {Object} [extractionResults] - Optional extraction data for analysis
   * @returns {Object} Industry analysis results
   */
  analyze(extractionResults) {
    log.info(`Analyzing for industry: ${this.industryId}`, {
      hasExtractionData: !!extractionResults,
    });

    return {
      industryId: this.industryId,
      name: this.name,
      compliance: this.getComplianceRequirements(),
      gaps: this.getGapAnalysis(),
      transforms: this.getVerticalTransforms(),
      recommendations: this.getRecommendations(),
    };
  }
}

module.exports = BaseIndustryPackage;
