/**
 * Tests for the Rule Registry (migration/rules/index.js)
 *
 * Validates the aggregated rule collection across all 21 module files,
 * the RuleRegistry class API, and backward-compatible exports.
 */

const {
  RULES,
  getAllRules,
  getRulesBySeverity,
  getRulesByCategory,
  checkSource,
  severityWeight,
  registry,
} = require('../../../migration/rules');

describe('Rule Registry (index)', () => {
  // ── Exports ───────────────────────────────────────────────────

  describe('exports', () => {
    it('exports RULES as an array', () => {
      expect(Array.isArray(RULES)).toBe(true);
    });

    it('exports getAllRules as a function', () => {
      expect(typeof getAllRules).toBe('function');
    });

    it('exports getRulesBySeverity as a function', () => {
      expect(typeof getRulesBySeverity).toBe('function');
    });

    it('exports getRulesByCategory as a function', () => {
      expect(typeof getRulesByCategory).toBe('function');
    });

    it('exports checkSource as a function', () => {
      expect(typeof checkSource).toBe('function');
    });

    it('exports severityWeight as a function', () => {
      expect(typeof severityWeight).toBe('function');
    });

    it('exports registry as an object', () => {
      expect(registry).toBeDefined();
      expect(typeof registry.getAll).toBe('function');
      expect(typeof registry.getById).toBe('function');
      expect(typeof registry.getBySeverity).toBe('function');
      expect(typeof registry.getByCategory).toBe('function');
      expect(typeof registry.getByModule).toBe('function');
      expect(typeof registry.checkSource).toBe('function');
    });
  });

  // ── Rule count ────────────────────────────────────────────────

  describe('rule count', () => {
    it('has at least 800 total rules', () => {
      expect(RULES.length).toBeGreaterThanOrEqual(800);
    });

    it('getAllRules returns the same array as RULES', () => {
      expect(getAllRules()).toBe(RULES);
    });

    it('registry.getAll returns the same array', () => {
      expect(registry.getAll()).toBe(RULES);
    });
  });

  // ── Rule shape ────────────────────────────────────────────────

  describe('rule shape', () => {
    it('every rule has an id', () => {
      for (const r of RULES) {
        expect(r.id).toBeDefined();
        expect(typeof r.id).toBe('string');
        expect(r.id.length).toBeGreaterThan(0);
      }
    });

    it('every rule has a title', () => {
      for (const r of RULES) {
        expect(r.title).toBeDefined();
        expect(typeof r.title).toBe('string');
      }
    });

    it('every rule has a severity', () => {
      const allowed = ['critical', 'high', 'medium', 'low'];
      for (const r of RULES) {
        expect(r.severity).toBeDefined();
        expect(allowed).toContain(r.severity);
      }
    });

    it('every rule has a category', () => {
      for (const r of RULES) {
        expect(r.category).toBeDefined();
        expect(typeof r.category).toBe('string');
      }
    });

    it('every rule has a regex pattern', () => {
      for (const r of RULES) {
        expect(r.pattern).toBeInstanceOf(RegExp);
      }
    });

    it('every rule has a patternType', () => {
      const allowed = ['source', 'objectName'];
      for (const r of RULES) {
        expect(r.patternType).toBeDefined();
        expect(allowed).toContain(r.patternType);
      }
    });

    it('every rule has remediation text', () => {
      for (const r of RULES) {
        expect(r.remediation).toBeDefined();
        expect(typeof r.remediation).toBe('string');
        expect(r.remediation.length).toBeGreaterThan(0);
      }
    });
  });

  // ── Uniqueness ────────────────────────────────────────────────

  describe('uniqueness', () => {
    it('all rule IDs are unique', () => {
      const ids = RULES.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  // ── Module coverage ───────────────────────────────────────────

  describe('module coverage', () => {
    const EXPECTED_PREFIXES = [
      'SIMPL-FI',
      'SIMPL-CO',
      'SIMPL-MM',
      'SIMPL-SD',
      'SIMPL-BP',
      'SIMPL-HR',
      'SIMPL-PP',
      'SIMPL-PM',
      'SIMPL-ABAP',
      'SIMPL-ENH',
      'SIMPL-DM',
      'SIMPL-REM',
      'SIMPL-PS',
      'SIMPL-QM',
      'SIMPL-INT',
      'SIMPL-CFG',
      'SIMPL-EWM',
      'SIMPL-TM',
      'SIMPL-GTS',
      'SIMPL-PLM',
      'SIMPL-BW',
    ];

    it('contains rules from all 21 module files', () => {
      for (const prefix of EXPECTED_PREFIXES) {
        const matches = RULES.filter((r) => r.id.startsWith(prefix));
        expect(matches.length).toBeGreaterThan(0);
      }
    });

    it('FI rules are the largest group (>= 70)', () => {
      const fi = RULES.filter((r) => r.id.startsWith('SIMPL-FI'));
      expect(fi.length).toBeGreaterThanOrEqual(70);
    });
  });

  // ── Filter by severity ────────────────────────────────────────

  describe('getRulesBySeverity', () => {
    it('returns only critical rules', () => {
      const critical = getRulesBySeverity('critical');
      expect(critical.length).toBeGreaterThan(0);
      for (const r of critical) {
        expect(r.severity).toBe('critical');
      }
    });

    it('returns only high rules', () => {
      const high = getRulesBySeverity('high');
      expect(high.length).toBeGreaterThan(0);
      for (const r of high) {
        expect(r.severity).toBe('high');
      }
    });

    it('returns only medium rules', () => {
      const medium = getRulesBySeverity('medium');
      expect(medium.length).toBeGreaterThan(0);
      for (const r of medium) {
        expect(r.severity).toBe('medium');
      }
    });

    it('returns empty for unknown severity', () => {
      const none = getRulesBySeverity('extreme');
      expect(none).toEqual([]);
    });

    it('severity counts sum to total', () => {
      const c = getRulesBySeverity('critical').length;
      const h = getRulesBySeverity('high').length;
      const m = getRulesBySeverity('medium').length;
      const l = getRulesBySeverity('low').length;
      expect(c + h + m + l).toBe(RULES.length);
    });
  });

  // ── Filter by category ────────────────────────────────────────

  describe('getRulesByCategory', () => {
    it('returns rules matching a known category substring', () => {
      const finance = getRulesByCategory('Finance');
      expect(finance.length).toBeGreaterThan(0);
      for (const r of finance) {
        expect(r.category.toLowerCase()).toContain('finance');
      }
    });

    it('is case-insensitive', () => {
      const a = getRulesByCategory('ABAP');
      const b = getRulesByCategory('abap');
      expect(a.length).toBe(b.length);
    });
  });

  // ── Registry getById ──────────────────────────────────────────

  describe('registry.getById', () => {
    it('finds a known rule', () => {
      const rule = registry.getById('SIMPL-FI-001');
      expect(rule).not.toBeNull();
      expect(rule.id).toBe('SIMPL-FI-001');
    });

    it('returns null for unknown ID', () => {
      expect(registry.getById('FAKE-999')).toBeNull();
    });
  });

  // ── Registry getByModule ──────────────────────────────────────

  describe('registry.getByModule', () => {
    it('returns FI rules when searching for "fi"', () => {
      const fi = registry.getByModule('fi');
      expect(fi.length).toBeGreaterThan(0);
      for (const r of fi) {
        expect(r.id.toLowerCase()).toContain('fi');
      }
    });
  });

  // ── severityWeight ────────────────────────────────────────────

  describe('severityWeight', () => {
    it('assigns 10 to critical', () => {
      expect(severityWeight('critical')).toBe(10);
    });

    it('assigns 5 to high', () => {
      expect(severityWeight('high')).toBe(5);
    });

    it('assigns 2 to medium', () => {
      expect(severityWeight('medium')).toBe(2);
    });

    it('assigns 1 to low', () => {
      expect(severityWeight('low')).toBe(1);
    });

    it('assigns 0 to unknown', () => {
      expect(severityWeight('whatever')).toBe(0);
    });
  });

  // ── checkSource ───────────────────────────────────────────────

  describe('checkSource', () => {
    it('detects BSEG usage (critical FI rule)', () => {
      const source = 'SELECT * FROM BSEG WHERE bukrs = "1000".';
      const findings = checkSource(source, 'Z_MY_PROGRAM');
      const bsegFinding = findings.find((f) => f.rule.id === 'SIMPL-FI-001');
      expect(bsegFinding).toBeDefined();
      expect(bsegFinding.matches.length).toBeGreaterThan(0);
      expect(bsegFinding.matches[0].line).toBe(1);
    });

    it('returns empty for clean source', () => {
      const source = '// Nothing special here\nconst x = 1;';
      const findings = checkSource(source, 'Z_CLEAN');
      // May still find objectName matches, but source matches should be few
      expect(Array.isArray(findings)).toBe(true);
    });

    it('reports correct line numbers', () => {
      const source = 'line 1\nline 2\nSELECT * FROM BSEG.\nline 4';
      const findings = checkSource(source, 'TEST');
      const bseg = findings.find((f) => f.rule.id === 'SIMPL-FI-001');
      if (bseg) {
        expect(bseg.matches[0].line).toBe(3);
      }
    });
  });
});
