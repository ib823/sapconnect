#!/usr/bin/env node

/**
 * S/4HANA Migration Testing CLI
 *
 * Usage:
 *   npm run test-migrate                          # Mock mode
 *   npm run test-migrate -- --format md           # Markdown output
 *   npm run test-migrate -- --module FI MM        # Specific modules
 *   npm run test-migrate -- -P /path/to/vsp -S DEV  # Live mode
 */

const SapGateway = require('../agent/sap-gateway');
const TestGenerator = require('./test-gen');
const TestRunner = require('./test-runner');

function parseArgs(argv) {
  const args = {
    format: 'terminal',
    clientName: 'SAP Client',
    modules: ['FI', 'MM', 'SD'],
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--format':
      case '-f':
        args.format = argv[++i];
        break;
      case '--client':
      case '-c':
        args.clientName = argv[++i];
        break;
      case '--module':
      case '-m': {
        args.modules = [];
        while (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
          args.modules.push(argv[++i].toUpperCase());
        }
        break;
      }
      case '--sap-system':
      case '-s':
        args.sapSystem = argv[++i];
        break;
      case '--vsp-path':
      case '-P':
        args.vspPath = argv[++i];
        break;
      case '--vsp-system':
      case '-S':
        args.vspSystem = argv[++i];
        break;
      case '--verbose':
      case '-v':
        args.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        if (argv[i].startsWith('-')) {
          console.error(`Unknown flag: ${argv[i]}`);
          printHelp();
          process.exit(1);
        }
        break;
    }
  }

  return args;
}

function printHelp() {
  console.log(`
S/4HANA Migration Testing
===========================

Generates and runs data comparison tests and business process tests
against the target S/4HANA system.

Runs in mock mode by default (no SAP system required).

Usage:
  npm run test-migrate [options]

Options:
  -f, --format <fmt>       Output format: terminal (default) or md
  -c, --client <name>      Client name for the report header
  -m, --module <mod...>    Modules to test: FI, MM, SD
  -s, --sap-system <url>   SAP system URL (enables live connection)
  -P, --vsp-path <path>    Path to vsp binary (enables vsp mode)
  -S, --vsp-system <name>  vsp system profile (from .vsp.json)
  -v, --verbose            Show detailed test logs
  -h, --help               Show this help

Examples:
  npm run test-migrate
  npm run test-migrate -- --format md --client "Acme Corp"
  npm run test-migrate -- --module FI SD -v
  `);
}

function formatTerminal(testSuite, results, clientName) {
  const lines = [];
  const w = 70;

  lines.push('');
  lines.push('='.repeat(w));
  lines.push('  S/4HANA Migration Test Report');
  lines.push('='.repeat(w));
  lines.push(`  Client:    ${clientName}`);
  lines.push(`  Date:      ${new Date().toISOString().split('T')[0]}`);
  lines.push(`  Duration:  ${results.stats.duration}`);
  lines.push('='.repeat(w));
  lines.push('');

  // Summary
  lines.push('-'.repeat(w));
  lines.push('  TEST SUMMARY');
  lines.push('-'.repeat(w));
  lines.push('');
  lines.push(`  Total Tests:       ${results.stats.total}`);
  lines.push(`  Passed:            ${results.stats.passed}`);
  lines.push(`  Failed:            ${results.stats.failed}`);
  lines.push(`  Skipped:           ${results.stats.skipped}`);
  lines.push(`  Pass Rate:         ${results.stats.passRate}%`);
  lines.push(`  Status:            ${results.stats.status}`);
  lines.push('');

  const barFilled = Math.round(results.stats.passRate / 5);
  lines.push(`  [${'#'.repeat(barFilled)}${'.'.repeat(20 - barFilled)}] ${results.stats.passRate}%`);
  lines.push('');

  // Comparison tests
  lines.push('-'.repeat(w));
  lines.push('  DATA COMPARISON TESTS');
  lines.push('-'.repeat(w));
  lines.push('');
  for (const r of results.comparisonResults) {
    const icon = r.result === 'pass' ? '[OK]' : '[!!]';
    lines.push(`  ${icon} ${r.id}: ${r.name}`);
    if (r.result === 'pass') {
      lines.push(`      Source: ${r.sourceValue}, Target: ${r.targetValue} - Match`);
    } else {
      lines.push(`      Source: ${r.sourceValue}, Target: ${r.targetValue}, Variance: ${r.variance}`);
      lines.push(`      Issue: ${r.details}`);
    }
    lines.push('');
  }

  // Process tests
  lines.push('-'.repeat(w));
  lines.push('  BUSINESS PROCESS TESTS');
  lines.push('-'.repeat(w));
  lines.push('');
  for (const r of results.processResults) {
    const icon = r.result === 'pass' ? '[OK]' : '[!!]';
    lines.push(`  ${icon} ${r.id}: ${r.name}`);
    for (const s of r.stepResults) {
      const stepIcon = s.status === 'pass' ? '+' : 'X';
      lines.push(`      [${stepIcon}] ${s.step}`);
      if (s.status === 'fail') {
        lines.push(`          ${s.message}`);
      }
    }
    lines.push('');
  }

  // Failed tests summary
  const failed = [...results.comparisonResults, ...results.processResults].filter(
    (r) => r.result === 'fail'
  );
  if (failed.length > 0) {
    lines.push('-'.repeat(w));
    lines.push('  FAILURES REQUIRING ATTENTION');
    lines.push('-'.repeat(w));
    lines.push('');
    for (const f of failed) {
      lines.push(`  [!!] ${f.id}: ${f.name} (${f.module})`);
      lines.push(`       ${f.details}`);
      lines.push('');
    }
  }

  lines.push('='.repeat(w));
  lines.push('  Test report generated by SAP Connect Migration Tool');
  lines.push('='.repeat(w));

  return lines.join('\n');
}

