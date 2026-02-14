const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const SapConnection = require('../lib/sap-connection');
const Logger = require('../lib/logger');

/**
 * SapGateway - Abstraction layer for SAP RFC/API calls
 *
 * Three modes:
 * 1. vsp mode: uses vibing-steampunk CLI for live SAP access via ADT
 * 2. Live mode: connects to a real SAP system via OData APIs
 * 3. Mock mode (default): reads from mock-responses.json
 */
class SapGateway {
  constructor(options = {}) {
    this.vspPath = this._resolveVspPath(options.vspPath);
    this.vspSystem = options.vspSystem || process.env.VSP_SYSTEM || null;

    if (this.vspPath) {
      this.mode = 'vsp';
    } else if (options.system) {
      this.mode = 'live';
    } else {
      this.mode = 'mock';
    }

    this.system = options.system || null;
    this.username = options.username || process.env.SAP_USERNAME;
    this.password = options.password || process.env.SAP_PASSWORD;
    this.verbose = options.verbose || false;
    this.mockData = null;
    this._log = new Logger('gateway', { level: this.verbose ? 'debug' : 'info' });

    // Live mode: initialize SAP connection
    this._connection = null;
    this._odataClient = null;
    if (this.mode === 'live' && this.system) {
      this._connection = new SapConnection({
        name: 'gateway-live',
        baseUrl: this.system,
        authProvider: this._buildLiveAuth(options),
      });
    }
  }

  /** Resolve vsp binary path from explicit arg, env var, or null */
  _resolveVspPath(explicitPath) {
    const candidate = explicitPath || process.env.VSP_PATH || null;
    if (!candidate) return null;
    if (!fs.existsSync(candidate)) {
      const earlyLog = new Logger('gateway', { level: 'info' });
      earlyLog.warn(`vsp binary not found at: ${candidate}`);
      earlyLog.warn('Install from: https://github.com/oisee/vibing-steampunk');
      earlyLog.warn('Falling back to mock mode.');
      return null;
    }
    return candidate;
  }

  /** Execute vsp CLI and return stdout */
  _callVsp(args) {
    const cmdArgs = [];
    if (this.vspSystem) {
      cmdArgs.push('-s', this.vspSystem);
    }
    cmdArgs.push(...args);

    this._log.debug(`vsp ${cmdArgs.join(' ')}`);

    const result = spawnSync(this.vspPath, cmdArgs, {
      encoding: 'utf8',
      timeout: 30000,
    });

    if (result.error) {
      throw new Error(`vsp execution failed: ${result.error.message}`);
    }
    if (result.status !== 0) {
      const stderr = (result.stderr || '').trim();
      throw new Error(`vsp exited with code ${result.status}: ${stderr}`);
    }
    return (result.stdout || '').trim();
  }

  /** Log that a method requires MCP mode and fall back to mock */
  _vspNotSupported(method) {
    this._log.warn(`vsp CLI does not support ${method}.`);
    this._log.info('For full capability, use vsp as an MCP server in your AI assistant.');
    this._log.info('See .mcp.json.example for configuration.');
    this._log.warn('Falling back to mock data.');
  }

  /** Load mock data lazily */
  _loadMockData() {
    if (!this.mockData) {
      const mockPath = path.join(__dirname, 'mock-responses.json');
      const raw = fs.readFileSync(mockPath, 'utf8');
      this.mockData = JSON.parse(raw);
    }
    return this.mockData;
  }

  /** Build auth provider for live mode from constructor options */
  _buildLiveAuth(options) {
    const { BasicAuthProvider } = require('../lib/odata/auth');
    const user = options.username || process.env.SAP_USERNAME;
    const pass = options.password || process.env.SAP_PASSWORD;
    if (user && pass) {
      return new BasicAuthProvider(user, pass);
    }
    // Fallback: no auth (will fail on real systems, but won't crash constructor)
    return { getHeaders: async () => ({}), getAgent: () => null };
  }

  /** Get or initialize the live OData client */
  async _getLiveClient() {
    if (!this._odataClient && this._connection) {
      this._odataClient = await this._connection.connect();
    }
    return this._odataClient;
  }

  /** Fall back to mock with a warning when live call fails */
  _liveFallback(method, err) {
    this._log.warn(`Live ${method} failed, falling back to mock`, { error: err.message });
  }

