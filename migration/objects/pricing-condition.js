/**
 * Pricing Condition Migration Object
 *
 * Migrates Pricing Conditions from ECC (KONP/KONH/A-tables)
 * to S/4HANA Condition Records (COND_A).
 *
 * ~35 field mappings: 12 header (KONH) + 15 item (KONP) + 5 org/material + 2 metadata.
 * Mock: 45 records across PR00 (price), K004 (discount), MWST (tax),
 * RB00 (freight), RA01 (rebate) condition types.
 */

const BaseMigrationObject = require('./base-migration-object');

class PricingConditionMigrationObject extends BaseMigrationObject {
  get objectId() { return 'PRICING_CONDITION'; }
  get name() { return 'Pricing Conditions'; }

  getFieldMappings() {
    return [
      // ── Condition header (KONH) — 12 ───────────────────────
      { source: 'KNUMH', target: 'ConditionRecordNumber' },
      { source: 'KOPOS', target: 'ConditionSequentialNumber' },
      { source: 'KSCHL', target: 'ConditionType' },
      { source: 'KAPPL', target: 'Application' },
      { source: 'KVEWE', target: 'ConditionUsage' },
      { source: 'DATAB', target: 'ValidFrom', convert: 'toDate' },
      { source: 'DATBI', target: 'ValidTo', convert: 'toDate' },
      { source: 'VAESSION_KEY', target: 'VariableKey' },
      { source: 'KFRST', target: 'ReleaseStatus' },
      { source: 'ERDAT', target: 'CreatedOn', convert: 'toDate' },
      { source: 'ERNAM', target: 'CreatedBy' },
      { source: 'KOSRT', target: 'ConditionDescription' },

      // ── Condition item (KONP) — 15 ─────────────────────────
      { source: 'KBETR', target: 'ConditionRate', convert: 'toDecimal' },
      { source: 'KONWA', target: 'ConditionCurrency' },
      { source: 'KPEIN', target: 'ConditionPricingUnit', convert: 'toInteger' },
      { source: 'KMEIN', target: 'ConditionUnitOfMeasure' },
      { source: 'MEINS', target: 'BaseUnitOfMeasure' },
      { source: 'KUMZA', target: 'NumeratorForConversion', convert: 'toInteger' },
      { source: 'KUMNE', target: 'DenominatorForConversion', convert: 'toInteger' },
      { source: 'MXWRT', target: 'MaximumConditionValue', convert: 'toDecimal' },
      { source: 'STFKZ', target: 'ScaleType' },
      { source: 'KRESSION_EL', target: 'ScaleBaseType' },
      { source: 'KZBZG', target: 'ScaleBasisIndicator' },
      { source: 'KRESSION_CH', target: 'CalculationType' },
      { source: 'BOESSION_IS', target: 'ConditionScaleBasis' },
      { source: 'KOESSION_IN', target: 'ConditionUnit' },
      { source: 'LOEVM_KO', target: 'ConditionIsDeleted', convert: 'boolYN' },

      // ── Org/material assignment — 5 ────────────────────────
      { source: 'MATNR', target: 'Material', convert: 'padLeft40' },
      { source: 'KUNNR', target: 'Customer' },
      { source: 'VKORG', target: 'SalesOrganization' },
      { source: 'VTWEG', target: 'DistributionChannel' },
      { source: 'SPART', target: 'Division' },

      // ── Purchasing assignment — 3 ──────────────────────────
      { source: 'LIFNR', target: 'Supplier' },
      { source: 'EKORG', target: 'PurchasingOrganization' },
      { source: 'ESOKZ', target: 'PurchasingDocCategory' },

      // ── Migration metadata ──────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'PRICING_CONDITION' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['ConditionRecordNumber', 'ConditionType', 'ValidFrom'],
      exactDuplicate: { keys: ['ConditionRecordNumber', 'ConditionSequentialNumber'] },
    };
  }

