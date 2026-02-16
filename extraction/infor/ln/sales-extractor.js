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
 * Infor LN Sales Extractor
 *
 * Extracts sales data from Infor LN including sales order headers (tdsls400),
 * sales order lines (tdsls401), deliveries, and pricing conditions.
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNSalesExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_SALES'; }
  get name() { return 'Infor LN Sales Orders'; }
  get module() { return 'LN_SD'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: 'tdsls400', description: 'Sales order headers', critical: true },
      { table: 'tdsls401', description: 'Sales order lines', critical: true },
      { table: 'tdsls410', description: 'Deliveries', critical: false },
      { table: 'tdpcg030', description: 'Pricing conditions', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // tdsls400 - Sales order headers
    try {
      const data = await this._readTable('tdsls400', {
        fields: ['t$ession', 't$bpid', 't$cpnb', 't$lgnb', 't$odat', 't$ddat', 't$ccur', 't$stat', 't$slof', 't$totl'],
        maxRows: 100000,
      });
      result.salesOrders = data.rows;
    } catch (err) {
      this.logger.warn(`tdsls400 read failed: ${err.message}`);
      result.salesOrders = [];
    }

    // tdsls401 - Sales order lines
    try {
      const data = await this._readTable('tdsls401', {
        fields: ['t$ession', 't$ponb', 'item', 't$qnty', 't$uprc', 't$amnt', 't$ddat', 't$stat'],
        maxRows: 500000,
      });
      result.salesOrderLines = data.rows;
    } catch (err) {
      this.logger.warn(`tdsls401 read failed: ${err.message}`);
      result.salesOrderLines = [];
    }

    // tdsls410 - Deliveries
    try {
      const data = await this._readTable('tdsls410', {
        fields: ['t$dlnb', 't$ession', 't$bpid', 't$shdt', 't$whno', 't$stat', 't$carr', 't$trkn'],
        maxRows: 100000,
      });
      result.deliveries = data.rows;
    } catch (err) {
      this._trackCoverage('tdsls410', 'skipped', { reason: err.message });
      result.deliveries = [];
    }

    // tdpcg030 - Pricing conditions
    try {
      const data = await this._readTable('tdpcg030', {
        fields: ['t$prlt', 'item', 't$bpid', 't$uprc', 't$ccur', 't$efdt', 't$exdt', 't$disc'],
        maxRows: 100000,
      });
      result.pricingConditions = data.rows;
    } catch (err) {
      this._trackCoverage('tdpcg030', 'skipped', { reason: err.message });
      result.pricingConditions = [];
    }

    // Compute summary
    result.summary = this._computeSummary(result);

    return result;
  }

  _computeSummary(result) {
    const orders = result.salesOrders || [];
    const open = orders.filter(o => o.t$stat === 'OPN').length;
    const closed = orders.filter(o => o.t$stat === 'CLO').length;
    const delivered = orders.filter(o => o.t$stat === 'DLV').length;

    return {
      totalSalesOrders: orders.length,
      totalLineItems: (result.salesOrderLines || []).length,
      totalDeliveries: (result.deliveries || []).length,
      openOrders: open,
      closedOrders: closed,
      deliveredOrders: delivered,
      pricingConditions: (result.pricingConditions || []).length,
      extractedAt: new Date().toISOString(),
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/sales.json');
    this._trackCoverage('tdsls400', 'extracted', { rowCount: mockData.salesOrders.length });
    this._trackCoverage('tdsls401', 'extracted', { rowCount: mockData.salesOrderLines.length });
    this._trackCoverage('tdsls410', 'extracted', { rowCount: mockData.deliveries.length });
    this._trackCoverage('tdpcg030', 'extracted', { rowCount: mockData.pricingConditions.length });
    return mockData;
  }
}

InforLNSalesExtractor._extractorId = 'INFOR_LN_SALES';
InforLNSalesExtractor._module = 'LN_SD';
InforLNSalesExtractor._category = 'transaction';
InforLNSalesExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNSalesExtractor);

module.exports = InforLNSalesExtractor;
