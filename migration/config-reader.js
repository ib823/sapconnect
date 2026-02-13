const fs = require('fs');
const path = require('path');
const Logger = require('../lib/logger');

/**
 * Source ECC Configuration Reader
 *
 * Extracts org structure, GL accounts, tax codes, payment terms, etc.
 * Mock data provides a realistic ECC config snapshot.
 */
class ConfigReader {
  constructor(gateway, options = {}) {
    this.gateway = gateway;
    this.verbose = options.verbose || false;
    this.logger = new Logger('config-reader', { level: options.logLevel || 'info' });
  }

  _log(msg) {
    this.logger.info(msg);
  }

  /**
   * Read source ECC configuration
   * @returns {object} { orgStructure, glAccounts, taxCodes, paymentTerms, ... }
   */
  async read() {
    this._log('Reading source ECC configuration...');

    if (this.gateway.mode === 'mock') {
      return this._readMock();
    }

    return this._readLive();
  }

  _readMock() {
    this._log('Returning mock configuration snapshot...');

    return {
      orgStructure: {
        companyCode: [
          { code: '1000', name: 'Global HQ', country: 'US', currency: 'USD' },
          { code: '2000', name: 'Europe Operations', country: 'DE', currency: 'EUR' },
          { code: '3000', name: 'Asia Pacific', country: 'SG', currency: 'SGD' },
        ],
        plant: [
          { code: '1100', name: 'US Manufacturing', companyCode: '1000' },
          { code: '1200', name: 'US Distribution', companyCode: '1000' },
          { code: '2100', name: 'DE Manufacturing', companyCode: '2000' },
          { code: '3100', name: 'SG Operations', companyCode: '3000' },
        ],
        salesOrg: [
          { code: '1000', name: 'US Sales', companyCode: '1000', distributionChannel: '10', division: '00' },
          { code: '2000', name: 'EU Sales', companyCode: '2000', distributionChannel: '10', division: '00' },
        ],
        purchaseOrg: [
          { code: '1000', name: 'US Purchasing', companyCode: '1000' },
          { code: '2000', name: 'EU Purchasing', companyCode: '2000' },
        ],
        controllingArea: [
          { code: '1000', name: 'Global Controlling', companyCode: ['1000', '2000', '3000'] },
        ],
      },
      glAccounts: {
        chartOfAccounts: 'YCOA',
        totalAccounts: 842,
        ranges: [
          { from: '0010000000', to: '0019999999', type: 'Balance Sheet - Assets' },
          { from: '0020000000', to: '0029999999', type: 'Balance Sheet - Liabilities' },
          { from: '0030000000', to: '0039999999', type: 'Balance Sheet - Equity' },
          { from: '0040000000', to: '0049999999', type: 'P&L - Revenue' },
          { from: '0050000000', to: '0059999999', type: 'P&L - COGS' },
          { from: '0060000000', to: '0069999999', type: 'P&L - Expenses' },
          { from: '0080000000', to: '0089999999', type: 'Statistical' },
        ],
      },
      taxCodes: [
        { code: 'I0', description: 'Tax Exempt Input', rate: 0, type: 'input' },
        { code: 'I1', description: 'Standard Input Tax', rate: 19, type: 'input' },
        { code: 'I2', description: 'Reduced Input Tax', rate: 7, type: 'input' },
        { code: 'O0', description: 'Tax Exempt Output', rate: 0, type: 'output' },
        { code: 'O1', description: 'Standard Output Tax', rate: 19, type: 'output' },
        { code: 'O2', description: 'Reduced Output Tax', rate: 7, type: 'output' },
        { code: 'V0', description: 'US Sales Tax Exempt', rate: 0, type: 'output' },
        { code: 'V1', description: 'US Sales Tax', rate: 8.25, type: 'output' },
      ],
      paymentTerms: [
        { code: '0001', description: 'Due immediately', days: 0, discount1Days: 0, discount1Pct: 0 },
        { code: 'NT30', description: 'Net 30 days', days: 30, discount1Days: 0, discount1Pct: 0 },
        { code: 'NT60', description: 'Net 60 days', days: 60, discount1Days: 0, discount1Pct: 0 },
        { code: '2N10', description: '2% 10, Net 30', days: 30, discount1Days: 10, discount1Pct: 2 },
        { code: '3N15', description: '3% 15, Net 45', days: 45, discount1Days: 15, discount1Pct: 3 },
      ],
      currencies: ['USD', 'EUR', 'GBP', 'SGD', 'JPY', 'CHF', 'CNY'],
      numberRanges: [
        { object: 'FI Documents', from: '0100000000', to: '0199999999', current: '0142387651' },
        { object: 'Purchase Orders', from: '4500000000', to: '4599999999', current: '4502340125' },
        { object: 'Sales Orders', from: '0000000001', to: '0099999999', current: '0003100245' },
        { object: 'Material Numbers', from: '000000000000000001', to: '000000000099999999', current: '000000000000185042' },
      ],
      summary: {
        companyCodes: 3,
        plants: 4,
        salesOrgs: 2,
        purchaseOrgs: 2,
        glAccounts: 842,
        taxCodes: 8,
        paymentTerms: 5,
        currencies: 7,
      },
    };
  }

  async _readLive() {
    this._log('Live config reading not yet implemented, falling back to mock...');
    this.logger.warn('Live config requires SPRO/customizing table access.');
    this.logger.warn('Falling back to mock data.');
    return this._readMock();
  }
}

module.exports = ConfigReader;
