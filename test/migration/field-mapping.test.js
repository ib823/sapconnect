const { FieldMappingEngine, CONVERTERS } = require('../../migration/field-mapping');

describe('CONVERTERS', () => {
  it('padLeft40 pads to 40 chars', () => {
    expect(CONVERTERS.padLeft40('123')).toBe('0000000000000000000000000000000000000123');
    expect(CONVERTERS.padLeft40('123').length).toBe(40);
  });

  it('padLeft10 pads to 10 chars', () => {
    expect(CONVERTERS.padLeft10('42')).toBe('0000000042');
  });

  it('toUpperCase', () => {
    expect(CONVERTERS.toUpperCase('hello')).toBe('HELLO');
    expect(CONVERTERS.toUpperCase(null)).toBe('');
  });

  it('toLowerCase', () => {
    expect(CONVERTERS.toLowerCase('HELLO')).toBe('hello');
  });

  it('toDate converts YYYYMMDD', () => {
    expect(CONVERTERS.toDate('20240115')).toBe('2024-01-15');
    expect(CONVERTERS.toDate('2024/01/15')).toBe('2024-01-15');
    expect(CONVERTERS.toDate(null)).toBe(null);
  });

  it('toDecimal', () => {
    expect(CONVERTERS.toDecimal('123.45')).toBe(123.45);
    expect(CONVERTERS.toDecimal(null)).toBe(0);
    expect(CONVERTERS.toDecimal('abc')).toBe(0);
  });

  it('toInteger', () => {
    expect(CONVERTERS.toInteger('42')).toBe(42);
    expect(CONVERTERS.toInteger('12.7')).toBe(12);
    expect(CONVERTERS.toInteger(null)).toBe(0);
  });

  it('boolYN', () => {
    expect(CONVERTERS.boolYN('X')).toBe(true);
    expect(CONVERTERS.boolYN('Y')).toBe(true);
    expect(CONVERTERS.boolYN(true)).toBe(true);
    expect(CONVERTERS.boolYN('')).toBe(false);
  });

  it('boolTF', () => {
    expect(CONVERTERS.boolTF('X')).toBe('T');
    expect(CONVERTERS.boolTF('')).toBe('F');
  });

  it('stripLeadingZeros', () => {
    expect(CONVERTERS.stripLeadingZeros('000042')).toBe('42');
    expect(CONVERTERS.stripLeadingZeros('000000')).toBe('0');
    expect(CONVERTERS.stripLeadingZeros(null)).toBe('');
  });

  it('trim', () => {
    expect(CONVERTERS.trim('  hello  ')).toBe('hello');
  });
});

