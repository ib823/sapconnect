/**
 * Infor CSI Customers Extractor
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforCSICustomerExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_CSI_CUSTOMERS'; }
  get name() { return 'Infor CSI Customers'; }
  get module() { return 'CSI_BP'; }
  get category() { return 'master-data'; }

  getExpectedTables() {
    return [
      { table: "customer", description: "Customer Master", critical: true },
      { table: "custaddr", description: "Customer Addresses", critical: false },
      { table: "custcontact", description: "Customer Contacts", critical: false },
    ];
  }

  async _extractLive() {
    throw new Error('Live extraction not implemented for INFOR_CSI_CUSTOMERS');
  }

  async _extractMock() {
    const mockData = require('../mock-data/csi/customers.json');
    this._trackCoverage("customer", "extracted", { rowCount: mockData.customers.length });
    this._trackCoverage("custaddr", "extracted", { rowCount: mockData.customerAddresses.length });
    this._trackCoverage("custcontact", "extracted", { rowCount: mockData.customerContacts.length });
    return mockData;
  }
}

InforCSICustomerExtractor._extractorId = 'INFOR_CSI_CUSTOMERS';
InforCSICustomerExtractor._module = 'CSI_BP';
InforCSICustomerExtractor._category = 'master-data';
InforCSICustomerExtractor._sourceSystem = 'INFOR_CSI';
ExtractorRegistry.register(InforCSICustomerExtractor);

module.exports = InforCSICustomerExtractor;
