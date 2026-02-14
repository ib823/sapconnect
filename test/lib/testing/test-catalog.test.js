/**
 * Tests for TestCatalog — Pre-Built Test Template Catalog
 */

const { TestCatalog, TestingError } = require('../../../lib/testing');

describe('TestCatalog', () => {
  // ── TEST_CATALOG ─────────────────────────────────────────────────────
  describe('TEST_CATALOG', () => {
    it('should have at least 30 templates', () => {
      expect(TestCatalog.TEST_CATALOG.length).toBeGreaterThanOrEqual(30);
    });

    it('should have all modules represented (FI, CO, MM, SD, PP, HR)', () => {
      const modules = new Set(TestCatalog.TEST_CATALOG.map(t => t.module));
      expect(modules.has('FI')).toBe(true);
      expect(modules.has('CO')).toBe(true);
      expect(modules.has('MM')).toBe(true);
      expect(modules.has('SD')).toBe(true);
      expect(modules.has('PP')).toBe(true);
      expect(modules.has('HR')).toBe(true);
    });

    it('should have multiple test types present', () => {
      const types = new Set(TestCatalog.TEST_CATALOG.map(t => t.type));
      expect(types.size).toBeGreaterThanOrEqual(3);
      // At least e2e and integration should be present
      expect(types.has('e2e')).toBe(true);
      expect(types.has('integration')).toBe(true);
    });

    it('should have valid structure on all templates', () => {
      for (const t of TestCatalog.TEST_CATALOG) {
        expect(t.id).toMatch(/^TPL-[A-Z]{2}-\d{3}$/);
        expect(t.module).toBeTruthy();
        expect(t.name).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.type).toBeTruthy();
        expect(t.priority).toBeTruthy();
        expect(Array.isArray(t.steps)).toBe(true);
        expect(t.steps.length).toBeGreaterThan(0);
        expect(Array.isArray(t.variables)).toBe(true);

        for (const step of t.steps) {
          expect(step.stepNumber).toBeGreaterThan(0);
          expect(step.action).toBeTruthy();
          expect(step.type).toBeTruthy();
          expect(step.expectedResult).toBeTruthy();
        }
      }
    });

    it('should have unique IDs across all templates', () => {
      const ids = TestCatalog.TEST_CATALOG.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // ── getTemplate ──────────────────────────────────────────────────────
  describe('getTemplate', () => {
    it('should return template by ID', () => {
      const template = TestCatalog.getTemplate('TPL-FI-001');
      expect(template.id).toBe('TPL-FI-001');
      expect(template.module).toBe('FI');
      expect(template.name).toContain('GL Posting');
    });

    it('should throw TestingError for unknown ID', () => {
      expect(() => TestCatalog.getTemplate('TPL-XX-999')).toThrow(TestingError);
    });

    it('should return template with all required fields', () => {
      const template = TestCatalog.getTemplate('TPL-MM-001');
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('module');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('type');
      expect(template).toHaveProperty('priority');
      expect(template).toHaveProperty('steps');
      expect(template).toHaveProperty('variables');
    });
  });

  // ── listTemplates ────────────────────────────────────────────────────
  describe('listTemplates', () => {
    it('should list all templates when no filter', () => {
      const templates = TestCatalog.listTemplates();
      expect(templates.length).toBe(TestCatalog.TEST_CATALOG.length);
    });

    it('should filter by module', () => {
      const templates = TestCatalog.listTemplates({ module: 'FI' });
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.module).toBe('FI');
      }
    });

    it('should filter by type', () => {
      const templates = TestCatalog.listTemplates({ type: 'e2e' });
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.type).toBe('e2e');
      }
    });

    it('should filter by priority', () => {
      const templates = TestCatalog.listTemplates({ priority: 'critical' });
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.priority).toBe('critical');
      }
    });

    it('should support multiple filters combined', () => {
      const templates = TestCatalog.listTemplates({ module: 'FI', priority: 'critical' });
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.module).toBe('FI');
        expect(t.priority).toBe('critical');
      }
    });
  });

  // ── instantiate ──────────────────────────────────────────────────────
  describe('instantiate', () => {
    it('should fill variable placeholders with provided values', () => {
      const testCase = TestCatalog.instantiate('TPL-FI-001', {
        companyCode: '2000',
        docType: 'SK',
        postingDate: '20260101',
        debitAccount: '100000',
        creditAccount: '200000',
        amount: '5000',
      });
      // Check that placeholders are replaced
      const json = JSON.stringify(testCase);
      expect(json).not.toContain('{{');
      expect(json).toContain('2000');
      expect(json).toContain('SK');
      expect(json).toContain('100000');
    });

    it('should throw when required variables are missing', () => {
      expect(() => TestCatalog.instantiate('TPL-FI-001', {
        companyCode: '1000',
        // Missing: docType (has default), postingDate (required, no default), debitAccount, creditAccount, amount
      })).toThrow(TestingError);
    });

    it('should preserve non-variable text', () => {
      const testCase = TestCatalog.instantiate('TPL-MM-002', {
        poNumber: '4500000001',
        quantity: 100,
      });
      // Static text should remain
      expect(testCase.name).toContain('Goods Receipt');
      expect(testCase.module).toBe('MM');
      expect(testCase.type).toBe('e2e');
    });

    it('should handle multiple variables in the same string', () => {
      const testCase = TestCatalog.instantiate('TPL-CO-002', {
        senderCC: 'CC100',
        receiverCC: 'CC200',
        activityType: 'ACT01',
        quantity: 50,
      });
      const step2Json = JSON.stringify(testCase.steps[1]);
      expect(step2Json).toContain('CC100');
      expect(step2Json).toContain('CC200');
    });

    it('should return a complete test case with metadata', () => {
      const testCase = TestCatalog.instantiate('TPL-SD-003', {
        delivery: '8000000001',
      });
      expect(testCase.id).toBe('TPL-SD-003');
      expect(testCase.name).toBeTruthy();
      expect(testCase.type).toBeTruthy();
      expect(testCase.module).toBe('SD');
      expect(testCase.generatedAt).toBeTruthy();
      expect(testCase.templateId).toBe('TPL-SD-003');
      expect(Array.isArray(testCase.steps)).toBe(true);
      expect(Array.isArray(testCase.expectedResults)).toBe(true);
      expect(Array.isArray(testCase.preconditions)).toBe(true);
    });
  });

  // ── validateTestCase ─────────────────────────────────────────────────
  describe('validateTestCase', () => {
    it('should pass a valid test case', () => {
      const result = TestCatalog.validateTestCase({
        id: 'TC-FI-001',
        name: 'Test GL Posting',
        type: 'e2e',
        steps: [{ stepNumber: 1, action: 'Post document', type: 'bapi_call', params: {}, expectedResult: 'Document posted' }],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when ID is missing', () => {
      const result = TestCatalog.validateTestCase({
        name: 'Test',
        type: 'e2e',
        steps: [{ stepNumber: 1, action: 'Do thing', type: 'rfc_call', params: {}, expectedResult: 'Done' }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('id'))).toBe(true);
    });

    it('should fail when steps is missing', () => {
      const result = TestCatalog.validateTestCase({
        id: 'TC-FI-001',
        name: 'Test',
        type: 'e2e',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('steps'))).toBe(true);
    });

    it('should fail when steps array is empty', () => {
      const result = TestCatalog.validateTestCase({
        id: 'TC-FI-001',
        name: 'Test',
        type: 'e2e',
        steps: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('at least 1'))).toBe(true);
    });
  });

  // ── categorize ───────────────────────────────────────────────────────
  describe('categorize', () => {
    const sampleCases = [
      { id: 'TC-1', module: 'FI', type: 'e2e', priority: 'critical' },
      { id: 'TC-2', module: 'FI', type: 'unit', priority: 'high' },
      { id: 'TC-3', module: 'MM', type: 'e2e', priority: 'critical' },
      { id: 'TC-4', module: 'SD', type: 'smoke', priority: 'medium' },
    ];

    it('should group test cases by module', () => {
      const { byModule } = TestCatalog.categorize(sampleCases);
      expect(Object.keys(byModule)).toContain('FI');
      expect(Object.keys(byModule)).toContain('MM');
      expect(Object.keys(byModule)).toContain('SD');
      expect(byModule.FI.length).toBe(2);
      expect(byModule.MM.length).toBe(1);
    });

    it('should group test cases by type', () => {
      const { byType } = TestCatalog.categorize(sampleCases);
      expect(byType.e2e.length).toBe(2);
      expect(byType.unit.length).toBe(1);
      expect(byType.smoke.length).toBe(1);
    });

    it('should group test cases by priority', () => {
      const { byPriority } = TestCatalog.categorize(sampleCases);
      expect(byPriority.critical.length).toBe(2);
      expect(byPriority.high.length).toBe(1);
      expect(byPriority.medium.length).toBe(1);
    });
  });
});
