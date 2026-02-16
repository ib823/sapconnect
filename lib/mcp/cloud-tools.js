/**
 * MCP Cloud Tool Definitions
 *
 * 7 MCP tool definitions for SAP Cloud ALM integration and BTP provisioning —
 * covering project sync, task management, status updates, issue tracking,
 * BTP service provisioning, API discovery, and provisioning status.
 *
 * Same format as TOOL_DEFINITIONS in server.js for seamless registration.
 */

'use strict';

const CLOUD_TOOL_DEFINITIONS = [
  {
    name: 'cloud_alm_sync_project',
    description: 'Sync migration project with SAP Cloud ALM. Creates or updates the project definition, phases, and task structure. Write operation — requires safety gate approval.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Cloud ALM project ID (e.g., "PROJ-001"). If omitted, a new project is created.' },
        projectName: { type: 'string', description: 'Project display name (e.g., "S/4HANA Migration")' },
        phases: { type: 'array', items: { type: 'string' }, description: 'Migration phases to sync (e.g., ["discover", "prepare", "realize", "deploy"])' },
      },
    },
  },
  {
    name: 'cloud_alm_sync_task',
    description: 'Sync a specific task to SAP Cloud ALM. Updates task status, assignee, and metadata. Write operation — requires safety gate approval.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task identifier to sync (e.g., "TASK-042")' },
        status: { type: 'string', enum: ['open', 'in_progress', 'completed', 'blocked'], description: 'Task status' },
        assignee: { type: 'string', description: 'User ID or name to assign the task to' },
      },
      required: ['taskId', 'status'],
    },
  },
  {
    name: 'cloud_alm_push_status',
    description: 'Push migration status update to SAP Cloud ALM dashboard. Write operation — requires safety gate approval.',
    inputSchema: {
      type: 'object',
      properties: {
        phase: { type: 'string', description: 'Migration phase (e.g., "discover", "prepare", "realize", "deploy")' },
        status: { type: 'string', description: 'Phase status (e.g., "in_progress", "completed", "blocked")' },
        details: { type: 'object', description: 'Additional status details (e.g., { progress: 75, blockers: 2 })' },
      },
      required: ['phase', 'status'],
    },
  },
  {
    name: 'cloud_alm_create_issue',
    description: 'Create an issue or defect in SAP Cloud ALM for tracking migration problems. Write operation — requires safety gate approval.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Issue title' },
        description: { type: 'string', description: 'Detailed description of the issue' },
        priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'], description: 'Issue priority', default: 'medium' },
        category: { type: 'string', description: 'Issue category (e.g., "migration", "data-quality", "integration", "configuration")' },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'cloud_provision_btp',
    description: 'Provision BTP services for migration. Supports dry-run mode for cost estimation. Write operation — requires safety gate approval for non-dry-run execution.',
    inputSchema: {
      type: 'object',
      properties: {
        services: { type: 'array', items: { type: 'string' }, description: 'BTP services to provision (e.g., ["hana-cloud", "integration-suite", "launchpad"])' },
        landscape: { type: 'string', enum: ['cf-eu10', 'cf-us10'], description: 'BTP landscape / region', default: 'cf-eu10' },
        dryRun: { type: 'boolean', description: 'If true, only estimate costs without provisioning', default: true },
      },
      required: ['services'],
    },
  },
  {
    name: 'cloud_discover_apis',
    description: 'Discover available APIs on the target SAP system. Returns API catalog with types, versions, and authentication details. Read-only operation.',
    inputSchema: {
      type: 'object',
      properties: {
        systemType: { type: 'string', enum: ['S4HANA', 'BTP', 'SuccessFactors'], description: 'Target system type', default: 'S4HANA' },
        category: { type: 'string', description: 'Filter by API category (e.g., "masterData", "transactional", "analytics")' },
      },
    },
  },
  {
    name: 'cloud_get_provisioning_status',
    description: 'Get the current status of BTP service provisioning. Returns service states, progress, and any errors. Read-only operation.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

module.exports = { CLOUD_TOOL_DEFINITIONS };
