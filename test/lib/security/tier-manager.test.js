/**
 * Tests for Security Tier Manager
 */
const { TierManager } = require('../../../lib/security/tier-manager');

describe('TierManager', () => {
  let manager;

  beforeEach(() => {
    manager = new TierManager();
  });

  describe('constructor', () => {
    it('should default to tier 4 for unknown operations', () => {
      expect(manager.defaultTier).toBe(4);
    });

    it('should accept custom default tier', () => {
      const m = new TierManager({ defaultTier: 2 });
      expect(m.defaultTier).toBe(2);
    });
  });

  describe('getTier', () => {
    it('should return correct tier for known operations', () => {
      expect(manager.getTier('extraction.run')).toBe(1);
      expect(manager.getTier('migration.transform')).toBe(2);
      expect(manager.getTier('migration.load_staging')).toBe(3);
      expect(manager.getTier('migration.load_production')).toBe(4);
    });

    it('should return default tier for unknown operations', () => {
      expect(manager.getTier('unknown.operation')).toBe(4);
    });

    it('should return default tier for null/undefined', () => {
      expect(manager.getTier(null)).toBe(4);
      expect(manager.getTier(undefined)).toBe(4);
    });

    it('should return default tier for non-string input', () => {
      expect(manager.getTier(123)).toBe(4);
    });
  });

  describe('getTierDefinition', () => {
    it('should return full tier definition', () => {
      const def = manager.getTierDefinition('extraction.run');
      expect(def.level).toBe(1);
      expect(def.label).toBe('Assessment');
      expect(def.requiresApproval).toBe(false);
    });

    it('should return Production tier for unknown operations', () => {
      const def = manager.getTierDefinition('unknown.op');
      expect(def.level).toBe(4);
      expect(def.label).toBe('Production');
    });
  });

  describe('checkPermission', () => {
    it('should allow when user maxTier >= operation tier', () => {
      const result = manager.checkPermission('extraction.run', { maxTier: 1 });
      expect(result.allowed).toBe(true);
      expect(result.tier).toBe(1);
      expect(result.reason).toBe('Permission granted');
    });

    it('should deny when user maxTier < operation tier', () => {
      const result = manager.checkPermission('migration.load_production', { maxTier: 2 });
      expect(result.allowed).toBe(false);
      expect(result.tier).toBe(4);
      expect(result.reason).toContain('requires tier 4');
    });

    it('should deny tier 4 without admin/production role', () => {
      const result = manager.checkPermission('transport.import', {
        maxTier: 4,
        roles: ['developer'],
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('admin');
    });

    it('should allow tier 4 with admin role', () => {
      const result = manager.checkPermission('transport.import', {
        maxTier: 4,
        roles: ['admin'],
      });
      expect(result.allowed).toBe(true);
    });

    it('should allow tier 4 with production role', () => {
      const result = manager.checkPermission('transport.import', {
        maxTier: 4,
        roles: ['production'],
      });
      expect(result.allowed).toBe(true);
    });

    it('should default maxTier to 1 when not provided', () => {
      const result = manager.checkPermission('migration.transform', {});
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('tier 2');
    });

    it('should include tier label in result', () => {
      const result = manager.checkPermission('migration.load_staging', { maxTier: 3 });
      expect(result.tierLabel).toBe('Staging');
    });
  });

  describe('requiresApproval', () => {
    it('should return false for tier 1 operations', () => {
      expect(manager.requiresApproval('extraction.run')).toBe(false);
    });

    it('should return false for tier 2 operations', () => {
      expect(manager.requiresApproval('migration.transform')).toBe(false);
    });

    it('should return true for tier 3 operations', () => {
      expect(manager.requiresApproval('migration.load_staging')).toBe(true);
    });

    it('should return true for tier 4 operations', () => {
      expect(manager.requiresApproval('migration.load_production')).toBe(true);
    });
  });

  describe('getRequiredApprovers', () => {
    it('should return 0 for tier 1', () => {
      expect(manager.getRequiredApprovers('extraction.run')).toBe(0);
    });

    it('should return 0 for tier 2', () => {
      expect(manager.getRequiredApprovers('migration.transform')).toBe(0);
    });

    it('should return 1 for tier 3', () => {
      expect(manager.getRequiredApprovers('migration.load_staging')).toBe(1);
    });

    it('should return 2 for tier 4', () => {
      expect(manager.getRequiredApprovers('migration.load_production')).toBe(2);
    });
  });

  describe('listOperationsByTier', () => {
    it('should return operations grouped by tier', () => {
      const grouped = manager.listOperationsByTier();
      expect(grouped[1]).toContain('extraction.run');
      expect(grouped[2]).toContain('migration.transform');
      expect(grouped[3]).toContain('migration.load_staging');
      expect(grouped[4]).toContain('migration.load_production');
    });

    it('should have all 4 tiers', () => {
      const grouped = manager.listOperationsByTier();
      expect(Object.keys(grouped)).toEqual(['1', '2', '3', '4']);
    });
  });

  describe('classify', () => {
    it('should return full classification', () => {
      const c = manager.classify('transport.import');
      expect(c.operation).toBe('transport.import');
      expect(c.tier).toBe(4);
      expect(c.label).toBe('Production');
      expect(c.requiresApproval).toBe(true);
      expect(c.requiredApprovers).toBe(2);
    });

    it('should classify unknown operations as tier 4', () => {
      const c = manager.classify('custom.unknown');
      expect(c.tier).toBe(4);
      expect(c.requiresApproval).toBe(true);
    });
  });
});
