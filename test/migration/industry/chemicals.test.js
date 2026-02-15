const ChemicalsPackage = require('../../../migration/industry/chemicals');
const BaseIndustryPackage = require('../../../migration/industry/base-industry-package');

describe('ChemicalsPackage', () => {
  let pkg;

  beforeEach(() => {
    pkg = new ChemicalsPackage();
  });

  it('extends BaseIndustryPackage', () => {
    expect(pkg).toBeInstanceOf(BaseIndustryPackage);
  });

  it('has correct industryId', () => {
    expect(pkg.industryId).toBe('CHEMICALS');
  });

  it('has name and description', () => {
    expect(pkg.name).toBe('Chemicals');
    expect(pkg.description.length).toBeGreaterThan(0);
  });

  describe('compliance requirements', () => {
    it('returns non-empty array', () => {
      expect(pkg.getComplianceRequirements().length).toBeGreaterThan(0);
    });

    it('includes REACH compliance', () => {
      const reqs = pkg.getComplianceRequirements();
      const reach = reqs.find(r => r.name.includes('REACH'));
      expect(reach).toBeDefined();
      expect(reach.priority).toBe('critical');
      expect(reach.regulation).toContain('REACH');
    });

    it('includes GHS classification', () => {
      const reqs = pkg.getComplianceRequirements();
      const ghs = reqs.find(r => r.name.includes('GHS'));
      expect(ghs).toBeDefined();
      expect(ghs.priority).toBe('critical');
    });

    it('includes TSCA compliance', () => {
      const reqs = pkg.getComplianceRequirements();
      const tsca = reqs.find(r => r.name.includes('TSCA'));
      expect(tsca).toBeDefined();
    });

    it('includes hazmat transport', () => {
      const reqs = pkg.getComplianceRequirements();
      const haz = reqs.find(r => r.name.includes('Hazardous Material'));
      expect(haz).toBeDefined();
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

    it('includes EHS as SAP advantage', () => {
      const gaps = pkg.getGapAnalysis();
      const ehs = gaps.find(g => g.name.includes('EHS'));
      expect(ehs).toBeDefined();
      expect(ehs.effort).toBe('low');
      expect(ehs.sapGap).toContain('No gap');
    });

    it('includes SDS authoring', () => {
      const gaps = pkg.getGapAnalysis();
      const sds = gaps.find(g => g.name.includes('SDS'));
      expect(sds).toBeDefined();
    });

    it('includes batch genealogy', () => {
      const gaps = pkg.getGapAnalysis();
      const batch = gaps.find(g => g.name.includes('Batch Genealogy'));
      expect(batch).toBeDefined();
    });

    it('includes formula management', () => {
      const gaps = pkg.getGapAnalysis();
      const formula = gaps.find(g => g.name.includes('Formula'));
      expect(formula).toBeDefined();
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

    it('includes substance master conversion', () => {
      const transforms = pkg.getVerticalTransforms();
      const sub = transforms.find(t => t.name.includes('Substance'));
      expect(sub).toBeDefined();
    });

    it('includes GHS classification mapping', () => {
      const transforms = pkg.getVerticalTransforms();
      const ghs = transforms.find(t => t.name.includes('GHS'));
      expect(ghs).toBeDefined();
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
      expect(result.industryId).toBe('CHEMICALS');
      expect(result.compliance.length).toBeGreaterThan(0);
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.transforms.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
