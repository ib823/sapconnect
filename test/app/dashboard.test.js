/**
 * Tests for app/dashboard/ — HTML structure, API client, chart helpers
 *
 * Since the dashboard is pure browser-side HTML/CSS/JS, these tests
 * validate file structure, HTML correctness, and the API client logic
 * (which can run in Node since it's plain class/function code).
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.resolve(__dirname, '../../app/dashboard');

// ── HTML Structure ──────────────────────────────────────────

describe('Dashboard HTML structure', () => {
  let indexHtml;

  beforeAll(() => {
    indexHtml = fs.readFileSync(path.join(DASHBOARD_DIR, 'index.html'), 'utf-8');
  });

  it('should exist as index.html', () => {
    expect(indexHtml).toBeDefined();
    expect(indexHtml.length).toBeGreaterThan(0);
  });

  it('should be valid HTML5 with doctype', () => {
    expect(indexHtml).toMatch(/<!DOCTYPE html>/i);
    expect(indexHtml).toContain('<html');
    expect(indexHtml).toContain('</html>');
  });

  it('should include SAP Connect title', () => {
    expect(indexHtml).toContain('<title>SAP Connect');
  });

  it('should link to styles.css', () => {
    expect(indexHtml).toContain('styles.css');
  });

  it('should include navigation tabs', () => {
    expect(indexHtml).toContain('nav-tabs');
    expect(indexHtml).toContain('data-page="overview"');
    expect(indexHtml).toContain('data-page="migration"');
    expect(indexHtml).toContain('data-page="process-mining"');
  });

  it('should include page containers', () => {
    expect(indexHtml).toContain('id="page-overview"');
    expect(indexHtml).toContain('id="page-migration"');
    expect(indexHtml).toContain('id="page-process-mining"');
  });

  it('should load Chart.js from CDN', () => {
    expect(indexHtml).toContain('chart.js');
    expect(indexHtml).toContain('cdn.jsdelivr.net');
  });

  it('should load all JS modules', () => {
    expect(indexHtml).toContain('api-client.js');
    expect(indexHtml).toContain('charts.js');
    expect(indexHtml).toContain('app.js');
    expect(indexHtml).toContain('pages/overview.js');
    expect(indexHtml).toContain('pages/migration.js');
    expect(indexHtml).toContain('pages/process-mining.js');
  });
});

// ── CSS Structure ───────────────────────────────────────────

describe('Dashboard CSS', () => {
  let css;

  beforeAll(() => {
    css = fs.readFileSync(path.join(DASHBOARD_DIR, 'styles.css'), 'utf-8');
  });

  it('should define SAP Horizon CSS variables', () => {
    expect(css).toContain('--sapShell');
    expect(css).toContain('#354a5f');
    expect(css).toContain('--sapBrand');
    expect(css).toContain('#0a6ed1');
    expect(css).toContain('--sapPositive');
    expect(css).toContain('--sapCritical');
    expect(css).toContain('--sapNegative');
  });

  it('should use font 72', () => {
    expect(css).toContain("'72'");
  });

  it('should define card-grid layout', () => {
    expect(css).toContain('.card-grid');
    expect(css).toContain('grid-template-columns');
  });

  it('should define KPI tile styles', () => {
    expect(css).toContain('.kpi-tile');
    expect(css).toContain('.kpi-value');
    expect(css).toContain('.kpi-label');
  });

  it('should define loading spinner animation', () => {
    expect(css).toContain('.spinner');
    expect(css).toContain('@keyframes spin');
  });

  it('should define toast notification styles', () => {
    expect(css).toContain('.toast-container');
    expect(css).toContain('.toast');
    expect(css).toContain('.toast-error');
  });

  it('should define status badges', () => {
    expect(css).toContain('.badge-success');
    expect(css).toContain('.badge-warning');
    expect(css).toContain('.badge-error');
    expect(css).toContain('.badge-neutral');
  });
});

// ── File Completeness ───────────────────────────────────────

describe('Dashboard file completeness', () => {
  const expectedFiles = [
    'index.html',
    'styles.css',
    'api-client.js',
    'charts.js',
    'app.js',
    'pages/overview.js',
    'pages/migration.js',
    'pages/process-mining.js',
  ];

  for (const file of expectedFiles) {
    it(`should have ${file}`, () => {
      const filePath = path.join(DASHBOARD_DIR, file);
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.length).toBeGreaterThan(50);
    });
  }
});

// ── API Client (node-compatible parts) ──────────────────────

describe('API Client module', () => {
  let clientSource;

  beforeAll(() => {
    clientSource = fs.readFileSync(path.join(DASHBOARD_DIR, 'api-client.js'), 'utf-8');
  });

  it('should define ApiClient class', () => {
    expect(clientSource).toContain('class ApiClient');
  });

  it('should have getPlatformSummary method', () => {
    expect(clientSource).toContain('getPlatformSummary');
  });

  it('should have getMigrationSummary method', () => {
    expect(clientSource).toContain('getMigrationSummary');
  });

  it('should have getForensicSummary method', () => {
    expect(clientSource).toContain('getForensicSummary');
  });

  it('should have getProcessMiningProcesses method', () => {
    expect(clientSource).toContain('getProcessMiningProcesses');
  });

  it('should have runDemo method', () => {
    expect(clientSource).toContain('runDemo');
  });

  it('should have analyzeEventLog method', () => {
    expect(clientSource).toContain('analyzeEventLog');
  });

  it('should use proper API paths', () => {
    expect(clientSource).toContain('/api/platform/summary');
    expect(clientSource).toContain('/api/dashboard/summary');
    expect(clientSource).toContain('/api/forensic/summary');
    expect(clientSource).toContain('/api/process-mining/processes');
    expect(clientSource).toContain('/api/process-mining/demo/');
    expect(clientSource).toContain('/api/process-mining/analyze');
  });
});

// ── Chart Helpers ───────────────────────────────────────────

describe('Charts module', () => {
  let chartSource;

  beforeAll(() => {
    chartSource = fs.readFileSync(path.join(DASHBOARD_DIR, 'charts.js'), 'utf-8');
  });

  it('should define createBarChart', () => {
    expect(chartSource).toContain('function createBarChart');
  });

  it('should define createDoughnutChart', () => {
    expect(chartSource).toContain('function createDoughnutChart');
  });

  it('should define createLineChart', () => {
    expect(chartSource).toContain('function createLineChart');
  });

  it('should define createRadarChart', () => {
    expect(chartSource).toContain('function createRadarChart');
  });

  it('should define SAP_COLORS palette', () => {
    expect(chartSource).toContain('SAP_COLORS');
    expect(chartSource).toContain('#0a6ed1');
  });

  it('should auto-destroy existing charts', () => {
    expect(chartSource).toContain('_destroyExisting');
    expect(chartSource).toContain('_activeCharts');
  });
});

// ── Page Modules ────────────────────────────────────────────

describe('Page modules', () => {
  it('overview.js should define OverviewPage with render method', () => {
    const src = fs.readFileSync(path.join(DASHBOARD_DIR, 'pages/overview.js'), 'utf-8');
    expect(src).toContain('OverviewPage');
    expect(src).toContain('render');
    expect(src).toContain('overview-kpis');
  });

  it('migration.js should define MigrationPage with render method', () => {
    const src = fs.readFileSync(path.join(DASHBOARD_DIR, 'pages/migration.js'), 'utf-8');
    expect(src).toContain('MigrationPage');
    expect(src).toContain('render');
    expect(src).toContain('migration-objects');
  });

  it('process-mining.js should define ProcessMiningPage with render method', () => {
    const src = fs.readFileSync(path.join(DASHBOARD_DIR, 'pages/process-mining.js'), 'utf-8');
    expect(src).toContain('ProcessMiningPage');
    expect(src).toContain('render');
    expect(src).toContain('process-select');
    expect(src).toContain('btn-demo-analyze');
  });
});

// ── App Controller ──────────────────────────────────────────

describe('App controller', () => {
  let appSource;

  beforeAll(() => {
    appSource = fs.readFileSync(path.join(DASHBOARD_DIR, 'app.js'), 'utf-8');
  });

  it('should define DashboardApp', () => {
    expect(appSource).toContain('DashboardApp');
  });

  it('should implement hash-based routing', () => {
    expect(appSource).toContain('hashchange');
    expect(appSource).toContain('location.hash');
  });

  it('should implement toast notifications', () => {
    expect(appSource).toContain('showToast');
    expect(appSource).toContain('toast-container');
  });

  it('should implement auto-refresh toggle', () => {
    expect(appSource).toContain('toggleAutoRefresh');
    expect(appSource).toContain('autoRefreshTimer');
  });

  it('should register page modules', () => {
    expect(appSource).toContain('OverviewPage');
    expect(appSource).toContain('MigrationPage');
    expect(appSource).toContain('ProcessMiningPage');
  });
});

// ── Landing Page Dashboard Card ─────────────────────────────

describe('Landing page dashboard card', () => {
  let landingHtml;

  beforeAll(() => {
    landingHtml = fs.readFileSync(path.resolve(__dirname, '../../app/index.html'), 'utf-8');
  });

  it('should contain a Dashboard card', () => {
    expect(landingHtml).toContain('Platform Dashboard');
    expect(landingHtml).toContain('/dashboard/');
  });
});
