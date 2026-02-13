const { AuditLogger, AUDIT_EVENTS } = require('../../../lib/security/audit-logger');

describe('AuditLogger', () => {
  let logger;

  beforeEach(() => { logger = new AuditLogger({ store: 'memory' }); });

  describe('log', () => {
    it('creates an audit entry', () => {
      const entry = logger.log(AUDIT_EVENTS.API_ACCESS, {
        actor: 'user1',
        ip: '1.2.3.4',
        resource: 'GET /api/dashboard/summary',
        action: 'GET',
      });
      expect(entry.id).toMatch(/^aud-/);
      expect(entry.timestamp).toBeDefined();
      expect(entry.event).toBe('api.access');
      expect(entry.actor).toBe('user1');
    });

    it('defaults actor to system', () => {
      const entry = logger.log(AUDIT_EVENTS.CONFIG_CHANGE);
      expect(entry.actor).toBe('system');
    });

    it('caps entries at maxEntries', () => {
      const small = new AuditLogger({ store: 'memory', maxEntries: 5 });
      for (let i = 0; i < 10; i++) {
        small.log(AUDIT_EVENTS.API_ACCESS, { actor: `user${i}` });
      }
      expect(small.query().total).toBe(5);
    });
  });

  describe('query', () => {
    beforeEach(() => {
      logger.log(AUDIT_EVENTS.AUTH_SUCCESS, { actor: 'admin', outcome: 'success' });
      logger.log(AUDIT_EVENTS.AUTH_FAILURE, { actor: 'hacker', outcome: 'failure' });
      logger.log(AUDIT_EVENTS.API_ACCESS, { actor: 'admin', outcome: 'success' });
      logger.log(AUDIT_EVENTS.MIGRATION_START, { actor: 'system', outcome: 'success' });
    });

    it('returns all entries without filter', () => {
      expect(logger.query().total).toBe(4);
    });

    it('filters by event', () => {
      const result = logger.query({ event: AUDIT_EVENTS.AUTH_SUCCESS });
      expect(result.total).toBe(1);
    });

    it('filters by actor', () => {
      const result = logger.query({ actor: 'admin' });
      expect(result.total).toBe(2);
    });

    it('filters by outcome', () => {
      const result = logger.query({ outcome: 'failure' });
      expect(result.total).toBe(1);
    });

    it('supports limit and offset', () => {
      const result = logger.query({ limit: 2, offset: 1 });
      expect(result.entries).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    it('returns stats breakdown', () => {
      logger.log(AUDIT_EVENTS.AUTH_SUCCESS, { actor: 'admin', outcome: 'success' });
      logger.log(AUDIT_EVENTS.AUTH_FAILURE, { actor: 'user', outcome: 'failure' });

      const stats = logger.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.byOutcome.success).toBe(1);
      expect(stats.byOutcome.failure).toBe(1);
      expect(stats.byEvent[AUDIT_EVENTS.AUTH_SUCCESS]).toBe(1);
    });
  });

  describe('middleware', () => {
    it('returns a function', () => {
      expect(typeof logger.middleware()).toBe('function');
    });

    it('logs on response finish', () => {
      const mw = logger.middleware();
      let finishHandler;
      const req = { method: 'GET', path: '/test', ip: '1.2.3.4', get: () => 'test-agent', user: null };
      const res = {
        statusCode: 200,
        on: (event, handler) => { if (event === 'finish') finishHandler = handler; },
        get: () => '42',
      };
      const next = vi.fn();

      mw(req, res, next);
      expect(next).toHaveBeenCalled();

      finishHandler();
      expect(logger.query().total).toBe(1);
    });
  });

  describe('AUDIT_EVENTS', () => {
    it('has all expected events', () => {
      expect(AUDIT_EVENTS.AUTH_SUCCESS).toBe('auth.success');
      expect(AUDIT_EVENTS.AUTH_FAILURE).toBe('auth.failure');
      expect(AUDIT_EVENTS.MIGRATION_START).toBe('migration.start');
      expect(AUDIT_EVENTS.RATE_LIMIT_HIT).toBe('security.rate_limit');
      expect(AUDIT_EVENTS.VALIDATION_FAIL).toBe('security.validation_fail');
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      logger.log(AUDIT_EVENTS.API_ACCESS);
      logger.clear();
      expect(logger.query().total).toBe(0);
    });
  });
});