describe('FieldMappingEngine', () => {
  describe('simple rename', () => {
    it('renames source to target', () => {
      const engine = new FieldMappingEngine([
        { source: 'BUKRS', target: 'CompanyCode' },
        { source: 'GJAHR', target: 'FiscalYear' },
      ]);
      const result = engine.applyRecord({ BUKRS: '1000', GJAHR: '2024' });
      expect(result).toEqual({ CompanyCode: '1000', FiscalYear: '2024' });
    });
  });

  describe('type conversion', () => {
    it('applies named converter', () => {
      const engine = new FieldMappingEngine([
        { source: 'MATNR', target: 'Product', convert: 'padLeft40' },
      ]);
      const result = engine.applyRecord({ MATNR: 'MAT001' });
      expect(result.Product.length).toBe(40);
      expect(result.Product.endsWith('MAT001')).toBe(true);
    });

    it('applies function converter', () => {
      const engine = new FieldMappingEngine([
        { source: 'AMT', target: 'Amount', convert: (v) => Number(v) * 100 },
      ]);
      expect(engine.applyRecord({ AMT: '5.5' })).toEqual({ Amount: 550 });
    });

    it('handles unknown converter gracefully', () => {
      const engine = new FieldMappingEngine([
        { source: 'X', target: 'Y', convert: 'nonexistent' },
      ]);
      const result = engine.applyRecord({ X: 'val' });
      expect(result.Y).toBe('val');
    });
  });

  describe('value map', () => {
    it('maps values', () => {
      const engine = new FieldMappingEngine([
        { source: 'KTOKD', target: 'BPCategory', valueMap: { 'D': 'CUSTOMER', 'K': 'VENDOR' }, default: 'OTHER' },
      ]);
      expect(engine.applyRecord({ KTOKD: 'D' })).toEqual({ BPCategory: 'CUSTOMER' });
      expect(engine.applyRecord({ KTOKD: 'K' })).toEqual({ BPCategory: 'VENDOR' });
      expect(engine.applyRecord({ KTOKD: 'Z' })).toEqual({ BPCategory: 'OTHER' });
    });
  });

  describe('concatenation', () => {
    it('joins multiple source fields', () => {
      const engine = new FieldMappingEngine([
        { target: 'FullName', sources: ['FIRST', 'LAST'], separator: ' ' },
      ]);
      expect(engine.applyRecord({ FIRST: 'John', LAST: 'Doe' })).toEqual({ FullName: 'John Doe' });
    });

    it('uses empty string separator by default', () => {
      const engine = new FieldMappingEngine([
        { target: 'Code', sources: ['A', 'B'], separator: '' },
      ]);
      expect(engine.applyRecord({ A: 'XX', B: 'YY' })).toEqual({ Code: 'XXYY' });
    });
  });

  describe('default value', () => {
    it('sets a static default', () => {
      const engine = new FieldMappingEngine([
        { target: 'Currency', default: 'USD' },
      ]);
      expect(engine.applyRecord({})).toEqual({ Currency: 'USD' });
    });

    it('sets a function default', () => {
      const engine = new FieldMappingEngine([
        { target: 'Key', default: (r) => `${r.A}-${r.B}` },
      ]);
      expect(engine.applyRecord({ A: 'X', B: 'Y' })).toEqual({ Key: 'X-Y' });
    });
  });

  describe('conditional transform', () => {
    it('applies transform function', () => {
      const engine = new FieldMappingEngine([
        { source: 'STATUS', target: 'Active', transform: (v) => v === 'A' },
      ]);
      expect(engine.applyRecord({ STATUS: 'A' })).toEqual({ Active: true });
      expect(engine.applyRecord({ STATUS: 'I' })).toEqual({ Active: false });
    });
  });

  describe('applyBatch', () => {
    it('maps all records', () => {
      const engine = new FieldMappingEngine([{ source: 'X', target: 'Y' }]);
      const result = engine.applyBatch([{ X: 1 }, { X: 2 }, { X: 3 }]);
      expect(result).toEqual([{ Y: 1 }, { Y: 2 }, { Y: 3 }]);
    });
  });

  describe('passThrough', () => {
    it('copies unmapped fields when enabled', () => {
      const engine = new FieldMappingEngine(
        [{ source: 'A', target: 'B' }],
        { passThrough: true }
      );
      const result = engine.applyRecord({ A: 1, C: 2 });
      expect(result).toEqual({ B: 1, C: 2 });
    });
  });

  describe('fromLegacy', () => {
    it('converts SRC->TGT strings', () => {
      const mappings = FieldMappingEngine.fromLegacy(['BUKRS->CompanyCode', 'GJAHR -> FiscalYear']);
      expect(mappings).toEqual([
        { source: 'BUKRS', target: 'CompanyCode' },
        { source: 'GJAHR', target: 'FiscalYear' },
      ]);
    });
  });

  describe('validateMappings', () => {
    it('passes valid mappings', () => {
      const engine = new FieldMappingEngine([{ source: 'A', target: 'B' }]);
      expect(engine.validateMappings().valid).toBe(true);
    });

    it('catches missing target', () => {
      const engine = new FieldMappingEngine([{ source: 'A' }]);
      const v = engine.validateMappings();
      expect(v.valid).toBe(false);
      expect(v.errors[0]).toMatch(/missing target/);
    });

    it('catches duplicate targets', () => {
      const engine = new FieldMappingEngine([
        { source: 'A', target: 'X' },
        { source: 'B', target: 'X' },
      ]);
      const v = engine.validateMappings();
      expect(v.valid).toBe(false);
      expect(v.errors[0]).toMatch(/duplicate target/);
    });

    it('catches unknown converter', () => {
      const engine = new FieldMappingEngine([
        { source: 'A', target: 'B', convert: 'nope' },
      ]);
      const v = engine.validateMappings();
      expect(v.valid).toBe(false);
    });
  });

  describe('getSummary', () => {
    it('tracks processing stats', () => {
      const engine = new FieldMappingEngine([{ source: 'A', target: 'B' }]);
      engine.applyBatch([{ A: 1 }, { A: 2 }]);
      const s = engine.getSummary();
      expect(s.totalMappings).toBe(1);
      expect(s.processed).toBe(2);
      expect(s.mapped).toBe(2);
    });
  });
});
