#!/usr/bin/env node
/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * S/4HANA Data Migration (SDT) CLI
 *
 * Usage:
 *   npm run sdt                              # Mock mode, all modules
 *   npm run sdt -- --format md               # Markdown output
 *   npm run sdt -- --module FI MM            # Specific modules
 *   npm run sdt -- --cutoff 2020-01-01       # Data cutoff date
 *   npm run sdt -- -P /path/to/vsp -S DEV   # Live SAP via vsp
 */

const SapGateway = require('../agent/sap-gateway');
const Extractor = require('./extractor');
const Transformer = require('./transformer');
const Loader = require('./loader');

function parseArgs(argv) {
  const args = {
    format: 'terminal',
    clientName: 'SAP Client',
    cutoffDate: '2020-01-01',
    modules: ['FI', 'MM', 'SD', 'HR'],
    targetType: 'public',
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
      case '--cutoff':
        args.cutoffDate = argv[++i];
        break;
      case '--module':
      case '-m': {
        args.modules = [];
        while (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
          args.modules.push(argv[++i].toUpperCase());
        }
        break;
      }
      case '--target':
        args.targetType = argv[++i];
        break;
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
S/4HANA Data Migration (SDT)
==============================

Executes the full Extract-Transform-Load pipeline for data migration
from ECC to S/4HANA.

Runs in mock mode by default (no SAP system required).

Usage:
  npm run sdt [options]

Options:
  -f, --format <fmt>       Output format: terminal (default) or md
  -c, --client <name>      Client name for the report header
  --cutoff <date>          Data cutoff date (default: 2020-01-01)
  -m, --module <mod...>    Modules to migrate: FI, MM, SD, HR
  --target <type>          Target type: public (default) or private
  -s, --sap-system <url>   SAP system URL (enables live connection)
  -P, --vsp-path <path>    Path to vsp binary (enables vsp mode)
  -S, --vsp-system <name>  vsp system profile (from .vsp.json)
  -v, --verbose            Show detailed migration logs
  -h, --help               Show this help

Examples:
  npm run sdt
  npm run sdt -- --format md --client "Acme Corp"
  npm run sdt -- --module FI MM --cutoff 2021-01-01
  npm run sdt -- -P /usr/local/bin/vsp -S DEV -v
  `);
}

function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatTerminal(extractResult, transformResult, loadResult, clientName, args) {
  const lines = [];
  const w = 70;

  lines.push('');
  lines.push('='.repeat(w));
  lines.push('  S/4HANA Data Migration (ETL) Report');
  lines.push('='.repeat(w));
  lines.push(`  Client:    ${clientName}`);
  lines.push(`  Date:      ${new Date().toISOString().split('T')[0]}`);
  lines.push(`  Cutoff:    ${args.cutoffDate}`);
  lines.push(`  Target:    ${args.targetType === 'public' ? 'Public Cloud (OData)' : 'Private Cloud (Staging)'}`);
  lines.push('='.repeat(w));
  lines.push('');

  // Extract summary
  lines.push('-'.repeat(w));
  lines.push('  EXTRACTION SUMMARY');
  lines.push('-'.repeat(w));
  lines.push('');
  for (const ext of extractResult.extractions) {
    lines.push(`  ${ext.module.padEnd(6)} ${formatNumber(ext.totalRecords).padStart(14)} records  (~${ext.estimatedDuration})`);
  }
  lines.push(`  ${'TOTAL'.padEnd(6)} ${formatNumber(extractResult.stats.totalRecords).padStart(14)} records`);
  lines.push('');

  // Transform summary
  lines.push('-'.repeat(w));
  lines.push('  TRANSFORMATION SUMMARY');
  lines.push('-'.repeat(w));
  lines.push('');
  lines.push(`  Input Records:     ${formatNumber(transformResult.stats.totalInputRecords)}`);
  lines.push(`  Output Records:    ${formatNumber(transformResult.stats.totalOutputRecords)}`);
  lines.push(`  Merged Records:    ${formatNumber(transformResult.stats.totalMergedRecords)}`);
  lines.push(`  Transform Rate:    ${transformResult.stats.transformationRate}%`);
  lines.push('');

  for (const t of transformResult.transformations) {
    if (t.status === 'skipped') continue;
    lines.push(`  ${t.module}:`);
    for (const m of t.tableMappings) {
      lines.push(`    ${m.sourceTable.padEnd(8)} -> ${m.targetTable.padEnd(8)} (${m.targetAPI || 'direct'})  ${formatNumber(m.outputRecords)} records`);
    }
    lines.push('');
  }

  // Load summary
  lines.push('-'.repeat(w));
  lines.push('  LOAD SUMMARY');
  lines.push('-'.repeat(w));
  lines.push('');
  lines.push(`  Records Loaded:    ${formatNumber(loadResult.stats.totalRecordsLoaded)}`);
  lines.push(`  Total Batches:     ${formatNumber(loadResult.stats.totalBatches)}`);
  lines.push(`  Total Errors:      ${formatNumber(loadResult.stats.totalErrors)}`);
  lines.push(`  Status:            ${loadResult.stats.status}`);
  lines.push('');

  for (const load of loadResult.loads) {
    const icon = load.status === 'success' ? '[OK]' : '[!!]';
    lines.push(`  ${icon} ${load.module}: ${formatNumber(load.recordsLoaded)} loaded, ${load.errors} errors`);
  }
  lines.push('');

  lines.push('='.repeat(w));
  lines.push('  Data migration report generated by SEN Migration Tool');
  lines.push('='.repeat(w));

  return lines.join('\n');
}

function formatMarkdown(extractResult, transformResult, loadResult, clientName, args) {
  const lines = [];

  lines.push('# S/4HANA Data Migration (ETL) Report');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Client | ${clientName} |`);
  lines.push(`| Date | ${new Date().toISOString().split('T')[0]} |`);
  lines.push(`| Data Cutoff | ${args.cutoffDate} |`);
  lines.push(`| Target Type | ${args.targetType} |`);
  lines.push(`| Records Extracted | ${formatNumber(extractResult.stats.totalRecords)} |`);
  lines.push(`| Records Loaded | ${formatNumber(loadResult.stats.totalRecordsLoaded)} |`);
  lines.push(`| Errors | ${formatNumber(loadResult.stats.totalErrors)} |`);
  lines.push('');

  lines.push('## Extraction');
  lines.push('');
  lines.push('| Module | Records | Duration |');
  lines.push('| --- | --- | --- |');
  for (const ext of extractResult.extractions) {
    lines.push(`| ${ext.module} | ${formatNumber(ext.totalRecords)} | ${ext.estimatedDuration} |`);
  }
  lines.push('');

  lines.push('## Transformation Mappings');
  lines.push('');
  lines.push('| Source | Target | API | Records |');
  lines.push('| --- | --- | --- | --- |');
  for (const t of transformResult.transformations) {
    for (const m of t.tableMappings) {
      lines.push(`| ${m.sourceTable} | ${m.targetTable} | ${m.targetAPI || '-'} | ${formatNumber(m.outputRecords)} |`);
    }
  }
  lines.push('');

  lines.push('## Load Results');
  lines.push('');
  lines.push('| Module | Loaded | Errors | Status |');
  lines.push('| --- | --- | --- | --- |');
  for (const load of loadResult.loads) {
    lines.push(`| ${load.module} | ${formatNumber(load.recordsLoaded)} | ${load.errors} | ${load.status} |`);
  }
  lines.push('');

  lines.push('---');
  lines.push('*Data migration report generated by SEN Migration Tool*');

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
  console.log(`  Cutoff Date: ${args.cutoffDate}`);
  console.log('  Running Extract-Transform-Load pipeline...');
  console.log('');

  try {
    // Extract
    console.log('  [1/3] Extracting source data...');
    const extractor = new Extractor(gateway, {
      verbose: args.verbose,
      cutoffDate: args.cutoffDate,
      modules: args.modules,
    });
    const extractResult = await extractor.extract();
    console.log(`        Extracted ${formatNumber(extractResult.stats.totalRecords)} records`);

    // Transform
    console.log('  [2/3] Transforming data...');
    const transformer = new Transformer({ verbose: args.verbose });
    const transformResult = transformer.transform(extractResult);
    console.log(`        Transformed ${formatNumber(transformResult.stats.totalOutputRecords)} records`);

    // Load
    console.log('  [3/3] Loading into target...');
    const loader = new Loader(gateway, {
      verbose: args.verbose,
      targetType: args.targetType,
    });
    const loadResult = await loader.load(transformResult);
    console.log(`        Loaded ${formatNumber(loadResult.stats.totalRecordsLoaded)} records`);
    console.log('');

    const isMarkdown = args.format === 'md' || args.format === 'markdown';
    if (isMarkdown) {
      console.log(formatMarkdown(extractResult, transformResult, loadResult, args.clientName, args));
    } else {
      console.log(formatTerminal(extractResult, transformResult, loadResult, args.clientName, args));
    }
  } catch (err) {
    console.error(`Data migration failed: ${err.message}`);
    if (args.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