  _extractMock() {
    const records = [];

    // Condition type definitions
    const conditionTypes = [
      { type: 'PR00', desc: 'Gross Price', app: 'V', usage: 'A', calcType: 'C', rateRange: [50, 5000], currency: 'USD', isPercent: false },
      { type: 'K004', desc: 'Material Discount', app: 'V', usage: 'A', calcType: 'A', rateRange: [3, 25], currency: '%', isPercent: true },
      { type: 'MWST', desc: 'Output Tax', app: 'V', usage: 'A', calcType: 'A', rateRange: [5, 20], currency: '%', isPercent: true },
      { type: 'RB00', desc: 'Freight', app: 'V', usage: 'A', calcType: 'C', rateRange: [10, 500], currency: 'USD', isPercent: false },
      { type: 'RA01', desc: 'Rebate', app: 'V', usage: 'B', calcType: 'A', rateRange: [1, 10], currency: '%', isPercent: true },
    ];

    const salesOrgs = ['1000', '2000', '3000'];
    const distChannels = ['10', '20'];
    const divisions = ['00', '01', '02'];
    const customers = [];
    for (let c = 1; c <= 10; c++) {
      customers.push(String(100000 + c));
    }

    let recIdx = 0;

    // PR00 - 15 price records
    for (let i = 0; i < 15; i++) {
      recIdx++;
      const ct = conditionTypes[0];
      const rate = ct.rateRange[0] + Math.floor((ct.rateRange[1] - ct.rateRange[0]) * (i / 15));
      const salesOrg = salesOrgs[i % 3];
      const distCh = distChannels[i % 2];

      records.push(this._buildConditionRecord(recIdx, ct, {
        rate,
        salesOrg,
        distChannel: distCh,
        division: divisions[i % 3],
        material: `MAT${String(i + 1).padStart(5, '0')}`,
        customer: customers[i % 10],
        validFromYear: 2023,
      }));
    }

    // K004 - 10 discount records
    for (let i = 0; i < 10; i++) {
      recIdx++;
      const ct = conditionTypes[1];
      const rate = ct.rateRange[0] + Math.floor((ct.rateRange[1] - ct.rateRange[0]) * (i / 10));

      records.push(this._buildConditionRecord(recIdx, ct, {
        rate,
        salesOrg: salesOrgs[i % 3],
        distChannel: distChannels[i % 2],
        division: divisions[i % 3],
        material: `MAT${String(i + 1).padStart(5, '0')}`,
        customer: customers[i % 10],
        validFromYear: 2023,
      }));
    }

    // MWST - 9 tax records (3 per sales org, different tax rates)
    for (let i = 0; i < 9; i++) {
      recIdx++;
      const ct = conditionTypes[2];
      const taxRates = [7, 10, 19]; // Reduced, Standard low, Standard high
      const rate = taxRates[i % 3];

      records.push(this._buildConditionRecord(recIdx, ct, {
        rate,
        salesOrg: salesOrgs[i % 3],
        distChannel: distChannels[i % 2],
        division: '00',
        material: '',
        customer: '',
        validFromYear: 2020,
      }));
    }

    // RB00 - 6 freight records
    for (let i = 0; i < 6; i++) {
      recIdx++;
      const ct = conditionTypes[3];
      const rate = ct.rateRange[0] + Math.floor((ct.rateRange[1] - ct.rateRange[0]) * (i / 6));

      records.push(this._buildConditionRecord(recIdx, ct, {
        rate,
        salesOrg: salesOrgs[i % 3],
        distChannel: distChannels[i % 2],
        division: divisions[i % 3],
        material: '',
        customer: customers[i % 10],
        validFromYear: 2023,
      }));
    }

    // RA01 - 5 rebate records
    for (let i = 0; i < 5; i++) {
      recIdx++;
      const ct = conditionTypes[4];
      const rate = ct.rateRange[0] + Math.floor((ct.rateRange[1] - ct.rateRange[0]) * (i / 5));

      records.push(this._buildConditionRecord(recIdx, ct, {
        rate,
        salesOrg: salesOrgs[i % 3],
        distChannel: '10',
        division: '00',
        material: '',
        customer: customers[i % 10],
        validFromYear: 2024,
      }));
    }

    return records; // 15 + 10 + 9 + 6 + 5 = 45 records
  }

  /**
   * Build a single condition record from condition type config and parameters
   */
  _buildConditionRecord(idx, ct, params) {
    const knumh = String(idx).padStart(10, '0');
    const validFrom = `${params.validFromYear}0101`;
    const validTo = '99991231';

    return {
      KNUMH: knumh,
      KOPOS: '01',
      KSCHL: ct.type,
      KAPPL: ct.app,
      KVEWE: ct.usage,
      DATAB: validFrom,
      DATBI: validTo,
      VAESSION_KEY: '',
      KFRST: '',
      ERDAT: '20240101',
      ERNAM: 'MIGRATION',
      KOSRT: `${ct.desc} - ${params.material || params.customer || 'General'}`,
      KBETR: ct.isPercent ? `${params.rate}.000` : `${params.rate}.00`,
      KONWA: ct.isPercent ? '%' : 'USD',
      KPEIN: ct.isPercent ? '' : '1',
      KMEIN: ct.isPercent ? '' : 'EA',
      MEINS: 'EA',
      KUMZA: '1',
      KUMNE: '1',
      MXWRT: ct.type === 'K004' ? '10000.00' : ct.type === 'RA01' ? '50000.00' : '',
      STFKZ: ct.type === 'PR00' ? '' : 'A',
      KRESSION_EL: '',
      KZBZG: ct.isPercent ? 'B' : 'C',
      KRESSION_CH: ct.calcType,
      BOESSION_IS: '',
      KOESSION_IN: ct.isPercent ? '%' : 'USD',
      LOEVM_KO: '',
      MATNR: params.material || '',
      KUNNR: params.customer || '',
      VKORG: params.salesOrg,
      VTWEG: params.distChannel,
      SPART: params.division,
      LIFNR: '',
      EKORG: '',
      ESOKZ: '',
    };
  }
}

module.exports = PricingConditionMigrationObject;
