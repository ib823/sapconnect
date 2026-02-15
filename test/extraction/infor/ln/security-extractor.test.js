/**
 * Tests for Infor LN Security Extractor
 */
const InforLNSecurityExtractor = require('../../../../extraction/infor/ln/security-extractor');
const ExtractionContext = require('../../../../extraction/extraction-context');

describe('InforLNSecurityExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNSecurityExtractor(ctx);
    expect(ext.extractorId).toBe('INFOR_LN_SECURITY');
    expect(ext.name).toBe('Infor LN Security Configuration');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNSecurityExtractor(ctx);
    const result = await ext.extract();
    expect(result.users).toBeDefined();
    expect(result.users.length).toBeGreaterThan(0);
    expect(result.roles).toBeDefined();
    expect(result.roles.length).toBeGreaterThan(0);
    expect(result.roleAssignments).toBeDefined();
    expect(result.sodViolations).toBeDefined();
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new InforLNSecurityExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThan(0);
    expect(tables.some(t => t.table === 'ttaad1100')).toBe(true);
  });
});
