const DistributionPackage = require('../../../migration/industry/distribution');
const BaseIndustryPackage = require('../../../migration/industry/base-industry-package');

describe('DistributionPackage', () => {
  let pkg;

  beforeEach(() => {
    pkg = new DistributionPackage();
  });

  it('extends BaseIndustryPackage', () => {
    expect(pkg).toBeInstanceOf(BaseIndustryPackage);
  });

  it('has correct industryId', () => {
    expect(pkg.industryId).toBe('DISTRIBUTION');
  });

  it('has name and description', () => {
    expect(pkg.name).toBe('Distribution');
    expect(pkg.description.length).toBeGreaterThan(0);
  });

  describe('compliance requirements', () => {
    it('returns non-empty array', () => {
      expect(pkg.getComplianceRequirements().length).toBeGreaterThan(0);
    });

    it('includes DSCSA compliance', () => {
      const reqs = pkg.getComplianceRequirements();
      const dscsa = reqs.find(r => r.name.includes('DSCSA'));
      expect(dscsa).toBeDefined();
      expect(dscsa.priority).toBe('critical');
    });

    it('all have required fields', () => {
      for (const req of pkg.getComplianceRequirements()) {
        expect(req).toHaveProperty('id');
        expect(req).toHaveProperty('name');
        expect(req).toHaveProperty('description');
        expect(req).toHaveProperty('regulation');
        expect(req).toHaveProperty('sapSolution');
        expect(req).toHaveProperty('priority');
      }
    });

    it('has unique IDs', () => {
      const ids = pkg.getComplianceRequirements().map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('gap analysis', () => {
    it('returns non-empty array', () => {
      expect(pkg.getGapAnalysis().length).toBeGreaterThan(0);
    });

    it('includes WMS migration gap', () => {
      const gaps = pkg.getGapAnalysis();
      const wms = gaps.find(g => g.name.includes('WMS'));
      expect(wms).toBeDefined();
      expect(wms.effort).toBe('high');
    });

    it('includes cross-docking gap', () => {
      const gaps = pkg.getGapAnalysis();
      const xdock = gaps.find(g => g.name.includes('Cross-Docking'));
      expect(xdock).toBeDefined();
    });

    it('includes wave management gap', () => {
      const gaps = pkg.getGapAnalysis();
      const wave = gaps.find(g => g.name.includes('Wave'));
      expect(wave).toBeDefined();
    });

    it('includes VMI gap', () => {
      const gaps = pkg.getGapAnalysis();
      const vmi = gaps.find(g => g.name.includes('Vendor-Managed'));
      expect(vmi).toBeDefined();
    });

    it('includes pick/pack/ship gap', () => {
      const gaps = pkg.getGapAnalysis();
      const pps = gaps.find(g => g.name.includes('Pick/Pack/Ship'));
      expect(pps).toBeDefined();
    });

    it('all have required fields', () => {
      for (const gap of pkg.getGapAnalysis()) {
        expect(gap).toHaveProperty('id');
        expect(gap).toHaveProperty('name');
        expect(gap).toHaveProperty('description');
        expect(gap).toHaveProperty('inforCapability');
        expect(gap).toHaveProperty('sapGap');
        expect(gap).toHaveProperty('mitigation');
        expect(gap).toHaveProperty('effort');
      }
    });

    it('has unique IDs', () => {
      const ids = pkg.getGapAnalysis().map(g => g.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('vertical transforms', () => {
    it('returns non-empty array', () => {
      expect(pkg.getVerticalTransforms().length).toBeGreaterThan(0);
    });

    it('includes warehouse layout conversion', () => {
      const transforms = pkg.getVerticalTransforms();
      const wh = transforms.find(t => t.name.includes('Warehouse Layout'));
      expect(wh).toBeDefined();
    });

    it('includes lot/serial master conversion', () => {
      const transforms = pkg.getVerticalTransforms();
      const lot = transforms.find(t => t.name.includes('Lot/Serial'));
      expect(lot).toBeDefined();
    });

    it('all have required fields', () => {
      for (const tx of pkg.getVerticalTransforms()) {
        expect(tx).toHaveProperty('id');
        expect(tx).toHaveProperty('name');
        expect(tx).toHaveProperty('sourceField');
        expect(tx).toHaveProperty('targetField');
        expect(tx).toHaveProperty('transformLogic');
        expect(tx).toHaveProperty('description');
      }
    });
  });

  describe('analyze()', () => {
    it('returns full analysis structure', () => {
      const result = pkg.analyze();
      expect(result.industryId).toBe('DISTRIBUTION');
      expect(result.compliance.length).toBeGreaterThan(0);
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.transforms.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
