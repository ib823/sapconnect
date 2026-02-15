/**
 * Tests for Migration Source Router
 */
const { SourceRouter, SOURCE_OBJECT_MAP } = require('../../migration/source-router');

describe('SourceRouter', () => {
  let router;

  beforeEach(() => {
    router = new SourceRouter();
  });

  describe('SOURCE_OBJECT_MAP', () => {
    it('should define mappings for SAP, INFOR_M3, INFOR_LN, SYTELINE', () => {
      expect(SOURCE_OBJECT_MAP).toHaveProperty('SAP');
      expect(SOURCE_OBJECT_MAP).toHaveProperty('INFOR_M3');
      expect(SOURCE_OBJECT_MAP).toHaveProperty('INFOR_LN');
      expect(SOURCE_OBJECT_MAP).toHaveProperty('SYTELINE');
    });

    it('should have SAP with the most objects', () => {
      const sapCount = SOURCE_OBJECT_MAP.SAP.length;
      expect(sapCount).toBeGreaterThan(30);
      expect(sapCount).toBeGreaterThan(SOURCE_OBJECT_MAP.INFOR_M3.length);
      expect(sapCount).toBeGreaterThan(SOURCE_OBJECT_MAP.INFOR_LN.length);
    });

    it('should have common objects across all sources', () => {
      const commonObjects = ['GL_BALANCE', 'BUSINESS_PARTNER', 'MATERIAL_MASTER', 'PURCHASE_ORDER', 'SALES_ORDER'];
      for (const source of Object.keys(SOURCE_OBJECT_MAP)) {
        for (const obj of commonObjects) {
          expect(SOURCE_OBJECT_MAP[source]).toContain(obj);
        }
      }
    });
  });

  describe('getObjectIds', () => {
    it('should return SAP object IDs', () => {
      const ids = router.getObjectIds('SAP');
      expect(ids).toContain('GL_BALANCE');
      expect(ids).toContain('MATERIAL_MASTER');
      expect(ids).toContain('BUSINESS_PARTNER');
      expect(ids.length).toBeGreaterThan(30);
    });

    it('should return INFOR_M3 object IDs', () => {
      const ids = router.getObjectIds('INFOR_M3');
      expect(ids).toContain('GL_BALANCE');
      expect(ids).toContain('MATERIAL_MASTER');
      expect(ids.length).toBeGreaterThan(10);
    });

    it('should be case-insensitive', () => {
      const ids = router.getObjectIds('sap');
      expect(ids.length).toBeGreaterThan(0);
    });

    it('should throw for unknown source system', () => {
      expect(() => router.getObjectIds('ORACLE')).toThrow('Unknown source system');
    });

    it('should return a copy (not the original array)', () => {
      const ids1 = router.getObjectIds('SAP');
      const ids2 = router.getObjectIds('SAP');
      expect(ids1).toEqual(ids2);
      expect(ids1).not.toBe(ids2);
    });
  });

  describe('listSourceSystems', () => {
    it('should list all supported source systems', () => {
      const systems = router.listSourceSystems();
      expect(systems).toContain('SAP');
      expect(systems).toContain('INFOR_M3');
      expect(systems).toContain('INFOR_LN');
      expect(systems).toContain('SYTELINE');
    });
  });

  describe('getSourceSummary', () => {
    it('should return summary for SAP', () => {
      const summary = router.getSourceSummary('SAP');
      expect(summary.sourceSystem).toBe('SAP');
      expect(summary.objectCount).toBeGreaterThan(30);
      expect(summary.objectIds).toContain('GL_BALANCE');
    });

    it('should return summary for INFOR_M3', () => {
      const summary = router.getSourceSummary('INFOR_M3');
      expect(summary.sourceSystem).toBe('INFOR_M3');
      expect(summary.objectCount).toBeGreaterThan(10);
    });
  });

  describe('createObject', () => {
    it('should create a migration object for SAP', () => {
      const gateway = { mode: 'mock' };
      const obj = router.createObject('SAP', 'GL_BALANCE', gateway);
      expect(obj).toBeDefined();
      expect(obj.objectId).toBe('GL_BALANCE');
    });

    it('should create a migration object for INFOR_M3', () => {
      const gateway = { mode: 'mock' };
      const obj = router.createObject('INFOR_M3', 'MATERIAL_MASTER', gateway);
      expect(obj).toBeDefined();
      expect(obj.objectId).toBe('MATERIAL_MASTER');
    });

    it('should throw for invalid object ID on a source system', () => {
      const gateway = { mode: 'mock' };
      // SYTELINE doesn't have INSPECTION_PLAN
      expect(() => router.createObject('SYTELINE', 'INSPECTION_PLAN', gateway)).toThrow('not available');
    });

    it('should throw for unknown source system', () => {
      const gateway = { mode: 'mock' };
      expect(() => router.createObject('UNKNOWN', 'GL_BALANCE', gateway)).toThrow('Unknown source system');
    });
  });

  describe('runMigration', () => {
    it('should run migration for a subset of objects', async () => {
      const gateway = { mode: 'mock' };
      const result = await router.runMigration('SAP', gateway, {
        objectIds: ['GL_BALANCE', 'MATERIAL_MASTER'],
        parallel: false,
      });
      expect(result.results).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.stats.total).toBe(2);
    });

    it('should filter objectIds to valid ones for source system', async () => {
      const gateway = { mode: 'mock' };
      // INSPECTION_PLAN is NOT available for SYTELINE
      const result = await router.runMigration('SYTELINE', gateway, {
        objectIds: ['GL_BALANCE', 'INSPECTION_PLAN'],
        parallel: false,
      });
      // Only GL_BALANCE should run
      expect(result.stats.total).toBe(1);
    });

    it('should handle parallel execution', async () => {
      const gateway = { mode: 'mock' };
      const result = await router.runMigration('SYTELINE', gateway, {
        objectIds: ['GL_BALANCE', 'MATERIAL_MASTER'],
        parallel: true,
      });
      expect(result.stats.total).toBe(2);
    });
  });
});
