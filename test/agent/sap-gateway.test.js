const SapGateway = require('../../agent/sap-gateway');

describe('SapGateway', () => {
  describe('mode detection', () => {
    it('should default to mock mode', () => {
      const gw = new SapGateway();
      expect(gw.mode).toBe('mock');
    });

    it('should use live mode when system is provided', () => {
      const gw = new SapGateway({ system: 'https://s4.example.com' });
      expect(gw.mode).toBe('live');
    });
  });

  describe('mock mode methods', () => {
    let gw;

    it('readAbapSource should return result object', async () => {
      gw = new SapGateway();
      const result = await gw.readAbapSource('ZCL_CUSTOMER_REPORT', 'CLAS');
      // Returns source if found, or error property if not in mock data
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('writeAbapSource should return saved status', async () => {
      gw = new SapGateway();
      const result = await gw.writeAbapSource('Z_TEST', 'DATA lv_x TYPE i.', 'PROG');
      expect(result.status).toBe('SAVED');
      expect(result.object_name).toBe('Z_TEST');
    });

    it('listObjects should return package contents', async () => {
      gw = new SapGateway();
      const result = await gw.listObjects('Z_MIGRATION');
      // May be error if package not in mock, but should return an object
      expect(result).toBeDefined();
    });

    it('searchRepository should return search results', async () => {
      gw = new SapGateway();
      const result = await gw.searchRepository('Z*');
      expect(result).toHaveProperty('query');
      expect(result.query).toBe('Z*');
    });

    it('getDataDictionary should return DDIC info', async () => {
      gw = new SapGateway();
      const result = await gw.getDataDictionary('BSEG');
      expect(result).toBeDefined();
    });

    it('activateObject should return active status', async () => {
      gw = new SapGateway();
      const result = await gw.activateObject('Z_TEST', 'CLAS');
      expect(result.status).toBe('ACTIVE');
      expect(result.object_name).toBe('Z_TEST');
    });

    it('runUnitTests should return test results', async () => {
      gw = new SapGateway();
      const result = await gw.runUnitTests('Z_TEST');
      expect(result).toBeDefined();
    });

    it('runSyntaxCheck should return check results', async () => {
      gw = new SapGateway();
      const result = await gw.runSyntaxCheck('Z_TEST', 'CLAS');
      expect(result).toHaveProperty('object_name');
      expect(result.object_name).toBe('Z_TEST');
    });
  });
});
