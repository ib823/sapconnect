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
const Logger = require('../lib/logger');

/**
 * Migration Test Script Generator
 *
 * Generates comparison tests (source vs target) and process tests
 * (create PO, create SO, post invoice, etc.)
 */
class TestGenerator {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.modules = options.modules || ['FI', 'MM', 'SD'];
    this.logger = new Logger('test-gen', { level: options.logLevel || 'info' });
  }

  _log(msg) {
    this.logger.info(msg);
  }

  /**
   * Generate test scripts
   * @returns {object} { comparisonTests[], processTests[], stats }
   */
  generate() {
    this._log('Generating test scripts...');

    const comparisonTests = this._generateComparisonTests();
    const processTests = this._generateProcessTests();

    return {
      comparisonTests,
      processTests,
      stats: {
        comparisonTests: comparisonTests.length,
        processTests: processTests.length,
        totalTests: comparisonTests.length + processTests.length,
        modules: this.modules,
      },
    };
  }

  _generateComparisonTests() {
    const tests = [];
    const definitions = {
      FI: [
        { id: 'CMP-FI-001', name: 'GL Balance Comparison', description: 'Compare GL account balances between source and target', sourceQuery: 'SELECT racct, rhcur, SUM(hsl) FROM acdoca GROUP BY racct, rhcur', targetQuery: 'API_JOURNALENTRYITEMBASIC_SRV with $apply=groupby(GLAccount,CompanyCodeCurrency,aggregate(AmountInCompanyCodeCurrency))', tolerance: 0.01, priority: 'critical' },
        { id: 'CMP-FI-002', name: 'Customer Open Items', description: 'Verify customer open item balances match', sourceQuery: 'SELECT kunnr, bukrs, SUM(dmbtr) FROM bsid GROUP BY kunnr, bukrs', targetQuery: 'API_JOURNALENTRYITEMBASIC_SRV filtered by AccountType=D, IsCleared=false', tolerance: 0.01, priority: 'critical' },
        { id: 'CMP-FI-003', name: 'Vendor Open Items', description: 'Verify vendor open item balances match', sourceQuery: 'SELECT lifnr, bukrs, SUM(dmbtr) FROM bsik GROUP BY lifnr, bukrs', targetQuery: 'API_JOURNALENTRYITEMBASIC_SRV filtered by AccountType=K, IsCleared=false', tolerance: 0.01, priority: 'critical' },
        { id: 'CMP-FI-004', name: 'Document Count', description: 'Compare total FI document counts by period', sourceQuery: 'SELECT gjahr, monat, COUNT(*) FROM bkpf GROUP BY gjahr, monat', targetQuery: 'Count ACDOCA entries grouped by fiscal year/period', tolerance: 0, priority: 'high' },
        { id: 'CMP-FI-005', name: 'Business Partner Count', description: 'Verify customer/vendor to BP conversion count', sourceQuery: 'SELECT COUNT(*) FROM kna1; SELECT COUNT(*) FROM lfa1', targetQuery: 'API_BUSINESS_PARTNER $count', tolerance: 0, priority: 'high' },
      ],
      MM: [
        { id: 'CMP-MM-001', name: 'Material Master Count', description: 'Verify material master record count', sourceQuery: 'SELECT COUNT(*) FROM mara', targetQuery: 'API_PRODUCT_SRV $count', tolerance: 0, priority: 'critical' },
        { id: 'CMP-MM-002', name: 'Open PO Count', description: 'Compare open purchase order counts', sourceQuery: 'SELECT COUNT(*) FROM ekko WHERE procstat <> 5', targetQuery: 'API_PURCHASEORDER_PROCESS_SRV filtered by Status ne Completed', tolerance: 0, priority: 'high' },
        { id: 'CMP-MM-003', name: 'Stock Levels', description: 'Compare current stock levels by material and plant', sourceQuery: 'SELECT matnr, werks, labst FROM mard', targetQuery: 'API_MATERIAL_STOCK_SRV', tolerance: 0, priority: 'critical' },
      ],
      SD: [
        { id: 'CMP-SD-001', name: 'Open Sales Orders', description: 'Verify open sales order count and values', sourceQuery: 'SELECT COUNT(*), SUM(netwr) FROM vbak WHERE gbstk <> C', targetQuery: 'API_SALES_ORDER_SRV filtered by OverallStatus ne Completed', tolerance: 0.01, priority: 'critical' },
        { id: 'CMP-SD-002', name: 'Customer Count', description: 'Verify customer master migration', sourceQuery: 'SELECT COUNT(*) FROM kna1', targetQuery: 'API_BUSINESS_PARTNER filtered by CustomerRole', tolerance: 0, priority: 'high' },
        { id: 'CMP-SD-003', name: 'Pricing Conditions', description: 'Verify pricing condition records', sourceQuery: 'SELECT kschl, COUNT(*) FROM konv GROUP BY kschl', targetQuery: 'Pricing condition API grouped by condition type', tolerance: 0, priority: 'medium' },
      ],
    };

    for (const mod of this.modules) {
      const modTests = definitions[mod.toUpperCase()];
      if (modTests) {
        tests.push(...modTests.map((t) => ({ ...t, module: mod.toUpperCase() })));
      }
    }

    return tests;
  }

  _generateProcessTests() {
    const tests = [];
    const definitions = {
      FI: [
        { id: 'PROC-FI-001', name: 'Post GL Journal Entry', description: 'Create and post a GL journal entry', steps: ['Create journal entry via API_JOURNALENTRYITEMBASIC_SRV', 'Verify document number assigned', 'Verify line items in ACDOCA', 'Verify balance updated'], expectedResult: 'Document posted with correct amounts', priority: 'critical' },
        { id: 'PROC-FI-002', name: 'Post Customer Invoice', description: 'Post an accounts receivable invoice', steps: ['Create AR invoice via API', 'Verify document posted', 'Verify customer open item created', 'Verify GL impact'], expectedResult: 'AR invoice posted, open item visible', priority: 'critical' },
        { id: 'PROC-FI-003', name: 'Customer Payment', description: 'Process incoming customer payment', steps: ['Post incoming payment', 'Verify clearing of open item', 'Verify bank GL impact'], expectedResult: 'Payment clears open item', priority: 'high' },
      ],
      MM: [
        { id: 'PROC-MM-001', name: 'Create Purchase Order', description: 'Create a standard purchase order', steps: ['Create PO via API_PURCHASEORDER_PROCESS_SRV', 'Verify PO number assigned', 'Verify PO items created', 'Verify vendor assigned'], expectedResult: 'PO created with correct items and pricing', priority: 'critical' },
        { id: 'PROC-MM-002', name: 'Goods Receipt', description: 'Post goods receipt for purchase order', steps: ['Post GR against PO', 'Verify material document created', 'Verify stock increased', 'Verify GR/IR account posted'], expectedResult: 'Stock updated, material doc created', priority: 'critical' },
        { id: 'PROC-MM-003', name: 'Invoice Receipt', description: 'Post invoice against purchase order', steps: ['Post invoice via API', 'Verify FI document created', 'Verify 3-way match', 'Verify vendor open item'], expectedResult: 'Invoice posted, vendor liability created', priority: 'high' },
      ],
      SD: [
        { id: 'PROC-SD-001', name: 'Create Sales Order', description: 'Create a standard sales order', steps: ['Create SO via API_SALES_ORDER_SRV', 'Verify SO number assigned', 'Verify pricing calculated', 'Verify availability check passed'], expectedResult: 'SO created with correct pricing', priority: 'critical' },
        { id: 'PROC-SD-002', name: 'Create Delivery', description: 'Create outbound delivery from sales order', steps: ['Create delivery from SO', 'Verify delivery number assigned', 'Verify items picked', 'Post goods issue'], expectedResult: 'Delivery created, stock reduced', priority: 'critical' },
        { id: 'PROC-SD-003', name: 'Create Billing Document', description: 'Create billing document from delivery', steps: ['Create billing doc from delivery', 'Verify billing number assigned', 'Verify FI document created', 'Verify customer receivable'], expectedResult: 'Invoice created, AR posted', priority: 'high' },
      ],
    };

    for (const mod of this.modules) {
      const modTests = definitions[mod.toUpperCase()];
      if (modTests) {
        tests.push(...modTests.map((t) => ({ ...t, module: mod.toUpperCase() })));
      }
    }

    return tests;
  }
}

module.exports = TestGenerator;
