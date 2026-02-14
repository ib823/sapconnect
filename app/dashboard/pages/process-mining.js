/**
 * Process Mining Page Module
 *
 * Process selector, demo analysis, result panels for all analysis types,
 * and custom event log upload.
 */

/* global ApiClient, createBarChart, createDoughnutChart, createRadarChart */

const ProcessMiningPage = {
  async render(container, api) {
    container.innerHTML = `
      <h2 class="page-title">Process Mining</h2>
      <div class="form-group">
        <label>Process:</label>
        <select class="form-select" id="process-select">
          <option value="">Loading...</option>
        </select>
        <button class="btn btn-primary" id="btn-demo-analyze">Run Demo Analysis</button>
      </div>
      <div id="pm-results"></div>
      <div class="section" style="margin-top:2rem">
        <div class="section-title">Custom Event Log Analysis</div>
        <textarea class="form-control" id="event-log-input" placeholder='Paste JSON event array: [{"caseId":"C1","activity":"Start","timestamp":"2024-01-01T00:00:00Z","resource":"UserA"}, ...]'></textarea>
        <div style="margin-top:0.5rem">
          <button class="btn btn-secondary" id="btn-custom-analyze">Analyze Custom Log</button>
        </div>
      </div>
    `;

    this._loadProcesses(api);
    this._bindActions(api);
  },

  async _loadProcesses(api) {
    try {
      const data = await api.getProcessMiningProcesses();
      const select = document.getElementById('process-select');
      select.innerHTML = '';
      for (const p of data.processes) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.id} — ${p.name}`;
        select.appendChild(opt);
      }
    } catch (err) {
      document.getElementById('process-select').innerHTML =
        '<option value="">Failed to load processes</option>';
    }
  },

  _bindActions(api) {
    document.getElementById('btn-demo-analyze')?.addEventListener('click', async (e) => {
      const processId = document.getElementById('process-select')?.value;
      if (!processId) return;
      e.target.disabled = true;
      e.target.textContent = 'Analyzing...';
      try {
        const data = await api.runDemo(processId);
        this._renderResults(data);
      } catch (err) {
        window.DashboardApp?.showToast('Analysis failed: ' + err.message, true);
      } finally {
        e.target.disabled = false;
        e.target.textContent = 'Run Demo Analysis';
      }
    });

    document.getElementById('btn-custom-analyze')?.addEventListener('click', async (e) => {
      const input = document.getElementById('event-log-input')?.value;
      if (!input) return;
      e.target.disabled = true;
      e.target.textContent = 'Analyzing...';
      try {
        const events = JSON.parse(input);
        const data = await api.analyzeEventLog(events, {});
        this._renderResults({ analysis: data, processId: 'Custom', processName: 'Custom Analysis' });
      } catch (err) {
        window.DashboardApp?.showToast('Analysis failed: ' + err.message, true);
      } finally {
        e.target.disabled = false;
        e.target.textContent = 'Analyze Custom Log';
      }
    });
  },

  _renderResults(data) {
    const el = document.getElementById('pm-results');
    const analysis = data.analysis || {};
    const summary = analysis.summary || {};

    let html = '';

    // Executive Summary
    html += `<div class="result-panel">
      <h3>Executive Summary — ${data.processName || data.processId}</h3>
      <div class="kpi-grid">
        <div class="kpi-tile"><div class="kpi-value">${summary.totalCases || 0}</div><div class="kpi-label">Cases</div></div>
        <div class="kpi-tile"><div class="kpi-value">${summary.totalEvents || 0}</div><div class="kpi-label">Events</div></div>
        <div class="kpi-tile"><div class="kpi-value">${summary.totalActivities || 0}</div><div class="kpi-label">Activities</div></div>
        <div class="kpi-tile"><div class="kpi-value">${summary.totalVariants || 0}</div><div class="kpi-label">Variants</div></div>
      </div>
    </div>`;

    // Executive text
    if (analysis.executiveSummary) {
      html += `<div class="result-panel">
        <h3>Insights</h3>
        <ul style="font-size:0.85rem;padding-left:1.5rem">
          ${(analysis.executiveSummary.keyFindings || []).map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>`;
    }

    // Process Model
    if (analysis.processModel) {
      const model = analysis.processModel;
      html += `<div class="result-panel">
        <h3>Process Model</h3>
        <table class="data-table"><thead><tr><th>Source</th><th>Target</th><th>Frequency</th><th>Dependency</th></tr></thead><tbody>`;
      const edges = model.edges || [];
      for (const edge of edges.slice(0, 15)) {
        html += `<tr><td>${edge.source}</td><td>${edge.target}</td><td>${edge.frequency}</td><td>${(edge.dependency || 0).toFixed(2)}</td></tr>`;
      }
      if (edges.length > 15) html += `<tr><td colspan="4" style="color:var(--sapTextLight)">... and ${edges.length - 15} more edges</td></tr>`;
      html += '</tbody></table></div>';
    }

    // Variants
    if (analysis.variantAnalysis) {
      const va = analysis.variantAnalysis;
      const variants = va.variants || [];
      html += `<div class="result-panel">
        <h3>Top Variants</h3>
        <div style="font-size:0.85rem;margin-bottom:0.5rem">Happy path: <strong>${va.happyPath || 'N/A'}</strong></div>
        <div class="chart-container"><canvas id="variants-chart"></canvas></div>
      </div>`;

      // Will render chart after DOM insert
      this._pendingVariantsChart = variants.slice(0, 10);
    }

    // Performance
    if (analysis.performance) {
      const perf = analysis.performance;
      const perfSummary = perf.summary || {};
      html += `<div class="result-panel">
        <h3>Performance — Bottlenecks</h3>
        <div class="kpi-grid">
          <div class="kpi-tile"><div class="kpi-value">${this._formatDuration(perfSummary.avgCaseDuration)}</div><div class="kpi-label">Avg Case Duration</div></div>
          <div class="kpi-tile"><div class="kpi-value">${this._formatDuration(perfSummary.medianCaseDuration)}</div><div class="kpi-label">Median Duration</div></div>
        </div>
        <div class="chart-container"><canvas id="bottleneck-chart"></canvas></div>
      </div>`;

      this._pendingBottleneckData = perf.activityDurations;
    }

    // Conformance
    if (analysis.conformance) {
      const conf = analysis.conformance;
      html += `<div class="result-panel">
        <h3>Conformance</h3>
        <div class="kpi-grid">
          <div class="kpi-tile"><div class="kpi-value">${((conf.fitness || 0) * 100).toFixed(1)}%</div><div class="kpi-label">Fitness</div></div>
          <div class="kpi-tile"><div class="kpi-value">${((conf.precision || 0) * 100).toFixed(1)}%</div><div class="kpi-label">Precision</div></div>
        </div>
      </div>`;
    }

    // Social Network
    if (analysis.socialNetwork) {
      const sn = analysis.socialNetwork;
      const snSummary = sn.summary || {};
      html += `<div class="result-panel">
        <h3>Social Network</h3>
        <div style="font-size:0.85rem">
          Resources: <strong>${snSummary.totalResources || 0}</strong> &middot;
          Handovers: <strong>${snSummary.totalHandovers || 0}</strong>
        </div>
      </div>`;
    }

    // KPIs
    if (analysis.kpis) {
      const kpis = analysis.kpis;
      html += `<div class="result-panel">
        <h3>Key Performance Indicators</h3>
        <div class="chart-container"><canvas id="kpi-radar-chart"></canvas></div>
      </div>`;
      this._pendingKPIs = kpis;
    }

    el.innerHTML = html;

    // Render deferred charts
    this._renderDeferredCharts();
  },

  _renderDeferredCharts() {
    // Variants bar chart
    if (this._pendingVariantsChart && typeof createBarChart === 'function') {
      const variants = this._pendingVariantsChart;
      createBarChart('variants-chart', {
        labels: variants.map((_, i) => `V${i + 1}`),
        datasets: [{ label: 'Cases', data: variants.map(v => v.caseCount || v.count || 0) }],
      });
      this._pendingVariantsChart = null;
    }

    // Bottleneck chart
    if (this._pendingBottleneckData && typeof createBarChart === 'function') {
      const durations = this._pendingBottleneckData;
      if (durations && typeof durations === 'object') {
        const entries = Object.entries(durations).slice(0, 10);
        createBarChart('bottleneck-chart', {
          labels: entries.map(([k]) => k),
          datasets: [{ label: 'Avg Duration (ms)', data: entries.map(([, v]) => v.mean || v.avg || 0) }],
        });
      }
      this._pendingBottleneckData = null;
    }

    // KPI radar
    if (this._pendingKPIs && typeof createRadarChart === 'function') {
      const kpis = this._pendingKPIs;
      const labels = [];
      const values = [];
      const categories = ['time', 'quality', 'volume'];
      for (const cat of categories) {
        if (kpis[cat]) {
          for (const [key, val] of Object.entries(kpis[cat])) {
            labels.push(key);
            values.push(typeof val === 'number' ? val : (val?.value || 0));
          }
        }
      }
      if (labels.length > 0) {
        createRadarChart('kpi-radar-chart', {
          labels: labels.slice(0, 8),
          datasets: [{ label: 'KPIs', data: values.slice(0, 8) }],
        });
      }
      this._pendingKPIs = null;
    }
  },

  _formatDuration(ms) {
    if (ms === undefined || ms === null) return 'N/A';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  },
};
