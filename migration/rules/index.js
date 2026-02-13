/**
 * Rule Registry - Aggregates all rule modules
 *
 * Backward-compatible: exports { RULES, getAllRules, getRulesBySeverity,
 * getRulesByCategory, checkSource, severityWeight, registry }
 */

const fiRules = require('./fi-rules');
const coRules = require('./co-rules');
const mmRules = require('./mm-rules');
const sdRules = require('./sd-rules');
const bpRules = require('./bp-rules');
const hrRules = require('./hr-rules');
const ppRules = require('./pp-rules');
const pmRules = require('./pm-rules');
const abapRules = require('./abap-rules');
const enhancementRules = require('./enhancement-rules');
const dataModelRules = require('./data-model-rules');
const removedRules = require('./removed-rules');

class RuleRegistry {
  constructor() {
    this._rules = [];
    this._byId = new Map();
  }

  register(rule) {
    if (this._byId.has(rule.id)) return; // skip duplicates
    this._rules.push(rule);
    this._byId.set(rule.id, rule);
  }

  registerAll(rules) {
    for (const rule of rules) {
      this.register(rule);
    }
  }

  getAll() { return this._rules; }
  getById(id) { return this._byId.get(id) || null; }

  getBySeverity(severity) {
    return this._rules.filter((r) => r.severity === severity);
  }

  getByCategory(category) {
    const lower = category.toLowerCase();
    return this._rules.filter((r) => r.category.toLowerCase().includes(lower));
  }

  getByModule(module) {
    const lower = module.toLowerCase();
    return this._rules.filter((r) => r.id.toLowerCase().includes(lower));
  }

  checkSource(source, objectName) {
    const findings = [];
    for (const rule of this._rules) {
      if (rule.patternType === 'source') {
        const matches = [];
        const lines = source.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (rule.pattern.test(lines[i])) {
            matches.push({ line: i + 1, content: lines[i].trim() });
          }
        }
        if (matches.length > 0) {
          findings.push({ rule, matches });
        }
      } else if (rule.patternType === 'objectName') {
        if (rule.pattern.test(objectName)) {
          findings.push({
            rule,
            matches: [{ line: 0, content: `Object name: ${objectName}` }],
          });
        }
      }
    }
    return findings;
  }
}

// Build the global registry
const registry = new RuleRegistry();
registry.registerAll(fiRules);
registry.registerAll(coRules);
registry.registerAll(mmRules);
registry.registerAll(sdRules);
registry.registerAll(bpRules);
registry.registerAll(hrRules);
registry.registerAll(ppRules);
registry.registerAll(pmRules);
registry.registerAll(abapRules);
registry.registerAll(enhancementRules);
registry.registerAll(dataModelRules);
registry.registerAll(removedRules);

// Backward-compatible exports
const RULES = registry.getAll();

function getAllRules() { return RULES; }
function getRulesBySeverity(severity) { return registry.getBySeverity(severity); }
function getRulesByCategory(category) { return registry.getByCategory(category); }
function checkSource(source, objectName) { return registry.checkSource(source, objectName); }

function severityWeight(severity) {
  switch (severity) {
    case 'critical': return 10;
    case 'high': return 5;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

module.exports = {
  RULES,
  getAllRules,
  getRulesBySeverity,
  getRulesByCategory,
  checkSource,
  severityWeight,
  registry,
};
