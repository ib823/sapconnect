/**
 * MCP Config Tool Definitions
 *
 * 5 MCP tool definitions for SAP configuration management — covering
 * source system reading, target system writing (safety-gated), safety checks,
 * human approval requests, and audit trail retrieval.
 *
 * Same format as TOOL_DEFINITIONS in server.js for seamless registration.
 */

'use strict';

const CONFIG_TOOL_DEFINITIONS = [
  {
    name: 'config_read_source',
    description: 'Read configuration from source SAP system. Returns entries for the specified config type (company codes, plants, sales orgs, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        configType: { type: 'string', description: 'Configuration type (e.g., "company-codes", "plants", "sales-orgs", "purchasing-orgs", "chart-of-accounts")' },
        systemId: { type: 'string', description: 'Source system ID (default: auto-detect)' },
      },
      required: ['configType'],
    },
  },
  {
    name: 'config_write_target',
    description: 'Write configuration to target system. Safety-gated write operation — respects dryRun flag and transport requirements.',
    inputSchema: {
      type: 'object',
      properties: {
        configType: { type: 'string', description: 'Configuration type to write' },
        data: { type: 'object', description: 'Configuration data to write to the target system' },
        dryRun: { type: 'boolean', description: 'If true, validate only without writing (default: true)', default: true },
        transport: { type: 'string', description: 'Transport request number for the change' },
      },
      required: ['configType', 'data'],
    },
  },
  {
    name: 'config_safety_check',
    description: 'Run safety check on a pending write operation. Validates the operation against safety gates before execution.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', description: 'Description of the operation to check' },
        artifact: { type: 'object', description: 'Artifact details for gate validation' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'config_request_approval',
    description: 'Request human approval for a write operation. Creates an approval request with the specified urgency level.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', description: 'Description of the operation requiring approval' },
        details: { type: 'object', description: 'Additional details about the operation' },
        urgency: { type: 'string', description: 'Urgency level: "normal", "high", or "critical"', default: 'normal' },
      },
      required: ['operation'],
    },
  },
  {
    name: 'config_get_audit_trail',
    description: 'Get the audit trail of all configuration operations. Supports filtering by date, artifact type, and approval status.',
    inputSchema: {
      type: 'object',
      properties: {
        since: { type: 'string', description: 'ISO date — only return entries after this date' },
        artifactType: { type: 'string', description: 'Filter by artifact type' },
        approved: { type: 'boolean', description: 'Filter by approval status' },
      },
    },
  },
];

module.exports = { CONFIG_TOOL_DEFINITIONS };
