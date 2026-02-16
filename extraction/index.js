/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
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
