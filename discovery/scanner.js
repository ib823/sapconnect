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
const fs = require('fs');
const path = require('path');
const Logger = require('../lib/logger');

/**
 * Scanner - Core API discovery logic
 *
 * Two modes:
 * 1. Mock mode (default): reads from mock-catalog.json
 * 2. Live mode: connects to a real SAP system via Communication Arrangement
 */
class Scanner {
  constructor(options = {}) {
    this.mode = options.system ? 'live' : 'mock';
    this.system = options.system || null;
    this.username = options.username || process.env.SAP_USERNAME;
    this.password = options.password || process.env.SAP_PASSWORD;
    this.logger = new Logger('discovery-scanner', { level: options.logLevel || 'info' });
  }

  async scan() {
    if (this.mode === 'mock') {
      return this.scanMock();
    }
    return this.scanLive();
  }

  async scanMock() {
    const catalogPath = path.join(__dirname, 'mock-catalog.json');
    const raw = fs.readFileSync(catalogPath, 'utf8');
    const catalog = JSON.parse(raw);

    return {
      mode: 'mock',
      system: catalog.system,
      communicationScenarios: catalog.communicationScenarios,
      releasedAPIs: catalog.releasedAPIs,
      events: catalog.events,
      extensionPoints: catalog.extensionPoints,
      summary: {
        totalScenarios: catalog.communicationScenarios.length,
        totalAPIs: catalog.releasedAPIs.length,
        totalEvents: catalog.events.length,
        totalExtensionPoints: catalog.extensionPoints.length,
        categories: this.extractCategories(catalog),
      },
    };
  }

  async scanLive() {
    // Live scanning requires a Communication Arrangement in the SAP system
    // with the following Communication Scenarios:
    // - SAP_COM_0A08: Communication Scenario Read
    // - SAP_COM_0A09: Communication Arrangement Read
    // - Various metadata endpoints

    if (!this.system) {
      throw new Error('System URL is required for live scanning');
    }
    if (!this.username || !this.password) {
      throw new Error(
        'SAP_USERNAME and SAP_PASSWORD are required for live scanning'
      );
    }

    this.logger.info(`Connecting to ${this.system}...`);
    this.logger.warn('Live scanning is not yet implemented. Use mock mode for demos.');
    this.logger.info('To implement, add HTTP calls to the SAP system metadata endpoints:');
    this.logger.info('  - /sap/opu/odata/sap/APS_IAM_CSCEN_V2 (Communication Scenarios)');
    this.logger.info('  - /sap/opu/odata/sap/APS_IAM_CARNG_V2 (Communication Arrangements)');
    this.logger.info('  - /sap/opu/odata4/sap/api-business-hub-enterprise/srvd_a2x/sap/apibhubenterprise/0001 (API catalog)');

    // Fall back to mock data for now
    return this.scanMock();
  }

  extractCategories(catalog) {
    const categories = new Set();
    for (const api of catalog.releasedAPIs) {
      categories.add(api.category);
    }
    for (const event of catalog.events) {
      categories.add(event.category);
    }
    return [...categories].sort();
  }
}

module.exports = Scanner;
