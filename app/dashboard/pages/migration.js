/**
 * Migration Page Module
 *
 * Object grid with status badges, Run All / individual Run buttons,
 * expandable detail panels per object, and rules breakdown chart.
 */

/* global ApiClient, createBarChart */

const MigrationPage = {
  async render(container, api) {
    container.innerHTML = `
      <h2 class="page-title">Migration Objects</h2>
      <div class="form-group">
        <button class="btn btn-primary" id="btn-run-all">Run All</button>
      </div>
      <div id="migration-objects"><div class="loading-overlay"><div class="spinner"></div> Loading objects...</div></div>
      <div class="section" style="margin-top:2rem">
        <div class="section-title">Rules by Severity</div>
        <div class="chart-container"><canvas id="migration-rules-chart"></canvas></div>
      </div>
    `;

    this._loadObjects(api);
    this._bindRunAll(api);
  },

  async _loadObjects(api) {
    const el = document.getElementById('migration-objects');
    try {
      const data = await api.getMigrationObjects();
      const objects = data.objects || [];

      if (objects.length === 0) {
        el.innerHTML = '<div style="color:var(--sapTextLight)">No migration objects found.</div>';
        return;
      }

      let html = '<table class="data-table"><thead><tr>';
      html += '<th>ID</th><th>Name</th><th>Status</th><th>Rules</th><th>Actions</th>';
      html += '</tr></thead><tbody>';

      for (const obj of objects) {
        const statusClass = obj.status === 'completed' ? 'badge-success'
          : obj.status === 'failed' ? 'badge-error' : 'badge-neutral';
        html += `<tr data-id="${obj.id}">
          <td><strong>${obj.id}</strong></td>
          <td>${obj.name || obj.id}</td>
          <td><span class="badge ${statusClass}">${(obj.status || 'not_run').toUpperCase()}</span></td>
          <td>${obj.ruleCount || 0}</td>
          <td><button class="btn btn-secondary btn-run-one" data-id="${obj.id}" style="padding:0.25rem 0.5rem;font-size:0.75rem">Run</button></td>
        </tr>`;
      }

      html += '</tbody></table>';
      el.innerHTML = html;

      // Bind individual run buttons
      el.querySelectorAll('.btn-run-one').forEach((btn) => {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          btn.textContent = '...';
          try {
            await api.runObject(btn.dataset.id);
            window.DashboardApp?.showToast(`${btn.dataset.id} completed`);
            this._loadObjects(api); // refresh
          } catch (err) {
            window.DashboardApp?.showToast(`${btn.dataset.id} failed: ${err.message}`, true);
          } finally {
            btn.disabled = false;
            btn.textContent = 'Run';
          }
        });
      });

      // Rules chart
      this._renderRulesChart(objects);
    } catch (err) {
      el.innerHTML = `<div style="color:var(--sapNegative)">Failed to load objects: ${err.message}</div>`;
    }
  },

  _renderRulesChart(objects) {
    if (typeof createBarChart !== 'function') return;
    const severityCounts = {};
    for (const obj of objects) {
      if (obj.rules) {
        for (const rule of obj.rules) {
          const sev = rule.severity || 'info';
          severityCounts[sev] = (severityCounts[sev] || 0) + 1;
        }
      }
    }
    const labels = Object.keys(severityCounts);
    const data = Object.values(severityCounts);
    if (labels.length > 0) {
      createBarChart('migration-rules-chart', {
        labels,
        datasets: [{ label: 'Rules', data }],
      });
    }
  },

  _bindRunAll(api) {
    document.getElementById('btn-run-all')?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      e.target.textContent = 'Running...';
      try {
        await api.runMigration();
        window.DashboardApp?.showToast('Migration run started');
        setTimeout(() => this._loadObjects(api), 2000);
      } catch (err) {
        window.DashboardApp?.showToast('Run failed: ' + err.message, true);
      } finally {
        e.target.disabled = false;
        e.target.textContent = 'Run All';
      }
    });
  },
};
