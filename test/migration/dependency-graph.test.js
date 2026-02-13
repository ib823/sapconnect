const { DependencyGraph, DEPENDENCIES } = require('../../migration/dependency-graph');

describe('DependencyGraph', () => {
  let graph;

  beforeEach(() => { graph = new DependencyGraph(); });

  describe('getDependencies', () => {
    it('returns direct dependencies', () => {
      const deps = graph.getDependencies('GL_BALANCE');
      expect(deps).toContain('GL_ACCOUNT_MASTER');
    });

    it('returns empty for root objects', () => {
      expect(graph.getDependencies('BANK_MASTER')).toEqual([]);
      expect(graph.getDependencies('PROFIT_CENTER')).toEqual([]);
    });

    it('returns empty for unknown objects', () => {
      expect(graph.getDependencies('NONEXISTENT')).toEqual([]);
    });
  });

  describe('getTransitiveDependencies', () => {
    it('finds transitive dependencies', () => {
      const deps = graph.getTransitiveDependencies('CUSTOMER_OPEN_ITEM');
      expect(deps).toContain('BUSINESS_PARTNER');
      expect(deps).toContain('BANK_MASTER');
    });

    it('handles objects with no dependencies', () => {
      expect(graph.getTransitiveDependencies('BANK_MASTER')).toEqual([]);
    });
  });

  describe('getExecutionOrder', () => {
    it('orders dependencies before dependents', () => {
      const order = graph.getExecutionOrder(['GL_BALANCE', 'GL_ACCOUNT_MASTER']);
      expect(order.indexOf('GL_ACCOUNT_MASTER')).toBeLessThan(order.indexOf('GL_BALANCE'));
    });

    it('orders all 42 objects without error', () => {
      const allIds = Object.keys(DEPENDENCIES);
      const order = graph.getExecutionOrder(allIds);
      expect(order.length).toBe(allIds.length);
    });

    it('places BANK_MASTER before BUSINESS_PARTNER', () => {
      const order = graph.getExecutionOrder(['BUSINESS_PARTNER', 'BANK_MASTER']);
      expect(order.indexOf('BANK_MASTER')).toBeLessThan(order.indexOf('BUSINESS_PARTNER'));
    });

    it('handles subset of objects', () => {
      const order = graph.getExecutionOrder(['SALES_ORDER', 'MATERIAL_MASTER']);
      expect(order[0]).toBe('MATERIAL_MASTER');
    });
  });

  describe('getExecutionWaves', () => {
    it('groups independent objects in waves', () => {
      const waves = graph.getExecutionWaves(['GL_ACCOUNT_MASTER', 'BANK_MASTER', 'PROFIT_CENTER', 'GL_BALANCE']);
      expect(waves.length).toBeGreaterThanOrEqual(2);
      // First wave should contain root objects
      expect(waves[0]).toContain('GL_ACCOUNT_MASTER');
      expect(waves[0]).toContain('BANK_MASTER');
      expect(waves[0]).toContain('PROFIT_CENTER');
    });

    it('puts dependent objects in later waves', () => {
      const waves = graph.getExecutionWaves(['GL_BALANCE', 'GL_ACCOUNT_MASTER']);
      const firstWaveHasBalance = waves[0].includes('GL_BALANCE');
      const firstWaveHasMaster = waves[0].includes('GL_ACCOUNT_MASTER');
      expect(firstWaveHasMaster).toBe(true);
      expect(firstWaveHasBalance).toBe(false);
    });
  });

  describe('detectCircularDependencies', () => {
    it('finds no circles in default graph', () => {
      const circles = graph.detectCircularDependencies();
      expect(circles).toHaveLength(0);
    });

    it('detects added circular dependency', () => {
      graph.setDependencies('A', ['B']);
      graph.setDependencies('B', ['A']);
      const circles = graph.detectCircularDependencies();
      expect(circles.length).toBeGreaterThan(0);
    });
  });

  describe('validate', () => {
    it('validates all dependencies exist', () => {
      const allIds = Object.keys(DEPENDENCIES);
      const result = graph.validate(allIds);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('reports missing dependencies', () => {
      const result = graph.validate(['GL_BALANCE']);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('DEPENDENCIES', () => {
    it('covers all expected objects', () => {
      const ids = Object.keys(DEPENDENCIES);
      expect(ids.length).toBeGreaterThanOrEqual(30);
      expect(ids).toContain('GL_BALANCE');
      expect(ids).toContain('BUSINESS_PARTNER');
      expect(ids).toContain('MATERIAL_MASTER');
      expect(ids).toContain('SALES_ORDER');
      expect(ids).toContain('PURCHASE_ORDER');
    });
  });
});
