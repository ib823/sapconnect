/**
 * Tests for Infor LN Transformation Rule Sets
 */
const lnFiRules = require('../../../../migration/infor/rules/ln-fi-rules');
const lnMmRules = require('../../../../migration/infor/rules/ln-mm-rules');
const lnSdRules = require('../../../../migration/infor/rules/ln-sd-rules');
const lnPpRules = require('../../../../migration/infor/rules/ln-pp-rules');
const { FieldMappingEngine } = require('../../../../migration/field-mapping');

describe('LN FI Rules', () => {
  it('should have correct identity', () => {
    expect(lnFiRules.ruleSetId).toBe('LN_FI_RULES');
    expect(lnFiRules.name).toBe('Infor LN Financial Transformation Rules');
  });

  it('should have 15+ rules', () => {
    expect(lnFiRules.rules.length).toBeGreaterThanOrEqual(15);
  });

  it('should have required fields on every rule', () => {
    for (const rule of lnFiRules.rules) {
      expect(rule.target).toBeDefined();
      expect(rule.description).toBeDefined();
    }
  });

  it('should validate as a mapping set', () => {
    const engine = new FieldMappingEngine(lnFiRules.rules);
    const { valid, errors } = engine.validateMappings();
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  describe('GL account formatting', () => {
    it('should strip leading zeros and repad to 10 digits', () => {
      const rule = lnFiRules.rules.find(r => r.target === 'SAKNR');
      expect(rule).toBeDefined();
      expect(rule.transform('00140000')).toBe('0000140000');
      expect(rule.transform('500100')).toBe('0000500100');
      expect(rule.transform('0')).toBe('0000000000');
    });
  });

  describe('document type mapping', () => {
    it('should map NOR to SA', () => {
      const rule = lnFiRules.rules.find(r => r.target === 'BLART');
      expect(rule.valueMap['NOR']).toBe('SA');
    });

    it('should map REV to AB', () => {
      const rule = lnFiRules.rules.find(r => r.target === 'BLART');
      expect(rule.valueMap['REV']).toBe('AB');
    });
  });

  describe('fiscal period mapping', () => {
    it('should zero-pad period numbers', () => {
      const rule = lnFiRules.rules.find(r => r.target === 'MONAT');
      expect(rule.transform(1)).toBe('01');
      expect(rule.transform(12)).toBe('12');
      expect(rule.transform('3')).toBe('03');
    });

    it('should handle special periods > 12', () => {
      const rule = lnFiRules.rules.find(r => r.target === 'MONAT');
      expect(rule.transform(13)).toBe('013');
    });
  });

  describe('tax code mapping', () => {
    it('should map LN tax codes to SAP codes', () => {
      const rule = lnFiRules.rules.find(r => r.target === 'MWSKZ');
      expect(rule.valueMap['V0']).toBe('V0');
      expect(rule.valueMap['V1']).toBe('A1');
      expect(rule.valueMap['P1']).toBe('V1');
      expect(rule.valueMap['EU1']).toBe('A1');
    });
  });

  describe('company code formatting', () => {
    it('should pad to 4 digits', () => {
      const rule = lnFiRules.rules.find(r => r.target === 'BUKRS');
      expect(rule.transform(100)).toBe('0100');
      expect(rule.transform(1)).toBe('0001');
    });
  });

  describe('debit/credit mapping', () => {
    it('should map D to S and C to H', () => {
      const rule = lnFiRules.rules.find(r => r.target === 'SHKZG');
      expect(rule.valueMap['D']).toBe('S');
      expect(rule.valueMap['C']).toBe('H');
    });
  });

  describe('full record mapping', () => {
    it('should map a complete FI record', () => {
      const engine = new FieldMappingEngine(lnFiRules.rules);
      const record = {
        't$leac': '00500100',
        't$desc': 'COGS Account',
        't$ccur': 'usd',
        't$perd': 1,
        't$year': 2024,
        't$dctp': 'NOR',
        't$dbcr': 'D',
        't$txcd': 'V1',
        't$stat': 'FNL',
        't$amnt': 12500.50,
        't$dcdt': '20240115',
        't$cpnb': 100,
        't$dcnm': 'GL240001',
      };
      const result = engine.applyRecord(record);
      expect(result.SAKNR).toBe('0000500100');
      expect(result.WAERS).toBe('USD');
      expect(result.MONAT).toBe('01');
      expect(result.GJAHR).toBe(2024);
      expect(result.BLART).toBe('SA');
      expect(result.SHKZG).toBe('S');
      expect(result.MWSKZ).toBe('A1');
      expect(result.WRBTR).toBe(12500.50);
      expect(result.BUKRS).toBe('0100');
      expect(result.SourceSystem).toBe('INFOR_LN');
    });
  });
});

describe('LN MM Rules', () => {
  it('should have correct identity', () => {
    expect(lnMmRules.ruleSetId).toBe('LN_MM_RULES');
    expect(lnMmRules.name).toBe('Infor LN Materials Management Transformation Rules');
  });

  it('should have 15+ rules', () => {
    expect(lnMmRules.rules.length).toBeGreaterThanOrEqual(15);
  });

  it('should have required fields on every rule', () => {
    for (const rule of lnMmRules.rules) {
      expect(rule.target).toBeDefined();
      expect(rule.description).toBeDefined();
    }
  });

  it('should validate as a mapping set', () => {
    const engine = new FieldMappingEngine(lnMmRules.rules);
    const { valid, errors } = engine.validateMappings();
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  describe('item type mapping', () => {
    it('should map kitm values to MTART', () => {
      const rule = lnMmRules.rules.find(r => r.target === 'MTART');
      expect(rule.valueMap['1']).toBe('ROH');
      expect(rule.valueMap['2']).toBe('HALB');
      expect(rule.valueMap['3']).toBe('FERT');
      expect(rule.valueMap['6']).toBe('NLAG');
    });
  });

  describe('UoM conversion', () => {
    it('should map LN UoMs to SAP UoMs', () => {
      const rule = lnMmRules.rules.find(r => r.target === 'MEINS');
      expect(rule.valueMap['kg']).toBe('KG');
      expect(rule.valueMap['pcs']).toBe('ST');
      expect(rule.valueMap['ea']).toBe('EA');
      expect(rule.valueMap['hr']).toBe('UR');
    });
  });

  describe('purchasing group mapping', () => {
    it('should map LN groups to SAP codes', () => {
      const rule = lnMmRules.rules.find(r => r.target === 'EKGRP');
      expect(rule.valueMap['RAW']).toBe('001');
      expect(rule.valueMap['MRO']).toBe('002');
    });
  });

  describe('full record mapping', () => {
    it('should map a complete MM record', () => {
      const engine = new FieldMappingEngine(lnMmRules.rules);
      const record = {
        item: 'CAB100001',
        dsca: 'Steel Cable Assembly 10mm',
        kitm: '2',
        csig: 'cable',
        cuni: 'ea',
        stwi: '45.50',
        cwar: 'WH100',
        lwar: '0001',
        wght: '2.30',
        sfty: '100',
        reop: '200',
        pldt: '7',
        erpn: '4012345000011',
        't$plng': 'MRP',
      };
      const result = engine.applyRecord(record);
      expect(result.MATNR).toBe('CAB100001');
      expect(result.MTART).toBe('HALB');
      expect(result.BESKZ).toBe('E');
      expect(result.MEINS).toBe('EA');
      expect(result.MATKL).toBe('CABLE');
      expect(result.STPRS).toBe(45.5);
      expect(result.DISMM).toBe('PD');
      expect(result.SourceSystem).toBe('INFOR_LN');
    });
  });
});

describe('LN SD Rules', () => {
  it('should have correct identity', () => {
    expect(lnSdRules.ruleSetId).toBe('LN_SD_RULES');
    expect(lnSdRules.name).toBe('Infor LN Sales & Distribution Transformation Rules');
  });

  it('should have 12+ rules', () => {
    expect(lnSdRules.rules.length).toBeGreaterThanOrEqual(12);
  });

  it('should have required fields on every rule', () => {
    for (const rule of lnSdRules.rules) {
      expect(rule.target).toBeDefined();
      expect(rule.description).toBeDefined();
    }
  });

  it('should validate as a mapping set', () => {
    const engine = new FieldMappingEngine(lnSdRules.rules);
    const { valid, errors } = engine.validateMappings();
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  describe('sales order type mapping', () => {
    it('should map LN types to SAP', () => {
      const rule = lnSdRules.rules.find(r => r.target === 'AUART');
      expect(rule.valueMap['STD']).toBe('TA');
      expect(rule.valueMap['RTN']).toBe('RE');
      expect(rule.valueMap['CRD']).toBe('CR');
    });
  });

  describe('customer number formatting', () => {
    it('should strip BP prefix and pad to 10', () => {
      const rule = lnSdRules.rules.find(r => r.target === 'KUNNR');
      expect(rule.transform('BP001')).toBe('0000000001');
      expect(rule.transform('12345')).toBe('0000012345');
    });
  });

  describe('payment terms mapping', () => {
    it('should map LN terms to SAP terms', () => {
      const rule = lnSdRules.rules.find(r => r.target === 'ZTERM');
      expect(rule.valueMap['NET30']).toBe('ZN30');
      expect(rule.valueMap['NET60']).toBe('ZN60');
      expect(rule.valueMap['COD']).toBe('ZC00');
    });
  });
});

describe('LN PP Rules', () => {
  it('should have correct identity', () => {
    expect(lnPpRules.ruleSetId).toBe('LN_PP_RULES');
    expect(lnPpRules.name).toBe('Infor LN Production Planning Transformation Rules');
  });

  it('should have 12+ rules', () => {
    expect(lnPpRules.rules.length).toBeGreaterThanOrEqual(12);
  });

  it('should have required fields on every rule', () => {
    for (const rule of lnPpRules.rules) {
      expect(rule.target).toBeDefined();
      expect(rule.description).toBeDefined();
    }
  });

  it('should validate as a mapping set', () => {
    const engine = new FieldMappingEngine(lnPpRules.rules);
    const { valid, errors } = engine.validateMappings();
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  describe('BOM usage mapping', () => {
    it('should map LN BOM usage to SAP STLAN', () => {
      const rule = lnPpRules.rules.find(r => r.target === 'STLAN');
      expect(rule.valueMap['PRD']).toBe('1');
      expect(rule.valueMap['ENG']).toBe('2');
      expect(rule.valueMap['SVC']).toBe('5');
    });
  });

  describe('production order type mapping', () => {
    it('should map LN order types to SAP', () => {
      const rule = lnPpRules.rules.find(r => r.target === 'AUART');
      expect(rule.valueMap['STD']).toBe('PP01');
      expect(rule.valueMap['RWK']).toBe('PP03');
    });
  });

  describe('production order status mapping', () => {
    it('should map LN statuses to SAP', () => {
      const rule = lnPpRules.rules.find(r => r.target === 'STATUS');
      expect(rule.valueMap['CRE']).toBe('CRTD');
      expect(rule.valueMap['REL']).toBe('REL');
      expect(rule.valueMap['CMP']).toBe('TECO');
      expect(rule.valueMap['CLO']).toBe('DLT');
    });
  });

  describe('work center type mapping', () => {
    it('should map LN work center types to SAP', () => {
      const rule = lnPpRules.rules.find(r => r.target === 'VERWE');
      expect(rule.valueMap['MCH']).toBe('0001');
      expect(rule.valueMap['LAB']).toBe('0002');
      expect(rule.valueMap['EXT']).toBe('0007');
    });
  });
});
