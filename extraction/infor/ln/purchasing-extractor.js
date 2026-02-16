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
 * Infor LN Purchasing Extractor
 *
 * Extracts purchasing data from Infor LN including PO headers (tdpur400),
 * PO lines (tdpur401), contracts, and requisitions.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNPurchasingExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_PURCHASING'; }
  get name() { return 'Infor LN Purchase Orders'; }
  get module() { return 'LN_MM'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: 'tdpur400', description: 'Purchase order headers', critical: true },
      { table: 'tdpur401', description: 'Purchase order lines', critical: true },
      { table: 'tdpur200', description: 'Purchase contracts', critical: false },
      { table: 'tdpur100', description: 'Purchase requisitions', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // tdpur400 - Purchase order headers
    try {
      const data = await this._readTable('tdpur400', {
        fields: ['t$ession', 't$bpid', 't$cpnb', 't$lgnb', 't$odat', 't$ddat', 't$ccur', 't$stat', 't$totl', 't$buyer'],
        maxRows: 100000,
      });
      result.purchaseOrders = data.rows;
    } catch (err) {
      this.logger.warn(`tdpur400 read failed: ${err.message}`);
      result.purchaseOrders = [];
    }

    // tdpur401 - Purchase order lines
    try {
      const data = await this._readTable('tdpur401', {
        fields: ['t$ession', 't$ponb', 'item', 't$qnty', 't$uprc', 't$amnt', 't$ddat', 't$stat'],
        maxRows: 500000,
      });
      result.purchaseOrderLines = data.rows;
    } catch (err) {
      this.logger.warn(`tdpur401 read failed: ${err.message}`);
      result.purchaseOrderLines = [];
    }

    // tdpur200 - Purchase contracts
    try {
      const data = await this._readTable('tdpur200', {
        fields: ['t$ctid', 't$bpid', 't$cpnb', 't$desc', 't$efdt', 't$exdt', 't$amnt', 't$ccur', 't$stat'],
        maxRows: 10000,
      });
      result.contracts = data.rows;
    } catch (err) {
      this._trackCoverage('tdpur200', 'skipped', { reason: err.message });
      result.contracts = [];
    }

    // tdpur100 - Purchase requisitions
    try {
      const data = await this._readTable('tdpur100', {
        fields: ['t$rqid', 't$cpnb', 't$rqdt', 'item', 't$qnty', 't$stat', 't$rqby', 't$poid'],
        maxRows: 50000,
      });
      result.requisitions = data.rows;
    } catch (err) {
      this._trackCoverage('tdpur100', 'skipped', { reason: err.message });
      result.requisitions = [];
    }

    // Compute summary
    result.summary = this._computeSummary(result);

    return result;
  }

  _computeSummary(result) {
    const orders = result.purchaseOrders || [];
    const open = orders.filter(o => o.t$stat === 'OPN').length;
    const confirmed = orders.filter(o => o.t$stat === 'CNF').length;
    const received = orders.filter(o => o.t$stat === 'RCV').length;

    return {
      totalPurchaseOrders: orders.length,
      totalLineItems: (result.purchaseOrderLines || []).length,
      totalContracts: (result.contracts || []).length,
      totalRequisitions: (result.requisitions || []).length,
      openOrders: open,
      confirmedOrders: confirmed,
      receivedOrders: received,
      extractedAt: new Date().toISOString(),
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/purchasing.json');
    this._trackCoverage('tdpur400', 'extracted', { rowCount: mockData.purchaseOrders.length });
    this._trackCoverage('tdpur401', 'extracted', { rowCount: mockData.purchaseOrderLines.length });
    this._trackCoverage('tdpur200', 'extracted', { rowCount: mockData.contracts.length });
    this._trackCoverage('tdpur100', 'extracted', { rowCount: mockData.requisitions.length });
    return mockData;
  }
}

InforLNPurchasingExtractor._extractorId = 'INFOR_LN_PURCHASING';
InforLNPurchasingExtractor._module = 'LN_MM';
InforLNPurchasingExtractor._category = 'transaction';
InforLNPurchasingExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNPurchasingExtractor);

module.exports = InforLNPurchasingExtractor;
