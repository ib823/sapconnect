/**
 * Number Range Extractor
 *
 * Extracts all number range objects and their interval definitions
 * across the system. Number ranges are critical for understanding
 * document numbering and migration planning.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class NumberRangeExtractor extends BaseExtractor {
  get extractorId() { return 'NUMBER_RANGES'; }
  get name() { return 'Number Range Configuration'; }
  get module() { return 'BASIS'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'NRIV', description: 'Number range intervals', critical: true },
      { table: 'INRI', description: 'Number range objects', critical: true },
    ];
  }

  async _extractLive() {
    const result = { objects: [], intervals: [] };

    try {
      const objects = await this._readTable('INRI', {
        fields: ['OBJECT', 'TEXT'],
      });
      result.objects = objects.rows;
    } catch (err) {
      this.logger.warn(`INRI read failed: ${err.message}`);
    }

    try {
      const intervals = await this._readTable('NRIV', {
        fields: ['OBJECT', 'SUBOBJECT', 'NRRANGENR', 'FROMNUMBER', 'TONUMBER', 'NRLEVEL', 'EXTERNIND'],
      });
      result.intervals = intervals.rows;
    } catch (err) {
      this.logger.warn(`NRIV read failed: ${err.message}`);
    }

    // Calculate consumption levels
    result.consumption = result.intervals.map(i => {
      const from = parseInt(i.FROMNUMBER, 10) || 0;
      const to = parseInt(i.TONUMBER, 10) || 0;
      const current = parseInt(i.NRLEVEL, 10) || 0;
      const range = to - from;
      const used = current - from;
      return {
        object: i.OBJECT,
        range: i.NRRANGENR,
        external: i.EXTERNIND === 'X',
        from: i.FROMNUMBER,
        to: i.TONUMBER,
        current: i.NRLEVEL,
        consumptionPct: range > 0 ? Math.round((used / range) * 100) : 0,
      };
    });

    return result;
  }

  async _extractMock() {
    const mockData = {
      objects: [
        { OBJECT: 'BKPF_BUKR', TEXT: 'FI Document Numbers' },
        { OBJECT: 'EINKBELEG', TEXT: 'Purchasing Document Numbers' },
        { OBJECT: 'VERKBELEG', TEXT: 'Sales Document Numbers' },
        { OBJECT: 'MATBELEG', TEXT: 'Material Document Numbers' },
        { OBJECT: 'DEBITOR', TEXT: 'Customer Account Numbers' },
        { OBJECT: 'KREDITOR', TEXT: 'Vendor Account Numbers' },
        { OBJECT: 'ANLAGEN', TEXT: 'Asset Numbers' },
      ],
      intervals: [
        { OBJECT: 'BKPF_BUKR', SUBOBJECT: '1000', NRRANGENR: '01', FROMNUMBER: '0100000000', TONUMBER: '0199999999', NRLEVEL: '0145238901', EXTERNIND: '' },
        { OBJECT: 'EINKBELEG', SUBOBJECT: '', NRRANGENR: '46', FROMNUMBER: '4600000000', TONUMBER: '4699999999', NRLEVEL: '4600012580', EXTERNIND: '' },
        { OBJECT: 'VERKBELEG', SUBOBJECT: '', NRRANGENR: '01', FROMNUMBER: '0000000001', TONUMBER: '0000099999', NRLEVEL: '0000058234', EXTERNIND: '' },
        { OBJECT: 'MATBELEG', SUBOBJECT: '', NRRANGENR: '49', FROMNUMBER: '4900000000', TONUMBER: '4999999999', NRLEVEL: '4900089012', EXTERNIND: '' },
        { OBJECT: 'DEBITOR', SUBOBJECT: '', NRRANGENR: '01', FROMNUMBER: '0000100000', TONUMBER: '0000199999', NRLEVEL: '0000145678', EXTERNIND: '' },
      ],
      consumption: [
        { object: 'BKPF_BUKR', range: '01', external: false, from: '0100000000', to: '0199999999', current: '0145238901', consumptionPct: 45 },
        { object: 'EINKBELEG', range: '46', external: false, from: '4600000000', to: '4699999999', current: '4600012580', consumptionPct: 0 },
        { object: 'VERKBELEG', range: '01', external: false, from: '0000000001', to: '0000099999', current: '0000058234', consumptionPct: 58 },
      ],
    };

    this._trackCoverage('NRIV', 'extracted', { rowCount: mockData.intervals.length });
    this._trackCoverage('INRI', 'extracted', { rowCount: mockData.objects.length });
    return mockData;
  }
}

NumberRangeExtractor._extractorId = 'NUMBER_RANGES';
NumberRangeExtractor._module = 'BASIS';
NumberRangeExtractor._category = 'config';
ExtractorRegistry.register(NumberRangeExtractor);

module.exports = NumberRangeExtractor;
