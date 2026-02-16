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
 * Transport Pipeline Manager
 *
 * Manages the full transport lifecycle: create, assign objects,
 * release, and import. Supports pipeline definitions for multi-system
 * landscapes (e.g., DEV -> QAS -> PRD).
 */

const Logger = require('../logger');

/**
 * Transport request statuses used by SAP (E070-TRSTATUS).
 */
const TRANSPORT_STATUS = {
  MODIFIABLE: 'D',
  RELEASED: 'R',
  IMPORTED: 'I',
  LOCKED: 'L',
  PROTECTED: 'O',
};

const STATUS_LABELS = {
  D: 'Modifiable',
  R: 'Released',
  I: 'Imported',
  L: 'Locked',
  O: 'Protected',
};

class TransportManager {
  /**
   * @param {object} rfcPoolOrMock - RFC pool for live mode, or null for mock
   * @param {object} [options]
   * @param {'mock'|'live'} [options.mode='mock']
   * @param {object} [options.logger]
   */
  constructor(rfcPoolOrMock, options = {}) {
    this.mode = options.mode || 'mock';
    this.pool = rfcPoolOrMock;
    this.log = options.logger || new Logger('transport-manager');

    // Mock state
    this._mockCounter = 900000;
    this._requests = new Map();
    this._objects = new Map();     // requestNumber -> [E071 entries]
    this._keys = new Map();        // requestNumber -> [E071K entries]
    this._pipelines = new Map();
    this._promotions = new Map();  // pipelineName -> [{ requestNumber, system, timestamp }]
  }

  /**
   * Create a transport request with tasks.
   * @param {string} description - Request description
   * @param {'K'|'W'} type - K=customizing, W=workbench
   * @param {string} owner - SAP user name
   * @returns {{ requestNumber: string, tasks: Array<{ taskNumber: string, owner: string }>, type: string, description: string, status: string }}
   */
  async createRequest(description, type, owner) {
    if (!description) throw new Error('Description is required');
    if (!type || !['K', 'W'].includes(type)) throw new Error('Type must be "K" (customizing) or "W" (workbench)');
    if (!owner) throw new Error('Owner is required');

    if (this.mode === 'mock') {
      this._mockCounter++;
      const requestNumber = `DEVK${this._mockCounter}`;
      const taskNumber = `DEVK${this._mockCounter + 1}`;
      this._mockCounter++;

      const request = {
        requestNumber,
        description,
        type,
        owner,
        status: TRANSPORT_STATUS.MODIFIABLE,
        createdAt: new Date().toISOString(),
        tasks: [{ taskNumber, owner }],
      };

      this._requests.set(requestNumber, request);
      this._objects.set(requestNumber, []);
      this._keys.set(requestNumber, []);

      this.log.info('Mock: created transport request', { requestNumber, type, owner });

      return {
        requestNumber,
        tasks: [{ taskNumber, owner }],
        type,
        description,
        status: STATUS_LABELS[TRANSPORT_STATUS.MODIFIABLE],
      };
    }

    // Live mode
    const client = await this.pool.acquire();
    try {
      const result = await client.call('TR_INSERT_REQUEST_WITH_TASKS', {
        IV_TYPE: type,
        IV_TEXT: description,
        IV_OWNER: owner,
      });

      const requestNumber = (result.EV_REQUEST || '').trim();
      const tasks = (result.ET_TASKS || []).map(t => ({
        taskNumber: (t.TRKORR || '').trim(),
        owner: (t.AS4USER || '').trim(),
      }));

      this.log.info('Created transport request', { requestNumber, type, owner });

      return {
        requestNumber,
        tasks,
        type,
        description,
        status: STATUS_LABELS[TRANSPORT_STATUS.MODIFIABLE],
      };
    } finally {
      await this.pool.release(client);
    }
  }

