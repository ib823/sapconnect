/**
 * Extraction Framework — Module Exports
 */

const BaseExtractor = require('./base-extractor');
const ExtractorRegistry = require('./extractor-registry');
const CheckpointManager = require('./checkpoint-manager');
const CoverageTracker = require('./coverage-tracker');
const ExtractionContext = require('./extraction-context');

module.exports = {
  BaseExtractor,
  ExtractorRegistry,
  CheckpointManager,
  CoverageTracker,
  ExtractionContext,
};
