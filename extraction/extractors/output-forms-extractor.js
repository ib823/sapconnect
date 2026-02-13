/**
 * Output & Forms Extractor
 *
 * Extracts output and forms inventory including SAPscript forms,
 * Smart Forms, and Adobe Forms with type breakdown statistics.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class OutputFormsExtractor extends BaseExtractor {
  get extractorId() { return 'OUTPUT_FORMS'; }
  get name() { return 'Output & Forms'; }
  get module() { return 'BASIS'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [
      { table: 'STXH', description: 'SAPscript form headers', critical: true },
      { table: 'STXFADM', description: 'Smart Forms administration', critical: true },
      { table: 'FPCONNECT', description: 'Adobe Forms connections', critical: false },
    ];
  }

  async _extractLive() {
    const result = {};

    // STXH - SAPscript forms
    try {
      const data = await this._readTable('STXH', {
        fields: ['TDNAME', 'TDID', 'TDSPRAS', 'TDTEXTTYPE', 'TDSTYLE', 'TDVERSION', 'TDLDATE', 'TDLTIME', 'TDLUSER'],
      });
      result.sapscriptForms = data.rows;
    } catch (err) {
      this.logger.warn(`STXH read failed: ${err.message}`);
      result.sapscriptForms = [];
    }

    // STXFADM - Smart Forms
    try {
      const data = await this._readTable('STXFADM', {
        fields: ['FORMNAME', 'LANGU', 'DEVCLASS', 'LASTUSER', 'LASTDATE', 'LASTTIME', 'FTYPE', 'DESCRIPTION'],
      });
      result.smartForms = data.rows;
    } catch (err) {
      this.logger.warn(`STXFADM read failed: ${err.message}`);
      result.smartForms = [];
    }

    // FPCONNECT - Adobe Forms
    try {
      const data = await this._readTable('FPCONNECT', {
        fields: ['FORMNAME', 'DEVCLASS', 'CREATED_BY', 'CREATED_ON', 'CHANGED_BY', 'CHANGED_ON', 'DESCRIPTION', 'TEMPLATE_TYPE'],
      });
      result.adobeForms = data.rows;
    } catch (err) {
      this._trackCoverage('FPCONNECT', 'skipped', { reason: err.message });
      result.adobeForms = [];
    }

    // Compute stats
    result.stats = this._computeStats(result);

    return result;
  }

  _computeStats(result) {
    const sapscriptCount = (result.sapscriptForms || []).length;
    const smartFormsCount = (result.smartForms || []).length;
    const adobeFormsCount = (result.adobeForms || []).length;

    return {
      totalForms: sapscriptCount + smartFormsCount + adobeFormsCount,
      byType: {
        sapscript: sapscriptCount,
        smartForms: smartFormsCount,
        adobeForms: adobeFormsCount,
      },
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/output-forms-data.json');
    this._trackCoverage('STXH', 'extracted', { rowCount: mockData.sapscriptForms.length });
    this._trackCoverage('STXFADM', 'extracted', { rowCount: mockData.smartForms.length });
    this._trackCoverage('FPCONNECT', 'extracted', { rowCount: mockData.adobeForms.length });
    return mockData;
  }
}

OutputFormsExtractor._extractorId = 'OUTPUT_FORMS';
OutputFormsExtractor._module = 'BASIS';
OutputFormsExtractor._category = 'config';
ExtractorRegistry.register(OutputFormsExtractor);

module.exports = OutputFormsExtractor;
