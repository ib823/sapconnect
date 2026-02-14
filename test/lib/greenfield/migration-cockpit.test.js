/**
 * Tests for Migration Cockpit Template Generator
 */
const MigrationCockpitGenerator = require('../../../lib/greenfield/migration-cockpit');

describe('MigrationCockpitGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new MigrationCockpitGenerator({ mode: 'mock' });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // List Migration Objects
  // ─────────────────────────────────────────────────────────────────────────

  describe('listMigrationObjects', () => {
    it('should return 50+ migration objects', () => {
      const result = generator.listMigrationObjects();
      expect(result.totalCount).toBeGreaterThanOrEqual(50);
      expect(result.objects).toHaveLength(result.totalCount);
    });

    it('should cover all required domains', () => {
      const result = generator.listMigrationObjects();
      expect(result.domains).toContain('FI');
      expect(result.domains).toContain('CO');
      expect(result.domains).toContain('MM');
      expect(result.domains).toContain('SD');
      expect(result.domains).toContain('BP');
      expect(result.domains).toContain('HR');
      expect(result.domains).toContain('Banking');
    });

    it('should include field counts for each object', () => {
      const result = generator.listMigrationObjects();
      for (const obj of result.objects) {
        expect(obj.id).toBeDefined();
        expect(obj.name).toBeDefined();
        expect(obj.fieldCount).toBeGreaterThan(0);
        expect(obj.requiredFieldCount).toBeGreaterThanOrEqual(0);
        expect(obj.domain).toBeDefined();
      }
    });

    it('should include PP and PM domains', () => {
      const result = generator.listMigrationObjects();
      expect(result.domains).toContain('PP');
      expect(result.domains).toContain('PM');
    });

    it('should have unique object IDs', () => {
      const result = generator.listMigrationObjects();
      const ids = result.objects.map(o => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Get Object Template
  // ─────────────────────────────────────────────────────────────────────────

  describe('getObjectTemplate', () => {
    it('should return field structure for GL Account', () => {
      const template = generator.getObjectTemplate('FI-GLACCOUNT');
      expect(template.id).toBe('FI-GLACCOUNT');
      expect(template.name).toBe('GL Account');
      expect(template.fields.length).toBeGreaterThan(0);
      expect(template.requiredFields.length).toBeGreaterThan(0);
    });

    it('should include field metadata', () => {
      const template = generator.getObjectTemplate('MM-MATERIAL');
      const materialField = template.fields.find(f => f.name === 'MATERIAL');
      expect(materialField).toBeDefined();
      expect(materialField.type).toBe('CHAR');
      expect(materialField.required).toBe(true);
      expect(materialField.description).toBeDefined();
    });

    it('should include value help where available', () => {
      const template = generator.getObjectTemplate('FI-GLACCOUNT');
      const typeField = template.fields.find(f => f.name === 'ACCOUNT_TYPE');
      expect(typeField.valueHelp).toBeDefined();
      expect(typeField.valueHelp).toContain('P');
    });

    it('should separate required and optional fields', () => {
      const template = generator.getObjectTemplate('CO-COSTCENTER');
      expect(template.requiredFields.length).toBeGreaterThan(0);
      expect(template.optionalFields.length).toBeGreaterThan(0);
      expect(template.requiredFields.length + template.optionalFields.length).toBe(template.fields.length);
    });

    it('should throw for unknown object ID', () => {
      expect(() => generator.getObjectTemplate('NONEXISTENT')).toThrow('Unknown migration object');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Suggest Field Mapping
  // ─────────────────────────────────────────────────────────────────────────

  describe('suggestFieldMapping', () => {
    it('should find exact matches with confidence 1.0', () => {
      const suggestions = generator.suggestFieldMapping(
        ['MATERIAL', 'MATERIAL_TYPE', 'BASE_UOM'],
        'MM-MATERIAL'
      );
      const materialSuggestion = suggestions.find(s => s.source === 'MATERIAL');
      expect(materialSuggestion.confidence).toBe(1.0);
      expect(materialSuggestion.target).toBe('MATERIAL');
    });

    it('should find semantic synonym matches', () => {
      const suggestions = generator.suggestFieldMapping(
        ['MATNR', 'WERKS'],
        'MM-MATERIAL'
      );
      const matnrSuggestion = suggestions.find(s => s.source === 'MATNR');
      expect(matnrSuggestion.target).toBe('MATERIAL');
      expect(matnrSuggestion.confidence).toBeGreaterThan(0.5);
    });

    it('should return null target for unmatchable fields', () => {
      const suggestions = generator.suggestFieldMapping(
        ['XYZZY_FIELD_QWERTY_123456'],
        'MM-MATERIAL'
      );
      const noMatch = suggestions.find(s => s.source === 'XYZZY_FIELD_QWERTY_123456');
      expect(noMatch.target).toBeNull();
      expect(noMatch.confidence).toBe(0);
    });

    it('should sort results by confidence descending', () => {
      const suggestions = generator.suggestFieldMapping(
        ['MATERIAL', 'UNKNOWN_FIELD_XYZ_123', 'PLANT'],
        'MM-MATERIAL'
      );
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i].confidence).toBeLessThanOrEqual(suggestions[i - 1].confidence);
      }
    });

    it('should include reason for each suggestion', () => {
      const suggestions = generator.suggestFieldMapping(
        ['MATERIAL', 'KUNNR'],
        'SD-CUSTOMER'
      );
      for (const s of suggestions) {
        expect(s.reason).toBeDefined();
        expect(typeof s.reason).toBe('string');
      }
    });

    it('should throw for unknown target object', () => {
      expect(() => generator.suggestFieldMapping(['FIELD1'], 'NONEXISTENT')).toThrow('Unknown');
    });

    it('should throw for non-array source fields', () => {
      expect(() => generator.suggestFieldMapping('not-array', 'MM-MATERIAL')).toThrow('array');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Generate Template
  // ─────────────────────────────────────────────────────────────────────────

  describe('generateTemplate', () => {
    it('should produce mapped rows from source data', () => {
      const sourceData = [
        { mat_num: 'MAT-001', mat_type: 'FERT', desc: 'Test Material', uom: 'EA' },
        { mat_num: 'MAT-002', mat_type: 'ROH', desc: 'Raw Material', uom: 'KG' },
      ];
      const mapping = {
        mat_num: 'MATERIAL',
        mat_type: 'MATERIAL_TYPE',
        desc: 'DESCRIPTION',
        uom: 'BASE_UOM',
      };
      const result = generator.generateTemplate('MM-MATERIAL', sourceData, mapping);
      expect(result.totalRows).toBe(2);
      expect(result.rows[0].MATERIAL).toBe('MAT-001');
      expect(result.rows[0].MATERIAL_TYPE).toBe('FERT');
      expect(result.objectId).toBe('MM-MATERIAL');
    });

    it('should report validation errors for missing required fields', () => {
      const sourceData = [{ mat_type: 'FERT' }];
      const mapping = { mat_type: 'MATERIAL_TYPE' };
      const result = generator.generateTemplate('MM-MATERIAL', sourceData, mapping);
      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.isValid).toBe(false);
    });

    it('should throw for unknown object ID', () => {
      expect(() => generator.generateTemplate('NONEXISTENT', [], {})).toThrow('Unknown');
    });

    it('should throw for non-array sourceData', () => {
      expect(() => generator.generateTemplate('MM-MATERIAL', 'not-array', {})).toThrow('array');
    });

    it('should include generation timestamp', () => {
      const result = generator.generateTemplate('MM-MATERIAL', [], {});
      expect(result.generatedAt).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Validate Template
  // ─────────────────────────────────────────────────────────────────────────

  describe('validateTemplate', () => {
    it('should validate correct data as valid', () => {
      const data = [{
        CHART_OF_ACCOUNTS: 'YCOA',
        GL_ACCOUNT: '0000100000',
        SHORT_TEXT: 'Test Account',
        ACCOUNT_GROUP: 'SAKO',
        ACCOUNT_TYPE: 'X',
      }];
      const result = generator.validateTemplate('FI-GLACCOUNT', data);
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should catch missing required fields', () => {
      const data = [{ CHART_OF_ACCOUNTS: 'YCOA' }]; // missing GL_ACCOUNT, SHORT_TEXT, etc.
      const result = generator.validateTemplate('FI-GLACCOUNT', data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.type === 'required')).toBe(true);
    });

    it('should catch field length violations', () => {
      const data = [{
        CHART_OF_ACCOUNTS: 'TOOLONG_COA', // max 4
        GL_ACCOUNT: '0000100000',
        SHORT_TEXT: 'Test',
        ACCOUNT_GROUP: 'SAKO',
        ACCOUNT_TYPE: 'X',
      }];
      const result = generator.validateTemplate('FI-GLACCOUNT', data);
      expect(result.errors.some(e => e.type === 'length')).toBe(true);
    });

    it('should catch NUMC format violations', () => {
      const data = [{
        PERSONNEL_NUMBER: 'NOTANUM',
        FIRST_NAME: 'John',
        LAST_NAME: 'Doe',
        PERSONNEL_AREA: '1000',
        PERSONNEL_SUBAREA: '0001',
        EMPLOYEE_GROUP: '1',
        EMPLOYEE_SUBGROUP: '01',
        HIRE_DATE: '20230101',
      }];
      const result = generator.validateTemplate('HR-EMPLOYEE', data);
      expect(result.errors.some(e => e.type === 'format' && e.field === 'PERSONNEL_NUMBER')).toBe(true);
    });

    it('should catch invalid date format', () => {
      const data = [{
        CONTROLLING_AREA: '1000',
        COST_CENTER: 'CC001',
        VALID_FROM: '2023-01-01', // should be YYYYMMDD
        VALID_TO: '99991231',
        NAME: 'Test CC',
        COST_CENTER_CATEGORY: 'F',
        COMPANY_CODE: '1000',
      }];
      const result = generator.validateTemplate('CO-COSTCENTER', data);
      expect(result.errors.some(e => e.type === 'format')).toBe(true);
    });

    it('should warn on invalid value help values', () => {
      const data = [{
        CHART_OF_ACCOUNTS: 'YCOA',
        GL_ACCOUNT: '0000100000',
        SHORT_TEXT: 'Test',
        ACCOUNT_GROUP: 'SAKO',
        ACCOUNT_TYPE: 'Z', // not in value help [P, L, X]
      }];
      const result = generator.validateTemplate('FI-GLACCOUNT', data);
      expect(result.warnings.some(w => w.type === 'value_help')).toBe(true);
    });

    it('should warn on unknown fields', () => {
      const data = [{
        CHART_OF_ACCOUNTS: 'YCOA',
        GL_ACCOUNT: '0000100000',
        SHORT_TEXT: 'Test',
        ACCOUNT_GROUP: 'SAKO',
        ACCOUNT_TYPE: 'X',
        RANDOM_FIELD: 'value',
      }];
      const result = generator.validateTemplate('FI-GLACCOUNT', data);
      expect(result.warnings.some(w => w.type === 'unknown_field')).toBe(true);
    });

    it('should throw for unknown object ID', () => {
      expect(() => generator.validateTemplate('NONEXISTENT', [])).toThrow('Unknown');
    });

    it('should throw for non-array data', () => {
      expect(() => generator.validateTemplate('FI-GLACCOUNT', 'bad')).toThrow('array');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Export to XML
  // ─────────────────────────────────────────────────────────────────────────

  describe('exportToXml', () => {
    it('should produce valid XML structure', () => {
      const data = [{
        BANK_COUNTRY: 'US',
        BANK_KEY: '123456789',
        BANK_NAME: 'Test Bank',
      }];
      const xml = generator.exportToXml('BANK-BANKMASTER', data);
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<MigrationData');
      expect(xml).toContain('</MigrationData>');
      expect(xml).toContain('<Records>');
      expect(xml).toContain('<Record index="0">');
    });

    it('should include header metadata', () => {
      const xml = generator.exportToXml('BANK-BANKMASTER', []);
      expect(xml).toContain('<Header>');
      expect(xml).toContain('<ObjectId>');
      expect(xml).toContain('<RecordCount>0</RecordCount>');
    });

    it('should include field definitions', () => {
      const xml = generator.exportToXml('BANK-BANKMASTER', []);
      expect(xml).toContain('<Fields>');
      expect(xml).toContain('<Field name="BANK_COUNTRY"');
    });

    it('should escape XML special characters', () => {
      const data = [{ BANK_COUNTRY: 'US', BANK_KEY: '123', BANK_NAME: 'A & B <Corp>' }];
      const xml = generator.exportToXml('BANK-BANKMASTER', data);
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&lt;Corp&gt;');
    });

    it('should throw for unknown object ID', () => {
      expect(() => generator.exportToXml('NONEXISTENT', [])).toThrow('Unknown');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Export to Excel (CSV)
  // ─────────────────────────────────────────────────────────────────────────

  describe('exportToExcel', () => {
    it('should produce CSV with header row', () => {
      const data = [{
        PLANT: '1000',
        STORAGE_LOCATION: '0001',
        DESCRIPTION: 'Main storage',
      }];
      const csv = generator.exportToExcel('MM-STORAGELOCATION', data);
      const lines = csv.split('\n');
      expect(lines[0]).toBe('PLANT,STORAGE_LOCATION,DESCRIPTION');
      expect(lines[1]).toContain('1000');
    });

    it('should handle empty data array', () => {
      const csv = generator.exportToExcel('MM-STORAGELOCATION', []);
      const lines = csv.split('\n');
      expect(lines).toHaveLength(1); // header only
      expect(lines[0]).toBe('PLANT,STORAGE_LOCATION,DESCRIPTION');
    });

    it('should escape commas in values', () => {
      const data = [{ PLANT: '1000', STORAGE_LOCATION: '0001', DESCRIPTION: 'Main, storage' }];
      const csv = generator.exportToExcel('MM-STORAGELOCATION', data);
      expect(csv).toContain('"Main, storage"');
    });

    it('should escape double quotes in values', () => {
      const data = [{ PLANT: '1000', STORAGE_LOCATION: '0001', DESCRIPTION: 'Size "large"' }];
      const csv = generator.exportToExcel('MM-STORAGELOCATION', data);
      expect(csv).toContain('""large""');
    });

    it('should throw for unknown object ID', () => {
      expect(() => generator.exportToExcel('NONEXISTENT', [])).toThrow('Unknown');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Staging DDL Generation
  // ─────────────────────────────────────────────────────────────────────────

  describe('generateStagingDDL', () => {
    it('should generate CREATE TABLE statement', () => {
      const ddl = generator.generateStagingDDL('FI-GLACCOUNT');
      expect(ddl).toContain('CREATE COLUMN TABLE');
      expect(ddl).toContain('ZSTG_FI_GLACCOUNT');
    });

    it('should include all object fields as columns', () => {
      const ddl = generator.generateStagingDDL('FI-GLACCOUNT');
      expect(ddl).toContain('"CHART_OF_ACCOUNTS"');
      expect(ddl).toContain('"GL_ACCOUNT"');
      expect(ddl).toContain('"SHORT_TEXT"');
    });

    it('should add metadata columns', () => {
      const ddl = generator.generateStagingDDL('MM-MATERIAL');
      expect(ddl).toContain('"ROW_ID"');
      expect(ddl).toContain('"LOAD_DATE"');
      expect(ddl).toContain('"STATUS"');
      expect(ddl).toContain('"ERROR_MESSAGE"');
    });

    it('should use appropriate HANA data types', () => {
      const ddl = generator.generateStagingDDL('CO-COSTCENTER');
      expect(ddl).toContain('NVARCHAR');
      expect(ddl).toContain('DATE');
    });

    it('should mark required fields as NOT NULL', () => {
      const ddl = generator.generateStagingDDL('FI-GLACCOUNT');
      expect(ddl).toContain('NOT NULL');
    });

    it('should include indexes', () => {
      const ddl = generator.generateStagingDDL('FI-GLACCOUNT');
      expect(ddl).toContain('CREATE INDEX');
      expect(ddl).toContain('STATUS');
      expect(ddl).toContain('LOAD_DATE');
    });

    it('should include primary key', () => {
      const ddl = generator.generateStagingDDL('FI-GLACCOUNT');
      expect(ddl).toContain('PRIMARY KEY');
    });

    it('should throw for unknown object ID', () => {
      expect(() => generator.generateStagingDDL('NONEXISTENT')).toThrow('Unknown');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const g = new MigrationCockpitGenerator();
      expect(g.mode).toBe('mock');
    });

    it('should accept custom mode', () => {
      const g = new MigrationCockpitGenerator({ mode: 'live' });
      expect(g.mode).toBe('live');
    });
  });
});
