/**
 * Tests for PersistenceAdapter — in-memory mode.
 */

const { PersistenceAdapter } = require('../../lib/persistence');

describe('PersistenceAdapter (memory)', () => {
  let store;

  beforeEach(() => {
    store = new PersistenceAdapter({ mode: 'memory' });
  });

  it('should default to memory mode', () => {
    const s = new PersistenceAdapter();
    expect(s.mode).toBe('memory');
  });

  // ── Extraction Runs ─────────────────────────────────────────

  describe('saveRun / getRun', () => {
    it('should save and retrieve a run', async () => {
      const run = await store.saveRun({
        runId: 'run-1',
        status: 'running',
        mode: 'mock',
        startedAt: '2026-01-01T00:00:00Z',
        extractorCount: 10,
      });
      expect(run.ID).toBeDefined();
      expect(run.runId).toBe('run-1');
      expect(run.status).toBe('running');

      const loaded = await store.getRun('run-1');
      expect(loaded).toBeDefined();
      expect(loaded.runId).toBe('run-1');
      expect(loaded.extractorCount).toBe(10);
    });

    it('should return null for non-existent run', async () => {
      const loaded = await store.getRun('non-existent');
      expect(loaded).toBeNull();
    });

    it('should update existing run', async () => {
      await store.saveRun({ runId: 'run-1', status: 'running' });
      await store.saveRun({ runId: 'run-1', status: 'complete', confidence: 87.5, grade: 'B+' });

      const loaded = await store.getRun('run-1');
      expect(loaded.status).toBe('complete');
      expect(loaded.confidence).toBe(87.5);
      expect(loaded.grade).toBe('B+');
    });

    it('should serialize metadata object to JSON', async () => {
      await store.saveRun({ runId: 'run-1', metadata: { source: 'api', user: 'admin' } });
      const loaded = await store.getRun('run-1');
      const meta = JSON.parse(loaded.metadata);
      expect(meta.source).toBe('api');
    });
  });

  describe('listRuns', () => {
    it('should list runs newest first', async () => {
      await store.saveRun({ runId: 'run-1', createdAt: '2026-01-01T00:00:00Z' });
      await store.saveRun({ runId: 'run-2', createdAt: '2026-01-02T00:00:00Z' });
      await store.saveRun({ runId: 'run-3', createdAt: '2026-01-03T00:00:00Z' });

      const runs = await store.listRuns();
      expect(runs).toHaveLength(3);
      expect(runs[0].runId).toBe('run-3');
    });

    it('should respect limit', async () => {
      await store.saveRun({ runId: 'run-1' });
      await store.saveRun({ runId: 'run-2' });
      await store.saveRun({ runId: 'run-3' });

      const runs = await store.listRuns(2);
      expect(runs).toHaveLength(2);
    });

    it('should return empty array when no runs', async () => {
      const runs = await store.listRuns();
      expect(runs).toEqual([]);
    });
  });

  // ── Extraction Results ──────────────────────────────────────

  describe('saveResult / getResults / getResult', () => {
    it('should save and retrieve results for a run', async () => {
      await store.saveResult('run-1', {
        extractorId: 'CUSTOM_CODE',
        status: 'complete',
        recordCount: 150,
        data: { stats: { totalCustom: 150 } },
      });
      await store.saveResult('run-1', {
        extractorId: 'SECURITY',
        status: 'complete',
        recordCount: 20,
      });

      const results = await store.getResults('run-1');
      expect(results).toHaveLength(2);
    });

    it('should get a specific result', async () => {
      await store.saveResult('run-1', {
        extractorId: 'CUSTOM_CODE',
        status: 'complete',
        recordCount: 150,
      });

      const result = await store.getResult('run-1', 'CUSTOM_CODE');
      expect(result).toBeDefined();
      expect(result.extractorId).toBe('CUSTOM_CODE');
      expect(result.recordCount).toBe(150);
    });

    it('should return null for non-existent result', async () => {
      const result = await store.getResult('run-1', 'NON_EXISTENT');
      expect(result).toBeNull();
    });

    it('should serialize data to JSON', async () => {
      await store.saveResult('run-1', {
        extractorId: 'TEST',
        data: { findings: [{ id: 1, severity: 'high' }] },
      });

      const result = await store.getResult('run-1', 'TEST');
      const data = JSON.parse(result.data);
      expect(data.findings).toHaveLength(1);
    });

    it('should not mix results from different runs', async () => {
      await store.saveResult('run-1', { extractorId: 'A' });
      await store.saveResult('run-2', { extractorId: 'B' });

      const results1 = await store.getResults('run-1');
      expect(results1).toHaveLength(1);
      expect(results1[0].extractorId).toBe('A');
    });
  });

  // ── Checkpoints ─────────────────────────────────────────────

  describe('saveCheckpoint / loadCheckpoint', () => {
    it('should save and load a checkpoint', async () => {
      await store.saveCheckpoint('run-1', 'CUSTOM_CODE', {
        offset: 1000,
        lastTable: 'TADIR',
        processedTables: ['TRDIR', 'TADIR'],
      });

      const cp = await store.loadCheckpoint('run-1', 'CUSTOM_CODE');
      expect(cp).toBeDefined();
      expect(cp.offset).toBe(1000);
      expect(cp.lastTable).toBe('TADIR');
      expect(cp.processedTables).toEqual(['TRDIR', 'TADIR']);
    });

    it('should return null for non-existent checkpoint', async () => {
      const cp = await store.loadCheckpoint('run-1', 'MISSING');
      expect(cp).toBeNull();
    });

    it('should update checkpoint on re-save', async () => {
      await store.saveCheckpoint('run-1', 'EXT', { offset: 100 });
      await store.saveCheckpoint('run-1', 'EXT', { offset: 500 });

      const cp = await store.loadCheckpoint('run-1', 'EXT');
      expect(cp.offset).toBe(500);
    });

    it('should handle complex checkpoint data', async () => {
      const state = {
        offset: 0,
        tables: ['T1', 'T2'],
        errors: [],
        nested: { deep: { value: 42 } },
      };
      await store.saveCheckpoint('run-1', 'EXT', state);
      const cp = await store.loadCheckpoint('run-1', 'EXT');
      expect(cp).toEqual(state);
    });
  });

  describe('consumeCheckpoint', () => {
    it('should mark checkpoint as non-resumable', async () => {
      await store.saveCheckpoint('run-1', 'EXT', { offset: 100 });
      await store.consumeCheckpoint('run-1', 'EXT');

      const cp = await store.loadCheckpoint('run-1', 'EXT');
      expect(cp).toBeNull();
    });

    it('should handle consuming non-existent checkpoint', async () => {
      // Should not throw
      await store.consumeCheckpoint('run-1', 'MISSING');
    });
  });

  // ── Migration Runs ──────────────────────────────────────────

  describe('saveMigrationRun / getMigrationRun', () => {
    it('should save and retrieve a migration run', async () => {
      await store.saveMigrationRun({
        runId: 'mig-1',
        status: 'running',
        objectCount: 42,
      });

      const run = await store.getMigrationRun('mig-1');
      expect(run).toBeDefined();
      expect(run.objectCount).toBe(42);
    });

    it('should return null for non-existent migration run', async () => {
      const run = await store.getMigrationRun('non-existent');
      expect(run).toBeNull();
    });
  });

  // ── End-to-end: Extraction lifecycle ────────────────────────

  describe('extraction lifecycle', () => {
    it('should support full create → run → checkpoint → complete flow', async () => {
      // 1. Create run
      await store.saveRun({ runId: 'lifecycle-1', status: 'running', startedAt: new Date().toISOString() });

      // 2. Start extractor, save checkpoint mid-way
      await store.saveResult('lifecycle-1', { extractorId: 'EXT_A', status: 'running' });
      await store.saveCheckpoint('lifecycle-1', 'EXT_A', { offset: 500 });

      // 3. Resume from checkpoint
      const cp = await store.loadCheckpoint('lifecycle-1', 'EXT_A');
      expect(cp.offset).toBe(500);

      // 4. Complete extractor
      await store.saveResult('lifecycle-1', { extractorId: 'EXT_A', status: 'complete', recordCount: 1000 });
      await store.consumeCheckpoint('lifecycle-1', 'EXT_A');

      // 5. Complete run
      await store.saveRun({ runId: 'lifecycle-1', status: 'complete', confidence: 92, grade: 'A' });

      // 6. Verify final state
      const run = await store.getRun('lifecycle-1');
      expect(run.status).toBe('complete');
      expect(run.grade).toBe('A');

      const results = await store.getResults('lifecycle-1');
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('complete');

      // Checkpoint consumed
      const cpAfter = await store.loadCheckpoint('lifecycle-1', 'EXT_A');
      expect(cpAfter).toBeNull();
    });
  });
});
