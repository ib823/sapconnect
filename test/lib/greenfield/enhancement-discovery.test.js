/**
 * Tests for Enhancement Framework Discovery
 */

const { EnhancementDiscovery, BADI_CATALOG, S4HANA_RELEASED_BADIS } = require('../../../lib/greenfield/enhancement-discovery');

describe('EnhancementDiscovery', () => {
  let discovery;

  beforeEach(() => {
    discovery = new EnhancementDiscovery(null, { mode: 'mock' });
  });

  describe('discoverBadis', () => {
    it('should return BAdIs for FI module', async () => {
      const badis = await discovery.discoverBadis('FI');
      expect(badis.length).toBeGreaterThan(0);
      expect(badis.every(b => b.module === 'FI')).toBe(true);
    });

    it('should return BAdIs for MM module', async () => {
      const badis = await discovery.discoverBadis('MM');
      expect(badis.length).toBeGreaterThan(0);
      expect(badis.some(b => b.name === 'BADI_MM_PO_CREATE')).toBe(true);
    });

    it('should return BAdIs for SD module', async () => {
      const badis = await discovery.discoverBadis('SD');
      expect(badis.some(b => b.name === 'BADI_SD_SALES')).toBe(true);
    });

    it('should return BAdIs for CO module', async () => {
      const badis = await discovery.discoverBadis('CO');
      expect(badis.length).toBeGreaterThan(0);
    });

    it('should return BAdIs for PP module', async () => {
      const badis = await discovery.discoverBadis('PP');
      expect(badis.length).toBeGreaterThan(0);
    });

    it('should return BAdIs for PM module', async () => {
      const badis = await discovery.discoverBadis('PM');
      expect(badis.length).toBeGreaterThan(0);
    });

    it('should return BAdIs for HR module', async () => {
      const badis = await discovery.discoverBadis('HR');
      expect(badis.length).toBeGreaterThan(0);
    });

    it('should return BAdIs for BC module', async () => {
      const badis = await discovery.discoverBadis('BC');
      expect(badis.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown module', async () => {
      const badis = await discovery.discoverBadis('ZZ');
      expect(badis).toHaveLength(0);
    });

    it('should be case-insensitive for module name', async () => {
      const badis = await discovery.discoverBadis('fi');
      expect(badis.length).toBeGreaterThan(0);
    });

    it('should throw on missing component', async () => {
      await expect(discovery.discoverBadis('')).rejects.toThrow('Application component is required');
    });

    it('should include interface and filter type in results', async () => {
      const badis = await discovery.discoverBadis('FI');
      const accDoc = badis.find(b => b.name === 'BADI_ACC_DOCUMENT');
      expect(accDoc).toBeDefined();
      expect(accDoc.interface).toBe('IF_EX_ACC_DOCUMENT');
      expect(accDoc.filterType).toBe('BUKRS');
    });
  });

  describe('getBadiDefinition', () => {
    it('should return full definition for BADI_ACC_DOCUMENT', async () => {
      const def = await discovery.getBadiDefinition('BADI_ACC_DOCUMENT');
      expect(def.name).toBe('BADI_ACC_DOCUMENT');
      expect(def.interface).toBe('IF_EX_ACC_DOCUMENT');
      expect(def.filterType).toBe('BUKRS');
      expect(def.methods).toBeInstanceOf(Array);
      expect(def.methods.length).toBeGreaterThan(0);
    });

    it('should include method parameters in definition', async () => {
      const def = await discovery.getBadiDefinition('BADI_ACC_DOCUMENT');
      const method = def.methods[0];
      expect(method.name).toBeDefined();
      expect(method.parameters).toBeInstanceOf(Array);
    });

    it('should return isMultipleUse and isFilterDependent', async () => {
      const def = await discovery.getBadiDefinition('BADI_ACC_DOCUMENT');
      expect(def.isMultipleUse).toBe(true);
      expect(def.isFilterDependent).toBe(true);
    });

    it('should return isFilterDependent false for no filter', async () => {
      const def = await discovery.getBadiDefinition('BADI_PM_FUNCLOCN');
      expect(def.isFilterDependent).toBe(false);
    });

    it('should throw for unknown BAdI name', async () => {
      await expect(discovery.getBadiDefinition('BADI_NONEXISTENT'))
        .rejects.toThrow('not found');
    });

    it('should throw on empty BAdI name', async () => {
      await expect(discovery.getBadiDefinition('')).rejects.toThrow('BAdI name is required');
    });
  });

  describe('findExitPoints', () => {
    it('should return exit points for a program', async () => {
      const exits = await discovery.findExitPoints('SAPMF05A');
      expect(exits.length).toBeGreaterThan(0);
    });

    it('should include BAdI exit type', async () => {
      const exits = await discovery.findExitPoints('SAPMM06E');
      const badi = exits.find(e => e.type === 'BAdI');
      expect(badi).toBeDefined();
      expect(badi.line).toBeGreaterThan(0);
    });

    it('should include CustomerExit type', async () => {
      const exits = await discovery.findExitPoints('SAPMV45A');
      const custExit = exits.find(e => e.type === 'CustomerExit');
      expect(custExit).toBeDefined();
      expect(custExit.id).toBeDefined();
    });

    it('should include EnhancementPoint type', async () => {
      const exits = await discovery.findExitPoints('ZPROG01');
      const enhPoint = exits.find(e => e.type === 'EnhancementPoint');
      expect(enhPoint).toBeDefined();
    });

    it('should include UserExit type', async () => {
      const exits = await discovery.findExitPoints('ZPROG01');
      const userExit = exits.find(e => e.type === 'UserExit');
      expect(userExit).toBeDefined();
    });

    it('should include program name in each exit point', async () => {
      const exits = await discovery.findExitPoints('MY_PROGRAM');
      for (const exit of exits) {
        expect(exit.program).toBe('MY_PROGRAM');
      }
    });

    it('should throw on empty program name', async () => {
      await expect(discovery.findExitPoints('')).rejects.toThrow('Program name is required');
    });
  });

  describe('generateBadiImplementation', () => {
    it('should generate ABAP class source code', async () => {
      const impl = await discovery.generateBadiImplementation('BADI_ACC_DOCUMENT', 'IMPL_ACC_DOC');
      expect(impl.className).toBe('ZCL_IMPL_ACC_DOC');
      expect(impl.source).toContain('CLASS ZCL_IMPL_ACC_DOC DEFINITION');
      expect(impl.source).toContain('CLASS ZCL_IMPL_ACC_DOC IMPLEMENTATION');
    });

    it('should include interface declaration', async () => {
      const impl = await discovery.generateBadiImplementation('BADI_ACC_DOCUMENT', 'IMPL_ACC_DOC');
      expect(impl.source).toContain('INTERFACES IF_EX_ACC_DOCUMENT');
      expect(impl.interface).toBe('IF_EX_ACC_DOCUMENT');
    });

    it('should include method implementations for all BAdI methods', async () => {
      const impl = await discovery.generateBadiImplementation('BADI_ACC_DOCUMENT', 'IMPL_ACC_DOC');
      expect(impl.source).toContain('METHOD IF_EX_ACC_DOCUMENT~CHANGE');
      expect(impl.source).toContain('METHOD IF_EX_ACC_DOCUMENT~CHECK');
      expect(impl.methodCount).toBe(2);
    });

    it('should include ENDMETHOD for each method', async () => {
      const impl = await discovery.generateBadiImplementation('BADI_MM_PO_CREATE', 'IMPL_PO');
      const endMethodCount = (impl.source.match(/ENDMETHOD\./g) || []).length;
      expect(endMethodCount).toBe(impl.methodCount);
    });

    it('should include ENDCLASS', async () => {
      const impl = await discovery.generateBadiImplementation('BADI_SD_SALES', 'IMPL_SD');
      expect(impl.source).toContain('ENDCLASS.');
    });

    it('should throw on missing BAdI name', async () => {
      await expect(discovery.generateBadiImplementation('', 'IMPL'))
        .rejects.toThrow('BAdI name is required');
    });

    it('should throw on missing implementation name', async () => {
      await expect(discovery.generateBadiImplementation('BADI_ACC_DOCUMENT', ''))
        .rejects.toThrow('Implementation name is required');
    });

    it('should uppercase the class name', async () => {
      const impl = await discovery.generateBadiImplementation('BADI_ACC_DOCUMENT', 'my_impl');
      expect(impl.className).toBe('ZCL_MY_IMPL');
    });
  });

  describe('getCatalog', () => {
    it('should return catalog organized by module', () => {
      const catalog = discovery.getCatalog();
      expect(Object.keys(catalog).length).toBeGreaterThanOrEqual(8);
    });

    it('should include FI, CO, MM, SD, PP, PM, HR, BC modules', () => {
      const catalog = discovery.getCatalog();
      const modules = Object.keys(catalog);
      expect(modules).toContain('FI');
      expect(modules).toContain('CO');
      expect(modules).toContain('MM');
      expect(modules).toContain('SD');
      expect(modules).toContain('PP');
      expect(modules).toContain('PM');
      expect(modules).toContain('HR');
      expect(modules).toContain('BC');
    });

    it('should have at least 5 BAdIs per module', () => {
      const catalog = discovery.getCatalog();
      for (const [module, badis] of Object.entries(catalog)) {
        expect(badis.length).toBeGreaterThanOrEqual(5);
      }
    });

    it('should include BADI_ACC_DOCUMENT in FI', () => {
      const catalog = discovery.getCatalog();
      const accDoc = catalog.FI.find(b => b.name === 'BADI_ACC_DOCUMENT');
      expect(accDoc).toBeDefined();
      expect(accDoc.interface).toBe('IF_EX_ACC_DOCUMENT');
    });

    it('should include methods for each BAdI', () => {
      const catalog = discovery.getCatalog();
      for (const [module, badis] of Object.entries(catalog)) {
        for (const badi of badis) {
          expect(badi.methods).toBeInstanceOf(Array);
          expect(badi.methods.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('getS4HanaReleasedBadis', () => {
    it('should return released BAdIs for default release (2402)', () => {
      const badis = discovery.getS4HanaReleasedBadis();
      expect(badis.length).toBeGreaterThanOrEqual(40);
    });

    it('should return released BAdIs for specific release', () => {
      const badis = discovery.getS4HanaReleasedBadis('2302');
      expect(badis.length).toBeGreaterThanOrEqual(10);
    });

    it('should include module and release status', () => {
      const badis = discovery.getS4HanaReleasedBadis('2402');
      for (const badi of badis) {
        expect(badi.module).toBeDefined();
        expect(badi.releaseStatus).toBe('Released');
        expect(badi.apiState).toBe('Cloud-Enabled');
      }
    });

    it('should throw on unknown release version', () => {
      expect(() => discovery.getS4HanaReleasedBadis('9999')).toThrow('not found');
    });

    it('should have more BAdIs in newer releases', () => {
      const r2302 = discovery.getS4HanaReleasedBadis('2302');
      const r2402 = discovery.getS4HanaReleasedBadis('2402');
      expect(r2402.length).toBeGreaterThan(r2302.length);
    });
  });

  describe('BADI_CATALOG constant', () => {
    it('should have 8 modules', () => {
      expect(Object.keys(BADI_CATALOG)).toHaveLength(8);
    });

    it('should include essential BAdIs', () => {
      const allBadis = Object.values(BADI_CATALOG).flat().map(b => b.name);
      expect(allBadis).toContain('BADI_ACC_DOCUMENT');
      expect(allBadis).toContain('BADI_MM_PO_CREATE');
      expect(allBadis).toContain('BADI_SD_SALES');
    });

    it('should have valid structure for each BAdI entry', () => {
      for (const [module, badis] of Object.entries(BADI_CATALOG)) {
        for (const badi of badis) {
          expect(badi.name).toBeDefined();
          expect(badi.description).toBeDefined();
          expect(badi.interface).toBeDefined();
          expect(badi.methods).toBeInstanceOf(Array);
          expect(badi.methods.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('S4HANA_RELEASED_BADIS constant', () => {
    it('should have at least 3 release versions', () => {
      expect(Object.keys(S4HANA_RELEASED_BADIS).length).toBeGreaterThanOrEqual(3);
    });

    it('should have 50+ BAdIs in the latest release', () => {
      const latestRelease = Object.keys(S4HANA_RELEASED_BADIS).sort().pop();
      expect(S4HANA_RELEASED_BADIS[latestRelease].length).toBeGreaterThanOrEqual(40);
    });
  });
});
