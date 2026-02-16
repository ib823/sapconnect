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
 * Gap Analyzer
 *
 * The system that tells you what it DOESN'T know — explicit, honest gap reporting.
 * Analyzes extraction results against the data dictionary to identify what's missing.
 */

const Logger = require('../../lib/logger');
const ConfidenceScorer = require('./confidence-scorer');

class GapAnalyzer {
  /**
   * @param {Map|object} extractionResults
   * @param {object} dataDictionary - Output from DataDictionaryExtractor
   * @param {import('../coverage-tracker')} coverageTracker
   */
  constructor(extractionResults, dataDictionary, coverageTracker) {
    this.results = extractionResults;
    this.dd = dataDictionary || {};
    this.coverage = coverageTracker;
    this.log = new Logger('gap-analyzer');
    this._gaps = null;
  }

  async analyze() {
    this._gaps = {
      extraction: this.getExtractionGaps(),
      authorization: this.getAuthorizationGaps(),
      systemType: this.getSystemTypeGaps(),
      dataVolume: this.getDataVolumeGaps(),
      process: this.getProcessGaps(),
      interface: this.getInterfaceGaps(),
      temporal: this.getTemporalGaps(),
      interpretation: this.getInterpretationGaps(),
    };
    return this._gaps;
  }

  getExtractionGaps() {
    const allKnownTables = new Set(Object.keys(this.dd.tables || {}));
    const extractedTables = new Set();
    const systemReport = this.coverage.getSystemReport();

    // Collect all tables that were tracked
    const allTracked = this.coverage.toJSON();
    for (const [, tables] of Object.entries(allTracked)) {
      for (const tableName of Object.keys(tables)) {
        extractedTables.add(tableName);
      }
    }

    // Key SAP tables that should have been read
    const criticalTables = [
      'T001', 'T003', 'T004', 'BKPF', 'SKA1', 'KNA1', 'LFA1', 'MARA',
      'EKKO', 'VBAK', 'USR02', 'AGR_DEFINE', 'RFCDES', 'E070', 'TADIR',
      'CDHDR', 'TBTCO', 'DD02L',
    ];

    const missingCritical = criticalTables.filter(t => !extractedTables.has(t));

    return {
      totalTablesInSystem: allKnownTables.size,
      totalTablesExtracted: extractedTables.size,
      coveragePct: systemReport.coverage,
      missingCriticalTables: missingCritical,
      unextractedTableCount: allKnownTables.size - extractedTables.size,
    };
  }

  getAuthorizationGaps() {
    const authErrors = this.coverage.getGaps()
      .filter(g => g.status === 'failed' && g.details?.error?.includes?.('auth'));
    return {
      count: authErrors.length,
      tables: authErrors.map(g => ({ table: g.table, extractor: g.extractorId, error: g.details.error })),
    };
  }

  getSystemTypeGaps() {
    const gaps = [];
    const results = this.results instanceof Map ? Object.fromEntries(this.results) : this.results;

    // Check if RFC was available
    const rfcSkipped = this.coverage.getGaps()
      .filter(g => g.status === 'skipped' && g.details?.reason?.includes?.('No RFC'));
    if (rfcSkipped.length > 0) {
      gaps.push({
        type: 'NO_RFC',
        description: 'RFC connectivity not available — table reads via RFC_READ_TABLE not possible',
        tablesAffected: rfcSkipped.length,
        recommendation: 'Install node-rfc with SAP NW RFC SDK for full table access',
      });
    }

    // Check for S/4HANA-specific tables
    const s4Tables = ['ACDOCA', 'FINSC_LEDGER', 'FAGL_SPLINFO'];
    for (const table of s4Tables) {
      const tracked = this.coverage.getGaps().find(g => g.table === table);
      if (tracked && tracked.status === 'failed') {
        gaps.push({
          type: 'S4_ONLY',
          description: `Table ${table} not found — may indicate ECC system (not S/4HANA)`,
          table,
        });
      }
    }

    return gaps;
  }

  getDataVolumeGaps() {
    const partialExtractions = this.coverage.getGaps()
      .filter(g => g.status === 'partial');
    return {
      count: partialExtractions.length,
      tables: partialExtractions.map(g => ({
        table: g.table,
        extractor: g.extractorId,
        rowsExtracted: g.details?.rowCount || 0,
        reason: g.details?.error || 'Partial extraction',
      })),
    };
  }

