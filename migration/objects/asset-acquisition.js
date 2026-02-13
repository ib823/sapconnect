/**
 * Asset Acquisition Migration Object
 *
 * Migrates Asset Acquisition postings from ECC (ANLA/ANLC)
 * to S/4HANA Asset Acquisition via migration cockpit.
 *
 * Covers initial acquisition values, accumulated depreciation,
 * cost assignments, and asset classification.
 *
 * ~35 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class AssetAcquisitionMigrationObject extends BaseMigrationObject {
  get objectId() { return 'ASSET_ACQUISITION'; }
  get name() { return 'Asset Acquisition'; }

  getFieldMappings() {
    return [
      // ── Key fields ───────────────────────────────────────────
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'ANLN1', target: 'AssetMainNumber' },
      { source: 'ANLN2', target: 'AssetSubNumber' },
      { source: 'ANLKL', target: 'AssetClass' },

      // ── Dates ────────────────────────────────────────────────
      { source: 'AKTIV', target: 'CapitalizationDate', convert: 'toDate' },
      { source: 'DEESSION_AKT', target: 'DeactivationDate', convert: 'toDate' },
      { source: 'MESSION_HR', target: 'AssetValueDate', convert: 'toDate' },
      { source: 'AFESSION_ABE', target: 'OrdDepreciationStartDate', convert: 'toDate' },

      // ── Descriptions ─────────────────────────────────────────
      { source: 'TXA50', target: 'AssetDescription' },
      { source: 'TXT50', target: 'AdditionalDescription' },

      // ── Values ───────────────────────────────────────────────
      { source: 'ANSWL', target: 'AcquisitionValue', convert: 'toDecimal' },
      { source: 'KANSW', target: 'CumulativeAcqValue', convert: 'toDecimal' },
      { source: 'NAFAB', target: 'AccumDepreciation', convert: 'toDecimal' },
      { source: 'KNAFA', target: 'CumulativeDepreciation', convert: 'toDecimal' },
      { source: 'KAUFW', target: 'Revaluation', convert: 'toDecimal' },

      // ── Depreciation parameters ──────────────────────────────
      { source: 'NDJAR', target: 'PlannedUsefulLife', convert: 'toInteger' },
      { source: 'AFESSION_ATP', target: 'DepreciationKey' },

      // ── Cost assignment ──────────────────────────────────────
      { source: 'KOSTL', target: 'CostCenter', convert: 'padLeft10' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'GSBER', target: 'BusinessArea' },
      { source: 'SEGMENT', target: 'Segment' },

      // ── Currency ─────────────────────────────────────────────
      { source: 'WAESSION_RS', target: 'Currency' },

      // ── Asset structure ──────────────────────────────────────
      { source: 'ANLESSION_HT', target: 'AssetSuperNumber' },
      { source: 'INVNR', target: 'InventoryNumber' },
      { source: 'ZESSION_UGR', target: 'AssetGroup' },

      // ── Additional master attributes ─────────────────────────
      { source: 'WERKS', target: 'Plant' },
      { source: 'STORT', target: 'AssetLocation' },
      { source: 'LAND1', target: 'Country', convert: 'toUpperCase' },
      { source: 'SERNR', target: 'SerialNumber' },
      { source: 'MENGE', target: 'Quantity', convert: 'toDecimal' },
      { source: 'MEINS', target: 'BaseUnit' },

      // ── Audit fields ─────────────────────────────────────────
      { source: 'ERDAT', target: 'CreatedDate', convert: 'toDate' },
      { source: 'USNAM', target: 'CreatedBy' },
      { source: 'GJAHR', target: 'FiscalYear', convert: 'toInteger' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'ASSET_ACQUISITION' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['CompanyCode', 'AssetMainNumber', 'AssetClass', 'AcquisitionValue'],
      exactDuplicate: { keys: ['CompanyCode', 'AssetMainNumber', 'AssetSubNumber'] },
    };
  }

  _extractMock() {
    const records = [];

    // 5 asset classes with realistic properties
    const assetClasses = [
      { klasse: '1000', label: 'Buildings', depKey: 'LINA', life: 40, valueBase: 500000 },
      { klasse: '2000', label: 'Machinery', depKey: 'LINA', life: 10, valueBase: 80000 },
      { klasse: '3000', label: 'Vehicles', depKey: 'DGRS', life: 5, valueBase: 35000 },
      { klasse: '3100', label: 'IT Equipment', depKey: 'LINA', life: 3, valueBase: 5000 },
      { klasse: '4000', label: 'Furniture', depKey: 'LINA', life: 8, valueBase: 3000 },
    ];

    const descriptions = [
      // Buildings (6)
      'Main Office Building', 'Production Hall A', 'Warehouse North', 'R&D Laboratory', 'Parking Structure', 'Annex Building',
      // Machinery (6)
      'CNC Milling Machine', 'Hydraulic Press', 'Assembly Robot Arm', 'Conveyor Belt System', 'Industrial Oven', 'Packaging Line',
      // Vehicles (6)
      'Delivery Truck 18t', 'Company Sedan', 'Forklift Electric', 'Refrigerated Van', 'Service Vehicle', 'Electric Vehicle',
      // IT Equipment (6)
      'Server Rack DC-01', 'Network Switch Core', 'Laptop Fleet Batch', 'Storage Array NAS', 'UPS System Main', 'Firewall Appliance',
      // Furniture (6)
      'Executive Desk Set', 'Conference Table Lg', 'Ergonomic Chairs x20', 'Filing Cabinet Bank', 'Standing Desk Batch', 'Reception Counter',
    ];

    const plants = ['1000', '1000', '2000', '1000', '2000'];
    const costCenters = ['CC1001', 'CC1002', 'CC2001', 'CC1003', 'CC2002'];
    const profitCenters = ['PC0001', 'PC0002', 'PC0003', 'PC0004', 'PC0005'];

    for (let a = 1; a <= 30; a++) {
      const classIdx = (a - 1) % 5;
      const ac = assetClasses[classIdx];
      const descIdx = (a - 1) % descriptions.length;

      // Vary acquisition values within asset class
      const acqValue = ac.valueBase + (a * 1500);
      const yearsDepreciated = Math.min((a % ac.life) + 1, ac.life);
      const annualDep = acqValue / ac.life;
      const accumDep = annualDep * yearsDepreciated;
      const capYear = 2024 - yearsDepreciated;

      const companyCode = a <= 20 ? '1000' : '2000';
      const assetNum = String(a).padStart(8, '0');

      records.push({
        BUKRS: companyCode,
        ANLN1: assetNum,
        ANLN2: '0000',
        ANLKL: ac.klasse,
        AKTIV: `${capYear}0101`,
        DEESSION_AKT: '',
        MESSION_HR: `${capYear}0101`,
        AFESSION_ABE: `${capYear}0201`,
        TXA50: descriptions[descIdx],
        TXT50: `${descriptions[descIdx]} - ${ac.label}`,
        ANSWL: acqValue.toFixed(2),
        KANSW: acqValue.toFixed(2),
        NAFAB: accumDep.toFixed(2),
        KNAFA: accumDep.toFixed(2),
        KAUFW: '0.00',
        NDJAR: ac.life,
        AFESSION_ATP: ac.depKey,
        KOSTL: costCenters[classIdx],
        PRCTR: profitCenters[classIdx],
        GSBER: 'BU01',
        SEGMENT: `SEG${Math.ceil(a / 10)}`,
        WAESSION_RS: 'USD',
        ANLESSION_HT: '',
        INVNR: `INV-${assetNum}`,
        ZESSION_UGR: ac.label.toUpperCase().replace(/\s/g, '_').substring(0, 10),
        WERKS: plants[classIdx],
        STORT: `LOC${String((a % 5) + 1).padStart(2, '0')}`,
        LAND1: 'US',
        SERNR: a % 4 === 0 ? `SN-${assetNum}` : '',
        MENGE: ac.klasse === '3100' ? String(5 + (a % 15)) : '1',
        MEINS: 'EA',
        ERDAT: `${capYear}0101`,
        USNAM: 'MIGRATION',
        GJAHR: 2024,
      });
    }

    return records; // 30 asset acquisitions
  }
}

module.exports = AssetAcquisitionMigrationObject;
