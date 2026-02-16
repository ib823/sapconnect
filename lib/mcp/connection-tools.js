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
 * MCP Connection Tool Definitions
 *
 * 6 MCP tool definitions for SAP system connectivity — covering connection
 * testing, status checks, configuration validation, RFC/OData-specific probes,
 * and authorization verification.
 *
 * Same format as TOOL_DEFINITIONS in server.js for seamless registration.
 */

'use strict';

const CONNECTION_TOOL_DEFINITIONS = [
  {
    name: 'connection_test',
    description: 'Test SAP system connectivity. Attempts a ping/handshake to the specified SAP host and returns connection details, timing, and SAP version info.',
    inputSchema: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'SAP application server hostname or IP address' },
        systemNumber: { type: 'string', description: 'SAP system number (e.g., "00", "01")' },
        client: { type: 'string', description: 'SAP client number (e.g., "100", "800")' },
        user: { type: 'string', description: 'SAP user for authentication' },
        password: { type: 'string', description: 'SAP user password' },
        connectionType: { type: 'string', description: 'Connection type: "direct", "load-balanced", or "odata"', default: 'direct' },
      },
    },
    readOnly: true,
  },
  {
    name: 'connection_status',
    description: 'Get current connection status including mode, active connection details, and available capabilities (RFC, OData, ADT).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    readOnly: true,
  },
  {
    name: 'connection_setup_validate',
    description: 'Validate connection configuration before attempting to connect. Checks required fields, port ranges, client number format, and connectivity type consistency.',
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object', description: 'Connection parameters to validate (host, systemNumber, client, user, connectionType, etc.)' },
      },
      required: ['config'],
    },
    readOnly: true,
  },
  {
    name: 'connection_check_rfc',
    description: 'Check RFC connectivity specifically. Verifies the node-rfc SDK is available, the host is reachable, and standard function modules are accessible.',
    inputSchema: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'SAP application server hostname or IP address' },
        systemNumber: { type: 'string', description: 'SAP system number (e.g., "00", "01")' },
      },
    },
    readOnly: true,
  },
  {
    name: 'connection_check_odata',
    description: 'Check OData connectivity specifically. Verifies the base URL is reachable, CSRF token can be obtained, and services are discoverable.',
    inputSchema: {
      type: 'object',
      properties: {
        baseUrl: { type: 'string', description: 'OData base URL (e.g., "https://sap-s4d.example.com:443/sap/opu/odata/sap/")' },
        service: { type: 'string', description: 'OData service name to probe (e.g., "API_BUSINESS_PARTNER")' },
      },
    },
    readOnly: true,
  },
  {
    name: 'connection_check_authorizations',
    description: 'Check SAP user authorizations. Returns the status of key authorization objects (S_RFC, S_TABU_DIS, S_DEVELOP, S_TCODE, S_CTS_ADMI) and an overall sufficiency assessment.',
    inputSchema: {
      type: 'object',
      properties: {
        user: { type: 'string', description: 'SAP user name to check authorizations for' },
      },
    },
    readOnly: true,
  },
];

module.exports = { CONNECTION_TOOL_DEFINITIONS };
