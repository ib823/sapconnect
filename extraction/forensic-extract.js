#!/usr/bin/env node

/**
 * Forensic Extraction CLI
 *
 * Entry point for the SAP forensic extraction engine.
 *
 * Usage:
 *   forensic-extract full [--modules FI,CO,MM] [--resume] [--mock]
 *   forensic-extract module <module>
 *   forensic-extract report [--format json|md]
 *   forensic-extract gaps
 *   forensic-extract coverage
 *   forensic-extract dashboard [--port 3001]
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../lib/logger');
const ExtractionContext = require('./extraction-context');
const ForensicOrchestrator = require('./forensic-orchestrator');

// Auto-register all extractors
require('./extractors/system-info');
require('./extractors/data-dictionary');
require('./extractors/repository-catalog');

// Conditionally load module extractors (they may not all exist yet)
const extractorDir = path.join(__dirname, 'extractors');
if (fs.existsSync(extractorDir)) {
  for (const file of fs.readdirSync(extractorDir)) {
    if (file.endsWith('.js') && !file.startsWith('.')) {
      try { require(path.join(extractorDir, file)); } catch { /* skip unloadable */ }
    }
  }
}

// Load process extractors
const processDir = path.join(__dirname, 'process');
if (fs.existsSync(processDir)) {
  for (const file of fs.readdirSync(processDir)) {
    if (file.endsWith('-extractor.js')) {
      try { require(path.join(processDir, file)); } catch { /* skip */ }
    }
  }
}

// Load config extractors
const configDir = path.join(__dirname, 'config');
if (fs.existsSync(configDir)) {
  for (const file of fs.readdirSync(configDir)) {
    if (file.endsWith('-extractor.js')) {
      try { require(path.join(configDir, file)); } catch { /* skip */ }
    }
  }
}

