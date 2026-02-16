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
 * Lawson General Ledger Extractor
 *
 * Extracts Infor Lawson GL transaction data: GLDETAIL (journal entries)
 * and GLBALANCE (period balances). Journal entries contain flat accounting
 * strings that must be decomposed for SAP GL account mapping.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class LawsonGLExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LAWSON_GL'; }
  get name() { return 'Lawson General Ledger Transactions'; }
  get module() { return 'LAWSON_FI'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: 'GLDETAIL', description: 'GL journal entry detail', critical: true },
      { table: 'GLBALANCE', description: 'GL period balances', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    try {
      const journals = await this._readOData('lawson/v1', 'GLDETAIL');
      result.journalEntries = journals;
      this._trackCoverage('GLDETAIL', 'extracted', { rowCount: journals.length });
    } catch (err) {
      this.logger.warn(`GLDETAIL read failed: ${err.message}`);
      result.journalEntries = [];
      this._trackCoverage('GLDETAIL', 'failed', { error: err.message });
    }

    try {
      const balances = await this._readOData('lawson/v1', 'GLBALANCE');
      result.trialBalance = balances;
      this._trackCoverage('GLBALANCE', 'extracted', { rowCount: balances.length });
    } catch (err) {
      this.logger.warn(`GLBALANCE read failed: ${err.message}`);
      result.trialBalance = [];
      this._trackCoverage('GLBALANCE', 'failed', { error: err.message });
    }

    // Decompose accounting strings found in journal entries
    result.accountingStringAnalysis = this._analyzeJournalAcctStrings(result.journalEntries);

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/lawson/gl.json');
    this._trackCoverage('GLDETAIL', 'extracted', { rowCount: mockData.journalEntries.length });
    this._trackCoverage('GLBALANCE', 'extracted', { rowCount: (mockData.trialBalance || []).length });
    return mockData;
  }

  /**
   * Analyze accounting strings in journal entries to identify unique segment values
   * and detect potential decomposition issues.
   */
  _analyzeJournalAcctStrings(journals) {
    if (!journals || journals.length === 0) return null;

    const uniqueStrings = new Set();
    const companies = new Set();
    const acctUnits = new Set();
    const accounts = new Set();

    for (const je of journals) {
      const acctString = je.ACCT_STRING || je.DEBIT_ACCT_STRING;
      if (acctString) {
        uniqueStrings.add(acctString);
        const parts = acctString.split('-');
        if (parts[0]) companies.add(parts[0]);
        if (parts[1]) acctUnits.add(parts[1]);
        if (parts[2]) accounts.add(parts[2]);
      }
      const creditString = je.CREDIT_ACCT_STRING;
      if (creditString) {
        uniqueStrings.add(creditString);
        const parts = creditString.split('-');
        if (parts[0]) companies.add(parts[0]);
        if (parts[1]) acctUnits.add(parts[1]);
        if (parts[2]) accounts.add(parts[2]);
      }
    }

    return {
      totalUniqueStrings: uniqueStrings.size,
      uniqueCompanies: Array.from(companies),
      uniqueAcctUnits: Array.from(acctUnits),
      uniqueAccounts: Array.from(accounts),
    };
  }
}

LawsonGLExtractor._extractorId = 'INFOR_LAWSON_GL';
LawsonGLExtractor._module = 'LAWSON_FI';
LawsonGLExtractor._category = 'transaction';
LawsonGLExtractor._sourceSystem = 'INFOR_LAWSON';
ExtractorRegistry.register(LawsonGLExtractor);

module.exports = LawsonGLExtractor;
