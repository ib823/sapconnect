/**
 * Tests for Base Extractor
 */
import { describe, it, expect, vi } from 'vitest';

const BaseExtractor = require('../../extraction/base-extractor');
const ExtractionContext = require('../../extraction/extraction-context');

class TestExtractor extends BaseExtractor {
  get extractorId() { return 'TEST_EXTRACTOR'; }
  get name() { return 'Test Extractor'; }
  get module() { return 'TEST'; }
  get category() { return 'config'; }

  getExpectedTables() {
    return [{ table: 'ZTABLE1', description: 'Test table', critical: true }];
  }

  async _extractMock() {
    return { testData: [{ id: 1 }, { id: 2 }] };
  }

  async _extractLive() {
    return { liveData: [{ id: 1 }] };
  }
}

describe('BaseExtractor', () => {
  let context;

  beforeEach(() => {
    context = new ExtractionContext({ mode: 'mock' });
  });

  it('should not be instantiable directly', () => {
    expect(() => new BaseExtractor(context)).toThrow('Cannot instantiate BaseExtractor directly');
  });

  it('should allow subclass instantiation', () => {
    const ext = new TestExtractor(context);
    expect(ext.extractorId).toBe('TEST_EXTRACTOR');
    expect(ext.name).toBe('Test Extractor');
    expect(ext.module).toBe('TEST');
    expect(ext.category).toBe('config');
  });

  describe('extract', () => {
    it('should call _extractMock in mock mode', async () => {
      const ext = new TestExtractor(context);
      const result = await ext.extract();
      expect(result).toEqual({ testData: [{ id: 1 }, { id: 2 }] });
    });

    it('should call _extractLive in live mode', async () => {
      context = new ExtractionContext({ mode: 'live' });
      const ext = new TestExtractor(context);
      const result = await ext.extract();
      expect(result).toEqual({ liveData: [{ id: 1 }] });
    });
  });

  describe('coverage', () => {
    it('should return expected tables', () => {
      const ext = new TestExtractor(context);
      const tables = ext.getExpectedTables();
      expect(tables).toHaveLength(1);
      expect(tables[0].table).toBe('ZTABLE1');
    });

    it('should track coverage via _trackCoverage', () => {
      const ext = new TestExtractor(context);
      ext._trackCoverage('ZTABLE1', 'extracted', { rowCount: 10 });
      const report = ext.getCoverageReport();
      expect(report.extracted).toBe(1);
      expect(report.coverage).toBe(100);
    });
  });

  describe('checkpoint', () => {
    it('should save and load checkpoints', async () => {
      const ext = new TestExtractor(context);
      await ext._saveCheckpoint('test_key', { data: 'value' });
      const loaded = await ext._loadCheckpoint('test_key');
      expect(loaded).toEqual({ data: 'value' });
      await ext._clearCheckpoints();
    });
  });
});
