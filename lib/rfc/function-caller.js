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
 * Generic Function Module Caller
 *
 * For BAPIs and other function modules beyond table reads.
 * Handles EXPORT, IMPORT, CHANGING, TABLES parameters with
 * automatic type conversion and optional BAPI_TRANSACTION_COMMIT.
 */

const { RfcError } = require('../errors');
const Logger = require('../logger');

class FunctionCallError extends RfcError {
  constructor(message, details) {
    super(message, details);
    this.name = 'FunctionCallError';
    this.code = 'ERR_FUNCTION_CALL';
  }
}

class FunctionCaller {
  /**
   * @param {import('./pool')} rfcPool
   * @param {object} [options]
   * @param {object} [options.logger]
   */
  constructor(rfcPool, options = {}) {
    this.pool = rfcPool;
    this.log = options.logger || new Logger('function-caller');
  }

  /**
   * Call a function module.
   * @param {string} fmName - Function module name
   * @param {object} [imports] - IMPORT parameters
   * @param {object} [tables] - TABLE parameters
   * @returns {object} FM result (exports + tables)
   */
  async call(fmName, imports = {}, tables = {}) {
    const client = await this.pool.acquire();
    try {
      const params = { ...imports };
      for (const [key, value] of Object.entries(tables)) {
        params[key] = value;
      }
      const result = await client.call(fmName, params);
      this._checkBapiReturn(fmName, result);
      return result;
    } catch (err) {
      if (err instanceof RfcError) throw err;
      throw new FunctionCallError(`Call to ${fmName} failed: ${err.message}`, {
        functionModule: fmName,
        original: err.message,
      });
    } finally {
      await this.pool.release(client);
    }
  }

  /**
   * Call a BAPI with explicit commit.
   * @param {string} fmName
   * @param {object} [imports]
   * @returns {object} FM result
   */
  async callWithCommit(fmName, imports = {}) {
    const client = await this.pool.acquire();
    try {
      const result = await client.call(fmName, imports);
      this._checkBapiReturn(fmName, result);
      await client.call('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });
      return result;
    } catch (err) {
      try {
        await client.call('BAPI_TRANSACTION_ROLLBACK');
      } catch { /* ignore rollback errors */ }
      if (err instanceof RfcError) throw err;
      throw new FunctionCallError(`Call to ${fmName} with commit failed: ${err.message}`, {
        functionModule: fmName,
        original: err.message,
      });
    } finally {
      await this.pool.release(client);
    }
  }

  /**
   * Read the interface definition of a function module.
   * @param {string} fmName
   * @returns {{ imports: object[], exports: object[], changing: object[], tables: object[] }}
   */
  async getInterface(fmName) {
    try {
      const result = await this.call('RPY_FUNCTIONMODULE_READ', {
        FUNCTIONNAME: fmName,
      });
      return {
        name: fmName,
        imports: (result.IMPORT_PARAMETER || []).map(p => ({
          name: (p.PARAMETER || '').trim(),
          type: (p.TYP || '').trim(),
          optional: p.OPTIONAL === 'X',
          default: (p.DEFAULT || '').trim(),
        })),
        exports: (result.EXPORT_PARAMETER || []).map(p => ({
          name: (p.PARAMETER || '').trim(),
          type: (p.TYP || '').trim(),
        })),
        changing: (result.CHANGING_PARAMETER || []).map(p => ({
          name: (p.PARAMETER || '').trim(),
          type: (p.TYP || '').trim(),
        })),
        tables: (result.TABLES_PARAMETER || []).map(p => ({
          name: (p.PARAMETER || '').trim(),
          type: (p.TYP || '').trim(),
        })),
      };
    } catch (err) {
      throw new FunctionCallError(`Failed to read interface for ${fmName}: ${err.message}`, {
        functionModule: fmName,
        original: err.message,
      });
    }
  }

  _checkBapiReturn(fmName, result) {
    const ret = result.RETURN || result.BAPIRETURN || result.BAPIRET2;
    if (!ret) return;

    const messages = Array.isArray(ret) ? ret : [ret];
    const errors = messages.filter(m => m.TYPE === 'E' || m.TYPE === 'A');

    if (errors.length > 0) {
      const msg = errors.map(e => `${e.ID || ''}-${e.NUMBER || ''}: ${(e.MESSAGE || '').trim()}`).join('; ');
      throw new FunctionCallError(`BAPI ${fmName} returned errors: ${msg}`, {
        functionModule: fmName,
        bapiErrors: errors,
      });
    }
  }
}

module.exports = { FunctionCaller, FunctionCallError };
