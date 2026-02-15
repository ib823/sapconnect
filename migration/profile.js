#!/usr/bin/env node

/**
 * S/4HANA Data Profiling CLI
 *
 * Usage:
 *   npm run profile                          # Mock mode, all modules
 *   npm run profile -- --format md           # Markdown output
 *   npm run profile -- --module FI MM SD     # Specific modules
 *   npm run profile -- -P /path/to/vsp -S DEV  # Live SAP via vsp
 */

const SapGateway = require('../agent/sap-gateway');
const Profiler = require('./profiler');

function parseArgs(argv) {
  const args = {
    format: 'terminal',
    clientName: 'SAP Client',
    modules: null,
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
          args.modules.push(argv[++i]);
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
S/4HANA Data Profiling
=======================

Profiles source ECC data: table sizes, record counts, data age,
stale data identification, duplicates, and orphan records.

Runs in mock mode by default (no SAP system required).

Usage:
  npm run profile [options]

Options:
  -f, --format <fmt>       Output format: terminal (default) or md
  -c, --client <name>      Client name for the report header
  -m, --module <mod...>    Filter by module(s): FI, MM, SD, HR, PP, PM
  -s, --sap-system <url>   SAP system URL (enables live connection)
  -P, --vsp-path <path>    Path to vsp binary (enables vsp mode)
  -S, --vsp-system <name>  vsp system profile (from .vsp.json)
  -v, --verbose            Show detailed profiling logs
  -h, --help               Show this help

Examples:
  npm run profile
  npm run profile -- --format md --client "Acme Corp"
  npm run profile -- --module FI MM SD
  npm run profile -- -P /usr/local/bin/vsp -S PRD -v
  `);
}

function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatTerminal(result, clientName) {
  const lines = [];
  const w = 70;
  const { tables, staleData, duplicates, orphans, summary } = result;

  lines.push('');
  lines.push('='.repeat(w));
  lines.push('  S/4HANA Data Profiling Report');
  lines.push('='.repeat(w));
  lines.push(`  Client:    ${clientName}`);
  lines.push(`  Date:      ${new Date().toISOString().split('T')[0]}`);
  lines.push('='.repeat(w));
  lines.push('');

  // Summary
  lines.push('-'.repeat(w));
  lines.push('  DATA SUMMARY');
  lines.push('-'.repeat(w));
  lines.push('');
  lines.push(`  Total Tables:      ${summary.totalTables}`);
  lines.push(`  Total Records:     ${formatNumber(summary.totalRecords)}`);
  lines.push(`  Total Size:        ${summary.totalSizeGB} GB`);
  lines.push(`  Data Quality:      ${summary.dataQualityScore}%`);
  lines.push(`  Stale Data:        ${summary.stalePercent}% (${formatNumber(summary.staleRecords)} records)`);
  lines.push('');

  // Tables by module
  for (const [module, moduleTables] of Object.entries(tables)) {
    lines.push('-'.repeat(w));
    lines.push(`  MODULE: ${module}`);
    lines.push('-'.repeat(w));
    lines.push('');
    lines.push(`  ${'Table'.padEnd(12)} ${'Description'.padEnd(28)} ${'Records'.padStart(12)} ${'Size MB'.padStart(9)}`);
    lines.push(`  ${'-'.repeat(12)} ${'-'.repeat(28)} ${'-'.repeat(12)} ${'-'.repeat(9)}`);
    for (const t of moduleTables) {
      lines.push(`  ${t.table.padEnd(12)} ${t.description.substring(0, 28).padEnd(28)} ${formatNumber(t.records).padStart(12)} ${formatNumber(t.sizeMB).padStart(9)}`);
    }
    lines.push('');
  }

  // Stale data
  if (staleData.length > 0) {
    lines.push('-'.repeat(w));
    lines.push('  STALE DATA (candidates for archiving)');
    lines.push('-'.repeat(w));
    lines.push('');
    for (const s of staleData) {
      lines.push(`  ${s.table.padEnd(10)} ${formatNumber(s.staleRecords).padStart(12)} records (${s.stalePercent}% of table)`);
      lines.push(`             Cutoff: ${s.cutoffDate} | ${s.recommendation}`);
      lines.push('');
    }
  }

  // Duplicates
  if (duplicates.length > 0) {
    lines.push('-'.repeat(w));
    lines.push('  DUPLICATE RECORDS');
    lines.push('-'.repeat(w));
    lines.push('');
    for (const d of duplicates) {
      lines.push(`  ${d.table.padEnd(10)} ${formatNumber(d.duplicateRecords).padStart(8)} duplicates (${d.duplicatePercent}%)`);
      lines.push(`             ${d.description}`);
    }
    lines.push('');
  }

  // Orphans
  if (orphans.length > 0) {
    lines.push('-'.repeat(w));
    lines.push('  ORPHAN RECORDS');
    lines.push('-'.repeat(w));
    lines.push('');
    for (const o of orphans) {
      lines.push(`  ${o.table.padEnd(10)} ${formatNumber(o.orphanRecords).padStart(8)} orphans — ${o.description}`);
    }
    lines.push('');
  }

  lines.push('='.repeat(w));
  lines.push(`  Recommendation: ${summary.recommendation}`);
  lines.push('='.repeat(w));

  return lines.join('\n');
}

function formatMarkdown(result, clientName) {
  const lines = [];
  const { tables, staleData, duplicates, orphans, summary } = result;

  lines.push('# S/4HANA Data Profiling Report');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Client | ${clientName} |`);
  lines.push(`| Date | ${new Date().toISOString().split('T')[0]} |`);
  lines.push(`| Total Tables | ${summary.totalTables} |`);
  lines.push(`| Total Records | ${formatNumber(summary.totalRecords)} |`);
  lines.push(`| Total Size | ${summary.totalSizeGB} GB |`);
  lines.push(`| Data Quality Score | ${summary.dataQualityScore}% |`);
  lines.push(`| Stale Data | ${summary.stalePercent}% |`);
  lines.push('');

  for (const [module, moduleTables] of Object.entries(tables)) {
    lines.push(`## Module: ${module}`);
    lines.push('');
    lines.push('| Table | Description | Records | Size (MB) |');
    lines.push('| --- | --- | --- | --- |');
    for (const t of moduleTables) {
      lines.push(`| ${t.table} | ${t.description} | ${formatNumber(t.records)} | ${formatNumber(t.sizeMB)} |`);
    }
    lines.push('');
  }

  if (staleData.length > 0) {
    lines.push('## Stale Data');
    lines.push('');
    lines.push('| Table | Stale Records | % | Recommendation |');
    lines.push('| --- | --- | --- | --- |');
    for (const s of staleData) {
      lines.push(`| ${s.table} | ${formatNumber(s.staleRecords)} | ${s.stalePercent}% | ${s.recommendation} |`);
    }
    lines.push('');
  }

  if (duplicates.length > 0) {
    lines.push('## Duplicates');
    lines.push('');
    lines.push('| Table | Duplicates | % | Description |');
    lines.push('| --- | --- | --- | --- |');
    for (const d of duplicates) {
      lines.push(`| ${d.table} | ${formatNumber(d.duplicateRecords)} | ${d.duplicatePercent}% | ${d.description} |`);
    }
    lines.push('');
  }

  if (orphans.length > 0) {
    lines.push('## Orphan Records');
    lines.push('');
    lines.push('| Table | Orphans | Description |');
    lines.push('| --- | --- | --- |');
    for (const o of orphans) {
      lines.push(`| ${o.table} | ${formatNumber(o.orphanRecords)} | ${o.description} |`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`*Recommendation: ${summary.recommendation}*`);
  lines.push('');
  lines.push('*Data profiling report generated by SEN Migration Tool*');

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
  if (args.modules) {
    console.log(`  Modules: ${args.modules.join(', ')}`);
  }
  console.log('  Profiling source data...');
  console.log('');

  try {
    const profiler = new Profiler(gateway, {
      verbose: args.verbose,
      modules: args.modules,
    });
    const result = await profiler.profile();

    console.log(`  Profiled ${result.summary.totalTables} tables, ${formatNumber(result.summary.totalRecords)} records`);
    console.log(`  Data quality score: ${result.summary.dataQualityScore}%`);
    console.log('');

    const isMarkdown = args.format === 'md' || args.format === 'markdown';
    if (isMarkdown) {
      console.log(formatMarkdown(result, args.clientName));
    } else {
      console.log(formatTerminal(result, args.clientName));
    }
  } catch (err) {
    console.error(`Data profiling failed: ${err.message}`);
    if (args.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
