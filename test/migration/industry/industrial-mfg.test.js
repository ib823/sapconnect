const IndustrialMfgPackage = require('../../../migration/industry/industrial-mfg');
const BaseIndustryPackage = require('../../../migration/industry/base-industry-package');

describe('IndustrialMfgPackage', () => {
  let pkg;

  beforeEach(() => {
    pkg = new IndustrialMfgPackage();
  });

  it('extends BaseIndustryPackage', () => {
    expect(pkg).toBeInstanceOf(BaseIndustryPackage);
  });

  it('has correct industryId', () => {
    expect(pkg.industryId).toBe('INDUSTRIAL_MFG');
  });

  it('has name and description', () => {
    expect(pkg.name).toBe('Industrial Manufacturing');
    expect(pkg.description.length).toBeGreaterThan(0);
  });

  describe('compliance requirements', () => {
    it('returns non-empty array', () => {
      expect(pkg.getComplianceRequirements().length).toBeGreaterThan(0);
    });

    it('includes ISO 9001 quality', () => {
      const reqs = pkg.getComplianceRequirements();
      const iso = reqs.find(r => r.name.includes('ISO 9001'));
      expect(iso).toBeDefined();
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

    it('includes MES integration gap', () => {
      const gaps = pkg.getGapAnalysis();
      const mes = gaps.find(g => g.name.includes('MES'));
      expect(mes).toBeDefined();
      expect(mes.effort).toBe('high');
    });

    it('includes shop floor control gap', () => {
      const gaps = pkg.getGapAnalysis();
      const sf = gaps.find(g => g.name.includes('Shop Floor'));
      expect(sf).toBeDefined();
    });

    it('includes APS gap', () => {
      const gaps = pkg.getGapAnalysis();
      const aps = gaps.find(g => g.name.includes('Advanced Planning'));
      expect(aps).toBeDefined();
      expect(aps.effort).toBe('high');
    });

    it('includes tool management gap', () => {
      const gaps = pkg.getGapAnalysis();
      const tool = gaps.find(g => g.name.includes('Tool Management'));
      expect(tool).toBeDefined();
    });

    it('includes engineering change management gap', () => {
      const gaps = pkg.getGapAnalysis();
      const ecm = gaps.find(g => g.name.includes('Engineering Change'));
      expect(ecm).toBeDefined();
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

    it('includes work center conversion', () => {
      const transforms = pkg.getVerticalTransforms();
      const wc = transforms.find(t => t.name.includes('Work Center'));
      expect(wc).toBeDefined();
    });

    it('includes routing operation mapping', () => {
      const transforms = pkg.getVerticalTransforms();
      const routing = transforms.find(t => t.name.includes('Routing'));
      expect(routing).toBeDefined();
    });

    it('includes tool master conversion', () => {
      const transforms = pkg.getVerticalTransforms();
      const tool = transforms.find(t => t.name.includes('Tool'));
      expect(tool).toBeDefined();
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
      expect(result.industryId).toBe('INDUSTRIAL_MFG');
      expect(result.compliance.length).toBeGreaterThan(0);
      expect(result.gaps.length).toBeGreaterThan(0);
      expect(result.transforms.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });
});
