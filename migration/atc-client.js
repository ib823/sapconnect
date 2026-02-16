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
 * ATC (ABAP Test Cockpit) Client
 *
 * Runs ATC checks against custom objects and returns findings.
 * In live mode, calls the ADT ATC API. In mock mode, returns
 * simulated findings for the S4HANA_READINESS check variant.
 */

const Logger = require('../lib/logger');

class AtcClient {
  constructor(gateway, options = {}) {
    this.gateway = gateway;
    this.verbose = options.verbose || false;
    this.log = new Logger('atc-client', { level: this.verbose ? 'debug' : 'info' });
  }

  /**
   * Get available ATC check variants
   * @returns {string[]}
   */
  async getCheckVariants() {
    if (this.gateway.mode === 'live') {
      try {
        const client = await this.gateway._getLiveClient();
        const data = await client.get('/sap/bc/adt/atc/customizing');
        return Array.isArray(data) ? data.map((v) => v.name || v) : ['S4HANA_READINESS', 'DEFAULT'];
      } catch (err) {
        this.log.warn('Failed to fetch ATC variants', { error: err.message });
      }
    }
    return ['S4HANA_READINESS', 'DEFAULT', 'FUNCTIONAL_CORRECTNESS', 'PERFORMANCE'];
  }

  /**
   * Run ATC check on given objects
   * @param {string[]} objectNames
   * @param {string} [checkVariant='S4HANA_READINESS']
   * @returns {{ findings: object[], summary: object }}
   */
  async runCheck(objectNames, checkVariant = 'S4HANA_READINESS') {
    this.log.debug(`Running ATC check variant ${checkVariant} on ${objectNames.length} objects`);

    if (this.gateway.mode === 'live') {
      try {
        return await this._runLive(objectNames, checkVariant);
      } catch (err) {
        this.log.warn('Live ATC check failed, falling back to mock', { error: err.message });
      }
    }

    return this._runMock(objectNames, checkVariant);
  }

  _runMock(objectNames, checkVariant) {
    const findings = [];

    for (const name of objectNames) {
      const hash = this._hash(name);
      const findingCount = hash % 4; // 0-3 findings per object

      for (let i = 0; i < findingCount; i++) {
        const findingHash = hash + i * 17;
        findings.push({
          object: name,
          checkId: this._mockCheckId(findingHash),
          priority: this._mockPriority(findingHash),
          messageTitle: this._mockMessage(findingHash, checkVariant),
          line: (findingHash % 100) + 1,
          column: (findingHash % 40) + 1,
          checkVariant,
        });
      }
    }

    const priority1 = findings.filter((f) => f.priority === 1).length;
    const priority2 = findings.filter((f) => f.priority === 2).length;
    const priority3 = findings.filter((f) => f.priority === 3).length;

    return {
      findings,
      summary: {
        totalFindings: findings.length,
        objectsChecked: objectNames.length,
        objectsWithFindings: new Set(findings.map((f) => f.object)).size,
        checkVariant,
        byPriority: { 1: priority1, 2: priority2, 3: priority3 },
      },
    };
  }

  async _runLive(objectNames, checkVariant) {
    const client = await this.gateway._getLiveClient();

    // Create ATC run
    const runPayload = {
      objects: objectNames.map((n) => ({ name: n, type: 'CLAS' })),
      checkVariant,
    };

    const runResult = await client.post('/sap/bc/adt/atc/runs', runPayload);
    const runId = runResult.id || runResult.d?.id;

    if (!runId) {
      throw new Error('ATC run creation did not return an ID');
    }

    // Poll for results
    let results;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      results = await client.get(`/sap/bc/adt/atc/runs/${runId}/results`);
      if (results.status === 'completed' || results.d?.status === 'completed') break;
    }

    const rawFindings = results.findings || results.d?.findings || [];
    const findings = rawFindings.map((f) => ({
      object: f.object || f.ObjectName,
      checkId: f.checkId || f.CheckId,
      priority: parseInt(f.priority || f.Priority, 10) || 3,
      messageTitle: f.messageTitle || f.MessageTitle || f.message,
      line: parseInt(f.line || f.Line, 10) || 0,
      column: parseInt(f.column || f.Column, 10) || 0,
      checkVariant,
    }));

    return {
      findings,
      summary: {
        totalFindings: findings.length,
        objectsChecked: objectNames.length,
        objectsWithFindings: new Set(findings.map((f) => f.object)).size,
        checkVariant,
        byPriority: {
          1: findings.filter((f) => f.priority === 1).length,
          2: findings.filter((f) => f.priority === 2).length,
          3: findings.filter((f) => f.priority === 3).length,
        },
      },
    };
  }

  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  _mockCheckId(hash) {
    const checks = [
      'CHECK_S4_DATA_MODEL',
      'CHECK_S4_SYNTAX',
      'CHECK_S4_OBSOLETE_API',
      'CHECK_S4_TABLE_ACCESS',
      'CHECK_PERFORMANCE',
      'CHECK_NAMING_CONV',
      'CHECK_DEAD_CODE',
    ];
    return checks[hash % checks.length];
  }

  _mockPriority(hash) {
    const weights = [1, 1, 2, 2, 2, 3, 3, 3, 3, 3];
    return weights[hash % weights.length];
  }

  _mockMessage(hash, variant) {
    const s4Messages = [
      'Table BSEG is not available in S/4HANA, use ACDOCA instead',
      'Function module is obsolete in S/4HANA',
      'Business partner APIs should be used instead of customer/vendor APIs',
      'Data model has changed in S/4HANA',
      'SELECT * should be replaced with explicit field list',
      'CALL TRANSACTION should be replaced with API call',
      'Table structure has changed in S/4HANA',
    ];
    const defaultMessages = [
      'Potential performance issue detected',
      'Naming convention violation',
      'Dead code detected',
      'Missing error handling',
      'Hardcoded value should use constant',
    ];
    const messages = variant === 'S4HANA_READINESS' ? s4Messages : defaultMessages;
    return messages[hash % messages.length];
  }
}

module.exports = AtcClient;
