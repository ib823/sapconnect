/**
 * Custom Code Extractor
 *
 * Extracts custom code inventory including Z and Y namespace objects from the
 * repository, custom programs from TRDIR, table usage cross-references,
 * and include dependencies. In live mode, READ_REPORT FM would be used
 * for source code retrieval; mock mode provides static data.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class CustomCodeExtractor extends BaseExtractor {
  get extractorId() { return 'CUSTOM_CODE'; }
  get name() { return 'Custom Code Inventory'; }
  get module() { return 'BASIS'; }
  get category() { return 'code'; }

  getExpectedTables() {
    return [
      { table: 'TADIR', description: 'Repository objects (filtered Z*/Y*)', critical: true },
      { table: 'TRDIR', description: 'Program directory (filtered Z*/Y*)', critical: true },
      { table: 'D010TAB', description: 'Table usage in programs', critical: false },
      { table: 'D010INC', description: 'Include usage in programs', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // TADIR - Custom repository objects (Z* and Y* namespaces)
    try {
      const data = await this._readTable('TADIR', {
        fields: ['PGMID', 'OBJECT', 'OBJ_NAME', 'DEVCLASS', 'AUTHOR', 'CREATED_ON', 'SRCSYSTEM'],
        where: "OBJ_NAME LIKE 'Z%' OR OBJ_NAME LIKE 'Y%'",
      });
      result.customObjects = data.rows;
    } catch (err) {
      this.logger.warn(`TADIR read failed: ${err.message}`);
      result.customObjects = [];
    }

    // TRDIR - Custom programs (Z* and Y* namespaces)
    try {
      const data = await this._readTable('TRDIR', {
        fields: ['NAME', 'SUBC', 'RSTAT', 'RLOAD', 'FIXPT', 'UNICODE'],
        where: "NAME LIKE 'Z%' OR NAME LIKE 'Y%'",
      });
      result.customPrograms = data.rows;
    } catch (err) {
      this.logger.warn(`TRDIR read failed: ${err.message}`);
      result.customPrograms = [];
    }

    // D010TAB - Table usage in programs
    try {
      const data = await this._readTable('D010TAB', {
        fields: ['MASTER', 'TABNAME'],
        where: "MASTER LIKE 'Z%' OR MASTER LIKE 'Y%'",
      });
      result.tableUsage = data.rows;
    } catch (err) {
      this._trackCoverage('D010TAB', 'skipped', { reason: err.message });
      result.tableUsage = [];
    }

    // D010INC - Include usage in programs
    try {
      const data = await this._readTable('D010INC', {
        fields: ['MASTER', 'INCLUDE'],
        where: "MASTER LIKE 'Z%' OR MASTER LIKE 'Y%'",
      });
      result.includeUsage = data.rows;
    } catch (err) {
      this._trackCoverage('D010INC', 'skipped', { reason: err.message });
      result.includeUsage = [];
    }

    // Compute stats
    result.stats = this._computeStats(result);

    // Note: Source code retrieval via READ_REPORT FM is available in live
    // mode on demand but not performed during bulk extraction for performance.

    return result;
  }

  _computeStats(result) {
    const totalCustom = result.customObjects.length;

    const byType = {};
    for (const obj of result.customObjects) {
      byType[obj.OBJECT] = (byType[obj.OBJECT] || 0) + 1;
    }

    // Estimate lines of code from TRDIR RLINES if available
    let linesOfCode = 0;
    for (const prog of result.customPrograms) {
      linesOfCode += prog.RLINES || 0;
    }

    return {
      totalCustom,
      byType,
      linesOfCode,
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/custom-code-data.json');
    this._trackCoverage('TADIR', 'extracted', { rowCount: mockData.customObjects.length });
    this._trackCoverage('TRDIR', 'extracted', { rowCount: mockData.customPrograms.length });
    this._trackCoverage('D010TAB', 'extracted', { rowCount: mockData.tableUsage.length });
    this._trackCoverage('D010INC', 'extracted', { rowCount: mockData.includeUsage.length });
    return mockData;
  }
}

CustomCodeExtractor._extractorId = 'CUSTOM_CODE';
CustomCodeExtractor._module = 'BASIS';
CustomCodeExtractor._category = 'code';
ExtractorRegistry.register(CustomCodeExtractor);

module.exports = CustomCodeExtractor;
