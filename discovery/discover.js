#!/usr/bin/env node

/**
 * SAP API Discovery CLI
 *
 * Usage:
 *   npm run discover                     # Mock mode (default)
 *   npm run discover -- --system <url>   # Live mode (requires SAP credentials)
 *   npm run discover -- --format md      # Output as markdown
 *   npm run discover -- --help           # Show help
 */

const Scanner = require('./scanner');
const Report = require('./report');

function parseArgs(argv) {
  const args = { format: 'terminal' };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--system':
      case '-s':
        args.system = argv[++i];
        break;
      case '--username':
      case '-u':
        args.username = argv[++i];
        break;
      case '--password':
      case '-p':
        args.password = argv[++i];
        break;
      case '--format':
      case '-f':
        args.format = argv[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        console.error(`Unknown argument: ${argv[i]}`);
        printHelp();
        process.exit(1);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
SAP API Discovery Tool
=======================

Scans an SAP system to discover available APIs, events, and extension points.

Usage:
  npm run discover                          Run in mock mode (demo)
  npm run discover -- --system <url>        Connect to a live SAP system
  npm run discover -- --format md           Output as markdown

Options:
  -s, --system <url>       SAP system URL (enables live mode)
  -u, --username <user>    SAP username (or set SAP_USERNAME env var)
  -p, --password <pass>    SAP password (or set SAP_PASSWORD env var)
  -f, --format <fmt>       Output format: terminal (default) or md
  -h, --help               Show this help

Environment Variables:
  SAP_USERNAME             SAP system username
  SAP_PASSWORD             SAP system password
  SAP_HOSTNAME             SAP system hostname

Examples:
  npm run discover
  npm run discover -- --system https://my-tenant.s4hana.cloud.sap --format md
  `);
}

async function main() {
  const args = parseArgs(process.argv);

  const scanner = new Scanner({
    system: args.system,
    username: args.username,
    password: args.password,
  });

  try {
    const results = await scanner.scan();
    const report = new Report(results);

    if (args.format === 'md' || args.format === 'markdown') {
      console.log(report.toMarkdown());
    } else {
      console.log(report.toTerminal());
    }
  } catch (err) {
    console.error(`Discovery failed: ${err.message}`);
    process.exit(1);
  }
}

main();
