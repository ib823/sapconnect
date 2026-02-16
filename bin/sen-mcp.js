#!/usr/bin/env node

/**
 * SEN MCP Server — CLI Entry Point
 *
 * Launches the MCP server over stdio for AI assistant integration.
 * Usage: node bin/sen-mcp.js [--mode mock|live]
 */

'use strict';

const McpServer = require('../lib/mcp/server');
const Logger = require('../lib/logger');

const args = process.argv.slice(2);
let mode = 'mock';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--mode' && args[i + 1]) {
    mode = args[i + 1];
    i++;
  }
}

// Redirect logger to stderr so stdout stays clean for JSON-RPC
const stderrLogger = new Logger('mcp-server', {
  output: { log: (...a) => process.stderr.write(a.join(' ') + '\n') },
});

const server = new McpServer({ mode, logger: stderrLogger });
server.startStdio();
