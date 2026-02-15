const FoodBeveragePackage = require('../../../migration/industry/food-beverage');
const BaseIndustryPackage = require('../../../migration/industry/base-industry-package');

describe('FoodBeveragePackage', () => {
  let pkg;

  beforeEach(() => {
    pkg = new FoodBeveragePackage();
  });

  it('extends BaseIndustryPackage', () => {
    expect(pkg).toBeInstanceOf(BaseIndustryPackage);
  });

  it('has correct industryId', () => {
    expect(pkg.industryId).toBe('FOOD_BEVERAGE');
  });

  it('has name and description', () => {
    expect(pkg.name).toBe('Food & Beverage');
    expect(pkg.description.length).toBeGreaterThan(0);
  });

  describe('compliance requirements', () => {
    it('returns non-empty array', () => {
      expect(pkg.getComplianceRequirements().length).toBeGreaterThan(0);
    });

    it('includes FDA FSMA compliance', () => {
      const reqs = pkg.getComplianceRequirements();
      const fsma = reqs.find(r => r.name.includes('FSMA'));
      expect(fsma).toBeDefined();
      expect(fsma.priority).toBe('critical');
    });

    it('includes HACCP compliance', () => {
      const reqs = pkg.getComplianceRequirements();
      const haccp = reqs.find(r => r.name.includes('HACCP'));
      expect(haccp).toBeDefined();
      expect(haccp.priority).toBe('critical');
    });

    it('includes GFSI compliance', () => {
      const reqs = pkg.getComplianceRequirements();
      const gfsi = reqs.find(r => r.name.includes('GFSI'));
      expect(gfsi).toBeDefined();
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

    it('includes catch weight gap', () => {
      const gaps = pkg.getGapAnalysis();
      const cw = gaps.find(g => g.name.includes('Catch Weight'));
      expect(cw).toBeDefined();
      expect(cw.effort).toBe('high');
    });

    it('includes grower accounting gap', () => {
      const gaps = pkg.getGapAnalysis();
      const grower = gaps.find(g => g.name.includes('Grower'));
      expect(grower).toBeDefined();
      expect(grower.effort).toBe('high');
    });

    it('includes allergen management gap', () => {
      const gaps = pkg.getGapAnalysis();
      const allergen = gaps.find(g => g.name.includes('Allergen'));
      expect(allergen).toBeDefined();
    });

    it('includes shelf life gap', () => {
      const gaps = pkg.getGapAnalysis();
      const shelf = gaps.find(g => g.name.includes('Shelf Life'));
      expect(shelf).toBeDefined();
    });

    it('includes lot traceability gap', () => {
      const gaps = pkg.getGapAnalysis();
      const lot = gaps.find(g => g.name.includes('Lot Traceability'));
      expect(lot).toBeDefined();
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

    it('includes catch weight material conversion', () => {
      const transforms = pkg.getVerticalTransforms();
      const cw = transforms.find(t => t.name.includes('Catch Weight'));
      expect(cw).toBeDefined();
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
      expect(result.industryId).toBe('FOOD_BEVERAGE');
      expect(result.compliance.length).toBeGreaterThan(0);
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.transforms.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
