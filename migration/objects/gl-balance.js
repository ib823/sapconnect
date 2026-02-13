/**
 * GL Balance Migration Object
 *
 * Migrates General Ledger balances from ECC (FAGLFLEXT)
 * to S/4HANA (ACDOCA-compatible structure).
 *
 * ~70 field mappings: 15 key fields + 48 period amounts
 * (HSL/TSL/KSL × 16 periods) + 3 totals + 4 reference fields.
 */

const BaseMigrationObject = require('./base-migration-object');

function periodMappings(sourcePrefix, targetPrefix, count) {
  const maps = [];
  for (let i = 1; i <= count; i++) {
    const padded = String(i).padStart(2, '0');
    maps.push({
      source: `${sourcePrefix}${padded}`,
      target: `${targetPrefix}${padded}`,
      convert: 'toDecimal',
    });
  }
  return maps;
}

class GLBalanceMigrationObject extends BaseMigrationObject {
  get objectId() { return 'GL_BALANCE'; }
  get name() { return 'GL Account Balance'; }

  getFieldMappings() {
    return [
      // ── Key fields (15) ─────────────────────────────────────
      { source: 'RLDNR', target: 'Ledger' },
      { source: 'RRCTY', target: 'RecordType' },
      { source: 'RVERS', target: 'Version' },
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'RYEAR', target: 'FiscalYear', convert: 'toInteger' },
      { source: 'RACCT', target: 'GLAccount', convert: 'padLeft10' },
      { source: 'RBUSA', target: 'BusinessArea' },
      { source: 'RCNTR', target: 'CostCenter', convert: 'padLeft10' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'RFAREA', target: 'FunctionalArea' },
      { source: 'SEGMENT', target: 'Segment' },
      { source: 'RTCUR', target: 'TransactionCurrency' },
      { source: 'RUNIT', target: 'BaseUnit' },
      { source: 'DRCRK', target: 'DebitCreditIndicator' },
      { source: 'RPMAX', target: 'MaxPeriod', convert: 'toInteger' },

      // ── House currency amounts (HSL01..HSL16) ──────────────
      ...periodMappings('HSL', 'AmtInCompCodeCrcy', 16),

      // ── Transaction currency amounts (TSL01..TSL16) ────────
      ...periodMappings('TSL', 'AmtInTransCrcy', 16),

      // ── Group currency amounts (KSL01..KSL16) ──────────────
      ...periodMappings('KSL', 'AmtInGlobalCrcy', 16),

      // ── Totals (3) ─────────────────────────────────────────
      { source: 'HSLVT', target: 'CarryForwardAmtCompCodeCrcy', convert: 'toDecimal' },
      { source: 'TSLVT', target: 'CarryForwardAmtTransCrcy', convert: 'toDecimal' },
      { source: 'KSLVT', target: 'CarryForwardAmtGlobalCrcy', convert: 'toDecimal' },

      // ── Reference fields (4) ───────────────────────────────
      { source: 'LOESSION_FLAG', target: 'IsDeleted', convert: 'boolYN' },
      { source: 'TIMESTAMP', target: 'LastChanged' },
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'GL_BALANCE' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['CompanyCode', 'FiscalYear', 'GLAccount', 'Ledger'],
      exactDuplicate: { keys: ['CompanyCode', 'FiscalYear', 'GLAccount', 'Ledger', 'CostCenter', 'ProfitCenter'] },
      range: [
        { field: 'FiscalYear', min: 1990, max: 2030 },
      ],
    };
  }

  _extractMock() {
    const companies = ['1000', '2000', '3000'];
    const accounts = [
      '0000100000', '0000110000', '0000200000', '0000400000', '0000410000',
      '0000470000', '0000480000', '0000600000', '0000700000', '0000800000',
    ];
    const records = [];

    for (const bukrs of companies) {
      for (const racct of accounts) {
        const rec = {
          RLDNR: '0L',
          RRCTY: '0',
          RVERS: '001',
          BUKRS: bukrs,
          RYEAR: 2024,
          RACCT: racct,
          RBUSA: bukrs === '1000' ? 'BU01' : 'BU02',
          RCNTR: `CC${bukrs.slice(-2)}01`,
          PRCTR: `PC${bukrs.slice(-2)}01`,
          RFAREA: 'FA01',
          SEGMENT: 'SEG1',
          RTCUR: 'USD',
          RUNIT: '',
          DRCRK: 'S',
          RPMAX: 16,
          HSLVT: (Math.random() * 100000).toFixed(2),
          TSLVT: (Math.random() * 100000).toFixed(2),
          KSLVT: (Math.random() * 100000).toFixed(2),
          LOESSION_FLAG: '',
          TIMESTAMP: '20240115120000',
        };

        // Period amounts
        for (let p = 1; p <= 16; p++) {
          const pp = String(p).padStart(2, '0');
          rec[`HSL${pp}`] = p <= 12 ? (Math.random() * 50000 - 25000).toFixed(2) : '0.00';
          rec[`TSL${pp}`] = p <= 12 ? (Math.random() * 50000 - 25000).toFixed(2) : '0.00';
          rec[`KSL${pp}`] = p <= 12 ? (Math.random() * 50000 - 25000).toFixed(2) : '0.00';
        }

        records.push(rec);
      }
    }

    return records;
  }
}

module.exports = GLBalanceMigrationObject;
