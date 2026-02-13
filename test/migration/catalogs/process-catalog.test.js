/**
 * Tests for Process Catalog Loader
 */

const catalog = require('../../../migration/catalogs');

describe('Process Catalog', () => {
  afterEach(() => {
    catalog.clearCache();
  });

  describe('loadCatalog', () => {
    it('should load the full catalog', () => {
      const data = catalog.loadCatalog();
      expect(data).toBeDefined();
      expect(data.version).toBe('1.0.0');
      expect(data.modules).toBeDefined();
      expect(typeof data.modules).toBe('object');
    });

    it('should cache after first load', () => {
      const first = catalog.loadCatalog();
      const second = catalog.loadCatalog();
      expect(first).toBe(second);
    });
  });

  describe('getAllProcesses', () => {
    it('should return all processes with module codes', () => {
      const all = catalog.getAllProcesses();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThanOrEqual(40);
    });

    it('should include module code on each process', () => {
      const all = catalog.getAllProcesses();
      for (const p of all) {
        expect(p.module).toBeDefined();
        expect(p.id).toBeDefined();
        expect(p.name).toBeDefined();
        expect(p.category).toBeDefined();
        expect(Array.isArray(p.steps)).toBe(true);
        expect(p.steps.length).toBeGreaterThanOrEqual(2);
        expect(p.priority).toBeDefined();
      }
    });
  });

  describe('getProcessesByModule', () => {
    it('should return FI processes', () => {
      const fi = catalog.getProcessesByModule('FI');
      expect(fi.length).toBeGreaterThan(5);
      for (const p of fi) {
        expect(p.module).toBe('FI');
      }
    });

    it('should return MM processes', () => {
      const mm = catalog.getProcessesByModule('MM');
      expect(mm.length).toBeGreaterThan(3);
    });

    it('should return empty for unknown module', () => {
      const none = catalog.getProcessesByModule('XYZ');
      expect(none).toEqual([]);
    });

    it('should be case-insensitive', () => {
      const fi = catalog.getProcessesByModule('fi');
      expect(fi.length).toBeGreaterThan(0);
    });
  });

  describe('getProcessesByCategory', () => {
    it('should find Order to Cash processes', () => {
      const otc = catalog.getProcessesByCategory('Order to Cash');
      expect(otc.length).toBeGreaterThanOrEqual(2);
    });

    it('should find Procure to Pay processes', () => {
      const ptp = catalog.getProcessesByCategory('Procure to Pay');
      expect(ptp.length).toBeGreaterThanOrEqual(2);
    });

    it('should be case-insensitive', () => {
      const otc = catalog.getProcessesByCategory('order to cash');
      expect(otc.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getProcessesByPriority', () => {
    it('should return critical processes', () => {
      const critical = catalog.getProcessesByPriority('critical');
      expect(critical.length).toBeGreaterThan(5);
      for (const p of critical) {
        expect(p.priority).toBe('critical');
      }
    });

    it('should return high priority processes', () => {
      const high = catalog.getProcessesByPriority('high');
      expect(high.length).toBeGreaterThan(5);
    });
  });

  describe('getProcessById', () => {
    it('should find OTC-001', () => {
      const p = catalog.getProcessById('OTC-001');
      expect(p).not.toBeNull();
      expect(p.name).toContain('Order to Cash');
    });

    it('should find PTP-001', () => {
      const p = catalog.getProcessById('PTP-001');
      expect(p).not.toBeNull();
      expect(p.name).toContain('Procure to Pay');
    });

    it('should return null for unknown ID', () => {
      expect(catalog.getProcessById('FAKE-999')).toBeNull();
    });
  });

  describe('getModuleCodes', () => {
    it('should return all module codes', () => {
      const codes = catalog.getModuleCodes();
      expect(codes).toContain('FI');
      expect(codes).toContain('CO');
      expect(codes).toContain('MM');
      expect(codes).toContain('SD');
      expect(codes).toContain('PP');
      expect(codes).toContain('PM');
      expect(codes).toContain('HR');
      expect(codes.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('getSummary', () => {
    it('should return summary stats', () => {
      const summary = catalog.getSummary();
      expect(summary.totalProcesses).toBeGreaterThanOrEqual(40);
      expect(summary.totalModules).toBeGreaterThanOrEqual(10);
      expect(summary.byPriority).toBeDefined();
      expect(summary.byPriority.critical).toBeGreaterThan(0);
      expect(summary.byModule).toBeDefined();
      expect(summary.byModule.FI).toBeGreaterThan(0);
    });
  });

  describe('clearCache', () => {
    it('should clear the cached catalog', () => {
      const first = catalog.loadCatalog();
      catalog.clearCache();
      const second = catalog.loadCatalog();
      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });
  });
});