const log = new Logger('forensic-extract');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';

  const flags = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--mock') flags.mock = true;
    else if (args[i] === '--resume') flags.resume = true;
    else if (args[i] === '--modules' && args[i + 1]) { flags.modules = args[++i].split(','); }
    else if (args[i] === '--format' && args[i + 1]) { flags.format = args[++i]; }
    else if (args[i] === '--port' && args[i + 1]) { flags.port = parseInt(args[++i], 10); }
    else if (!args[i].startsWith('--')) { flags.positional = args[i]; }
  }

  switch (command) {
    case 'full': return runFull(flags);
    case 'module': return runModule(flags);
    case 'report': return runReport(flags);
    case 'gaps': return runGaps(flags);
    case 'coverage': return runCoverage(flags);
    case 'dashboard': return runDashboard(flags);
    case 'plan': return runPlan(flags);
    default:
      log.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

async function runFull(flags) {
  log.info('Starting full forensic extraction...');

  const context = await createContext(flags);
  const orchestrator = new ForensicOrchestrator(context);

  orchestrator.onProgress(p => {
    log.info(`[${p.phase}] ${p.completed}/${p.total}`);
  });

  orchestrator.onError(e => {
    log.error(`Error in ${e.extractorId || e.phase}: ${e.error}`);
  });

  let output;
  if (flags.resume) {
    output = await orchestrator.resume();
  } else {
    output = await orchestrator.run({
      modules: flags.modules,
      concurrency: 5,
    });
  }

  // Save results
  const outputDir = path.resolve('.sapconnect-output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, 'forensic-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(output.report.toJSON(), null, 2));
  log.info(`JSON report saved: ${jsonPath}`);

  const mdPath = path.join(outputDir, 'forensic-report.md');
  fs.writeFileSync(mdPath, output.report.toMarkdown());
  log.info(`Markdown report saved: ${mdPath}`);

  const summaryPath = path.join(outputDir, 'executive-summary.md');
  fs.writeFileSync(summaryPath, output.report.toExecutiveSummary());
  log.info(`Executive summary saved: ${summaryPath}`);

  log.info(`Extraction complete in ${output.durationMs}ms`);
  log.info(`Confidence: ${output.confidence.overall}% (${output.confidence.grade})`);
  log.info(`Gaps: ${output.gapReport.totalGapCount || 0}`);

  // Auto-generate migration plan
  try {
    const MigrationBridge = require('./migration-bridge');
    const bridge = new MigrationBridge();
    const forensicResult = {
      results: output.results instanceof Map ? Object.fromEntries(output.results) : (output.results || {}),
      confidence: output.confidence || {},
      gapReport: output.gapReport || {},
      humanValidation: [],
    };
    const plan = bridge.plan(forensicResult);
    const planPath = path.join(outputDir, 'migration-plan.json');
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
    log.info(`Migration plan saved: ${planPath} (${plan.scope.totalObjects} objects)`);
  } catch (err) {
    log.warn(`Auto migration plan generation failed: ${err.message}`);
  }
}

async function runModule(flags) {
  const module = (flags.positional || '').toUpperCase();
  if (!module) {
    log.error('Module name required: forensic-extract module <MODULE>');
    process.exit(1);
  }

  log.info(`Extracting module: ${module}`);
  const context = await createContext(flags);
  const orchestrator = new ForensicOrchestrator(context);
  await orchestrator.runModule(module);
  log.info('Module extraction complete');
}

async function runReport(flags) {
  const outputDir = path.resolve('.sapconnect-output');
  const jsonPath = path.join(outputDir, 'forensic-report.json');

  if (!fs.existsSync(jsonPath)) {
    log.error('No extraction data found. Run "forensic-extract full" first.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const format = flags.format || 'md';

  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
  } else {
    // Re-generate markdown from saved JSON
    const ForensicReport = require('./report/forensic-report');
    const report = new ForensicReport(data, null, data.configurationBlueprint, data.gapAnalysis);
    console.log(report.toMarkdown());
  }
}

async function runGaps(flags) {
  const outputDir = path.resolve('.sapconnect-output');
  const jsonPath = path.join(outputDir, 'forensic-report.json');

  if (!fs.existsSync(jsonPath)) {
    log.error('No extraction data found. Run "forensic-extract full" first.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(JSON.stringify(data.gapAnalysis, null, 2));
}

async function runCoverage(flags) {
  const outputDir = path.resolve('.sapconnect-output');
  const jsonPath = path.join(outputDir, 'forensic-report.json');

  if (!fs.existsSync(jsonPath)) {
    log.error('No extraction data found. Run "forensic-extract full" first.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(JSON.stringify(data.confidenceAssessment, null, 2));
}

async function runPlan(flags) {
  const outputDir = path.resolve('.sapconnect-output');
  const jsonPath = path.join(outputDir, 'forensic-report.json');

  if (!fs.existsSync(jsonPath)) {
    log.error('No extraction data found. Run "forensic-extract full" first.');
    process.exit(1);
  }

  log.info('Generating migration plan from extraction results...');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const MigrationBridge = require('./migration-bridge');
  const bridge = new MigrationBridge();
  const forensicResult = {
    results: data.results || {},
    confidence: data.confidenceAssessment || {},
    gapReport: data.gapAnalysis || {},
    humanValidation: data.humanValidation || [],
  };

  const planOptions = {};
  if (flags.modules) planOptions.includeModules = flags.modules;

  const plan = bridge.plan(forensicResult, planOptions);
  const planPath = path.join(outputDir, 'migration-plan.json');
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));

  log.info(`Migration plan saved: ${planPath}`);
  log.info(`  Objects: ${plan.scope.totalObjects}`);
  log.info(`  Waves: ${plan.executionPlan.totalWaves}`);
  log.info(`  Estimated hours: ${plan.effort.totalEstimatedHours}`);
}

async function runDashboard(flags) {
  const express = require('express');
  const { createDashboardRouter } = require('./report/dashboard-api');

  const port = flags.port || 3001;
  const app = express();
  app.use(express.json());

  const state = {
    running: false,
    results: {},
    report: null,
    processCatalog: null,
    interpretations: [],
    gapReport: {},
    confidence: {},
    progress: {},
  };

  // Load last results if available
  const outputDir = path.resolve('.sapconnect-output');
  const jsonPath = path.join(outputDir, 'forensic-report.json');
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    state.results = data;
    const ForensicReport = require('./report/forensic-report');
    state.report = new ForensicReport(data, null, data.configurationBlueprint, data.gapAnalysis);
    state.gapReport = data.gapAnalysis;
    state.confidence = data.confidenceAssessment;
  }

  app.use(createDashboardRouter(state));

  app.listen(port, () => {
    log.info(`Forensic dashboard running at http://localhost:${port}`);
    log.info('Endpoints: GET /api/forensic/summary, /modules, /processes, /gaps, /confidence, /coverage');
  });
}

async function createContext(flags) {
  const mode = flags.mock ? 'mock' : 'live';

  // Try to set up RFC pool for live mode
  let rfcPool = null;
  let odataClient = null;

  if (mode === 'live') {
    try {
      const SapConnection = require('../lib/sap-connection');
      const conn = SapConnection.fromEnv();
      odataClient = await conn.connect();
      rfcPool = conn.createRfcPool();
    } catch (err) {
      log.warn(`Live connection setup failed: ${err.message}. Falling back to mock mode.`);
    }
  }

  return new ExtractionContext({
    rfcPool,
    odataClient,
    mode: rfcPool || odataClient ? 'live' : 'mock',
    checkpointDir: '.sapconnect-checkpoints',
  });
}

function printUsage() {
  console.log(`
Usage: forensic-extract <command> [options]

Commands:
  full     Run full extraction (default)
  module   Extract a specific module
  report   Generate report from last extraction
  gaps     Show gap analysis
  coverage Show coverage metrics
  plan     Generate migration plan from extraction
  dashboard Start the dashboard API server

Options:
  --mock           Use mock data (no SAP connection needed)
  --resume         Resume from last checkpoint
  --modules FI,CO  Limit to specific modules
  --format json|md Report output format
  --port 3001      Dashboard server port
`);
}

main().catch(err => {
  log.error(`Fatal: ${err.message}`);
  process.exit(1);
});
