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
