/**
 * Tests for Infor M3 Transformation Rule Sets
 */
const m3FiRules = require('../../../../migration/infor/rules/m3-fi-rules');
const m3MmRules = require('../../../../migration/infor/rules/m3-mm-rules');
const m3SdRules = require('../../../../migration/infor/rules/m3-sd-rules');
const m3PpRules = require('../../../../migration/infor/rules/m3-pp-rules');
const { FieldMappingEngine } = require('../../../../migration/field-mapping');

describe('M3 FI Rules', () => {
  it('should have correct identity', () => {
    expect(m3FiRules.ruleSetId).toBe('M3_FI_RULES');
    expect(m3FiRules.name).toBe('Infor M3 Financial Transformation Rules');
  });

  it('should have 15+ rules', () => {
    expect(m3FiRules.rules.length).toBeGreaterThanOrEqual(15);
  });

  it('should have required fields on every rule', () => {
    for (const rule of m3FiRules.rules) {
      expect(rule.target).toBeDefined();
      expect(rule.description).toBeDefined();
    }
  });

  it('should validate as a mapping set', () => {
    const engine = new FieldMappingEngine(m3FiRules.rules);
    const { valid, errors } = engine.validateMappings();
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  describe('GL account formatting', () => {
    it('should pad M3 8-digit account to 10 digits', () => {
      const rule = m3FiRules.rules.find(r => r.target === 'SAKNR');
      expect(rule.transform('50010000')).toBe('0050010000');
      expect(rule.transform('00140000')).toBe('0000140000');
      expect(rule.transform('0')).toBe('0000000000');
    });
  });

  describe('voucher type mapping', () => {
    it('should map M3 voucher series to SAP doc types', () => {
      const rule = m3FiRules.rules.find(r => r.target === 'BLART');
      expect(rule.valueMap['AA']).toBe('SA');
      expect(rule.valueMap['AP']).toBe('KR');
      expect(rule.valueMap['AR']).toBe('DR');
      expect(rule.valueMap['FA']).toBe('AA');
    });
  });

  describe('accounting period parsing', () => {
    it('should extract month from YYYYMM format', () => {
      const rule = m3FiRules.rules.find(r => r.target === 'MONAT');
      expect(rule.transform('202401')).toBe('01');
      expect(rule.transform('202312')).toBe('12');
    });

    it('should extract year from YYYYMM format', () => {
      const rule = m3FiRules.rules.find(r => r.target === 'GJAHR');
      expect(rule.transform('202401')).toBe(2024);
      expect(rule.transform('202312')).toBe(2023);
    });
  });

  describe('tax code mapping', () => {
    it('should map M3 tax codes to SAP', () => {
      const rule = m3FiRules.rules.find(r => r.target === 'MWSKZ');
      expect(rule.valueMap['TX00']).toBe('V0');
      expect(rule.valueMap['TX10']).toBe('A1');
      expect(rule.valueMap['TX20']).toBe('V1');
    });
  });

  describe('division to company code', () => {
    it('should pad to 4 digits', () => {
      const rule = m3FiRules.rules.find(r => r.target === 'BUKRS');
      expect(rule.transform('100')).toBe('0100');
      expect(rule.transform('1')).toBe('0001');
    });
  });

  describe('full record mapping', () => {
    it('should map a complete M3 FI record', () => {
      const engine = new FieldMappingEngine(m3FiRules.rules);
      const record = {
        AITM: '50010000',
        AIT2: 'COGS - Material',
        CUCD: 'usd',
        ACYP: '202401',
        VSER: 'AA',
        DBCR: '1',
        ACAM: 15000.00,
        DIVI: '100',
        ACDT: '20240115',
        VTCD: 'TX10',
        VTXT: 'Material cost posting',
      };
      const result = engine.applyRecord(record);
      expect(result.SAKNR).toBe('0050010000');
      expect(result.WAERS).toBe('USD');
      expect(result.MONAT).toBe('01');
      expect(result.GJAHR).toBe(2024);
      expect(result.BLART).toBe('SA');
      expect(result.SHKZG).toBe('S');
      expect(result.WRBTR).toBe(15000);
      expect(result.BUKRS).toBe('0100');
      expect(result.MWSKZ).toBe('A1');
      expect(result.SourceSystem).toBe('INFOR_M3');
    });
  });
});

describe('M3 MM Rules', () => {
  it('should have correct identity', () => {
    expect(m3MmRules.ruleSetId).toBe('M3_MM_RULES');
    expect(m3MmRules.name).toBe('Infor M3 Materials Management Transformation Rules');
  });

  it('should have 15+ rules', () => {
    expect(m3MmRules.rules.length).toBeGreaterThanOrEqual(15);
  });

  it('should have required fields on every rule', () => {
    for (const rule of m3MmRules.rules) {
      expect(rule.target).toBeDefined();
      expect(rule.description).toBeDefined();
    }
  });

  it('should validate as a mapping set', () => {
    const engine = new FieldMappingEngine(m3MmRules.rules);
    const { valid, errors } = engine.validateMappings();
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  describe('item type mapping', () => {
    it('should map M3 item types to SAP', () => {
      const rule = m3MmRules.rules.find(r => r.target === 'MTART');
      expect(rule.valueMap['PUR']).toBe('ROH');
      expect(rule.valueMap['MFG']).toBe('HALB');
      expect(rule.valueMap['FIN']).toBe('FERT');
      expect(rule.valueMap['SVC']).toBe('DIEN');
    });
  });

  describe('UoM conversion', () => {
    it('should map M3 UoMs to SAP', () => {
      const rule = m3MmRules.rules.find(r => r.target === 'MEINS');
      expect(rule.valueMap['KG']).toBe('KG');
      expect(rule.valueMap['PC']).toBe('ST');
      expect(rule.valueMap['LTR']).toBe('L');
      expect(rule.valueMap['MTR']).toBe('M');
      expect(rule.valueMap['HRS']).toBe('UR');
    });
  });

  describe('planning method mapping', () => {
    it('should map M3 planning codes to SAP MRP type', () => {
      const rule = m3MmRules.rules.find(r => r.target === 'DISMM');
      expect(rule.valueMap['001']).toBe('PD');
      expect(rule.valueMap['002']).toBe('VB');
      expect(rule.valueMap['004']).toBe('ND');
    });
  });

  describe('full record mapping', () => {
    it('should map a complete M3 MM record', () => {
      const engine = new FieldMappingEngine(m3MmRules.rules);
      const record = {
        ITNO: 'A001',
        ITDS: 'Raw Steel Sheet',
        ITTY: 'PUR',
        UNMS: 'KG',
        ITGR: 'raw01',
        GRWE: '1.00',
        STDC: '4.50',
        WHLO: 'W100',
        WHSL: 'A001',
        PLCD: '001',
        SSQT: '500',
        LEA1: '7',
        ORCO: 'us',
        ABCD: 'A',
      };
      const result = engine.applyRecord(record);
      expect(result.MATNR).toBe('A001');
      expect(result.MTART).toBe('ROH');
      expect(result.BESKZ).toBe('F');
      expect(result.MEINS).toBe('KG');
      expect(result.MATKL).toBe('RAW01');
      expect(result.DISMM).toBe('PD');
      expect(result.HERKL).toBe('US');
      expect(result.MAABC).toBe('A');
      expect(result.SourceSystem).toBe('INFOR_M3');
    });
  });
});

describe('M3 SD Rules', () => {
  it('should have correct identity', () => {
    expect(m3SdRules.ruleSetId).toBe('M3_SD_RULES');
    expect(m3SdRules.name).toBe('Infor M3 Sales & Distribution Transformation Rules');
  });

  it('should have 12+ rules', () => {
    expect(m3SdRules.rules.length).toBeGreaterThanOrEqual(12);
  });

  it('should have required fields on every rule', () => {
    for (const rule of m3SdRules.rules) {
      expect(rule.target).toBeDefined();
      expect(rule.description).toBeDefined();
    }
  });

  it('should validate as a mapping set', () => {
    const engine = new FieldMappingEngine(m3SdRules.rules);
    const { valid, errors } = engine.validateMappings();
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  describe('order type mapping', () => {
    it('should map M3 order types to SAP', () => {
      const rule = m3SdRules.rules.find(r => r.target === 'AUART');
      expect(rule.valueMap['CO1']).toBe('TA');
      expect(rule.valueMap['RET']).toBe('RE');
      expect(rule.valueMap['CRM']).toBe('CR');
      expect(rule.valueMap['QUO']).toBe('QT');
    });
  });

  describe('customer number formatting', () => {
    it('should pad to 10 digits', () => {
      const rule = m3SdRules.rules.find(r => r.target === 'KUNNR');
      expect(rule.transform('12345')).toBe('0000012345');
      expect(rule.transform('1')).toBe('0000000001');
    });
  });

  describe('delivery terms mapping', () => {
    it('should map M3 incoterms', () => {
      const rule = m3SdRules.rules.find(r => r.target === 'INCO1');
      expect(rule.valueMap['FOB']).toBe('FOB');
      expect(rule.valueMap['CIF']).toBe('CIF');
      expect(rule.valueMap['EXW']).toBe('EXW');
      expect(rule.valueMap['DDP']).toBe('DDP');
    });
  });

  describe('payment terms mapping', () => {
    it('should map M3 terms to SAP terms', () => {
      const rule = m3SdRules.rules.find(r => r.target === 'ZTERM');
      expect(rule.valueMap['N30']).toBe('ZN30');
      expect(rule.valueMap['N60']).toBe('ZN60');
      expect(rule.valueMap['COD']).toBe('ZC00');
    });
  });
});

describe('M3 PP Rules', () => {
  it('should have correct identity', () => {
    expect(m3PpRules.ruleSetId).toBe('M3_PP_RULES');
    expect(m3PpRules.name).toBe('Infor M3 Production Planning Transformation Rules');
  });

  it('should have 12+ rules', () => {
    expect(m3PpRules.rules.length).toBeGreaterThanOrEqual(12);
  });

  it('should have required fields on every rule', () => {
    for (const rule of m3PpRules.rules) {
      expect(rule.target).toBeDefined();
      expect(rule.description).toBeDefined();
    }
  });

  it('should validate as a mapping set', () => {
    const engine = new FieldMappingEngine(m3PpRules.rules);
    const { valid, errors } = engine.validateMappings();
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  describe('product structure type mapping', () => {
    it('should map M3 BOM types to SAP', () => {
      const rule = m3PpRules.rules.find(r => r.target === 'STLAN');
      expect(rule.valueMap['MFG']).toBe('1');
      expect(rule.valueMap['ENG']).toBe('2');
      expect(rule.valueMap['PMS']).toBe('5');
    });
  });

  describe('manufacturing order type mapping', () => {
    it('should map M3 order types', () => {
      const rule = m3PpRules.rules.find(r => r.target === 'AUART');
      expect(rule.valueMap['M01']).toBe('PP01');
      expect(rule.valueMap['M03']).toBe('PP03');
      expect(rule.valueMap['M05']).toBe('PP10');
    });
  });

  describe('manufacturing order status mapping', () => {
    it('should map M3 order statuses', () => {
      const rule = m3PpRules.rules.find(r => r.target === 'STATUS');
      expect(rule.valueMap['10']).toBe('CRTD');
      expect(rule.valueMap['30']).toBe('REL');
      expect(rule.valueMap['60']).toBe('TECO');
      expect(rule.valueMap['80']).toBe('DLT');
    });
  });

  describe('work center type mapping', () => {
    it('should map M3 work center types', () => {
      const rule = m3PpRules.rules.find(r => r.target === 'VERWE');
      expect(rule.valueMap['MCH']).toBe('0001');
      expect(rule.valueMap['LBR']).toBe('0002');
      expect(rule.valueMap['SUB']).toBe('0007');
    });
  });
});
