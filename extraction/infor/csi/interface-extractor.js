/**
 * Infor CSI Interfaces Extractor
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforCSIInterfaceExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_CSI_INTERFACES'; }
  get name() { return 'Infor CSI Interfaces'; }
  get module() { return 'CSI_INT'; }
  get category() { return 'interface'; }

  getExpectedTables() {
    return [
      { table: "IdoConnections", description: "IDO Connections", critical: true },
      { table: "BodInterfaces", description: "BOD Interfaces", critical: false },
    ];
  }

  async _extractLive() {
    throw new Error('Live extraction not implemented for INFOR_CSI_INTERFACES');
  }

  async _extractMock() {
    const mockData = require('../mock-data/csi/interfaces.json');
    this._trackCoverage("IdoConnections", "extracted", { rowCount: mockData.idoConnections.length });
    this._trackCoverage("BodInterfaces", "extracted", { rowCount: mockData.bodInterfaces.length });
    return mockData;
  }
}

InforCSIInterfaceExtractor._extractorId = 'INFOR_CSI_INTERFACES';
InforCSIInterfaceExtractor._module = 'CSI_INT';
InforCSIInterfaceExtractor._category = 'interface';
InforCSIInterfaceExtractor._sourceSystem = 'INFOR_CSI';
ExtractorRegistry.register(InforCSIInterfaceExtractor);

module.exports = InforCSIInterfaceExtractor;
