/**
 * Tests for Coverage Tracker
 */
const CoverageTracker = require('../../extraction/coverage-tracker');

describe('CoverageTracker', () => {
  let tracker;

  beforeEach(() => {
    tracker = new CoverageTracker();
  });

  describe('track/getReport', () => {
    it('should track and report table extraction status', () => {
      tracker.track('FI_CONFIG', 'T001', 'extracted', { rowCount: 5 });
      tracker.track('FI_CONFIG', 'T003', 'extracted', { rowCount: 20 });
      tracker.track('FI_CONFIG', 'T004', 'failed', { error: 'Auth denied' });

      const report = tracker.getReport('FI_CONFIG');
      expect(report.extracted).toBe(2);
      expect(report.failed).toBe(1);
      expect(report.total).toBe(3);
      expect(report.coverage).toBe(67); // 2/3 rounded
    });

    it('should return empty report for unknown extractor', () => {
      const report = tracker.getReport('UNKNOWN');
      expect(report.total).toBe(0);
      expect(report.coverage).toBe(0);
    });
  });

  describe('getModuleReport', () => {
    it('should aggregate reports by module prefix', () => {
      tracker.track('FI_CONFIG', 'T001', 'extracted');
      tracker.track('FI_MASTER', 'SKA1', 'extracted');
      tracker.track('FI_MASTER', 'SKB1', 'failed');
      tracker.track('CO_CONFIG', 'TKA01', 'extracted');

      const fiReport = tracker.getModuleReport('FI');
      expect(fiReport.extracted).toBe(2);
      expect(fiReport.failed).toBe(1);
      expect(fiReport.total).toBe(3);
    });
  });

  describe('getSystemReport', () => {
    it('should aggregate all extractors', () => {
      tracker.track('FI_CONFIG', 'T001', 'extracted');
      tracker.track('CO_CONFIG', 'TKA01', 'extracted');
      tracker.track('MM_CONFIG', 'T024E', 'skipped');

      const report = tracker.getSystemReport();
      expect(report.extracted).toBe(2);
      expect(report.skipped).toBe(1);
      expect(report.total).toBe(3);
      expect(report.extractorCount).toBe(3);
    });
  });

  describe('getGaps', () => {
    it('should return only non-extracted tables', () => {
      tracker.track('FI_CONFIG', 'T001', 'extracted');
      tracker.track('FI_CONFIG', 'T003', 'failed', { error: 'Timeout' });
      tracker.track('FI_CONFIG', 'T004', 'skipped', { reason: 'Not applicable' });

      const gaps = tracker.getGaps();
      expect(gaps).toHaveLength(2);
      expect(gaps[0].table).toBe('T003');
      expect(gaps[1].table).toBe('T004');
    });
  });

  describe('toJSON', () => {
    it('should serialize all tracking data', () => {
      tracker.track('FI_CONFIG', 'T001', 'extracted');
      const json = tracker.toJSON();
      expect(json.FI_CONFIG.T001.status).toBe('extracted');
    });
  });
});
