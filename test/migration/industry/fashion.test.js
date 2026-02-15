const FashionPackage = require('../../../migration/industry/fashion');
const BaseIndustryPackage = require('../../../migration/industry/base-industry-package');

describe('FashionPackage', () => {
  let pkg;

  beforeEach(() => {
    pkg = new FashionPackage();
  });

  it('extends BaseIndustryPackage', () => {
    expect(pkg).toBeInstanceOf(BaseIndustryPackage);
  });

  it('has correct industryId', () => {
    expect(pkg.industryId).toBe('FASHION');
  });

  it('has name and description', () => {
    expect(pkg.name).toBe('Fashion & Apparel');
    expect(pkg.description.length).toBeGreaterThan(0);
  });

  describe('compliance requirements', () => {
    it('returns non-empty array', () => {
      expect(pkg.getComplianceRequirements().length).toBeGreaterThan(0);
    });

    it('includes CPSIA product safety', () => {
      const reqs = pkg.getComplianceRequirements();
      const cpsia = reqs.find(r => r.name.includes('CPSIA'));
      expect(cpsia).toBeDefined();
    });

    it('includes customs compliance', () => {
      const reqs = pkg.getComplianceRequirements();
      const customs = reqs.find(r => r.name.includes('Customs'));
      expect(customs).toBeDefined();
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

    it('includes style-color-size variant configuration gap', () => {
      const gaps = pkg.getGapAnalysis();
      const scs = gaps.find(g => g.name.includes('Style-Color-Size'));
      expect(scs).toBeDefined();
      expect(scs.effort).toBe('high');
    });

    it('includes royalty management gap', () => {
      const gaps = pkg.getGapAnalysis();
      const royalty = gaps.find(g => g.name.includes('Royalty'));
      expect(royalty).toBeDefined();
      expect(royalty.effort).toBe('high');
    });

    it('includes season/collection management gap', () => {
      const gaps = pkg.getGapAnalysis();
      const season = gaps.find(g => g.name.includes('Season'));
      expect(season).toBeDefined();
    });

    it('includes size scale mapping gap', () => {
      const gaps = pkg.getGapAnalysis();
      const size = gaps.find(g => g.name.includes('Size Scale'));
      expect(size).toBeDefined();
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

    it('includes style-color-size matrix conversion', () => {
      const transforms = pkg.getVerticalTransforms();
      const scs = transforms.find(t => t.name.includes('Style-Color-Size'));
      expect(scs).toBeDefined();
    });

    it('includes size scale conversion', () => {
      const transforms = pkg.getVerticalTransforms();
      const size = transforms.find(t => t.name.includes('Size Scale'));
      expect(size).toBeDefined();
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
      expect(result.industryId).toBe('FASHION');
      expect(result.compliance.length).toBeGreaterThan(0);
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.transforms.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
