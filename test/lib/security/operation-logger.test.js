/**
 * Tests for Operation Logger
 */
const { OperationLogger } = require('../../../lib/security/operation-logger');

describe('OperationLogger', () => {
  let logger;

  beforeEach(() => {
    logger = new OperationLogger();
  });

  afterEach(() => {
    logger.clear();
  });

  describe('constructor', () => {
    it('should initialize with defaults', () => {
      expect(logger.auditLogger).toBeDefined();
      expect(logger.tierManager).toBeDefined();
      expect(logger.logger).toBeDefined();
    });
  });

  describe('logOperation', () => {
    it('should create a log entry', () => {
      const entry = logger.logOperation('extraction.run', 1, 'user1', { scope: 'full' }, { status: 'success', durationMs: 150 });
      expect(entry.id).toMatch(/^opl-/);
      expect(entry.operation).toBe('extraction.run');
      expect(entry.tier).toBe(1);
      expect(entry.tierLabel).toBe('Assessment');
      expect(entry.user).toBe('user1');
      expect(entry.details).toEqual({ scope: 'full' });
      expect(entry.result.status).toBe('success');
      expect(entry.result.durationMs).toBe(150);
      expect(entry.timestamp).toBeDefined();
    });

    it('should default result status to success', () => {
      const entry = logger.logOperation('extraction.run', 1, 'user1');
      expect(entry.result.status).toBe('success');
    });

    it('should record failure results', () => {
      const entry = logger.logOperation('migration.load_production', 4, 'admin', {}, {
        status: 'failure',
        error: 'Connection timeout',
        durationMs: 30000,
      });
      expect(entry.result.status).toBe('failure');
      expect(entry.result.error).toBe('Connection timeout');
    });

    it('should record approval ID from details', () => {
      const entry = logger.logOperation('migration.load_staging', 3, 'user1', { approvalId: 'apr-123' });
      expect(entry.approvalId).toBe('apr-123');
    });

    it('should forward tier 2+ entries to audit logger', () => {
      const spy = vi.spyOn(logger.auditLogger, 'log');
      logger.logOperation('migration.transform', 2, 'dev1');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should NOT forward tier 1 entries to audit logger', () => {
      const spy = vi.spyOn(logger.auditLogger, 'log');
      logger.logOperation('extraction.run', 1, 'user1');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should cap entries at maxEntries', () => {
      const small = new OperationLogger({ maxEntries: 3 });
      for (let i = 0; i < 10; i++) {
        small.logOperation('extraction.run', 1, `user${i}`);
      }
      const trail = small.getAuditTrail();
      expect(trail.total).toBe(3);
    });
  });

  describe('getAuditTrail', () => {
    beforeEach(() => {
      logger.logOperation('extraction.run', 1, 'user1', {}, { status: 'success' });
      logger.logOperation('migration.transform', 2, 'dev1', {}, { status: 'success' });
      logger.logOperation('migration.load_staging', 3, 'admin', {}, { status: 'success' });
      logger.logOperation('transport.import', 4, 'admin', {}, { status: 'failure', error: 'fail' });
    });

    it('should return all entries without filters', () => {
      const trail = logger.getAuditTrail();
      expect(trail.total).toBe(4);
      expect(trail.entries).toHaveLength(4);
    });

    it('should filter by operation', () => {
      const trail = logger.getAuditTrail({ operation: 'extraction.run' });
      expect(trail.total).toBe(1);
      expect(trail.entries[0].operation).toBe('extraction.run');
    });

    it('should filter by tier', () => {
      const trail = logger.getAuditTrail({ tier: 4 });
      expect(trail.total).toBe(1);
      expect(trail.entries[0].tier).toBe(4);
    });

    it('should filter by user', () => {
      const trail = logger.getAuditTrail({ user: 'admin' });
      expect(trail.total).toBe(2);
    });

    it('should filter by status', () => {
      const trail = logger.getAuditTrail({ status: 'failure' });
      expect(trail.total).toBe(1);
      expect(trail.entries[0].result.error).toBe('fail');
    });

    it('should support limit and offset', () => {
      const trail = logger.getAuditTrail({ limit: 2, offset: 1 });
      expect(trail.total).toBe(4);
      expect(trail.entries).toHaveLength(2);
      expect(trail.entries[0].tier).toBe(2); // second entry
    });
  });

  describe('getOperationHistory', () => {
    it('should return history for a specific operation', () => {
      logger.logOperation('extraction.run', 1, 'user1');
      logger.logOperation('extraction.run', 1, 'user2');
      logger.logOperation('migration.transform', 2, 'dev1');
      const history = logger.getOperationHistory('extraction.run');
      expect(history).toHaveLength(2);
      expect(history[0].operation).toBe('extraction.run');
      expect(history[1].operation).toBe('extraction.run');
    });

    it('should return empty array for unknown operation', () => {
      const history = logger.getOperationHistory('nonexistent.op');
      expect(history).toEqual([]);
    });

    it('should respect limit', () => {
      for (let i = 0; i < 10; i++) {
        logger.logOperation('extraction.run', 1, `user${i}`);
      }
      const history = logger.getOperationHistory('extraction.run', { limit: 3 });
      expect(history).toHaveLength(3);
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      logger.logOperation('extraction.run', 1, 'user1', {}, { status: 'success' });
      logger.logOperation('migration.transform', 2, 'dev1', {}, { status: 'success' });
      logger.logOperation('transport.import', 4, 'admin', {}, { status: 'failure' });
    });

    it('should return total entries', () => {
      const stats = logger.getStats();
      expect(stats.totalEntries).toBe(3);
    });

    it('should break down by tier', () => {
      const stats = logger.getStats();
      expect(stats.byTier[1]).toBe(1);
      expect(stats.byTier[2]).toBe(1);
      expect(stats.byTier[4]).toBe(1);
    });

    it('should break down by status', () => {
      const stats = logger.getStats();
      expect(stats.byStatus.success).toBe(2);
      expect(stats.byStatus.failure).toBe(1);
    });

    it('should break down by operation', () => {
      const stats = logger.getStats();
      expect(stats.byOperation['extraction.run']).toBe(1);
      expect(stats.byOperation['migration.transform']).toBe(1);
    });

    it('should break down by user', () => {
      const stats = logger.getStats();
      expect(stats.byUser['user1']).toBe(1);
      expect(stats.byUser['admin']).toBe(1);
    });

    it('should track oldest and newest timestamps', () => {
      const stats = logger.getStats();
      expect(stats.oldestEntry).toBeDefined();
      expect(stats.newestEntry).toBeDefined();
      expect(stats.oldestEntry <= stats.newestEntry).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      logger.logOperation('extraction.run', 1, 'user1');
      logger.clear();
      expect(logger.getAuditTrail().total).toBe(0);
    });
  });
});
