import { describe, it, expect } from 'vitest';
const COConfigExtractor = require('../../../extraction/extractors/co-config');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('COConfigExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new COConfigExtractor(ctx);
    expect(ext.extractorId).toBe('CO_CONFIG');
    expect(ext.name).toBe('Controlling Configuration');
    expect(ext.module).toBe('CO');
    expect(ext.category).toBe('config');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new COConfigExtractor(ctx);
    const result = await ext.extract();
    expect(result.controllingAreas).toBeDefined();
    expect(result.controllingAreas.master.length).toBeGreaterThan(0);
    expect(result.controllingAreas.assignments.length).toBeGreaterThan(0);
    expect(result.controllingAreas.settings.length).toBeGreaterThan(0);
    expect(result.versions.length).toBeGreaterThan(0);
    expect(result.hierarchySets).toBeDefined();
    expect(result.hierarchySets.headers.length).toBeGreaterThan(0);
    expect(result.hierarchySets.nodes.length).toBeGreaterThan(0);
    expect(result.hierarchySets.leaves.length).toBeGreaterThan(0);
    expect(result.planningProfiles.length).toBeGreaterThan(0);
    expect(result.costElements).toBeDefined();
    expect(result.costElements.master.length).toBeGreaterThan(0);
    expect(result.costElements.texts.length).toBeGreaterThan(0);
    expect(result.costCenters).toBeDefined();
    expect(result.costCenters.master.length).toBeGreaterThan(0);
    expect(result.costCenters.texts.length).toBeGreaterThan(0);
    expect(result.profitCenters).toBeDefined();
    expect(result.profitCenters.master.length).toBeGreaterThan(0);
    expect(result.profitCenters.texts.length).toBeGreaterThan(0);
    expect(result.internalOrders.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new COConfigExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(15);
    expect(tables.find(t => t.table === 'TKA01')).toBeDefined();
    expect(tables.find(t => t.table === 'CSKA')).toBeDefined();
    expect(tables.find(t => t.table === 'CSKS')).toBeDefined();
    expect(tables.find(t => t.table === 'CEPC')).toBeDefined();
    expect(tables.find(t => t.table === 'AUFK')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new COConfigExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });
});