  /**
   * Add an object to a transport request (E071 entry).
   * @param {string} requestNumber
   * @param {string} objectType - e.g., 'TABU', 'PROG', 'CLAS', 'REPS'
   * @param {string} objectName - e.g., table name or program name
   * @param {string} [programId='R3TR'] - Program ID (R3TR, LIMU, etc.)
   * @returns {{ success: boolean, entry: object }}
   */
  async addObjectToTransport(requestNumber, objectType, objectName, programId) {
    if (!requestNumber) throw new Error('Request number is required');
    if (!objectType) throw new Error('Object type is required');
    if (!objectName) throw new Error('Object name is required');

    const pgmid = programId || 'R3TR';

    if (this.mode === 'mock') {
      const request = this._requests.get(requestNumber);
      if (!request) {
        throw new Error(`Transport request ${requestNumber} not found`);
      }
      if (request.status === TRANSPORT_STATUS.RELEASED) {
        throw new Error(`Transport request ${requestNumber} is already released`);
      }

      const entry = {
        TRKORR: requestNumber,
        PGMID: pgmid,
        OBJECT: objectType,
        OBJ_NAME: objectName,
      };

      this._objects.get(requestNumber).push(entry);
      this.log.info('Mock: added object to transport', { requestNumber, objectType, objectName });

      return { success: true, entry };
    }

    // Live mode
    const client = await this.pool.acquire();
    try {
      await client.call('TR_APPEND_TO_COMM_OBJS_KEYS', {
        WI_TRKORR: requestNumber,
        WI_E071: {
          TRKORR: requestNumber,
          PGMID: pgmid,
          OBJECT: objectType,
          OBJ_NAME: objectName,
        },
      });

      this.log.info('Added object to transport', { requestNumber, objectType, objectName });

      return {
        success: true,
        entry: {
          TRKORR: requestNumber,
          PGMID: pgmid,
          OBJECT: objectType,
          OBJ_NAME: objectName,
        },
      };
    } finally {
      await this.pool.release(client);
    }
  }

  /**
   * Add table keys to a transport (E071K entries).
   * @param {string} requestNumber
   * @param {string} tableName
   * @param {Array<{ field: string, value: string }>} keys
   * @returns {{ success: boolean, entries: object[] }}
   */
  async addKeysToTransport(requestNumber, tableName, keys) {
    if (!requestNumber) throw new Error('Request number is required');
    if (!tableName) throw new Error('Table name is required');
    if (!Array.isArray(keys) || keys.length === 0) throw new Error('Keys must be a non-empty array');

    if (this.mode === 'mock') {
      const request = this._requests.get(requestNumber);
      if (!request) {
        throw new Error(`Transport request ${requestNumber} not found`);
      }
      if (request.status === TRANSPORT_STATUS.RELEASED) {
        throw new Error(`Transport request ${requestNumber} is already released`);
      }

      const entries = keys.map(k => ({
        TRKORR: requestNumber,
        PGMID: 'R3TR',
        OBJECT: 'TABU',
        OBJ_NAME: tableName,
        TABKEY: `${k.field}=${k.value}`,
      }));

      const existing = this._keys.get(requestNumber) || [];
      existing.push(...entries);
      this._keys.set(requestNumber, existing);

      this.log.info('Mock: added keys to transport', { requestNumber, tableName, keyCount: keys.length });

      return { success: true, entries };
    }

    // Live mode
    const client = await this.pool.acquire();
    try {
      const entries = [];
      for (const key of keys) {
        const e071k = {
          TRKORR: requestNumber,
          PGMID: 'R3TR',
          OBJECT: 'TABU',
          OBJ_NAME: tableName,
          TABKEY: `${key.field}=${key.value}`,
        };

        await client.call('TR_APPEND_TO_COMM_OBJS_KEYS', {
          WI_TRKORR: requestNumber,
          WI_E071K: e071k,
        });

        entries.push(e071k);
      }

      this.log.info('Added keys to transport', { requestNumber, tableName, keyCount: keys.length });

      return { success: true, entries };
    } finally {
      await this.pool.release(client);
    }
  }

  /**
   * Release a transport request.
   * @param {string} requestNumber
   * @returns {{ success: boolean, requestNumber: string, status: string }}
   */
  async releaseRequest(requestNumber) {
    if (!requestNumber) throw new Error('Request number is required');

    if (this.mode === 'mock') {
      const request = this._requests.get(requestNumber);
      if (!request) {
        throw new Error(`Transport request ${requestNumber} not found`);
      }
      if (request.status === TRANSPORT_STATUS.RELEASED) {
        throw new Error(`Transport request ${requestNumber} is already released`);
      }

      request.status = TRANSPORT_STATUS.RELEASED;
      request.releasedAt = new Date().toISOString();

      this.log.info('Mock: released transport request', { requestNumber });

      return {
        success: true,
        requestNumber,
        status: STATUS_LABELS[TRANSPORT_STATUS.RELEASED],
      };
    }

    // Live mode
    const client = await this.pool.acquire();
    try {
      await client.call('TR_RELEASE_REQUEST', {
        IV_TRKORR: requestNumber,
        IV_DIALOG: ' ',
      });

      this.log.info('Released transport request', { requestNumber });

      return {
        success: true,
        requestNumber,
        status: STATUS_LABELS[TRANSPORT_STATUS.RELEASED],
      };
    } finally {
      await this.pool.release(client);
    }
  }

