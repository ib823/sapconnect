/**
 * Tests for Security Tier Configuration
 */
const {
  SECURITY_TIERS,
  OPERATION_TIERS,
  getTierByLevel,
  getTierByName,
  getOperationsForTier,
} = require('../../../lib/security/tier-config');

describe('SECURITY_TIERS', () => {
  it('should define exactly 4 tiers', () => {
    expect(Object.keys(SECURITY_TIERS)).toHaveLength(4);
  });

  it('should have levels 1-4', () => {
    expect(SECURITY_TIERS.ASSESSMENT.level).toBe(1);
    expect(SECURITY_TIERS.DEVELOPMENT.level).toBe(2);
    expect(SECURITY_TIERS.STAGING.level).toBe(3);
    expect(SECURITY_TIERS.PRODUCTION.level).toBe(4);
  });

  it('should not require approval for tiers 1 and 2', () => {
    expect(SECURITY_TIERS.ASSESSMENT.requiresApproval).toBe(false);
    expect(SECURITY_TIERS.DEVELOPMENT.requiresApproval).toBe(false);
  });

  it('should require approval for tiers 3 and 4', () => {
    expect(SECURITY_TIERS.STAGING.requiresApproval).toBe(true);
    expect(SECURITY_TIERS.PRODUCTION.requiresApproval).toBe(true);
  });

  it('should require 0 approvers for tiers 1-2', () => {
    expect(SECURITY_TIERS.ASSESSMENT.approvers).toBe(0);
    expect(SECURITY_TIERS.DEVELOPMENT.approvers).toBe(0);
  });

  it('should require 1 approver for tier 3', () => {
    expect(SECURITY_TIERS.STAGING.approvers).toBe(1);
  });

  it('should require 2 approvers for tier 4', () => {
    expect(SECURITY_TIERS.PRODUCTION.approvers).toBe(2);
  });

  it('should have label and description for every tier', () => {
    for (const tier of Object.values(SECURITY_TIERS)) {
      expect(typeof tier.label).toBe('string');
      expect(tier.label.length).toBeGreaterThan(0);
      expect(typeof tier.description).toBe('string');
      expect(tier.description.length).toBeGreaterThan(0);
    }
  });
});

describe('OPERATION_TIERS', () => {
  it('should map all operations to valid tiers (1-4)', () => {
    for (const [op, tier] of Object.entries(OPERATION_TIERS)) {
      expect(tier).toBeGreaterThanOrEqual(1);
      expect(tier).toBeLessThanOrEqual(4);
    }
  });

  it('should have read-only extraction operations at tier 1', () => {
    expect(OPERATION_TIERS['extraction.run']).toBe(1);
    expect(OPERATION_TIERS['extraction.export']).toBe(1);
  });

  it('should have transform/validate at tier 2', () => {
    expect(OPERATION_TIERS['migration.transform']).toBe(2);
    expect(OPERATION_TIERS['migration.validate']).toBe(2);
  });

  it('should have staging operations at tier 3', () => {
    expect(OPERATION_TIERS['migration.load_staging']).toBe(3);
    expect(OPERATION_TIERS['transport.release']).toBe(3);
  });

  it('should have production operations at tier 4', () => {
    expect(OPERATION_TIERS['migration.load_production']).toBe(4);
    expect(OPERATION_TIERS['transport.import']).toBe(4);
  });

  it('should use dot-notation for all keys', () => {
    for (const op of Object.keys(OPERATION_TIERS)) {
      expect(op).toMatch(/^[a-z_0-9]+\.[a-z_0-9]+$/);
    }
  });
});

describe('getTierByLevel', () => {
  it('should return correct tier for level 1', () => {
    const tier = getTierByLevel(1);
    expect(tier.label).toBe('Assessment');
    expect(tier.level).toBe(1);
  });

  it('should return correct tier for level 4', () => {
    const tier = getTierByLevel(4);
    expect(tier.label).toBe('Production');
    expect(tier.level).toBe(4);
  });

  it('should return null for invalid level', () => {
    expect(getTierByLevel(5)).toBeNull();
    expect(getTierByLevel(0)).toBeNull();
  });
});

describe('getTierByName', () => {
  it('should return correct tier by name', () => {
    const tier = getTierByName('STAGING');
    expect(tier.level).toBe(3);
    expect(tier.label).toBe('Staging');
  });

  it('should return null for unknown name', () => {
    expect(getTierByName('UNKNOWN')).toBeNull();
  });
});

describe('getOperationsForTier', () => {
  it('should return tier 1 operations', () => {
    const ops = getOperationsForTier(1);
    expect(ops).toContain('extraction.run');
    expect(ops).toContain('migration.analyze');
    expect(ops).not.toContain('migration.transform');
  });

  it('should return tier 4 operations', () => {
    const ops = getOperationsForTier(4);
    expect(ops).toContain('migration.load_production');
    expect(ops).toContain('transport.import');
    expect(ops).not.toContain('extraction.run');
  });

  it('should return empty array for non-existent tier', () => {
    expect(getOperationsForTier(99)).toEqual([]);
  });
});