function formatMarkdown(testSuite, results, clientName) {
  const lines = [];

  lines.push('# S/4HANA Migration Test Report');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Client | ${clientName} |`);
  lines.push(`| Date | ${new Date().toISOString().split('T')[0]} |`);
  lines.push(`| Total Tests | ${results.stats.total} |`);
  lines.push(`| Passed | ${results.stats.passed} |`);
  lines.push(`| Failed | ${results.stats.failed} |`);
  lines.push(`| Pass Rate | **${results.stats.passRate}%** |`);
  lines.push('');

  lines.push('## Data Comparison Tests');
  lines.push('');
  lines.push('| ID | Test | Module | Result | Details |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const r of results.comparisonResults) {
    const status = r.result === 'pass' ? 'PASS' : '**FAIL**';
    const details = r.result === 'pass' ? 'Match' : `Variance: ${r.variance} - ${r.details}`;
    lines.push(`| ${r.id} | ${r.name} | ${r.module} | ${status} | ${details} |`);
  }
  lines.push('');

  lines.push('## Business Process Tests');
  lines.push('');
  lines.push('| ID | Test | Module | Result | Details |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const r of results.processResults) {
    const status = r.result === 'pass' ? 'PASS' : '**FAIL**';
    lines.push(`| ${r.id} | ${r.name} | ${r.module} | ${status} | ${r.details} |`);
  }
  lines.push('');

  const failed = [...results.comparisonResults, ...results.processResults].filter(
    (r) => r.result === 'fail'
  );
  if (failed.length > 0) {
    lines.push('## Failures Requiring Attention');
    lines.push('');
    for (const f of failed) {
      lines.push(`### ${f.id}: ${f.name}`);
      lines.push('');
      lines.push(`- **Module:** ${f.module}`);
      lines.push(`- **Priority:** ${f.priority}`);
      lines.push(`- **Details:** ${f.details}`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('*Test report generated by SAP Connect Migration Tool*');

  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv);

  const gateway = new SapGateway({
    system: args.sapSystem,
    vspPath: args.vspPath,
    vspSystem: args.vspSystem,
    verbose: args.verbose,
  });

  console.log('');
  console.log(`  Mode: ${gateway.mode.toUpperCase()}`);
  console.log(`  Modules: ${args.modules.join(', ')}`);
  console.log('  Generating and running migration tests...');
  console.log('');

  try {
    // Generate
    console.log('  [1/2] Generating test scripts...');
    const generator = new TestGenerator({
      verbose: args.verbose,
      modules: args.modules,
    });
    const testSuite = generator.generate();
    console.log(`        Generated ${testSuite.stats.comparisonTests} comparison + ${testSuite.stats.processTests} process tests`);

    // Run
    console.log('  [2/2] Running tests...');
    const runner = new TestRunner(gateway, { verbose: args.verbose });
    const results = await runner.run(testSuite);
    console.log(`        ${results.stats.passed}/${results.stats.total} passed (${results.stats.passRate}%)`);
    console.log('');

    const isMarkdown = args.format === 'md' || args.format === 'markdown';
    if (isMarkdown) {
      console.log(formatMarkdown(testSuite, results, args.clientName));
    } else {
      console.log(formatTerminal(testSuite, results, args.clientName));
    }
  } catch (err) {
    console.error(`Migration testing failed: ${err.message}`);
    if (args.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
