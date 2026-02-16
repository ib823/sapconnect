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
 * Dashboard App Controller
 *
 * Hash-based routing, lazy page loading, global error handling, toast notifications.
 */

/* global ApiClient, OverviewPage, ExtractionPage, MigrationPage, ProcessMiningPage */

const DashboardApp = {
  api: new ApiClient(),
  currentPage: null,
  autoRefreshTimer: null,

  pages: {
    overview: OverviewPage,
    extraction: ExtractionPage,
    migration: MigrationPage,
    'process-mining': ProcessMiningPage,
  },

  init() {
    // Nav links
    document.querySelectorAll('.nav-tabs a').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        window.location.hash = `#${page}`;
      });
    });

    // Hash routing
    window.addEventListener('hashchange', () => this.route());

    // Initial route
    this.route();

    // Global error handler
    window.addEventListener('unhandledrejection', (e) => {
      this.showToast('Unexpected error: ' + (e.reason?.message || 'Unknown'), true);
    });
  },

  route() {
    const hash = (window.location.hash || '#overview').replace('#', '');
    const page = this.pages[hash] ? hash : 'overview';

    // Update nav active state
    document.querySelectorAll('.nav-tabs a').forEach((link) => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    // Update page visibility
    document.querySelectorAll('.page').forEach((el) => {
      el.classList.toggle('active', el.id === `page-${page}`);
    });

    // Render page content
    const container = document.getElementById(`page-${page}`);
    if (container && this.pages[page]) {
      this.currentPage = page;
      this.pages[page].render(container, this.api);
    }
  },

  showToast(message, isError = false) {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    const toast = document.createElement('div');
    toast.className = `toast${isError ? ' toast-error' : ''}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  },

  toggleAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
      return false;
    }
    this.autoRefreshTimer = setInterval(() => this.route(), 30000);
    return true;
  },
};

// Expose globally for page modules
window.DashboardApp = DashboardApp;

// Boot
document.addEventListener('DOMContentLoaded', () => DashboardApp.init());
