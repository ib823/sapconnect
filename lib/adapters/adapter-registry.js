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
 * Source Adapter Registry
 *
 * Central registry for all source-system adapters. Supports registration
 * of adapter classes by system type, lookup, instantiation, and listing.
 * Auto-registers built-in SAP and Infor adapters on construction.
 */

'use strict';

const Logger = require('../logger');

class AdapterRegistry {
  constructor() {
    this._adapters = new Map();
    this.logger = new Logger('adapter-registry');
    this._registerBuiltins();
  }

  /**
   * Register an adapter class for a system type.
   * @param {string} systemType - System identifier (e.g., 'SAP', 'INFOR_M3')
   * @param {Function} AdapterClass - Class extending BaseSourceAdapter
   */
  register(systemType, AdapterClass) {
    if (!systemType || typeof systemType !== 'string') {
      throw new Error('systemType must be a non-empty string');
    }
    if (typeof AdapterClass !== 'function') {
      throw new Error('AdapterClass must be a constructor function');
    }
    const key = systemType.toUpperCase();
    this._adapters.set(key, AdapterClass);
    this.logger.debug(`Registered adapter: ${key}`);
  }

  /**
   * Get the adapter class for a system type.
   * @param {string} systemType
   * @returns {Function} Adapter class
   */
  get(systemType) {
    const key = (systemType || '').toUpperCase();
    const AdapterClass = this._adapters.get(key);
    if (!AdapterClass) {
      throw new Error(`No adapter registered for system type: ${systemType}`);
    }
    return AdapterClass;
  }

  /**
   * Check whether an adapter is registered for a system type.
   * @param {string} systemType
   * @returns {boolean}
   */
  has(systemType) {
    return this._adapters.has((systemType || '').toUpperCase());
  }

  /**
   * Create an adapter instance for a system type.
   * @param {string} systemType
   * @param {object} [config] - Adapter configuration
   * @returns {BaseSourceAdapter} Adapter instance
   */
  create(systemType, config = {}) {
    const AdapterClass = this.get(systemType);
    return new AdapterClass(config);
  }

  /**
   * List all registered system types.
   * @returns {string[]}
   */
  listSystems() {
    return Array.from(this._adapters.keys());
  }

  /**
   * Remove an adapter registration.
   * @param {string} systemType
   */
  unregister(systemType) {
    this._adapters.delete((systemType || '').toUpperCase());
  }

  /**
   * Clear all registrations (for testing).
   */
  clear() {
    this._adapters.clear();
  }

  /**
   * Auto-register built-in adapters.
   * @private
   */
  _registerBuiltins() {
    try {
      const { SapAdapter } = require('./sap-adapter');
      this.register('SAP', SapAdapter);
    } catch (e) {
      this.logger.debug('SapAdapter not available for auto-registration');
    }

    try {
      const { InforM3Adapter } = require('./infor-m3-adapter');
      this.register('INFOR_M3', InforM3Adapter);
    } catch (e) {
      this.logger.debug('InforM3Adapter not available for auto-registration');
    }

    try {
      const { InforLNAdapter } = require('./infor-ln-adapter');
      this.register('INFOR_LN', InforLNAdapter);
    } catch (e) {
      this.logger.debug('InforLNAdapter not available for auto-registration');
    }
  }
}

module.exports = { AdapterRegistry };
