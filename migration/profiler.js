const fs = require('fs');
const path = require('path');

/**
 * Data Profiling Engine
 *
 * Queries table row counts, data age per module, identifies stale data,
 * duplicates, and orphans. Mock data provides realistic ECC profile.
 */
class Profiler {
  constructor(gateway, options = {}) {
    this.gateway = gateway;
    this.verbose = options.verbose || false;
    this.modules = options.modules || null; // null = all modules
    this.mockData = null;
  }

  _log(msg) {
    if (this.verbose) {
      console.log(`  [profiler] ${msg}`);
    }
  }

  _loadMockData() {
    if (!this.mockData) {
      const mockPath = path.join(__dirname, 'mock-profile.json');
      const raw = fs.readFileSync(mockPath, 'utf8');
      this.mockData = JSON.parse(raw);
    }
    return this.mockData;
  }

  /**
   * Run data profiling
   * @returns {object} { tables, staleData, duplicates, orphans, summary }
   */
  async profile() {
    this._log('Starting data profiling...');

    if (this.gateway.mode === 'mock') {
      return this._profileMock();
    }

    return this._profileLive();
  }

  _profileMock() {
    this._log('Running mock profiling (demo data)...');
    const data = this._loadMockData();

    // Filter by requested modules if specified
    let tables = data.tables;
    if (this.modules && this.modules.length > 0) {
      const selected = {};
      for (const mod of this.modules) {
        const key = mod.toUpperCase();
        if (data.tables[key]) {
          selected[key] = data.tables[key];
        }
      }
      tables = selected;
    }

    // Recalculate summary for filtered data
    const summary = this.modules ? this._calculateSummary(tables, data) : data.summary;

    return {
      tables,
      staleData: data.staleData,
      duplicates: data.duplicates,
      orphans: data.orphans,
      summary,
    };
  }

  async _profileLive() {
    this._log('Live profiling not yet implemented, falling back to mock...');
    console.log('  [profiler] Live data profiling requires RFC_READ_TABLE or CDS access.');
    console.log('  [profiler] Falling back to mock data.\n');
    return this._profileMock();
  }

  _calculateSummary(tables, fullData) {
    let totalTables = 0;
    let totalRecords = 0;
    let totalSizeMB = 0;

    for (const moduleTables of Object.values(tables)) {
      for (const t of moduleTables) {
        totalTables++;
        totalRecords += t.records;
        totalSizeMB += t.sizeMB;
      }
    }

    return {
      totalTables,
      totalRecords,
      totalSizeMB,
      totalSizeGB: Math.round(totalSizeMB / 1024 * 10) / 10,
      staleRecords: fullData.summary.staleRecords,
      stalePercent: fullData.summary.stalePercent,
      duplicateRecords: fullData.summary.duplicateRecords,
      orphanRecords: fullData.summary.orphanRecords,
      dataQualityScore: fullData.summary.dataQualityScore,
      recommendation: fullData.summary.recommendation,
    };
  }
}

module.exports = Profiler;
