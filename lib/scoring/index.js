/**
 * Migration Complexity Scoring Module
 *
 * Exports the scoring engine, report generator, and weight configuration.
 */

const ComplexityScorer = require('./complexity-scorer');
const ScoringReport = require('./scoring-report');
const {
  COMPLEXITY_WEIGHTS,
  TIMELINE_RANGES,
  DIMENSION_THRESHOLDS,
} = require('./complexity-weights');

module.exports = {
  ComplexityScorer,
  ScoringReport,
  COMPLEXITY_WEIGHTS,
  TIMELINE_RANGES,
  DIMENSION_THRESHOLDS,
};
