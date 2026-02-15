const PublicSectorPackage = require('../../../migration/industry/public-sector');
const BaseIndustryPackage = require('../../../migration/industry/base-industry-package');

describe('PublicSectorPackage', () => {
  let pkg;

  beforeEach(() => {
    pkg = new PublicSectorPackage();
  });

  it('extends BaseIndustryPackage', () => {
    expect(pkg).toBeInstanceOf(BaseIndustryPackage);
  });

  it('has correct industryId', () => {
    expect(pkg.industryId).toBe('PUBLIC_SECTOR');
  });

  it('has name and description', () => {
    expect(pkg.name).toBe('Public Sector');
    expect(pkg.description.length).toBeGreaterThan(0);
  });

  describe('compliance requirements', () => {
    it('returns non-empty array', () => {
      expect(pkg.getComplianceRequirements().length).toBeGreaterThan(0);
    });

    it('includes FedRAMP compliance', () => {
      const reqs = pkg.getComplianceRequirements();
      const fedramp = reqs.find(r => r.name.includes('FedRAMP'));
      expect(fedramp).toBeDefined();
      expect(fedramp.priority).toBe('critical');
    });

    it('includes GASB reporting', () => {
      const reqs = pkg.getComplianceRequirements();
      const gasb = reqs.find(r => r.name.includes('GASB'));
      expect(gasb).toBeDefined();
      expect(gasb.priority).toBe('critical');
    });

    it('includes Uniform Guidance', () => {
      const reqs = pkg.getComplianceRequirements();
      const ug = reqs.find(r => r.name.includes('Uniform Guidance'));
      expect(ug).toBeDefined();
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

    it('includes community development gap', () => {
      const gaps = pkg.getGapAnalysis();
      const cd = gaps.find(g => g.name.includes('Community Development'));
      expect(cd).toBeDefined();
      expect(cd.effort).toBe('high');
    });

    it('includes grant management gap', () => {
      const gaps = pkg.getGapAnalysis();
      const grant = gaps.find(g => g.name.includes('Grant Management'));
      expect(grant).toBeDefined();
    });

    it('includes fund accounting gap', () => {
      const gaps = pkg.getGapAnalysis();
      const fund = gaps.find(g => g.name.includes('Fund Accounting'));
      expect(fund).toBeDefined();
    });

    it('includes encumbrance accounting gap', () => {
      const gaps = pkg.getGapAnalysis();
      const enc = gaps.find(g => g.name.includes('Encumbrance'));
      expect(enc).toBeDefined();
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

    it('includes fund code mapping', () => {
      const transforms = pkg.getVerticalTransforms();
      const fund = transforms.find(t => t.name.includes('Fund Code'));
      expect(fund).toBeDefined();
    });

    it('includes grant award conversion', () => {
      const transforms = pkg.getVerticalTransforms();
      const grant = transforms.find(t => t.name.includes('Grant'));
      expect(grant).toBeDefined();
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
      expect(result.industryId).toBe('PUBLIC_SECTOR');
      expect(result.compliance.length).toBeGreaterThan(0);
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.transforms.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
