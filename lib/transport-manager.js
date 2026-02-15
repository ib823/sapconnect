/**
 * Transport Manager — Change management for SAP transports.
 *
 * Manages transport request lifecycle:
 *   - Create transport requests (workbench/customizing)
 *   - Assign objects to transports
 *   - Release transports
 *   - Track import status
 *
 * Works in mock mode (default) and live mode (via ADT REST API).
 *
 * Usage:
 *   const mgr = new TransportManager({ mode: 'mock' });
 *   const tr = await mgr.createTransport({ description: 'S/4 Migration', type: 'workbench' });
 *   await mgr.addObject(tr.number, { pgmid: 'R3TR', object: 'CLAS', name: 'ZCL_MYCLASS' });
 *   await mgr.release(tr.number);
 */

const Logger = require('./logger');

const TRANSPORT_STATUS = {
  MODIFIABLE: 'D',     // In development
  RELEASED: 'R',       // Released
  IMPORTED: 'I',       // Imported to target
  LOCKED: 'L',         // Locked
  ERROR: 'E',          // Error during import
};

const TRANSPORT_TYPES = {
  WORKBENCH: 'K',      // Development/correction (ABAP objects)
  CUSTOMIZING: 'W',    // Customizing (config)
  TRANSPORT_COPIES: 'T', // Transport of copies
};

class TransportManager {
  /**
   * @param {object} options
   * @param {'mock'|'live'} [options.mode='mock']
   * @param {object} [options.adtClient] — ADT REST client for live mode
   * @param {string} [options.targetSystem] — Target system for import
   */
  constructor(options = {}) {
    this._mode = options.mode || 'mock';
    this._adtClient = options.adtClient || null;
    this._targetSystem = options.targetSystem || null;
    this._log = options.logger || new Logger('transport-manager');

    // Mock state
    this._transports = new Map();
    this._counter = 900000;
  }

  get mode() { return this._mode; }

  /**
   * Create a new transport request.
   * @param {object} options
   * @param {string} options.description — Transport description
   * @param {'workbench'|'customizing'} [options.type='workbench']
   * @param {string} [options.owner] — Owner username
   * @returns {object} — { number, description, type, status, createdAt }
   */
  async createTransport(options) {
    const { description, type = 'workbench', owner = 'SAPCONNECT' } = options;

    if (this._mode === 'live') {
      return this._createTransportLive(description, type, owner);
    }

    const number = `SC${this._mode === 'mock' ? 'K' : 'T'}${++this._counter}`;
    const transport = {
      number,
      description,
      type: type === 'customizing' ? TRANSPORT_TYPES.CUSTOMIZING : TRANSPORT_TYPES.WORKBENCH,
      status: TRANSPORT_STATUS.MODIFIABLE,
      owner,
      objects: [],
      createdAt: new Date().toISOString(),
      releasedAt: null,
      importedAt: null,
    };

    this._transports.set(number, transport);
    this._log.info(`Transport created: ${number} — ${description}`);
    return transport;
  }

  /**
   * Add an object to a transport request.
   * @param {string} transportNumber
   * @param {object} obj — { pgmid, object, name }
   */
  async addObject(transportNumber, obj) {
    const transport = await this.getTransport(transportNumber);
    if (!transport) throw new Error(`Transport ${transportNumber} not found`);
    if (transport.status !== TRANSPORT_STATUS.MODIFIABLE) {
      throw new Error(`Transport ${transportNumber} is not modifiable (status: ${transport.status})`);
    }

    if (this._mode === 'live') {
      return this._addObjectLive(transportNumber, obj);
    }

    const entry = {
      pgmid: obj.pgmid || 'R3TR',
      object: obj.object,
      name: obj.name,
      addedAt: new Date().toISOString(),
    };

    transport.objects.push(entry);
    this._log.debug(`Object added to ${transportNumber}: ${entry.pgmid} ${entry.object} ${entry.name}`);
    return entry;
  }

