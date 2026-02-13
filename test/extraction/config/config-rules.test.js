/**
 * Tests for Configuration Interpretation Rules
 */

const CONFIG_RULES = require('../../../extraction/config/config-rules');

describe('CONFIG_RULES', () => {
  describe('structure', () => {
    it('should be an array', () => {
      expect(Array.isArray(CONFIG_RULES)).toBe(true);
    });

    it('should have at least 5 rules', () => {
      expect(CONFIG_RULES.length).toBeGreaterThanOrEqual(5);
    });

    it('should have exactly 9 rules', () => {
      expect(CONFIG_RULES).toHaveLength(9);
    });

    it('each rule has all required fields', () => {
      const requiredFields = ['ruleId', 'description', 'tables', 'condition', 'interpretation', 'impact', 's4hanaRelevance'];
      for (const rule of CONFIG_RULES) {
        for (const field of requiredFields) {
          expect(rule).toHaveProperty(field);
        }
      }
    });

    it('each rule has a string ruleId', () => {
      for (const rule of CONFIG_RULES) {
        expect(typeof rule.ruleId).toBe('string');
        expect(rule.ruleId.length).toBeGreaterThan(0);
      }
    });

    it('each rule has a string description', () => {
      for (const rule of CONFIG_RULES) {
        expect(typeof rule.description).toBe('string');
        expect(rule.description.length).toBeGreaterThan(0);
      }
    });

    it('each rule has a non-empty tables array of strings', () => {
      for (const rule of CONFIG_RULES) {
        expect(Array.isArray(rule.tables)).toBe(true);
        expect(rule.tables.length).toBeGreaterThan(0);
        for (const table of rule.tables) {
          expect(typeof table).toBe('string');
        }
      }
    });

    it('condition is a function for each rule', () => {
      for (const rule of CONFIG_RULES) {
        expect(typeof rule.condition).toBe('function');
      }
    });

    it('interpretation is a function for each rule', () => {
      for (const rule of CONFIG_RULES) {
        expect(typeof rule.interpretation).toBe('function');
      }
    });

    it('impact is a non-empty string for each rule', () => {
      for (const rule of CONFIG_RULES) {
        expect(typeof rule.impact).toBe('string');
        expect(rule.impact.length).toBeGreaterThan(0);
      }
    });

    it('s4hanaRelevance is a non-empty string for each rule', () => {
      for (const rule of CONFIG_RULES) {
        expect(typeof rule.s4hanaRelevance).toBe('string');
        expect(rule.s4hanaRelevance.length).toBeGreaterThan(0);
      }
    });

    it('each ruleId is unique', () => {
      const ids = CONFIG_RULES.map(r => r.ruleId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('FI-COCD-001 — Company Code Configuration', () => {
    let rule;

    beforeEach(() => {
      rule = CONFIG_RULES.find(r => r.ruleId === 'FI-COCD-001');
    });

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should reference table T001', () => {
      expect(rule.tables).toContain('T001');
    });

    it('condition returns true when companyCodes has entries', () => {
      const data = { companyCodes: [{ BUKRS: '1000', BUTXT: 'Main Company' }] };
      expect(rule.condition(data)).toBe(true);
    });

    it('condition returns false when companyCodes is empty', () => {
      expect(rule.condition({ companyCodes: [] })).toBe(false);
    });

    it('condition returns falsy when companyCodes is missing', () => {
      expect(rule.condition({})).toBeFalsy();
    });

    it('condition returns falsy when companyCodes is undefined', () => {
      expect(rule.condition({ companyCodes: undefined })).toBeFalsy();
    });

    it('interpretation returns formatted string with single company code', () => {
      const data = { companyCodes: [{ BUKRS: '1000', BUTXT: 'Main Company' }] };
      const result = rule.interpretation(data);
      expect(result).toContain('1 company code(s) configured');
      expect(result).toContain('1000');
      expect(result).toContain('Main Company');
    });

    it('interpretation returns formatted string with multiple company codes', () => {
      const data = {
        companyCodes: [
          { BUKRS: '1000', BUTXT: 'Main Co' },
          { BUKRS: '2000', BUTXT: 'Second Co' },
          { BUKRS: '3000', BUTXT: 'Third Co' },
        ],
      };
      const result = rule.interpretation(data);
      expect(result).toContain('3 company code(s) configured');
      expect(result).toContain('1000');
      expect(result).toContain('2000');
      expect(result).toContain('3000');
    });

    it('interpretation uses BUKRS as fallback when BUTXT is missing', () => {
      const data = { companyCodes: [{ BUKRS: '5000' }] };
      const result = rule.interpretation(data);
      expect(result).toContain('5000 (5000)');
    });

    it('interpretation handles empty companyCodes gracefully', () => {
      const result = rule.interpretation({ companyCodes: [] });
      expect(result).toContain('0 company code(s) configured');
    });

    it('interpretation handles missing companyCodes gracefully', () => {
      const result = rule.interpretation({});
      expect(result).toContain('0 company code(s) configured');
    });
  });

  describe('CO-AREA-001 — Controlling Area Setup', () => {
    let rule;

    beforeEach(() => {
      rule = CONFIG_RULES.find(r => r.ruleId === 'CO-AREA-001');
    });

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should reference table TKA01', () => {
      expect(rule.tables).toContain('TKA01');
    });

    it('condition returns true when controllingAreas has entries', () => {
      const data = { controllingAreas: [{ KOKRS: '1000', WAERS: 'USD' }] };
      expect(rule.condition(data)).toBe(true);
    });

    it('condition returns false when controllingAreas is empty', () => {
      expect(rule.condition({ controllingAreas: [] })).toBe(false);
    });

    it('condition returns falsy when controllingAreas is missing', () => {
      expect(rule.condition({})).toBeFalsy();
    });

    it('interpretation includes controlling area code and currency', () => {
      const data = { controllingAreas: [{ KOKRS: '1000', WAERS: 'EUR' }] };
      const result = rule.interpretation(data);
      expect(result).toContain('1 controlling area(s)');
      expect(result).toContain('1000');
      expect(result).toContain('EUR');
    });

    it('interpretation handles multiple controlling areas', () => {
      const data = {
        controllingAreas: [
          { KOKRS: '1000', WAERS: 'EUR' },
          { KOKRS: '2000', WAERS: 'USD' },
        ],
      };
      const result = rule.interpretation(data);
      expect(result).toContain('2 controlling area(s)');
      expect(result).toContain('1000');
      expect(result).toContain('2000');
    });

    it('interpretation shows N/A when currency is missing', () => {
      const data = { controllingAreas: [{ KOKRS: '3000' }] };
      const result = rule.interpretation(data);
      expect(result).toContain('N/A');
    });
  });

  describe('MM-PLANT-001 — Plant Configuration', () => {
    let rule;

    beforeEach(() => {
      rule = CONFIG_RULES.find(r => r.ruleId === 'MM-PLANT-001');
    });

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('should reference table T001W', () => {
      expect(rule.tables).toContain('T001W');
    });

    it('condition returns true when plants has entries', () => {
      const data = { plants: [{ WERKS: '1000', NAME1: 'Main Plant' }] };
      expect(rule.condition(data)).toBe(true);
    });

    it('condition returns false when plants is empty', () => {
      expect(rule.condition({ plants: [] })).toBe(false);
    });

    it('condition returns falsy when plants is missing', () => {
      expect(rule.condition({})).toBeFalsy();
    });

    it('interpretation includes plant code and name', () => {
      const data = { plants: [{ WERKS: '1000', NAME1: 'Main Plant' }] };
      const result = rule.interpretation(data);
      expect(result).toContain('1 plant(s) configured');
      expect(result).toContain('1000');
      expect(result).toContain('Main Plant');
    });

    it('interpretation handles multiple plants', () => {
      const data = {
        plants: [
          { WERKS: '1000', NAME1: 'Plant A' },
          { WERKS: '2000', NAME1: 'Plant B' },
        ],
      };
      const result = rule.interpretation(data);
      expect(result).toContain('2 plant(s) configured');
    });

    it('interpretation uses WERKS as fallback when NAME1 is missing', () => {
      const data = { plants: [{ WERKS: '4000' }] };
      const result = rule.interpretation(data);
      expect(result).toContain('4000 (4000)');
    });
  });

  describe('FI-DOC-SPLIT-001 — Document Splitting', () => {
    let rule;

    beforeEach(() => {
      rule = CONFIG_RULES.find(r => r.ruleId === 'FI-DOC-SPLIT-001');
    });

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('condition returns true when documentSplitting has entries', () => {
      expect(rule.condition({ documentSplitting: [{ SPLIT_ACTIVE: 'X' }] })).toBe(true);
    });

    it('condition returns false when documentSplitting is empty', () => {
      expect(rule.condition({ documentSplitting: [] })).toBe(false);
    });

    it('interpretation indicates active splitting when SPLIT_ACTIVE is X', () => {
      const data = { documentSplitting: [{ SPLIT_ACTIVE: 'X' }] };
      const result = rule.interpretation(data);
      expect(result).toContain('Document splitting is active');
      expect(result).toContain('Active splitting rules found');
    });

    it('interpretation indicates splitting may not be active when SPLIT_ACTIVE is not X', () => {
      const data = { documentSplitting: [{ SPLIT_ACTIVE: '' }] };
      const result = rule.interpretation(data);
      expect(result).toContain('may not be active');
    });
  });

  describe('FI-LEDGER-001 — Ledger Configuration', () => {
    let rule;

    beforeEach(() => {
      rule = CONFIG_RULES.find(r => r.ruleId === 'FI-LEDGER-001');
    });

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('condition returns true when ledgerConfig has entries', () => {
      expect(rule.condition({ ledgerConfig: [{ RLDNR: '0L' }] })).toBe(true);
    });

    it('interpretation includes ledger number and name', () => {
      const data = { ledgerConfig: [{ RLDNR: '0L', NAME: 'Leading Ledger' }] };
      const result = rule.interpretation(data);
      expect(result).toContain('1 ledger(s) configured');
      expect(result).toContain('0L');
      expect(result).toContain('Leading Ledger');
    });

    it('interpretation uses "no name" when NAME is missing', () => {
      const data = { ledgerConfig: [{ RLDNR: '0L' }] };
      const result = rule.interpretation(data);
      expect(result).toContain('no name');
    });
  });

  describe('SEC-SAPALL-001 — Users with SAP_ALL', () => {
    let rule;

    beforeEach(() => {
      rule = CONFIG_RULES.find(r => r.ruleId === 'SEC-SAPALL-001');
    });

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('condition returns true when usersWithSapAll has entries', () => {
      expect(rule.condition({ usersWithSapAll: [{ BNAME: 'ADMIN' }] })).toBe(true);
    });

    it('interpretation includes WARNING and user count', () => {
      const data = { usersWithSapAll: [{ BNAME: 'ADMIN' }, { BNAME: 'DEVUSER' }] };
      const result = rule.interpretation(data);
      expect(result).toContain('WARNING');
      expect(result).toContain('2 user(s)');
      expect(result).toContain('ADMIN');
      expect(result).toContain('DEVUSER');
    });
  });

  describe('INT-RFC-001 — RFC Destinations', () => {
    let rule;

    beforeEach(() => {
      rule = CONFIG_RULES.find(r => r.ruleId === 'INT-RFC-001');
    });

    it('should exist', () => {
      expect(rule).toBeDefined();
    });

    it('condition returns true when rfcDestinations has entries', () => {
      expect(rule.condition({ rfcDestinations: [{ RFCTYPE: '3' }] })).toBe(true);
    });

    it('interpretation groups RFC destinations by type', () => {
      const data = {
        rfcDestinations: [
          { RFCTYPE: '3' },
          { RFCTYPE: '3' },
          { RFCTYPE: 'H' },
        ],
      };
      const result = rule.interpretation(data);
      expect(result).toContain('3 RFC destination(s)');
      expect(result).toContain('Type 3: 2');
      expect(result).toContain('Type H: 1');
    });

    it('interpretation defaults to type U when RFCTYPE is missing', () => {
      const data = { rfcDestinations: [{}] };
      const result = rule.interpretation(data);
      expect(result).toContain('Type U: 1');
    });
  });
});
