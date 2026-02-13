/**
 * Usage Analyzer
 *
 * Analyzes custom object usage patterns to identify dead code,
 * usage frequency, and call hierarchies.
 */

const Logger = require('../lib/logger');

class UsageAnalyzer {
  constructor(gateway, options = {}) {
    this.gateway = gateway;
    this.verbose = options.verbose || false;
    this.log = new Logger('usage-analyzer', { level: this.verbose ? 'debug' : 'info' });
  }

  /**
   * Analyze usage for a set of object names
   * @param {string[]} objectNames
   * @returns {{ usageStats: object[], deadCode: object[], callHierarchy: object, summary: object }}
   */
  async analyze(objectNames) {
    this.log.debug(`Analyzing usage for ${objectNames.length} objects`);

    if (this.gateway.mode === 'live') {
      try {
        return await this._analyzeLive(objectNames);
      } catch (err) {
        this.log.warn('Live usage analysis failed, falling back to mock', { error: err.message });
      }
    }

    return this._analyzeMock(objectNames);
  }

  _analyzeMock(objectNames) {
    const usageStats = [];
    const deadCode = [];
    const callHierarchy = {};

    // Simulate realistic usage patterns
    for (const name of objectNames) {
      const hash = this._simpleHash(name);
      const lastUsed = this._mockLastUsed(hash);
      const callCount = this._mockCallCount(hash, name);
      const callers = this._mockCallers(hash, name);

      const stat = {
        object: name,
        lastUsed,
        callCount,
        callerCount: callers.length,
        daysSinceLastUse: this._daysSince(lastUsed),
        status: callCount === 0 ? 'unused' : callCount < 10 ? 'low' : 'active',
      };

      usageStats.push(stat);

      if (callCount === 0 || this._daysSince(lastUsed) > 365) {
        deadCode.push({
          object: name,
          reason: callCount === 0 ? 'No callers found' : `Not used since ${lastUsed}`,
          lastUsed,
          callCount,
        });
      }

      callHierarchy[name] = { callers, callees: this._mockCallees(hash, name) };
    }

    const deadCount = deadCode.length;
    const activeCount = usageStats.filter((s) => s.status === 'active').length;

    return {
      usageStats,
      deadCode,
      callHierarchy,
      summary: {
        totalObjects: objectNames.length,
        activeObjects: activeCount,
        lowUsageObjects: usageStats.filter((s) => s.status === 'low').length,
        deadCodeObjects: deadCount,
        deadCodePercentage: objectNames.length > 0 ? Math.round((deadCount / objectNames.length) * 100) : 0,
      },
    };
  }

  async _analyzeLive(objectNames) {
    const client = await this.gateway._getLiveClient();
    const usageStats = [];
    const deadCode = [];
    const callHierarchy = {};

    for (const name of objectNames) {
      try {
        const whereUsed = await client.get(`/sap/bc/adt/repository/informationsystem/whereused`, {
          uri: `/sap/bc/adt/programs/programs/${name.toLowerCase()}`,
        });
        const callers = Array.isArray(whereUsed) ? whereUsed : [];

        const stat = {
          object: name,
          lastUsed: 'unknown',
          callCount: callers.length,
          callerCount: callers.length,
          daysSinceLastUse: 0,
          status: callers.length === 0 ? 'unused' : callers.length < 5 ? 'low' : 'active',
        };

        usageStats.push(stat);
        if (callers.length === 0) {
          deadCode.push({ object: name, reason: 'No callers found', lastUsed: 'unknown', callCount: 0 });
        }
        callHierarchy[name] = { callers: callers.map((c) => c.name || c), callees: [] };
      } catch {
        usageStats.push({ object: name, lastUsed: 'unknown', callCount: -1, callerCount: 0, daysSinceLastUse: 0, status: 'unknown' });
      }
    }

    return {
      usageStats,
      deadCode,
      callHierarchy,
      summary: {
        totalObjects: objectNames.length,
        activeObjects: usageStats.filter((s) => s.status === 'active').length,
        lowUsageObjects: usageStats.filter((s) => s.status === 'low').length,
        deadCodeObjects: deadCode.length,
        deadCodePercentage: objectNames.length > 0 ? Math.round((deadCode.length / objectNames.length) * 100) : 0,
      },
    };
  }

  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  _mockLastUsed(hash) {
    const daysAgo = (hash % 500) + 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  _mockCallCount(hash, name) {
    // Some objects are "dead" (30-40% range)
    if (hash % 3 === 0) return 0;
    if (name.startsWith('Y')) return hash % 5; // Y-namespace typically low usage
    return (hash % 200) + 1;
  }

  _mockCallers(hash, name) {
    if (hash % 3 === 0) return [];
    const count = (hash % 5) + 1;
    const callers = [];
    for (let i = 0; i < count; i++) {
      callers.push(`Z_CALLER_${(hash + i * 7) % 999}`);
    }
    return callers;
  }

  _mockCallees(hash, name) {
    const count = hash % 4;
    const callees = [];
    for (let i = 0; i < count; i++) {
      callees.push(`Z_CALLEE_${(hash + i * 13) % 999}`);
    }
    return callees;
  }

  _daysSince(dateStr) {
    if (!dateStr || dateStr === 'unknown') return 0;
    const then = new Date(dateStr);
    const now = new Date();
    return Math.floor((now - then) / (1000 * 60 * 60 * 24));
  }
}

module.exports = UsageAnalyzer;
