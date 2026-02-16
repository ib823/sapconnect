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
 * Complexity Weights Configuration
 *
 * Default weight configuration for migration complexity scoring dimensions.
 * Weights must sum to 1.0 across all dimensions.
 *
 * Each dimension scores a specific aspect of the SAP landscape that
 * contributes to overall migration complexity and timeline risk.
 */

const COMPLEXITY_WEIGHTS = {
  customization: { weight: 0.25, label: 'Customization Complexity' },
  interfaces: { weight: 0.15, label: 'Interface Complexity' },
  dataQuality: { weight: 0.25, label: 'Data Volume & Quality' },
  processVariants: { weight: 0.15, label: 'Process Variant Count' },
  sodViolations: { weight: 0.05, label: 'SOD Violations' },
  moduleComplexity: { weight: 0.10, label: 'Module Configuration Complexity' },
  batchJobs: { weight: 0.05, label: 'Batch Job Count' },
};

const TIMELINE_RANGES = {
  low: { min: 1, max: 3, months: '6-12', label: 'Low Complexity' },
  medium: { min: 4, max: 6, months: '12-24', label: 'Medium Complexity' },
  high: { min: 7, max: 8, months: '18-36', label: 'High Complexity' },
  veryHigh: { min: 9, max: 10, months: '24-48', label: 'Very High Complexity' },
};

/**
 * Thresholds for normalizing raw assessment values to a 1-10 scale.
 * Each dimension has breakpoints: [low, medium, high, veryHigh].
 * Values at or below 'low' score 1-3, at 'veryHigh' or above score 9-10.
 */
const DIMENSION_THRESHOLDS = {
  customization: { low: 50, medium: 200, high: 500, veryHigh: 1000 },
  interfaces: { low: 10, medium: 50, high: 150, veryHigh: 300 },
  dataQuality: { low: 0.9, medium: 0.7, high: 0.4, veryHigh: 0.2 },
  processVariants: { low: 20, medium: 100, high: 300, veryHigh: 500 },
  sodViolations: { low: 5, medium: 20, high: 50, veryHigh: 100 },
  moduleComplexity: { low: 3, medium: 8, high: 15, veryHigh: 25 },
  batchJobs: { low: 50, medium: 200, high: 500, veryHigh: 1000 },
};

module.exports = {
  COMPLEXITY_WEIGHTS,
  TIMELINE_RANGES,
  DIMENSION_THRESHOLDS,
};
