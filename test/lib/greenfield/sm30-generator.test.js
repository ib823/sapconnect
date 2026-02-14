/**
 * Tests for SM30 Table Maintenance BDC Generator
 */

const { SM30Generator, KNOWN_TABLES } = require('../../../lib/greenfield/sm30-generator');

describe('SM30Generator', () => {
  let gen;

  beforeEach(() => {
    gen = new SM30Generator({ mode: 'mock' });
  });

  // ─── Constructor ────────────────────────────────────────────────

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(gen).toBeInstanceOf(SM30Generator);
    });

    it('should default mode to mock', () => {
      const defaultGen = new SM30Generator();
      expect(defaultGen.mode).toBe('mock');
    });

    it('should store config options', () => {
      const custom = new SM30Generator({ mode: 'live' });
      expect(custom.mode).toBe('live');
    });
  });

  // ─── Known tables ──────────────────────────────────────────────

  describe('known tables', () => {
    it('should have 80+ table definitions', () => {
      const tables = gen.listKnownTables();
      expect(tables.length).toBeGreaterThanOrEqual(80);
    });

    it('should have FI tables (T001, T003, T052, T007A, etc.)', () => {
      expect(gen.isKnownTable('T001')).toBe(true);
      expect(gen.isKnownTable('T003')).toBe(true);
      expect(gen.isKnownTable('T052')).toBe(true);
      expect(gen.isKnownTable('T007A')).toBe(true);
      expect(gen.isKnownTable('T012')).toBe(true);
      expect(gen.isKnownTable('T077S')).toBe(true);
      expect(gen.isKnownTable('TCURV')).toBe(true);
    });

    it('should have CO tables (TKA01, CSKA, CSKS, CEPC)', () => {
      expect(gen.isKnownTable('TKA01')).toBe(true);
      expect(gen.isKnownTable('CSKA')).toBe(true);
      expect(gen.isKnownTable('CSKS')).toBe(true);
      expect(gen.isKnownTable('CEPC')).toBe(true);
      expect(gen.isKnownTable('T003O')).toBe(true);
    });

    it('should have MM tables (T134, T023, T024, T024E, T156)', () => {
      expect(gen.isKnownTable('T134')).toBe(true);
      expect(gen.isKnownTable('T023')).toBe(true);
      expect(gen.isKnownTable('T024')).toBe(true);
      expect(gen.isKnownTable('T024E')).toBe(true);
      expect(gen.isKnownTable('T156')).toBe(true);
      expect(gen.isKnownTable('T001L')).toBe(true);
    });

    it('should have SD tables (TVAK, TVLK, TVFK, T685A)', () => {
      expect(gen.isKnownTable('TVAK')).toBe(true);
      expect(gen.isKnownTable('TVLK')).toBe(true);
      expect(gen.isKnownTable('TVFK')).toBe(true);
      expect(gen.isKnownTable('T685A')).toBe(true);
      expect(gen.isKnownTable('TVKO')).toBe(true);
      expect(gen.isKnownTable('TVTW')).toBe(true);
    });

    it('should have HR tables (T500P, T501, T503, T510)', () => {
      expect(gen.isKnownTable('T500P')).toBe(true);
      expect(gen.isKnownTable('T501')).toBe(true);
      expect(gen.isKnownTable('T503')).toBe(true);
      expect(gen.isKnownTable('T510')).toBe(true);
      expect(gen.isKnownTable('T549A')).toBe(true);
    });

    it('should have S4 tables (TB003, TB004, NRIV, FAGL_ACTIVEC)', () => {
      expect(gen.isKnownTable('TB003')).toBe(true);
      expect(gen.isKnownTable('TB004')).toBe(true);
      expect(gen.isKnownTable('NRIV')).toBe(true);
      expect(gen.isKnownTable('FAGL_ACTIVEC')).toBe(true);
      expect(gen.isKnownTable('T001K_ML')).toBe(true);
    });

    it('each known table should have keyFields', () => {
      const tables = gen.listKnownTables();
      for (const t of tables) {
        expect(Array.isArray(t.keyFields)).toBe(true);
        expect(t.keyFields.length).toBeGreaterThan(0);
      }
    });

    it('each known table should have editableFields via getTableDefinition', () => {
      for (const tableName of Object.keys(KNOWN_TABLES)) {
        const def = gen.getTableDefinition(tableName);
        expect(def.editableFields).toBeDefined();
        expect(Object.keys(def.editableFields).length).toBeGreaterThan(0);
      }
    });

    it('each known table should have description', () => {
      const tables = gen.listKnownTables();
      for (const t of tables) {
        expect(typeof t.description).toBe('string');
        expect(t.description.length).toBeGreaterThan(0);
      }
    });
  });

  // ─── generateSM30Bdc ──────────────────────────────────────────

  describe('generateSM30Bdc', () => {
    it('should generate valid BDC for T001', () => {
      const result = gen.generateSM30Bdc('T001', [
        { BUKRS: '2000', BUTXT: 'New Company', LAND1: 'US', WAERS: 'USD', SPRAS: 'E' },
      ]);
      expect(result.transaction).toBe('SM30');
      expect(result.type).toBe('sm30');
      expect(result.recording.length).toBeGreaterThan(0);
    });

    it('should generate for unknown table', () => {
      const result = gen.generateSM30Bdc('ZCUSTOM_TABLE', [
        { ZFIELD1: 'val1', ZFIELD2: 'val2' },
      ]);
      expect(result.transaction).toBe('SM30');
      expect(result.recording.length).toBeGreaterThan(0);
    });

    it('should include SM30 entry screen', () => {
      const result = gen.generateSM30Bdc('T001', [
        { BUKRS: '2000', BUTXT: 'Test', LAND1: 'US', WAERS: 'USD', SPRAS: 'E' },
      ]);
      const entryScreen = result.recording.find(
        r => r.program === 'SAPMSSY0' && r.dynpro === '0120'
      );
      expect(entryScreen).toBeDefined();
    });

    it('should include view name selection', () => {
      const result = gen.generateSM30Bdc('T001', [
        { BUKRS: '2000', BUTXT: 'Test', LAND1: 'US', WAERS: 'USD', SPRAS: 'E' },
      ]);
      const viewField = result.recording.find(r => r.fnam === 'VIEWNAME');
      expect(viewField).toBeDefined();
      expect(viewField.fval).toBe('V_T001');
    });

    it('should include field values', () => {
      const result = gen.generateSM30Bdc('T001', [
        { BUKRS: '2000', BUTXT: 'Test Company', LAND1: 'US', WAERS: 'USD', SPRAS: 'E' },
      ]);
      const bukrsField = result.recording.find(r => r.fnam === 'BUKRS');
      expect(bukrsField).toBeDefined();
      expect(bukrsField.fval).toBe('2000');
    });

    it('should include save action', () => {
      const result = gen.generateSM30Bdc('T001', [
        { BUKRS: '2000', BUTXT: 'Test', LAND1: 'US', WAERS: 'USD', SPRAS: 'E' },
      ]);
      const saveAction = result.recording.find(
        r => r.fnam === 'BDC_OKCODE' && r.fval === '=SAVE'
      );
      expect(saveAction).toBeDefined();
    });

    it('should handle multiple fields', () => {
      const result = gen.generateSM30Bdc('T001', [
        { BUKRS: '2000', BUTXT: 'Test', ORT01: 'NYC', LAND1: 'US', WAERS: 'USD', SPRAS: 'E', KTOPL: 'CAUS' },
      ]);
      const fieldEntries = result.recording.filter(
        r => r.fnam !== '' && r.fnam !== 'BDC_OKCODE' && r.fnam !== 'VIEWNAME' && r.fnam !== 'VIESSION'
      );
      expect(fieldEntries.length).toBe(7);
    });

    it('should return compatible recording format', () => {
      const result = gen.generateSM30Bdc('T001', [
        { BUKRS: '2000', BUTXT: 'Test', LAND1: 'US', WAERS: 'USD', SPRAS: 'E' },
      ]);
      expect(result).toHaveProperty('recording');
      expect(result).toHaveProperty('transaction');
      expect(result).toHaveProperty('type');
      for (const step of result.recording) {
        expect(step).toHaveProperty('program');
        expect(step).toHaveProperty('dynpro');
        expect(step).toHaveProperty('dynbegin');
        expect(step).toHaveProperty('fnam');
        expect(step).toHaveProperty('fval');
      }
    });

    it('should validate known table entries', () => {
      expect(() => gen.generateSM30Bdc('T001', [
        { BUTXT: 'Missing key field', LAND1: 'US' },
      ])).toThrow('Missing required key field');
    });

    it('should throw on empty entries', () => {
      expect(() => gen.generateSM30Bdc('T001', [])).toThrow('non-empty array');
    });
  });

  // ─── generateBulkSM30 ─────────────────────────────────────────

  describe('generateBulkSM30', () => {
    it('should create multiple entries', () => {
      const result = gen.generateBulkSM30('T024', [
        { EKGRP: '001', EKNAM: 'Buyers Group 1' },
        { EKGRP: '002', EKNAM: 'Buyers Group 2' },
        { EKGRP: '003', EKNAM: 'Buyers Group 3' },
      ]);
      expect(result.transaction).toBe('SM30');
      expect(result.type).toBe('sm30_bulk');
    });

    it('should have new entries button between rows', () => {
      const result = gen.generateBulkSM30('T024', [
        { EKGRP: '001', EKNAM: 'Group 1' },
        { EKGRP: '002', EKNAM: 'Group 2' },
      ]);
      const newlButtons = result.recording.filter(
        r => r.fnam === 'BDC_OKCODE' && r.fval === '=NEWL'
      );
      // Should have one NEWL per entry
      expect(newlButtons.length).toBe(2);
    });

    it('should have correct total recording steps', () => {
      const result = gen.generateBulkSM30('T024', [
        { EKGRP: '001', EKNAM: 'Group 1' },
        { EKGRP: '002', EKNAM: 'Group 2' },
      ]);
      // Initial screen (4) + per entry: overview (2) + data screen (1) + fields + okcode
      // Entry 1: 2 + 1 + 2 + 1 = 6, Entry 2: 2 + 1 + 2 + 1 = 6
      // Total: 4 + 6 + 6 = 16
      expect(result.recording.length).toBeGreaterThan(10);
    });

    it('should handle single entry', () => {
      const result = gen.generateBulkSM30('T024', [
        { EKGRP: '001', EKNAM: 'Single Group' },
      ]);
      expect(result.recording.length).toBeGreaterThan(0);
      // Last action should be save
      const saveActions = result.recording.filter(
        r => r.fnam === 'BDC_OKCODE' && r.fval === '=SAVE'
      );
      expect(saveActions.length).toBe(1);
    });

    it('should handle large batch', () => {
      const entries = [];
      for (let i = 1; i <= 20; i++) {
        entries.push({ EKGRP: String(i).padStart(3, '0'), EKNAM: `Group ${i}` });
      }
      const result = gen.generateBulkSM30('T024', entries);
      expect(result.recording.length).toBeGreaterThan(50);
      // Should have exactly one save at the end
      const lastOkcode = result.recording
        .filter(r => r.fnam === 'BDC_OKCODE')
        .pop();
      expect(lastOkcode.fval).toBe('=SAVE');
    });
  });

  // ─── validateEntry ─────────────────────────────────────────────

  describe('validateEntry', () => {
    it('should pass valid T001 entry', () => {
      const result = gen.validateEntry('T001', {
        BUKRS: '1000',
        BUTXT: 'Test Company',
        LAND1: 'US',
        WAERS: 'USD',
        SPRAS: 'E',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail on missing key fields', () => {
      const result = gen.validateEntry('T001', {
        BUTXT: 'Missing company code',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('BUKRS'))).toBe(true);
    });

    it('should warn on long field values', () => {
      const result = gen.validateEntry('T001', {
        BUKRS: '1000',
        BUTXT: 'This company name is way too long for the field definition limit',
      });
      expect(result.warnings.some(w => w.includes('exceeds max length'))).toBe(true);
    });

    it('should validate NUMC field types', () => {
      const result = gen.validateEntry('T009', {
        PERIV: 'K4',
        ANPTS: 'ABC', // should be numeric
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('numeric'))).toBe(true);
    });

    it('should handle unknown tables gracefully', () => {
      const result = gen.validateEntry('ZCUSTOM', { ZFIELD: 'value' });
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should return specific errors', () => {
      const result = gen.validateEntry('T001', {});
      expect(result.errors.length).toBeGreaterThan(0);
      for (const err of result.errors) {
        expect(err).toContain('Missing required key field');
      }
    });

    it('should check required vs optional fields', () => {
      // Key fields are required, others are optional
      const result = gen.validateEntry('T001', {
        BUKRS: '1000', // key field present
        // all other fields omitted — should pass
      });
      expect(result.valid).toBe(true);
    });

    it('should validate DATS type fields', () => {
      const result = gen.validateEntry('T503K', {
        PERSG: '1',
        PERSK: 'US',
        BEGDA: 'not-a-date',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('DATS'))).toBe(true);
    });
  });

  // ─── listKnownTables ──────────────────────────────────────────

  describe('listKnownTables', () => {
    it('should return all tables', () => {
      const tables = gen.listKnownTables();
      expect(tables.length).toBe(Object.keys(KNOWN_TABLES).length);
    });

    it('each table should have module tag', () => {
      const tables = gen.listKnownTables();
      for (const t of tables) {
        expect(t.module).toBeDefined();
        expect(['FI', 'CO', 'MM', 'SD', 'HR', 'S4']).toContain(t.module);
      }
    });

    it('should be filterable by module via getTablesByModule', () => {
      const fiTables = gen.getTablesByModule('FI');
      expect(fiTables.length).toBeGreaterThan(0);
      for (const t of fiTables) {
        expect(t.module).toBe('FI');
      }
    });
  });

  // ─── getTableDefinition ────────────────────────────────────────

  describe('getTableDefinition', () => {
    it('should return definition for known table', () => {
      const def = gen.getTableDefinition('T001');
      expect(def).not.toBeNull();
      expect(def.table).toBe('T001');
      expect(def.description).toBe('Company Codes');
    });

    it('should return null for unknown table', () => {
      expect(gen.getTableDefinition('ZCUSTOM_UNKNOWN')).toBeNull();
    });

    it('should have correct field structure', () => {
      const def = gen.getTableDefinition('T001');
      expect(def.keyFields).toBeDefined();
      expect(def.editableFields).toBeDefined();
      expect(def.viewName).toBeDefined();

      const bukrs = def.editableFields.BUKRS;
      expect(bukrs).toBeDefined();
      expect(bukrs.description).toBe('Company Code');
      expect(bukrs.type).toBe('CHAR');
      expect(bukrs.length).toBe(4);
    });
  });

  // ─── getTablesByModule ─────────────────────────────────────────

  describe('getTablesByModule', () => {
    it('should return FI tables', () => {
      const tables = gen.getTablesByModule('FI');
      expect(tables.length).toBeGreaterThanOrEqual(20);
    });

    it('should return CO tables', () => {
      const tables = gen.getTablesByModule('CO');
      expect(tables.length).toBeGreaterThanOrEqual(10);
    });

    it('should return MM tables', () => {
      const tables = gen.getTablesByModule('MM');
      expect(tables.length).toBeGreaterThanOrEqual(15);
    });

    it('should return SD tables', () => {
      const tables = gen.getTablesByModule('SD');
      expect(tables.length).toBeGreaterThanOrEqual(15);
    });

    it('should have correct counts per module', () => {
      const modules = ['FI', 'CO', 'MM', 'SD', 'HR', 'S4'];
      let totalFromModules = 0;
      for (const mod of modules) {
        totalFromModules += gen.getTablesByModule(mod).length;
      }
      expect(totalFromModules).toBe(gen.listKnownTables().length);
    });
  });
});
