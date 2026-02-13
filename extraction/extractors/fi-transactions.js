/**
 * FI Transaction Evidence Extractor
 *
 * Extracts Financial Accounting transaction data: document headers (BKPF),
 * line items (BSEG), customer open/cleared items (BSID/BSAD), vendor
 * open/cleared items (BSIK/BSAK), G/L open/cleared items (BSIS/BSAS),
 * and universal journal entries (ACDOCA).
 *
 * Uses streaming for large tables and supports configurable fiscal periods.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class FITransactionsExtractor extends BaseExtractor {
  get extractorId() { return 'FI_TRANSACTIONS'; }
  get name() { return 'FI Transaction Evidence'; }
  get module() { return 'FI'; }
  get category() { return 'transaction'; }

  getExpectedTables() {
    return [
      { table: 'BKPF', description: 'Accounting document headers', critical: true },
      { table: 'BSEG', description: 'Accounting document line items', critical: true },
      { table: 'BSID', description: 'Customer open items', critical: true },
      { table: 'BSAD', description: 'Customer cleared items', critical: false },
      { table: 'BSIK', description: 'Vendor open items', critical: true },
      { table: 'BSAK', description: 'Vendor cleared items', critical: false },
      { table: 'BSIS', description: 'G/L open items', critical: false },
      { table: 'BSAS', description: 'G/L cleared items', critical: false },
      { table: 'ACDOCA', description: 'Universal journal entries', critical: true },
    ];
  }

  /**
   * Build selection options for fiscal period filtering.
   * @returns {{ where: string }|{}} Selection clause or empty object
   */
  _getPeriodFilter() {
    const opts = this.context.system || {};
    const fiscalYear = opts.fiscalYear || new Date().getFullYear().toString();
    const periodFrom = opts.periodFrom || '001';
    const periodTo = opts.periodTo || '012';
    return {
      where: `GJAHR = '${fiscalYear}' AND MONAT >= '${periodFrom}' AND MONAT <= '${periodTo}'`,
    };
  }

  async _extractLive() {
    const result = {};
    const periodFilter = this._getPeriodFilter();

    // BKPF - Document Headers (streamed for large volumes)
    try {
      const rows = [];
      for await (const chunk of this._streamTable('BKPF', {
        fields: ['BUKRS', 'BELNR', 'GJAHR', 'BLART', 'BUDAT', 'BLDAT', 'MONAT', 'USNAM', 'BKTXT', 'WAERS', 'CPUDT'],
        ...periodFilter,
      })) {
        rows.push(...chunk.rows);
      }
      result.documentHeaders = rows;
    } catch (err) {
      this.logger.warn(`BKPF read failed: ${err.message}`);
      result.documentHeaders = [];
    }

    // BSEG - Line Items (streamed for large volumes)
    try {
      const rows = [];
      for await (const chunk of this._streamTable('BSEG', {
        fields: ['BUKRS', 'BELNR', 'GJAHR', 'BUZEI', 'BSCHL', 'KOART', 'HKONT', 'KUNNR', 'LIFNR', 'WRBTR', 'SHKZG', 'KOSTL'],
        ...periodFilter,
      })) {
        rows.push(...chunk.rows);
      }
      result.lineItems = rows;
    } catch (err) {
      this.logger.warn(`BSEG read failed: ${err.message}`);
      result.lineItems = [];
    }

    // BSID - Customer Open Items
    try {
      const data = await this._readTable('BSID', {
        fields: ['BUKRS', 'KUNNR', 'UMSKS', 'UMSKZ', 'AUGDT', 'AUGBL', 'ZUESSION', 'GJAHR', 'BELNR', 'BUZEI', 'BUDAT', 'BLDAT', 'BLART', 'WRBTR', 'SHKZG', 'WAESSION'],
      });
      result.customerItems = result.customerItems || {};
      result.customerItems.open = data.rows;
    } catch (err) {
      this.logger.warn(`BSID read failed: ${err.message}`);
      result.customerItems = result.customerItems || {};
      result.customerItems.open = [];
    }

    // BSAD - Customer Cleared Items
    try {
      const data = await this._readTable('BSAD', {
        fields: ['BUKRS', 'KUNNR', 'UMSKS', 'UMSKZ', 'AUGDT', 'AUGBL', 'ZUESSION', 'GJAHR', 'BELNR', 'BUZEI', 'BUDAT', 'BLDAT', 'BLART', 'WRBTR', 'SHKZG', 'WAESSION'],
      });
      result.customerItems = result.customerItems || {};
      result.customerItems.cleared = data.rows;
    } catch (err) {
      this.logger.warn(`BSAD read failed: ${err.message}`);
      result.customerItems = result.customerItems || {};
      result.customerItems.cleared = [];
    }

    // BSIK - Vendor Open Items
    try {
      const data = await this._readTable('BSIK', {
        fields: ['BUKRS', 'LIFNR', 'UMSKS', 'UMSKZ', 'AUGDT', 'AUGBL', 'ZUESSION', 'GJAHR', 'BELNR', 'BUZEI', 'BUDAT', 'BLDAT', 'BLART', 'WRBTR', 'SHKZG', 'WAESSION'],
      });
      result.vendorItems = result.vendorItems || {};
      result.vendorItems.open = data.rows;
    } catch (err) {
      this.logger.warn(`BSIK read failed: ${err.message}`);
      result.vendorItems = result.vendorItems || {};
      result.vendorItems.open = [];
    }

    // BSAK - Vendor Cleared Items
    try {
      const data = await this._readTable('BSAK', {
        fields: ['BUKRS', 'LIFNR', 'UMSKS', 'UMSKZ', 'AUGDT', 'AUGBL', 'ZUESSION', 'GJAHR', 'BELNR', 'BUZEI', 'BUDAT', 'BLDAT', 'BLART', 'WRBTR', 'SHKZG', 'WAESSION'],
      });
      result.vendorItems = result.vendorItems || {};
      result.vendorItems.cleared = data.rows;
    } catch (err) {
      this.logger.warn(`BSAK read failed: ${err.message}`);
      result.vendorItems = result.vendorItems || {};
      result.vendorItems.cleared = [];
    }

    // BSIS - G/L Open Items
    try {
      const data = await this._readTable('BSIS', {
        fields: ['BUKRS', 'HKONT', 'UMSKS', 'UMSKZ', 'GJAHR', 'BELNR', 'BUZEI', 'BUDAT', 'BLART', 'WRBTR', 'SHKZG'],
      });
      result.glItems = result.glItems || {};
      result.glItems.open = data.rows;
    } catch (err) {
      this.logger.warn(`BSIS read failed: ${err.message}`);
      result.glItems = result.glItems || {};
      result.glItems.open = [];
    }

    // BSAS - G/L Cleared Items
    try {
      const data = await this._readTable('BSAS', {
        fields: ['BUKRS', 'HKONT', 'UMSKS', 'UMSKZ', 'GJAHR', 'BELNR', 'BUZEI', 'BUDAT', 'BLART', 'WRBTR', 'SHKZG', 'AUGDT'],
      });
      result.glItems = result.glItems || {};
      result.glItems.cleared = data.rows;
    } catch (err) {
      this.logger.warn(`BSAS read failed: ${err.message}`);
      result.glItems = result.glItems || {};
      result.glItems.cleared = [];
    }

    // ACDOCA - Universal Journal (streamed for large volumes)
    try {
      const rows = [];
      for await (const chunk of this._streamTable('ACDOCA', {
        fields: ['RCLNT', 'RLDNR', 'RBUKRS', 'GJAHR', 'BELNR', 'DOCLN', 'RYESSION', 'POPER', 'RACCT', 'RHCUR', 'HSL', 'TSL', 'DRCRK'],
        ...periodFilter,
      })) {
        rows.push(...chunk.rows);
      }
      result.journalEntries = rows;
    } catch (err) {
      this.logger.warn(`ACDOCA read failed: ${err.message}`);
      result.journalEntries = [];
    }

    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/fi-transactions.json');
    this._trackCoverage('BKPF', 'extracted', { rowCount: mockData.documentHeaders.length });
    this._trackCoverage('BSEG', 'extracted', { rowCount: mockData.lineItems.length });
    this._trackCoverage('BSID', 'extracted', { rowCount: mockData.customerItems.open.length });
    this._trackCoverage('BSAD', 'extracted', { rowCount: mockData.customerItems.cleared.length });
    this._trackCoverage('BSIK', 'extracted', { rowCount: mockData.vendorItems.open.length });
    this._trackCoverage('BSAK', 'extracted', { rowCount: mockData.vendorItems.cleared.length });
    this._trackCoverage('BSIS', 'extracted', { rowCount: mockData.glItems.open.length });
    this._trackCoverage('BSAS', 'extracted', { rowCount: mockData.glItems.cleared.length });
    this._trackCoverage('ACDOCA', 'extracted', { rowCount: mockData.journalEntries.length });
    return mockData;
  }
}

FITransactionsExtractor._extractorId = 'FI_TRANSACTIONS';
FITransactionsExtractor._module = 'FI';
FITransactionsExtractor._category = 'transaction';
ExtractorRegistry.register(FITransactionsExtractor);

module.exports = FITransactionsExtractor;
