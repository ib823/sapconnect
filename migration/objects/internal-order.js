/**
 * Internal Order Migration Object
 *
 * Migrates Internal Orders from ECC (AUFK)
 * to S/4HANA via API_INTERNALORDER_SRV.
 *
 * ~40 field mappings. Only open/active orders (not technically complete/closed).
 */

const BaseMigrationObject = require('./base-migration-object');

class InternalOrderMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INTERNAL_ORDER'; }
  get name() { return 'Internal Order'; }

  getFieldMappings() {
    return [
      { source: 'AUFNR', target: 'InternalOrder', convert: 'padLeft10' },
      { source: 'AUART', target: 'OrderType' },
      { source: 'AUTYP', target: 'OrderCategory' },
      { source: 'KTEXT', target: 'OrderDescription' },
      { source: 'LTEXT', target: 'LongDescription' },
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'GSBER', target: 'BusinessArea' },
      { source: 'KOKRS', target: 'ControllingArea' },
      { source: 'KOSTV', target: 'ResponsibleCostCenter', convert: 'padLeft10' },
      { source: 'PRCTR', target: 'ProfitCenter', convert: 'padLeft10' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'FUNC_AREA', target: 'FunctionalArea' },
      { source: 'SEGMENT', target: 'Segment' },
      { source: 'WAESSION_RS', target: 'Currency' },
      { source: 'ASESSION_TNR', target: 'RequestNumber' },
      { source: 'ERDAT', target: 'CreationDate', convert: 'toDate' },
      { source: 'ERNAM', target: 'CreatedByUser' },
      { source: 'AEDAT', target: 'ChangeDate', convert: 'toDate' },
      { source: 'AENAM', target: 'ChangedByUser' },
      { source: 'KSTAR', target: 'StatisticalCostElement', convert: 'padLeft10' },
      { source: 'PHAS0', target: 'IsCreated', convert: 'boolYN' },
      { source: 'PHAS1', target: 'IsReleased', convert: 'boolYN' },
      { source: 'PHAS2', target: 'IsTechnicallyComplete', convert: 'boolYN' },
      { source: 'PHAS3', target: 'IsClosed', convert: 'boolYN' },
      { source: 'LOESSION_KZ', target: 'IsDeleted', convert: 'boolYN' },
      { source: 'IESSION_DAT', target: 'PlannedStartDate', convert: 'toDate' },
      { source: 'IESSION_DATX', target: 'PlannedEndDate', convert: 'toDate' },
      { source: 'PDAT1', target: 'ActualStartDate', convert: 'toDate' },
      { source: 'PDAT2', target: 'ActualEndDate', convert: 'toDate' },
      { source: 'CYCLE', target: 'SettlementRule' },
      { source: 'OBJNR', target: 'ObjectNumber' },
      { source: 'AUFEX', target: 'ExternalOrderNumber' },
      { source: 'USER0', target: 'UserField1' },
      { source: 'USER1', target: 'UserField2' },
      { source: 'USER2', target: 'UserField3' },
      { source: 'TXJCD', target: 'TaxJurisdiction' },
      { source: 'SCOPE', target: 'OrderScope' },
      { source: 'ZESSION_SCHM', target: 'BudgetProfile' },
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'INTERNAL_ORDER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['InternalOrder', 'OrderType', 'CompanyCode', 'ControllingArea'],
      exactDuplicate: { keys: ['InternalOrder'] },
    };
  }

  _extractMock() {
    const records = [];
    const types = ['0100', '0200', '0300', '0400', '0500']; // Overhead, Investment, Accrual, Revenue, Marketing
    const descriptions = [
      'Office Renovation 2024', 'IT Infrastructure Upgrade', 'Marketing Campaign Q1',
      'Product Launch Event', 'Employee Training Program', 'Machine Maintenance',
      'Building Security System', 'ERP Migration Project', 'Customer Appreciation',
      'R&D Prototype Development', 'Fleet Vehicle Lease', 'Trade Show Booth',
      'Software License Renewal', 'Consulting Engagement', 'Safety Equipment',
      'Year-End Audit Support', 'New Hire Onboarding', 'Sustainability Initiative',
      'Patent Filing Expenses', 'Branch Office Setup',
    ];

    for (let i = 1; i <= 20; i++) {
      const released = i <= 15;
      records.push({
        AUFNR: String(800000 + i),
        AUART: types[(i - 1) % 5],
        AUTYP: '01',
        KTEXT: descriptions[i - 1],
        LTEXT: `${descriptions[i - 1]} - detailed description`,
        BUKRS: i <= 15 ? '1000' : '2000',
        GSBER: 'BU01',
        KOKRS: '1000',
        KOSTV: `CC${String(((i - 1) % 10) + 1).padStart(4, '0')}`,
        PRCTR: `PC${String(((i - 1) % 5) + 1).padStart(4, '0')}`,
        WERKS: i <= 10 ? '1000' : '2000',
        FUNC_AREA: `FA${String(((i - 1) % 4) + 1).padStart(2, '0')}`,
        SEGMENT: 'SEG1',
        WAESSION_RS: 'USD',
        ASESSION_TNR: '',
        ERDAT: '20240101',
        ERNAM: 'CONTROLLER',
        AEDAT: '20240115',
        AENAM: 'CONTROLLER',
        KSTAR: '',
        PHAS0: 'X',
        PHAS1: released ? 'X' : '',
        PHAS2: '',
        PHAS3: '',
        LOESSION_KZ: '',
        IESSION_DAT: `2024${String(1 + (i % 12)).padStart(2, '0')}01`,
        IESSION_DATX: `2024${String(Math.min(12, (i % 12) + 3)).padStart(2, '0')}28`,
        PDAT1: released ? `2024${String(1 + (i % 12)).padStart(2, '0')}05` : '',
        PDAT2: '',
        CYCLE: 'SETT01',
        OBJNR: `OR${String(800000 + i)}`,
        AUFEX: '',
        USER0: '',
        USER1: '',
        USER2: '',
        TXJCD: '',
        SCOPE: '',
        ZESSION_SCHM: '',
      });
    }

    return records;
  }
}

module.exports = InternalOrderMigrationObject;
