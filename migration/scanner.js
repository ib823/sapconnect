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
 * ECC Custom Code Scanner
 *
 * Scans a connected SAP ECC system for custom development objects.
 * Works with the same SapGateway from agent/ (vsp, live, or mock modes).
 *
 * In mock mode, returns a realistic ECC client scenario from mock-assessment.json.
 */
class Scanner {
  constructor(gateway, options = {}) {
    this.gateway = gateway;
    this.verbose = options.verbose || false;
    this.mockData = null;
    this.logger = new Logger('scanner', { level: options.logLevel || 'info' });
  }

  _log(msg) {
    this.logger.info(msg);
  }

  _loadMockData() {
    if (!this.mockData) {
      const mockPath = path.join(__dirname, 'mock-assessment.json');
      const raw = fs.readFileSync(mockPath, 'utf8');
      this.mockData = JSON.parse(raw);
    }
    return this.mockData;
  }

  /**
   * Full scan: discover all custom objects and read their source
   * @returns {object} { packages, objects, sources, stats }
   */
  async scan() {
    this._log('Starting custom code scan...');

    if (this.gateway.mode === 'mock') {
      return this._scanMock();
    }

    return this._scanLive();
  }

  /**
   * Live scan using vsp or RFC gateway
   */
  async _scanLive() {
    const stats = { packages: 0, objects: 0, sourcesRead: 0, errors: 0 };
    const packages = [];
    const objects = [];
    const sources = {};

    // Step 1: Search for all Z* and Y* objects
    this._log('Searching for custom Z* objects...');
    const zResults = await this.gateway.searchRepository('Z*');
    this._log(`Found ${zResults.result_count || 0} Z* objects`);

    this._log('Searching for custom Y* objects...');
    const yResults = await this.gateway.searchRepository('Y*');
    this._log(`Found ${yResults.result_count || 0} Y* objects`);

    const allResults = [
      ...(zResults.results || []),
      ...(yResults.results || []),
    ];

    // Deduplicate by name
    const seen = new Set();
    for (const obj of allResults) {
      if (!seen.has(obj.name)) {
        seen.add(obj.name);
        objects.push({
          name: obj.name,
          type: obj.type || 'UNKNOWN',
          description: obj.description || '',
          package: obj.package || '',
        });
      }
    }
    stats.objects = objects.length;

    // Collect unique packages
    const pkgSet = new Set();
    for (const obj of objects) {
      if (obj.package) pkgSet.add(obj.package);
    }
    packages.push(...[...pkgSet].map((p) => ({ name: p })));
    stats.packages = packages.length;

    // Step 2: Read source code for classes, interfaces, programs, function modules
    const readableTypes = new Set(['CLAS', 'INTF', 'PROG', 'FUGR', 'REPS']);
    for (const obj of objects) {
      if (readableTypes.has(obj.type)) {
        this._log(`Reading source: ${obj.name} (${obj.type})`);
        try {
          const result = await this.gateway.readAbapSource(obj.name, obj.type);
          if (result && result.source) {
            sources[obj.name] = {
              type: obj.type,
              source: result.source,
              lines: result.source.split('\n').length,
            };
            stats.sourcesRead++;
          }
        } catch (err) {
          this._log(`  Error reading ${obj.name}: ${err.message}`);
          stats.errors++;
        }
      }
    }

    this._log(`Scan complete: ${stats.objects} objects, ${stats.sourcesRead} sources read`);

    return { packages, objects, sources, stats };
  }

  /**
   * Mock scan returning pre-built data
   */
  _scanMock() {
    this._log('Running mock scan (demo data)...');
    const data = this._loadMockData();
    return {
      packages: data.packages,
      objects: data.objects,
      sources: data.sources,
      stats: data.stats,
    };
  }
}

module.exports = Scanner;
