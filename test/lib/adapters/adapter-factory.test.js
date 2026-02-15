/**
 * Tests for Adapter Factory
 */
const { AdapterFactory } = require('../../../lib/adapters/adapter-factory');
const { SapAdapter } = require('../../../lib/adapters/sap-adapter');
const { InforM3Adapter } = require('../../../lib/adapters/infor-m3-adapter');
const { InforLNAdapter } = require('../../../lib/adapters/infor-ln-adapter');
const { BaseSourceAdapter } = require('../../../lib/adapters/base-source-adapter');

describe('AdapterFactory', () => {
  let factory;

  beforeEach(() => {
    factory = new AdapterFactory();
  });

  describe('create', () => {
    it('should create SAP adapter', () => {
      const adapter = factory.create({ system: 'SAP', mode: 'mock' });
      expect(adapter).toBeInstanceOf(SapAdapter);
      expect(adapter).toBeInstanceOf(BaseSourceAdapter);
      expect(adapter.mode).toBe('mock');
    });

    it('should create INFOR_M3 adapter', () => {
      const adapter = factory.create({ system: 'INFOR_M3', mode: 'mock' });
      expect(adapter).toBeInstanceOf(InforM3Adapter);
      expect(adapter.sourceSystem).toBe('INFOR_M3');
    });

    it('should create INFOR_LN adapter', () => {
      const adapter = factory.create({ system: 'INFOR_LN', mode: 'mock' });
      expect(adapter).toBeInstanceOf(InforLNAdapter);
      expect(adapter.sourceSystem).toBe('INFOR_LN');
    });

    it('should be case-insensitive', () => {
      const adapter = factory.create({ system: 'sap', mode: 'mock' });
      expect(adapter).toBeInstanceOf(SapAdapter);
    });

    it('should throw when system is missing', () => {
      expect(() => factory.create({})).toThrow('config.system is required');
    });

    it('should throw for unsupported system', () => {
      expect(() => factory.create({ system: 'ORACLE' })).toThrow('Unsupported system type');
    });

    it('should pass extra config to adapter', () => {
      const adapter = factory.create({ system: 'SAP', mode: 'mock', rfcParams: { ashost: 'test' } });
      expect(adapter.rfcParams).toEqual({ ashost: 'test' });
    });
  });

  describe('createAndConnect', () => {
    it('should create and connect SAP adapter', async () => {
      const adapter = await factory.createAndConnect({ system: 'SAP', mode: 'mock' });
      expect(adapter).toBeInstanceOf(SapAdapter);
      expect(adapter.isConnected).toBe(true);
    });

    it('should create and connect INFOR_M3 adapter', async () => {
      const adapter = await factory.createAndConnect({ system: 'INFOR_M3', mode: 'mock' });
      expect(adapter).toBeInstanceOf(InforM3Adapter);
      expect(adapter.isConnected).toBe(true);
    });
  });

  describe('listAvailableSystems', () => {
    it('should list all registered systems', () => {
      const systems = factory.listAvailableSystems();
      expect(systems).toContain('SAP');
      expect(systems).toContain('INFOR_M3');
      expect(systems).toContain('INFOR_LN');
    });
  });

  describe('isSupported', () => {
    it('should return true for supported systems', () => {
      expect(factory.isSupported('SAP')).toBe(true);
      expect(factory.isSupported('INFOR_M3')).toBe(true);
      expect(factory.isSupported('INFOR_LN')).toBe(true);
    });

    it('should return false for unsupported systems', () => {
      expect(factory.isSupported('ORACLE')).toBe(false);
      expect(factory.isSupported('DYNAMICS')).toBe(false);
    });
  });
});
