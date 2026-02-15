/**
 * Infor LN Data Quality Extractor
 *
 * Profiles data quality across key tables: tcibd001 (items), tccom100 (BPs),
 * tfgld100 (GL), tdsls400 (SO), tdpur400 (PO).
 */

const BaseExtractor = require('../../base-extractor');
const ExtractorRegistry = require('../../extractor-registry');

class InforLNDataQualityExtractor extends BaseExtractor {
  get extractorId() { return 'INFOR_LN_DATA_QUALITY'; }
  get name() { return 'Infor LN Data Quality Profile'; }
  get module() { return 'LN_DQ'; }
  get category() { return 'data-quality'; }

  getExpectedTables() {
    return [
      { table: 'tcibd001', description: 'Items', critical: true },
      { table: 'tccom100', description: 'Business partners', critical: true },
      { table: 'tfgld100', description: 'General ledger accounts', critical: true },
      { table: 'tdsls400', description: 'Sales orders', critical: false },
      { table: 'tdpur400', description: 'Purchase orders', critical: false },
    ];
  }

  async _extractLive() {
    const result = { tableProfiles: [] };
    const tables = [
      { table: 'tcibd001', description: 'Items', keyField: 't$item', fields: ['t$item', 't$dsca', 't$citg', 't$csig', 't$cuni', 't$wght', 't$volu', 't$ctyp'] },
      { table: 'tccom100', description: 'Business Partners', keyField: 't$bpid', fields: ['t$bpid', 't$nama', 't$namc', 't$ccty', 't$pstc', 't$telp', 't$emal', 't$txnb'] },
      { table: 'tfgld100', description: 'General Ledger Accounts', keyField: 't$leac', fields: ['t$leac', 't$desc', 't$type', 't$dbcr', 't$dimn', 't$curc'] },
      { table: 'tdsls400', description: 'Sales Orders', keyField: 't$ession', fields: ['t$ession', 't$bpid', 't$odat', 't$ddat', 't$cprj', 't$dlrm', 't$ccur'] },
      { table: 'tdpur400', description: 'Purchase Orders', keyField: 't$ession', fields: ['t$ession', 't$bpid', 't$odat', 't$ddat', 't$cprj', 't$ccur', 't$buyer'] },
    ];

    for (const tbl of tables) {
      try {
        const data = await this._readTable(tbl.table, { fields: tbl.fields });
        const profile = this._profileTable(tbl, data.rows);
        result.tableProfiles.push(profile);
      } catch (err) {
        this.logger.warn(`${tbl.table} read failed: ${err.message}`);
        result.tableProfiles.push({
          table: tbl.table,
          description: tbl.description,
          totalRecords: 0,
          completeness: { overall: 0, byField: {} },
          duplicates: { count: 0, percentage: 0 },
          dataIssues: [{ issue: `Read failed: ${err.message}`, count: 0, severity: 'high' }],
        });
      }
    }

    result.overallSummary = this._buildOverallSummary(result.tableProfiles);
    return result;
  }

  _profileTable(tbl, rows) {
    const totalRecords = rows.length;
    const byField = {};

    for (const field of tbl.fields) {
      const filled = rows.filter(r => r[field] !== null && r[field] !== undefined && r[field] !== '').length;
      const filledPct = totalRecords > 0 ? (filled / totalRecords) * 100 : 0;
      byField[field] = {
        filled: Math.round(filledPct * 10) / 10,
        nullPct: Math.round((100 - filledPct) * 10) / 10,
      };
    }

    const overallCompleteness = Object.values(byField).reduce((sum, f) => sum + f.filled, 0) / tbl.fields.length;

    return {
      table: tbl.table,
      description: tbl.description,
      totalRecords,
      completeness: {
        overall: Math.round(overallCompleteness * 10) / 10,
        byField,
      },
      duplicates: { count: 0, percentage: 0, checkFields: [tbl.keyField] },
      dataIssues: [],
    };
  }

  _buildOverallSummary(profiles) {
    const tablesProfiled = profiles.length;
    const totalRecords = profiles.reduce((s, p) => s + p.totalRecords, 0);
    const avgCompleteness = profiles.reduce((s, p) => s + p.completeness.overall, 0) / tablesProfiled;
    const totalDuplicates = profiles.reduce((s, p) => s + p.duplicates.count, 0);
    const allIssues = profiles.flatMap(p => p.dataIssues);

    return {
      tablesProfiled,
      totalRecords,
      averageCompleteness: Math.round(avgCompleteness * 100) / 100,
      totalDuplicates,
      totalDataIssues: allIssues.length,
      highSeverityIssues: allIssues.filter(i => i.severity === 'high').length,
      mediumSeverityIssues: allIssues.filter(i => i.severity === 'medium').length,
      lowSeverityIssues: allIssues.filter(i => i.severity === 'low').length,
    };
  }

  async _extractMock() {
    const mockData = require('../mock-data/ln/data-quality.json');
    this._trackCoverage('tcibd001', 'extracted', { rowCount: mockData.tableProfiles[0].totalRecords });
    this._trackCoverage('tccom100', 'extracted', { rowCount: mockData.tableProfiles[1].totalRecords });
    this._trackCoverage('tfgld100', 'extracted', { rowCount: mockData.tableProfiles[2].totalRecords });
    this._trackCoverage('tdsls400', 'extracted', { rowCount: mockData.tableProfiles[3].totalRecords });
    this._trackCoverage('tdpur400', 'extracted', { rowCount: mockData.tableProfiles[4].totalRecords });
    return mockData;
  }
}

InforLNDataQualityExtractor._extractorId = 'INFOR_LN_DATA_QUALITY';
InforLNDataQualityExtractor._module = 'LN_DQ';
InforLNDataQualityExtractor._category = 'data-quality';
InforLNDataQualityExtractor._sourceSystem = 'INFOR_LN';
ExtractorRegistry.register(InforLNDataQualityExtractor);

module.exports = InforLNDataQualityExtractor;
