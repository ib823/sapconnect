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
 * Overview Page Module
 *
 * Platform summary KPI tiles, health status, and quick-action buttons.
 */

/* global ApiClient, createDoughnutChart */

const OverviewPage = {
  async render(container, api) {
    container.innerHTML = `
      <h2 class="page-title">Platform Overview</h2>
      <div class="kpi-grid" id="overview-kpis">
        <div class="kpi-tile"><div class="spinner"></div></div>
      </div>
      <div class="card-grid">
        <div class="card">
          <div class="card-title">Health Status</div>
          <div id="health-status"><div class="spinner"></div></div>
        </div>
        <div class="card">
          <div class="card-title">Migration Summary</div>
          <div id="migration-overview"><div class="spinner"></div></div>
        </div>
        <div class="card">
          <div class="card-title">Rules Breakdown</div>
          <div class="chart-container"><canvas id="rules-chart"></canvas></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Quick Actions</div>
        <div style="display:flex;gap:0.75rem">
          <button class="btn btn-primary" id="btn-run-migration">Run Migration</button>
          <button class="btn btn-secondary" id="btn-run-demo">Run Demo Analysis (O2C)</button>
        </div>
      </div>
    `;

    // Load data
    this._loadKPIs(api);
    this._loadHealth(api);
    this._loadMigration(api);
    this._bindActions(api);
  },

  async _loadKPIs(api) {
    try {
      const data = await api.getPlatformSummary();
      const grid = document.getElementById('overview-kpis');
      grid.innerHTML = `
        <div class="kpi-tile">
          <div class="kpi-value">${data.migration.objects}</div>
          <div class="kpi-label">Migration Objects</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-value">${data.forensic.extractors}</div>
          <div class="kpi-label">Forensic Extractors</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-value">${data.processMining.processes}</div>
          <div class="kpi-label">Process Types</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-value">${data.migration.objects + data.forensic.extractors + data.processMining.processes}</div>
          <div class="kpi-label">Total Components</div>
        </div>
      `;
    } catch (err) {
      document.getElementById('overview-kpis').innerHTML =
        `<div class="kpi-tile" style="color:var(--sapNegative)">Failed to load KPIs</div>`;
    }
  },

  async _loadHealth(api) {
    try {
      const data = await api.getHealth();
      const el = document.getElementById('health-status');
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
          <span class="badge ${data.status === 'up' ? 'badge-success' : 'badge-error'}">${data.status.toUpperCase()}</span>
          <span style="font-size:0.85rem">${data.name} v${data.version}</span>
        </div>
        <div style="font-size:0.8rem;color:var(--sapTextLight)">
          Uptime: ${Math.floor(data.uptime / 60)}m &middot; PID: ${data.pid} &middot; RSS: ${Math.round(data.memory.rss / 1024 / 1024)}MB
        </div>
      `;
    } catch {
      document.getElementById('health-status').innerHTML =
        '<span class="badge badge-error">UNREACHABLE</span>';
    }
  },

  async _loadMigration(api) {
    try {
      const data = await api.getMigrationSummary();
      const el = document.getElementById('migration-overview');
      el.innerHTML = `
        <div style="font-size:0.85rem;margin-bottom:0.5rem">
          <strong>${data.totalObjects}</strong> objects &middot; <strong>${data.totalRules}</strong> rules
        </div>
        <div style="font-size:0.8rem;color:var(--sapTextLight)">
          Last run: ${data.lastRun ? new Date(data.lastRun).toLocaleString() : 'Never'}
        </div>
      `;

      // Rules breakdown chart
      if (data.rulesBreakdown && typeof createDoughnutChart === 'function') {
        const labels = Object.keys(data.rulesBreakdown);
        const values = Object.values(data.rulesBreakdown);
        if (labels.length > 0) {
          createDoughnutChart('rules-chart', { labels, data: values });
        }
      }
    } catch {
      document.getElementById('migration-overview').innerHTML =
        '<span style="color:var(--sapTextLight)">No migration data</span>';
    }
  },

  _bindActions(api) {
    document.getElementById('btn-run-migration')?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      e.target.textContent = 'Running...';
      try {
        await api.runMigration();
        window.DashboardApp?.showToast('Migration started');
      } catch (err) {
        window.DashboardApp?.showToast('Migration failed: ' + err.message, true);
      } finally {
        e.target.disabled = false;
        e.target.textContent = 'Run Migration';
      }
    });

    document.getElementById('btn-run-demo')?.addEventListener('click', () => {
      window.location.hash = '#process-mining';
      setTimeout(() => {
        document.getElementById('btn-demo-analyze')?.click();
      }, 300);
    });
  },
};
