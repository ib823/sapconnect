/**
 * S/4HANA Simplification Rules Database
 *
 * Thin wrapper that re-exports from the rules/ directory.
 * All rule definitions are now in migration/rules/*.js modules.
 */

module.exports = require('./rules/index');
