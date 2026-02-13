/**
 * Process Catalog Loader
 *
 * Loads and queries the externalized business process catalog.
 * Used by TestScenarioEngine and SDT phase for test generation.
 */

const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, 'process-catalog.json');

let _cached = null;

/**
 * Load the process catalog (cached after first load).
 * @returns {object} The full catalog object
 */
function loadCatalog() {
  if (!_cached) {
    const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
    _cached = JSON.parse(raw);
  }
  return _cached;
}

/**
 * Get all processes across all modules.
 * @returns {Array<{id, name, category, steps, priority, transactions, module}>}
 */
function getAllProcesses() {
  const catalog = loadCatalog();
  const all = [];
  for (const [moduleCode, mod] of Object.entries(catalog.modules)) {
    for (const proc of mod.processes) {
      all.push({ ...proc, module: moduleCode });
    }
  }
  return all;
}

/**
 * Get processes for a specific module.
 * @param {string} moduleCode - e.g. 'FI', 'MM', 'SD'
 * @returns {Array}
 */
function getProcessesByModule(moduleCode) {
  const catalog = loadCatalog();
  const mod = catalog.modules[moduleCode.toUpperCase()];
  if (!mod) return [];
  return mod.processes.map(p => ({ ...p, module: moduleCode.toUpperCase() }));
}

/**
 * Get processes by category.
 * @param {string} category - e.g. 'Order to Cash', 'Procure to Pay'
 * @returns {Array}
 */
function getProcessesByCategory(category) {
  return getAllProcesses().filter(p =>
    p.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get processes by priority.
 * @param {string} priority - 'critical', 'high', 'medium', 'low'
 * @returns {Array}
 */
function getProcessesByPriority(priority) {
  return getAllProcesses().filter(p => p.priority === priority);
}

/**
 * Get a single process by ID.
 * @param {string} processId - e.g. 'OTC-001'
 * @returns {object|null}
 */
function getProcessById(processId) {
  return getAllProcesses().find(p => p.id === processId) || null;
}

/**
 * Get available module codes.
 * @returns {string[]}
 */
function getModuleCodes() {
  const catalog = loadCatalog();
  return Object.keys(catalog.modules);
}

/**
 * Get catalog summary stats.
 * @returns {{ totalProcesses, totalModules, byPriority, byModule }}
 */
function getSummary() {
  const all = getAllProcesses();
  const byPriority = { critical: 0, high: 0, medium: 0, low: 0 };
  const byModule = {};

  for (const p of all) {
    byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
    byModule[p.module] = (byModule[p.module] || 0) + 1;
  }

  return {
    totalProcesses: all.length,
    totalModules: getModuleCodes().length,
    byPriority,
    byModule,
  };
}

/**
 * Clear the cached catalog (useful for testing).
 */
function clearCache() {
  _cached = null;
}

module.exports = {
  loadCatalog,
  getAllProcesses,
  getProcessesByModule,
  getProcessesByCategory,
  getProcessesByPriority,
  getProcessById,
  getModuleCodes,
  getSummary,
  clearCache,
};
