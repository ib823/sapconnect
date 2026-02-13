const Provisioner = require('../../migration/provisioner');

describe('Provisioner', () => {
  function mockGateway() {
    return { mode: 'mock' };
  }

  describe('constructor', () => {
    it('creates an instance in mock mode', () => {
      const provisioner = new Provisioner(mockGateway());
      expect(provisioner).toBeDefined();
      expect(provisioner.gateway.mode).toBe('mock');
    });

    it('uses default landscape and tier', () => {
      const provisioner = new Provisioner(mockGateway());
      expect(provisioner.landscape).toBe('cf-us10');
      expect(provisioner.tier).toBe('standard');
    });
  });

  describe('provision()', () => {
    let result;

    beforeEach(async () => {
      const provisioner = new Provisioner(mockGateway());
      result = await provisioner.provision();
    });

    it('returns services array', () => {
      expect(Array.isArray(result.services)).toBe(true);
      expect(result.services.length).toBeGreaterThan(0);
    });

    it('returns terraform string', () => {
      expect(typeof result.terraform).toBe('string');
      expect(result.terraform.length).toBeGreaterThan(0);
    });

    it('returns stats with correct shape', () => {
      expect(result.stats).toHaveProperty('totalServices');
      expect(result.stats).toHaveProperty('provisioned');
      expect(result.stats).toHaveProperty('pending');
      expect(result.stats).toHaveProperty('errors');
      expect(result.stats).toHaveProperty('landscape');
      expect(result.stats).toHaveProperty('tier');
      expect(result.stats).toHaveProperty('estimatedMonthlyCost');
    });

    it('services have status field', () => {
      for (const svc of result.services) {
        expect(svc).toHaveProperty('status');
        expect(['provisioned', 'pending', 'error']).toContain(svc.status);
      }
    });

    it('terraform contains resource blocks', () => {
      expect(result.terraform).toContain('resource');
      expect(result.terraform).toContain('btp_subaccount');
      expect(result.terraform).toContain('btp_subaccount_entitlement');
      expect(result.terraform).toContain('provider "btp"');
    });

    it('stats totalServices matches services length', () => {
      expect(result.stats.totalServices).toBe(result.services.length);
    });

    it('estimated cost is greater than 0', () => {
      expect(result.stats.estimatedMonthlyCost).toBeGreaterThan(0);
    });
  });

  describe('custom options', () => {
    it('uses custom landscape', async () => {
      const provisioner = new Provisioner(mockGateway(), { landscape: 'cf-eu10' });
      const result = await provisioner.provision();

      expect(result.stats.landscape).toBe('cf-eu10');
      expect(result.terraform).toContain('cf-eu10');
    });

    it('uses custom tier', async () => {
      const provisioner = new Provisioner(mockGateway(), { tier: 'premium' });
      const result = await provisioner.provision();

      expect(result.stats.tier).toBe('premium');
    });
  });
});
