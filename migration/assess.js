#!/usr/bin/env node

/**
 * S/4HANA Migration Assessment CLI
 *
 * Usage:
 *   npm run assess                          # Mock mode assessment
 *   npm run assess -- --format md           # Markdown output
 *   npm run assess -- --client "Acme Corp"  # With client name
 *   npm run assess -- -P /path/to/vsp -S DEV  # Live SAP via vsp
 */

const SapGateway = require('../agent/sap-gateway');
const Scanner = require('./scanner');
const Analyzer = require('./analyzer');
const AssessmentReport = require('./report');
const InterfaceScanner = require('./interface-scanner');
const UsageAnalyzer = require('./usage-analyzer');
const AtcClient = require('./atc-client');

function parseArgs(argv) {
  const args = {
    format: 'terminal',
    clientName: 'SAP Client',
    systemId: 'ECC',
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
      case '--system-id':
        args.systemId = argv[++i];
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
      case '--interfaces':
        args.interfaces = true;
        break;
      case '--atc':
        args.atc = true;
        break;
      case '--usage':
        args.usage = true;
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
S/4HANA Migration Readiness Assessment
=======================================

Scans an SAP ECC system for custom code, analyzes S/4HANA compatibility,
and produces a migration readiness report with remediation roadmap.

Runs in mock mode by default (no SAP system required).

Usage:
  npm run assess [options]

Options:
  -f, --format <fmt>       Output format: terminal (default) or md
  -c, --client <name>      Client name for the report header
  --system-id <id>         System ID (e.g., PRD, QAS, DEV)
  -s, --sap-system <url>   SAP system URL (enables live connection)
  -P, --vsp-path <path>    Path to vsp binary (enables vsp mode)
  -S, --vsp-system <name>  vsp system profile (from .vsp.json)
  --interfaces             Include interface inventory in assessment
  --atc                    Run ATC S/4HANA readiness check
  --usage                  Analyze object usage and dead code
  -v, --verbose            Show detailed scan/analysis logs
  -h, --help               Show this help

Environment Variables:
  VSP_PATH                 Path to vsp binary
  VSP_SYSTEM               vsp system profile name
  SAP_HOSTNAME             SAP system hostname
  SAP_USERNAME             SAP system username
  SAP_PASSWORD             SAP system password

Examples:
  npm run assess
  npm run assess -- --format md --client "Acme Corp"
  npm run assess -- -P /usr/local/bin/vsp -S PRD --client "BigCo" -v
  `);
}

async function main() {
  const args = parseArgs(process.argv);

  // Set up gateway (reuses agent/sap-gateway.js)
  const gateway = new SapGateway({
    system: args.sapSystem,
    vspPath: args.vspPath,
    vspSystem: args.vspSystem,
    verbose: args.verbose,
  });

  console.log('');
  console.log(`  Mode: ${gateway.mode.toUpperCase()}`);
  if (gateway.mode === 'vsp') {
    console.log(`  vsp system: ${gateway.vspSystem || '(default)'}`);
  }
  console.log('  Scanning custom code...');
  console.log('');

  try {
    // Phase 1: Scan
    const scanner = new Scanner(gateway, { verbose: args.verbose });
    const scanResult = await scanner.scan();

    console.log(`  Found ${scanResult.stats.objects} custom objects in ${scanResult.stats.packages} packages`);
    console.log(`  Read ${scanResult.stats.sourcesRead} source files`);
    console.log('  Analyzing S/4HANA compatibility...');
    console.log('');

    // Phase 2: Analyze
    const analyzer = new Analyzer({ verbose: args.verbose });
    const analysis = analyzer.analyze(scanResult);

    // Optional: Interface inventory
    let interfaceData = null;
    if (args.interfaces) {
      console.log('  Scanning interfaces...');
      const ifScanner = new InterfaceScanner(gateway, { verbose: args.verbose });
      interfaceData = await ifScanner.scan();
      console.log(`  Found ${interfaceData.summary.totalRfcDestinations} RFC destinations, ${interfaceData.summary.totalIdocFlows} IDoc flows`);
      console.log('');
    }

    // Optional: ATC check
    let atcData = null;
    if (args.atc) {
      console.log('  Running ATC S/4HANA readiness check...');
      const atcClient = new AtcClient(gateway, { verbose: args.verbose });
      const objectNames = scanResult.objects.map((o) => o.name);
      atcData = await atcClient.runCheck(objectNames);
      console.log(`  ATC: ${atcData.summary.totalFindings} findings across ${atcData.summary.objectsWithFindings} objects`);
      console.log('');
    }

    // Optional: Usage analysis
    let usageData = null;
    if (args.usage) {
      console.log('  Analyzing object usage...');
      const usageAnalyzer = new UsageAnalyzer(gateway, { verbose: args.verbose });
      const objectNames = scanResult.objects.map((o) => o.name);
      usageData = await usageAnalyzer.analyze(objectNames);
      console.log(`  Usage: ${usageData.summary.deadCodeObjects} potential dead code objects (${usageData.summary.deadCodePercentage}%)`);
      console.log('');
    }

    // Factor optional data into analysis
    if (interfaceData || atcData) {
      analyzer.enrichAnalysis(analysis, { interfaceData, atcData, usageData });
    }

    // Phase 3: Report
    const report = new AssessmentReport(analysis, scanResult, {
      clientName: args.clientName,
      systemId: args.systemId,
      interfaceData,
      atcData,
      usageData,
    });

    const isMarkdown = args.format === 'md' || args.format === 'markdown';
    if (isMarkdown) {
      console.log(report.toMarkdown());
    } else {
      console.log(report.toTerminal());
    }
  } catch (err) {
    console.error(`Assessment failed: ${err.message}`);
    if (args.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
