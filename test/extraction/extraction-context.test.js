/**
 * Tests for ExtractionContext
 */

const ExtractionContext = require('../../extraction/extraction-context');

describe('ExtractionContext', () => {
  describe('default construction', () => {
    let ctx;

    beforeEach(() => {
      ctx = new ExtractionContext();
    });

    it('should default mode to "mock"', () => {
      expect(ctx.mode).toBe('mock');
    });

    it('should default rfc to null', () => {
      expect(ctx.rfc).toBeNull();
    });

    it('should default odata to null', () => {
      expect(ctx.odata).toBeNull();
    });

    it('should default systemInfo to ECC/600/100', () => {
      expect(ctx.system).toEqual({ type: 'ECC', release: '600', client: '100' });
    });

    it('should default dataDictionary to null', () => {
      expect(ctx.dataDictionary).toBeNull();
    });

    it('should instantiate a CheckpointManager', () => {
      const cp = ctx.checkpoint;
      expect(cp).toBeDefined();
      expect(typeof cp.save).toBe('function');
      expect(typeof cp.load).toBe('function');
      expect(typeof cp.clear).toBe('function');
    });

    it('should instantiate a CoverageTracker', () => {
      const cov = ctx.coverage;
      expect(cov).toBeDefined();
      expect(typeof cov.track).toBe('function');
      expect(typeof cov.getReport).toBe('function');
    });
  });

  describe('custom construction', () => {
    it('should accept custom rfcPool', () => {
      const mockPool = { call: vi.fn() };
      const ctx = new ExtractionContext({ rfcPool: mockPool });
      expect(ctx.rfc).toBe(mockPool);
    });

    it('should accept custom odataClient', () => {
      const mockClient = { get: vi.fn() };
      const ctx = new ExtractionContext({ odataClient: mockClient });
      expect(ctx.odata).toBe(mockClient);
    });

    it('should accept mode "live"', () => {
      const ctx = new ExtractionContext({ mode: 'live' });
      expect(ctx.mode).toBe('live');
    });

    it('should accept custom systemInfo', () => {
      const info = { type: 'S4', release: '2023', client: '200' };
      const ctx = new ExtractionContext({ systemInfo: info });
      expect(ctx.system).toEqual(info);
    });

    it('should accept custom checkpointDir', () => {
      const ctx = new ExtractionContext({ checkpointDir: '/tmp/test-checkpoints' });
      expect(ctx.checkpoint).toBeDefined();
      expect(ctx.checkpoint.storageDir).toContain('test-checkpoints');
    });

    it('should accept all options together', () => {
      const mockPool = { call: vi.fn() };
      const mockClient = { get: vi.fn() };
      const info = { type: 'S4', release: '2023', client: '300' };
      const ctx = new ExtractionContext({
        rfcPool: mockPool,
        odataClient: mockClient,
        mode: 'live',
        systemInfo: info,
        checkpointDir: '/tmp/all-opts',
      });
      expect(ctx.rfc).toBe(mockPool);
      expect(ctx.odata).toBe(mockClient);
      expect(ctx.mode).toBe('live');
      expect(ctx.system).toEqual(info);
    });
  });

  describe('getters', () => {
    it('rfc getter returns the rfcPool', () => {
      const pool = { invoke: vi.fn() };
      const ctx = new ExtractionContext({ rfcPool: pool });
      expect(ctx.rfc).toBe(pool);
    });

    it('odata getter returns the odataClient', () => {
      const client = { request: vi.fn() };
      const ctx = new ExtractionContext({ odataClient: client });
      expect(ctx.odata).toBe(client);
    });

    it('mode getter returns the configured mode', () => {
      const ctx = new ExtractionContext({ mode: 'live' });
      expect(ctx.mode).toBe('live');
    });

    it('system getter returns systemInfo', () => {
      const ctx = new ExtractionContext();
      expect(ctx.system).toHaveProperty('type');
      expect(ctx.system).toHaveProperty('release');
      expect(ctx.system).toHaveProperty('client');
    });

    it('checkpoint getter always returns the same instance', () => {
      const ctx = new ExtractionContext();
      const cp1 = ctx.checkpoint;
      const cp2 = ctx.checkpoint;
      expect(cp1).toBe(cp2);
    });

    it('coverage getter always returns the same instance', () => {
      const ctx = new ExtractionContext();
      const cov1 = ctx.coverage;
      const cov2 = ctx.coverage;
      expect(cov1).toBe(cov2);
    });
  });

  describe('setters', () => {
    it('system setter updates systemInfo', () => {
      const ctx = new ExtractionContext();
      expect(ctx.system.type).toBe('ECC');
      const newInfo = { type: 'S4HANA', release: '2025', client: '500' };
      ctx.system = newInfo;
      expect(ctx.system).toEqual(newInfo);
    });

    it('dataDictionary setter updates dataDictionary', () => {
      const ctx = new ExtractionContext();
      expect(ctx.dataDictionary).toBeNull();
      const dd = { tables: ['T001', 'MARA'], domains: {} };
      ctx.dataDictionary = dd;
      expect(ctx.dataDictionary).toBe(dd);
    });

    it('dataDictionary can be set to null', () => {
      const ctx = new ExtractionContext();
      ctx.dataDictionary = { tables: [] };
      expect(ctx.dataDictionary).not.toBeNull();
      ctx.dataDictionary = null;
      expect(ctx.dataDictionary).toBeNull();
    });
  });

  describe('CheckpointManager integration', () => {
    it('checkpoint has save, load, and clear methods', () => {
      const ctx = new ExtractionContext();
      expect(typeof ctx.checkpoint.save).toBe('function');
      expect(typeof ctx.checkpoint.load).toBe('function');
      expect(typeof ctx.checkpoint.clear).toBe('function');
    });

    it('checkpoint has exists and clearAll methods', () => {
      const ctx = new ExtractionContext();
      expect(typeof ctx.checkpoint.exists).toBe('function');
      expect(typeof ctx.checkpoint.clearAll).toBe('function');
    });

    it('checkpoint has getProgress method', () => {
      const ctx = new ExtractionContext();
      expect(typeof ctx.checkpoint.getProgress).toBe('function');
    });
  });

  describe('CoverageTracker integration', () => {
    it('coverage has track and getReport methods', () => {
      const ctx = new ExtractionContext();
      expect(typeof ctx.coverage.track).toBe('function');
      expect(typeof ctx.coverage.getReport).toBe('function');
    });

    it('coverage has getModuleReport and getSystemReport methods', () => {
      const ctx = new ExtractionContext();
      expect(typeof ctx.coverage.getModuleReport).toBe('function');
      expect(typeof ctx.coverage.getSystemReport).toBe('function');
    });

    it('coverage has getGaps and toJSON methods', () => {
      const ctx = new ExtractionContext();
      expect(typeof ctx.coverage.getGaps).toBe('function');
      expect(typeof ctx.coverage.toJSON).toBe('function');
    });

    it('coverage can track and report', () => {
      const ctx = new ExtractionContext();
      ctx.coverage.track('TEST_EXT', 'TABLE1', 'extracted', { rowCount: 50 });
      const report = ctx.coverage.getReport('TEST_EXT');
      expect(report.extracted).toBe(1);
      expect(report.total).toBe(1);
      expect(report.coverage).toBe(100);
    });
  });
});
