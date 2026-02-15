const BaseIndustryPackage = require('../../../migration/industry/base-industry-package');

describe('BaseIndustryPackage', () => {
  it('throws on industryId access', () => {
    const base = new BaseIndustryPackage();
    expect(() => base.industryId).toThrow(/Subclass must implement/);
  });

  it('throws on name access', () => {
    const base = new BaseIndustryPackage();
    expect(() => base.name).toThrow(/Subclass must implement/);
  });

  it('throws on description access', () => {
    const base = new BaseIndustryPackage();
    expect(() => base.description).toThrow(/Subclass must implement/);
  });

  it('returns empty arrays from default methods', () => {
    const base = new BaseIndustryPackage();
    expect(base.getComplianceRequirements()).toEqual([]);
    expect(base.getGapAnalysis()).toEqual([]);
    expect(base.getVerticalTransforms()).toEqual([]);
    expect(base.getRecommendations()).toEqual([]);
  });

  describe('concrete subclass', () => {
    class TestPackage extends BaseIndustryPackage {
      get industryId() { return 'TEST'; }
      get name() { return 'Test Industry'; }
      get description() { return 'Test description'; }

      getComplianceRequirements() {
        return [{ id: 'T-001', name: 'Test Compliance', description: 'desc', regulation: 'REG', sapSolution: 'sol', priority: 'high' }];
      }

      getGapAnalysis() {
        return [{ id: 'T-GAP-001', name: 'Test Gap', description: 'desc', inforCapability: 'cap', sapGap: 'gap', mitigation: 'mit', effort: 'medium' }];
      }

      getVerticalTransforms() {
        return [{ id: 'T-TX-001', name: 'Test Transform', sourceField: 'SRC', targetField: 'TGT', transformLogic: 'logic', description: 'desc' }];
      }

      getRecommendations() {
        return [{ title: 'Test Rec', description: 'Do the thing' }];
      }
    }

    let pkg;

    beforeEach(() => {
      pkg = new TestPackage();
    });

    it('has industryId, name, description', () => {
      expect(pkg.industryId).toBe('TEST');
      expect(pkg.name).toBe('Test Industry');
      expect(pkg.description).toBe('Test description');
    });

    it('analyze() returns structured result', () => {
      const result = pkg.analyze();
      expect(result.industryId).toBe('TEST');
      expect(result.name).toBe('Test Industry');
      expect(result.compliance).toHaveLength(1);
      expect(result.gaps).toHaveLength(1);
      expect(result.transforms).toHaveLength(1);
      expect(result.recommendations).toHaveLength(1);
    });

    it('analyze() accepts extractionResults', () => {
      const result = pkg.analyze({ someData: true });
      expect(result.industryId).toBe('TEST');
    });

    it('compliance requirements have required shape', () => {
      const reqs = pkg.getComplianceRequirements();
      for (const req of reqs) {
        expect(req).toHaveProperty('id');
        expect(req).toHaveProperty('name');
        expect(req).toHaveProperty('description');
        expect(req).toHaveProperty('regulation');
        expect(req).toHaveProperty('sapSolution');
        expect(req).toHaveProperty('priority');
      }
    });

    it('gaps have required shape', () => {
      const gaps = pkg.getGapAnalysis();
      for (const gap of gaps) {
        expect(gap).toHaveProperty('id');
        expect(gap).toHaveProperty('name');
        expect(gap).toHaveProperty('description');
        expect(gap).toHaveProperty('inforCapability');
        expect(gap).toHaveProperty('sapGap');
        expect(gap).toHaveProperty('mitigation');
        expect(gap).toHaveProperty('effort');
      }
    });

    it('transforms have required shape', () => {
      const transforms = pkg.getVerticalTransforms();
      for (const tx of transforms) {
        expect(tx).toHaveProperty('id');
        expect(tx).toHaveProperty('name');
        expect(tx).toHaveProperty('sourceField');
        expect(tx).toHaveProperty('targetField');
        expect(tx).toHaveProperty('transformLogic');
        expect(tx).toHaveProperty('description');
      }
    });
  });
});
