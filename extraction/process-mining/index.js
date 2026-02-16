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
 * Process Mining — Public API
 *
 * Enterprise-grade process intelligence for SAP systems.
 * Supports all 7 standard SAP end-to-end processes with complete
 * table-to-event-log mappings, reference models, and 30+ KPIs.
 *
 * Usage:
 *   const { ProcessIntelligenceEngine, EventLog, Event, Trace } = require('./extraction/process-mining');
 *
 *   const engine = new ProcessIntelligenceEngine();
 *   const log = new EventLog('my-log');
 *   // ... populate event log ...
 *   const report = await engine.analyze(log, { processId: 'O2C' });
 */

'use strict';

// Foundation
const { Event, Trace, EventLog } = require('./event-log');

// Algorithms
const { HeuristicMiner, ProcessModel } = require('./heuristic-miner');
const { VariantAnalyzer, VariantAnalysisResult } = require('./variant-analyzer');
const { PerformanceAnalyzer, PerformanceResult } = require('./performance-analyzer');
const { ConformanceChecker, ConformanceResult } = require('./conformance-checker');
const { SocialNetworkMiner, SocialNetworkResult } = require('./social-network-miner');
const { KPIEngine, KPIReport } = require('./kpi-engine');

// SAP Configuration
const {
  TABLE_TYPES,
  PROCESS_CONFIGS,
  getProcessConfig,
  getAllProcessIds,
  getTablesForProcess,
  isS4Hana,
  adaptConfigForS4,
  getActivityFromTcode,
} = require('./sap-table-config');

// Reference Models
const {
  ReferenceModel,
  REFERENCE_MODELS,
  getReferenceModel,
  getAllReferenceModelIds,
} = require('./reference-models');

// Orchestrator
const { ProcessIntelligenceEngine, ProcessIntelligenceReport } = require('./process-intelligence-engine');

module.exports = {
  // Orchestrator (primary entry point)
  ProcessIntelligenceEngine,
  ProcessIntelligenceReport,

  // Data Model
  Event,
  Trace,
  EventLog,

  // Algorithms
  HeuristicMiner,
  ProcessModel,
  VariantAnalyzer,
  VariantAnalysisResult,
  PerformanceAnalyzer,
  PerformanceResult,
  ConformanceChecker,
  ConformanceResult,
  SocialNetworkMiner,
  SocialNetworkResult,
  KPIEngine,
  KPIReport,

  // SAP Configuration
  TABLE_TYPES,
  PROCESS_CONFIGS,
  getProcessConfig,
  getAllProcessIds,
  getTablesForProcess,
  isS4Hana,
  adaptConfigForS4,
  getActivityFromTcode,

  // Reference Models
  ReferenceModel,
  REFERENCE_MODELS,
  getReferenceModel,
  getAllReferenceModelIds,
};
