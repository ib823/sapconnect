/**
 * SAP System Setup Wizard & Connection Validator
 *
 * Exhaustive validation of SAP connectivity (RFC, OData, ADT),
 * authorization checks, ICF service discovery, table-read access,
 * and full system discovery.  Operates in mock or live mode.
 */

const Logger = require('../logger');

// ---------------------------------------------------------------------------
// Static constants
// ---------------------------------------------------------------------------

const REQUIRED_AUTHS = [
  { object: 'S_RFC', description: 'RFC access', required: true, area: 'extraction' },
  { object: 'S_TABU_DIS', description: 'Table display', required: true, area: 'extraction' },
  { object: 'S_TCODE', description: 'Transaction execution', required: true, area: 'migration' },
  { object: 'S_DEVELOP', description: 'ABAP development', required: true, area: 'extraction' },
  { object: 'S_CTS_ADMI', description: 'Transport administration', required: true, area: 'migration' },
  { object: 'S_PROGRAM', description: 'Program execution', required: true, area: 'extraction' },
  { object: 'S_USER_GRP', description: 'User administration', required: false, area: 'config' },
  { object: 'S_BTCH_ADM', description: 'Batch administration', required: false, area: 'migration' },
  { object: 'S_ADMI_FCD', description: 'Administration functions', required: false, area: 'config' },
  { object: 'S_BDC_MONI', description: 'BDC monitoring', required: false, area: 'migration' },
];

const ICF_SERVICES = [
  { path: '/sap/opu/odata/', description: 'OData Gateway' },
  { path: '/sap/bc/adt/', description: 'ABAP Development Tools' },
  { path: '/sap/public/ping', description: 'Public ping' },
  { path: '/sap/bc/bsp/', description: 'Business Server Pages' },
  { path: '/sap/bc/soap/', description: 'SOAP / Web Services' },
  { path: '/sap/bc/rest/', description: 'REST services' },
];

const TABLE_READ_FMS = [
  '/SAPDS/RFC_READ_TABLE',
  'BBP_RFC_READ_TABLE',
  'RFC_READ_TABLE',
];

// ---------------------------------------------------------------------------
// SetupWizard
// ---------------------------------------------------------------------------

