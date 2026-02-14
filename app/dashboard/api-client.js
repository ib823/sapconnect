/**
 * Dashboard API Client
 *
 * Facade for all REST API calls from the dashboard UI.
 * All methods return parsed JSON; errors throw with status code.
 */

/* exported ApiClient */
class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  // ── Platform ──────────────────────────────────────────────

  getPlatformSummary() {
    return this._get('/api/platform/summary');
  }

  // ── Migration ─────────────────────────────────────────────

  getMigrationSummary() {
    return this._get('/api/dashboard/summary');
  }

  getMigrationObjects() {
    return this._get('/api/dashboard/objects');
  }

  runMigration() {
    return this._post('/api/dashboard/run', {});
  }

  runObject(id) {
    return this._post(`/api/dashboard/run/${id}`, {});
  }

  // ── Forensic ──────────────────────────────────────────────

  getForensicSummary() {
    return this._get('/api/forensic/summary');
  }

  getForensicModules() {
    return this._get('/api/forensic/modules');
  }

  getForensicProcesses() {
    return this._get('/api/forensic/processes');
  }

  // ── Process Mining ────────────────────────────────────────

  getProcessMiningProcesses() {
    return this._get('/api/process-mining/processes');
  }

  runDemo(processId) {
    return this._get(`/api/process-mining/demo/${processId}`);
  }

  analyzeEventLog(events, options) {
    return this._post('/api/process-mining/analyze', { events, options });
  }

  // ── Health ────────────────────────────────────────────────

  getHealth() {
    return this._get('/health');
  }

  // ── Internal ──────────────────────────────────────────────

  async _get(path) {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) {
      const err = new Error(`API error: ${res.status} ${res.statusText}`);
      err.status = res.status;
      try { err.body = await res.json(); } catch { /* ignore */ }
      throw err;
    }
    return res.json();
  }

  async _post(path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = new Error(`API error: ${res.status} ${res.statusText}`);
      err.status = res.status;
      try { err.body = await res.json(); } catch { /* ignore */ }
      throw err;
    }
    return res.json();
  }
}