  async readAbapSource(objectName, objectType) {
    this._log.debug(`read_abap_source: ${objectName} (${objectType || 'auto'})`);

    if (this.mode === 'vsp') {
      try {
        const type = objectType || 'CLAS';
        const source = this._callVsp(['source', type, objectName]);
        return {
          object_name: objectName,
          object_type: type,
          source,
        };
      } catch (err) {
        return { error: `vsp read failed: ${err.message}` };
      }
    }

    if (this.mode === 'live') {
      try {
        const client = await this._getLiveClient();
        const type = objectType || 'CLAS';
        const typePath = type === 'CLAS' ? 'classes' : type === 'PROG' ? 'programs/programs' : 'programs/includes';
        const adtPath = `/sap/bc/adt/${typePath}/${objectName.toLowerCase()}/source/main`;
        const source = await client.get(adtPath, {});
        return { object_name: objectName, object_type: type, source: typeof source === 'string' ? source : JSON.stringify(source) };
      } catch (err) {
        this._liveFallback('readAbapSource', err);
      }
    }
    const data = this._loadMockData();
    const source = data.abapSources[objectName];
    if (!source) {
      return { error: `Object ${objectName} not found in repository` };
    }
    return {
      object_name: objectName,
      object_type: source.objectType,
      package: source.package,
      description: source.description,
      source: source.source.join('\n'),
    };
  }

  async writeAbapSource(objectName, source, objectType, packageName) {
    this._log.debug(`write_abap_source: ${objectName} -> ${packageName || 'default'}`);

    if (this.mode === 'vsp') {
      this._vspNotSupported('write_abap_source');
    }
    if (this.mode === 'live') {
      try {
        const client = await this._getLiveClient();
        const type = objectType || 'CLAS';
        const typePath = type === 'CLAS' ? 'classes' : 'programs/includes';
        const adtPath = `/sap/bc/adt/${typePath}/${objectName.toLowerCase()}/source/main`;
        await client.patch(adtPath, source);
        return { object_name: objectName, object_type: type, package: packageName || '$TMP', status: 'SAVED', lines: source ? source.split('\n').length : 0 };
      } catch (err) {
        this._liveFallback('writeAbapSource', err);
      }
    }
    return {
      object_name: objectName,
      object_type: objectType || 'CLAS',
      package: packageName || '$TMP',
      status: 'SAVED',
      lines: source ? source.split('\n').length : 0,
    };
  }

  async listObjects(packageName) {
    this._log.debug(`list_objects: ${packageName}`);

    if (this.mode === 'vsp') {
      this._vspNotSupported('list_objects');
    }
    if (this.mode === 'live') {
      try {
        const client = await this._getLiveClient();
        const data = await client.get('/sap/bc/adt/repository/informationsystem/search', {
          operation: 'quickSearch',
          query: `package:${packageName}`,
          maxResults: '200',
        });
        const objects = Array.isArray(data) ? data : (data.d && data.d.results) || [];
        return { package: packageName, object_count: objects.length, objects };
      } catch (err) {
        this._liveFallback('listObjects', err);
      }
    }
    const data = this._loadMockData();
    const pkg = data.packageObjects[packageName];
    if (!pkg) {
      return { error: `Package ${packageName} not found` };
    }
    return {
      package: packageName,
      description: pkg.description,
      object_count: pkg.objects.length,
      objects: pkg.objects,
    };
  }

  async searchRepository(query, objectType) {
    this._log.debug(`search_repository: "${query}" (type: ${objectType || 'all'})`);

    if (this.mode === 'vsp') {
      try {
        const args = ['search', query, '--max', '50'];
        const output = this._callVsp(args);
        if (!output) {
          return { query, result_count: 0, results: [] };
        }
        const results = output
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => {
            const trimmed = line.trim();
            const parts = trimmed.split(/\s+/);
            return {
              name: parts[0] || trimmed,
              type: parts[1] || 'UNKNOWN',
              description: parts.slice(2).join(' ') || '',
            };
          });
        const filtered = objectType
          ? results.filter((r) => r.type === objectType)
          : results;
        return {
          query,
          result_count: filtered.length,
          results: filtered,
        };
      } catch (err) {
        return { error: `vsp search failed: ${err.message}` };
      }
    }

