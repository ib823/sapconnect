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

  // ── Extraction ───────────────────────────────────────────

  getExtractionProgress() {
    return this._get('/api/forensic/progress');
  }

  getExtractionConfidence() {
    return this._get('/api/forensic/confidence');
  }

  getExtractionCoverage() {
    return this._get('/api/forensic/coverage');
  }

  startExtraction(options = {}) {
    return this._post('/api/forensic/extract', options);
  }

  getEventHistory(count = 50, type = null) {
    const params = new URLSearchParams({ count });
    if (type) params.set('type', type);
    return this._get(`/api/events/history?${params}`);
  }

  // ── Health ────────────────────────────────────────────────

  getHealth() {
    return this._get('/health');
  }

  // ── SSE (Server-Sent Events) ────────────────────────────

  /**
   * Connect to the SSE event stream.
   * @param {function} onEvent — Called with { type, data, timestamp } for each event
   * @param {object} [options]
   * @param {number} [options.replay=20] — Number of recent events to replay
   * @returns {{ close: function }} — Call close() to disconnect
   */
  connectSSE(onEvent, options = {}) {
    const { replay = 20 } = options;
    const url = `${this.baseUrl}/api/events?replay=${replay}`;
    const source = new EventSource(url);

    source.addEventListener('connected', (e) => {
      onEvent({ type: 'connected', data: JSON.parse(e.data), timestamp: new Date().toISOString() });
    });

    const eventTypes = [
      'extraction:start', 'extraction:progress', 'extraction:complete', 'extraction:error',
      'migration:start', 'migration:progress', 'migration:complete', 'migration:error',
      'agent:start', 'agent:progress', 'agent:complete', 'agent:error',
      'system:health', 'system:info',
    ];

    for (const type of eventTypes) {
      source.addEventListener(type, (e) => {
        try {
          const event = JSON.parse(e.data);
          onEvent(event);
        } catch { /* ignore parse errors */ }
      });
    }

    source.onerror = () => {
      onEvent({ type: 'error', data: { message: 'SSE connection lost' }, timestamp: new Date().toISOString() });
    };

    return {
      close() { source.close(); },
      get readyState() { return source.readyState; },
    };
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
