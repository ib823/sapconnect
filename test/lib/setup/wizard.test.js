/**
 * Tests for SAP System Setup Wizard & Connection Validator
 */

const SetupWizard = require('../../../lib/setup/wizard');

describe('SetupWizard', () => {
  // ── Constructor ───────────────────────────────────────────────────

  describe('constructor', () => {
    it('should create with default mode "mock"', () => {
      const wiz = new SetupWizard();
      expect(wiz.mode).toBe('mock');
    });

    it('should accept mock and live modes', () => {
      const mock = new SetupWizard({ mode: 'mock' });
      const live = new SetupWizard({ mode: 'live' });
      expect(mock.mode).toBe('mock');
      expect(live.mode).toBe('live');
    });

    it('should store rfcConfig, odataConfig, and adtConfig', () => {
      const rfcConfig = { ashost: '10.0.0.1', sysnr: '00', client: '100', user: 'USR', passwd: 'pw' };
      const odataConfig = { baseUrl: 'https://sap:443' };
      const adtConfig = { baseUrl: 'https://sap:443', username: 'USR', password: 'pw' };
      const wiz = new SetupWizard({ rfcConfig, odataConfig, adtConfig });
      expect(wiz.rfcConfig).toBe(rfcConfig);
      expect(wiz.odataConfig).toBe(odataConfig);
      expect(wiz.adtConfig).toBe(adtConfig);
    });
  });

  // ── checkRfcConnectivity ──────────────────────────────────────────

  describe('checkRfcConnectivity', () => {
    it('should return mock system info in mock mode', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkRfcConnectivity();
      expect(result.available).toBe(true);
      expect(result.systemInfo).toBeDefined();
      expect(result.systemInfo.sid).toBe('DEV');
    });

    it('should include latency in milliseconds', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkRfcConnectivity();
      expect(typeof result.latencyMs).toBe('number');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should return system info structure with all expected fields', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkRfcConnectivity();
      const info = result.systemInfo;
      expect(info).toHaveProperty('sid');
      expect(info).toHaveProperty('sysId');
      expect(info).toHaveProperty('host');
      expect(info).toHaveProperty('dbType');
      expect(info).toHaveProperty('kernel');
      expect(info).toHaveProperty('os');
      expect(info).toHaveProperty('sapRelease');
      expect(info).toHaveProperty('component');
    });

    it('should return available flag as true in mock mode', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkRfcConnectivity();
      expect(result.available).toBe(true);
    });

    it('should return realistic SAP system details', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkRfcConnectivity();
      expect(result.systemInfo.dbType).toBe('HDB');
      expect(result.systemInfo.os).toBe('Linux');
      expect(result.systemInfo.host).toContain('sapdev');
    });
  });

  // ── checkODataConnectivity ────────────────────────────────────────

  describe('checkODataConnectivity', () => {
    it('should return success in mock mode', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkODataConnectivity();
      expect(result.available).toBe(true);
    });

    it('should report CSRF support', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkODataConnectivity();
      expect(result.csrfSupport).toBe(true);
    });

    it('should report metadata accessibility', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkODataConnectivity();
      expect(result.metadataAccessible).toBe(true);
    });

    it('should include latency measurement', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkODataConnectivity();
      expect(typeof result.latencyMs).toBe('number');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should have correct shape for mock result', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkODataConnectivity();
      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('latencyMs');
      expect(result).toHaveProperty('csrfSupport');
      expect(result).toHaveProperty('metadataAccessible');
    });
  });

  // ── checkAdtConnectivity ──────────────────────────────────────────

  describe('checkAdtConnectivity', () => {
    it('should return mock services in mock mode', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkAdtConnectivity();
      expect(result.available).toBe(true);
      expect(result.services).toBeDefined();
    });

    it('should check individual ADT services', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkAdtConnectivity();
      expect(result.services.repository).toBe(true);
      expect(result.services.atc).toBe(true);
      expect(result.services.cts).toBe(true);
      expect(result.services.unitTest).toBe(true);
    });

    it('should include latency measurement', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkAdtConnectivity();
      expect(typeof result.latencyMs).toBe('number');
    });

    it('should report discovery endpoint availability', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkAdtConnectivity();
      // available is determined by the discovery endpoint
      expect(typeof result.available).toBe('boolean');
    });

    it('should have correct structure', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkAdtConnectivity();
      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('latencyMs');
      expect(result).toHaveProperty('services');
      expect(result.services).toHaveProperty('repository');
      expect(result.services).toHaveProperty('atc');
      expect(result.services).toHaveProperty('cts');
      expect(result.services).toHaveProperty('unitTest');
    });
  });

  // ── checkAuthorizations ───────────────────────────────────────────

  describe('checkAuthorizations', () => {
    it('should return all authorization objects', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkAuthorizations();
      expect(result.checks).toHaveLength(SetupWizard.REQUIRED_AUTHS.length);
    });

    it('should mark each check as required or optional', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkAuthorizations();
      for (const check of result.checks) {
        expect(typeof check.required).toBe('boolean');
      }
    });

    it('should handle partial authorization (S_BTCH_ADM denied in mock)', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkAuthorizations();
      const batchCheck = result.checks.find(c => c.object === 'S_BTCH_ADM');
      expect(batchCheck).toBeDefined();
      expect(batchCheck.authorized).toBe(false);
    });

    it('should count pass/fail correctly', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkAuthorizations();
      expect(result.passed + result.failed).toBe(result.checks.length);
      expect(result.passed).toBe(result.checks.filter(c => c.authorized).length);
      expect(result.failed).toBe(result.checks.filter(c => !c.authorized).length);
    });

    it('should have realistic partial auth in mock mode', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkAuthorizations();
      // Most should pass, at least one should fail
      expect(result.passed).toBeGreaterThan(0);
      expect(result.failed).toBeGreaterThan(0);
    });

    it('should include description for each authorization object', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkAuthorizations();
      for (const check of result.checks) {
        expect(check.description).toBeTruthy();
        expect(typeof check.description).toBe('string');
      }
    });

    it('should report warnings for optional auth failures', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkAuthorizations();
      // S_BTCH_ADM is optional and unauthorized => counts as warning
      expect(result.warnings).toBeGreaterThan(0);
    });

    it('should include the object name in each check', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkAuthorizations();
      const objects = result.checks.map(c => c.object);
      expect(objects).toContain('S_RFC');
      expect(objects).toContain('S_TABU_DIS');
      expect(objects).toContain('S_TCODE');
      expect(objects).toContain('S_DEVELOP');
      expect(objects).toContain('S_CTS_ADMI');
      expect(objects).toContain('S_PROGRAM');
      expect(objects).toContain('S_USER_GRP');
      expect(objects).toContain('S_BTCH_ADM');
    });
  });

  // ── checkTableReadAccess ──────────────────────────────────────────

  describe('checkTableReadAccess', () => {
    it('should find a working function module', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkTableReadAccess();
      expect(result.functionModule).toBe('RFC_READ_TABLE');
    });

    it('should report accessibility', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkTableReadAccess();
      expect(result.accessible).toBe(true);
    });

    it('should return client count from T000', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkTableReadAccess();
      expect(typeof result.clientsFound).toBe('number');
      expect(result.clientsFound).toBeGreaterThan(0);
    });

    it('should have correct structure', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkTableReadAccess();
      expect(result).toHaveProperty('functionModule');
      expect(result).toHaveProperty('accessible');
      expect(result).toHaveProperty('clientsFound');
    });
  });

  // ── checkIcfServices ──────────────────────────────────────────────

  describe('checkIcfServices', () => {
    it('should return all service paths', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkIcfServices();
      expect(result).toHaveLength(SetupWizard.ICF_SERVICES.length);
    });

    it('should mark services as active or inactive', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkIcfServices();
      for (const svc of result) {
        expect(typeof svc.active).toBe('boolean');
      }
    });

    it('should include at least one inactive service in mock (SOAP)', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkIcfServices();
      const soapService = result.find(s => s.path === '/sap/bc/soap/');
      expect(soapService).toBeDefined();
      expect(soapService.active).toBe(false);
    });

    it('should have path and statusCode for each entry', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.checkIcfServices();
      for (const svc of result) {
        expect(svc).toHaveProperty('path');
        expect(svc).toHaveProperty('active');
        expect(svc).toHaveProperty('statusCode');
      }
    });
  });

  // ── discoverSystem ────────────────────────────────────────────────

  describe('discoverSystem', () => {
    it('should combine connectivity and system info', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.discoverSystem();
      expect(result.connectivity).toBeDefined();
      expect(result.connectivity.rfc).toBeDefined();
      expect(result.connectivity.odata).toBeDefined();
      expect(result.connectivity.adt).toBeDefined();
    });

    it('should return client list', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.discoverSystem();
      expect(Array.isArray(result.clients)).toBe(true);
      expect(result.clients.length).toBeGreaterThan(0);
    });

    it('should return system SID and release', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.discoverSystem();
      expect(result.sid).toBe('DEV');
      expect(result.release).toBe('756');
    });

    it('should return database info', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.discoverSystem();
      expect(result.database).toBe('HDB');
    });

    it('should return OS and kernel info', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.discoverSystem();
      expect(result.os).toBe('Linux');
      expect(result.kernel).toBe('753');
    });
  });

  // ── generateReport ────────────────────────────────────────────────

  describe('generateReport', () => {
    let wiz;
    let validationResult;

    beforeEach(async () => {
      wiz = new SetupWizard({ mode: 'mock' });
      validationResult = await wiz.validateAll();
    });

    it('should include the timestamp', () => {
      const report = wiz.generateReport(validationResult);
      expect(report).toContain(validationResult.timestamp);
    });

    it('should include all sections', () => {
      const report = wiz.generateReport(validationResult);
      expect(report).toContain('CONNECTIVITY');
      expect(report).toContain('AUTHORIZATIONS');
      expect(report).toContain('ICF SERVICES');
      expect(report).toContain('TABLE READ ACCESS');
      expect(report).toContain('SUMMARY');
    });

    it('should show pass/fail indicators', () => {
      const report = wiz.generateReport(validationResult);
      expect(report).toContain('[PASS]');
      // S_BTCH_ADM is optional and unauthorized, so shows as [WARN]
      expect(report).toContain('[WARN]');
    });

    it('should include recommendations section', () => {
      const report = wiz.generateReport(validationResult);
      expect(report).toContain('RECOMMENDATIONS');
    });

    it('should show ready-for summary', () => {
      const report = wiz.generateReport(validationResult);
      expect(report).toContain('Ready for extraction');
      expect(report).toContain('Ready for migration');
      expect(report).toContain('Ready for config');
    });
  });

  // ── quickCheck ────────────────────────────────────────────────────

  describe('quickCheck', () => {
    it('should return all three connectivity flags', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.quickCheck();
      expect(result).toHaveProperty('rfc');
      expect(result).toHaveProperty('odata');
      expect(result).toHaveProperty('adt');
    });

    it('should return allGreen true when all pass', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.quickCheck();
      expect(result.allGreen).toBe(true);
    });

    it('should return allGreen false when any connectivity fails', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      // Override mock to simulate a failure
      const origRfc = wiz._mockRfcConnectivity.bind(wiz);
      wiz._mockRfcConnectivity = () => ({ ...origRfc(), available: false });
      const result = await wiz.quickCheck();
      expect(result.allGreen).toBe(false);
      expect(result.rfc).toBe(false);
    });
  });

  // ── validateAll ───────────────────────────────────────────────────

  describe('validateAll', () => {
    it('should run all checks and return comprehensive report', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.validateAll();
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('connectivity');
      expect(result).toHaveProperty('authorization');
      expect(result).toHaveProperty('services');
      expect(result).toHaveProperty('summary');
    });

    it('should include system information', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.validateAll();
      expect(result.system.sid).toBe('DEV');
    });

    it('should include summary counts', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.validateAll();
      expect(typeof result.summary.totalChecks).toBe('number');
      expect(typeof result.summary.passed).toBe('number');
      expect(typeof result.summary.failed).toBe('number');
      expect(typeof result.summary.warnings).toBe('number');
      expect(result.summary.totalChecks).toBeGreaterThan(0);
    });

    it('should determine ready flags based on check results', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.validateAll();
      expect(typeof result.summary.readyForExtraction).toBe('boolean');
      expect(typeof result.summary.readyForMigration).toBe('boolean');
      expect(typeof result.summary.readyForConfig).toBe('boolean');
      // In mock mode with all checks passing (except S_BTCH_ADM which is optional)
      expect(result.summary.readyForExtraction).toBe(true);
      expect(result.summary.readyForConfig).toBe(true);
    });

    it('should handle mixed results with correct totals', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      const result = await wiz.validateAll();
      // passed + failed should account for all non-warning checks
      expect(result.summary.passed).toBeGreaterThan(0);
      expect(result.summary.totalChecks).toBeGreaterThanOrEqual(
        result.summary.passed + result.summary.failed
      );
    });
  });

  // ── Static properties ─────────────────────────────────────────────

  describe('static properties', () => {
    it('REQUIRED_AUTHS should contain all authorization objects', () => {
      const auths = SetupWizard.REQUIRED_AUTHS;
      expect(Array.isArray(auths)).toBe(true);
      expect(auths.length).toBe(10);
      const objects = auths.map(a => a.object);
      expect(objects).toContain('S_RFC');
      expect(objects).toContain('S_TABU_DIS');
      expect(objects).toContain('S_TCODE');
      expect(objects).toContain('S_DEVELOP');
      expect(objects).toContain('S_CTS_ADMI');
      expect(objects).toContain('S_PROGRAM');
      expect(objects).toContain('S_USER_GRP');
      expect(objects).toContain('S_BTCH_ADM');
      expect(objects).toContain('S_ADMI_FCD');
      expect(objects).toContain('S_BDC_MONI');
    });

    it('ICF_SERVICES should contain all service paths', () => {
      const services = SetupWizard.ICF_SERVICES;
      expect(Array.isArray(services)).toBe(true);
      expect(services.length).toBe(6);
      const paths = services.map(s => s.path);
      expect(paths).toContain('/sap/opu/odata/');
      expect(paths).toContain('/sap/bc/adt/');
      expect(paths).toContain('/sap/public/ping');
      expect(paths).toContain('/sap/bc/bsp/');
      expect(paths).toContain('/sap/bc/soap/');
      expect(paths).toContain('/sap/bc/rest/');
    });

    it('TABLE_READ_FMS should contain the fallback chain', () => {
      const fms = SetupWizard.TABLE_READ_FMS;
      expect(Array.isArray(fms)).toBe(true);
      expect(fms.length).toBe(3);
      expect(fms[0]).toBe('/SAPDS/RFC_READ_TABLE');
      expect(fms[1]).toBe('BBP_RFC_READ_TABLE');
      expect(fms[2]).toBe('RFC_READ_TABLE');
    });
  });

  // ── Additional edge-case / integration tests ──────────────────────

  describe('report with failed connectivity', () => {
    it('should include failure recommendations when RFC is down', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      // Simulate RFC failure
      wiz._mockRfcConnectivity = () => ({
        available: false,
        latencyMs: 0,
        systemInfo: null,
        error: 'Connection refused',
      });
      const result = await wiz.validateAll();
      const report = wiz.generateReport(result);
      expect(report).toContain('[FAIL]');
      expect(report).toContain('RFC connectivity');
    });
  });

  describe('report with failed OData', () => {
    it('should include OData activation recommendation', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      wiz._mockODataConnectivity = () => ({
        available: false,
        latencyMs: 0,
        csrfSupport: false,
        metadataAccessible: false,
        error: 'Unreachable',
      });
      const result = await wiz.validateAll();
      const report = wiz.generateReport(result);
      expect(report).toContain('OData');
      expect(report).toContain('SICF');
    });
  });

  describe('validateAll readiness flags', () => {
    it('should set readyForExtraction false when table read fails', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      wiz._mockTableReadAccess = () => ({
        functionModule: null,
        accessible: false,
        clientsFound: 0,
        error: 'No FM available',
      });
      const result = await wiz.validateAll();
      expect(result.summary.readyForExtraction).toBe(false);
    });

    it('should set readyForConfig true when OData or ADT is available', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      wiz._mockRfcConnectivity = () => ({
        available: false, latencyMs: 0, systemInfo: null, error: 'down',
      });
      const result = await wiz.validateAll();
      // OData and ADT still available
      expect(result.summary.readyForConfig).toBe(true);
    });
  });

  describe('discoverSystem with partial failures', () => {
    it('should still return structure when RFC is unavailable', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      wiz._mockRfcConnectivity = () => ({
        available: false, latencyMs: 0, systemInfo: null, error: 'down',
      });
      const result = await wiz.discoverSystem();
      expect(result).toHaveProperty('connectivity');
      expect(result.sid).toBeNull();
      expect(result.connectivity.rfc.available).toBe(false);
      expect(result.connectivity.odata.available).toBe(true);
    });
  });

  describe('quickCheck connectivity simulation', () => {
    it('should return false for OData when it is down', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      wiz._mockODataConnectivity = () => ({
        available: false, latencyMs: 0, csrfSupport: false, metadataAccessible: false,
      });
      const result = await wiz.quickCheck();
      expect(result.odata).toBe(false);
      expect(result.allGreen).toBe(false);
    });

    it('should return false for ADT when it is down', async () => {
      const wiz = new SetupWizard({ mode: 'mock' });
      wiz._mockAdtConnectivity = () => ({
        available: false, latencyMs: 0, services: { repository: false, atc: false, cts: false, unitTest: false },
      });
      const result = await wiz.quickCheck();
      expect(result.adt).toBe(false);
      expect(result.allGreen).toBe(false);
    });
  });

  describe('authorization area metadata', () => {
    it('should have area field in REQUIRED_AUTHS for categorization', () => {
      for (const auth of SetupWizard.REQUIRED_AUTHS) {
        expect(auth).toHaveProperty('area');
        expect(['extraction', 'migration', 'config']).toContain(auth.area);
      }
    });

    it('should have description field in ICF_SERVICES', () => {
      for (const svc of SetupWizard.ICF_SERVICES) {
        expect(svc).toHaveProperty('description');
        expect(svc.description).toBeTruthy();
      }
    });
  });

  describe('index module', () => {
    it('should re-export SetupWizard from index', () => {
      const { SetupWizard: SW } = require('../../../lib/setup/index');
      expect(SW).toBe(SetupWizard);
    });
  });
});
