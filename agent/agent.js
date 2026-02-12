#!/usr/bin/env node

/**
 * SAP AI Agent CLI
 *
 * Usage:
 *   npm run agent -- workflow "Add vendor rating"     # Full 5-stage pipeline
 *   npm run agent -- analyze "Add vendor rating"      # Single agent stage
 *   npm run agent -- generate "Add vendor rating" --format md  # Markdown output
 *   npm run agent -- --help                           # Show help
 */

const { Orchestrator } = require('./orchestrator');
const SapGateway = require('./sap-gateway');
const { getAgent, getCommands } = require('./agents');

function parseArgs(argv) {
  const args = { format: 'terminal', command: null, requirement: null };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--format':
      case '-f':
        args.format = argv[++i];
        break;
      case '--sap-system':
      case '-s':
        args.sapSystem = argv[++i];
        break;
      case '--api-key':
      case '-k':
        args.apiKey = argv[++i];
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
        // First positional arg is the command, rest is the requirement
        if (!args.command) {
          args.command = argv[i];
        } else if (!args.requirement) {
          args.requirement = argv[i];
        } else {
          args.requirement += ' ' + argv[i];
        }
        break;
    }
  }

  return args;
}

function printHelp() {
  console.log(`
SAP AI Agent - ABAP Development Assistant
==========================================

Multi-agent workflow for ABAP development powered by Claude AI.
Runs in mock mode by default (no SAP system or API key required).

Usage:
  npm run agent -- <command> "<requirement>" [options]

Commands:
  analyze    Run the Planner agent (scope analysis, risk assessment)
  design     Run the Designer agent (technical design, data model)
  generate   Run the Implementer agent (ABAP code generation)
  test       Run the Tester agent (unit tests, coverage)
  review     Run the Reviewer agent (code review, Clean Core check)
  workflow   Run all 5 agents in sequence (full pipeline)

Options:
  -f, --format <fmt>       Output format: terminal (default) or md
  -s, --sap-system <url>   SAP system URL (enables live SAP connection)
  -k, --api-key <key>      Anthropic API key (enables live Claude calls)
  -P, --vsp-path <path>    Path to vsp binary (enables vsp mode)
  -S, --vsp-system <name>  vsp system profile name (from .vsp.json)
  -v, --verbose            Show detailed execution logs
  -h, --help               Show this help

Environment Variables:
  ANTHROPIC_API_KEY        Anthropic API key (alternative to --api-key)
  SAP_HOSTNAME             SAP system hostname
  SAP_USERNAME             SAP system username
  SAP_PASSWORD             SAP system password
  VSP_PATH                 Path to vsp binary (alternative to --vsp-path)
  VSP_SYSTEM               vsp system profile (alternative to --vsp-system)

Examples:
  npm run agent -- workflow "Add vendor rating to purchase orders"
  npm run agent -- analyze "Add vendor rating" --format md
  npm run agent -- generate "Extend business partner validation"
  npm run agent -- review "Add vendor rating" --verbose

  # With vsp for live SAP access
  npm run agent -- analyze "Add vendor rating" --vsp-path /usr/local/bin/vsp -S DEV
  `);
}

async function main() {
  const args = parseArgs(process.argv);

  // Validate required arguments
  const validCommands = [...getCommands(), 'workflow'];
  if (!args.command) {
    console.error('Error: Missing command.\n');
    console.error(`Available commands: ${validCommands.join(', ')}`);
    console.error('Run with --help for usage information.');
    process.exit(1);
  }

  if (!validCommands.includes(args.command)) {
    console.error(`Error: Unknown command "${args.command}".\n`);
    console.error(`Available commands: ${validCommands.join(', ')}`);
    process.exit(1);
  }

  if (!args.requirement) {
    console.error('Error: Missing requirement.\n');
    console.error('Usage: npm run agent -- <command> "<requirement>"');
    console.error('Example: npm run agent -- analyze "Add vendor rating to purchase orders"');
    process.exit(1);
  }

  // Set up gateway and orchestrator
  const gateway = new SapGateway({
    system: args.sapSystem,
    vspPath: args.vspPath,
    vspSystem: args.vspSystem,
    verbose: args.verbose,
  });

  const orchestrator = new Orchestrator({
    apiKey: args.apiKey || process.env.ANTHROPIC_API_KEY,
    verbose: args.verbose,
    gateway,
  });

  try {
    const result = await orchestrator.run(args.command, args.requirement);
    const isMarkdown = args.format === 'md' || args.format === 'markdown';

    if (Array.isArray(result)) {
      // Workflow mode - multiple results
      if (isMarkdown) {
        console.log('# SAP AI Agent - Workflow Report\n');
        console.log(`**Requirement:** ${args.requirement}\n`);
        console.log(`**Mode:** ${gateway.mode.toUpperCase()}\n`);
        console.log('---\n');
        for (const r of result) {
          console.log(r.toMarkdown());
          console.log('\n---\n');
        }
      } else {
        console.log('');
        console.log('='.repeat(60));
        console.log('  SAP AI Agent - Workflow Report');
        console.log('='.repeat(60));
        console.log(`  Requirement: ${args.requirement}`);
        console.log(`  Mode:        ${gateway.mode.toUpperCase()}`);
        console.log(`  Stages:      ${result.length}`);
        for (const r of result) {
          console.log(r.toTerminal());
        }
      }
    } else {
      // Single agent mode
      if (isMarkdown) {
        console.log(`# SAP AI Agent Report\n`);
        console.log(`**Requirement:** ${args.requirement}\n`);
        console.log(`**Mode:** ${gateway.mode.toUpperCase()}\n`);
        console.log('---\n');
        console.log(result.toMarkdown());
      } else {
        console.log(result.toTerminal());
      }
    }
  } catch (err) {
    console.error(`Agent execution failed: ${err.message}`);
    if (args.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