  /**
   * Get the status of a transport request.
   * @param {string} requestNumber
   * @returns {{ requestNumber: string, status: string, statusCode: string, description: string, owner: string, type: string, objects: object[], keys: object[] }}
   */
  async getRequestStatus(requestNumber) {
    if (!requestNumber) throw new Error('Request number is required');

    if (this.mode === 'mock') {
      const request = this._requests.get(requestNumber);
      if (!request) {
        throw new Error(`Transport request ${requestNumber} not found`);
      }

      return {
        requestNumber,
        status: STATUS_LABELS[request.status] || request.status,
        statusCode: request.status,
        description: request.description,
        owner: request.owner,
        type: request.type,
        objects: this._objects.get(requestNumber) || [],
        keys: this._keys.get(requestNumber) || [],
      };
    }

    // Live mode — read E070 table
    const client = await this.pool.acquire();
    try {
      const result = await client.call('RFC_READ_TABLE', {
        QUERY_TABLE: 'E070',
        DELIMITER: '|',
        OPTIONS: [{ TEXT: `TRKORR = '${requestNumber}'` }],
        FIELDS: [
          { FIELDNAME: 'TRKORR' },
          { FIELDNAME: 'TRSTATUS' },
          { FIELDNAME: 'TRFUNCTION' },
          { FIELDNAME: 'AS4USER' },
          { FIELDNAME: 'AS4TEXT' },
        ],
      });

      const rows = (result.DATA || []);
      if (rows.length === 0) {
        throw new Error(`Transport request ${requestNumber} not found`);
      }

      const fields = rows[0].WA.split('|');
      const statusCode = (fields[1] || '').trim();

      return {
        requestNumber: (fields[0] || '').trim(),
        status: STATUS_LABELS[statusCode] || statusCode,
        statusCode,
        description: (fields[4] || '').trim(),
        owner: (fields[3] || '').trim(),
        type: (fields[2] || '').trim(),
        objects: [],
        keys: [],
      };
    } finally {
      await this.pool.release(client);
    }
  }

  /**
   * List transport requests filtered by user and/or status.
   * @param {string} [user] - Filter by owner
   * @param {string} [status] - Filter by status code (D, R, I, etc.)
   * @returns {object[]}
   */
  async listRequests(user, status) {
    if (this.mode === 'mock') {
      let results = [...this._requests.values()];

      if (user) {
        results = results.filter(r => r.owner === user);
      }
      if (status) {
        results = results.filter(r => r.status === status);
      }

      return results.map(r => ({
        requestNumber: r.requestNumber,
        description: r.description,
        type: r.type,
        owner: r.owner,
        status: STATUS_LABELS[r.status] || r.status,
        statusCode: r.status,
        createdAt: r.createdAt,
      }));
    }

    // Live mode — read E070 with optional filters
    const client = await this.pool.acquire();
    try {
      const options = [];
      const filters = [];

      if (user) {
        filters.push(`AS4USER = '${user}'`);
      }
      if (status) {
        filters.push(`TRSTATUS = '${status}'`);
      }

      if (filters.length > 0) {
        options.push({ TEXT: filters.join(' AND ') });
      }

      const result = await client.call('RFC_READ_TABLE', {
        QUERY_TABLE: 'E070',
        DELIMITER: '|',
        OPTIONS: options,
        FIELDS: [
          { FIELDNAME: 'TRKORR' },
          { FIELDNAME: 'TRSTATUS' },
          { FIELDNAME: 'TRFUNCTION' },
          { FIELDNAME: 'AS4USER' },
        ],
      });

      // Also read descriptions from E07T
      const requestNumbers = (result.DATA || []).map(row => {
        const fields = row.WA.split('|');
        return (fields[0] || '').trim();
      });

      return (result.DATA || []).map((row, idx) => {
        const fields = row.WA.split('|');
        const statusCode = (fields[1] || '').trim();
        return {
          requestNumber: (fields[0] || '').trim(),
          status: STATUS_LABELS[statusCode] || statusCode,
          statusCode,
          type: (fields[2] || '').trim(),
          owner: (fields[3] || '').trim(),
        };
      });
    } finally {
      await this.pool.release(client);
    }
  }

