const SecurityExtractor = require('../../../extraction/extractors/security-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('SecurityExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SecurityExtractor(ctx);
    expect(ext.extractorId).toBe('SECURITY');
    expect(ext.name).toBe('Security & Authorization Model');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('security');
  });

  it('should extract mock data with all result keys', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SecurityExtractor(ctx);
    const result = await ext.extract();
    expect(result.users).toBeDefined();
    expect(result.users.length).toBeGreaterThan(0);
    expect(result.userKeys).toBeDefined();
    expect(result.roleDefinitions).toBeDefined();
    expect(result.roleDefinitions.length).toBeGreaterThan(0);
    expect(result.roleAuthValues).toBeDefined();
    expect(result.roleUserAssignments).toBeDefined();
    expect(result.roleTcodes).toBeDefined();
    expect(result.roleTexts).toBeDefined();
    expect(result.roleProfiles).toBeDefined();
    expect(result.userProfiles).toBeDefined();
    expect(result.checkIndicators).toBeDefined();
    expect(result.defaultAuthValues).toBeDefined();
    expect(result.userGroups).toBeDefined();
  });

  it('should include analysis with usersWithSapAll', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SecurityExtractor(ctx);
    const result = await ext.extract();
    expect(result.analysis).toBeDefined();
    expect(result.analysis.usersWithSapAll).toBeDefined();
    expect(Array.isArray(result.analysis.usersWithSapAll)).toBe(true);
    expect(result.analysis.usersWithSapAll.length).toBeGreaterThan(0);
  });

  it('should include analysis with unusedRoles', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SecurityExtractor(ctx);
    const result = await ext.extract();
    expect(result.analysis.unusedRoles).toBeDefined();
    expect(Array.isArray(result.analysis.unusedRoles)).toBe(true);
    expect(result.analysis.unusedRoles.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SecurityExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(13);
    expect(tables.find(t => t.table === 'USR02')).toBeDefined();
    expect(tables.find(t => t.table === 'AGR_DEFINE')).toBeDefined();
    expect(tables.find(t => t.table === 'AGR_USERS')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new SecurityExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should be registered in ExtractorRegistry', () => {
    const ExtractorRegistry = require('../../../extraction/extractor-registry');
    const cls = ExtractorRegistry.get('SECURITY');
    expect(cls).toBe(SecurityExtractor);
  });
});
