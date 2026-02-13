const WorkflowExtractor = require('../../../extraction/extractors/workflow-extractor');
const ExtractionContext = require('../../../extraction/extraction-context');

describe('WorkflowExtractor', () => {
  it('should have correct identity', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new WorkflowExtractor(ctx);
    expect(ext.extractorId).toBe('WORKFLOWS');
    expect(ext.name).toBe('Workflow Definitions & Instances');
    expect(ext.module).toBe('BASIS');
    expect(ext.category).toBe('process');
  });

  it('should extract mock data', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new WorkflowExtractor(ctx);
    const result = await ext.extract();
    expect(result.templates.length).toBeGreaterThan(0);
    expect(result.templateSteps.length).toBeGreaterThan(0);
    expect(result.workItems.length).toBeGreaterThan(0);
    expect(result.workItemObjects.length).toBeGreaterThan(0);
    expect(result.containerObjects.length).toBeGreaterThan(0);
    expect(result.taskRelationships.length).toBeGreaterThan(0);
  });

  it('should report expected tables', () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new WorkflowExtractor(ctx);
    const tables = ext.getExpectedTables();
    expect(tables.length).toBeGreaterThanOrEqual(6);
    expect(tables.find(t => t.table === 'SWP_HEADER')).toBeDefined();
    expect(tables.find(t => t.table === 'SWP_STEP')).toBeDefined();
    expect(tables.find(t => t.table === 'SWWWIHEAD')).toBeDefined();
  });

  it('should track coverage for mock extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const ext = new WorkflowExtractor(ctx);
    await ext.extract();
    const report = ext.getCoverageReport();
    expect(report.extracted).toBeGreaterThan(0);
  });

  it('should have static registry properties', () => {
    expect(WorkflowExtractor._extractorId).toBe('WORKFLOWS');
    expect(WorkflowExtractor._module).toBe('BASIS');
    expect(WorkflowExtractor._category).toBe('process');
  });
});
