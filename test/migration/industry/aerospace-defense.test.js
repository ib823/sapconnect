const AerospaceDefensePackage = require('../../../migration/industry/aerospace-defense');
const BaseIndustryPackage = require('../../../migration/industry/base-industry-package');

describe('AerospaceDefensePackage', () => {
  let pkg;

  beforeEach(() => {
    pkg = new AerospaceDefensePackage();
  });

  it('extends BaseIndustryPackage', () => {
    expect(pkg).toBeInstanceOf(BaseIndustryPackage);
  });

  it('has correct industryId', () => {
    expect(pkg.industryId).toBe('AEROSPACE_DEFENSE');
  });

  it('has name and description', () => {
    expect(pkg.name).toBe('Aerospace & Defense');
    expect(pkg.description).toBeDefined();
    expect(pkg.description.length).toBeGreaterThan(0);
  });

  describe('compliance requirements', () => {
    it('returns non-empty array', () => {
      const reqs = pkg.getComplianceRequirements();
      expect(reqs.length).toBeGreaterThan(0);
    });

    it('includes ITAR compliance', () => {
      const reqs = pkg.getComplianceRequirements();
      const itar = reqs.find(r => r.name.includes('ITAR'));
      expect(itar).toBeDefined();
      expect(itar.priority).toBe('critical');
      expect(itar.regulation).toContain('ITAR');
    });

    it('includes EAR compliance', () => {
      const reqs = pkg.getComplianceRequirements();
      const ear = reqs.find(r => r.name.includes('EAR'));
      expect(ear).toBeDefined();
      expect(ear.regulation).toContain('EAR');
    });

    it('includes DFARS compliance', () => {
      const reqs = pkg.getComplianceRequirements();
      const dfars = reqs.find(r => r.name.includes('DFARS'));
      expect(dfars).toBeDefined();
      expect(dfars.priority).toBe('critical');
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
      const gaps = pkg.getGapAnalysis();
      expect(gaps.length).toBeGreaterThan(0);
    });

    it('includes MRO gap', () => {
      const gaps = pkg.getGapAnalysis();
      const mro = gaps.find(g => g.name.includes('MRO'));
      expect(mro).toBeDefined();
      expect(mro.effort).toBe('high');
    });

    it('includes BOM effectivity gap', () => {
      const gaps = pkg.getGapAnalysis();
      const bom = gaps.find(g => g.name.includes('BOM Effectivity'));
      expect(bom).toBeDefined();
    });

    it('includes CIS-GovCon gap', () => {
      const gaps = pkg.getGapAnalysis();
      const govcon = gaps.find(g => g.id === 'AD-GAP-003');
      expect(govcon).toBeDefined();
      expect(govcon.name).toContain('GovCon');
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
      const transforms = pkg.getVerticalTransforms();
      expect(transforms.length).toBeGreaterThan(0);
    });

    it('includes export control screening transform', () => {
      const transforms = pkg.getVerticalTransforms();
      const eccn = transforms.find(t => t.name.includes('ECCN'));
      expect(eccn).toBeDefined();
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
      expect(result.industryId).toBe('AEROSPACE_DEFENSE');
      expect(result.name).toBe('Aerospace & Defense');
      expect(result.compliance.length).toBeGreaterThan(0);
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.transforms.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
