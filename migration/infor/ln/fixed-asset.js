/**
 * Infor LN Fixed Asset Migration Object
 *
 * Migrates LN Fixed Assets (tfasg100/tfasg110) to SAP Asset Accounting
 * (ANLA/ANLZ/ANLB).
 *
 * Key transforms:
 * - Asset number (asst) maps to ANLA-ANLN1
 * - Acquisition value (acqv) maps to ANLB-ANSWL
 * - Depreciation area mappings from LN to SAP
 *
 * ~16 field mappings. Mock: 10 fixed assets.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforLNFixedAssetMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_LN_FIXED_ASSET'; }
  get name() { return 'LN Fixed Asset to SAP Asset Accounting'; }

  getFieldMappings() {
    return [
      // ── Master data (ANLA) ────────────────────────────────────
      { source: 'asst', target: 'ANLA-ANLN1', convert: 'padLeft12' },
      { source: 'desc', target: 'ANLA-TXA50' },
      { source: 'acls', target: 'ANLA-ANLKL' },
      { source: 'fcmp', target: 'ANLA-BUKRS' },
      { source: 'acqd', target: 'ANLA-AKTIV', convert: 'toDate' },
      { source: 'sern', target: 'ANLA-SERNR' },
      { source: 'mfgr', target: 'ANLA-HERST' },

      // ── Time-dependent data (ANLZ) ────────────────────────────
      { source: 'cctr', target: 'ANLZ-KOSTL', convert: 'padLeft10' },
      { source: 'cwar', target: 'ANLZ-WERKS' },
      { source: 'locat', target: 'ANLZ-STORT' },

      // ── Depreciation data (ANLB) ──────────────────────────────
      { source: 'acqv', target: 'ANLB-ANSWL', convert: 'toDecimal' },
      { source: 'dpky', target: 'ANLB-AFASL' },
      { source: 'life', target: 'ANLB-NDJAR', convert: 'toInteger' },
      { source: 'accm', target: 'ANLB-NAFAL', convert: 'toDecimal' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_LN' },
      { target: 'MigrationObjectId', default: 'INFOR_LN_FIXED_ASSET' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['ANLA-ANLN1', 'ANLA-TXA50', 'ANLA-BUKRS', 'ANLB-ANSWL'],
      exactDuplicate: { keys: ['ANLA-ANLN1', 'ANLA-BUKRS'] },
    };
  }

  _extractMock() {
    const assets = [
      { asst: 'A-00001', desc: 'CNC Milling Machine', acls: '3100', acqv: '125000.00', dpky: '0010', life: '10', acqd: '20180301', sern: 'CNC-2018-001', mfgr: 'Haas' },
      { asst: 'A-00002', desc: 'Industrial Robot Arm', acls: '3100', acqv: '85000.00', dpky: '0010', life: '8', acqd: '20190615', sern: 'ROB-2019-002', mfgr: 'Fanuc' },
      { asst: 'A-00003', desc: 'Hydraulic Press 200T', acls: '3100', acqv: '200000.00', dpky: '0010', life: '15', acqd: '20170801', sern: 'HYD-2017-003', mfgr: 'Schuler' },
      { asst: 'A-00004', desc: 'Office Building Wing A', acls: '1100', acqv: '1500000.00', dpky: '0020', life: '40', acqd: '20100101', sern: '', mfgr: '' },
      { asst: 'A-00005', desc: 'Delivery Truck 5T', acls: '2200', acqv: '65000.00', dpky: '0030', life: '6', acqd: '20210301', sern: 'TRK-2021-005', mfgr: 'Volvo' },
      { asst: 'A-00006', desc: 'Forklift Electric 3T', acls: '2200', acqv: '42000.00', dpky: '0030', life: '8', acqd: '20200601', sern: 'FLT-2020-006', mfgr: 'Toyota' },
      { asst: 'A-00007', desc: 'Server Rack DC-01', acls: '4100', acqv: '35000.00', dpky: '0040', life: '5', acqd: '20220401', sern: 'SRV-2022-007', mfgr: 'Dell' },
      { asst: 'A-00008', desc: 'Welding Station Auto', acls: '3100', acqv: '55000.00', dpky: '0010', life: '10', acqd: '20200901', sern: 'WLD-2020-008', mfgr: 'Lincoln' },
      { asst: 'A-00009', desc: 'Paint Booth Industrial', acls: '3200', acqv: '180000.00', dpky: '0010', life: '12', acqd: '20190101', sern: 'PNT-2019-009', mfgr: 'Nordson' },
      { asst: 'A-00010', desc: 'Testing Chamber Thermal', acls: '3200', acqv: '95000.00', dpky: '0010', life: '10', acqd: '20210701', sern: 'TST-2021-010', mfgr: 'Espec' },
    ];

    const records = [];
    for (const a of assets) {
      const yearsUsed = Math.min(parseInt(a.life), Math.floor((2024 - parseInt(a.acqd.substring(0, 4))) * 1));
      const annualDep = parseFloat(a.acqv) / parseInt(a.life);
      records.push({
        asst: a.asst,
        desc: a.desc,
        acls: a.acls,
        fcmp: '100',
        acqd: a.acqd,
        sern: a.sern,
        mfgr: a.mfgr,
        cctr: 'CC05',
        cwar: '1000',
        locat: 'BLDG-A',
        acqv: a.acqv,
        dpky: a.dpky,
        life: a.life,
        accm: (annualDep * yearsUsed).toFixed(2),
      });
    }

    return records; // 10 fixed assets
  }
}

module.exports = InforLNFixedAssetMigrationObject;
