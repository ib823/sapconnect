/**
 * Tests for Extractor Registry
 */
import { describe, it, expect, beforeEach } from 'vitest';

const ExtractorRegistry = require('../../extraction/extractor-registry');
const BaseExtractor = require('../../extraction/base-extractor');
const ExtractionContext = require('../../extraction/extraction-context');

class FIConfigExtractor extends BaseExtractor {
  get extractorId() { return 'FI_CONFIG'; }
  get name() { return 'FI Configuration'; }
  get module() { return 'FI'; }
  get category() { return 'config'; }
  async _extractMock() { return { tables: { T001: [{ BUKRS: '1000' }] } }; }
}
FIConfigExtractor._extractorId = 'FI_CONFIG';
FIConfigExtractor._module = 'FI';
FIConfigExtractor._category = 'config';

class COConfigExtractor extends BaseExtractor {
  get extractorId() { return 'CO_CONFIG'; }
  get name() { return 'CO Configuration'; }
  get module() { return 'CO'; }
  get category() { return 'config'; }
  async _extractMock() { return { tables: { TKA01: [{ KOKRS: '1000' }] } }; }
}
COConfigExtractor._extractorId = 'CO_CONFIG';
COConfigExtractor._module = 'CO';
COConfigExtractor._category = 'config';

class SystemInfoExtractor extends BaseExtractor {
  get extractorId() { return 'SYSTEM_INFO'; }
  get name() { return 'System Info'; }
  get module() { return 'BASIS'; }
  get category() { return 'metadata'; }
  async _extractMock() { return { sid: 'TST', release: '750' }; }
}
SystemInfoExtractor._extractorId = 'SYSTEM_INFO';
SystemInfoExtractor._module = 'BASIS';
SystemInfoExtractor._category = 'metadata';

describe('ExtractorRegistry', () => {
  beforeEach(() => {
    ExtractorRegistry.clear();
  });

  describe('register/get', () => {
    it('should register and retrieve extractors', () => {
      ExtractorRegistry.register(FIConfigExtractor);
      expect(ExtractorRegistry.get('FI_CONFIG')).toBe(FIConfigExtractor);
    });

    it('should return null for unknown extractor', () => {
      expect(ExtractorRegistry.get('UNKNOWN')).toBeNull();
    });
  });

  describe('getByModule', () => {
    it('should return extractors for a module', () => {
      ExtractorRegistry.register(FIConfigExtractor);
      ExtractorRegistry.register(COConfigExtractor);
      const fi = ExtractorRegistry.getByModule('FI');
      expect(fi).toHaveLength(1);
    });
  });

  describe('getByCategory', () => {
    it('should return extractors by category', () => {
      ExtractorRegistry.register(FIConfigExtractor);
      ExtractorRegistry.register(SystemInfoExtractor);
      const meta = ExtractorRegistry.getByCategory('metadata');
      expect(meta).toHaveLength(1);
    });
  });

  describe('getAll', () => {
    it('should return all registered extractors', () => {
      ExtractorRegistry.register(FIConfigExtractor);
      ExtractorRegistry.register(COConfigExtractor);
      expect(ExtractorRegistry.getAll()).toHaveLength(2);
    });
  });

  describe('runAll', () => {
    it('should run all extractors and return results', async () => {
      ExtractorRegistry.register(FIConfigExtractor);
      ExtractorRegistry.register(COConfigExtractor);
      ExtractorRegistry.register(SystemInfoExtractor);

      const context = new ExtractionContext({ mode: 'mock' });
      const results = await ExtractorRegistry.runAll(context, { concurrency: 2 });

      expect(results.size).toBe(3);
      expect(results.get('FI_CONFIG')).toEqual({ tables: { T001: [{ BUKRS: '1000' }] } });
      expect(results.get('SYSTEM_INFO')).toEqual({ sid: 'TST', release: '750' });
    });

    it('should filter by modules', async () => {
      ExtractorRegistry.register(FIConfigExtractor);
      ExtractorRegistry.register(COConfigExtractor);

      const context = new ExtractionContext({ mode: 'mock' });
      const results = await ExtractorRegistry.runAll(context, { modules: ['FI'] });

      expect(results.size).toBe(1);
      expect(results.has('FI_CONFIG')).toBe(true);
    });
  });
});
