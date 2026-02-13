/**
 * Profitability Segment Migration Object
 *
 * Migrates Profitability Segments from ECC (CE1xxxx tables)
 * to S/4HANA CO-PA (Profitability Analysis) segments.
 *
 * COPA segments combine organizational, customer, product,
 * and sales characteristics with value fields for margin analysis.
 *
 * ~35 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class ProfitSegmentMigrationObject extends BaseMigrationObject {
  get objectId() { return 'PROFIT_SEGMENT'; }
  get name() { return 'Profitability Segment'; }

  getFieldMappings() {
    return [
      // ── Key fields ───────────────────────────────────────────
      { source: 'PESSION_AOBJNR', target: 'ProfitabilitySegmentNumber' },
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'KOKRS', target: 'ControllingArea' },

      // ── Customer characteristics ─────────────────────────────
      { source: 'KNDNR', target: 'Customer' },
      { source: 'KUNRE', target: 'BillToParty' },
      { source: 'KUNWE', target: 'ShipToParty' },
      { source: 'LAND1', target: 'CustomerCountry', convert: 'toUpperCase' },
      { source: 'KKBER', target: 'CreditControlArea' },
      { source: 'KDGRP', target: 'CustomerGroup' },
      { source: 'KVGR1', target: 'CustomerClassification1' },
      { source: 'BRSCH', target: 'IndustrySector' },

      // ── Product characteristics ──────────────────────────────
      { source: 'ARTNR', target: 'Material' },
      { source: 'MATKL', target: 'MaterialGroup' },
      { source: 'PRODH', target: 'ProductHierarchy' },
      { source: 'MVGR1', target: 'MaterialClassification1' },

      // ── Sales organization ───────────────────────────────────
      { source: 'VKORG', target: 'SalesOrganization' },
      { source: 'VTWEG', target: 'DistributionChannel' },
      { source: 'SPART', target: 'Division' },
      { source: 'BZESSION_IRK', target: 'SalesDistrict' },
      { source: 'VKESSION_BUR', target: 'SalesOffice' },
      { source: 'VKESSION_GRP', target: 'SalesGroup' },

      // ── Organizational assignment ────────────────────────────
      { source: 'WERKS', target: 'Plant' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'GSBER', target: 'BusinessArea' },

      // ── Period ───────────────────────────────────────────────
      { source: 'GJAHR', target: 'FiscalYear' },
      { source: 'PESSION_ERDE', target: 'Period' },

      // ── Value fields ─────────────────────────────────────────
      { source: 'VVession_301', target: 'RevenueAmount', convert: 'toDecimal' },
      { source: 'VVession_030', target: 'DiscountAmount', convert: 'toDecimal' },
      { source: 'VVession_003', target: 'COGSAmount', convert: 'toDecimal' },

      // ── Additional value fields ──────────────────────────────
      { source: 'VVession_040', target: 'FreightAmount', convert: 'toDecimal' },
      { source: 'VVession_050', target: 'CommissionAmount', convert: 'toDecimal' },
      { source: 'VVession_060', target: 'QuantitySold', convert: 'toDecimal' },

      // ── Currency ─────────────────────────────────────────────
      { source: 'WAESSION_RS', target: 'Currency' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'PROFIT_SEGMENT' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['ProfitabilitySegmentNumber', 'ControllingArea', 'FiscalYear'],
      exactDuplicate: { keys: ['ProfitabilitySegmentNumber'] },
    };
  }

  _extractMock() {
    const records = [];

    const salesOrgs = ['1000', '2000'];
    const channels = ['10', '20'];  // Direct, Wholesale
    const divisions = ['01', '02']; // Product A, Product B

    const customers = [
      { id: 'CUST001', name: 'Acme Corp', country: 'US', group: '01', classif: 'A', industry: 'MACH', district: 'EAST' },
      { id: 'CUST002', name: 'Beta Industries', country: 'US', group: '01', classif: 'A', industry: 'AUTO', district: 'WEST' },
      { id: 'CUST003', name: 'Central Supply', country: 'US', group: '02', classif: 'B', industry: 'RETL', district: 'CENT' },
      { id: 'CUST004', name: 'Delta Manufacturing', country: 'DE', group: '01', classif: 'A', industry: 'MACH', district: 'EMEA' },
      { id: 'CUST005', name: 'Epsilon GmbH', country: 'DE', group: '02', classif: 'B', industry: 'CHEM', district: 'EMEA' },
    ];

    const materials = [
      { id: 'MAT-1001', group: 'FG01', hierarchy: 'FG001001', classif: '01' },
      { id: 'MAT-1002', group: 'FG01', hierarchy: 'FG001002', classif: '01' },
      { id: 'MAT-2001', group: 'FG02', hierarchy: 'FG002001', classif: '02' },
      { id: 'MAT-2002', group: 'FG02', hierarchy: 'FG002002', classif: '02' },
      { id: 'MAT-3001', group: 'SV01', hierarchy: 'SV001001', classif: '03' },
      { id: 'MAT-3002', group: 'SV01', hierarchy: 'SV001002', classif: '03' },
    ];

    const plants = ['1000', '2000'];
    const profitCenters = ['PC0001', 'PC0002', 'PC0003', 'PC0004', 'PC0005'];
    const periods = ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012'];

    let segNum = 1;

    for (let i = 0; i < 30; i++) {
      const custIdx = i % customers.length;
      const matIdx = i % materials.length;
      const orgIdx = i % salesOrgs.length;
      const chanIdx = i % channels.length;
      const divIdx = i % divisions.length;
      const periodIdx = i % periods.length;

      const cust = customers[custIdx];
      const mat = materials[matIdx];

      // Realistic value amounts
      const baseRevenue = 10000 + (i * 2500);
      const discountRate = custIdx <= 1 ? 0.05 : 0.03; // A-class customers get higher discounts
      const cogsRate = mat.group.startsWith('SV') ? 0.40 : 0.65; // Services have lower COGS
      const freightRate = 0.02;
      const commissionRate = chanIdx === 1 ? 0.08 : 0.05; // Wholesale has higher commission
      const quantity = mat.group.startsWith('SV') ? (10 + i) : (50 + i * 5);

      const revenue = baseRevenue;
      const discount = revenue * discountRate;
      const cogs = revenue * cogsRate;
      const freight = revenue * freightRate;
      const commission = revenue * commissionRate;

      const segId = `PASEG${String(segNum).padStart(10, '0')}`;
      segNum++;

      records.push({
        PESSION_AOBJNR: segId,
        BUKRS: orgIdx === 0 ? '1000' : '2000',
        KOKRS: '1000',
        KNDNR: cust.id,
        KUNRE: cust.id,
        KUNWE: cust.id,
        LAND1: cust.country,
        KKBER: cust.country === 'US' ? '1000' : '2000',
        KDGRP: cust.group,
        KVGR1: cust.classif,
        BRSCH: cust.industry,
        ARTNR: mat.id,
        MATKL: mat.group,
        PRODH: mat.hierarchy,
        MVGR1: mat.classif,
        VKORG: salesOrgs[orgIdx],
        VTWEG: channels[chanIdx],
        SPART: divisions[divIdx],
        BZESSION_IRK: cust.district,
        VKESSION_BUR: `SO${String(orgIdx + 1).padStart(2, '0')}`,
        VKESSION_GRP: `SG${String((i % 3) + 1).padStart(2, '0')}`,
        WERKS: plants[orgIdx],
        PRCTR: profitCenters[custIdx],
        GSBER: 'BU01',
        GJAHR: '2024',
        PESSION_ERDE: periods[periodIdx],
        VVession_301: revenue.toFixed(2),
        VVession_030: discount.toFixed(2),
        VVession_003: cogs.toFixed(2),
        VVession_040: freight.toFixed(2),
        VVession_050: commission.toFixed(2),
        VVession_060: String(quantity),
        WAESSION_RS: cust.country === 'US' ? 'USD' : 'EUR',
      });
    }

    return records; // 30 profitability segments
  }
}

module.exports = ProfitSegmentMigrationObject;
