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
const Scanner = require('./scanner');
const Analyzer = require('./analyzer');
const { getTransform, hasTransform } = require('./transforms');
const Logger = require('../lib/logger');

/**
 * Custom Code Remediator
 *
 * Runs Phase 1 assessment (scanner + analyzer), then for each finding
 * with a transform, applies it. Generates unified diff and tracks stats.
 */
class Remediator {
  constructor(gateway, options = {}) {
    this.gateway = gateway;
    this.verbose = options.verbose || false;
    this.dryRun = options.dryRun !== undefined ? options.dryRun : true;
    this.logger = new Logger('remediator', { level: options.logLevel || 'info' });
  }

  _log(msg) {
    this.logger.info(msg);
  }

  /**
   * Run full remediation pipeline
   * @returns {object} { remediations[], stats, scanResult, analysis }
   */
  async remediate() {
    // Step 1: Run assessment
    this._log('Running assessment scan...');
    const scanner = new Scanner(this.gateway, { verbose: this.verbose });
    const scanResult = await scanner.scan();

    this._log('Running compatibility analysis...');
    const analyzer = new Analyzer({ verbose: this.verbose });
    const analysis = analyzer.analyze(scanResult);

    // Step 2: Apply transforms to each finding
    this._log(`Processing ${analysis.findings.length} findings...`);
    const remediations = [];
    const stats = {
      totalFindings: analysis.findings.length,
      autoFixed: 0,
      manualReview: 0,
      noTransform: 0,
      errors: 0,
    };

    // Group findings by object for batch processing
    const findingsByObject = {};
    for (const finding of analysis.findings) {
      if (!findingsByObject[finding.object]) {
        findingsByObject[finding.object] = [];
      }
      findingsByObject[finding.object].push(finding);
    }

    for (const [objectName, findings] of Object.entries(findingsByObject)) {
      const sourceInfo = scanResult.sources[objectName];
      if (!sourceInfo) {
        this._log(`  Skipping ${objectName}: no source available`);
        for (const f of findings) {
          remediations.push({
            object: objectName,
            ruleId: f.ruleId,
            status: 'skipped',
            reason: 'No source code available',
          });
          stats.noTransform++;
        }
        continue;
      }

      let currentSource = sourceInfo.source;
      const originalSource = sourceInfo.source;

      for (const finding of findings) {
        const transform = getTransform(finding.ruleId);

        if (!transform) {
          this._log(`  ${objectName}/${finding.ruleId}: no auto-transform, manual review`);
          remediations.push({
            object: objectName,
            ruleId: finding.ruleId,
            title: finding.title,
            severity: finding.severity,
            status: 'manual-review',
            reason: 'No automated transform available',
            remediation: finding.remediation,
          });
          stats.manualReview++;
          continue;
        }

        try {
          this._log(`  ${objectName}/${finding.ruleId}: applying transform...`);
          const result = transform.apply(currentSource, finding);

          if (result.changes.length > 0) {
            currentSource = result.source;
            remediations.push({
              object: objectName,
              objectType: finding.objectType,
              ruleId: finding.ruleId,
              title: finding.title,
              severity: finding.severity,
              status: 'fixed',
              changes: result.changes,
              changeCount: result.changes.length,
            });
            stats.autoFixed++;
          } else {
            remediations.push({
              object: objectName,
              ruleId: finding.ruleId,
              title: finding.title,
              severity: finding.severity,
              status: 'manual-review',
              reason: 'Transform matched but no changes applied',
              remediation: finding.remediation,
            });
            stats.manualReview++;
          }
        } catch (err) {
          this._log(`  ${objectName}/${finding.ruleId}: error: ${err.message}`);
          remediations.push({
            object: objectName,
            ruleId: finding.ruleId,
            title: finding.title,
            severity: finding.severity,
            status: 'error',
            reason: err.message,
          });
          stats.errors++;
        }
      }

      // Generate diff
      if (currentSource !== originalSource) {
        const diff = this._generateDiff(objectName, originalSource, currentSource);
        const objRemediations = remediations.filter(
          (r) => r.object === objectName && r.status === 'fixed'
        );
        for (const r of objRemediations) {
          r.diff = diff;
        }

        // Write back if not dry run and in vsp mode
        if (!this.dryRun && this.gateway.mode === 'vsp') {
          this._log(`  Writing back ${objectName}...`);
          await this.gateway.writeAbapSource(
            objectName,
            currentSource,
            sourceInfo.type
          );
        }
      }
    }

    return { remediations, stats, scanResult, analysis };
  }

  /**
   * Generate a simple unified diff
   */
  _generateDiff(objectName, before, after) {
    const beforeLines = before.split('\n');
    const afterLines = after.split('\n');
    const diffLines = [`--- a/${objectName}`, `+++ b/${objectName}`];

    let i = 0;
    let j = 0;
    while (i < beforeLines.length || j < afterLines.length) {
      if (i < beforeLines.length && j < afterLines.length) {
        if (beforeLines[i] === afterLines[j]) {
          diffLines.push(` ${beforeLines[i]}`);
          i++;
          j++;
        } else {
          diffLines.push(`-${beforeLines[i]}`);
          diffLines.push(`+${afterLines[j]}`);
          i++;
          j++;
        }
      } else if (i < beforeLines.length) {
        diffLines.push(`-${beforeLines[i]}`);
        i++;
      } else {
        diffLines.push(`+${afterLines[j]}`);
        j++;
      }
    }

    return diffLines.join('\n');
  }
}

module.exports = Remediator;
