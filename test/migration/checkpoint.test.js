const { CheckpointManager } = require('../../migration/checkpoint');
const fs = require('fs');
const path = require('path');

describe('CheckpointManager', () => {
  let mgr;
  const testDir = path.join(process.cwd(), '.test-checkpoints-' + Date.now());

  beforeEach(() => {
    mgr = new CheckpointManager({ checkpointDir: testDir });
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testDir)) {
      fs.readdirSync(testDir).forEach(f => fs.unlinkSync(path.join(testDir, f)));
      fs.rmdirSync(testDir);
    }
  });

  describe('save', () => {
    it('creates a checkpoint file', () => {
      const cp = mgr.save('run-001', {
        completedObjects: ['GL_BALANCE'],
        failedObjects: [],
        pendingObjects: ['BUSINESS_PARTNER'],
        results: [{ objectId: 'GL_BALANCE', status: 'completed' }],
        startedAt: new Date().toISOString(),
      });
      expect(cp.runId).toBe('run-001');
      expect(cp.version).toBe(1);
      expect(cp.state.completedObjects).toContain('GL_BALANCE');
    });
  });

  describe('load', () => {
    it('loads a saved checkpoint', () => {
      mgr.save('run-002', { completedObjects: ['A'], pendingObjects: ['B'], failedObjects: [], results: [] });
      const loaded = mgr.load('run-002');
      expect(loaded.runId).toBe('run-002');
      expect(loaded.state.completedObjects).toContain('A');
    });

    it('returns null for non-existent checkpoint', () => {
      expect(mgr.load('nonexistent')).toBeNull();
    });
  });

  describe('remove', () => {
    it('removes a checkpoint', () => {
      mgr.save('run-003', { completedObjects: [], pendingObjects: [], failedObjects: [], results: [] });
      expect(mgr.remove('run-003')).toBe(true);
      expect(mgr.load('run-003')).toBeNull();
    });

    it('returns false for non-existent', () => {
      expect(mgr.remove('nonexistent')).toBe(false);
    });
  });

  describe('list', () => {
    it('lists all checkpoints', () => {
      mgr.save('run-a', { completedObjects: ['X'], pendingObjects: ['Y'], failedObjects: [], results: [] });
      mgr.save('run-b', { completedObjects: [], pendingObjects: ['Z'], failedObjects: [], results: [] });
      const list = mgr.list();
      expect(list).toHaveLength(2);
      expect(list[0]).toHaveProperty('runId');
      expect(list[0]).toHaveProperty('completed');
      expect(list[0]).toHaveProperty('pending');
    });

    it('returns empty when no checkpoints', () => {
      // Use a fresh dir
      const emptyMgr = new CheckpointManager({ checkpointDir: testDir + '-empty' });
      const list = emptyMgr.list();
      expect(list).toHaveLength(0);
      if (fs.existsSync(testDir + '-empty')) fs.rmdirSync(testDir + '-empty');
    });
  });

  describe('cleanup', () => {
    it('removes old checkpoints', () => {
      mgr.save('old-run', { completedObjects: [], pendingObjects: [], failedObjects: [], results: [] });
      // Backdate the file
      const filePath = path.join(testDir, 'old-run.checkpoint.json');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      data.timestamp = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      fs.writeFileSync(filePath, JSON.stringify(data));

      const removed = mgr.cleanup(30);
      expect(removed).toBe(1);
    });
  });
});
