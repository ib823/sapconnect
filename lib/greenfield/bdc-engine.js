/**
 * BDC Configuration Template Engine
 *
 * Generates BDC (Batch Data Communication) recordings from JSON
 * configuration templates for enterprise structure elements that lack BAPIs.
 *
 * Supports built-in template types for company codes, plants, sales orgs,
 * purchasing orgs, controlling areas, storage locations, shipping points,
 * and custom user-defined screen sequences.
 */

const Logger = require('../logger');

/**
 * Screen sequence definitions for each template type.
 * Each entry defines: program, dynpro number, and field mappings
 * from the template data keys to SAP screen field names.
 */
const SCREEN_SEQUENCES = {
  company_code: {
    transaction: 'OX02',
    description: 'Create Company Code (T001)',
    screens: [
      {
        program: 'SAPMF02K',
        dynpro: '0100',
        fields: {
          BUKRS: 'RF02K-BUKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMF02K',
        dynpro: '0110',
        fields: {
          BUTXT: 'T001-BUTXT',
          ORT01: 'T001-ORT01',
          LAND1: 'T001-LAND1',
          WAERS: 'T001-WAERS',
          SPRAS: 'T001-SPRAS',
          KTOPL: 'T001-KTOPL',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=ENTR' },
      },
      {
        program: 'SAPMF02K',
        dynpro: '0120',
        fields: {},
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  plant: {
    transaction: 'OX10',
    description: 'Create Plant (T001W)',
    screens: [
      {
        program: 'SAPMV12A',
        dynpro: '0100',
        fields: {
          WERKS: 'T001W-WERKS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMV12A',
        dynpro: '0200',
        fields: {
          NAME1: 'T001W-NAME1',
          NAME2: 'T001W-NAME2',
          STRAS: 'T001W-STRAS',
          ORT01: 'T001W-ORT01',
          LAND1: 'T001W-LAND1',
          BUKRS: 'T001W-BUKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  sales_org: {
    transaction: 'OVXD',
    description: 'Create Sales Organization (TVKO)',
    screens: [
      {
        program: 'SAPMV12A',
        dynpro: '0100',
        fields: {
          VKORG: 'TVKO-VKORG',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMV12A',
        dynpro: '0200',
        fields: {
          VTEXT: 'TVKOT-VTEXT',
          BUKRS: 'TVKO-BUKRS',
          LAND1: 'TVKO-LAND1',
          WAESSION: 'TVKO-WAESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  purchasing_org: {
    transaction: 'OX08',
    description: 'Create Purchasing Organization (T024E)',
    screens: [
      {
        program: 'SAPMM06E',
        dynpro: '0100',
        fields: {
          EKORG: 'T024E-EKORG',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMM06E',
        dynpro: '0200',
        fields: {
          EKOTX: 'T024E-EKOTX',
          BUKRS: 'T024E-BUKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  controlling_area: {
    transaction: 'OKKP',
    description: 'Create Controlling Area (TKA01)',
    screens: [
      {
        program: 'SAPLSPO4',
        dynpro: '0100',
        fields: {
          KOKRS: 'TKA01-KOKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPLSPO4',
        dynpro: '0200',
        fields: {
          BEZEI: 'TKA01-BEZEI',
          KTOPL: 'TKA01-KTOPL',
          WAESSION: 'TKA01-WAESSION',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=ENTR' },
      },
      {
        program: 'SAPLSPO4',
        dynpro: '0300',
        fields: {
          BUKRS: 'TKA02-BUKRS',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  storage_location: {
    transaction: 'OX09',
    description: 'Create Storage Location (T001L)',
    screens: [
      {
        program: 'SAPMM03L',
        dynpro: '0100',
        fields: {
          WERKS: 'T001L-WERKS',
          LGORT: 'T001L-LGORT',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMM03L',
        dynpro: '0200',
        fields: {
          LGOBE: 'T001L-LGOBE',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },

  shipping_point: {
    transaction: 'OVXC',
    description: 'Create Shipping Point (TVST)',
    screens: [
      {
        program: 'SAPMV12A',
        dynpro: '0100',
        fields: {
          VSTEL: 'TVST-VSTEL',
        },
        action: { fnam: 'BDC_OKCODE', fval: '/00' },
      },
      {
        program: 'SAPMV12A',
        dynpro: '0200',
        fields: {
          VTEXT: 'TVSTT-VTEXT',
          ATEFG: 'TVST-ATEFG',
          WERKS: 'TVST-WERKS',
          LADGR: 'TVST-LADGR',
          FABKL: 'TVST-FABKL',
        },
        action: { fnam: 'BDC_OKCODE', fval: '=SAVE' },
      },
    ],
  },
};

class BdcEngine {
  /**
   * @param {object} [options]
   * @param {'mock'|'live'} [options.mode='mock']
   * @param {object} [options.logger]
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.log = options.logger || new Logger('bdc-engine');
  }

  /**
   * Generate a BDC recording from a JSON template.
   * @param {object} template - { type, transaction?, data, screens? }
   * @returns {{ recording: object[], transaction: string, type: string }}
   */
  generateRecording(template) {
    const validation = this.validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }

    if (template.type === 'custom') {
      return this._generateCustomRecording(template);
    }

    const sequence = SCREEN_SEQUENCES[template.type];
    const recording = [];

    for (const screen of sequence.screens) {
      // Dynpro begin entry
      recording.push({
        program: screen.program,
        dynpro: screen.dynpro,
        dynbegin: 'X',
        fnam: '',
        fval: '',
      });

      // Field value entries
      for (const [dataKey, fieldName] of Object.entries(screen.fields)) {
        if (template.data[dataKey] !== undefined && template.data[dataKey] !== null) {
          recording.push({
            program: '',
            dynpro: '',
            dynbegin: '',
            fnam: fieldName,
            fval: String(template.data[dataKey]),
          });
        }
      }

      // Action entry (OK code)
      if (screen.action) {
        recording.push({
          program: '',
          dynpro: '',
          dynbegin: '',
          fnam: screen.action.fnam,
          fval: screen.action.fval,
        });
      }
    }

    const transaction = template.transaction || sequence.transaction;

    this.log.info(`Generated BDC recording for ${template.type}`, {
      transaction,
      steps: recording.length,
    });

    return { recording, transaction, type: template.type };
  }

  /**
   * Execute a BDC recording via RFC.
   * @param {{ recording: object[], transaction: string }} recordingResult
   * @param {object} [rfcPool] - RFC pool for live execution
   * @returns {object} Execution result
   */
  async executeRecording(recordingResult, rfcPool) {
    const { recording, transaction } = recordingResult;

    if (this.mode === 'mock') {
      this.log.info(`Mock executing BDC recording for transaction ${transaction}`);
      return {
        success: true,
        transaction,
        messages: [
          { type: 'S', id: 'BDC', number: '000', message: `${transaction} executed successfully` },
        ],
        recordsProcessed: 1,
      };
    }

    // Live mode: call ABAP4_CALL_TRANSACTION
    const client = await rfcPool.acquire();
    try {
      const bdcdata = recording.map(entry => ({
        PROGRAM: entry.program,
        DYNPRO: entry.dynpro,
        DYNBEGIN: entry.dynbegin,
        FNAM: entry.fnam,
        FVAL: entry.fval,
      }));

      const result = await client.call('ABAP4_CALL_TRANSACTION', {
        TCODE: transaction,
        MODE: 'N', // No display
        UPDATE: 'S', // Synchronous update
        TABLES: {
          USING: bdcdata,
        },
      });

      const messages = (result.TABLES?.MESSAGES || result.MESSAGES || []).map(msg => ({
        type: msg.MSGTYP || msg.TYPE,
        id: msg.MSGID || msg.ID,
        number: msg.MSGNR || msg.NUMBER,
        message: msg.MSGV1 || msg.MESSAGE || '',
      }));

      const hasErrors = messages.some(m => m.type === 'E' || m.type === 'A');

      this.log.info(`Executed BDC recording for ${transaction}`, {
        success: !hasErrors,
        messageCount: messages.length,
      });

      return {
        success: !hasErrors,
        transaction,
        messages,
        recordsProcessed: hasErrors ? 0 : 1,
        subrc: result.SUBRC || 0,
      };
    } finally {
      await rfcPool.release(client);
    }
  }

  /**
   * Validate a template structure.
   * @param {object} template
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateTemplate(template) {
    const errors = [];

    if (!template || typeof template !== 'object') {
      return { valid: false, errors: ['Template must be a non-null object'] };
    }

    if (!template.type) {
      errors.push('Template must have a "type" field');
    } else if (template.type !== 'custom' && !SCREEN_SEQUENCES[template.type]) {
      errors.push(`Unknown template type: "${template.type}". Valid types: ${Object.keys(SCREEN_SEQUENCES).join(', ')}, custom`);
    }

    if (template.type === 'custom') {
      if (!template.transaction) {
        errors.push('Custom templates must specify a "transaction"');
      }
      if (!template.screens || !Array.isArray(template.screens) || template.screens.length === 0) {
        errors.push('Custom templates must have a non-empty "screens" array');
      } else {
        for (let i = 0; i < template.screens.length; i++) {
          const screen = template.screens[i];
          if (!screen.program) {
            errors.push(`Screen ${i} must have a "program" field`);
          }
          if (!screen.dynpro) {
            errors.push(`Screen ${i} must have a "dynpro" field`);
          }
        }
      }
    } else if (template.type && SCREEN_SEQUENCES[template.type]) {
      if (!template.data || typeof template.data !== 'object') {
        errors.push('Template must have a "data" object');
      } else {
        // Check that at least one screen field has a value in data
        const sequence = SCREEN_SEQUENCES[template.type];
        const allFieldKeys = new Set();
        for (const screen of sequence.screens) {
          for (const key of Object.keys(screen.fields)) {
            allFieldKeys.add(key);
          }
        }
        const providedKeys = Object.keys(template.data);
        const validKeys = providedKeys.filter(k => allFieldKeys.has(k));
        if (validKeys.length === 0 && allFieldKeys.size > 0) {
          errors.push(`Data must include at least one recognized field for type "${template.type}". Valid fields: ${[...allFieldKeys].join(', ')}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * List all supported template types with descriptions.
   * @returns {object[]}
   */
  listTemplateTypes() {
    const types = Object.entries(SCREEN_SEQUENCES).map(([type, seq]) => ({
      type,
      transaction: seq.transaction,
      description: seq.description,
      fields: seq.screens.reduce((acc, screen) => {
        for (const key of Object.keys(screen.fields)) {
          acc.push(key);
        }
        return acc;
      }, []),
    }));

    types.push({
      type: 'custom',
      transaction: 'User-defined',
      description: 'Custom BDC recording with user-provided screen sequences',
      fields: [],
    });

    return types;
  }

  /**
   * Generate BDC recordings for multiple templates.
   * @param {object[]} templates - Array of template objects
   * @returns {{ recordings: object[], summary: { total: number, successful: number, failed: number, errors: object[] } }}
   */
  generateBatch(templates) {
    if (!Array.isArray(templates) || templates.length === 0) {
      throw new Error('Templates must be a non-empty array');
    }

    const recordings = [];
    const errors = [];
    let successful = 0;

    for (let i = 0; i < templates.length; i++) {
      try {
        const result = this.generateRecording(templates[i]);
        recordings.push(result);
        successful++;
      } catch (err) {
        errors.push({ index: i, type: templates[i]?.type, error: err.message });
      }
    }

    this.log.info('Batch BDC generation complete', {
      total: templates.length,
      successful,
      failed: errors.length,
    });

    return {
      recordings,
      summary: {
        total: templates.length,
        successful,
        failed: errors.length,
        errors,
      },
    };
  }

  /**
   * Format a recording as a transport-ready structure.
   * @param {{ recording: object[], transaction: string, type: string }} recordingResult
   * @returns {object}
   */
  toTransportFormat(recordingResult) {
    const { recording, transaction, type } = recordingResult;

    return {
      header: {
        transaction,
        type,
        mode: 'N',
        update: 'S',
        generatedAt: new Date().toISOString(),
        stepCount: recording.length,
      },
      bdcdata: recording.map((entry, idx) => ({
        line: idx + 1,
        PROGRAM: entry.program,
        DYNPRO: entry.dynpro,
        DYNBEGIN: entry.dynbegin,
        FNAM: entry.fnam,
        FVAL: entry.fval,
      })),
    };
  }

  /**
   * Generate recording from a custom template with explicit screen sequences.
   * @param {object} template
   * @returns {{ recording: object[], transaction: string, type: string }}
   * @private
   */
  _generateCustomRecording(template) {
    const recording = [];

    for (const screen of template.screens) {
      // Dynpro begin entry
      recording.push({
        program: screen.program,
        dynpro: screen.dynpro,
        dynbegin: 'X',
        fnam: '',
        fval: '',
      });

      // Field entries
      if (screen.fields) {
        for (const [fieldName, fieldValue] of Object.entries(screen.fields)) {
          recording.push({
            program: '',
            dynpro: '',
            dynbegin: '',
            fnam: fieldName,
            fval: String(fieldValue),
          });
        }
      }

      // OK code / action
      if (screen.okcode) {
        recording.push({
          program: '',
          dynpro: '',
          dynbegin: '',
          fnam: 'BDC_OKCODE',
          fval: screen.okcode,
        });
      }
    }

    this.log.info(`Generated custom BDC recording for ${template.transaction}`, {
      transaction: template.transaction,
      steps: recording.length,
    });

    return { recording, transaction: template.transaction, type: 'custom' };
  }
}

module.exports = { BdcEngine, SCREEN_SEQUENCES };
