/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Extraction Progress Page
 *
 * Real-time forensic extraction monitoring with SSE-connected progress bars,
 * event timeline, confidence gauge, and coverage heatmap.
 */

/* global ApiClient */

const ExtractionPage = {
  _sseConnection: null,
  _events: [],
  _maxEvents: 100,

  async render(container, api) {
    // Disconnect previous SSE if re-rendering
    this._disconnect();

    container.innerHTML = `
      <h2 class="page-title">Forensic Extraction</h2>

      <!-- Status Bar -->
      <div class="card" id="extraction-status">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <span class="badge" id="ext-status-badge">IDLE</span>
            <span id="ext-status-text" style="margin-left:0.5rem;font-size:0.85rem">No extraction running</span>
          </div>
          <div style="display:flex;gap:0.5rem">
            <button class="btn btn-primary" id="btn-start-extraction">Start Extraction</button>
            <span id="ext-sse-indicator" class="badge" style="font-size:0.7rem">SSE: connecting</span>
          </div>
        </div>
      </div>

      <!-- KPI Row -->
      <div class="kpi-grid" id="ext-kpis">
        <div class="kpi-tile">
          <div class="kpi-value" id="ext-confidence">--</div>
          <div class="kpi-label">Confidence</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-value" id="ext-extractors">--</div>
          <div class="kpi-label">Extractors Run</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-value" id="ext-coverage">--</div>
          <div class="kpi-label">Coverage</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-value" id="ext-events">0</div>
          <div class="kpi-label">Events</div>
        </div>
      </div>

      <!-- Progress Bars -->
      <div class="card">
        <div class="card-title">Extractor Progress</div>
        <div id="ext-progress-bars">
          <div style="color:var(--sapTextLight);font-size:0.85rem">Waiting for extraction to start...</div>
        </div>
      </div>

      <!-- Event Timeline -->
      <div class="card">
        <div class="card-title">Event Timeline</div>
        <div id="ext-timeline" class="timeline">
          <div style="color:var(--sapTextLight);font-size:0.85rem">No events yet</div>
        </div>
      </div>
    `;

    // Load initial state
    this._loadInitialState(api);

    // Connect SSE
    this._connectSSE(api);

    // Bind actions
    this._bindActions(api);
  },

  async _loadInitialState(api) {
    try {
      const [progress, confidence, coverage] = await Promise.all([
        api.getExtractionProgress(),
        api.getExtractionConfidence(),
        api.getExtractionCoverage(),
      ]);

      if (progress.running) {
        this._updateStatus('RUNNING', 'Extraction in progress...');
        this._updateProgress(progress.progress);
      }

      const confEl = document.getElementById('ext-confidence');
      if (confEl) confEl.textContent = confidence.grade || '--';

      const covEl = document.getElementById('ext-coverage');
      if (covEl) covEl.textContent = coverage.total ? `${coverage.total}%` : '--';

      // Load event history
      const history = await api.getEventHistory(50, 'extraction');
      for (const event of history.events || []) {
        this._addTimelineEvent(event);
      }
    } catch {
      // Initial state loading is best-effort
    }
  },

  _connectSSE(api) {
    this._sseConnection = api.connectSSE((event) => {
      if (event.type === 'connected') {
        this._updateSSEIndicator(true);
        return;
      }
      if (event.type === 'error') {
        this._updateSSEIndicator(false);
        return;
      }

      // Handle extraction events
      if (event.type.startsWith('extraction:')) {
        this._handleExtractionEvent(event);
      }

      // All events go to timeline
      this._addTimelineEvent(event);

      // Update event counter
      const evtEl = document.getElementById('ext-events');
      if (evtEl) evtEl.textContent = this._events.length;
    });
  },

  _handleExtractionEvent(event) {
    const data = event.data || {};

    switch (event.type) {
      case 'extraction:start':
        this._updateStatus('RUNNING', `Started: ${data.extractor || 'extraction'}`);
        break;

      case 'extraction:progress':
        this._updateStatus('RUNNING', `${data.extractor || '...'} — ${data.percent || 0}%`);
        this._updateProgressBar(data.extractor, data.percent, data.status);
        // Update extractors count
        const bars = document.querySelectorAll('.progress-row');
        const extEl = document.getElementById('ext-extractors');
        if (extEl) extEl.textContent = bars.length;
        break;

      case 'extraction:complete':
        this._updateStatus('COMPLETE', `Finished: ${data.extractor || 'extraction'}`);
        this._updateProgressBar(data.extractor, 100, 'complete');
        if (data.confidence) {
          const confEl = document.getElementById('ext-confidence');
          if (confEl) confEl.textContent = data.confidence.grade || data.confidence.overall || '--';
        }
        break;

      case 'extraction:error':
        this._updateStatus('ERROR', `Error: ${data.message || data.extractor || 'unknown'}`);
        this._updateProgressBar(data.extractor, data.percent || 0, 'error');
        break;
    }
  },

  _updateStatus(status, text) {
    const badge = document.getElementById('ext-status-badge');
    const textEl = document.getElementById('ext-status-text');
    if (badge) {
      badge.textContent = status;
      badge.className = 'badge ' + ({
        IDLE: '',
        RUNNING: 'badge-info',
        COMPLETE: 'badge-success',
        ERROR: 'badge-error',
      }[status] || '');
    }
    if (textEl) textEl.textContent = text;
  },

  _updateSSEIndicator(connected) {
    const el = document.getElementById('ext-sse-indicator');
    if (!el) return;
    el.textContent = connected ? 'SSE: live' : 'SSE: reconnecting';
    el.className = `badge ${connected ? 'badge-success' : 'badge-error'}`;
    el.style.fontSize = '0.7rem';
  },

  _updateProgress(progressMap) {
    if (!progressMap || typeof progressMap !== 'object') return;
    for (const [name, info] of Object.entries(progressMap)) {
      this._updateProgressBar(name, info.percent || 0, info.status || 'running');
    }
  },

  _updateProgressBar(name, percent, status) {
    if (!name) return;
    const container = document.getElementById('ext-progress-bars');
    if (!container) return;

    // Remove placeholder text
    const placeholder = container.querySelector('div[style]');
    if (placeholder && !placeholder.classList.contains('progress-row')) {
      placeholder.remove();
    }

    let row = document.getElementById(`progress-${name}`);
    if (!row) {
      row = document.createElement('div');
      row.id = `progress-${name}`;
      row.className = 'progress-row';
      row.innerHTML = `
        <div class="progress-label">${name}</div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill"></div>
        </div>
        <div class="progress-percent">0%</div>
      `;
      container.appendChild(row);
    }

    const fill = row.querySelector('.progress-bar-fill');
    const pctEl = row.querySelector('.progress-percent');
    if (fill) {
      fill.style.width = `${Math.min(100, percent)}%`;
      fill.className = 'progress-bar-fill' + (status === 'error' ? ' error' : status === 'complete' ? ' complete' : '');
    }
    if (pctEl) pctEl.textContent = `${Math.round(percent)}%`;
  },

  _addTimelineEvent(event) {
    this._events.push(event);
    if (this._events.length > this._maxEvents) {
      this._events.shift();
    }

    const timeline = document.getElementById('ext-timeline');
    if (!timeline) return;

    // Remove placeholder
    if (this._events.length === 1) {
      timeline.innerHTML = '';
    }

    const entry = document.createElement('div');
    entry.className = 'timeline-entry';

    const time = event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '--:--:--';
    const typeClass = event.type.includes('error') ? 'error' : event.type.includes('complete') ? 'success' : 'info';
    const label = event.type.split(':').pop();
    const detail = event.data?.extractor || event.data?.message || event.data?.objectId || '';

    entry.innerHTML = `
      <span class="timeline-time">${time}</span>
      <span class="timeline-badge ${typeClass}">${label}</span>
      <span class="timeline-detail">${detail}</span>
    `;

    // Prepend (newest first)
    timeline.insertBefore(entry, timeline.firstChild);

    // Limit visible entries
    while (timeline.children.length > 50) {
      timeline.removeChild(timeline.lastChild);
    }
  },

  _bindActions(api) {
    document.getElementById('btn-start-extraction')?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      e.target.textContent = 'Starting...';
      try {
        await api.startExtraction();
        this._updateStatus('RUNNING', 'Extraction initiated');
        window.DashboardApp?.showToast('Extraction started');
      } catch (err) {
        if (err.status === 409) {
          window.DashboardApp?.showToast('Extraction already in progress', true);
        } else {
          window.DashboardApp?.showToast('Failed: ' + err.message, true);
        }
      } finally {
        e.target.disabled = false;
        e.target.textContent = 'Start Extraction';
      }
    });
  },

  _disconnect() {
    if (this._sseConnection) {
      this._sseConnection.close();
      this._sseConnection = null;
    }
    this._events = [];
  },
};
