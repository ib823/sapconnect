/**
 * Forensic Orchestrator
 *
 * Coordinates the full extraction lifecycle:
 * 1. System Info → 2. Data Dictionary → 3. Module extractors (parallel)
 * → 4. Cross-cutting extractors → 5. Process Mining → 6. Config Interpretation
 * → 7. Gap Analysis → 8. Report Generation
 */

const Logger = require('../lib/logger');
const ExtractorRegistry = require('./extractor-registry');
const ProcessMiningEngine = require('./process/process-mining-engine');
const ConfigInterpreter = require('./config/config-interpreter');
const GapAnalyzer = require('./gap/gap-analyzer');
const ForensicReport = require('./report/forensic-report');

class ForensicOrchestrator {
  /**
   * @param {import('./extraction-context')} context
   */
  constructor(context) {
    this.context = context;
    this.log = new Logger('forensic-orchestrator');
    this._results = new Map();
    this._callbacks = { progress: [], extractorComplete: [], error: [] };
    this._progress = { phase: 'idle', completed: 0, total: 0, current: null };
  }

  onProgress(callback) { this._callbacks.progress.push(callback); }
  onExtractorComplete(callback) { this._callbacks.extractorComplete.push(callback); }
  onError(callback) { this._callbacks.error.push(callback); }
  getProgress() { return { ...this._progress }; }

  /**
   * Run full forensic extraction.
   * @param {object} [options]
   * @param {string[]} [options.modules] - Filter to specific modules
   * @param {number} [options.concurrency=5]
   * @returns {{ results, processCatalog, interpretations, gapReport, confidence, report }}
   */
  async run(options = {}) {
    const start = Date.now();
    const concurrency = options.concurrency || 5;

    try {
      // Phase 1: System Info
      this._updateProgress('system-info', 0, 1);
      await this._runExtractor('SYSTEM_INFO');

      // Phase 2: Data Dictionary
      this._updateProgress('data-dictionary', 0, 1);
      await this._runExtractor('DATA_DICTIONARY');

      // Phase 3: Module extractors (parallel)
      let entries = ExtractorRegistry.getAll()
        .filter(e => e.id !== 'SYSTEM_INFO' && e.id !== 'DATA_DICTIONARY');

      if (options.modules) {
        const mods = new Set(options.modules.map(m => m.toUpperCase()));
        entries = entries.filter(e => mods.has((e.cls._module || '').toUpperCase()));
      }

      this._updateProgress('module-extraction', 0, entries.length);

      const queue = [...entries];
      const running = new Set();
      let completed = 0;

      const runNext = () => {
        while (queue.length > 0 && running.size < concurrency) {
          const entry = queue.shift();
          const promise = (async () => {
            try {
              await this._runExtractor(entry.id, entry.cls);
            } catch (err) {
              this.log.error(`Extractor ${entry.id} failed: ${err.message}`);
              this._results.set(entry.id, { error: err.message });
              this._emit('error', { extractorId: entry.id, error: err.message });
            }
            completed++;
            this._updateProgress('module-extraction', completed, entries.length);
            running.delete(promise);
            runNext();
          })();
          running.add(promise);
        }
      };

      runNext();
      while (running.size > 0) {
        await Promise.race(running);
      }

      // Phase 4: Process Mining
      this._updateProgress('process-mining', 0, 1);
      const processEngine = new ProcessMiningEngine(this._results);
      const processCatalog = await processEngine.reconstructProcesses();

      // Phase 5: Configuration Interpretation
      this._updateProgress('config-interpretation', 0, 1);
      const interpreter = new ConfigInterpreter(this._results);
      const interpretations = await interpreter.interpret();

      // Phase 6: Gap Analysis
      this._updateProgress('gap-analysis', 0, 1);
      const gapAnalyzer = new GapAnalyzer(
        this._results,
        this.context.dataDictionary,
        this.context.coverage
      );
      await gapAnalyzer.analyze();
      const gapReport = gapAnalyzer.getGapReport();
      const confidence = gapAnalyzer.getConfidenceScore();
      const humanValidation = gapAnalyzer.getHumanValidationChecklist();

      // Phase 7: Report Generation
      this._updateProgress('report-generation', 0, 1);
      const report = new ForensicReport(
        this._results,
        processCatalog,
        interpretations,
        { ...gapReport, confidence, humanValidation }
      );

      this._updateProgress('complete', 1, 1);
      const totalMs = Date.now() - start;
      this.log.info(`Forensic extraction complete in ${totalMs}ms`);

      return {
        results: this._results,
        processCatalog,
        interpretations,
        gapReport,
        confidence,
        humanValidation,
        report,
        durationMs: totalMs,
      };
    } catch (err) {
      this._emit('error', { phase: this._progress.phase, error: err.message });
      throw err;
    }
  }

  /**
   * Run a single module extraction.
   */
  async runModule(module) {
    return this.run({ modules: [module] });
  }

  /**
   * Resume from checkpoint.
   */
  async resume() {
    const progress = await this.context.checkpoint.getProgress();
    const completedExtractors = new Set();

    for (const [extractorId, info] of Object.entries(progress)) {
      if (info.complete) {
        completedExtractors.add(extractorId);
        // Load cached result
        const cached = await this.context.checkpoint.load(extractorId, '_complete');
        if (cached) {
          this._results.set(extractorId, cached);
        }
      }
    }

    this.log.info(`Resuming: ${completedExtractors.size} extractors already complete`);
    // Run remaining extractors
    return this.run();
  }

  async _runExtractor(extractorId, ExtractorClass) {
    if (!ExtractorClass) {
      ExtractorClass = ExtractorRegistry.get(extractorId);
    }
    if (!ExtractorClass) {
      this.log.warn(`Extractor not found: ${extractorId}`);
      return;
    }

    const extractor = new ExtractorClass(this.context);
    const result = await extractor.extract();
    this._results.set(extractorId, result);
    this._emit('extractorComplete', { extractorId, result });
  }

  _updateProgress(phase, completed, total) {
    this._progress = { phase, completed, total, current: phase, timestamp: new Date().toISOString() };
    this._emit('progress', this._progress);
  }

  _emit(event, data) {
    for (const cb of this._callbacks[event] || []) {
      try { cb(data); } catch { /* ignore callback errors */ }
    }
  }
}

module.exports = ForensicOrchestrator;
