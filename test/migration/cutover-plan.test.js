const CutoverPlan = require('../../migration/cutover-plan');

describe('CutoverPlan', () => {
  describe('constructor', () => {
    it('creates an instance with defaults', () => {
      const plan = new CutoverPlan();
      expect(plan).toBeDefined();
      expect(plan.clientName).toBe('SAP Client');
    });

    it('uses custom goLiveDate when provided', () => {
      const plan = new CutoverPlan({ goLiveDate: '2026-06-15' });
      expect(plan.goLiveDate).toBe('2026-06-15');
    });

    it('uses custom clientName when provided', () => {
      const plan = new CutoverPlan({ clientName: 'Acme Corp' });
      expect(plan.clientName).toBe('Acme Corp');
    });

    it('defaults goLiveDate to next Monday', () => {
      const plan = new CutoverPlan();
      const goLive = new Date(plan.goLiveDate);
      // getDay() === 1 means Monday
      expect(goLive.getUTCDay()).toBe(1);
    });
  });

  describe('generate()', () => {
    let result;

    beforeEach(() => {
      const plan = new CutoverPlan({ goLiveDate: '2026-06-15', clientName: 'TestCo' });
      result = plan.generate();
    });

    it('returns phases array', () => {
      expect(Array.isArray(result.phases)).toBe(true);
      expect(result.phases.length).toBeGreaterThan(0);
    });

    it('returns milestones array', () => {
      expect(Array.isArray(result.milestones)).toBe(true);
      expect(result.milestones.length).toBeGreaterThan(0);
    });

    it('returns risks array', () => {
      expect(Array.isArray(result.risks)).toBe(true);
      expect(result.risks.length).toBeGreaterThan(0);
    });

    it('phases have required fields (id, name, tasks)', () => {
      for (const phase of result.phases) {
        expect(phase).toHaveProperty('id');
        expect(phase).toHaveProperty('name');
        expect(phase).toHaveProperty('tasks');
        expect(Array.isArray(phase.tasks)).toBe(true);
        expect(phase.tasks.length).toBeGreaterThan(0);
      }
    });

    it('tasks have required fields (id, name, owner, durationHours)', () => {
      for (const phase of result.phases) {
        for (const task of phase.tasks) {
          expect(task).toHaveProperty('id');
          expect(task).toHaveProperty('name');
          expect(task).toHaveProperty('owner');
          expect(task).toHaveProperty('durationHours');
          expect(typeof task.durationHours).toBe('number');
          expect(task.durationHours).toBeGreaterThan(0);
        }
      }
    });

    it('stats has correct shape', () => {
      expect(result.stats).toHaveProperty('totalPhases');
      expect(result.stats).toHaveProperty('totalTasks');
      expect(result.stats).toHaveProperty('totalHours');
      expect(result.stats).toHaveProperty('totalDays');
      expect(result.stats).toHaveProperty('goLiveDate');
      expect(result.stats).toHaveProperty('cutoverWindowHours');
    });

    it('totalPhases matches phases array length', () => {
      expect(result.stats.totalPhases).toBe(result.phases.length);
    });

    it('totalTasks matches sum of all phase tasks', () => {
      const sumTasks = result.phases.reduce((sum, p) => sum + p.tasks.length, 0);
      expect(result.stats.totalTasks).toBe(sumTasks);
    });

    it('totalHours matches sum of all task durationHours', () => {
      let sumHours = 0;
      for (const phase of result.phases) {
        for (const task of phase.tasks) {
          sumHours += task.durationHours;
        }
      }
      expect(result.stats.totalHours).toBe(sumHours);
    });

    it('uses the custom goLiveDate in stats', () => {
      expect(result.stats.goLiveDate).toBe('2026-06-15');
    });
  });
});
