/**
 * Tests for Archiving Advisor Extractor.
 */

const ArchivingAdvisorExtractor = require('../../../extraction/extractors/archiving-advisor');
const ExtractorRegistry = require('../../../extraction/extractor-registry');

// Minimal mock context
function createMockContext() {
  return {
    mode: 'mock',
    coverage: {
      markTable: vi.fn(),
      getReport: vi.fn().mockReturnValue({}),
    },
    getTableReader: vi.fn(),
  };
}

describe('ArchivingAdvisorExtractor', () => {
  it('should be registered in ExtractorRegistry', () => {
    const all = ExtractorRegistry.getAll();
    const found = all.find(e => e.id === 'ARCHIVING_ADVISOR');
    expect(found).toBeDefined();
  });

  it('should have correct identity', () => {
    const ctx = createMockContext();
    const extractor = new ArchivingAdvisorExtractor(ctx);
    expect(extractor.extractorId).toBe('ARCHIVING_ADVISOR');
    expect(extractor.name).toBe('Archiving Advisor');
    expect(extractor.module).toBe('CROSS');
    expect(extractor.category).toBe('advisory');
  });

  it('should declare expected tables', () => {
    const ctx = createMockContext();
    const extractor = new ArchivingAdvisorExtractor(ctx);
    const tables = extractor.getExpectedTables();
    expect(tables.length).toBeGreaterThan(20);
    expect(tables).toContain('BKPF');
    expect(tables).toContain('BSEG');
    expect(tables).toContain('COEP');
    expect(tables).toContain('VBAK');
    expect(tables).toContain('CDHDR');
  });

  describe('mock extraction', () => {
    let result;

    beforeAll(async () => {
      const ctx = createMockContext();
      const extractor = new ArchivingAdvisorExtractor(ctx);
      result = await extractor._extractMock();
    });

    it('should return stats', () => {
      expect(result.stats).toBeDefined();
      expect(result.stats.totalRecords).toBeGreaterThan(0);
      expect(result.stats.archivableRecords).toBeGreaterThan(0);
      expect(result.stats.reductionPercent).toBeGreaterThan(0);
      expect(result.stats.archivingObjects).toBeGreaterThan(0);
    });

    it('should return recommendations sorted by impact', () => {
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(5);

      // Should be sorted by archivableRecords descending
      for (let i = 1; i < result.recommendations.length; i++) {
        expect(result.recommendations[i - 1].archivableRecords)
          .toBeGreaterThanOrEqual(result.recommendations[i].archivableRecords);
      }
    });

    it('should include expected fields in each recommendation', () => {
      for (const rec of result.recommendations) {
        expect(rec.archivingObject).toBeDefined();
        expect(rec.name).toBeDefined();
        expect(rec.category).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.tables).toBeDefined();
        expect(rec.totalRecords).toBeGreaterThan(0);
        expect(rec.archivableRecords).toBeGreaterThanOrEqual(0);
        expect(rec.archivablePercent).toBeGreaterThan(0);
        expect(rec.retentionYears).toBeGreaterThan(0);
        expect(rec.action).toBeDefined();
        expect(rec.estimatedSizeReductionMB).toBeGreaterThanOrEqual(0);
      }
    });

    it('should identify high-priority archiving candidates', () => {
      const highPriority = result.recommendations.filter(r => r.priority === 'high');
      expect(highPriority.length).toBeGreaterThanOrEqual(1);
    });

    it('should categorize actions correctly', () => {
      const actions = new Set(result.recommendations.map(r => r.action));
      // At least some should recommend archiving before migration
      const strongActions = result.recommendations.filter(r =>
        r.action === 'ARCHIVE_BEFORE_MIGRATION' || r.action === 'ARCHIVE_RECOMMENDED'
      );
      expect(strongActions.length).toBeGreaterThan(0);
    });

    it('should generate a summary', () => {
      expect(result.summary).toBeDefined();
      expect(result.summary.headline).toContain('candidates for archiving');
      expect(result.summary.estimatedSavingsMB).toBeGreaterThan(0);
    });
  });
});
