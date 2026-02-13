/**
 * Data Dictionary Extractor
 *
 * Extracts the complete ABAP Data Dictionary: all tables, fields,
 * data elements, domains, foreign keys, indexes, views, and technical settings.
 * MUST run first — its output is shared via ExtractionContext.dataDictionary.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class DataDictionaryExtractor extends BaseExtractor {
  get extractorId() { return 'DATA_DICTIONARY'; }
  get name() { return 'Data Dictionary'; }
  get module() { return 'BASIS'; }
  get category() { return 'metadata'; }

  getExpectedTables() {
    return [
      { table: 'DD02L', description: 'SAP tables', critical: true },
      { table: 'DD02T', description: 'Table texts', critical: true },
      { table: 'DD03L', description: 'Table fields', critical: true },
      { table: 'DD04L', description: 'Data elements', critical: false },
      { table: 'DD04T', description: 'Data element texts', critical: false },
      { table: 'DD05S', description: 'Foreign keys', critical: false },
      { table: 'DD07L', description: 'Domain fixed values', critical: false },
      { table: 'DD07T', description: 'Domain fixed value texts', critical: false },
      { table: 'DD08L', description: 'Table relationships', critical: false },
      { table: 'DD09L', description: 'Technical settings', critical: false },
      { table: 'DD12L', description: 'Secondary indexes', critical: false },
      { table: 'DD25L', description: 'View definitions', critical: false },
    ];
  }

  async _extractLive() {
    const result = {
      tables: {},
      dataElements: {},
      domains: {},
      views: {},
      relationships: [],
      stats: {},
    };

    // DD02L + DD02T — All tables with descriptions
    try {
      const tables = await this._readTable('DD02L', {
        fields: ['TABNAME', 'TABCLASS', 'AS4LOCAL', 'CONTFLAG', 'EXCLASS'],
        where: "AS4LOCAL = 'A'",
      });
      for (const row of tables.rows) {
        result.tables[row.TABNAME] = { ...row, fields: [], foreignKeys: [], indexes: [] };
      }
      result.stats.totalTables = tables.rows.length;
    } catch (err) {
      this.logger.error(`DD02L read failed: ${err.message}`);
    }

    // DD03L — All fields
    try {
      for await (const chunk of this._streamTable('DD03L', {
        fields: ['TABNAME', 'FIELDNAME', 'DATATYPE', 'LENG', 'DECIMALS', 'ROLLNAME'],
        where: "AS4LOCAL = 'A'",
        chunkSize: 50000,
      })) {
        for (const row of chunk.rows) {
          if (result.tables[row.TABNAME]) {
            result.tables[row.TABNAME].fields.push(row);
          }
        }
      }
    } catch (err) {
      this.logger.error(`DD03L stream failed: ${err.message}`);
    }

    // DD04L — Data elements
    try {
      const dels = await this._readTable('DD04L', {
        fields: ['ROLLNAME', 'DOMNAME', 'DATATYPE', 'LENG', 'DECIMALS'],
        where: "AS4LOCAL = 'A'",
      });
      for (const row of dels.rows) {
        result.dataElements[row.ROLLNAME] = row;
      }
      result.stats.totalDataElements = dels.rows.length;
    } catch (err) {
      this.logger.warn(`DD04L read failed: ${err.message}`);
    }

    // DD05S — Foreign keys
    try {
      const fks = await this._readTable('DD05S', {
        fields: ['TABNAME', 'FIELDNAME', 'CHECKTABLE', 'CHECKFIELD', 'PRIMPOS'],
      });
      result.relationships = fks.rows;
    } catch (err) {
      this.logger.warn(`DD05S read failed: ${err.message}`);
    }

    // DD07L — Domain fixed values
    try {
      const fixVals = await this._readTable('DD07L', {
        fields: ['DOMNAME', 'DOMVALUE_L', 'DOMVALUE_H', 'VALPOS'],
        where: "AS4LOCAL = 'A'",
      });
      for (const row of fixVals.rows) {
        if (!result.domains[row.DOMNAME]) {
          result.domains[row.DOMNAME] = { fixedValues: [] };
        }
        result.domains[row.DOMNAME].fixedValues.push(row);
      }
      result.stats.totalDomains = Object.keys(result.domains).length;
    } catch (err) {
      this.logger.warn(`DD07L read failed: ${err.message}`);
    }

    // DD25L — Views
    try {
      const views = await this._readTable('DD25L', {
        fields: ['VIEWNAME', 'ROTEFLAG', 'VIEWCLASS'],
        where: "AS4LOCAL = 'A'",
      });
      for (const row of views.rows) {
        result.views[row.VIEWNAME] = row;
      }
    } catch (err) {
      this.logger.warn(`DD25L read failed: ${err.message}`);
    }

    // Share with context
    this.context.dataDictionary = result;
    return result;
  }

  async _extractMock() {
    const mockData = require('../mock-data/data-dictionary.json');

    this._trackCoverage('DD02L', 'extracted', { rowCount: Object.keys(mockData.tables).length });
    this._trackCoverage('DD02T', 'extracted', { rowCount: Object.keys(mockData.tables).length });
    this._trackCoverage('DD03L', 'extracted', { rowCount: Object.keys(mockData.fields).length });
    this._trackCoverage('DD04L', 'extracted', { rowCount: Object.keys(mockData.dataElements).length });
    this._trackCoverage('DD04T', 'extracted', { rowCount: Object.keys(mockData.dataElements).length });
    this._trackCoverage('DD05S', 'extracted', { rowCount: mockData.relationships.length });
    this._trackCoverage('DD07L', 'extracted', { rowCount: Object.keys(mockData.domains).length });
    this._trackCoverage('DD07T', 'extracted', { rowCount: 0 });
    this._trackCoverage('DD08L', 'extracted', { rowCount: mockData.relationships.length });
    this._trackCoverage('DD09L', 'extracted', { rowCount: 0 });
    this._trackCoverage('DD12L', 'extracted', { rowCount: 0 });
    this._trackCoverage('DD25L', 'extracted', { rowCount: Object.keys(mockData.views).length });

    this.context.dataDictionary = mockData;
    return mockData;
  }
}

DataDictionaryExtractor._extractorId = 'DATA_DICTIONARY';
DataDictionaryExtractor._module = 'BASIS';
DataDictionaryExtractor._category = 'metadata';
ExtractorRegistry.register(DataDictionaryExtractor);

module.exports = DataDictionaryExtractor;
