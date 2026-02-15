#!/usr/bin/env node

/**
 * S/4HANA Custom Code Remediation CLI
 *
 * Usage:
 *   npm run remediate                          # Mock mode, dry run
 *   npm run remediate -- --format md           # Markdown output
 *   npm run remediate -- -P /path/to/vsp -S DEV  # Live SAP via vsp
 *   npm run remediate -- --no-dry-run          # Apply changes (vsp mode)
 */

const SapGateway = require('../agent/sap-gateway');
const Remediator = require('./remediator');

function parseArgs(argv) {
  const args = {
    format: 'terminal',
    clientName: 'SAP Client',
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
      case '--no-dry-run':
        args.dryRun = false;
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
S/4HANA Custom Code Remediation
================================

Scans custom code, identifies S/4HANA compatibility issues, and applies
automated transforms where possible. Produces a remediation report with
diffs and manual review items.

Runs in mock mode with dry-run by default (no SAP system required).

Usage:
  npm run remediate [options]

Options:
  -f, --format <fmt>       Output format: terminal (default) or md
  -c, --client <name>      Client name for the report header
  -s, --sap-system <url>   SAP system URL (enables live connection)
  -P, --vsp-path <path>    Path to vsp binary (enables vsp mode)
  -S, --vsp-system <name>  vsp system profile (from .vsp.json)
  --no-dry-run             Apply changes (only effective in vsp mode)
  -v, --verbose            Show detailed remediation logs
  -h, --help               Show this help

Examples:
  npm run remediate
  npm run remediate -- --format md --client "Acme Corp"
  npm run remediate -- -P /usr/local/bin/vsp -S DEV --no-dry-run -v
  `);
}

function formatTerminal(result, clientName) {
  const lines = [];
  const w = 70;
  const { stats, remediations } = result;

  lines.push('');
  lines.push('='.repeat(w));
  lines.push('  S/4HANA Custom Code Remediation Report');
  lines.push('='.repeat(w));
  lines.push(`  Client:    ${clientName}`);
  lines.push(`  Date:      ${new Date().toISOString().split('T')[0]}`);
  lines.push(`  Mode:      ${result.scanResult ? 'Assessment + Remediation' : 'Remediation'}`);
  lines.push('='.repeat(w));
  lines.push('');

  // Stats
  lines.push('-'.repeat(w));
  lines.push('  REMEDIATION SUMMARY');
  lines.push('-'.repeat(w));
  lines.push('');
  lines.push(`  Total Findings:    ${stats.totalFindings}`);
  lines.push(`  Auto-Fixed:        ${stats.autoFixed}`);
  lines.push(`  Manual Review:     ${stats.manualReview}`);
  lines.push(`  No Transform:      ${stats.noTransform}`);
  lines.push(`  Errors:            ${stats.errors}`);
  lines.push('');

  const pct = stats.totalFindings > 0
    ? Math.round((stats.autoFixed / stats.totalFindings) * 100)
    : 0;
  const barFilled = Math.round(pct / 5);
  lines.push(`  Auto-fix Rate:     ${pct}%`);
  lines.push(`  [${'#'.repeat(barFilled)}${'.'.repeat(20 - barFilled)}]`);
  lines.push('');

  // Fixed items
  const fixed = remediations.filter((r) => r.status === 'fixed');
  if (fixed.length > 0) {
    lines.push('-'.repeat(w));
    lines.push('  AUTO-FIXED ITEMS');
    lines.push('-'.repeat(w));
    lines.push('');
    for (const r of fixed) {
      const sevTag = r.severity === 'critical' ? '[!!]' : r.severity === 'high' ? '[! ]' : '[~ ]';
      lines.push(`  ${sevTag} ${r.ruleId}: ${r.title}`);
      lines.push(`      Object:  ${r.object} (${r.objectType})`);
      lines.push(`      Changes: ${r.changeCount} replacement(s)`);
      if (r.changes && r.changes.length > 0) {
        const c = r.changes[0];
        if (c.from && c.to) {
          lines.push(`      Sample:  "${c.from}" -> "${c.to}"`);
        }
      }
      lines.push('');
    }
  }

  // Manual review items
  const manual = remediations.filter((r) => r.status === 'manual-review');
  if (manual.length > 0) {
    lines.push('-'.repeat(w));
    lines.push('  MANUAL REVIEW REQUIRED');
    lines.push('-'.repeat(w));
    lines.push('');
    for (const r of manual) {
      const sevTag = r.severity === 'critical' ? '[!!]' : r.severity === 'high' ? '[! ]' : '[~ ]';
      lines.push(`  ${sevTag} ${r.ruleId}: ${r.title}`);
      lines.push(`      Object:  ${r.object}`);
      lines.push(`      Action:  ${r.remediation || r.reason}`);
      lines.push('');
    }
  }

  // Diffs
  const withDiffs = remediations.filter((r) => r.diff);
  const shownDiffs = new Set();
  if (withDiffs.length > 0) {
    lines.push('-'.repeat(w));
    lines.push('  CODE DIFFS');
    lines.push('-'.repeat(w));
    lines.push('');
    for (const r of withDiffs) {
      if (shownDiffs.has(r.object)) continue;
      shownDiffs.add(r.object);
      const diffLines = r.diff.split('\n').slice(0, 30);
      for (const dl of diffLines) {
        lines.push(`  ${dl}`);
      }
      if (r.diff.split('\n').length > 30) {
        lines.push(`  ... (${r.diff.split('\n').length - 30} more lines)`);
      }
      lines.push('');
    }
  }

  lines.push('='.repeat(w));
  lines.push('  Remediation report generated by SEN Migration Tool');
  lines.push('='.repeat(w));

  return lines.join('\n');
}

function formatMarkdown(result, clientName) {
  const lines = [];
  const { stats, remediations } = result;

  lines.push('# S/4HANA Custom Code Remediation Report');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Client | ${clientName} |`);
  lines.push(`| Date | ${new Date().toISOString().split('T')[0]} |`);
  lines.push(`| Total Findings | ${stats.totalFindings} |`);
  lines.push(`| Auto-Fixed | ${stats.autoFixed} |`);
  lines.push(`| Manual Review | ${stats.manualReview} |`);
  lines.push(`| Errors | ${stats.errors} |`);
  lines.push('');

  // Fixed
  const fixed = remediations.filter((r) => r.status === 'fixed');
  if (fixed.length > 0) {
    lines.push('## Auto-Fixed Items');
    lines.push('');
    lines.push('| Rule | Object | Severity | Changes |');
    lines.push('| --- | --- | --- | --- |');
    for (const r of fixed) {
      lines.push(`| ${r.ruleId} | ${r.object} | ${r.severity} | ${r.changeCount} |`);
    }
    lines.push('');
  }

  // Manual
  const manual = remediations.filter((r) => r.status === 'manual-review');
  if (manual.length > 0) {
    lines.push('## Manual Review Required');
    lines.push('');
    lines.push('| Rule | Object | Severity | Action |');
    lines.push('| --- | --- | --- | --- |');
    for (const r of manual) {
      lines.push(`| ${r.ruleId} | ${r.object} | ${r.severity} | ${r.remediation || r.reason} |`);
    }
    lines.push('');
  }

  // Diffs
  const withDiffs = remediations.filter((r) => r.diff);
  const shownDiffs = new Set();
  if (withDiffs.length > 0) {
    lines.push('## Code Diffs');
    lines.push('');
    for (const r of withDiffs) {
      if (shownDiffs.has(r.object)) continue;
      shownDiffs.add(r.object);
      lines.push(`### ${r.object}`);
      lines.push('');
      lines.push('```diff');
      lines.push(r.diff);
      lines.push('```');
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('*Remediation report generated by SEN Migration Tool*');

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
  console.log(`  Dry Run: ${args.dryRun ? 'YES (no changes written)' : 'NO (changes will be applied)'}`);
  console.log('  Scanning and remediating custom code...');
  console.log('');

  try {
    const remediator = new Remediator(gateway, {
      verbose: args.verbose,
      dryRun: args.dryRun,
    });
    const result = await remediator.remediate();

    console.log(`  Processed ${result.stats.totalFindings} findings`);
    console.log(`  Auto-fixed: ${result.stats.autoFixed}, Manual review: ${result.stats.manualReview}`);
    console.log('');

    const isMarkdown = args.format === 'md' || args.format === 'markdown';
    if (isMarkdown) {
      console.log(formatMarkdown(result, args.clientName));
    } else {
      console.log(formatTerminal(result, args.clientName));
    }
  } catch (err) {
    console.error(`Remediation failed: ${err.message}`);
    if (args.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