  /**
   * Define a transport pipeline (sequence of systems).
   * @param {string} name - Pipeline name (e.g., 'standard')
   * @param {string[]} systems - Ordered list of systems (e.g., ['DEV', 'QAS', 'PRD'])
   * @returns {{ name: string, systems: string[], createdAt: string }}
   */
  createPipeline(name, systems) {
    if (!name) throw new Error('Pipeline name is required');
    if (!Array.isArray(systems) || systems.length < 2) {
      throw new Error('Pipeline must have at least 2 systems');
    }

    const pipeline = {
      name,
      systems,
      createdAt: new Date().toISOString(),
    };

    this._pipelines.set(name, pipeline);
    this._promotions.set(name, []);

    this.log.info('Created pipeline', { name, systems });

    return pipeline;
  }

  /**
   * Promote a transport request to a target system in the pipeline.
   * @param {string} requestNumber
   * @param {string} targetSystem
   * @returns {{ success: boolean, requestNumber: string, targetSystem: string, status: string }}
   */
  async promoteTo(requestNumber, targetSystem) {
    if (!requestNumber) throw new Error('Request number is required');
    if (!targetSystem) throw new Error('Target system is required');

    // Find which pipeline contains this target system
    let matchedPipeline = null;
    for (const [pname, pipeline] of this._pipelines.entries()) {
      if (pipeline.systems.includes(targetSystem)) {
        matchedPipeline = pname;
        break;
      }
    }

    if (this.mode === 'mock') {
      const request = this._requests.get(requestNumber);
      if (request && request.status !== TRANSPORT_STATUS.RELEASED) {
        throw new Error(`Transport request ${requestNumber} must be released before promotion`);
      }

      const promotion = {
        requestNumber,
        targetSystem,
        status: 'imported',
        timestamp: new Date().toISOString(),
      };

      if (matchedPipeline) {
        this._promotions.get(matchedPipeline).push(promotion);
      }

      this.log.info('Mock: promoted transport', { requestNumber, targetSystem });

      return {
        success: true,
        requestNumber,
        targetSystem,
        status: 'imported',
      };
    }

    // Live mode — trigger import via RFC
    const client = await this.pool.acquire();
    try {
      await client.call('TMS_MGR_FORWARD_TR_REQUEST', {
        IV_REQUEST: requestNumber,
        IV_TARGET: targetSystem,
        IV_IMPORT_AGAIN: 'X',
      });

      this.log.info('Promoted transport', { requestNumber, targetSystem });

      return {
        success: true,
        requestNumber,
        targetSystem,
        status: 'import_queued',
      };
    } finally {
      await this.pool.release(client);
    }
  }

  /**
   * Get the status of all transports in a pipeline.
   * @param {string} pipelineName
   * @returns {{ pipeline: object, promotions: object[], systems: object[] }}
   */
  getPipelineStatus(pipelineName) {
    const pipeline = this._pipelines.get(pipelineName);
    if (!pipeline) {
      throw new Error(`Pipeline "${pipelineName}" not found`);
    }

    const promotions = this._promotions.get(pipelineName) || [];

    // Build system-level summary
    const systemSummary = pipeline.systems.map(system => {
      const systemPromotions = promotions.filter(p => p.targetSystem === system);
      return {
        system,
        transportCount: systemPromotions.length,
        transports: systemPromotions.map(p => ({
          requestNumber: p.requestNumber,
          status: p.status,
          timestamp: p.timestamp,
        })),
      };
    });

    return {
      pipeline: {
        name: pipeline.name,
        systems: pipeline.systems,
        createdAt: pipeline.createdAt,
      },
      promotions,
      systems: systemSummary,
    };
  }
}

module.exports = { TransportManager, TRANSPORT_STATUS, STATUS_LABELS };
