const fs = require('fs');
const path = require('path');
const ForensicOrchestrator = require('../../../extraction/forensic-orchestrator');
const ExtractionContext = require('../../../extraction/extraction-context');

// Auto-register all extractors (mirrors forensic-extract.js bootstrap)
const extractorDir = path.join(__dirname, '../../../extraction/extractors');
for (const file of fs.readdirSync(extractorDir)) {
  if (file.endsWith('.js') && !file.startsWith('.')) {
    try { require(path.join(extractorDir, file)); } catch { /* skip unloadable */ }
  }
}
const processDir = path.join(__dirname, '../../../extraction/process');
for (const file of fs.readdirSync(processDir)) {
  if (file.endsWith('-extractor.js')) {
    try { require(path.join(processDir, file)); } catch { /* skip */ }
  }
}
const configDir = path.join(__dirname, '../../../extraction/config');
for (const file of fs.readdirSync(configDir)) {
  if (file.endsWith('-extractor.js')) {
    try { require(path.join(configDir, file)); } catch { /* skip */ }
  }
}

describe('ForensicOrchestrator', () => {
  it('should run a full extraction in mock mode', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const orchestrator = new ForensicOrchestrator(ctx);
    const result = await orchestrator.run();
    expect(result).toBeDefined();
    expect(result.results).toBeDefined();
    expect(result.processCatalog).toBeDefined();
    expect(result.interpretations).toBeDefined();
    expect(result.gapReport).toBeDefined();
    expect(result.confidence).toBeDefined();
    expect(result.humanValidation).toBeDefined();
    expect(result.report).toBeDefined();
    expect(result.durationMs).toBeGreaterThan(0);
  });

  it('should emit progress events during extraction', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const orchestrator = new ForensicOrchestrator(ctx);
    const phases = [];
    orchestrator.onProgress((p) => phases.push(p.phase));
    await orchestrator.run();
    expect(phases).toContain('system-info');
    expect(phases).toContain('data-dictionary');
    expect(phases).toContain('module-extraction');
    expect(phases).toContain('complete');
  });

  it('should emit extractorComplete events', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const orchestrator = new ForensicOrchestrator(ctx);
    const completed = [];
    orchestrator.onExtractorComplete((e) => completed.push(e.extractorId));
    await orchestrator.run();
    expect(completed.length).toBeGreaterThan(0);
    expect(completed).toContain('SYSTEM_INFO');
    expect(completed).toContain('DATA_DICTIONARY');
  });

  it('should track progress state', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const orchestrator = new ForensicOrchestrator(ctx);
    const progress = orchestrator.getProgress();
    expect(progress.phase).toBe('idle');
    await orchestrator.run();
    const finalProgress = orchestrator.getProgress();
    expect(finalProgress.phase).toBe('complete');
  });

  it('should produce a ForensicReport with toJSON and toMarkdown', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const orchestrator = new ForensicOrchestrator(ctx);
    const result = await orchestrator.run();
    const json = result.report.toJSON();
    expect(json.version).toBe('1.0.0');
    expect(json.systemOverview).toBeDefined();
    const md = result.report.toMarkdown();
    expect(md).toContain('# SAP Forensic Extraction Report');
  });

  it('should produce confidence assessment', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const orchestrator = new ForensicOrchestrator(ctx);
    const result = await orchestrator.run();
    expect(result.confidence.overall).toBeGreaterThanOrEqual(0);
    expect(result.confidence.overall).toBeLessThanOrEqual(100);
    expect(result.confidence.grade).toBeDefined();
  });

  it('should filter by module when modules option is provided', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const orchestrator = new ForensicOrchestrator(ctx);
    const completed = [];
    orchestrator.onExtractorComplete((e) => completed.push(e.extractorId));
    await orchestrator.run({ modules: ['FI'] });
    // SYSTEM_INFO and DATA_DICTIONARY always run first
    expect(completed).toContain('SYSTEM_INFO');
    expect(completed).toContain('DATA_DICTIONARY');
    const fiExtractors = completed.filter(id => id.startsWith('FI_'));
    expect(fiExtractors.length).toBeGreaterThan(0);
  });

  it('should handle runModule shorthand', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const orchestrator = new ForensicOrchestrator(ctx);
    const result = await orchestrator.runModule('FI');
    expect(result).toBeDefined();
    expect(result.results).toBeDefined();
  });

  it('should include human validation checklist', async () => {
    const ctx = new ExtractionContext({ mode: 'mock' });
    const orchestrator = new ForensicOrchestrator(ctx);
    const result = await orchestrator.run();
    expect(result.humanValidation.length).toBeGreaterThan(0);
    expect(result.humanValidation[0]).toContain('Verify');
  });
});