class SetupWizard {
  /**
   * @param {object} options
   * @param {'mock'|'live'} [options.mode='mock']
   * @param {object}  [options.rfcConfig]   — passed to RfcClient constructor
   * @param {object}  [options.odataConfig] — { baseUrl, auth, ... }
   * @param {object}  [options.adtConfig]   — { baseUrl, username, password, client, mode }
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.rfcConfig = options.rfcConfig || null;
    this.odataConfig = options.odataConfig || null;
    this.adtConfig = options.adtConfig || null;
    this.log = new Logger('setup-wizard');
  }

  // ── RFC connectivity ────────────────────────────────────────────────

  async checkRfcConnectivity() {
    if (this.mode === 'mock') {
      return this._mockRfcConnectivity();
    }

    const start = Date.now();
    let rfcClient;
    try {
      const RfcClient = require('../rfc/client');
      rfcClient = new RfcClient(this.rfcConfig, { retries: 0, timeout: 15000 });
      await rfcClient.open();

      // Ping
      await rfcClient.call('RFC_PING');

      // System info
      const info = await rfcClient.call('RFC_SYSTEM_INFO');
      const rfcsi = info.RFCSI_EXPORT || info.RFCSI || info || {};

      const latencyMs = Date.now() - start;

      return {
        available: true,
        latencyMs,
        systemInfo: {
          sid: (rfcsi.RFCSYSID || '').trim(),
          sysId: (rfcsi.RFCSYSID || '').trim(),
          host: (rfcsi.RFCHOST || '').trim(),
          dbType: (rfcsi.RFCDBSYS || '').trim(),
          kernel: (rfcsi.RFCKERNRL || '').trim(),
          os: (rfcsi.RFCOPSYS || '').trim(),
          sapRelease: (rfcsi.RFCSAPRL || '').trim(),
          component: (rfcsi.RFCSI_RESV || rfcsi.RFCPROTO || '').trim(),
        },
      };
    } catch (err) {
      return {
        available: false,
        latencyMs: Date.now() - start,
        systemInfo: null,
        error: err.message,
      };
    } finally {
      if (rfcClient) {
        try { await rfcClient.close(); } catch { /* ignore */ }
      }
    }
  }

  // ── OData connectivity ──────────────────────────────────────────────

  async checkODataConnectivity() {
    if (this.mode === 'mock') {
      return this._mockODataConnectivity();
    }

    const start = Date.now();
    try {
      const baseUrl = (this.odataConfig && this.odataConfig.baseUrl) || '';
      const authProvider = (this.odataConfig && this.odataConfig.authProvider) || null;

      const headers = authProvider ? await authProvider.getHeaders() : {};

      // HEAD to base url
      await fetch(`${baseUrl}/sap/opu/odata/`, {
        method: 'HEAD',
        headers,
        signal: AbortSignal.timeout(15000),
      });

      // GET $metadata
      let metadataAccessible = false;
      try {
        const metaRes = await fetch(`${baseUrl}/sap/opu/odata/$metadata`, {
          method: 'GET',
          headers: { ...headers, Accept: 'application/xml' },
          signal: AbortSignal.timeout(15000),
        });
        metadataAccessible = metaRes.ok;
      } catch { /* ignore */ }

      // CSRF
      let csrfSupport = false;
      try {
        const csrfRes = await fetch(`${baseUrl}/sap/opu/odata/`, {
          method: 'HEAD',
          headers: { ...headers, 'X-CSRF-Token': 'Fetch' },
          signal: AbortSignal.timeout(15000),
        });
        csrfSupport = !!csrfRes.headers.get('x-csrf-token');
      } catch { /* ignore */ }

      return {
        available: true,
        latencyMs: Date.now() - start,
        csrfSupport,
        metadataAccessible,
      };
    } catch (err) {
      return {
        available: false,
        latencyMs: Date.now() - start,
        csrfSupport: false,
        metadataAccessible: false,
        error: err.message,
      };
    }
  }

  // ── ADT connectivity ────────────────────────────────────────────────

  async checkAdtConnectivity() {
    if (this.mode === 'mock') {
      return this._mockAdtConnectivity();
    }

    const start = Date.now();
    try {
      const baseUrl = (this.adtConfig && this.adtConfig.baseUrl) || '';
      const username = (this.adtConfig && this.adtConfig.username) || '';
      const password = (this.adtConfig && this.adtConfig.password) || '';
      const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

      const makeHead = async (path) => {
        try {
          const res = await fetch(`${baseUrl}${path}`, {
            method: 'GET',
            headers: { Authorization: authHeader, Accept: 'application/xml' },
            signal: AbortSignal.timeout(15000),
          });
          return res.ok;
        } catch {
          return false;
        }
      };

      const discovery = await makeHead('/sap/bc/adt/discovery');
      const repository = await makeHead('/sap/bc/adt/repository/informationsystem/search?operation=quickSearch&query=dummy&maxResults=1');
      const atc = await makeHead('/sap/bc/adt/atc/runs');
      const cts = await makeHead('/sap/bc/adt/cts/transportrequests');
      const unitTest = await makeHead('/sap/bc/adt/abapunit/testruns');

      return {
        available: discovery,
        latencyMs: Date.now() - start,
        services: { repository, atc, cts, unitTest },
      };
    } catch (err) {
      return {
        available: false,
        latencyMs: Date.now() - start,
        services: { repository: false, atc: false, cts: false, unitTest: false },
        error: err.message,
      };
    }
  }

  // ── Authorization checks ────────────────────────────────────────────

  async checkAuthorizations() {
    if (this.mode === 'mock') {
      return this._mockAuthorizations();
    }

    const RfcClient = require('../rfc/client');
    let rfcClient;
    try {
      rfcClient = new RfcClient(this.rfcConfig, { retries: 0, timeout: 15000 });
      await rfcClient.open();

      const checks = [];
      for (const auth of REQUIRED_AUTHS) {
        let authorized = false;
        try {
          const result = await rfcClient.call('AUTHORITY_CHECK', {
            OBJECT: auth.object, FIELD1: '*', VALUE1: '*',
          });
          authorized = !result.RC || result.RC === 0;
        } catch {
          authorized = false;
        }
        checks.push({
          object: auth.object,
          description: auth.description,
          authorized,
          required: auth.required,
        });
      }

      const passed = checks.filter(c => c.authorized).length;
      const failed = checks.filter(c => !c.authorized).length;
      const warnings = checks.filter(c => !c.authorized && !c.required).length;

      return { checks, passed, failed, warnings };
    } catch (err) {
      return {
        checks: REQUIRED_AUTHS.map(a => ({
          object: a.object, description: a.description, authorized: false, required: a.required,
        })),
        passed: 0,
        failed: REQUIRED_AUTHS.length,
        warnings: 0,
        error: err.message,
      };
    } finally {
      if (rfcClient) {
        try { await rfcClient.close(); } catch { /* ignore */ }
      }
    }
  }

  // ── Table read access ───────────────────────────────────────────────

  async checkTableReadAccess() {
    if (this.mode === 'mock') {
      return this._mockTableReadAccess();
    }

    const RfcClient = require('../rfc/client');
    let rfcClient;
    try {
      rfcClient = new RfcClient(this.rfcConfig, { retries: 0, timeout: 15000 });
      await rfcClient.open();

      for (const fm of TABLE_READ_FMS) {
        try {
          const result = await rfcClient.call(fm, {
            QUERY_TABLE: 'T000',
            ROWCOUNT: 100,
            DELIMITER: '|',
          });

          const rows = result.DATA || [];
          return {
            functionModule: fm,
            accessible: true,
            clientsFound: rows.length,
          };
        } catch {
          // try next FM
        }
      }

      return {
        functionModule: null,
        accessible: false,
        clientsFound: 0,
        error: 'No table read function module available',
      };
    } catch (err) {
      return {
        functionModule: null,
        accessible: false,
        clientsFound: 0,
        error: err.message,
      };
    } finally {
      if (rfcClient) {
        try { await rfcClient.close(); } catch { /* ignore */ }
      }
    }
  }

  // ── ICF service check ───────────────────────────────────────────────

  async checkIcfServices() {
    if (this.mode === 'mock') {
      return this._mockIcfServices();
    }

    const baseUrl = (this.odataConfig && this.odataConfig.baseUrl) ||
                    (this.adtConfig && this.adtConfig.baseUrl) || '';
    const username = (this.adtConfig && this.adtConfig.username) || '';
    const password = (this.adtConfig && this.adtConfig.password) || '';
    const authHeader = username
      ? `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      : undefined;

    const results = [];

    for (const svc of ICF_SERVICES) {
      try {
        const headers = {};
        if (authHeader) headers.Authorization = authHeader;

        const res = await fetch(`${baseUrl}${svc.path}`, {
          method: 'HEAD',
          headers,
          signal: AbortSignal.timeout(10000),
        });

        results.push({
          path: svc.path,
          active: res.ok || res.status === 401 || res.status === 403,
          statusCode: res.status,
        });
      } catch {
        results.push({ path: svc.path, active: false, statusCode: 0 });
      }
    }

    return results;
  }

  // ── System discovery ────────────────────────────────────────────────

  async discoverSystem() {
    const [rfc, odata, adt] = await Promise.all([
      this.checkRfcConnectivity(),
      this.checkODataConnectivity(),
      this.checkAdtConnectivity(),
    ]);

    const result = {
      sid: null,
      release: null,
      clients: [],
      database: null,
      unicode: true,
      os: null,
      kernel: null,
      connectivity: { rfc, odata, adt },
    };

    if (rfc.available && rfc.systemInfo) {
      result.sid = rfc.systemInfo.sid;
      result.release = rfc.systemInfo.sapRelease;
      result.database = rfc.systemInfo.dbType;
      result.os = rfc.systemInfo.os;
      result.kernel = rfc.systemInfo.kernel;
    }

    // Try to get client list
    if (this.mode === 'mock') {
      result.clients = [
        { client: '000', description: 'SAP Reference Client' },
        { client: '001', description: 'Development Client' },
        { client: '100', description: 'Test Client' },
      ];
    } else if (rfc.available) {
      try {
        const tableRead = await this.checkTableReadAccess();
        if (tableRead.accessible) {
          result.clients = Array.from({ length: tableRead.clientsFound }, (_, i) => ({
            client: String(i).padStart(3, '0'),
            description: `Client ${String(i).padStart(3, '0')}`,
          }));
        }
      } catch { /* ignore */ }
    }

    return result;
  }

  // ── Quick check ─────────────────────────────────────────────────────

  async quickCheck() {
    const [rfc, odata, adt] = await Promise.all([
      this.checkRfcConnectivity().then(r => r.available),
      this.checkODataConnectivity().then(r => r.available),
      this.checkAdtConnectivity().then(r => r.available),
    ]);

    return {
      rfc,
      odata,
      adt,
      allGreen: rfc && odata && adt,
    };
  }

  // ── Validate all ────────────────────────────────────────────────────

  async validateAll() {
    const timestamp = new Date().toISOString();

    const [rfc, odata, adt, authorization, tableRead, icfServices] = await Promise.all([
      this.checkRfcConnectivity(),
      this.checkODataConnectivity(),
      this.checkAdtConnectivity(),
      this.checkAuthorizations(),
      this.checkTableReadAccess(),
      this.checkIcfServices(),
    ]);

    const system = {
      sid: rfc.systemInfo ? rfc.systemInfo.sid : null,
      client: this.rfcConfig ? this.rfcConfig.client : null,
      host: rfc.systemInfo ? rfc.systemInfo.host : null,
    };

    // Collect OData service info from ICF results
    const odataServices = icfServices.filter(s => s.path.includes('odata'));
    const icfNodes = icfServices;

    // Count totals
    let totalChecks = 0;
    let passed = 0;
    let failed = 0;
    let warnings = 0;

    // Connectivity checks (3)
    totalChecks += 3;
    if (rfc.available) passed++; else failed++;
    if (odata.available) passed++; else failed++;
    if (adt.available) passed++; else failed++;

    // Authorization checks
    totalChecks += authorization.checks.length;
    passed += authorization.passed;
    failed += authorization.checks.filter(c => !c.authorized && c.required).length;
    warnings += authorization.warnings;

    // Table read
    totalChecks += 1;
    if (tableRead.accessible) passed++; else failed++;

    // ICF services
    totalChecks += icfServices.length;
    const icfPassed = icfServices.filter(s => s.active).length;
    const icfFailed = icfServices.filter(s => !s.active).length;
    passed += icfPassed;
    warnings += icfFailed; // ICF failures are warnings, not hard failures

    // Determine readiness
    const requiredAuthsPassed = authorization.checks
      .filter(c => c.required)
      .every(c => c.authorized);

    const readyForExtraction = rfc.available && tableRead.accessible && requiredAuthsPassed;
    const readyForMigration = rfc.available && requiredAuthsPassed &&
      authorization.checks.filter(c => c.object === 'S_TCODE' || c.object === 'S_CTS_ADMI')
        .every(c => c.authorized);
    const readyForConfig = odata.available || adt.available;

    return {
      timestamp,
      system,
      connectivity: { rfc, odata, adt },
      authorization: {
        checks: authorization.checks,
        passed: authorization.passed,
        failed: authorization.failed,
        warnings: authorization.warnings,
      },
      services: {
        icfNodes,
        odataServices,
      },
      tableRead,
      summary: {
        totalChecks,
        passed,
        failed,
        warnings,
        readyForExtraction,
        readyForMigration,
        readyForConfig,
      },
    };
  }

  // ── Report generation ───────────────────────────────────────────────

  generateReport(validationResult) {
    const v = validationResult;
    const lines = [];

    lines.push('='.repeat(60));
    lines.push('SAP System Setup Validation Report');
    lines.push('='.repeat(60));
    lines.push(`Timestamp: ${v.timestamp}`);
    lines.push(`System SID: ${v.system.sid || 'N/A'}`);
    lines.push(`Client: ${v.system.client || 'N/A'}`);
    lines.push(`Host: ${v.system.host || 'N/A'}`);
    lines.push('');

    // Connectivity
    lines.push('-'.repeat(40));
    lines.push('CONNECTIVITY');
    lines.push('-'.repeat(40));
    lines.push(`  RFC:   ${v.connectivity.rfc.available ? '[PASS]' : '[FAIL]'}  ${v.connectivity.rfc.latencyMs}ms`);
    lines.push(`  OData: ${v.connectivity.odata.available ? '[PASS]' : '[FAIL]'}  ${v.connectivity.odata.latencyMs}ms`);
    lines.push(`  ADT:   ${v.connectivity.adt.available ? '[PASS]' : '[FAIL]'}  ${v.connectivity.adt.latencyMs}ms`);
    lines.push('');

    // Authorizations
    lines.push('-'.repeat(40));
    lines.push('AUTHORIZATIONS');
    lines.push('-'.repeat(40));
    for (const check of v.authorization.checks) {
      const status = check.authorized ? '[PASS]' : (check.required ? '[FAIL]' : '[WARN]');
      lines.push(`  ${status} ${check.object} — ${check.description}${check.required ? '' : ' (optional)'}`);
    }
    lines.push(`  Passed: ${v.authorization.passed}  Failed: ${v.authorization.failed}  Warnings: ${v.authorization.warnings}`);
    lines.push('');

    // ICF Services
    lines.push('-'.repeat(40));
    lines.push('ICF SERVICES');
    lines.push('-'.repeat(40));
    for (const svc of v.services.icfNodes) {
      lines.push(`  ${svc.active ? '[PASS]' : '[FAIL]'} ${svc.path}`);
    }
    lines.push('');

    // Table Read
    lines.push('-'.repeat(40));
    lines.push('TABLE READ ACCESS');
    lines.push('-'.repeat(40));
    if (v.tableRead.accessible) {
      lines.push(`  [PASS] Function module: ${v.tableRead.functionModule}`);
      lines.push(`  Clients found: ${v.tableRead.clientsFound}`);
    } else {
      lines.push(`  [FAIL] No table read function module available`);
    }
    lines.push('');

    // Recommendations
    lines.push('-'.repeat(40));
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(40));
    if (!v.connectivity.rfc.available) {
      lines.push('  - Enable RFC connectivity: check ashost, sysnr, and SAP Router configuration');
    }
    if (!v.connectivity.odata.available) {
      lines.push('  - Enable OData: activate ICF node /sap/opu/odata/ in SICF');
    }
    if (!v.connectivity.adt.available) {
      lines.push('  - Enable ADT: activate ICF node /sap/bc/adt/ in SICF');
    }
    const failedAuths = v.authorization.checks.filter(c => !c.authorized && c.required);
    for (const fa of failedAuths) {
      lines.push(`  - Grant authorization object ${fa.object} (${fa.description})`);
    }
    if (!v.tableRead.accessible) {
      lines.push('  - Ensure RFC_READ_TABLE (or equivalent) is accessible');
    }
    if (failedAuths.length === 0 && v.connectivity.rfc.available && v.connectivity.odata.available && v.tableRead.accessible) {
      lines.push('  No critical issues found.');
    }
    lines.push('');

    // Summary
    lines.push('-'.repeat(40));
    lines.push('SUMMARY');
    lines.push('-'.repeat(40));
    lines.push(`  Total checks: ${v.summary.totalChecks}`);
    lines.push(`  Passed: ${v.summary.passed}`);
    lines.push(`  Failed: ${v.summary.failed}`);
    lines.push(`  Warnings: ${v.summary.warnings}`);
    lines.push('');
    lines.push(`  Ready for extraction:  ${v.summary.readyForExtraction ? 'YES' : 'NO'}`);
    lines.push(`  Ready for migration:   ${v.summary.readyForMigration ? 'YES' : 'NO'}`);
    lines.push(`  Ready for config:      ${v.summary.readyForConfig ? 'YES' : 'NO'}`);
    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  // ══════════════════════════════════════════════════════════════════
  //  Mock implementations
  // ══════════════════════════════════════════════════════════════════

  _mockRfcConnectivity() {
    return {
      available: true,
      latencyMs: 42,
      systemInfo: {
        sid: 'DEV',
        sysId: 'DEV',
        host: 'sapdev01.example.com',
        dbType: 'HDB',
        kernel: '753',
        os: 'Linux',
        sapRelease: '756',
        component: 'SAP_ABA',
      },
    };
  }

  _mockODataConnectivity() {
    return {
      available: true,
      latencyMs: 85,
      csrfSupport: true,
      metadataAccessible: true,
    };
  }

  _mockAdtConnectivity() {
    return {
      available: true,
      latencyMs: 63,
      services: {
        repository: true,
        atc: true,
        cts: true,
        unitTest: true,
      },
    };
  }

  _mockAuthorizations() {
    const checks = REQUIRED_AUTHS.map(auth => ({
      object: auth.object,
      description: auth.description,
      authorized: auth.object !== 'S_BTCH_ADM', // realistic partial: batch admin missing
      required: auth.required,
    }));

    const passed = checks.filter(c => c.authorized).length;
    const failed = checks.filter(c => !c.authorized).length;
    const warnings = checks.filter(c => !c.authorized && !c.required).length;

    return { checks, passed, failed, warnings };
  }

  _mockTableReadAccess() {
    return {
      functionModule: 'RFC_READ_TABLE',
      accessible: true,
      clientsFound: 3,
    };
  }

  _mockIcfServices() {
    return ICF_SERVICES.map(svc => ({
      path: svc.path,
      active: svc.path !== '/sap/bc/soap/', // realistic: SOAP inactive
      statusCode: svc.path === '/sap/bc/soap/' ? 404 : 200,
    }));
  }
}

// Attach static properties
SetupWizard.REQUIRED_AUTHS = REQUIRED_AUTHS;
SetupWizard.ICF_SERVICES = ICF_SERVICES;
SetupWizard.TABLE_READ_FMS = TABLE_READ_FMS;

module.exports = SetupWizard;
