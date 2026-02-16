/**
 * Tests for MCP Server
 */
const McpServer = require('../../../lib/mcp/server');

describe('McpServer', () => {
  let server;

  beforeEach(() => {
    server = new McpServer({ mode: 'mock' });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Message Routing
  // ─────────────────────────────────────────────────────────────────────────

  describe('handleMessage', () => {
    it('should route initialize method', async () => {
      const result = await server.handleMessage({
        id: 1, method: 'initialize', params: { clientInfo: { name: 'test' } },
      });
      expect(result.result.protocolVersion).toBeDefined();
      expect(result.result.serverInfo.name).toBe('sapconnect-mcp');
    });

    it('should route tools/list method', async () => {
      const result = await server.handleMessage({ id: 2, method: 'tools/list' });
      expect(result.result.tools).toBeDefined();
      expect(Array.isArray(result.result.tools)).toBe(true);
    });

    it('should route tools/call method', async () => {
      const result = await server.handleMessage({
        id: 3, method: 'tools/call', params: { name: 'getSystemInfo', arguments: {} },
      });
      expect(result.result.content).toBeDefined();
    });

    it('should route resources/list method', async () => {
      const result = await server.handleMessage({ id: 4, method: 'resources/list' });
      expect(result.result.resources).toBeDefined();
    });

    it('should route resources/read method', async () => {
      const result = await server.handleMessage({
        id: 5, method: 'resources/read', params: { uri: 'sap://system/info' },
      });
      expect(result.result.contents).toBeDefined();
    });

    it('should route ping method', async () => {
      const result = await server.handleMessage({ id: 6, method: 'ping' });
      expect(result.result).toEqual({});
    });

    it('should return error for unknown method', async () => {
      const result = await server.handleMessage({ id: 7, method: 'unknown/method' });
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32601);
    });

    it('should return error for null message', async () => {
      const result = await server.handleMessage(null);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32600);
    });

    it('should return error for message without method', async () => {
      const result = await server.handleMessage({ id: 8 });
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32600);
    });

    it('should handle initialized notification with id', async () => {
      const result = await server.handleMessage({ id: 9, method: 'initialized' });
      expect(result.result).toEqual({});
    });

    it('should return null for initialized notification without id', async () => {
      const result = await server.handleMessage({ method: 'initialized' });
      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Initialize
  // ─────────────────────────────────────────────────────────────────────────

  describe('_handleInitialize', () => {
    it('should return server capabilities with tools', async () => {
      const result = await server._handleInitialize({ clientInfo: { name: 'test-client' } });
      expect(result.capabilities.tools).toBeDefined();
      expect(result.capabilities.resources).toBeDefined();
      expect(result.serverInfo.name).toBe('sapconnect-mcp');
      expect(result.serverInfo.version).toBe('1.0.0');
      expect(result.protocolVersion).toBe('2024-11-05');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Tools List
  // ─────────────────────────────────────────────────────────────────────────

  describe('_handleToolsList', () => {
    it('should return exactly 108 tools', async () => {
      const result = await server._handleToolsList();
      expect(result.tools).toHaveLength(108);
    });

    it('should include all expected tool names', async () => {
      const result = await server._handleToolsList();
      const names = result.tools.map(t => t.name);
      expect(names).toContain('searchObject');
      expect(names).toContain('getSource');
      expect(names).toContain('writeSource');
      expect(names).toContain('getTableStructure');
      expect(names).toContain('getTableData');
      expect(names).toContain('getRelationships');
      expect(names).toContain('getFunctionInterface');
      expect(names).toContain('callBAPI');
      expect(names).toContain('runATCCheck');
      expect(names).toContain('manageTransport');
      expect(names).toContain('getCDSView');
      expect(names).toContain('getSystemInfo');
    });

    it('should have inputSchema for each tool', async () => {
      const result = await server._handleToolsList();
      for (const tool of result.tools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.description).toBeDefined();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Tool Calls (mock mode)
  // ─────────────────────────────────────────────────────────────────────────

  describe('_handleToolsCall (mock)', () => {
    it('searchObject returns results', async () => {
      const result = await server._handleToolsCall('searchObject', { query: 'Z_TEST' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.results).toBeDefined();
      expect(Array.isArray(parsed.results)).toBe(true);
      expect(parsed.query).toBe('Z_TEST');
    });

    it('searchObject filters by objectType', async () => {
      const result = await server._handleToolsCall('searchObject', { query: 'Z_TEST', objectType: 'PROG' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.results.every(r => r.type === 'PROG')).toBe(true);
    });

    it('getSource returns source code', async () => {
      const result = await server._handleToolsCall('getSource', { objectUri: '/sap/bc/adt/programs/programs/Z_TEST' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.source).toBeDefined();
      expect(parsed.language).toBe('abap');
      expect(parsed.uri).toBe('/sap/bc/adt/programs/programs/Z_TEST');
    });

    it('writeSource returns save confirmation', async () => {
      const result = await server._handleToolsCall('writeSource', {
        objectUri: '/sap/bc/adt/programs/programs/Z_TEST',
        source: 'REPORT z_test.',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe('saved');
      expect(parsed.lockToken).toBeDefined();
    });

    it('getTableStructure returns field metadata', async () => {
      const result = await server._handleToolsCall('getTableStructure', { tableName: 'MARA' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.tableName).toBe('MARA');
      expect(parsed.fields).toBeDefined();
      expect(parsed.fields.length).toBeGreaterThan(0);
      expect(parsed.fields[0].name).toBeDefined();
      expect(parsed.fields[0].type).toBeDefined();
    });

    it('getTableData returns rows', async () => {
      const result = await server._handleToolsCall('getTableData', { tableName: 'MARA', maxRows: 2 });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.rows).toBeDefined();
      expect(parsed.rows.length).toBeLessThanOrEqual(2);
      expect(parsed.tableName).toBe('MARA');
    });

    it('getRelationships returns foreign keys', async () => {
      const result = await server._handleToolsCall('getRelationships', { tableName: 'MARA' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.tableName).toBe('MARA');
      expect(parsed.relationships).toBeDefined();
      expect(parsed.relationships.length).toBeGreaterThan(0);
      expect(parsed.relationships[0].fromTable).toBeDefined();
      expect(parsed.relationships[0].toTable).toBeDefined();
    });

    it('getFunctionInterface returns parameters', async () => {
      const result = await server._handleToolsCall('getFunctionInterface', { functionModule: 'BAPI_MATERIAL_GETDETAIL' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.name).toBe('BAPI_MATERIAL_GETDETAIL');
      expect(parsed.imports).toBeDefined();
      expect(parsed.exports).toBeDefined();
      expect(parsed.tables).toBeDefined();
    });

    it('callBAPI returns execution result', async () => {
      const result = await server._handleToolsCall('callBAPI', {
        functionModule: 'BAPI_MATERIAL_GETDETAIL',
        imports: { MATERIAL: 'MAT-001' },
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.functionModule).toBe('BAPI_MATERIAL_GETDETAIL');
      expect(parsed.result).toBeDefined();
      expect(parsed.executionTime).toBeDefined();
    });

    it('callBAPI with commit flag', async () => {
      const result = await server._handleToolsCall('callBAPI', {
        functionModule: 'BAPI_MATERIAL_SAVEDATA',
        withCommit: true,
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.committed).toBe(true);
    });

    it('runATCCheck returns findings', async () => {
      const result = await server._handleToolsCall('runATCCheck', { objectSet: 'Z_TEST' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.objectSet).toBe('Z_TEST');
      expect(parsed.findings).toBeDefined();
      expect(parsed.summary).toBeDefined();
      expect(parsed.status).toBe('completed');
    });

    it('manageTransport create returns new transport', async () => {
      const result = await server._handleToolsCall('manageTransport', {
        action: 'create', description: 'Test transport',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.action).toBe('create');
      expect(parsed.transportNumber).toBeDefined();
      expect(parsed.status).toBe('modifiable');
    });

    it('manageTransport release returns released status', async () => {
      const result = await server._handleToolsCall('manageTransport', {
        action: 'release', transportNumber: 'DEVK900123',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe('released');
    });

    it('manageTransport list returns transport list', async () => {
      const result = await server._handleToolsCall('manageTransport', { action: 'list' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.transports).toBeDefined();
      expect(parsed.transports.length).toBeGreaterThan(0);
    });

    it('manageTransport check returns transport details', async () => {
      const result = await server._handleToolsCall('manageTransport', {
        action: 'check', transportNumber: 'DEVK900121',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.action).toBe('check');
      expect(parsed.objects).toBeDefined();
    });

    it('getCDSView returns CDS source and annotations', async () => {
      const result = await server._handleToolsCall('getCDSView', { cdsName: 'I_PRODUCT' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.cdsName).toBe('I_PRODUCT');
      expect(parsed.source).toContain('define view');
      expect(parsed.annotations).toBeDefined();
      expect(parsed.associations).toBeDefined();
    });

    it('getSystemInfo returns system details', async () => {
      const result = await server._handleToolsCall('getSystemInfo', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.systemId).toBe('S4H');
      expect(parsed.release).toBeDefined();
      expect(parsed.database).toBe('HDB');
      expect(parsed.components).toBeDefined();
      expect(parsed.components.length).toBeGreaterThan(0);
    });

    it('unknown tool throws error', async () => {
      await expect(server._handleToolsCall('nonExistentTool', {}))
        .rejects.toThrow('Unknown tool');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Resources
  // ─────────────────────────────────────────────────────────────────────────

  describe('_handleResourcesList', () => {
    it('should return 4 resource definitions', async () => {
      const result = await server._handleResourcesList();
      expect(result.resources).toHaveLength(4);
    });

    it('should include sap://system/info resource', async () => {
      const result = await server._handleResourcesList();
      const sysInfo = result.resources.find(r => r.uri === 'sap://system/info');
      expect(sysInfo).toBeDefined();
      expect(sysInfo.mimeType).toBe('application/json');
    });
  });

  describe('_handleResourcesRead', () => {
    it('should read system info resource', async () => {
      const result = await server._handleResourcesRead('sap://system/info');
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].mimeType).toBe('application/json');
      const data = JSON.parse(result.contents[0].text);
      expect(data.systemId).toBeDefined();
    });

    it('should read object source resource', async () => {
      const result = await server._handleResourcesRead('sap://objects/PROG/Z_TEST');
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].mimeType).toBe('text/plain');
      expect(result.contents[0].text).toContain('REPORT');
    });

    it('should read table structure resource', async () => {
      const result = await server._handleResourcesRead('sap://tables/MARA/structure');
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].mimeType).toBe('application/json');
      const data = JSON.parse(result.contents[0].text);
      expect(data.fields).toBeDefined();
    });

    it('should read table data resource', async () => {
      const result = await server._handleResourcesRead('sap://tables/MARA/data');
      expect(result.contents).toHaveLength(1);
      const data = JSON.parse(result.contents[0].text);
      expect(data.rows).toBeDefined();
    });

    it('should throw for unknown resource URI', async () => {
      await expect(server._handleResourcesRead('sap://unknown/thing'))
        .rejects.toThrow('Unknown resource URI');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // JSON-RPC Error Handling
  // ─────────────────────────────────────────────────────────────────────────

  describe('JSON-RPC error handling', () => {
    it('should return error for tools/call without name', async () => {
      const result = await server.handleMessage({
        id: 10, method: 'tools/call', params: {},
      });
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32602);
    });

    it('should return error for resources/read without uri', async () => {
      const result = await server.handleMessage({
        id: 11, method: 'resources/read', params: {},
      });
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32602);
    });

    it('should include jsonrpc 2.0 in success responses', async () => {
      const result = await server.handleMessage({ id: 12, method: 'ping' });
      expect(result.jsonrpc).toBe('2.0');
      expect(result.id).toBe(12);
    });

    it('should include jsonrpc 2.0 in error responses', async () => {
      const result = await server.handleMessage({ id: 13, method: 'bad/method' });
      expect(result.jsonrpc).toBe('2.0');
      expect(result.id).toBe(13);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Stdio Line Processing
  // ─────────────────────────────────────────────────────────────────────────

  describe('processLine', () => {
    it('should parse valid JSON-RPC and return response', async () => {
      const line = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' });
      const result = await server.processLine(line);
      expect(result.jsonrpc).toBe('2.0');
      expect(result.result).toEqual({});
    });

    it('should return parse error for invalid JSON', async () => {
      const result = await server.processLine('not valid json{{{');
      expect(result.error.code).toBe(-32700);
      expect(result.error.message).toContain('Parse error');
    });

    it('should return error for missing jsonrpc field', async () => {
      const line = JSON.stringify({ id: 1, method: 'ping' });
      const result = await server.processLine(line);
      expect(result.error.code).toBe(-32600);
    });

    it('should process tools/list via line', async () => {
      const line = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
      const result = await server.processLine(line);
      expect(result.result.tools).toHaveLength(108);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ADT Path Mapping
  // ─────────────────────────────────────────────────────────────────────────

  describe('_typeToAdtPath', () => {
    it('should map PROG to programs/programs', () => {
      expect(server._typeToAdtPath('PROG')).toBe('programs/programs');
    });

    it('should map CLAS to oo/classes', () => {
      expect(server._typeToAdtPath('CLAS')).toBe('oo/classes');
    });

    it('should map DDLS to ddic/ddl/sources', () => {
      expect(server._typeToAdtPath('DDLS')).toBe('ddic/ddl/sources');
    });

    it('should provide fallback for unknown types', () => {
      expect(server._typeToAdtPath('XYZZ')).toBe('repository/xyzz');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Constructor Options
  // ─────────────────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const s = new McpServer();
      expect(s.mode).toBe('mock');
    });

    it('should accept live mode with gateway', () => {
      const s = new McpServer({ mode: 'live', sapGateway: {} });
      expect(s.mode).toBe('live');
      expect(s.sapGateway).toBeDefined();
    });
  });
});
