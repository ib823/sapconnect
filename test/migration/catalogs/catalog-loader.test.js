/**
 * Tests for Process Catalog Loader
 */

const {
  loadCatalog,
  getAllProcesses,
  getProcessesByModule,
  getProcessesByCategory,
  getProcessesByPriority,
  getProcessById,
  getModuleCodes,
  getSummary,
  clearCache,
} = require('../../../migration/catalogs');

describe('Catalog Loader', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('loadCatalog', () => {
    it('returns catalog object with modules property', () => {
      const catalog = loadCatalog();
      expect(catalog).toBeDefined();
      expect(catalog.modules).toBeDefined();
      expect(typeof catalog.modules).toBe('object');
    });

    it('caches result (second call returns same reference)', () => {
      const first = loadCatalog();
      const second = loadCatalog();
      expect(first).toBe(second);
    });
  });

  describe('clearCache', () => {
    it('forces reload on next call', () => {
      const first = loadCatalog();
      clearCache();
      const second = loadCatalog();
      // After clearing cache, a new object is parsed from JSON
      // They should be deeply equal but not the same reference
      expect(second).not.toBe(first);
      expect(second.modules).toBeDefined();
    });
  });

  describe('getAllProcesses', () => {
    it('returns array with module field added', () => {
      const processes = getAllProcesses();
      expect(Array.isArray(processes)).toBe(true);
      for (const proc of processes) {
        expect(proc.module).toBeDefined();
        expect(typeof proc.module).toBe('string');
      }
    });

    it('returns 40+ processes', () => {
      const processes = getAllProcesses();
      expect(processes.length).toBeGreaterThanOrEqual(40);
    });
  });

  describe('getProcessesByModule', () => {
    it('returns FI processes for module FI', () => {
      const fiProcesses = getProcessesByModule('FI');
      expect(fiProcesses.length).toBeGreaterThan(0);
      for (const proc of fiProcesses) {
        expect(proc.module).toBe('FI');
      }
    });

    it('returns empty array for nonexistent module', () => {
      const result = getProcessesByModule('NONEXISTENT');
      expect(result).toEqual([]);
    });

    it('is case-insensitive for module code', () => {
      const upper = getProcessesByModule('FI');
      const lower = getProcessesByModule('fi');
      expect(upper.length).toBe(lower.length);
    });
  });

  describe('getProcessesByCategory', () => {
    it('returns matching processes for Order to Cash', () => {
      const otcProcesses = getProcessesByCategory('Order to Cash');
      expect(otcProcesses.length).toBeGreaterThan(0);
      for (const proc of otcProcesses) {
        expect(proc.category.toLowerCase()).toBe('order to cash');
      }
    });

    it('returns empty array for nonexistent category', () => {
      const result = getProcessesByCategory('Nonexistent Category');
      expect(result).toEqual([]);
    });
  });

  describe('getProcessesByPriority', () => {
    it('returns critical processes', () => {
      const critical = getProcessesByPriority('critical');
      expect(critical.length).toBeGreaterThan(0);
      for (const proc of critical) {
        expect(proc.priority).toBe('critical');
      }
    });

    it('returns empty array for nonexistent priority', () => {
      const result = getProcessesByPriority('nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('getProcessById', () => {
    it('returns process with valid ID', () => {
      const proc = getProcessById('OTC-001');
      expect(proc).toBeDefined();
      expect(proc.id).toBe('OTC-001');
      expect(proc.name).toBeDefined();
    });

    it('returns null for invalid ID', () => {
      const result = getProcessById('INVALID-999');
      expect(result).toBeNull();
    });
  });

  describe('getModuleCodes', () => {
    it('returns array of module codes', () => {
      const codes = getModuleCodes();
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
      expect(codes).toContain('FI');
    });
  });

  describe('getSummary', () => {
    it('returns totalProcesses, totalModules, byPriority, byModule', () => {
      const summary = getSummary();
      expect(typeof summary.totalProcesses).toBe('number');
      expect(summary.totalProcesses).toBeGreaterThan(0);
      expect(typeof summary.totalModules).toBe('number');
      expect(summary.totalModules).toBeGreaterThan(0);
      expect(summary.byPriority).toBeDefined();
      expect(typeof summary.byPriority.critical).toBe('number');
      expect(typeof summary.byPriority.high).toBe('number');
      expect(typeof summary.byPriority.medium).toBe('number');
      expect(typeof summary.byPriority.low).toBe('number');
      expect(summary.byModule).toBeDefined();
      expect(typeof summary.byModule.FI).toBe('number');
    });

    it('totalProcesses matches getAllProcesses length', () => {
      const summary = getSummary();
      const all = getAllProcesses();
      expect(summary.totalProcesses).toBe(all.length);
    });

    it('totalModules matches getModuleCodes length', () => {
      const summary = getSummary();
      const codes = getModuleCodes();
      expect(summary.totalModules).toBe(codes.length);
    });
  });

  describe('process data integrity', () => {
    it('each process has required fields: id, name, category, steps, priority', () => {
      const processes = getAllProcesses();
      for (const proc of processes) {
        expect(proc.id).toBeDefined();
        expect(typeof proc.id).toBe('string');
        expect(proc.name).toBeDefined();
        expect(typeof proc.name).toBe('string');
        expect(proc.category).toBeDefined();
        expect(typeof proc.category).toBe('string');
        expect(Array.isArray(proc.steps)).toBe(true);
        expect(proc.steps.length).toBeGreaterThan(0);
        expect(proc.priority).toBeDefined();
        expect(['critical', 'high', 'medium', 'low']).toContain(proc.priority);
      }
    });
  });
});
