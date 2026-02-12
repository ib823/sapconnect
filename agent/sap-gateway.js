const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/**
 * SapGateway - Abstraction layer for SAP RFC/API calls
 *
 * Three modes:
 * 1. vsp mode: uses vibing-steampunk CLI for live SAP access via ADT
 * 2. Live mode: connects to a real SAP system via RFC (not yet implemented)
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
  }

  /** Resolve vsp binary path from explicit arg, env var, or null */
  _resolveVspPath(explicitPath) {
    const candidate = explicitPath || process.env.VSP_PATH || null;
    if (!candidate) return null;
    if (!fs.existsSync(candidate)) {
      console.error(`  [gateway] vsp binary not found at: ${candidate}`);
      console.error('  [gateway] Install from: https://github.com/oisee/vibing-steampunk');
      console.error('  [gateway] Falling back to mock mode.\n');
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

    this._log(`vsp ${cmdArgs.join(' ')}`);

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
    console.log(`  [gateway] vsp CLI does not support ${method}.`);
    console.log('  [gateway] For full capability, use vsp as an MCP server in Claude Code.');
    console.log('  [gateway] See .mcp.json.example for configuration.');
    console.log('  [gateway] Falling back to mock data.\n');
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

  /** Log verbose messages */
  _log(msg) {
    if (this.verbose) {
      console.log(`  [gateway] ${msg}`);
    }
  }

  /**
   * Print live-mode-not-implemented message and fall back to mock
   * Same pattern as discovery/scanner.js scanLive()
   */
  _liveNotImplemented(method) {
    console.log(`  [gateway] Live mode not yet implemented for ${method}.`);
    console.log('  [gateway] To implement, add SAP RFC connection via node-rfc:');
    console.log('    - npm install node-rfc');
    console.log('    - Configure RFC destination in sapnwrfc.ini');
    console.log('    - Call ABAP function modules: RFC_READ_TABLE, SLIN, etc.');
    console.log('  [gateway] Falling back to mock data.\n');
  }

  async readAbapSource(objectName, objectType) {
    this._log(`read_abap_source: ${objectName} (${objectType || 'auto'})`);

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
      this._liveNotImplemented('read_abap_source');
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
    this._log(`write_abap_source: ${objectName} -> ${packageName || 'default'}`);

    if (this.mode === 'vsp') {
      this._vspNotSupported('write_abap_source');
    }
    if (this.mode === 'live') {
      this._liveNotImplemented('write_abap_source');
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
    this._log(`list_objects: ${packageName}`);

    if (this.mode === 'vsp') {
      this._vspNotSupported('list_objects');
    }
    if (this.mode === 'live') {
      this._liveNotImplemented('list_objects');
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
    this._log(`search_repository: "${query}" (type: ${objectType || 'all'})`);

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
            // vsp search output: parse each line as a result
            // Format varies; treat each non-empty line as an object reference
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
      this._liveNotImplemented('search_repository');
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
    this._log(`get_data_dictionary: ${objectName}`);

    if (this.mode === 'vsp') {
      this._vspNotSupported('get_data_dictionary');
    }
    if (this.mode === 'live') {
      this._liveNotImplemented('get_data_dictionary');
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
    this._log(`activate_object: ${objectName}`);

    if (this.mode === 'vsp') {
      this._vspNotSupported('activate_object');
    }
    if (this.mode === 'live') {
      this._liveNotImplemented('activate_object');
    }
    return {
      object_name: objectName,
      object_type: objectType || 'CLAS',
      status: 'ACTIVE',
      warnings: [],
    };
  }

  async runUnitTests(objectName, withCoverage) {
    this._log(`run_unit_tests: ${objectName} (coverage: ${!!withCoverage})`);

    if (this.mode === 'vsp') {
      this._vspNotSupported('run_unit_tests');
    }
    if (this.mode === 'live') {
      this._liveNotImplemented('run_unit_tests');
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
    this._log(`run_syntax_check: ${objectName}`);

    if (this.mode === 'vsp') {
      this._vspNotSupported('run_syntax_check');
    }
    if (this.mode === 'live') {
      this._liveNotImplemented('run_syntax_check');
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
