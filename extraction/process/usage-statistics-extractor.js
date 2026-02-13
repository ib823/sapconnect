/**
 * Usage Statistics Extractor
 *
 * Reads workload data from SWNCMONI/ST03N to understand
 * transaction usage patterns, user activity, and system load.
 */

const BaseExtractor = require('../base-extractor');
const ExtractorRegistry = require('../extractor-registry');

class UsageStatisticsExtractor extends BaseExtractor {
  get extractorId() { return 'USAGE_STATISTICS'; }
  get name() { return 'Usage Statistics'; }
  get module() { return 'BASIS'; }
  get category() { return 'process'; }

  getExpectedTables() {
    return [
      { table: 'SWNCMONI', description: 'Workload monitor data', critical: true },
    ];
  }

  async _extractLive() {
    const result = { transactionUsage: [], userActivity: [], timeDistribution: [] };

    try {
      const snapshots = await this._callFM('SWNC_GET_WORKLOAD_SNAPSHOT', {
        READ_START_DATE: this._getDateMonthsAgo(12),
        READ_END_DATE: this._getToday(),
        READ_START_TIME: '000000',
        READ_END_TIME: '235959',
      });

      if (snapshots && snapshots.USERTCODE) {
        result.transactionUsage = (snapshots.USERTCODE || []).map(r => ({
          tcode: (r.ENTRY_ID || '').trim(),
          executions: parseInt(r.COUNT, 10) || 0,
          totalTime: parseInt(r.RESPTI, 10) || 0,
          avgTime: parseInt(r.RESPTI, 10) / (parseInt(r.COUNT, 10) || 1),
        }));
      }
    } catch (err) {
      this.logger.warn(`SWNC_GET_WORKLOAD_SNAPSHOT failed: ${err.message}`);
      this._trackCoverage('SWNCMONI', 'failed', { error: err.message });
    }

    return result;
  }

  async _extractMock() {
    const mockData = {
      transactionUsage: [
        { tcode: 'VA01', executions: 15420, totalTime: 462600, avgTime: 30 },
        { tcode: 'VA02', executions: 28350, totalTime: 425250, avgTime: 15 },
        { tcode: 'ME21N', executions: 8900, totalTime: 267000, avgTime: 30 },
        { tcode: 'ME23N', executions: 12500, totalTime: 125000, avgTime: 10 },
        { tcode: 'FB01', executions: 6200, totalTime: 186000, avgTime: 30 },
        { tcode: 'FB03', executions: 18900, totalTime: 94500, avgTime: 5 },
        { tcode: 'MM02', executions: 4300, totalTime: 86000, avgTime: 20 },
        { tcode: 'XD02', executions: 2100, totalTime: 42000, avgTime: 20 },
        { tcode: 'CO01', executions: 3500, totalTime: 105000, avgTime: 30 },
        { tcode: 'VL01N', executions: 9800, totalTime: 196000, avgTime: 20 },
        { tcode: 'VF01', executions: 7200, totalTime: 144000, avgTime: 20 },
        { tcode: 'MIGO', executions: 11200, totalTime: 224000, avgTime: 20 },
        { tcode: 'SE38', executions: 5600, totalTime: 280000, avgTime: 50 },
        { tcode: 'SM37', executions: 4100, totalTime: 20500, avgTime: 5 },
        { tcode: 'SU01', executions: 890, totalTime: 26700, avgTime: 30 },
      ],
      userActivity: [
        { user: 'JSMITH', totalExecutions: 12500, topTcodes: ['VA01', 'VA02', 'VL01N'] },
        { user: 'KLEE', totalExecutions: 9800, topTcodes: ['ME21N', 'ME23N', 'MIGO'] },
        { user: 'LCHEN', totalExecutions: 8200, topTcodes: ['FB01', 'FB03', 'F110'] },
        { user: 'ADMIN', totalExecutions: 6500, topTcodes: ['SE38', 'SM37', 'SU01'] },
        { user: 'MJONES', totalExecutions: 7100, topTcodes: ['MM02', 'CO01', 'KS01'] },
      ],
      timeDistribution: [
        { hour: 8, executions: 8500 },
        { hour: 9, executions: 15200 },
        { hour: 10, executions: 18900 },
        { hour: 11, executions: 16500 },
        { hour: 12, executions: 8200 },
        { hour: 13, executions: 12100 },
        { hour: 14, executions: 17800 },
        { hour: 15, executions: 16200 },
        { hour: 16, executions: 11500 },
        { hour: 17, executions: 5800 },
      ],
    };

    this._trackCoverage('SWNCMONI', 'extracted', { rowCount: mockData.transactionUsage.length });
    return mockData;
  }

  _getDateMonthsAgo(months) {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  }

  _getToday() {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }
}

UsageStatisticsExtractor._extractorId = 'USAGE_STATISTICS';
UsageStatisticsExtractor._module = 'BASIS';
UsageStatisticsExtractor._category = 'process';
ExtractorRegistry.register(UsageStatisticsExtractor);

module.exports = UsageStatisticsExtractor;