    if (this.mode === 'live') {
      try {
        const client = await this._getLiveClient();
        const params = { operation: 'quickSearch', query, maxResults: '50' };
        if (objectType) params.objectType = objectType;
        const data = await client.get('/sap/bc/adt/repository/informationsystem/search', params);
        const results = Array.isArray(data) ? data : (data.d && data.d.results) || [];
        const filtered = objectType ? results.filter((r) => r.type === objectType) : results;
        return { query, result_count: filtered.length, results: filtered };
      } catch (err) {
        this._liveFallback('searchRepository', err);
      }
    }
    const data = this._loadMockData();
    const key = query.toLowerCase().replace(/\s+/g, '_');
    const results = data.searchResults[key] || [];
    const filtered = objectType
      ? results.filter((r) => r.type === objectType)
      : results;
    return {
      query,
      result_count: filtered.length,
      results: filtered,
    };
  }

  async getDataDictionary(objectName) {
    this._log.debug(`get_data_dictionary: ${objectName}`);

    if (this.mode === 'vsp') {
      this._vspNotSupported('get_data_dictionary');
    }
    if (this.mode === 'live') {
      try {
        const client = await this._getLiveClient();
        const data = await client.get(`/sap/bc/adt/ddic/tables/${objectName.toLowerCase()}`);
        return { object_name: objectName, ...data };
      } catch (err) {
        this._liveFallback('getDataDictionary', err);
      }
    }
    const data = this._loadMockData();
    const ddic = data.dataDictionary[objectName];
    if (!ddic) {
      return { error: `DDIC object ${objectName} not found` };
    }
    return {
      object_name: objectName,
      ...ddic,
    };
  }

  async activateObject(objectName, objectType) {
    this._log.debug(`activate_object: ${objectName}`);

    if (this.mode === 'vsp') {
      this._vspNotSupported('activate_object');
    }
    if (this.mode === 'live') {
      try {
        const client = await this._getLiveClient();
        await client.post('/sap/bc/adt/activation', {
          adtcore_name: objectName,
          adtcore_type: objectType || 'CLAS',
        });
        return { object_name: objectName, object_type: objectType || 'CLAS', status: 'ACTIVE', warnings: [] };
      } catch (err) {
        this._liveFallback('activateObject', err);
      }
    }
    return {
      object_name: objectName,
      object_type: objectType || 'CLAS',
      status: 'ACTIVE',
      warnings: [],
    };
  }

  async runUnitTests(objectName, withCoverage) {
    this._log.debug(`run_unit_tests: ${objectName} (coverage: ${!!withCoverage})`);

    if (this.mode === 'vsp') {
      this._vspNotSupported('run_unit_tests');
    }
    if (this.mode === 'live') {
      try {
        const client = await this._getLiveClient();
        const runResult = await client.post('/sap/bc/adt/abapunit/testruns', {
          'program:name': objectName,
          'program:withCoverage': withCoverage ? 'true' : 'false',
        });
        return { object_name: objectName, ...runResult };
      } catch (err) {
        this._liveFallback('runUnitTests', err);
      }
    }
    const data = this._loadMockData();
    const result = data.unitTests[objectName];
    if (!result) {
      return { error: `No test results for ${objectName}` };
    }
    const output = { object_name: objectName, ...result };
    if (!withCoverage) {
      delete output.coverage;
    }
    return output;
  }

  async runSyntaxCheck(objectName, objectType) {
    this._log.debug(`run_syntax_check: ${objectName}`);

    if (this.mode === 'vsp') {
      this._vspNotSupported('run_syntax_check');
    }
    if (this.mode === 'live') {
      try {
        const client = await this._getLiveClient();
        const type = objectType || 'CLAS';
        const typePath = type === 'CLAS' ? 'classes' : 'programs/includes';
        const result = await client.post(`/sap/bc/adt/${typePath}/${objectName.toLowerCase()}/source/main`, null);
        return { object_name: objectName, ...result };
      } catch (err) {
        this._liveFallback('runSyntaxCheck', err);
      }
    }
    const data = this._loadMockData();
    const result = data.syntaxCheck[objectName];
    if (!result) {
      return {
        object_name: objectName,
        status: 'OK',
        errors: [],
        warnings: [],
      };
    }
    return { object_name: objectName, ...result };
  }
}

module.exports = SapGateway;
