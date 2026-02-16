/**
 * MCP Session Context
 *
 * Shared state container for all MCP tool handler classes.
 * Holds connection, extraction context, and cached results
 * so handlers can collaborate across tool calls.
 */

'use strict';

class SessionContext {
  constructor() {
    /** @type {object|null} Active SapConnection instance */
    this.activeConnection = null;

    /** @type {object|null} ExtractionContext (lazy-built for forensic tools) */
    this.extractionContext = null;

    /** @type {object|null} Cached result from forensic_run_extraction */
    this.lastForensicResult = null;

    /** @type {object|null} Cached result from assessment_analyze_gaps */
    this.lastGapReport = null;

    /** @type {object|null} Cached result from assessment_plan_migration */
    this.lastMigrationPlan = null;

    /** @type {string} Current mode: 'mock' or 'live' */
    this.mode = 'mock';
  }

  /**
   * Update connection and derive mode.
   * @param {object} connection — SapConnection instance
   */
  setConnection(connection) {
    this.activeConnection = connection;
    this.mode = connection ? 'live' : 'mock';
  }

  /**
   * Check if a live connection is established.
   * @returns {boolean}
   */
  isConnected() {
    return this.activeConnection !== null;
  }

  /**
   * Reset all cached results (e.g., when connection changes).
   */
  clearCaches() {
    this.lastForensicResult = null;
    this.lastGapReport = null;
    this.lastMigrationPlan = null;
    this.extractionContext = null;
  }
}

module.exports = SessionContext;
