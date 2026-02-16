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
 * Extraction Context
 *
 * Shared context object passed to all extractors. Provides access to
 * RFC pool, OData client, checkpoint manager, coverage tracker, and system info.
 */

const CheckpointManager = require('./checkpoint-manager');
const CoverageTracker = require('./coverage-tracker');

class ExtractionContext {
  /**
   * @param {object} opts
   * @param {import('../lib/rfc/pool')|null} opts.rfcPool
   * @param {import('../lib/odata/client')|null} opts.odataClient
   * @param {'live'|'mock'} opts.mode
   * @param {string} [opts.checkpointDir]
   * @param {object} [opts.systemInfo] - { type, release, client }
   */
  constructor(opts = {}) {
    this._rfcPool = opts.rfcPool || null;
    this._odataClient = opts.odataClient || null;
    this._sourceAdapter = opts.sourceAdapter || null;
    this._sourceSystem = opts.sourceSystem || 'SAP';
    this._mode = opts.mode || 'mock';
    this._checkpoint = new CheckpointManager(opts.checkpointDir);
    this._coverage = new CoverageTracker();
    this._systemInfo = opts.systemInfo || { type: 'ECC', release: '600', client: '100' };
    this._dataDictionary = null;
  }

  get rfc() { return this._rfcPool; }
  get odata() { return this._odataClient; }
  get sourceAdapter() { return this._sourceAdapter; }
  get sourceSystem() { return this._sourceSystem; }
  get mode() { return this._mode; }

  get system() { return this._systemInfo; }
  set system(info) { this._systemInfo = info; }

  get checkpoint() { return this._checkpoint; }
  get coverage() { return this._coverage; }

  get dataDictionary() { return this._dataDictionary; }
  set dataDictionary(dd) { this._dataDictionary = dd; }
}

module.exports = ExtractionContext;
