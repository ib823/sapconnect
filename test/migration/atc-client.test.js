const AtcClient = require('../../migration/atc-client');

describe('AtcClient', () => {
  let client;

  beforeEach(() => {
    const mockGateway = { mode: 'mock' };
    client = new AtcClient(mockGateway);
  });

  describe('getCheckVariants()', () => {
    it('should return available check variants', async () => {
      const variants = await client.getCheckVariants();

      expect(variants).toContain('S4HANA_READINESS');
      expect(variants).toContain('DEFAULT');
      expect(variants.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('runCheck()', () => {
    it('should return findings and summary', async () => {
      const result = await client.runCheck(['Z_TEST_01', 'Z_TEST_02']);

      expect(result).toHaveProperty('findings');
      expect(result).toHaveProperty('summary');
      expect(result.summary.objectsChecked).toBe(2);
      expect(result.summary.checkVariant).toBe('S4HANA_READINESS');
    });

    it('should return findings with required fields', async () => {
      const result = await client.runCheck(['ZCL_FI_JOURNAL_POST', 'ZCL_MM_PO_ENHANCE', 'ZCL_SD_ORDER_PROC']);

      for (const finding of result.findings) {
        expect(finding).toHaveProperty('object');
        expect(finding).toHaveProperty('checkId');
        expect(finding).toHaveProperty('priority');
        expect(finding).toHaveProperty('messageTitle');
        expect(finding).toHaveProperty('line');
        expect(finding.priority).toBeGreaterThanOrEqual(1);
        expect(finding.priority).toBeLessThanOrEqual(3);
      }
    });

    it('should have correct priority distribution', async () => {
      const objects = Array.from({ length: 15 }, (_, i) => `Z_OBJ_${i}`);
      const result = await client.runCheck(objects);

      expect(result.summary.byPriority).toHaveProperty('1');
      expect(result.summary.byPriority).toHaveProperty('2');
      expect(result.summary.byPriority).toHaveProperty('3');

      const total = result.summary.byPriority[1] + result.summary.byPriority[2] + result.summary.byPriority[3];
      expect(total).toBe(result.summary.totalFindings);
    });

    it('should use specified check variant', async () => {
      const result = await client.runCheck(['Z_TEST'], 'PERFORMANCE');

      expect(result.summary.checkVariant).toBe('PERFORMANCE');
      for (const finding of result.findings) {
        expect(finding.checkVariant).toBe('PERFORMANCE');
      }
    });

    it('should handle empty object list', async () => {
      const result = await client.runCheck([]);

      expect(result.findings).toHaveLength(0);
      expect(result.summary.totalFindings).toBe(0);
      expect(result.summary.objectsChecked).toBe(0);
    });
  });
});
