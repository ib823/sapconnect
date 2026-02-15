/**
 * Adapter Factory
 *
 * Creates the appropriate source adapter based on configuration.
 * Delegates to AdapterRegistry for class lookup and instantiation.
 * Provides a simple interface: pass a config with `system` key and
 * get back a ready-to-use adapter instance.
 */

'use strict';

const Logger = require('../logger');
const { AdapterRegistry } = require('./adapter-registry');

class AdapterFactory {
  /**
   * @param {object} [options]
   * @param {AdapterRegistry} [options.registry] - Custom adapter registry
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    this.registry = options.registry || new AdapterRegistry();
    this.logger = options.logger || new Logger('adapter-factory');
  }

  /**
   * Create an adapter from configuration.
   *
   * @param {object} config
   * @param {string} config.system - System type (e.g., 'SAP', 'INFOR_M3', 'INFOR_LN')
   * @param {string} [config.mode='mock'] - Operating mode
   * @param {object} [config...rest] - System-specific configuration passed to the adapter
   * @returns {BaseSourceAdapter} Configured adapter instance
   */
  create(config = {}) {
    const { system, ...rest } = config;

    if (!system) {
      throw new Error('config.system is required (e.g., "SAP", "INFOR_M3", "INFOR_LN")');
    }

    if (!this.registry.has(system)) {
      throw new Error(
        `Unsupported system type: "${system}". Registered systems: ${this.registry.listSystems().join(', ')}`
      );
    }

    this.logger.info(`Creating adapter for ${system}`, { mode: rest.mode || 'mock' });
    return this.registry.create(system, rest);
  }

  /**
   * Create and connect an adapter in one step.
   *
   * @param {object} config - Same as create()
   * @returns {Promise<BaseSourceAdapter>} Connected adapter
   */
  async createAndConnect(config = {}) {
    const adapter = this.create(config);
    await adapter.connect();
    return adapter;
  }

  /**
   * List all available system types.
   * @returns {string[]}
   */
  listAvailableSystems() {
    return this.registry.listSystems();
  }

  /**
   * Check if a system type is supported.
   * @param {string} system
   * @returns {boolean}
   */
  isSupported(system) {
    return this.registry.has(system);
  }
}

module.exports = { AdapterFactory };
