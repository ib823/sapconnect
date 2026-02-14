/**
 * Tests for TestEngine — AI-Powered Test Generation Engine
 */

const { TestEngine, TestCatalog, TestingError } = require('../../../lib/testing');

describe('TestEngine', () => {
  // ── Constructor ──────────────────────────────────────────────────────
  describe('Constructor', () => {
    it('should create with default mock mode', () => {
      const engine = new TestEngine({ mode: 'mock' });
      expect(engine.mode).toBe('mock');
      expect(engine.modules).toEqual(['FI', 'MM', 'SD', 'HR', 'CO', 'PP']);
    });

    it('should accept custom modules filter', () => {
      const engine = new TestEngine({ mode: 'mock', modules: ['FI', 'CO'] });
      expect(engine.modules).toEqual(['FI', 'CO']);
    });

    it('should accept live mode', () => {
      const engine = new TestEngine({ mode: 'live' });
      expect(engine.mode).toBe('live');
    });
  });

  // ── generateFromDescription ──────────────────────────────────────────
  describe('generateFromDescription', () => {
    let engine;

    beforeEach(() => {
      engine = new TestEngine({ mode: 'mock' });
    });

    it('should parse FI keywords and generate FI test cases', () => {
      const cases = engine.generateFromDescription('Create a GL posting for journal entry');
      expect(cases.length).toBeGreaterThanOrEqual(2);
      const fiCases = cases.filter(tc => tc.module === 'FI');
      expect(fiCases.length).toBeGreaterThan(0);
    });

    it('should parse MM keywords and generate MM test cases', () => {
      const cases = engine.generateFromDescription('Create a purchase order for vendor');
      const mmCases = cases.filter(tc => tc.module === 'MM');
      expect(mmCases.length).toBeGreaterThan(0);
    });

    it('should parse SD keywords and generate SD test cases', () => {
      const cases = engine.generateFromDescription('Create a sales order and delivery for customer');
      const sdCases = cases.filter(tc => tc.module === 'SD');
      expect(sdCases.length).toBeGreaterThan(0);
    });

    it('should generate 2-5 test cases per description', () => {
      const cases = engine.generateFromDescription('Verify the GL posting and check account balance');
      expect(cases.length).toBeGreaterThanOrEqual(2);
      expect(cases.length).toBeLessThanOrEqual(5);
    });

    it('should produce valid test case structure', () => {
      const cases = engine.generateFromDescription('Post a journal entry to GL account');
      for (const tc of cases) {
        expect(tc.id).toMatch(/^TC-[A-Z]{2}-\d{3}$/);
        expect(tc.name).toBeTruthy();
        expect(tc.type).toBeTruthy();
        expect(tc.module).toBeTruthy();
        expect(tc.priority).toBeTruthy();
        expect(Array.isArray(tc.tags)).toBe(true);
        expect(Array.isArray(tc.steps)).toBe(true);
        expect(tc.steps.length).toBeGreaterThan(0);
        expect(Array.isArray(tc.expectedResults)).toBe(true);
        expect(Array.isArray(tc.preconditions)).toBe(true);
        expect(tc.generatedAt).toBeTruthy();
      }
    });

    it('should generate steps with valid types', () => {
      const validTypes = ['rfc_call', 'bapi_call', 'odata_request', 'table_check', 'field_validation', 'workflow_trigger'];
      const cases = engine.generateFromDescription('Create and approve a purchase order');
      for (const tc of cases) {
        for (const step of tc.steps) {
          expect(validTypes).toContain(step.type);
          expect(step.stepNumber).toBeGreaterThan(0);
          expect(step.action).toBeTruthy();
          expect(step.expectedResult).toBeTruthy();
          expect(step.params).toBeDefined();
        }
      }
    });

    it('should throw on empty/invalid input', () => {
      expect(() => engine.generateFromDescription('')).toThrow(TestingError);
      expect(() => engine.generateFromDescription(null)).toThrow(TestingError);
      expect(() => engine.generateFromDescription(undefined)).toThrow(TestingError);
    });
  });

  // ── generateFromConfig ───────────────────────────────────────────────
  describe('generateFromConfig', () => {
    let engine;

    beforeEach(() => {
      engine = new TestEngine({ mode: 'mock' });
    });

    it('should generate tests from config delta', () => {
      const changes = [
        { table: 'T001', field: 'BUKRS', oldValue: 'OLD', newValue: 'NEW', description: 'Company code change' },
      ];
      const cases = engine.generateFromConfig(changes);
      expect(cases.length).toBe(2); // positive + negative
    });

    it('should generate both positive and negative tests per change', () => {
      const changes = [
        { table: 'BKPF', field: 'BLART', oldValue: 'SA', newValue: 'SK', description: 'Document type change' },
      ];
      const cases = engine.generateFromConfig(changes);
      const positive = cases.filter(tc => tc.name.includes('Positive'));
      const negative = cases.filter(tc => tc.name.includes('Negative'));
      expect(positive.length).toBe(1);
      expect(negative.length).toBe(1);
    });

    it('should handle multiple config changes', () => {
      const changes = [
        { table: 'T001', field: 'BUKRS', oldValue: 'A', newValue: 'B', description: 'Change 1' },
        { table: 'EKKO', field: 'BSART', oldValue: 'NB', newValue: 'ZNB', description: 'Change 2' },
        { table: 'VBAK', field: 'AUART', oldValue: 'OR', newValue: 'ZOR', description: 'Change 3' },
      ];
      const cases = engine.generateFromConfig(changes);
      expect(cases.length).toBe(6); // 2 per change
    });

    it('should validate config change structure', () => {
      expect(() => engine.generateFromConfig([{ description: 'missing table' }])).toThrow(TestingError);
    });

    it('should return empty array for empty changes', () => {
      const cases = engine.generateFromConfig([]);
      expect(cases).toEqual([]);
    });
  });

  // ── generateFromBpmn ─────────────────────────────────────────────────
  describe('generateFromBpmn', () => {
    let engine;

    beforeEach(() => {
      engine = new TestEngine({ mode: 'mock' });
    });

    it('should generate test cases from parsed BPMN model', () => {
      const bpmnModel = {
        tasks: [
          { id: 't1', name: 'Create Purchase Order', type: 'userTask' },
          { id: 't2', name: 'Approve PO', type: 'userTask' },
          { id: 't3', name: 'Post Goods Receipt', type: 'serviceTask' },
        ],
        gateways: [],
        flows: [],
      };
      const cases = engine.generateFromBpmn(bpmnModel);
      expect(cases.length).toBeGreaterThan(0);
      expect(cases[0].type).toBe('e2e');
    });

    it('should produce one test case per unique path through the process', () => {
      const bpmnModel = {
        tasks: [
          { id: 't1', name: 'Submit Invoice', type: 'userTask' },
          { id: 't2', name: 'Auto Check', type: 'serviceTask' },
        ],
        gateways: [],
        flows: [],
      };
      const cases = engine.generateFromBpmn(bpmnModel);
      expect(cases.length).toBe(1);
      expect(cases[0].steps.length).toBe(2);
    });

    it('should create multiple test scenarios from gateway branches', () => {
      const bpmnModel = {
        tasks: [
          { id: 't1', name: 'Submit Order', type: 'userTask' },
          { id: 't2', name: 'Approve', type: 'userTask' },
          { id: 't3', name: 'Reject', type: 'userTask' },
          { id: 't4', name: 'Process Order', type: 'serviceTask' },
        ],
        gateways: [
          { id: 'g1', name: 'Approval Decision', type: 'exclusive' },
        ],
        flows: [
          { from: 't1', to: 'g1' },
          { from: 'g1', to: 't2' },
          { from: 'g1', to: 't3' },
          { from: 't2', to: 't4' },
        ],
      };
      const cases = engine.generateFromBpmn(bpmnModel);
      expect(cases.length).toBeGreaterThanOrEqual(2);
    });

    it('should map BPMN tasks to appropriate test step types', () => {
      const bpmnModel = {
        tasks: [
          { id: 't1', name: 'Manual Data Entry', type: 'userTask' },
          { id: 't2', name: 'Call BAPI', type: 'serviceTask' },
        ],
        gateways: [],
        flows: [],
      };
      const cases = engine.generateFromBpmn(bpmnModel);
      expect(cases[0].steps[0].type).toBe('field_validation'); // userTask
      expect(cases[0].steps[1].type).toBe('bapi_call'); // serviceTask
    });

    it('should return empty array for model with no tasks', () => {
      const cases = engine.generateFromBpmn({ tasks: [], gateways: [], flows: [] });
      expect(cases).toEqual([]);
    });
  });

  // ── generateRegressionSuite ──────────────────────────────────────────
  describe('generateRegressionSuite', () => {
    let engine;

    beforeEach(() => {
      engine = new TestEngine({ mode: 'mock' });
    });

    it('should generate FI smoke regression suite', () => {
      const cases = engine.generateRegressionSuite('FI', 'smoke');
      expect(cases.length).toBeGreaterThan(0);
      for (const tc of cases) {
        expect(tc.module).toBe('FI');
        expect(tc.type).toBe('smoke');
      }
    });

    it('should generate MM standard regression suite', () => {
      const cases = engine.generateRegressionSuite('MM', 'standard');
      expect(cases.length).toBeGreaterThan(0);
      // Standard includes smoke + standard patterns
      const smokeOnly = engine.generateRegressionSuite('MM', 'smoke');
      expect(cases.length).toBeGreaterThan(smokeOnly.length);
    });

    it('should generate SD comprehensive regression suite', () => {
      const cases = engine.generateRegressionSuite('SD', 'comprehensive');
      expect(cases.length).toBeGreaterThan(0);
      for (const tc of cases) {
        expect(tc.module).toBe('SD');
      }
    });

    it('should return valid test cases with required fields', () => {
      const cases = engine.generateRegressionSuite('CO', 'smoke');
      for (const tc of cases) {
        expect(tc.id).toMatch(/^TC-CO-\d{3}$/);
        expect(tc.name).toBeTruthy();
        expect(tc.type).toBeTruthy();
        expect(tc.module).toBe('CO');
        expect(tc.priority).toBeTruthy();
        expect(tc.steps.length).toBeGreaterThan(0);
        expect(tc.generatedAt).toBeTruthy();
      }
    });

    it('should have valid step types in all generated cases', () => {
      const validTypes = ['rfc_call', 'bapi_call', 'odata_request', 'table_check', 'field_validation', 'workflow_trigger'];
      for (const mod of ['FI', 'MM', 'SD', 'HR', 'CO', 'PP']) {
        const cases = engine.generateRegressionSuite(mod, 'standard');
        for (const tc of cases) {
          for (const step of tc.steps) {
            expect(validTypes).toContain(step.type);
          }
        }
      }
    });

    it('should throw on unknown module', () => {
      expect(() => engine.generateRegressionSuite('XX', 'smoke')).toThrow(TestingError);
    });

    it('should filter by scope level', () => {
      const smoke = engine.generateRegressionSuite('FI', 'smoke');
      const standard = engine.generateRegressionSuite('FI', 'standard');
      expect(standard.length).toBeGreaterThanOrEqual(smoke.length);
    });
  });

  // ── Test Case Structure ──────────────────────────────────────────────
  describe('Test Case Structure', () => {
    let engine;

    beforeEach(() => {
      engine = new TestEngine({ mode: 'mock' });
    });

    it('should have required fields on all generated cases', () => {
      const cases = engine.generateFromDescription('Create a sales order and verify pricing');
      for (const tc of cases) {
        expect(tc).toHaveProperty('id');
        expect(tc).toHaveProperty('name');
        expect(tc).toHaveProperty('type');
        expect(tc).toHaveProperty('module');
        expect(tc).toHaveProperty('priority');
        expect(tc).toHaveProperty('tags');
        expect(tc).toHaveProperty('steps');
        expect(tc).toHaveProperty('expectedResults');
        expect(tc).toHaveProperty('preconditions');
        expect(tc).toHaveProperty('generatedAt');
      }
    });

    it('should generate unique IDs across all test cases', () => {
      const cases1 = engine.generateFromDescription('Post GL entry in finance');
      const cases2 = engine.generateRegressionSuite('MM', 'smoke');
      const allIds = [...cases1, ...cases2].map(tc => tc.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('should include ISO timestamps on all cases', () => {
      const cases = engine.generateRegressionSuite('PP', 'smoke');
      for (const tc of cases) {
        expect(tc.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(() => new Date(tc.generatedAt)).not.toThrow();
      }
    });
  });
});
