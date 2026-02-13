#!/usr/bin/env node

/**
 * S/4HANA Target Configuration CLI
 *
 * Usage:
 *   npm run configure                          # Mock mode
 *   npm run configure -- --format md           # Markdown output
 *   npm run configure -- --target private      # Private cloud mode
 *   npm run configure -- -P /path/to/vsp -S DEV  # Live SAP via vsp
 */

const SapGateway = require('../agent/sap-gateway');
const ConfigReader = require('./config-reader');
const ConfigWriter = require('./config-writer');

function parseArgs(argv) {
  const args = {
    format: 'terminal',
    clientName: 'SAP Client',
    targetType: 'public',
    dryRun: true,
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
      case '--target':
        args.targetType = argv[++i];
        break;
      case '--no-dry-run':
        args.dryRun = false;
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
S/4HANA Target Configuration
==============================

Reads source ECC configuration and applies it to the S/4HANA target.
Covers org structure, GL accounts, tax codes, payment terms, and
number ranges.

Runs in mock mode by default (no SAP system required).

Usage:
  npm run configure [options]

Options:
  -f, --format <fmt>       Output format: terminal (default) or md
  -c, --client <name>      Client name for the report header
  --target <type>          Target type: public (default) or private
  --no-dry-run             Apply changes (only in live mode)
  -s, --sap-system <url>   SAP system URL (enables live connection)
  -P, --vsp-path <path>    Path to vsp binary (enables vsp mode)
  -S, --vsp-system <name>  vsp system profile (from .vsp.json)
  -v, --verbose            Show detailed configuration logs
  -h, --help               Show this help

Examples:
  npm run configure
  npm run configure -- --format md --client "Acme Corp"
  npm run configure -- --target private -v
  `);
}

function formatTerminal(config, writeResult, clientName, args) {
  const lines = [];
  const w = 70;

  lines.push('');
  lines.push('='.repeat(w));
  lines.push('  S/4HANA Target Configuration Report');
  lines.push('='.repeat(w));
  lines.push(`  Client:    ${clientName}`);
  lines.push(`  Date:      ${new Date().toISOString().split('T')[0]}`);
  lines.push(`  Target:    ${args.targetType === 'public' ? 'Public Cloud' : 'Private Cloud'}`);
  lines.push(`  Dry Run:   ${args.dryRun ? 'YES' : 'NO'}`);
  lines.push('='.repeat(w));
  lines.push('');

  // Source config summary
  lines.push('-'.repeat(w));
  lines.push('  SOURCE CONFIGURATION');
  lines.push('-'.repeat(w));
  lines.push('');
  const s = config.summary;
  lines.push(`  Company Codes:     ${s.companyCodes}`);
  lines.push(`  Plants:            ${s.plants}`);
  lines.push(`  Sales Orgs:        ${s.salesOrgs}`);
  lines.push(`  Purchase Orgs:     ${s.purchaseOrgs}`);
  lines.push(`  GL Accounts:       ${s.glAccounts}`);
  lines.push(`  Tax Codes:         ${s.taxCodes}`);
  lines.push(`  Payment Terms:     ${s.paymentTerms}`);
  lines.push(`  Currencies:        ${s.currencies}`);
  lines.push('');

  // Write results
  lines.push('-'.repeat(w));
  lines.push('  CONFIGURATION APPLIED');
  lines.push('-'.repeat(w));
  lines.push('');
  lines.push(`  Total Items:       ${writeResult.stats.totalItems}`);
  lines.push(`  Applied:           ${writeResult.stats.applied}`);
  lines.push(`  Skipped:           ${writeResult.stats.skipped}`);
  lines.push(`  Errors:            ${writeResult.stats.errors}`);
  lines.push('');

  for (const r of writeResult.results) {
    lines.push(`  ${r.category}`);
    lines.push(`    Method: ${r.method}`);
    lines.push(`    Items: ${r.applied} applied, ${r.skipped} skipped`);
    for (const d of r.details) {
      if (d.count !== undefined) {
        lines.push(`      ${(d.type || d.code || d.object).padEnd(30)} ${String(d.count).padStart(6)}  ${d.status}`);
      } else {
        lines.push(`      ${(d.type || d.code || d.object).padEnd(30)} ${(d.value || d.description || d.range || '').padEnd(20)} ${d.status}`);
      }
    }
    lines.push('');
  }

  lines.push('='.repeat(w));
  lines.push('  Configuration report generated by SAP Connect Migration Tool');
  lines.push('='.repeat(w));

  return lines.join('\n');
}

function formatMarkdown(config, writeResult, clientName, args) {
  const lines = [];

  lines.push('# S/4HANA Target Configuration Report');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Client | ${clientName} |`);
  lines.push(`| Date | ${new Date().toISOString().split('T')[0]} |`);
  lines.push(`| Target Type | ${args.targetType} |`);
  lines.push(`| Items Applied | ${writeResult.stats.applied} |`);
  lines.push(`| Errors | ${writeResult.stats.errors} |`);
  lines.push('');

  const s = config.summary;
  lines.push('## Source Configuration');
  lines.push('');
  lines.push('| Setting | Count |');
  lines.push('| --- | --- |');
  lines.push(`| Company Codes | ${s.companyCodes} |`);
  lines.push(`| Plants | ${s.plants} |`);
  lines.push(`| Sales Organizations | ${s.salesOrgs} |`);
  lines.push(`| Purchase Organizations | ${s.purchaseOrgs} |`);
  lines.push(`| GL Accounts | ${s.glAccounts} |`);
  lines.push(`| Tax Codes | ${s.taxCodes} |`);
  lines.push(`| Payment Terms | ${s.paymentTerms} |`);
  lines.push('');

  lines.push('## Configuration Results');
  lines.push('');
  for (const r of writeResult.results) {
    lines.push(`### ${r.category}`);
    lines.push('');
    lines.push(`**Method:** ${r.method}`);
    lines.push('');
    lines.push('| Item | Value | Status |');
    lines.push('| --- | --- | --- |');
    for (const d of r.details) {
      const name = d.type || d.code || d.object;
      const value = d.count !== undefined ? d.count : (d.value || d.description || d.range || '-');
      lines.push(`| ${name} | ${value} | ${d.status} |`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('*Configuration report generated by SAP Connect Migration Tool*');

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
  console.log(`  Target: ${args.targetType === 'public' ? 'Public Cloud' : 'Private Cloud'}`);
  console.log('  Reading source config and applying to target...');
  console.log('');

  try {
    // Read source config
    console.log('  [1/2] Reading source ECC configuration...');
    const reader = new ConfigReader(gateway, { verbose: args.verbose });
    const config = await reader.read();
    console.log(`        Found ${config.summary.glAccounts} GL accounts, ${config.summary.companyCodes} company codes`);

    // Write to target
    console.log('  [2/2] Applying configuration to target...');
    const writer = new ConfigWriter(gateway, {
      verbose: args.verbose,
      targetType: args.targetType,
      dryRun: args.dryRun,
    });
    const writeResult = await writer.write(config);
    console.log(`        Applied ${writeResult.stats.applied} configuration items`);
    console.log('');

    const isMarkdown = args.format === 'md' || args.format === 'markdown';
    if (isMarkdown) {
      console.log(formatMarkdown(config, writeResult, args.clientName, args));
    } else {
      console.log(formatTerminal(config, writeResult, args.clientName, args));
    }
  } catch (err) {
    console.error(`Configuration failed: ${err.message}`);
    if (args.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
