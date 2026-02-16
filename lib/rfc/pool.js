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
 * RFC Connection Pool
 *
 * Manages a pool of RfcClient connections for parallel extraction.
 * Supports health checks, auto-eviction of dead connections, and graceful shutdown.
 */

const RfcClient = require('./client');
const { RfcError } = require('../errors');
const Logger = require('../logger');

class RfcPool {
  /**
   * @param {object} connectionParams - RFC connection parameters
   * @param {object} [options]
   * @param {number} [options.poolSize=5] - Maximum connections
   * @param {number} [options.acquireTimeout=10000] - Max wait for available connection
   * @param {number} [options.callTimeout=30000] - Per-call timeout
   * @param {object} [options.logger]
   */
  constructor(connectionParams, options = {}) {
    this.connectionParams = connectionParams;
    this.poolSize = options.poolSize || 5;
    this.acquireTimeout = options.acquireTimeout || 10000;
    this.callTimeout = options.callTimeout || 30000;
    this.log = options.logger || new Logger('rfc-pool');

    this._available = [];
    this._busy = new Set();
    this._waitQueue = [];
    this._drained = false;
  }

  get stats() {
    return {
      total: this._available.length + this._busy.size,
      available: this._available.length,
      busy: this._busy.size,
      waiting: this._waitQueue.length,
    };
  }

  /**
   * Acquire a connected RfcClient from the pool.
   * @returns {RfcClient}
   */
  async acquire() {
    if (this._drained) {
      throw new RfcError('Pool has been drained', { code: 'POOL_DRAINED' });
    }

    // Try to get an available connection
    while (this._available.length > 0) {
      const client = this._available.pop();
      if (client.isConnected) {
        this._busy.add(client);
        return client;
      }
      // Dead connection, discard it
      await client.close().catch(() => {});
    }

    // Create new connection if pool not full
    if (this._busy.size < this.poolSize) {
      const client = new RfcClient(this.connectionParams, {
        timeout: this.callTimeout,
        logger: this.log.child('client'),
      });
      await client.open();
      this._busy.add(client);
      return client;
    }

    // Pool full — wait for a release
    return this._waitForRelease();
  }

  /**
   * Release a client back to the pool.
   * @param {RfcClient} client
   */
  async release(client) {
    this._busy.delete(client);

    if (this._drained) {
      await client.close().catch(() => {});
      return;
    }

    // If someone is waiting, give them this connection directly
    if (this._waitQueue.length > 0) {
      const waiter = this._waitQueue.shift();
      if (client.isConnected) {
        this._busy.add(client);
        waiter.resolve(client);
      } else {
        // Dead connection — try to create a new one for the waiter
        try {
          await client.close().catch(() => {});
          const newClient = new RfcClient(this.connectionParams, {
            timeout: this.callTimeout,
            logger: this.log.child('client'),
          });
          await newClient.open();
          this._busy.add(newClient);
          waiter.resolve(newClient);
        } catch (err) {
          waiter.reject(err);
        }
      }
      return;
    }

    // Return to available pool
    if (client.isConnected) {
      this._available.push(client);
    } else {
      await client.close().catch(() => {});
    }
  }

  /**
   * Gracefully drain the pool — close all connections.
   */
  async drain() {
    this._drained = true;

    // Reject all waiters
    for (const waiter of this._waitQueue) {
      waiter.reject(new RfcError('Pool is draining', { code: 'POOL_DRAINED' }));
    }
    this._waitQueue = [];

    // Close all available connections
    const closePromises = this._available.map(c => c.close().catch(() => {}));
    this._available = [];

    // Close busy connections
    for (const client of this._busy) {
      closePromises.push(client.close().catch(() => {}));
    }
    this._busy.clear();

    await Promise.all(closePromises);
    this.log.info('RFC pool drained');
  }

  _waitForRelease() {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this._waitQueue.findIndex(w => w.resolve === resolve);
        if (idx >= 0) this._waitQueue.splice(idx, 1);
        reject(new RfcError(`Acquire timeout after ${this.acquireTimeout}ms`, {
          code: 'POOL_ACQUIRE_TIMEOUT',
          stats: this.stats,
        }));
      }, this.acquireTimeout);

      this._waitQueue.push({
        resolve: (client) => { clearTimeout(timer); resolve(client); },
        reject: (err) => { clearTimeout(timer); reject(err); },
      });
    });
  }
}

module.exports = RfcPool;
