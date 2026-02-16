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
 * Chart.js Wrapper — Consistent SAP-themed charts
 *
 * Helper functions that create/recreate Chart.js charts with
 * the SAP Fiori Horizon color palette.
 */

/* global Chart */

const SAP_COLORS = [
  '#0a6ed1', // brand blue
  '#107e3e', // positive green
  '#e9730c', // critical orange
  '#bb0000', // negative red
  '#6a6d70', // neutral grey
  '#1a9898', // teal
  '#a66bbe', // purple
  '#c87b00', // gold
  '#049b9a', // turquoise
  '#d04343', // salmon
];

const SAP_COLORS_LIGHT = [
  'rgba(10,110,209,0.15)',
  'rgba(16,126,62,0.15)',
  'rgba(233,115,12,0.15)',
  'rgba(187,0,0,0.15)',
  'rgba(106,109,112,0.15)',
  'rgba(26,152,152,0.15)',
  'rgba(166,107,190,0.15)',
  'rgba(200,123,0,0.15)',
  'rgba(4,155,154,0.15)',
  'rgba(208,67,67,0.15)',
];

// Track active charts for cleanup
const _activeCharts = {};

function _destroyExisting(canvasId) {
  if (_activeCharts[canvasId]) {
    _activeCharts[canvasId].destroy();
    delete _activeCharts[canvasId];
  }
}

function _getCtx(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  return canvas.getContext('2d');
}

/**
 * Create a bar chart.
 * @param {string} canvasId
 * @param {{ labels: string[], datasets: Array<{label: string, data: number[]}> }} data
 * @param {object} [options]
 */
function createBarChart(canvasId, data, options = {}) {
  _destroyExisting(canvasId);
  const ctx = _getCtx(canvasId);
  if (!ctx) return null;

  const datasets = (data.datasets || []).map((ds, i) => ({
    ...ds,
    backgroundColor: ds.backgroundColor || SAP_COLORS[i % SAP_COLORS.length],
    borderColor: ds.borderColor || SAP_COLORS[i % SAP_COLORS.length],
    borderWidth: 1,
    borderRadius: 4,
  }));

  const chart = new Chart(ctx, {
    type: 'bar',
    data: { labels: data.labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: datasets.length > 1 } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } },
      },
      ...options,
    },
  });
  _activeCharts[canvasId] = chart;
  return chart;
}

/**
 * Create a doughnut chart.
 * @param {string} canvasId
 * @param {{ labels: string[], data: number[] }} data
 * @param {object} [options]
 */
function createDoughnutChart(canvasId, data, options = {}) {
  _destroyExisting(canvasId);
  const ctx = _getCtx(canvasId);
  if (!ctx) return null;

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.data,
        backgroundColor: data.colors || SAP_COLORS.slice(0, data.data.length),
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } },
      },
      cutout: '60%',
      ...options,
    },
  });
  _activeCharts[canvasId] = chart;
  return chart;
}

/**
 * Create a line chart.
 * @param {string} canvasId
 * @param {{ labels: string[], datasets: Array<{label: string, data: number[]}> }} data
 * @param {object} [options]
 */
function createLineChart(canvasId, data, options = {}) {
  _destroyExisting(canvasId);
  const ctx = _getCtx(canvasId);
  if (!ctx) return null;

  const datasets = (data.datasets || []).map((ds, i) => ({
    ...ds,
    borderColor: ds.borderColor || SAP_COLORS[i % SAP_COLORS.length],
    backgroundColor: ds.backgroundColor || SAP_COLORS_LIGHT[i % SAP_COLORS_LIGHT.length],
    tension: 0.3,
    fill: true,
    pointRadius: 3,
    pointHoverRadius: 5,
  }));

  const chart = new Chart(ctx, {
    type: 'line',
    data: { labels: data.labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: datasets.length > 1 } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } },
      },
      ...options,
    },
  });
  _activeCharts[canvasId] = chart;
  return chart;
}

/**
 * Create a radar chart.
 * @param {string} canvasId
 * @param {{ labels: string[], datasets: Array<{label: string, data: number[]}> }} data
 * @param {object} [options]
 */
function createRadarChart(canvasId, data, options = {}) {
  _destroyExisting(canvasId);
  const ctx = _getCtx(canvasId);
  if (!ctx) return null;

  const datasets = (data.datasets || []).map((ds, i) => ({
    ...ds,
    borderColor: ds.borderColor || SAP_COLORS[i % SAP_COLORS.length],
    backgroundColor: ds.backgroundColor || SAP_COLORS_LIGHT[i % SAP_COLORS_LIGHT.length],
    pointBackgroundColor: SAP_COLORS[i % SAP_COLORS.length],
    pointRadius: 3,
  }));

  const chart = new Chart(ctx, {
    type: 'radar',
    data: { labels: data.labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: options.max || undefined,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { size: 10 } },
        },
      },
      plugins: { legend: { position: 'bottom' } },
      ...options,
    },
  });
  _activeCharts[canvasId] = chart;
  return chart;
}