  /**
   * Release a transport request.
   * @param {string} transportNumber
   * @returns {object} — Updated transport
   */
  async release(transportNumber) {
    const transport = await this.getTransport(transportNumber);
    if (!transport) throw new Error(`Transport ${transportNumber} not found`);
    if (transport.status !== TRANSPORT_STATUS.MODIFIABLE) {
      throw new Error(`Transport ${transportNumber} cannot be released (status: ${transport.status})`);
    }

    if (this._mode === 'live') {
      return this._releaseLive(transportNumber);
    }

    transport.status = TRANSPORT_STATUS.RELEASED;
    transport.releasedAt = new Date().toISOString();
    this._log.info(`Transport released: ${transportNumber}`);
    return transport;
  }

  /**
   * Get transport details.
   * @param {string} transportNumber
   * @returns {object|null}
   */
  async getTransport(transportNumber) {
    if (this._mode === 'live') {
      return this._getTransportLive(transportNumber);
    }
    return this._transports.get(transportNumber) || null;
  }

  /**
   * List all transports.
   * @param {object} [filters] — { status, owner, type }
   * @returns {object[]}
   */
  async listTransports(filters = {}) {
    if (this._mode === 'live') {
      return this._listTransportsLive(filters);
    }

    let transports = Array.from(this._transports.values());
    if (filters.status) transports = transports.filter(t => t.status === filters.status);
    if (filters.owner) transports = transports.filter(t => t.owner === filters.owner);
    if (filters.type) transports = transports.filter(t => t.type === filters.type);
    return transports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Get transport summary statistics.
   * @returns {object}
   */
  async getStats() {
    const transports = await this.listTransports();
    const stats = {
      total: transports.length,
      modifiable: transports.filter(t => t.status === TRANSPORT_STATUS.MODIFIABLE).length,
      released: transports.filter(t => t.status === TRANSPORT_STATUS.RELEASED).length,
      imported: transports.filter(t => t.status === TRANSPORT_STATUS.IMPORTED).length,
      errors: transports.filter(t => t.status === TRANSPORT_STATUS.ERROR).length,
      totalObjects: transports.reduce((sum, t) => sum + (t.objects?.length || 0), 0),
    };
    return stats;
  }

  // ── Live Mode (ADT REST API) ────────────────────────────────

  /** @private */
  async _createTransportLive(description, type, owner) {
    if (!this._adtClient) throw new Error('ADT client required for live mode');
    const typeCode = type === 'customizing' ? 'W' : 'K';
    const body = `<?xml version="1.0"?><asx:abap xmlns:asx="http://www.sap.com/abapxml"><asx:values><HEADER><TRKORR/><AS4TEXT>${description}</AS4TEXT><TRFUNCTION>${typeCode}</TRFUNCTION><AS4USER>${owner}</AS4USER></HEADER></asx:values></asx:abap>`;
    const response = await this._adtClient.post('/sap/bc/adt/cts/transports', body, {
      headers: { 'Content-Type': 'application/vnd.sap.adt.transportrequests.v1+xml' },
    });
    return { number: response.transportNumber, description, type: typeCode, status: TRANSPORT_STATUS.MODIFIABLE };
  }

  /** @private */
  async _addObjectLive(transportNumber, obj) {
    if (!this._adtClient) throw new Error('ADT client required for live mode');
    await this._adtClient.post(`/sap/bc/adt/cts/transports/${transportNumber}/objects`, {
      pgmid: obj.pgmid || 'R3TR', object: obj.object, obj_name: obj.name,
    });
  }

  /** @private */
  async _releaseLive(transportNumber) {
    if (!this._adtClient) throw new Error('ADT client required for live mode');
    await this._adtClient.post(`/sap/bc/adt/cts/transports/${transportNumber}/release`);
    return this._getTransportLive(transportNumber);
  }

  /** @private */
  async _getTransportLive(transportNumber) {
    if (!this._adtClient) throw new Error('ADT client required for live mode');
    return this._adtClient.get(`/sap/bc/adt/cts/transports/${transportNumber}`);
  }

  /** @private */
  async _listTransportsLive(filters) {
    if (!this._adtClient) throw new Error('ADT client required for live mode');
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.owner) params.set('owner', filters.owner);
    return this._adtClient.get(`/sap/bc/adt/cts/transports?${params}`);
  }
}

module.exports = { TransportManager, TRANSPORT_STATUS, TRANSPORT_TYPES };
