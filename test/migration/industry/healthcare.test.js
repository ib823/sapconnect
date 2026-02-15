const HealthcarePackage = require('../../../migration/industry/healthcare');
const BaseIndustryPackage = require('../../../migration/industry/base-industry-package');

describe('HealthcarePackage', () => {
  let pkg;

  beforeEach(() => {
    pkg = new HealthcarePackage();
  });

  it('extends BaseIndustryPackage', () => {
    expect(pkg).toBeInstanceOf(BaseIndustryPackage);
  });

  it('has correct industryId', () => {
    expect(pkg.industryId).toBe('HEALTHCARE');
  });

  it('has name and description', () => {
    expect(pkg.name).toBe('Healthcare');
    expect(pkg.description.length).toBeGreaterThan(0);
  });

  describe('compliance requirements', () => {
    it('returns non-empty array', () => {
      expect(pkg.getComplianceRequirements().length).toBeGreaterThan(0);
    });

    it('includes HIPAA compliance', () => {
      const reqs = pkg.getComplianceRequirements();
      const hipaa = reqs.find(r => r.name.includes('HIPAA'));
      expect(hipaa).toBeDefined();
      expect(hipaa.priority).toBe('critical');
      expect(hipaa.regulation).toContain('HIPAA');
    });

    it('includes FDA UDI requirements', () => {
      const reqs = pkg.getComplianceRequirements();
      const udi = reqs.find(r => r.name.includes('UDI'));
      expect(udi).toBeDefined();
      expect(udi.priority).toBe('critical');
    });

    it('includes 340B drug pricing', () => {
      const reqs = pkg.getComplianceRequirements();
      const drug = reqs.find(r => r.name.includes('340B'));
      expect(drug).toBeDefined();
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

    it('includes physician preference cards gap', () => {
      const gaps = pkg.getGapAnalysis();
      const ppc = gaps.find(g => g.name.includes('Physician Preference'));
      expect(ppc).toBeDefined();
      expect(ppc.effort).toBe('high');
    });

    it('includes 340B drug pricing gap', () => {
      const gaps = pkg.getGapAnalysis();
      const drug = gaps.find(g => g.name.includes('340B'));
      expect(drug).toBeDefined();
      expect(drug.effort).toBe('high');
    });

    it('includes clinical supply chain gap', () => {
      const gaps = pkg.getGapAnalysis();
      const clinical = gaps.find(g => g.name.includes('Clinical Supply'));
      expect(clinical).toBeDefined();
    });

    it('includes implant traceability gap', () => {
      const gaps = pkg.getGapAnalysis();
      const implant = gaps.find(g => g.name.includes('Implant'));
      expect(implant).toBeDefined();
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

    it('includes UDI data mapping', () => {
      const transforms = pkg.getVerticalTransforms();
      const udi = transforms.find(t => t.name.includes('UDI'));
      expect(udi).toBeDefined();
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
      expect(result.industryId).toBe('HEALTHCARE');
      expect(result.compliance.length).toBeGreaterThan(0);
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.transforms.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
