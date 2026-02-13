/**
 * Tests for Forensic Orchestrator
 */

const fs = require('fs');
const path = require('path');
const ForensicOrchestrator = require('../../extraction/forensic-orchestrator');
const ExtractionContext = require('../../extraction/extraction-context');
const ExtractorRegistry = require('../../extraction/extractor-registry');
const BaseExtractor = require('../../extraction/base-extractor');

// Auto-register all extractors (mirrors forensic-extract.js bootstrap)
const extractorDir = path.join(__dirname, '../../extraction/extractors');
for (const file of fs.readdirSync(extractorDir)) {
  if (file.endsWith('.js') && !file.startsWith('.')) {
    try { require(path.join(extractorDir, file)); } catch { /* skip unloadable */ }
  }
}
const processDir = path.join(__dirname, '../../extraction/process');
for (const file of fs.readdirSync(processDir)) {
  if (file.endsWith('-extractor.js')) {
    try { require(path.join(processDir, file)); } catch { /* skip */ }
  }
}
const configDir = path.join(__dirname, '../../extraction/config');
for (const file of fs.readdirSync(configDir)) {
  if (file.endsWith('-extractor.js')) {
    try { require(path.join(configDir, file)); } catch { /* skip */ }
  }
}

describe('ForensicOrchestrator', () => {
  describe('constructor', () => {
    it('sets up initial state with results Map, callbacks, and progress', () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);

      expect(orchestrator.context).toBe(ctx);
      expect(orchestrator._results).toBeInstanceOf(Map);
      expect(orchestrator._results.size).toBe(0);
      expect(orchestrator._callbacks).toEqual({
        progress: [],
        extractorComplete: [],
        error: [],
      });
      expect(orchestrator._progress).toEqual({
        phase: 'idle',
        completed: 0,
        total: 0,
        current: null,
      });
    });
  });

  describe('callback registration', () => {
    it('onProgress registers a progress callback', () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);
      const cb = vi.fn();
      orchestrator.onProgress(cb);
      expect(orchestrator._callbacks.progress).toContain(cb);
    });

    it('onExtractorComplete registers an extractorComplete callback', () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);
      const cb = vi.fn();
      orchestrator.onExtractorComplete(cb);
      expect(orchestrator._callbacks.extractorComplete).toContain(cb);
    });

    it('onError registers an error callback', () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);
      const cb = vi.fn();
      orchestrator.onError(cb);
      expect(orchestrator._callbacks.error).toContain(cb);
    });
  });

  describe('getProgress', () => {
    it('returns current progress as a copy', () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);
      const progress = orchestrator.getProgress();
      expect(progress.phase).toBe('idle');
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(0);
      expect(progress.current).toBeNull();

      // Ensure it is a copy, not the original object
      progress.phase = 'modified';
      expect(orchestrator.getProgress().phase).toBe('idle');
    });
  });

  describe('run()', () => {
    it('executes full pipeline in mock mode and returns expected shape', async () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);
      const result = await orchestrator.run();

      expect(result).toBeDefined();
      expect(result.results).toBeInstanceOf(Map);
      expect(result.processCatalog).toBeDefined();
      expect(result.interpretations).toBeDefined();
      expect(result.gapReport).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.humanValidation).toBeDefined();
      expect(result.report).toBeDefined();
      expect(typeof result.durationMs).toBe('number');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('fires progress callbacks during run', async () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);
      const phases = [];
      orchestrator.onProgress((p) => phases.push(p.phase));

      await orchestrator.run();

      expect(phases).toContain('system-info');
      expect(phases).toContain('data-dictionary');
      expect(phases).toContain('module-extraction');
      expect(phases).toContain('process-mining');
      expect(phases).toContain('config-interpretation');
      expect(phases).toContain('gap-analysis');
      expect(phases).toContain('report-generation');
      expect(phases).toContain('complete');
    });

    it('fires extractorComplete callbacks during run', async () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);
      const completed = [];
      orchestrator.onExtractorComplete((e) => completed.push(e.extractorId));

      await orchestrator.run();

      expect(completed.length).toBeGreaterThan(0);
      expect(completed).toContain('SYSTEM_INFO');
      expect(completed).toContain('DATA_DICTIONARY');
    });

    it('sets progress to complete after run finishes', async () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);

      await orchestrator.run();

      const progress = orchestrator.getProgress();
      expect(progress.phase).toBe('complete');
      expect(progress.completed).toBe(1);
      expect(progress.total).toBe(1);
    });
  });

  describe('module filtering', () => {
    it('filters extractors by module with run({ modules: ["MM"] })', async () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);
      const completed = [];
      orchestrator.onExtractorComplete((e) => completed.push(e.extractorId));

      await orchestrator.run({ modules: ['MM'] });

      // SYSTEM_INFO and DATA_DICTIONARY always run
      expect(completed).toContain('SYSTEM_INFO');
      expect(completed).toContain('DATA_DICTIONARY');

      // Module-specific extractors should be present
      const mmExtractors = completed.filter(id => id.startsWith('MM_'));
      expect(mmExtractors.length).toBeGreaterThan(0);
    });
  });

  describe('runModule', () => {
    it('delegates to run with module filter', async () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);
      const runSpy = vi.spyOn(orchestrator, 'run');

      await orchestrator.runModule('FI');

      expect(runSpy).toHaveBeenCalledWith({ modules: ['FI'] });
    });

    it('returns valid result', async () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);
      const result = await orchestrator.runModule('FI');

      expect(result).toBeDefined();
      expect(result.results).toBeInstanceOf(Map);
      expect(result.report).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('catches extractor failures and records errors in results', async () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);

      // Create a failing extractor class
      class FailingExtractor extends BaseExtractor {
        get extractorId() { return 'FAILING_TEST'; }
        get name() { return 'Failing Extractor'; }
        get module() { return 'TEST'; }
        get category() { return 'config'; }
        async _extractMock() { throw new Error('Simulated extraction failure'); }
      }
      FailingExtractor._extractorId = 'FAILING_TEST';
      FailingExtractor._module = 'TEST';
      FailingExtractor._category = 'config';

      // Register the failing extractor
      ExtractorRegistry.register(FailingExtractor);

      const errors = [];
      orchestrator.onError((e) => errors.push(e));

      try {
        await orchestrator.run({ modules: ['TEST'] });
      } catch {
        // may throw or may not depending on phase
      }

      // The failing extractor should have triggered an error callback
      expect(errors.length).toBeGreaterThan(0);
      const testError = errors.find(e => e.extractorId === 'FAILING_TEST');
      expect(testError).toBeDefined();
      expect(testError.error).toContain('Simulated extraction failure');

      // Clean up the registry
      ExtractorRegistry._extractors.delete('FAILING_TEST');
    });

    it('error callback fires on extractor failure', async () => {
      const ctx = new ExtractionContext({ mode: 'mock' });
      const orchestrator = new ForensicOrchestrator(ctx);

      class ErrorExtractor extends BaseExtractor {
        get extractorId() { return 'ERROR_TEST'; }
        get name() { return 'Error Extractor'; }
        get module() { return 'ERRMOD'; }
        get category() { return 'config'; }
        async _extractMock() { throw new Error('Test error'); }
      }
      ErrorExtractor._extractorId = 'ERROR_TEST';
      ErrorExtractor._module = 'ERRMOD';
      ErrorExtractor._category = 'config';

      ExtractorRegistry.register(ErrorExtractor);

      const errorCb = vi.fn();
      orchestrator.onError(errorCb);

      try {
        await orchestrator.run({ modules: ['ERRMOD'] });
      } catch {
        // may throw
      }

      expect(errorCb).toHaveBeenCalled();
      const call = errorCb.mock.calls.find(c => c[0].extractorId === 'ERROR_TEST');
      expect(call).toBeDefined();

      // Clean up
      ExtractorRegistry._extractors.delete('ERROR_TEST');
    });
  });
});
