/**
 * Tests for selective migration features in DependencyGraph.
 */

const { DependencyGraph, DEPENDENCIES } = require('../../migration/dependency-graph');

describe('Selective Migration', () => {
  let graph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  describe('selectSubset', () => {
    it('should include transitive dependencies', () => {
      // SALES_ORDER depends on BUSINESS_PARTNER, MATERIAL_MASTER, PRICING_CONDITION
      // BUSINESS_PARTNER depends on BANK_MASTER
      // PRICING_CONDITION depends on MATERIAL_MASTER
      const subset = graph.selectSubset(['SALES_ORDER']);
      expect(subset).toContain('SALES_ORDER');
      expect(subset).toContain('BUSINESS_PARTNER');
      expect(subset).toContain('MATERIAL_MASTER');
      expect(subset).toContain('PRICING_CONDITION');
      expect(subset).toContain('BANK_MASTER');
    });

    it('should respect execution order (dependencies first)', () => {
      const subset = graph.selectSubset(['SALES_ORDER']);
      const salesIdx = subset.indexOf('SALES_ORDER');
      const bpIdx = subset.indexOf('BUSINESS_PARTNER');
      const matIdx = subset.indexOf('MATERIAL_MASTER');
      expect(bpIdx).toBeLessThan(salesIdx);
      expect(matIdx).toBeLessThan(salesIdx);
    });

    it('should handle objects with no dependencies', () => {
      const subset = graph.selectSubset(['GL_ACCOUNT_MASTER']);
      expect(subset).toEqual(['GL_ACCOUNT_MASTER']);
    });

    it('should deduplicate shared dependencies', () => {
      // Both PURCHASE_ORDER and SALES_ORDER depend on BUSINESS_PARTNER and MATERIAL_MASTER
      const subset = graph.selectSubset(['PURCHASE_ORDER', 'SALES_ORDER']);
      const bpCount = subset.filter(id => id === 'BUSINESS_PARTNER').length;
      expect(bpCount).toBe(1);
    });

    it('should handle multiple selections', () => {
      const subset = graph.selectSubset(['GL_BALANCE', 'FIXED_ASSET']);
      expect(subset).toContain('GL_BALANCE');
      expect(subset).toContain('GL_ACCOUNT_MASTER');
      expect(subset).toContain('FIXED_ASSET');
      expect(subset).toContain('COST_CENTER');
      expect(subset).toContain('PROFIT_CENTER');
    });
  });

  describe('selectModule', () => {
    it('should select all FI objects with dependencies', () => {
      const fiObjects = graph.selectModule('FI');
      expect(fiObjects).toContain('GL_ACCOUNT_MASTER');
      expect(fiObjects).toContain('GL_BALANCE');
      expect(fiObjects).toContain('FI_CONFIG');
      // Should also pull in BP dependency
      expect(fiObjects).toContain('BUSINESS_PARTNER');
      expect(fiObjects).toContain('BANK_MASTER');
    });

    it('should select MM objects with cross-module dependencies', () => {
      const mmObjects = graph.selectModule('MM');
      expect(mmObjects).toContain('MATERIAL_MASTER');
      expect(mmObjects).toContain('PURCHASE_ORDER');
      // Cross-module: PO depends on BP
      expect(mmObjects).toContain('BUSINESS_PARTNER');
    });

    it('should select SD objects', () => {
      const sdObjects = graph.selectModule('SD');
      expect(sdObjects).toContain('SALES_ORDER');
      expect(sdObjects).toContain('PRICING_CONDITION');
    });

    it('should handle module with no objects', () => {
      const empty = graph.selectModule('ZZ');
      expect(empty).toEqual([]);
    });
  });

  describe('getImpact', () => {
    it('should find all objects that depend on MATERIAL_MASTER', () => {
      const impact = graph.getImpact('MATERIAL_MASTER');
      expect(impact).toContain('PURCHASE_ORDER');
      expect(impact).toContain('SALES_ORDER');
      expect(impact).toContain('BATCH_MASTER');
      expect(impact).toContain('SOURCE_LIST');
      expect(impact).toContain('PRICING_CONDITION');
      expect(impact).toContain('BOM_ROUTING');
      expect(impact).toContain('PRODUCTION_ORDER');
    });

    it('should find transitive dependents', () => {
      // PROFIT_CENTER → COST_CENTER → FIXED_ASSET → ASSET_ACQUISITION
      const impact = graph.getImpact('PROFIT_CENTER');
      expect(impact).toContain('COST_CENTER');
      expect(impact).toContain('FIXED_ASSET');
      expect(impact).toContain('ASSET_ACQUISITION');
    });

    it('should return empty for leaf objects', () => {
      const impact = graph.getImpact('ASSET_ACQUISITION');
      expect(impact).toEqual([]);
    });

    it('should find BANK_MASTER impact chain', () => {
      const impact = graph.getImpact('BANK_MASTER');
      expect(impact).toContain('BUSINESS_PARTNER');
      // Transitive: anything depending on BP
      expect(impact).toContain('EMPLOYEE_MASTER');
      expect(impact).toContain('PURCHASE_ORDER');
    });
  });

  describe('getStats', () => {
    it('should return graph statistics', () => {
      const stats = graph.getStats();
      expect(stats.totalNodes).toBeGreaterThan(30);
      expect(stats.totalEdges).toBeGreaterThan(20);
      expect(stats.roots.length).toBeGreaterThan(5);
      expect(stats.leaves.length).toBeGreaterThan(5);
      expect(stats.cycles).toBe(0);
    });

    it('should identify root nodes (no dependencies)', () => {
      const stats = graph.getStats();
      expect(stats.roots).toContain('GL_ACCOUNT_MASTER');
      expect(stats.roots).toContain('MATERIAL_MASTER');
      expect(stats.roots).toContain('PROFIT_CENTER');
      expect(stats.roots).toContain('BANK_MASTER');
    });
  });
});
