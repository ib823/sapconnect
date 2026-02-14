/**
 * Greenfield SAP Implementation Module
 *
 * Barrel export for all greenfield automation components:
 * - BDC engine for transaction recordings
 * - Config template library for project-type configurations
 * - SM30 generator for table maintenance BDC
 * - BAPI catalog for function module execution
 * - Transport manager for CTS pipeline
 * - Enhancement discovery for BAdi/exit scanning
 * - Migration cockpit for S/4HANA migration
 */

const { BdcEngine, SCREEN_SEQUENCES } = require('./bdc-engine');
const { ConfigTemplateLibrary } = require('./config-templates');
const { SM30Generator } = require('./sm30-generator');
const { BapiCatalog } = require('./bapi-catalog');
const { TransportManager } = require('./transport-manager');
const { EnhancementDiscovery } = require('./enhancement-discovery');
const { MigrationCockpit } = require('./migration-cockpit');

module.exports = {
  BdcEngine,
  SCREEN_SEQUENCES,
  ConfigTemplateLibrary,
  SM30Generator,
  BapiCatalog,
  TransportManager,
  EnhancementDiscovery,
  MigrationCockpit,
};
