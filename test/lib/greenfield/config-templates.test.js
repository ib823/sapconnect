/**
 * Tests for Configuration Template Library
 */

const { ConfigTemplateLibrary, TEMPLATES } = require('../../../lib/greenfield/config-templates');

describe('ConfigTemplateLibrary', () => {
  let lib;

  beforeEach(() => {
    lib = new ConfigTemplateLibrary({ mode: 'mock' });
  });

  // ─── Constructor ────────────────────────────────────────────────

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(lib).toBeInstanceOf(ConfigTemplateLibrary);
    });

    it('should default mode to mock', () => {
      const defaultLib = new ConfigTemplateLibrary();
      expect(defaultLib.mode).toBe('mock');
    });

    it('should store config options', () => {
      const custom = new ConfigTemplateLibrary({ mode: 'live' });
      expect(custom.mode).toBe('live');
    });
  });

  // ─── getTemplate ───────────────────────────────────────────────

  describe('getTemplate', () => {
    it('should return fi_co_basic template', () => {
      const t = lib.getTemplate('fi_co_basic');
      expect(t).not.toBeNull();
      expect(t.id).toBe('fi_co_basic');
      expect(t.module).toBe('FI');
    });

    it('should return mm_basic template', () => {
      const t = lib.getTemplate('mm_basic');
      expect(t).not.toBeNull();
      expect(t.id).toBe('mm_basic');
      expect(t.module).toBe('MM');
    });

    it('should return sd_basic template', () => {
      const t = lib.getTemplate('sd_basic');
      expect(t).not.toBeNull();
      expect(t.id).toBe('sd_basic');
      expect(t.module).toBe('SD');
    });

    it('should return s4_mandatory template', () => {
      const t = lib.getTemplate('s4_mandatory');
      expect(t).not.toBeNull();
      expect(t.id).toBe('s4_mandatory');
      expect(t.module).toBe('S4');
    });

    it('should return null for unknown template', () => {
      expect(lib.getTemplate('nonexistent')).toBeNull();
    });
  });

  // ─── listTemplates ─────────────────────────────────────────────

  describe('listTemplates', () => {
    it('should return 4 templates', () => {
      const list = lib.listTemplates();
      expect(list).toHaveLength(4);
    });

    it('should include required fields in each entry', () => {
      const list = lib.listTemplates();
      for (const t of list) {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('name');
        expect(t).toHaveProperty('module');
        expect(t).toHaveProperty('projectType');
        expect(t).toHaveProperty('settingCount');
        expect(t).toHaveProperty('variableCount');
      }
    });

    it('should report correct setting counts', () => {
      const list = lib.listTemplates();
      const fiCo = list.find(t => t.id === 'fi_co_basic');
      expect(fiCo.settingCount).toBeGreaterThanOrEqual(40);
      const mm = list.find(t => t.id === 'mm_basic');
      expect(mm.settingCount).toBeGreaterThanOrEqual(30);
    });

    it('should report correct variable counts', () => {
      const list = lib.listTemplates();
      const fiCo = list.find(t => t.id === 'fi_co_basic');
      expect(fiCo.variableCount).toBeGreaterThan(0);
      const s4 = list.find(t => t.id === 's4_mandatory');
      expect(s4.variableCount).toBeGreaterThan(0);
    });
  });

  // ─── instantiate ───────────────────────────────────────────────

  describe('instantiate', () => {
    const fiCoVars = {
      company_code: '1000',
      company_name: 'ACME Corporation',
      city: 'New York',
      country: 'US',
      currency: 'USD',
      language: 'EN',
      chart_of_accounts: 'CAUS',
      chart_of_accounts_name: 'US Chart of Accounts',
      fiscal_year_variant: 'K4',
      controlling_area: '1000',
      controlling_area_name: 'US Controlling',
      cost_center_hierarchy: 'STDHIER',
      bank_account_number: '123456789',
    };

    it('should fill variables in fi_co_basic', () => {
      const settings = lib.instantiate('fi_co_basic', fiCoVars);
      expect(settings.length).toBeGreaterThanOrEqual(40);
      const companyCode = settings.find(s => s.sequence === 'company_code');
      expect(companyCode.data.BUKRS).toBe('1000');
      expect(companyCode.data.BUTXT).toBe('ACME Corporation');
    });

    it('should fill variables in mm_basic', () => {
      const mmVars = {
        plant_code: '1000',
        plant_name: 'Main Plant',
        company_code: '1000',
        country: 'US',
        purchasing_org: '1000',
        purchasing_org_name: 'US Purchasing',
      };
      const settings = lib.instantiate('mm_basic', mmVars);
      const plant = settings.find(s => s.sequence === 'plant');
      expect(plant.data.WERKS).toBe('1000');
      expect(plant.data.NAME1).toBe('Main Plant');
    });

    it('should throw on missing required variable', () => {
      expect(() => lib.instantiate('fi_co_basic', { company_code: '1000' }))
        .toThrow('Variable validation failed');
    });

    it('should throw on pattern mismatch', () => {
      const badVars = { ...fiCoVars, company_code: 'toolong123' };
      expect(() => lib.instantiate('fi_co_basic', badVars))
        .toThrow('Variable validation failed');
    });

    it('should return settings array ready for BDC', () => {
      const settings = lib.instantiate('fi_co_basic', fiCoVars);
      for (const s of settings) {
        expect(s).toHaveProperty('sequence');
        expect(s).toHaveProperty('data');
        expect(s).toHaveProperty('order');
        expect(typeof s.data).toBe('object');
      }
    });

    it('should preserve order from template', () => {
      const settings = lib.instantiate('fi_co_basic', fiCoVars);
      for (let i = 1; i < settings.length; i++) {
        expect(settings[i].order).toBeGreaterThanOrEqual(settings[i - 1].order);
      }
    });

    it('should resolve dependencies correctly', () => {
      const settings = lib.instantiate('fi_co_basic', fiCoVars);
      const sequenceNames = settings.map(s => s.sequence);
      for (const s of settings) {
        for (const dep of s.dependencies) {
          const depIndex = sequenceNames.indexOf(dep);
          const currentIndex = sequenceNames.indexOf(s.sequence);
          // If dep is found, it should appear before current
          if (depIndex >= 0) {
            expect(depIndex).toBeLessThan(currentIndex);
          }
        }
      }
    });

    it('should throw for unknown template', () => {
      expect(() => lib.instantiate('nonexistent', {})).toThrow('Unknown template');
    });
  });

  // ─── validateVariables ─────────────────────────────────────────

  describe('validateVariables', () => {
    it('should pass with all required variables', () => {
      const result = lib.validateVariables('fi_co_basic', {
        company_code: '1000',
        company_name: 'ACME Corporation',
        country: 'US',
        currency: 'USD',
        language: 'EN',
        chart_of_accounts: 'CAUS',
        fiscal_year_variant: 'K4',
        controlling_area: '1000',
        cost_center_hierarchy: 'STDHIER',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when missing required variable', () => {
      const result = lib.validateVariables('fi_co_basic', {
        company_code: '1000',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail on bad pattern', () => {
      const result = lib.validateVariables('fi_co_basic', {
        company_code: 'TOOLONG',
        company_name: 'X',
        country: 'US',
        currency: 'USD',
        language: 'EN',
        chart_of_accounts: 'CAUS',
        fiscal_year_variant: 'K4',
        controlling_area: '1000',
        cost_center_hierarchy: 'STDHIER',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('company_code'))).toBe(true);
    });

    it('should return specific error messages', () => {
      const result = lib.validateVariables('fi_co_basic', {});
      expect(result.errors.length).toBeGreaterThan(0);
      for (const err of result.errors) {
        expect(err).toContain('Missing required variable');
      }
    });

    it('should handle optional variables gracefully', () => {
      const result = lib.validateVariables('fi_co_basic', {
        company_code: '1000',
        company_name: 'ACME',
        country: 'US',
        currency: 'USD',
        language: 'EN',
        chart_of_accounts: 'CAUS',
        fiscal_year_variant: 'K4',
        controlling_area: '1000',
        cost_center_hierarchy: 'STDHIER',
        // optional fields omitted
      });
      expect(result.valid).toBe(true);
    });
  });

  // ─── getDependencyOrder ────────────────────────────────────────

  describe('getDependencyOrder', () => {
    it('should order fi_co_basic before mm_basic', () => {
      const order = lib.getDependencyOrder(['fi_co_basic', 'mm_basic']);
      expect(order.indexOf('fi_co_basic')).toBeLessThan(order.indexOf('mm_basic'));
    });

    it('should order mm_basic before sd_basic', () => {
      const order = lib.getDependencyOrder(['fi_co_basic', 'mm_basic', 'sd_basic']);
      expect(order.indexOf('mm_basic')).toBeLessThan(order.indexOf('sd_basic'));
    });

    it('should handle single template', () => {
      const order = lib.getDependencyOrder(['fi_co_basic']);
      expect(order).toEqual(['fi_co_basic']);
    });

    it('should detect missing dependency', () => {
      // mm_basic depends on fi_co_basic
      expect(() => lib.getDependencyOrder(['mm_basic']))
        .toThrow('depends on');
    });
  });

  // ─── getSettingsByModule ───────────────────────────────────────

  describe('getSettingsByModule', () => {
    it('should group fi_co_basic settings correctly', () => {
      const groups = lib.getSettingsByModule('fi_co_basic');
      expect(Object.keys(groups).length).toBeGreaterThan(0);
      // Should have FI and CO groups at minimum
      expect(groups['FI']).toBeDefined();
      expect(groups['CO']).toBeDefined();
    });

    it('should handle template with mixed modules', () => {
      const groups = lib.getSettingsByModule('fi_co_basic');
      const totalSettings = Object.values(groups).reduce((sum, arr) => sum + arr.length, 0);
      const template = lib.getTemplate('fi_co_basic');
      expect(totalSettings).toBe(template.settings.length);
    });

    it('should return all settings across groups', () => {
      const groups = lib.getSettingsByModule('mm_basic');
      const totalSettings = Object.values(groups).reduce((sum, arr) => sum + arr.length, 0);
      const template = lib.getTemplate('mm_basic');
      expect(totalSettings).toBe(template.settings.length);
    });
  });

  // ─── estimateEffort ────────────────────────────────────────────

  describe('estimateEffort', () => {
    it('should return correct total count', () => {
      const effort = lib.estimateEffort('fi_co_basic');
      const template = lib.getTemplate('fi_co_basic');
      expect(effort.totalSettings).toBe(template.settings.length);
    });

    it('should estimate minutes', () => {
      const effort = lib.estimateEffort('fi_co_basic');
      expect(effort.estimatedMinutes).toBeGreaterThan(0);
    });

    it('should account for manual items', () => {
      const effort = lib.estimateEffort('fi_co_basic');
      expect(effort.automated + effort.manual).toBe(effort.totalSettings);
      expect(effort.manual).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── Template content validation ──────────────────────────────

  describe('template content validation', () => {
    it('fi_co_basic should have 40+ settings', () => {
      const t = lib.getTemplate('fi_co_basic');
      expect(t.settings.length).toBeGreaterThanOrEqual(40);
    });

    it('mm_basic should have 30+ settings', () => {
      const t = lib.getTemplate('mm_basic');
      expect(t.settings.length).toBeGreaterThanOrEqual(30);
    });

    it('sd_basic should have 30+ settings', () => {
      const t = lib.getTemplate('sd_basic');
      expect(t.settings.length).toBeGreaterThanOrEqual(30);
    });

    it('s4_mandatory should have 15 settings', () => {
      const t = lib.getTemplate('s4_mandatory');
      expect(t.settings.length).toBeGreaterThanOrEqual(15);
    });

    it('all settings should have sequence field', () => {
      for (const templateId of Object.keys(TEMPLATES)) {
        const t = lib.getTemplate(templateId);
        for (const s of t.settings) {
          expect(s.sequence).toBeDefined();
          expect(typeof s.sequence).toBe('string');
          expect(s.sequence.length).toBeGreaterThan(0);
        }
      }
    });

    it('all settings should have required flag', () => {
      for (const templateId of Object.keys(TEMPLATES)) {
        const t = lib.getTemplate(templateId);
        for (const s of t.settings) {
          expect(typeof s.required).toBe('boolean');
        }
      }
    });

    it('all settings should have order', () => {
      for (const templateId of Object.keys(TEMPLATES)) {
        const t = lib.getTemplate(templateId);
        for (const s of t.settings) {
          expect(typeof s.order).toBe('number');
          expect(s.order).toBeGreaterThan(0);
        }
      }
    });

    it('all variables should have type and description', () => {
      for (const templateId of Object.keys(TEMPLATES)) {
        const t = lib.getTemplate(templateId);
        for (const [name, def] of Object.entries(t.variables)) {
          expect(def.type).toBeDefined();
          expect(def.description).toBeDefined();
          expect(def.description.length).toBeGreaterThan(0);
        }
      }
    });

    it('dependency ordering should be consistent within each template', () => {
      for (const templateId of Object.keys(TEMPLATES)) {
        const t = lib.getTemplate(templateId);
        const sequenceNames = t.settings.map(s => s.sequence);
        for (const s of t.settings) {
          for (const dep of s.dependencies) {
            const depIdx = sequenceNames.indexOf(dep);
            const curIdx = sequenceNames.indexOf(s.sequence);
            if (depIdx >= 0) {
              expect(depIdx).toBeLessThan(curIdx);
            }
          }
        }
      }
    });

    it('should have no circular dependencies among templates', () => {
      // If all 4 templates can be topologically sorted, no cycles exist
      const allIds = Object.keys(TEMPLATES);
      expect(() => lib.getDependencyOrder(allIds)).not.toThrow();
    });

    it('all settings should have data object', () => {
      for (const templateId of Object.keys(TEMPLATES)) {
        const t = lib.getTemplate(templateId);
        for (const s of t.settings) {
          expect(typeof s.data).toBe('object');
          expect(s.data).not.toBeNull();
        }
      }
    });

    it('all settings should have description', () => {
      for (const templateId of Object.keys(TEMPLATES)) {
        const t = lib.getTemplate(templateId);
        for (const s of t.settings) {
          expect(typeof s.description).toBe('string');
          expect(s.description.length).toBeGreaterThan(0);
        }
      }
    });

    it('all settings should have table reference', () => {
      for (const templateId of Object.keys(TEMPLATES)) {
        const t = lib.getTemplate(templateId);
        for (const s of t.settings) {
          expect(typeof s.table).toBe('string');
          expect(s.table.length).toBeGreaterThan(0);
        }
      }
    });

    it('all settings should have dependencies array', () => {
      for (const templateId of Object.keys(TEMPLATES)) {
        const t = lib.getTemplate(templateId);
        for (const s of t.settings) {
          expect(Array.isArray(s.dependencies)).toBe(true);
        }
      }
    });

    it('all settings should have variables array', () => {
      for (const templateId of Object.keys(TEMPLATES)) {
        const t = lib.getTemplate(templateId);
        for (const s of t.settings) {
          expect(Array.isArray(s.variables)).toBe(true);
        }
      }
    });
  });
});
