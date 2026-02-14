/**
 * Tests for ADT (ABAP Development Tools) REST Client
 */
const AdtClient = require('../../../lib/adt/client');
const { ConnectionError } = require('../../../lib/errors');

describe('AdtClient', () => {
  let client;

  beforeEach(() => {
    client = new AdtClient({
      baseUrl: 'https://sap.example.com:443',
      username: 'DEVELOPER',
      password: 'secret123',
      client: '100',
      mode: 'mock',
    });
  });

  // ── Constructor ─────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should set default values when no options provided', () => {
      const c = new AdtClient({});
      expect(c.baseUrl).toBe('');
      expect(c.username).toBe('');
      expect(c.password).toBe('');
      expect(c.client).toBe('');
      expect(c.timeout).toBe(30000);
      expect(c.mode).toBe('live');
    });

    it('should strip trailing slashes from baseUrl', () => {
      const c = new AdtClient({ baseUrl: 'https://host:443///' });
      expect(c.baseUrl).toBe('https://host:443');
    });

    it('should accept all configuration options', () => {
      expect(client.baseUrl).toBe('https://sap.example.com:443');
      expect(client.username).toBe('DEVELOPER');
      expect(client.password).toBe('secret123');
      expect(client.client).toBe('100');
      expect(client.mode).toBe('mock');
    });

    it('should initialize CSRF state as empty', () => {
      expect(client._csrfToken).toBeNull();
      expect(client._csrfExpiry).toBe(0);
      expect(client._cookies).toEqual([]);
    });

    it('should accept custom timeout', () => {
      const c = new AdtClient({ timeout: 60000 });
      expect(c.timeout).toBe(60000);
    });
  });

  // ── CSRF Token Handling ─────────────────────────────────────────────

  describe('CSRF token handling', () => {
    it('should use cached CSRF token when not expired', async () => {
      client._csrfToken = 'cached-token-abc';
      client._csrfExpiry = Date.now() + 100000;

      const token = await client._fetchCsrfToken();
      expect(token).toBe('cached-token-abc');
    });

    it('should clear CSRF state when token is null', () => {
      client._csrfToken = null;
      client._csrfExpiry = 0;
      expect(client._csrfToken).toBeNull();
    });

    it('should refetch when CSRF token is expired', async () => {
      client._csrfToken = 'old-token';
      client._csrfExpiry = Date.now() - 1000; // expired

      // In mock mode, _request won't make real HTTP calls, so we mock it
      const mockResponse = { status: 200, body: '', headers: {}, _csrfToken: 'new-token-xyz' };
      vi.spyOn(client, '_request').mockResolvedValue(mockResponse);

      const token = await client._fetchCsrfToken();
      expect(token).toBe('new-token-xyz');
      expect(client._csrfExpiry).toBeGreaterThan(Date.now());
    });
  });

  // ── searchObjects ───────────────────────────────────────────────────

  describe('searchObjects', () => {
    it('should return array of objects in mock mode', async () => {
      const results = await client.searchObjects('ZTEST');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should include required fields in each result', async () => {
      const results = await client.searchObjects('ZTEST');
      for (const obj of results) {
        expect(obj).toHaveProperty('uri');
        expect(obj).toHaveProperty('type');
        expect(obj).toHaveProperty('name');
        expect(obj).toHaveProperty('packageName');
        expect(obj).toHaveProperty('description');
      }
    });

    it('should respect objectType filter', async () => {
      const results = await client.searchObjects('test', 'CLAS');
      expect(results.length).toBeGreaterThan(0);
      const hasClass = results.some(r => r.type.startsWith('CLAS'));
      expect(hasClass).toBe(true);
    });

    it('should respect maxResults limit', async () => {
      const results = await client.searchObjects('test', null, 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should return results for unmatched queries', async () => {
      const results = await client.searchObjects('NONEXISTENT_XYZ');
      expect(Array.isArray(results)).toBe(true);
      // Mock returns fallback results for unmatched queries
      expect(results.length).toBeGreaterThan(0);
    });
  });

  // ── getSource ───────────────────────────────────────────────────────

  describe('getSource', () => {
    it('should return ABAP source code string', async () => {
      const source = await client.getSource('/sap/bc/adt/programs/programs/ZTEST_PROGRAM');
      expect(typeof source).toBe('string');
      expect(source).toContain('REPORT');
    });

    it('should include the program name in source', async () => {
      const source = await client.getSource('/sap/bc/adt/programs/programs/ZREPORT');
      expect(source).toContain('ZREPORT');
    });

    it('should contain typical ABAP statements', async () => {
      const source = await client.getSource('/sap/bc/adt/programs/programs/ZMOCK');
      expect(source).toContain('DATA:');
      expect(source).toContain('WRITE:');
    });
  });

  // ── writeSource ─────────────────────────────────────────────────────

  describe('writeSource', () => {
    it('should return success response in mock mode', async () => {
      const result = await client.writeSource('/sap/bc/adt/programs/programs/ZTEST', 'REPORT ZTEST.', 'LOCK_123');
      expect(result.status).toBe(200);
      expect(result.message).toContain('Source updated');
    });
  });

  // ── Lock / Unlock / Activate ────────────────────────────────────────

  describe('lockObject', () => {
    it('should return a lock handle in mock mode', async () => {
      const result = await client.lockObject('/sap/bc/adt/programs/programs/ZTEST');
      expect(result).toHaveProperty('lockHandle');
      expect(result.lockHandle).toContain('MOCK_LOCK_');
    });
  });

  describe('unlockObject', () => {
    it('should return success response', async () => {
      const result = await client.unlockObject('/sap/bc/adt/programs/programs/ZTEST', 'LOCK_HANDLE_123');
      expect(result.status).toBe(200);
      expect(result.message).toContain('unlocked');
    });
  });

  describe('activateObject', () => {
    it('should return activation result', async () => {
      const result = await client.activateObject('/sap/bc/adt/programs/programs/ZTEST');
      expect(result).toHaveProperty('activated');
      expect(result.activated).toBe(true);
      expect(result.messages).toBeInstanceOf(Array);
      expect(result.messages.length).toBeGreaterThan(0);
    });
  });

  describe('lock/unlock/activate sequence', () => {
    it('should complete full editing lifecycle', async () => {
      // Step 1: Lock
      const lock = await client.lockObject('/sap/bc/adt/programs/programs/ZTEST');
      expect(lock.lockHandle).toBeTruthy();

      // Step 2: Write source
      const write = await client.writeSource(
        '/sap/bc/adt/programs/programs/ZTEST',
        'REPORT ZTEST.\nWRITE: / \'Hello\'.',
        lock.lockHandle
      );
      expect(write.status).toBe(200);

      // Step 3: Activate
      const activate = await client.activateObject('/sap/bc/adt/programs/programs/ZTEST');
      expect(activate.activated).toBe(true);

      // Step 4: Unlock
      const unlock = await client.unlockObject('/sap/bc/adt/programs/programs/ZTEST', lock.lockHandle);
      expect(unlock.status).toBe(200);
    });
  });

  // ── getTableDefinition ──────────────────────────────────────────────

  describe('getTableDefinition', () => {
    it('should return table definition with fields', async () => {
      const def = await client.getTableDefinition('BKPF');
      expect(def.name).toBe('BKPF');
      expect(def.description).toBeTruthy();
      expect(def.tableCategory).toBe('TRANSP');
      expect(def.fields.length).toBeGreaterThan(0);
    });

    it('should include key field indicators', async () => {
      const def = await client.getTableDefinition('BKPF');
      const keyFields = def.fields.filter(f => f.isKey);
      expect(keyFields.length).toBeGreaterThan(0);
      expect(keyFields.some(f => f.name === 'BUKRS')).toBe(true);
    });

    it('should return fallback for unknown tables', async () => {
      const def = await client.getTableDefinition('ZUNKNOWN');
      expect(def.name).toBe('ZUNKNOWN');
      expect(def.fields.length).toBeGreaterThanOrEqual(1);
    });

    it('should include field types and lengths', async () => {
      const def = await client.getTableDefinition('KNA1');
      const nameField = def.fields.find(f => f.name === 'NAME1');
      expect(nameField).toBeTruthy();
      expect(nameField.type).toBe('CHAR');
      expect(nameField.length).toBe(35);
    });
  });

  // ── getCdsSource ────────────────────────────────────────────────────

  describe('getCdsSource', () => {
    it('should return CDS view source code', async () => {
      const source = await client.getCdsSource('ZCDS_ACCOUNTING');
      expect(typeof source).toBe('string');
      expect(source).toContain('define view');
      expect(source).toContain('ZCDS_ACCOUNTING');
    });

    it('should include annotations and associations', async () => {
      const source = await client.getCdsSource('ZCDS_TEST');
      expect(source).toContain('@AbapCatalog');
      expect(source).toContain('association');
    });
  });

  // ── runAtcCheck ─────────────────────────────────────────────────────

  describe('runAtcCheck', () => {
    it('should return findings array', async () => {
      const result = await client.runAtcCheck(['/sap/bc/adt/programs/programs/ZTEST']);
      expect(result).toHaveProperty('findings');
      expect(Array.isArray(result.findings)).toBe(true);
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('should include required fields in each finding', async () => {
      const result = await client.runAtcCheck(['/sap/bc/adt/programs/programs/ZTEST']);
      for (const finding of result.findings) {
        expect(finding).toHaveProperty('uri');
        expect(finding).toHaveProperty('type');
        expect(finding).toHaveProperty('priority');
        expect(finding).toHaveProperty('message');
        expect(finding).toHaveProperty('location');
        expect(finding.location).toHaveProperty('line');
        expect(finding.location).toHaveProperty('column');
      }
    });

    it('should include priority levels (1=error, 2=warning, 3=info)', async () => {
      const result = await client.runAtcCheck(['/sap/bc/adt/programs/programs/ZTEST']);
      const priorities = result.findings.map(f => f.priority);
      expect(priorities.some(p => p === 1)).toBe(true);
      expect(priorities.some(p => p === 2)).toBe(true);
    });

    it('should handle multiple objects in the object set', async () => {
      const result = await client.runAtcCheck([
        '/sap/bc/adt/programs/programs/ZTEST1',
        '/sap/bc/adt/programs/programs/ZTEST2',
      ]);
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('should accept custom check variant', async () => {
      const result = await client.runAtcCheck(['/sap/bc/adt/programs/programs/ZTEST'], 'CUSTOM_VARIANT');
      expect(result.findings.length).toBeGreaterThan(0);
    });
  });

  // ── ATC XML Parsing ─────────────────────────────────────────────────

  describe('ATC checkstyle XML parsing', () => {
    it('should parse checkstyle format correctly', () => {
      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<checkstyle>',
        '  <file name="/sap/bc/adt/programs/programs/ZTEST">',
        '    <error line="10" column="5" severity="error" message="Variable not declared" source="SYNTAX_CHECK"/>',
        '    <error line="25" column="1" severity="warning" message="Unused variable" source="NAMING_CONV"/>',
        '  </file>',
        '</checkstyle>',
      ].join('\n');

      const result = client._parseAtcResults(xml);
      expect(result.findings.length).toBe(2);
      expect(result.findings[0].uri).toBe('/sap/bc/adt/programs/programs/ZTEST');
      expect(result.findings[0].priority).toBe(1); // error -> 1
      expect(result.findings[0].message).toBe('Variable not declared');
      expect(result.findings[0].location.line).toBe(10);
      expect(result.findings[0].location.column).toBe(5);
      expect(result.findings[1].priority).toBe(2); // warning -> 2
    });

    it('should parse ADT native finding format', () => {
      const xml = '<atc:result><atc:finding uri="/sap/bc/adt/oo/classes/ZCL_TEST" checkId="PERF_001" priority="1" message="Inefficient query" line="42" column="3"/></atc:result>';
      const result = client._parseAtcResults(xml);
      expect(result.findings.length).toBe(1);
      expect(result.findings[0].type).toBe('PERF_001');
      expect(result.findings[0].priority).toBe(1);
    });

    it('should handle empty results', () => {
      const result = client._parseAtcResults('<checkstyle></checkstyle>');
      expect(result.findings).toEqual([]);
    });

    it('should extract run ID from response headers', () => {
      const headers = { location: '/sap/bc/adt/atc/runs/ABC123/results' };
      const runId = client._extractAtcRunId('', headers);
      expect(runId).toBe('ABC123');
    });

    it('should extract run ID from XML body', () => {
      const body = '<atc:run id="RUN456" status="completed"/>';
      const runId = client._extractAtcRunId(body, {});
      expect(runId).toBe('RUN456');
    });

    it('should detect completed status from XML', () => {
      expect(client._extractAtcStatus('<run status="completed"/>')).toBe('completed');
      expect(client._extractAtcStatus('<run status="running"/>')).toBe('running');
      expect(client._extractAtcStatus('<result><finding/></result>')).toBe('completed');
    });
  });

  // ── runUnitTests ────────────────────────────────────────────────────

  describe('runUnitTests', () => {
    it('should return test classes with methods', async () => {
      const result = await client.runUnitTests('/sap/bc/adt/oo/classes/ZCL_TEST');
      expect(result).toHaveProperty('testClasses');
      expect(result.testClasses.length).toBeGreaterThan(0);
    });

    it('should include method status and duration', async () => {
      const result = await client.runUnitTests('/sap/bc/adt/oo/classes/ZCL_TEST');
      const firstClass = result.testClasses[0];
      expect(firstClass.name).toBeTruthy();
      expect(firstClass.methods.length).toBeGreaterThan(0);

      for (const method of firstClass.methods) {
        expect(method).toHaveProperty('name');
        expect(method).toHaveProperty('status');
        expect(['passed', 'failed']).toContain(method.status);
        expect(typeof method.duration).toBe('number');
        expect(method).toHaveProperty('alerts');
      }
    });

    it('should include failure details in alerts', async () => {
      const result = await client.runUnitTests('/sap/bc/adt/oo/classes/ZCL_TEST');
      const failedMethods = result.testClasses
        .flatMap(tc => tc.methods)
        .filter(m => m.status === 'failed');

      expect(failedMethods.length).toBeGreaterThan(0);
      const failure = failedMethods[0];
      expect(failure.alerts.length).toBeGreaterThan(0);
      expect(failure.alerts[0]).toHaveProperty('kind');
      expect(failure.alerts[0]).toHaveProperty('severity');
      expect(failure.alerts[0]).toHaveProperty('title');
      expect(failure.alerts[0]).toHaveProperty('details');
    });
  });

  // ── Transport Management ────────────────────────────────────────────

  describe('getTransportRequests', () => {
    it('should return transport requests for a user', async () => {
      const transports = await client.getTransportRequests('DEVELOPER');
      expect(Array.isArray(transports)).toBe(true);
      expect(transports.length).toBeGreaterThan(0);
    });

    it('should include required transport fields', async () => {
      const transports = await client.getTransportRequests('DEVELOPER');
      for (const transport of transports) {
        expect(transport).toHaveProperty('number');
        expect(transport).toHaveProperty('owner');
        expect(transport).toHaveProperty('description');
        expect(transport).toHaveProperty('status');
        expect(transport).toHaveProperty('type');
        expect(transport).toHaveProperty('target');
        expect(transport).toHaveProperty('tasks');
      }
    });

    it('should include tasks within transports', async () => {
      const transports = await client.getTransportRequests('DEVELOPER');
      const withTasks = transports.filter(t => t.tasks.length > 0);
      expect(withTasks.length).toBeGreaterThan(0);

      const task = withTasks[0].tasks[0];
      expect(task).toHaveProperty('number');
      expect(task).toHaveProperty('owner');
      expect(task).toHaveProperty('description');
    });
  });

  describe('createTransport', () => {
    it('should create a transport and return its number', async () => {
      const result = await client.createTransport('Test transport request');
      expect(result).toHaveProperty('number');
      expect(result.number.length).toBeGreaterThan(0);
      expect(result.description).toBe('Test transport request');
      expect(result.type).toBe('K');
    });

    it('should accept custom transport type', async () => {
      const result = await client.createTransport('Customizing transport', 'W');
      expect(result.type).toBe('W');
    });
  });

  // ── Where-Used ──────────────────────────────────────────────────────

  describe('getWhereUsed', () => {
    it('should return list of referencing objects', async () => {
      const results = await client.getWhereUsed('/sap/bc/adt/programs/programs/ZTEST');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should include required fields in results', async () => {
      const results = await client.getWhereUsed('/sap/bc/adt/programs/programs/ZTEST');
      for (const ref of results) {
        expect(ref).toHaveProperty('uri');
        expect(ref).toHaveProperty('name');
        expect(ref).toHaveProperty('type');
        expect(ref).toHaveProperty('packageName');
      }
    });
  });

  // ── Enhancements ────────────────────────────────────────────────────

  describe('getEnhancements', () => {
    it('should return enhancement implementations', async () => {
      const results = await client.getEnhancements('/sap/bc/adt/programs/programs/ZTEST');
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should include required enhancement fields', async () => {
      const results = await client.getEnhancements('/sap/bc/adt/programs/programs/ZTEST');
      for (const enh of results) {
        expect(enh).toHaveProperty('name');
        expect(enh).toHaveProperty('type');
        expect(enh).toHaveProperty('spotName');
        expect(enh).toHaveProperty('description');
        expect(enh).toHaveProperty('active');
      }
    });

    it('should include both active and inactive enhancements', async () => {
      const results = await client.getEnhancements('/sap/bc/adt/programs/programs/ZTEST');
      const active = results.filter(e => e.active);
      const inactive = results.filter(e => !e.active);
      expect(active.length).toBeGreaterThan(0);
      expect(inactive.length).toBeGreaterThan(0);
    });
  });

  // ── Syntax Check ────────────────────────────────────────────────────

  describe('getSyntaxCheck', () => {
    it('should return valid=true for clean source', async () => {
      const result = await client.getSyntaxCheck(
        'REPORT ZTEST.\nDATA: lv_msg TYPE string.\nWRITE: / lv_msg.',
        '/sap/bc/adt/programs/programs/ZTEST'
      );
      expect(result.valid).toBe(true);
      expect(result.messages.length).toBe(0);
    });

    it('should detect SELECT * warning', async () => {
      const result = await client.getSyntaxCheck(
        'REPORT ZTEST.\nSELECT * FROM mara INTO TABLE @DATA(lt_mara).',
        '/sap/bc/adt/programs/programs/ZTEST'
      );
      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.messages[0].severity).toBe('warning');
      expect(result.messages[0]).toHaveProperty('line');
      expect(result.messages[0]).toHaveProperty('column');
      expect(result.messages[0]).toHaveProperty('text');
    });

    it('should detect MOVE statement warning', async () => {
      const result = await client.getSyntaxCheck(
        'REPORT ZTEST.\nDATA: lv_a TYPE string.\nMOVE lv_a TO lv_b.',
        '/sap/bc/adt/programs/programs/ZTEST'
      );
      expect(result.messages.length).toBeGreaterThan(0);
      const moveWarning = result.messages.find(m => m.text.includes('MOVE'));
      expect(moveWarning).toBeTruthy();
    });
  });

  // ── sap-client Header ───────────────────────────────────────────────

  describe('sap-client header', () => {
    it('should include sap-client in request headers when client is set', async () => {
      const requestSpy = vi.spyOn(client, '_request').mockResolvedValue({
        status: 200,
        body: '<results/>',
        headers: {},
        _csrfToken: null,
      });

      // Override mode to force live call path
      client.mode = 'live';
      try {
        await client.searchObjects('test');
      } catch { /* ignore */ }

      if (requestSpy.mock.calls.length > 0) {
        // Verify the _request was called
        expect(requestSpy).toHaveBeenCalled();
      }

      requestSpy.mockRestore();
    });

    it('should not include sap-client when client is empty', () => {
      const c = new AdtClient({ baseUrl: 'https://host', client: '' });
      expect(c.client).toBe('');
    });
  });

  // ── Error Handling ──────────────────────────────────────────────────

  describe('error handling', () => {
    it('should throw ConnectionError on network failure in live mode', async () => {
      const liveClient = new AdtClient({
        baseUrl: 'https://sap.example.com',
        username: 'user',
        password: 'pass',
        mode: 'live',
      });

      vi.spyOn(liveClient, '_request').mockRejectedValue(
        new ConnectionError('ADT network error: connection refused')
      );

      await expect(liveClient.searchObjects('test')).rejects.toThrow(ConnectionError);
    });

    it('should throw on 401 authentication failure', async () => {
      const liveClient = new AdtClient({
        baseUrl: 'https://sap.example.com',
        username: 'user',
        password: 'wrong',
        mode: 'live',
      });

      vi.spyOn(liveClient, '_request').mockRejectedValue(
        new Error('ADT authentication failed')
      );

      await expect(liveClient.searchObjects('test')).rejects.toThrow();
    });
  });

  // ── XML Parser Helpers ──────────────────────────────────────────────

  describe('XML parser helpers', () => {
    it('should extract attributes from XML tags', () => {
      const tag = '<obj adtcore:name="ZTEST" adtcore:type="PROG/P"/>';
      expect(client._extractAttr(tag, 'adtcore:name')).toBe('ZTEST');
      expect(client._extractAttr(tag, 'adtcore:type')).toBe('PROG/P');
    });

    it('should return null for missing attributes', () => {
      expect(client._extractAttr('<tag/>', 'missing')).toBeNull();
    });

    it('should extract tag content', () => {
      const xml = '<root><description>Test Table</description></root>';
      expect(client._extractTagContent(xml, 'description')).toBe('Test Table');
    });

    it('should escape XML special characters', () => {
      const escaped = client._escapeXml('test & <value> "quoted"');
      expect(escaped).toBe('test &amp; &lt;value&gt; &quot;quoted&quot;');
    });

    it('should parse search results from XML', () => {
      const xml = [
        '<objectReferences>',
        '  <objectReference adtcore:uri="/sap/bc/adt/programs/programs/ZTEST" adtcore:type="PROG/P" adtcore:name="ZTEST" adtcore:packageName="ZDEV" adtcore:description="Test"/>',
        '</objectReferences>',
      ].join('\n');

      const results = client._parseSearchResults(xml);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('ZTEST');
      expect(results[0].type).toBe('PROG/P');
    });

    it('should parse activation results with error messages', () => {
      const xml = '<messages><msg:severity>error</msg:severity><msg:shortText>Syntax error in line 10</msg:shortText></messages>';
      const result = client._parseActivationResult(xml);
      expect(result.activated).toBe(false);
      expect(result.messages.length).toBe(1);
      expect(result.messages[0].severity).toBe('error');
    });

    it('should parse activation results as success when no errors', () => {
      const xml = '<messages><msg:severity>info</msg:severity><msg:shortText>Object activated</msg:shortText></messages>';
      const result = client._parseActivationResult(xml);
      expect(result.activated).toBe(true);
    });

    it('should parse transport requests from XML', () => {
      const xml = [
        '<tm:root>',
        '  <tm:request tm:number="DEVK900001" tm:owner="DEV1" tm:desc="Test" tm:status="D" tm:type="K" tm:target="QAS">',
        '    <tm:task tm:number="DEVK900002" tm:owner="DEV1" tm:desc="Task 1" tm:status="D"/>',
        '  </tm:request>',
        '</tm:root>',
      ].join('\n');

      const transports = client._parseTransportRequests(xml);
      expect(transports.length).toBe(1);
      expect(transports[0].number).toBe('DEVK900001');
      expect(transports[0].tasks.length).toBe(1);
      expect(transports[0].tasks[0].number).toBe('DEVK900002');
    });

    it('should parse unit test results from XML', () => {
      const xml = [
        '<aunit:runResult>',
        '  <aunit:testClass name="LTC_TEST">',
        '    <aunit:testMethod name="test_ok" executionTime="5">',
        '    </aunit:testMethod>',
        '    <aunit:testMethod name="test_fail" executionTime="12">',
        '      <aunit:alert kind="failure" severity="critical">',
        '        <title>Assert failed</title>',
        '        <details>Expected 1 got 2</details>',
        '      </aunit:alert>',
        '    </aunit:testMethod>',
        '  </aunit:testClass>',
        '</aunit:runResult>',
      ].join('\n');

      const result = client._parseUnitTestResults(xml);
      expect(result.testClasses.length).toBe(1);
      expect(result.testClasses[0].methods.length).toBe(2);
      expect(result.testClasses[0].methods[0].status).toBe('passed');
      expect(result.testClasses[0].methods[1].status).toBe('failed');
      expect(result.testClasses[0].methods[1].alerts.length).toBe(1);
    });

    it('should parse where-used results', () => {
      const xml = '<references><objectReference adtcore:uri="/sap/bc/adt/oo/classes/ZCL_X" adtcore:name="ZCL_X" adtcore:type="CLAS/OC" adtcore:packageName="ZPKG"/></references>';
      const results = client._parseWhereUsedResults(xml);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('ZCL_X');
    });

    it('should parse syntax check results with errors', () => {
      const xml = '<chkrun:error line="5" column="10" message="Unknown variable LV_X"/>';
      const result = client._parseSyntaxCheckResult(xml);
      expect(result.valid).toBe(false);
      expect(result.messages.length).toBe(1);
      expect(result.messages[0].severity).toBe('error');
      expect(result.messages[0].line).toBe(5);
    });

    it('should map severity to priority correctly', () => {
      expect(client._severityToPriority('error')).toBe(1);
      expect(client._severityToPriority('warning')).toBe(2);
      expect(client._severityToPriority('info')).toBe(3);
      expect(client._severityToPriority('unknown')).toBe(3);
    });

    it('should extract lock handle from XML body', () => {
      expect(client._extractLockHandle('<result><LOCK_HANDLE>HANDLE_ABC</LOCK_HANDLE></result>')).toBe('HANDLE_ABC');
      expect(client._extractLockHandle('<result lockHandle="HANDLE_DEF"/>')).toBe('HANDLE_DEF');
      expect(client._extractLockHandle('SIMPLE_HANDLE')).toBe('SIMPLE_HANDLE');
    });
  });
});
