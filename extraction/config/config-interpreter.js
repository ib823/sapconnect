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
 * Configuration Interpreter
 *
 * Not just raw config table dumps — interprets configuration to explain
 * what the system is configured to DO in human-readable terms.
 */

const CONFIG_RULES = require('./config-rules');
const Logger = require('../../lib/logger');

class ConfigInterpreter {
  /**
   * @param {Map|object} extractionResults - All extractor results
   */
  constructor(extractionResults) {
    this.results = extractionResults;
    this.log = new Logger('config-interpreter');
    this._interpretations = [];
  }

  async interpret() {
    this._interpretations = [];

    // Gather all data into a flat lookup
    const data = this._flattenResults();

    // Run all interpretation rules
    for (const rule of CONFIG_RULES) {
      try {
        if (rule.condition(data)) {
          this._interpretations.push({
            ruleId: rule.ruleId,
            description: rule.description,
            interpretation: rule.interpretation(data),
            impact: rule.impact,
            s4hanaRelevance: rule.s4hanaRelevance,
          });
        }
      } catch (err) {
        this.log.warn(`Rule ${rule.ruleId} failed: ${err.message}`);
      }
    }

    // Module-specific interpretations
    this.interpretFI(data);
    this.interpretCO(data);
    this.interpretMM(data);
    this.interpretSD(data);
    this.interpretPP(data);
    this.interpretIntegrationPoints(data);

    return this._interpretations;
  }

  interpretFI(data) {
    // Document types analysis
    if (data.documentTypes && data.documentTypes.length > 0) {
      const customTypes = data.documentTypes.filter(t => (t.BLART || '').startsWith('Z'));
      if (customTypes.length > 0) {
        this._add('FI-DOCTYPE', 'Custom Document Types',
          `${customTypes.length} custom document type(s): ${customTypes.map(t => t.BLART).join(', ')}`,
          'Custom document types need review for S/4HANA compatibility');
      }
    }

    // Payment configuration
    if (data.paymentConfig && data.paymentConfig.length > 0) {
      this._add('FI-PAYMENT', 'Payment Program Configuration',
        `Payment program configured for ${data.paymentConfig.length} company code(s)`,
        'F110 payment program carries over but review payment methods for bank connectivity');
    }

    // Asset accounting
    if (data.assetClasses && data.assetClasses.length > 0) {
      this._add('FI-AA', 'Asset Accounting',
        `${data.assetClasses.length} asset class(es) configured with ${data.depreciationAreas?.length || 0} depreciation area(s)`,
        'S/4HANA requires migration to new asset accounting — parallel depreciation areas may simplify');
    }
  }

  interpretCO(data) {
    if (data.costElements && data.costElements.length > 0) {
      this._add('CO-ELEMENTS', 'Cost Element Structure',
        `${data.costElements.length} cost element(s) — ${data.costElements.filter(e => (e.KATYP || '') === '1').length} primary, ${data.costElements.filter(e => (e.KATYP || '') === '41' || (e.KATYP || '') === '42' || (e.KATYP || '') === '43').length} secondary`,
        'S/4HANA merges cost elements with GL accounts — review for conflicts');
    }

    if (data.costCenters && data.costCenters.length > 0) {
      this._add('CO-CCTR', 'Cost Center Structure',
        `${data.costCenters.length} cost center(s) configured`,
        'Cost center hierarchy and assignments migrate to S/4HANA');
    }
  }

  interpretMM(data) {
    if (data.movementTypes && data.movementTypes.length > 0) {
      const customMvt = data.movementTypes.filter(m => parseInt(m.BWART || '0', 10) >= 900);
      if (customMvt.length > 0) {
        this._add('MM-MVTYPE', 'Custom Movement Types',
          `${customMvt.length} custom movement type(s) (900+): ${customMvt.map(m => m.BWART).join(', ')}`,
          'Custom movement types need validation against S/4HANA inventory management');
      }
    }
  }

  interpretSD(data) {
    if (data.conditionTypes && data.conditionTypes.length > 0) {
      const customCond = data.conditionTypes.filter(c => (c.KSCHL || '').startsWith('Z'));
      if (customCond.length > 0) {
        this._add('SD-COND', 'Custom Condition Types',
          `${customCond.length} custom pricing condition type(s)`,
          'Custom condition types need review against S/4HANA condition technique');
      }
    }
  }

  interpretPP(data) {
    if (data.orderTypes && data.orderTypes.length > 0) {
      this._add('PP-ORDTYPE', 'Production Order Types',
        `${data.orderTypes.length} production order type(s) configured`,
        'Review for S/4HANA manufacturing approach (discrete vs process vs repetitive)');
    }
  }

  interpretIntegrationPoints(data) {
    const points = [];
    if (data.companyCodes && data.controllingAreas) {
      points.push('FI-CO: Company codes assigned to controlling areas');
    }
    if (data.plants && data.companyCodes) {
      points.push('MM-FI: Plants assigned to company codes for valuation');
    }
    if (data.salesOrgs && data.companyCodes) {
      points.push('SD-FI: Sales organizations linked to company codes for revenue posting');
    }
    if (points.length > 0) {
      this._add('INT-POINTS', 'Integration Points',
        `${points.length} cross-module integration point(s): ${points.join('; ')}`,
        'Integration points are critical path items for S/4HANA migration sequencing');
    }
  }

  getInterpretations() {
    return this._interpretations;
  }

  toJSON() {
    return {
      generatedAt: new Date().toISOString(),
      totalInterpretations: this._interpretations.length,
      interpretations: this._interpretations,
    };
  }

  toMarkdown() {
    const lines = ['# Configuration Interpretation Report', ''];
    for (const interp of this._interpretations) {
      lines.push(`## ${interp.description}`);
      lines.push(`**${interp.interpretation}**`);
      if (interp.impact) lines.push(`- Impact: ${interp.impact}`);
      if (interp.s4hanaRelevance) lines.push(`- S/4HANA: ${interp.s4hanaRelevance}`);
      lines.push('');
    }
    return lines.join('\n');
  }

  _add(ruleId, description, interpretation, s4hanaRelevance = '') {
    this._interpretations.push({ ruleId, description, interpretation, s4hanaRelevance });
  }

  _flattenResults() {
    const flat = {};
    const results = this.results instanceof Map ? Object.fromEntries(this.results) : this.results;
    for (const [, value] of Object.entries(results)) {
      if (value && typeof value === 'object' && !value.error) {
        Object.assign(flat, value);
      }
    }
    return flat;
  }
}

module.exports = ConfigInterpreter;
