const CutoverPlanner = require('../../../migration/cloud-alm/cutover-planner');

describe('CutoverPlanner', () => {
  let planner;

  beforeEach(() => { planner = new CutoverPlanner(); });

  const mockConfig = {
    projectId: 'PRJ-001',
    name: 'Test Migration',
    modules: ['FI', 'CO', 'MM', 'SD'],
  };

  const mockResults = [
    { objectId: 'GL_BALANCE', phases: { extract: { recordCount: 30 } }, status: 'completed' },
    { objectId: 'BUSINESS_PARTNER', phases: { extract: { recordCount: 80 } }, status: 'completed' },
  ];

  // ── generatePlan ───────────────────────────────────────────

  describe('generatePlan', () => {
    it('returns complete plan structure', () => {
      const plan = planner.generatePlan(mockConfig, mockResults);
      expect(plan.projectId).toBe('PRJ-001');
      expect(plan.generatedAt).toBeDefined();
      expect(plan.summary).toBeDefined();
      expect(plan.tasks).toBeInstanceOf(Array);
      expect(plan.criticalPath).toBeInstanceOf(Array);
      expect(plan.checklist).toBeInstanceOf(Array);
      expect(plan.rollback).toBeDefined();
    });

    it('has 19+ base tasks', () => {
      const plan = planner.generatePlan(mockConfig, []);
      expect(plan.tasks.length).toBeGreaterThanOrEqual(19);
    });

    it('adds object-specific tasks from results', () => {
      const plan = planner.generatePlan(mockConfig, mockResults);
      const objTasks = plan.tasks.filter(t => t.name.startsWith('Verify ') && t.name.includes('records'));
      expect(objTasks.length).toBe(2);
    });

    it('summary includes total duration', () => {
      const plan = planner.generatePlan(mockConfig, mockResults);
      expect(plan.summary.totalDurationHrs).toBeGreaterThan(0);
      expect(plan.summary.totalTasks).toBe(plan.tasks.length);
    });
  });

  // ── tasks ──────────────────────────────────────────────────

  describe('tasks', () => {
    it('each task has required fields', () => {
      const plan = planner.generatePlan(mockConfig, []);
      for (const task of plan.tasks) {
        expect(task.id).toBeDefined();
        expect(task.phase).toBeDefined();
        expect(task.name).toBeDefined();
        expect(task.durationHrs).toBeDefined();
        expect(task.dependencies).toBeInstanceOf(Array);
        expect(task.priority).toBeDefined();
        expect(task.status).toBe('planned');
      }
    });

    it('covers all 5 phases', () => {
      const plan = planner.generatePlan(mockConfig, []);
      const phases = new Set(plan.tasks.map(t => t.phase));
      expect(phases.has('PREP')).toBe(true);
      expect(phases.has('MIGRATE')).toBe(true);
      expect(phases.has('VALIDATE')).toBe(true);
      expect(phases.has('TEST')).toBe(true);
      expect(phases.has('GOLIVE')).toBe(true);
    });

    it('first task has no dependencies', () => {
      const plan = planner.generatePlan(mockConfig, []);
      expect(plan.tasks[0].dependencies).toHaveLength(0);
    });

    it('critical tasks include backup, migration, reconciliation, go-live', () => {
      const plan = planner.generatePlan(mockConfig, []);
      const critical = plan.tasks.filter(t => t.priority === 'critical');
      expect(critical.length).toBeGreaterThanOrEqual(10);
    });
  });

  // ── critical path ──────────────────────────────────────────

  describe('critical path', () => {
    it('contains task IDs', () => {
      const plan = planner.generatePlan(mockConfig, []);
      expect(plan.criticalPath.length).toBeGreaterThan(0);
      expect(plan.criticalPath.every(id => typeof id === 'number')).toBe(true);
    });

    it('critical path duration <= total duration', () => {
      const plan = planner.generatePlan(mockConfig, []);
      expect(plan.summary.criticalPathHrs).toBeLessThanOrEqual(plan.summary.totalDurationHrs);
    });
  });

  // ── checklist ──────────────────────────────────────────────

  describe('checklist', () => {
    it('has 15 items', () => {
      const plan = planner.generatePlan(mockConfig, []);
      expect(plan.checklist).toHaveLength(15);
    });

    it('items have id, category, item, mandatory, status', () => {
      const plan = planner.generatePlan(mockConfig, []);
      for (const item of plan.checklist) {
        expect(item.id).toBeDefined();
        expect(item.category).toBeDefined();
        expect(item.item).toBeDefined();
        expect(typeof item.mandatory).toBe('boolean');
        expect(item.status).toBe('pending');
      }
    });

    it('covers data, testing, technical, and organization', () => {
      const plan = planner.generatePlan(mockConfig, []);
      const categories = new Set(plan.checklist.map(c => c.category));
      expect(categories.has('Data')).toBe(true);
      expect(categories.has('Testing')).toBe(true);
      expect(categories.has('Technical')).toBe(true);
      expect(categories.has('Organization')).toBe(true);
    });

    it('most items are mandatory', () => {
      const plan = planner.generatePlan(mockConfig, []);
      const mandatory = plan.checklist.filter(c => c.mandatory);
      expect(mandatory.length).toBeGreaterThanOrEqual(12);
    });
  });

  // ── rollback plan ──────────────────────────────────────────

  describe('rollback plan', () => {
    it('has trigger criteria', () => {
      const plan = planner.generatePlan(mockConfig, []);
      expect(plan.rollback.triggerCriteria.length).toBeGreaterThanOrEqual(3);
    });

    it('has 8 rollback steps', () => {
      const plan = planner.generatePlan(mockConfig, []);
      expect(plan.rollback.steps).toHaveLength(8);
    });

    it('steps are sequenced', () => {
      const plan = planner.generatePlan(mockConfig, []);
      for (let i = 0; i < plan.rollback.steps.length; i++) {
        expect(plan.rollback.steps[i].seq).toBe(i + 1);
      }
    });

    it('has total rollback time', () => {
      const plan = planner.generatePlan(mockConfig, []);
      expect(plan.rollback.totalRollbackTimeMin).toBeGreaterThan(0);
    });

    it('has max decision window', () => {
      const plan = planner.generatePlan(mockConfig, []);
      expect(plan.rollback.maxDecisionWindowHrs).toBe(4);
    });
  });

  // ── summary phases ─────────────────────────────────────────

  describe('summary phases', () => {
    it('breaks down tasks by phase', () => {
      const plan = planner.generatePlan(mockConfig, []);
      expect(plan.summary.phases.PREP).toBeDefined();
      expect(plan.summary.phases.MIGRATE).toBeDefined();
      expect(plan.summary.phases.VALIDATE).toBeDefined();
      expect(plan.summary.phases.TEST).toBeDefined();
      expect(plan.summary.phases.GOLIVE).toBeDefined();
    });

    it('each phase has count and duration', () => {
      const plan = planner.generatePlan(mockConfig, []);
      for (const phase of Object.values(plan.summary.phases)) {
        expect(phase.count).toBeGreaterThan(0);
        expect(phase.durationHrs).toBeDefined();
      }
    });
  });
});
