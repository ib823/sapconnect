/**
 * Infor LN Business Partner Extractor
 *
 * Extracts business partner data from Infor LN including BPs (tccom100),
 * addresses (tccom110), contacts (tccom112), bank details (tccom120),
 * customer data (tccom130), and vendor data (tccom140).
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNBPExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_BP'; }
  get name() { return 'Infor LN Business Partners'; }
  get module() { return 'LN_BP'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: 'tccom100', description: 'Business partner general data', critical: true },
      { table: 'tccom110', description: 'Business partner addresses', critical: true },
      { table: 'tccom112', description: 'Business partner contacts', critical: false },
      { table: 'tccom120', description: 'Business partner bank details', critical: false },
      { table: 'tccom130', description: 'Customer data', critical: true },
      { table: 'tccom140', description: 'Vendor data', critical: true },
    ];
  }

  async _extractLive() {
    const result = {};

    // tccom100 - Business partner general data
    try {
      const data = await this._readTable('tccom100', {
        fields: ['t$bpid', 't$nama', 't$bpty', 't$ccur', 't$ccty', 't$stat', 't$lang'],
        maxRows: 50000,
      });
      result.businessPartners = data.rows;
    } catch (err) {
      this.logger.warn(`tccom100 read failed: ${err.message}`);
      result.businessPartners = [];
    }

    // tccom110 - Addresses
    try {
      const data = await this._readTable('tccom110', {
        fields: ['t$bpid', 't$tefn', 't$namc', 't$ln01', 't$ln02', 't$city', 't$cste', 't$pstc', 't$ccty'],
        maxRows: 100000,
      });
      result.addresses = data.rows;
    } catch (err) {
      this.logger.warn(`tccom110 read failed: ${err.message}`);
      result.addresses = [];
    }

    // tccom112 - Contacts
    try {
      const data = await this._readTable('tccom112', {
        fields: ['t$bpid', 't$ctnm', 't$func', 't$telp', 't$emal'],
        maxRows: 100000,
      });
      result.contacts = data.rows;
    } catch (err) {
      this._trackCoverage('tccom112', 'skipped', { reason: err.message });
      result.contacts = [];
    }

    // tccom120 - Bank details
    try {
      const data = await this._readTable('tccom120', {
        fields: ['t$bpid', 't$bkno', 't$bkac', 't$ccur', 't$ccty', 't$iban'],
        maxRows: 50000,
      });
      result.bankDetails = data.rows;
    } catch (err) {
      this._trackCoverage('tccom120', 'skipped', { reason: err.message });
      result.bankDetails = [];
    }

    // tccom130 - Customer data
    try {
      const data = await this._readTable('tccom130', {
        fields: ['t$bpid', 't$cpnb', 't$crli', 't$ptcd', 't$prlt', 't$slof'],
        maxRows: 50000,
      });
      result.customerData = data.rows;
    } catch (err) {
      this.logger.warn(`tccom130 read failed: ${err.message}`);
      result.customerData = [];
    }

    // tccom140 - Vendor data
    try {
      const data = await this._readTable('tccom140', {
        fields: ['t$bpid', 't$cpnb', 't$ptcd', 't$crli', 't$ordr', 't$eval'],
        maxRows: 50000,
      });
      result.vendorData = data.rows;
    } catch (err) {
      this.logger.warn(`tccom140 read failed: ${err.message}`);
      result.vendorData = [];
    }

    // Compute summary
    result.summary = this._computeSummary(result);

    return result;
  }

  _computeSummary(result) {
    const bps = result.businessPartners || [];
    const customers = bps.filter(b => b.t$bpty === 'C').length;
    const vendors = bps.filter(b => b.t$bpty === 'V').length;
    const both = bps.filter(b => b.t$bpty === 'B').length;
    const active = bps.filter(b => b.t$stat === 1).length;

    return {
      totalBusinessPartners: bps.length,
      customers: customers + both,
      vendors: vendors + both,
      bothRoles: both,
      activePartners: active,
      inactivePartners: bps.length - active,
      extractedAt: new Date().toISOString(),
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/business-partners.json');
    this._trackCoverage('tccom100', 'extracted', { rowCount: mockData.businessPartners.length });
    this._trackCoverage('tccom110', 'extracted', { rowCount: mockData.addresses.length });
    this._trackCoverage('tccom112', 'extracted', { rowCount: mockData.contacts.length });
    this._trackCoverage('tccom120', 'extracted', { rowCount: mockData.bankDetails.length });
    this._trackCoverage('tccom130', 'extracted', { rowCount: mockData.customerData.length });
    this._trackCoverage('tccom140', 'extracted', { rowCount: mockData.vendorData.length });
    return mockData;
  }
}

InforLNBPExtractor._extractorId = 'INFOR_LN_BP';
InforLNBPExtractor._module = 'LN_BP';
InforLNBPExtractor._category = 'master-data';
InforLNBPExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNBPExtractor);

module.exports = InforLNBPExtractor;
