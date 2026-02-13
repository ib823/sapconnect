const MigrationObjectRegistry = require('../../../migration/objects/registry');

describe('MigrationObjectRegistry', () => {
  let registry;
  const mockGw = { mode: 'mock' };

  beforeEach(() => {
    registry = new MigrationObjectRegistry();
  });

  it('registers 11 built-in objects', () => {
    const ids = registry.listObjectIds();
    expect(ids).toHaveLength(11);
    expect(ids).toContain('GL_BALANCE');
    expect(ids).toContain('BUSINESS_PARTNER');
    expect(ids).toContain('MATERIAL_MASTER');
    expect(ids).toContain('PURCHASE_ORDER');
    expect(ids).toContain('SALES_ORDER');
    expect(ids).toContain('FIXED_ASSET');
    expect(ids).toContain('COST_CENTER');
    expect(ids).toContain('PROFIT_CENTER');
    expect(ids).toContain('INTERNAL_ORDER');
    expect(ids).toContain('WBS_ELEMENT');
    expect(ids).toContain('INSPECTION_PLAN');
  });

  it('getObject returns cached instance', () => {
    const a = registry.getObject('GL_BALANCE', mockGw);
    const b = registry.getObject('GL_BALANCE', mockGw);
    expect(a).toBe(b);
  });

  it('createObject returns fresh instance', () => {
    const a = registry.createObject('GL_BALANCE', mockGw);
    const b = registry.createObject('GL_BALANCE', mockGw);
    expect(a).not.toBe(b);
  });

  it('throws on unknown object ID', () => {
    expect(() => registry.getObject('NONEXISTENT', mockGw)).toThrow(/Unknown migration object/);
    expect(() => registry.createObject('NONEXISTENT', mockGw)).toThrow(/Unknown migration object/);
  });

  it('listObjects returns metadata', () => {
    const objs = registry.listObjects(mockGw);
    expect(objs).toHaveLength(11);
    expect(objs[0]).toHaveProperty('objectId');
    expect(objs[0]).toHaveProperty('name');
  });

  it('clearCache clears instance cache', () => {
    const a = registry.getObject('GL_BALANCE', mockGw);
    registry.clearCache();
    const b = registry.getObject('GL_BALANCE', mockGw);
    expect(a).not.toBe(b);
  });

  it('runAll runs all 11 objects', async () => {
    const result = await registry.runAll(mockGw);
    expect(result.results).toHaveLength(11);
    expect(result.stats.total).toBe(11);
    expect(result.stats.completed + result.stats.failed).toBe(11);
    expect(result.stats.totalDurationMs).toBeDefined();
  });

  it('runAll results contain expected object IDs', async () => {
    const result = await registry.runAll(mockGw);
    const ids = result.results.map(r => r.objectId);
    expect(ids).toContain('GL_BALANCE');
    expect(ids).toContain('BUSINESS_PARTNER');
    expect(ids).toContain('MATERIAL_MASTER');
  });

  it('supports custom object registration', () => {
    const BaseMigrationObject = require('../../../migration/objects/base-migration-object');
    class CustomObj extends BaseMigrationObject {
      get objectId() { return 'CUSTOM_OBJ'; }
      get name() { return 'Custom'; }
      getFieldMappings() { return [{ source: 'A', target: 'B' }]; }
      _extractMock() { return [{ A: 1 }]; }
    }
    registry.registerClass('CUSTOM_OBJ', CustomObj);
    expect(registry.listObjectIds()).toContain('CUSTOM_OBJ');
    const obj = registry.getObject('CUSTOM_OBJ', mockGw);
    expect(obj.name).toBe('Custom');
  });
});
