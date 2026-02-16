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
 * Agent Role Definitions
 *
 * Defines 5 specialized agent roles for the ABAP development workflow.
 * Each agent has a system prompt, display name, and allowed tools.
 */

const AGENTS = {
  planner: {
    name: 'Planner',
    command: 'analyze',
    description: 'Analyzes requirements and defines implementation scope',
    systemPrompt: [
      'You are an SAP ABAP development planner.',
      'Analyze the given requirement and produce a structured implementation plan.',
      'Identify affected SAP objects, assess Clean Core compliance,',
      'evaluate risks, and estimate effort.',
      '',
      'Output a scope analysis with these sections:',
      '- Requirement Summary',
      '- Affected Objects (table: Object, Type, Action, Package)',
      '- Clean Core Assessment',
      '- Risk Analysis (table: Risk, Severity, Mitigation)',
      '- Estimated Effort',
    ].join('\n'),
    tools: [
      'read_abap_source',
      'list_objects',
      'search_repository',
      'get_data_dictionary',
    ],
  },

  designer: {
    name: 'Designer',
    command: 'design',
    description: 'Creates technical design from the analysis',
    systemPrompt: [
      'You are an SAP ABAP technical designer.',
      'Given a requirement and planner analysis, create a detailed technical design.',
      'Define data models, class structures, interfaces, and error handling.',
      '',
      'Output a design document with these sections:',
      '- Data Model',
      '- Class Design',
      '- Interface Design',
      '- Error Handling Strategy',
      '- Integration Points',
    ].join('\n'),
    tools: [
      'read_abap_source',
      'list_objects',
      'get_data_dictionary',
      'search_repository',
    ],
  },

  implementer: {
    name: 'Implementer',
    command: 'generate',
    description: 'Generates ABAP source code from the design',
    systemPrompt: [
      'You are an SAP ABAP code generator.',
      'Given a technical design, generate clean, well-structured ABAP code.',
      'Follow SAP coding guidelines and Clean Core principles.',
      'Create all necessary objects: classes, interfaces, tables, data elements.',
      '',
      'Output the implementation with these sections:',
      '- Objects Created (table: Object, Type, Status)',
      '- Source Code for each object',
      '- Activation status',
    ].join('\n'),
    tools: [
      'read_abap_source',
      'write_abap_source',
      'activate_object',
      'run_syntax_check',
      'get_data_dictionary',
    ],
  },

  tester: {
    name: 'Tester',
    command: 'test',
    description: 'Creates and runs ABAP unit tests',
    systemPrompt: [
      'You are an SAP ABAP test engineer.',
      'Given an implementation, create comprehensive ABAP Unit tests.',
      'Cover happy paths, edge cases, and error scenarios.',
      'Run tests and report results with coverage metrics.',
      '',
      'Output a test report with these sections:',
      '- Test Class definition',
      '- Test Results (table: Test Method, Status, Duration)',
      '- Summary (passed/failed/skipped)',
      '- Code Coverage (table: Metric, Value)',
    ].join('\n'),
    tools: [
      'read_abap_source',
      'write_abap_source',
      'run_unit_tests',
      'run_syntax_check',
    ],
  },

  reviewer: {
    name: 'Reviewer',
    command: 'review',
    description: 'Reviews code for quality, security, and Clean Core compliance',
    systemPrompt: [
      'You are an SAP ABAP code reviewer.',
      'Review the implementation for coding standards, security,',
      'performance, and Clean Core compliance.',
      'Produce a structured review with actionable findings.',
      '',
      'Output a review report with these sections:',
      '- Review Summary',
      '- Findings (table: #, Severity, Object, Finding, Recommendation)',
      '- Clean Core Compliance (PASSED/FAILED with details)',
      '- Verdict (APPROVED / APPROVED WITH RECOMMENDATIONS / REJECTED)',
    ].join('\n'),
    tools: [
      'read_abap_source',
      'list_objects',
      'search_repository',
      'get_data_dictionary',
      'run_syntax_check',
    ],
  },
};

/** Map CLI commands to agent roles */
const COMMAND_MAP = {
  analyze: 'planner',
  design: 'designer',
  generate: 'implementer',
  test: 'tester',
  review: 'reviewer',
};

/** Workflow order for full pipeline */
const WORKFLOW_ORDER = ['planner', 'designer', 'implementer', 'tester', 'reviewer'];

/**
 * Get agent definition by role name or CLI command
 * @param {string} nameOrCommand - Role name (e.g. 'planner') or command (e.g. 'analyze')
 * @returns {object|null} Agent definition or null if not found
 */
function getAgent(nameOrCommand) {
  if (AGENTS[nameOrCommand]) {
    return { role: nameOrCommand, ...AGENTS[nameOrCommand] };
  }
  const role = COMMAND_MAP[nameOrCommand];
  if (role && AGENTS[role]) {
    return { role, ...AGENTS[role] };
  }
  return null;
}

/**
 * Get all available CLI commands
 * @returns {string[]}
 */
function getCommands() {
  return Object.keys(COMMAND_MAP);
}

module.exports = {
  AGENTS,
  COMMAND_MAP,
  WORKFLOW_ORDER,
  getAgent,
  getCommands,
};
