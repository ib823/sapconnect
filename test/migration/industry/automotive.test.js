const AutomotivePackage = require('../../../migration/industry/automotive');
const BaseIndustryPackage = require('../../../migration/industry/base-industry-package');

describe('AutomotivePackage', () => {
  let pkg;

  beforeEach(() => {
    pkg = new AutomotivePackage();
  });

  it('extends BaseIndustryPackage', () => {
    expect(pkg).toBeInstanceOf(BaseIndustryPackage);
  });

  it('has correct industryId', () => {
    expect(pkg.industryId).toBe('AUTOMOTIVE');
  });

  it('has name and description', () => {
    expect(pkg.name).toBe('Automotive');
    expect(pkg.description.length).toBeGreaterThan(0);
  });

  describe('compliance requirements', () => {
    it('returns non-empty array', () => {
      const reqs = pkg.getComplianceRequirements();
      expect(reqs.length).toBeGreaterThan(0);
    });

    it('includes VDA EDI standards', () => {
      const reqs = pkg.getComplianceRequirements();
      const vda = reqs.find(r => r.name.includes('VDA'));
      expect(vda).toBeDefined();
      expect(vda.regulation).toContain('VDA');
    });

    it('includes Odette standards', () => {
      const reqs = pkg.getComplianceRequirements();
      const odette = reqs.find(r => r.name.includes('Odette'));
      expect(odette).toBeDefined();
    });

    it('includes AIAG standards', () => {
      const reqs = pkg.getComplianceRequirements();
      const aiag = reqs.find(r => r.name.includes('AIAG'));
      expect(aiag).toBeDefined();
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

    it('includes JIT/JIS gap', () => {
      const gaps = pkg.getGapAnalysis();
      const jit = gaps.find(g => g.name.includes('JIT'));
      expect(jit).toBeDefined();
      expect(jit.effort).toBe('high');
    });

    it('includes MMOG/LE gap', () => {
      const gaps = pkg.getGapAnalysis();
      const mmog = gaps.find(g => g.name.includes('MMOG'));
      expect(mmog).toBeDefined();
    });

    it('includes container management gap', () => {
      const gaps = pkg.getGapAnalysis();
      const container = gaps.find(g => g.name.includes('Container'));
      expect(container).toBeDefined();
    });

    it('includes ASN gap', () => {
      const gaps = pkg.getGapAnalysis();
      const asn = gaps.find(g => g.name.includes('Shipping Notification'));
      expect(asn).toBeDefined();
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

    it('includes EDI partner profile mapping', () => {
      const transforms = pkg.getVerticalTransforms();
      const edi = transforms.find(t => t.name.includes('EDI'));
      expect(edi).toBeDefined();
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
      expect(result.industryId).toBe('AUTOMOTIVE');
      expect(result.compliance.length).toBeGreaterThan(0);
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.transforms.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
