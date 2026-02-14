/**
 * OpenAPI Spec Completeness Test
 *
 * Verifies that docs/openapi.yaml includes all known API endpoints,
 * required tags, and the ApiKeyAuth security scheme.
 */
const fs = require('fs');
const path = require('path');

const specPath = path.join(__dirname, '../../docs/openapi.yaml');
const specContent = fs.readFileSync(specPath, 'utf8');

describe('OpenAPI Spec Completeness', () => {
  // ── Required paths ─────────────────────────────────────────

  const requiredPaths = [
    // Health & Infra
    '/health',
    '/ready',
    '/metrics',
    '/api/info',

    // Dashboard
    '/api/dashboard/summary',
    '/api/dashboard/objects',
    '/api/dashboard/rules',
    '/api/dashboard/reconciliation',
    '/api/dashboard/tests',
    '/api/dashboard/run',

    // Audit
    '/api/audit',
    '/api/audit/stats',

    // Forensic
    '/api/forensic/summary',
    '/api/forensic/modules',
    '/api/forensic/processes',
    '/api/forensic/code',
    '/api/forensic/security',
    '/api/forensic/interfaces',
    '/api/forensic/gaps',
    '/api/forensic/confidence',
    '/api/forensic/coverage',
    '/api/forensic/extract',
    '/api/forensic/progress',

    // Process Mining
    '/api/process-mining/processes',
    '/api/process-mining/analyze',
    '/api/process-mining/discover',
    '/api/process-mining/conformance',
    '/api/process-mining/performance',
    '/api/process-mining/variants',
    '/api/process-mining/social-network',
    '/api/process-mining/kpis',

    // Platform
    '/api/platform/summary',

    // Migration Plan
    '/api/migration/plan',
    '/api/migration/plan/latest',

    // Export
    '/api/export/forensic/json',
    '/api/export/forensic/markdown',
    '/api/export/event-log/csv',
    '/api/export/event-log/xes',
    '/api/export/event-log/json',
    '/api/export/migration/plan/json',
  ];

  describe('endpoint paths', () => {
    for (const p of requiredPaths) {
      it(`should include ${p}`, () => {
        // In YAML, paths are at the root indentation: "  /path:" (2 spaces)
        const pattern = `  ${p}:`;
        expect(specContent).toContain(pattern);
      });
    }

    it(`should have at least ${requiredPaths.length} documented paths`, () => {
      // Count unique path entries (lines matching "  /something:")
      const pathLines = specContent.match(/^ {2}\/[^\s:]+:/gm) || [];
      expect(pathLines.length).toBeGreaterThanOrEqual(requiredPaths.length);
    });
  });

  // ── Required tags ──────────────────────────────────────────

  const requiredTags = [
    'Dashboard',
    'Health',
    'Metrics',
    'Audit',
    'Info',
    'Forensic',
    'ProcessMining',
    'Platform',
    'MigrationPlan',
    'Export',
  ];

  describe('tags', () => {
    for (const tag of requiredTags) {
      it(`should include tag: ${tag}`, () => {
        expect(specContent).toContain(`name: ${tag}`);
      });
    }
  });

  // ── Security scheme ────────────────────────────────────────

  describe('security', () => {
    it('should define ApiKeyAuth security scheme', () => {
      expect(specContent).toContain('ApiKeyAuth');
      expect(specContent).toContain('type: apiKey');
      expect(specContent).toContain('name: X-API-Key');
    });

    it('should have global security requirement', () => {
      expect(specContent).toContain('security:');
      expect(specContent).toContain('- ApiKeyAuth: []');
    });

    it('should exempt health endpoints from auth', () => {
      // /health should have security: [] override
      const healthSection = specContent.substring(
        specContent.indexOf('  /health:'),
        specContent.indexOf('  /ready:')
      );
      expect(healthSection).toContain('security: []');
    });
  });

  // ── Schemas ────────────────────────────────────────────────

  describe('schemas', () => {
    const requiredSchemas = [
      'HealthResponse',
      'ReadinessResponse',
      'Error',
      'MigrationPlan',
      'EventLogInput',
    ];

    for (const schema of requiredSchemas) {
      it(`should define schema: ${schema}`, () => {
        expect(specContent).toContain(`${schema}:`);
      });
    }
  });
});
