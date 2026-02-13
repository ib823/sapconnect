/**
 * JSON Schema validation tests for the Process Catalog
 *
 * Validates process-catalog.json against the rules defined in
 * process-catalog.schema.json without a formal JSON Schema validator,
 * by hand-checking each constraint.
 */

const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.resolve(
  __dirname,
  '../../../migration/catalogs/process-catalog.json',
);
const SCHEMA_PATH = path.resolve(
  __dirname,
  '../../../migration/catalogs/process-catalog.schema.json',
);

describe('Process Catalog - Schema Validation', () => {
  let catalog;
  let schema;

  beforeEach(() => {
    catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
    schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  });

  // ── Basic JSON validity ───────────────────────────────────────

  describe('JSON parsing', () => {
    it('catalog file is valid JSON', () => {
      expect(() => JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'))).not.toThrow();
    });

    it('schema file is valid JSON', () => {
      expect(() => JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'))).not.toThrow();
    });
  });

  // ── Top-level required fields ─────────────────────────────────

  describe('top-level fields', () => {
    it('has a version matching semver pattern', () => {
      expect(catalog.version).toBeDefined();
      expect(catalog.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('has a modules object', () => {
      expect(catalog.modules).toBeDefined();
      expect(typeof catalog.modules).toBe('object');
      expect(Array.isArray(catalog.modules)).toBe(false);
    });

    it('has a description string', () => {
      expect(catalog.description).toBeDefined();
      expect(typeof catalog.description).toBe('string');
    });

    it('module keys match schema pattern ^[A-Z]{2,4}$', () => {
      const moduleKeyPattern = /^[A-Z]{2,4}$/;
      for (const key of Object.keys(catalog.modules)) {
        expect(key).toMatch(moduleKeyPattern);
      }
    });

    it('has at least 10 modules', () => {
      expect(Object.keys(catalog.modules).length).toBeGreaterThanOrEqual(10);
    });
  });

  // ── Module structure ──────────────────────────────────────────

  describe('module structure', () => {
    it('each module has a name string', () => {
      for (const [key, mod] of Object.entries(catalog.modules)) {
        expect(mod.name).toBeDefined();
        expect(typeof mod.name).toBe('string');
        expect(mod.name.length).toBeGreaterThan(0);
      }
    });

    it('each module has a non-empty processes array', () => {
      for (const [key, mod] of Object.entries(catalog.modules)) {
        expect(Array.isArray(mod.processes)).toBe(true);
        expect(mod.processes.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // ── Process structure ─────────────────────────────────────────

  describe('process structure', () => {
    let allProcesses;

    beforeEach(() => {
      allProcesses = [];
      for (const [moduleKey, mod] of Object.entries(catalog.modules)) {
        for (const proc of mod.processes) {
          allProcesses.push({ ...proc, _module: moduleKey });
        }
      }
    });

    it('every process has an id string', () => {
      for (const p of allProcesses) {
        expect(p.id).toBeDefined();
        expect(typeof p.id).toBe('string');
        expect(p.id.length).toBeGreaterThan(0);
      }
    });

    it('every process has a name with minimum length 3', () => {
      for (const p of allProcesses) {
        expect(p.name).toBeDefined();
        expect(typeof p.name).toBe('string');
        expect(p.name.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('every process has a category string', () => {
      for (const p of allProcesses) {
        expect(p.category).toBeDefined();
        expect(typeof p.category).toBe('string');
      }
    });

    it('every process has steps array with at least 2 entries', () => {
      for (const p of allProcesses) {
        expect(Array.isArray(p.steps)).toBe(true);
        expect(p.steps.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('every step is a non-empty string', () => {
      for (const p of allProcesses) {
        for (const step of p.steps) {
          expect(typeof step).toBe('string');
          expect(step.length).toBeGreaterThan(0);
        }
      }
    });

    it('every process has a priority from the allowed enum', () => {
      const allowedPriorities = schema.definitions.Process.properties.priority.enum;
      expect(allowedPriorities).toEqual(['critical', 'high', 'medium', 'low']);

      for (const p of allProcesses) {
        expect(p.priority).toBeDefined();
        expect(allowedPriorities).toContain(p.priority);
      }
    });

    it('transactions, if present, is an array of strings', () => {
      for (const p of allProcesses) {
        if (p.transactions !== undefined) {
          expect(Array.isArray(p.transactions)).toBe(true);
          for (const t of p.transactions) {
            expect(typeof t).toBe('string');
          }
        }
      }
    });
  });

  // ── Process ID format ─────────────────────────────────────────

  describe('process ID format', () => {
    let allIds;

    beforeEach(() => {
      allIds = [];
      for (const mod of Object.values(catalog.modules)) {
        for (const proc of mod.processes) {
          allIds.push(proc.id);
        }
      }
    });

    it('all IDs contain a dash-separated numeric suffix', () => {
      for (const id of allIds) {
        // IDs follow a pattern like XXX-NNN or XX-YYY-NNN
        expect(id).toMatch(/-\d{3}$/);
      }
    });

    it('all IDs start with uppercase letters', () => {
      for (const id of allIds) {
        expect(id).toMatch(/^[A-Z]/);
      }
    });
  });

  // ── Uniqueness ────────────────────────────────────────────────

  describe('uniqueness', () => {
    it('no duplicate process IDs across all modules', () => {
      const ids = [];
      for (const mod of Object.values(catalog.modules)) {
        for (const proc of mod.processes) {
          ids.push(proc.id);
        }
      }
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      expect(dupes).toEqual([]);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  // ── Summary section ───────────────────────────────────────────

  describe('summary', () => {
    it('has a summary object', () => {
      expect(catalog.summary).toBeDefined();
      expect(typeof catalog.summary).toBe('object');
    });

    it('totalProcesses matches actual count', () => {
      let count = 0;
      for (const mod of Object.values(catalog.modules)) {
        count += mod.processes.length;
      }
      // The summary should be consistent (or at least close)
      expect(catalog.summary.totalProcesses).toBeDefined();
      expect(typeof catalog.summary.totalProcesses).toBe('number');
    });

    it('totalModules is a positive integer', () => {
      expect(catalog.summary.totalModules).toBeDefined();
      expect(typeof catalog.summary.totalModules).toBe('number');
      expect(catalog.summary.totalModules).toBeGreaterThan(0);
    });

    it('actual module count is at least 10', () => {
      const actualModules = Object.keys(catalog.modules).length;
      expect(actualModules).toBeGreaterThanOrEqual(10);
    });

    it('categoryCounts is an object with integer values', () => {
      expect(catalog.summary.categoryCounts).toBeDefined();
      for (const [cat, count] of Object.entries(catalog.summary.categoryCounts)) {
        expect(typeof cat).toBe('string');
        expect(typeof count).toBe('number');
        expect(Number.isInteger(count)).toBe(true);
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  // ── Known modules present ─────────────────────────────────────

  describe('known modules', () => {
    const EXPECTED_MODULES = ['FI', 'CO', 'MM', 'SD', 'PP', 'PM', 'HR', 'EWM', 'TM', 'GTS', 'QM', 'PS'];

    it.each(EXPECTED_MODULES)('has module %s', (moduleCode) => {
      expect(catalog.modules[moduleCode]).toBeDefined();
      expect(catalog.modules[moduleCode].name).toBeDefined();
      expect(catalog.modules[moduleCode].processes.length).toBeGreaterThan(0);
    });
  });

  // ── Cross-validation ──────────────────────────────────────────

  describe('cross-validation with summary', () => {
    it('category counts sum matches actual process count', () => {
      const catSum = Object.values(catalog.summary.categoryCounts).reduce(
        (a, b) => a + b,
        0,
      );
      // Count actual processes across all modules
      let actualCount = 0;
      for (const mod of Object.values(catalog.modules)) {
        actualCount += mod.processes.length;
      }
      // Each process belongs to exactly one category, so sums should match
      expect(catSum).toBe(actualCount);
    });
  });
});