  getProcessGaps() {
    const gaps = [];
    const results = this.results instanceof Map ? Object.fromEntries(this.results) : this.results;

    // Check if change documents were available
    const changeDocs = results.CHANGE_DOCUMENTS;
    if (!changeDocs || !changeDocs.headers || changeDocs.headers.length === 0) {
      gaps.push('Change documents not available — process mining will be limited');
    }

    // Check if usage statistics were available
    const usage = results.USAGE_STATISTICS;
    if (!usage || !usage.transactionUsage || usage.transactionUsage.length === 0) {
      gaps.push('Usage statistics not available — cannot determine transaction frequency');
    }

    // Check for workflow data
    const workflows = results.WORKFLOWS;
    if (!workflows || !workflows.templates || workflows.templates.length === 0) {
      gaps.push('No workflow data — workflow-mediated processes not discovered');
    }

    return gaps;
  }

  getInterfaceGaps() {
    const gaps = [];
    const results = this.results instanceof Map ? Object.fromEntries(this.results) : this.results;
    const interfaces = results.INTERFACES;

    if (interfaces && interfaces.rfcDestinations) {
      const unreachable = interfaces.rfcDestinations
        .filter(d => d.RFCTYPE === '3')
        .map(d => (d.RFCDEST || '').trim());
      if (unreachable.length > 0) {
        gaps.push({
          type: 'OUTBOUND_UNKNOWN',
          description: 'Cannot verify status of remote RFC destinations',
          destinations: unreachable.slice(0, 20),
        });
      }
    }

    if (!interfaces) {
      gaps.push({
        type: 'NO_INTERFACE_DATA',
        description: 'Interface landscape not extracted — cannot analyze system connectivity',
      });
    }

    return gaps;
  }

  getTemporalGaps() {
    return {
      description: 'Historical data coverage depends on archiving and purging policies',
      archivedData: 'Cannot determine — check SAP archiving objects (SARA) manually',
      recommendation: 'Verify data retention periods with system administrators',
    };
  }

  getInterpretationGaps() {
    const gaps = [];
    const results = this.results instanceof Map ? Object.fromEntries(this.results) : this.results;

    // Check for extractors that returned data but lack interpretation rules
    const extractedModules = new Set();
    for (const [key, value] of Object.entries(results)) {
      if (value && !value.error) {
        const module = key.split('_')[0];
        extractedModules.add(module);
      }
    }

    const interpretedModules = new Set(['FI', 'CO', 'MM', 'SD', 'PP']);
    for (const mod of extractedModules) {
      if (!interpretedModules.has(mod) && mod !== 'SYSTEM' && mod !== 'DATA' && mod !== 'REPOSITORY') {
        gaps.push(`Module ${mod} was extracted but has no configuration interpretation rules`);
      }
    }

    return gaps;
  }

  getGapReport() {
    if (!this._gaps) {
      throw new Error('Call analyze() before getGapReport()');
    }

    return {
      generatedAt: new Date().toISOString(),
      ...this._gaps,
      totalGapCount: this._countGaps(),
    };
  }

  getConfidenceScore() {
    const scorer = new ConfidenceScorer();
    return scorer.calculate(
      this.coverage.getSystemReport(),
      this._gaps || {}
    );
  }

  getHumanValidationChecklist() {
    const checklist = [
      'Verify the number of active users matches business expectations',
      'Confirm all company codes in scope are accounted for',
      'Validate that all interfaces are documented and active',
      'Review custom code objects for business-critical processes',
      'Verify batch job schedules match operational requirements',
      'Confirm data archiving policies and historical data availability',
      'Validate authorization concept against compliance requirements',
    ];

    if (this._gaps?.authorization?.count > 0) {
      checklist.push('Request additional authorization for tables that returned auth errors');
    }
    if (this._gaps?.process?.length > 0) {
      checklist.push('Conduct process workshops to fill gaps in process documentation');
    }

    return checklist;
  }

  _countGaps() {
    if (!this._gaps) return 0;
    let count = 0;
    count += this._gaps.extraction?.missingCriticalTables?.length || 0;
    count += this._gaps.authorization?.count || 0;
    count += this._gaps.systemType?.length || 0;
    count += this._gaps.dataVolume?.count || 0;
    count += this._gaps.process?.length || 0;
    count += (Array.isArray(this._gaps.interface) ? this._gaps.interface.length : 0);
    count += this._gaps.interpretation?.length || 0;
    return count;
  }
}

module.exports = GapAnalyzer;
