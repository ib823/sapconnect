/**
 * MCP Forensic Tool Definitions
 *
 * 7 MCP tool definitions for SAP forensic extraction — covering full system
 * extraction, per-module runs, progress tracking, system info, cached results,
 * archiving advice, and formatted reports.
 *
 * Same format as TOOL_DEFINITIONS in server.js for seamless registration.
 * All tools are read-only (no write operations on the SAP system).
 */

'use strict';

const FORENSIC_TOOL_DEFINITIONS = [
  {
    name: 'forensic_run_extraction',
    description: 'Run full forensic extraction across SAP system modules. Read-only — does not modify SAP data.',
    inputSchema: {
      type: 'object',
      properties: {
        modules: { type: 'array', items: { type: 'string' }, description: 'Modules to extract (e.g., ["FI","MM","SD"]). Omit for all modules.' },
        mode: { type: 'string', description: 'Extraction depth: "quick", "standard", or "deep"', default: 'standard' },
      },
    },
  },
  {
    name: 'forensic_run_module',
    description: 'Run a single extraction module against the SAP system. Read-only — does not modify SAP data.',
    inputSchema: {
      type: 'object',
      properties: {
        module: { type: 'string', description: 'Module to extract (e.g., "FI", "MM", "SD", "PP", "WM")' },
        options: { type: 'object', description: 'Optional extraction parameters for the module' },
      },
      required: ['module'],
    },
  },
  {
    name: 'forensic_get_progress',
    description: 'Get progress of a running forensic extraction. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'forensic_get_system_info',
    description: 'Get SAP system information including version, database, kernel, and installed components. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'forensic_get_results',
    description: 'Get cached extraction results. Optionally filter by module. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        module: { type: 'string', description: 'Filter results by module (e.g., "FI"). Omit for all modules.' },
      },
    },
  },
  {
    name: 'forensic_get_archiving_advice',
    description: 'Get archiving recommendations for SAP tables based on data age and volume. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        minAge: { type: 'number', description: 'Minimum object age in months to consider for archiving', default: 12 },
      },
    },
  },
  {
    name: 'forensic_get_report',
    description: 'Get a formatted forensic extraction report. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', description: 'Report format: "json" or "markdown"', default: 'json' },
      },
    },
  },
];

module.exports = { FORENSIC_TOOL_DEFINITIONS };
