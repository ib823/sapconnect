/**
 * Extraction → Migration Bridge
 *
 * Connects forensic extraction results to migration planning.
 * Takes what the system discovery found and recommends what to migrate,
 * in what order, with what priority and estimated complexity.
 *
 * Flow: ForensicOrchestrator.run() → MigrationBridge.plan() → MigrationObjectRegistry.runAll()
 */

const Logger = require('../lib/logger');
const { DependencyGraph } = require('../migration/dependency-graph');

// Maps extraction module names → migration object IDs
const MODULE_OBJECT_MAP = {
  FI: ['GL_BALANCE', 'GL_ACCOUNT_MASTER', 'CUSTOMER_OPEN_ITEM', 'VENDOR_OPEN_ITEM', 'FIXED_ASSET', 'ASSET_ACQUISITION', 'FI_CONFIG'],
  CO: ['COST_CENTER', 'COST_ELEMENT', 'PROFIT_CENTER', 'PROFIT_SEGMENT', 'INTERNAL_ORDER', 'WBS_ELEMENT', 'CO_CONFIG'],
  MM: ['MATERIAL_MASTER', 'PURCHASE_ORDER', 'SOURCE_LIST', 'SCHEDULING_AGREEMENT', 'PURCHASE_CONTRACT', 'BATCH_MASTER', 'PRICING_CONDITION', 'MM_CONFIG'],
  SD: ['SALES_ORDER', 'PRICING_CONDITION', 'SD_CONFIG'],
  PP: ['PRODUCTION_ORDER', 'BOM_ROUTING', 'INSPECTION_PLAN'],
  PM: ['EQUIPMENT_MASTER', 'FUNCTIONAL_LOCATION', 'WORK_CENTER', 'MAINTENANCE_ORDER'],
  HR: ['EMPLOYEE_MASTER', 'BANK_MASTER', 'BUSINESS_PARTNER'],
  EWM: ['WAREHOUSE_STRUCTURE'],
  TM: ['TRANSPORT_ROUTE'],
  GTS: ['TRADE_COMPLIANCE'],
  BW: ['BW_EXTRACTOR'],
  BASIS: ['RFC_DESTINATION', 'IDOC_CONFIG', 'WEB_SERVICE', 'BATCH_JOB'],
};

// Complexity factors per object (base hours for planning)
const COMPLEXITY_MAP = {
  GL_BALANCE: { base: 40, perThousandRecords: 2 },
  GL_ACCOUNT_MASTER: { base: 16, perThousandRecords: 0.5 },
  BUSINESS_PARTNER: { base: 60, perThousandRecords: 3 },
  MATERIAL_MASTER: { base: 48, perThousandRecords: 2.5 },
  PURCHASE_ORDER: { base: 32, perThousandRecords: 1.5 },
  SALES_ORDER: { base: 32, perThousandRecords: 1.5 },
  FIXED_ASSET: { base: 36, perThousandRecords: 2 },
  COST_CENTER: { base: 12, perThousandRecords: 0.3 },
  PROFIT_CENTER: { base: 12, perThousandRecords: 0.3 },
  EMPLOYEE_MASTER: { base: 48, perThousandRecords: 3 },
};
const DEFAULT_COMPLEXITY = { base: 20, perThousandRecords: 1 };

// Priority weights
const PRIORITY = {
  FI_CONFIG: 100, CO_CONFIG: 100, MM_CONFIG: 100, SD_CONFIG: 100,
  GL_ACCOUNT_MASTER: 95, COST_CENTER: 95, PROFIT_CENTER: 95,
  BUSINESS_PARTNER: 90, BANK_MASTER: 90, MATERIAL_MASTER: 90,
  GL_BALANCE: 85, CUSTOMER_OPEN_ITEM: 85, VENDOR_OPEN_ITEM: 85,
  FIXED_ASSET: 80, COST_ELEMENT: 80,
  PURCHASE_ORDER: 75, SALES_ORDER: 75,
  EMPLOYEE_MASTER: 70,
  EQUIPMENT_MASTER: 65, FUNCTIONAL_LOCATION: 65,
};
const DEFAULT_PRIORITY = 50;

class MigrationBridge {
  constructor(options = {}) {
    this.log = new Logger('migration-bridge', { level: options.logLevel || 'info' });
    this._depGraph = new DependencyGraph();
  }

  /**
   * Generate a migration plan from forensic extraction results.
   *
   * @param {object} forensicResult - Output from ForensicOrchestrator.run()
   * @param {object} [planOptions]
   * @param {string[]} [planOptions.includeModules] - Only include these modules
   * @param {string[]} [planOptions.excludeModules] - Exclude these modules
   * @param {string[]} [planOptions.excludeObjects] - Exclude specific objects
   * @param {boolean} [planOptions.includeInterfaces=true] - Include interface objects
   * @param {boolean} [planOptions.includeConfig=true] - Include config objects
   * @returns {MigrationPlan}
   */
  plan(forensicResult, planOptions = {}) {
    const includeInterfaces = planOptions.includeInterfaces !== false;
    const includeConfig = planOptions.includeConfig !== false;

    // 1. Identify active modules from extraction
    const activeModules = this._identifyActiveModules(forensicResult);
    this.log.info(`Active modules detected: ${activeModules.map(m => m.module).join(', ')}`);

    // 2. Apply module filters
    let filteredModules = activeModules;
    if (planOptions.includeModules) {
      const incl = new Set(planOptions.includeModules.map(m => m.toUpperCase()));
      filteredModules = filteredModules.filter(m => incl.has(m.module));
    }
    if (planOptions.excludeModules) {
      const excl = new Set(planOptions.excludeModules.map(m => m.toUpperCase()));
      filteredModules = filteredModules.filter(m => !excl.has(m.module));
    }

    // 3. Map modules to migration objects
    let objectIds = this._mapModulesToObjects(filteredModules, includeInterfaces, includeConfig);

    // 4. Apply object exclusions
    if (planOptions.excludeObjects) {
      const excl = new Set(planOptions.excludeObjects);
      objectIds = objectIds.filter(id => !excl.has(id));
    }

    // 5. Add dependency prerequisites (objects needed but not in active modules)
    objectIds = this._addPrerequisites(objectIds);

    // 6. Build object details with volume estimates and complexity
    const objectDetails = this._buildObjectDetails(objectIds, forensicResult);

    // 7. Get execution waves from dependency graph
    const waves = this._depGraph.getExecutionWaves(objectIds);

    // 8. Build risk assessment
    const risks = this._assessRisks(forensicResult, objectDetails);

    // 9. Estimate total effort
    const effort = this._estimateEffort(objectDetails);

    const plan = {
      generatedAt: new Date().toISOString(),
      scope: {
        activeModules: filteredModules.map(m => m.module),
        totalObjects: objectIds.length,
        totalEstimatedRecords: objectDetails.reduce((sum, o) => sum + o.estimatedRecords, 0),
      },
      objects: objectDetails,
      executionPlan: {
        waves: waves.map((wave, i) => ({
          waveNumber: i + 1,
          objectIds: wave,
          canRunInParallel: true,
          objects: wave.map(id => objectDetails.find(o => o.objectId === id)).filter(Boolean),
        })),
        totalWaves: waves.length,
      },
      effort,
      risks,
      confidence: forensicResult.confidence || {},
      recommendations: this._generateRecommendations(forensicResult, objectDetails, risks),
    };

    this.log.info(`Migration plan: ${plan.scope.totalObjects} objects in ${plan.executionPlan.totalWaves} waves`);
    return plan;
  }

  /**
   * Identify active modules from extraction results.
   */
  _identifyActiveModules(forensicResult) {
    const modules = [];
    const results = forensicResult.results instanceof Map
      ? Object.fromEntries(forensicResult.results)
      : (forensicResult.results || {});

    // Check each known module for evidence of activity
    const moduleIndicators = {
      FI: ['FI_TRANSACTIONS', 'FI_GL_ACCOUNTS', 'FI_COMPANY_CODES'],
      CO: ['CO_COST_CENTERS', 'CO_PROFIT_CENTERS', 'CO_INTERNAL_ORDERS'],
      MM: ['MM_MATERIALS', 'MM_PURCHASING', 'MM_INVENTORY'],
      SD: ['SD_SALES', 'SD_PRICING', 'SD_CUSTOMERS'],
      PP: ['PP_PRODUCTION', 'PP_BOM', 'PP_ROUTING'],
      PM: ['PM_EQUIPMENT', 'PM_MAINTENANCE', 'PM_WORK_CENTERS'],
      HR: ['HR_EMPLOYEES', 'HR_ORG_STRUCTURE'],
      EWM: ['EWM_WAREHOUSE'],
      TM: ['TM_TRANSPORT'],
      GTS: ['GTS_COMPLIANCE'],
      BW: ['BW_EXTRACTORS'],
      BASIS: ['BASIS_RFC', 'BASIS_IDOC', 'BASIS_BATCH_JOBS'],
    };

    for (const [mod, indicators] of Object.entries(moduleIndicators)) {
      const found = indicators.filter(id => results[id] && !results[id].error);
      if (found.length > 0) {
        // Estimate data volume from extraction results
        let estimatedRecords = 0;
        for (const id of found) {
          const r = results[id];
          if (r && r.records) {
            estimatedRecords += Array.isArray(r.records) ? r.records.length : (r.recordCount || 0);
          } else if (r && r.count) {
            estimatedRecords += r.count;
          }
        }

        modules.push({
          module: mod,
          extractorsFound: found.length,
          extractorsTotal: indicators.length,
          coverage: Math.round((found.length / indicators.length) * 100),
          estimatedRecords,
        });
      }
    }

    // Sort by coverage (most complete first)
    modules.sort((a, b) => b.coverage - a.coverage);
    return modules;
  }

  /**
   * Map active modules to concrete migration object IDs.
   */
  _mapModulesToObjects(activeModules, includeInterfaces, includeConfig) {
    const objectSet = new Set();

    for (const mod of activeModules) {
      const objects = MODULE_OBJECT_MAP[mod.module] || [];
      for (const objId of objects) {
        // Filter out config/interface if requested
        if (!includeConfig && objId.endsWith('_CONFIG')) continue;
        if (!includeInterfaces && ['RFC_DESTINATION', 'IDOC_CONFIG', 'WEB_SERVICE', 'BATCH_JOB'].includes(objId)) continue;
        objectSet.add(objId);
      }
    }

    return Array.from(objectSet);
  }

  /**
   * Add prerequisite objects needed by dependency graph but not in active modules.
   */
  _addPrerequisites(objectIds) {
    const allNeeded = new Set(objectIds);

    for (const id of objectIds) {
      const transitive = this._depGraph.getTransitiveDependencies(id);
      for (const dep of transitive) {
        allNeeded.add(dep);
      }
    }

    const added = [...allNeeded].filter(id => !objectIds.includes(id));
    if (added.length > 0) {
      this.log.info(`Added ${added.length} prerequisite objects: ${added.join(', ')}`);
    }

    return Array.from(allNeeded);
  }

  /**
   * Build detailed object entries with volume estimates and complexity.
   */
  _buildObjectDetails(objectIds, forensicResult) {
    return objectIds.map(id => {
      const complexity = COMPLEXITY_MAP[id] || DEFAULT_COMPLEXITY;
      const priority = PRIORITY[id] || DEFAULT_PRIORITY;
      const estimatedRecords = this._estimateObjectRecords(id, forensicResult);
      const estimatedHours = complexity.base + (estimatedRecords / 1000) * complexity.perThousandRecords;
      const deps = this._depGraph.getDependencies(id);

      return {
        objectId: id,
        priority,
        estimatedRecords,
        estimatedHours: Math.round(estimatedHours * 10) / 10,
        complexityBase: complexity.base,
        dependencies: deps,
        isPrerequisite: false, // Will be updated below
      };
    }).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Estimate record count for an object based on extraction data.
   */
  _estimateObjectRecords(objectId, forensicResult) {
    const results = forensicResult.results instanceof Map
      ? Object.fromEntries(forensicResult.results)
      : (forensicResult.results || {});

    // Heuristic mapping from object IDs to extraction results
    const objectExtractorMap = {
      GL_BALANCE: 'FI_TRANSACTIONS',
      GL_ACCOUNT_MASTER: 'FI_GL_ACCOUNTS',
      BUSINESS_PARTNER: 'SD_CUSTOMERS',
      MATERIAL_MASTER: 'MM_MATERIALS',
      PURCHASE_ORDER: 'MM_PURCHASING',
      SALES_ORDER: 'SD_SALES',
      COST_CENTER: 'CO_COST_CENTERS',
      PROFIT_CENTER: 'CO_PROFIT_CENTERS',
      EMPLOYEE_MASTER: 'HR_EMPLOYEES',
      EQUIPMENT_MASTER: 'PM_EQUIPMENT',
    };

    const extractorId = objectExtractorMap[objectId];
    if (extractorId && results[extractorId]) {
      const r = results[extractorId];
      if (r.records && Array.isArray(r.records)) return r.records.length;
      if (r.count) return r.count;
      if (r.recordCount) return r.recordCount;
    }

    return 0; // Unknown — will need to be refined during profiling phase
  }

  /**
   * Assess migration risks based on extraction findings.
   */
  _assessRisks(forensicResult, objectDetails) {
    const risks = [];

    // 1. Low confidence score
    const confidence = forensicResult.confidence;
    if (confidence && confidence.overall < 70) {
      risks.push({
        level: 'high',
        category: 'data-completeness',
        description: `Extraction confidence is ${confidence.overall}% — significant data gaps may exist`,
        mitigation: 'Re-run extraction with elevated SAP authorization, review gap report',
      });
    }

    // 2. Gap report issues
    const gapReport = forensicResult.gapReport || {};
    if (gapReport.extraction && gapReport.extraction.missingCriticalTables?.length > 0) {
      risks.push({
        level: 'high',
        category: 'missing-data',
        description: `${gapReport.extraction.missingCriticalTables.length} critical tables not extracted`,
        tables: gapReport.extraction.missingCriticalTables,
        mitigation: 'Ensure SAP authorization for listed tables, re-extract',
      });
    }

    // 3. Authorization gaps
    if (gapReport.authorization && gapReport.authorization.count > 0) {
      risks.push({
        level: 'medium',
        category: 'authorization',
        description: `${gapReport.authorization.count} tables could not be read due to authorization`,
        mitigation: 'Request additional SAP roles for extraction user',
      });
    }

    // 4. High volume objects
    const highVolume = objectDetails.filter(o => o.estimatedRecords > 100000);
    if (highVolume.length > 0) {
      risks.push({
        level: 'medium',
        category: 'data-volume',
        description: `${highVolume.length} objects have >100K records — may need batched migration`,
        objects: highVolume.map(o => o.objectId),
        mitigation: 'Plan for incremental/delta migration, increase batch sizes',
      });
    }

    // 5. Human validation items
    if (forensicResult.humanValidation && forensicResult.humanValidation.length > 3) {
      risks.push({
        level: 'low',
        category: 'validation',
        description: `${forensicResult.humanValidation.length} items require human validation before migration`,
        mitigation: 'Schedule validation workshops with business stakeholders',
      });
    }

    return risks;
  }

  /**
   * Estimate total migration effort.
   */
  _estimateEffort(objectDetails) {
    const totalHours = objectDetails.reduce((sum, o) => sum + o.estimatedHours, 0);
    const configHours = objectDetails
      .filter(o => o.objectId.endsWith('_CONFIG'))
      .reduce((sum, o) => sum + o.estimatedHours, 0);
    const dataHours = totalHours - configHours;

    return {
      totalEstimatedHours: Math.round(totalHours),
      configurationHours: Math.round(configHours),
      dataMigrationHours: Math.round(dataHours),
      // Assumes 6-hour productive day, 2 FTEs
      estimatedCalendarDays: Math.ceil(totalHours / 12),
      breakdown: {
        config: objectDetails.filter(o => o.objectId.endsWith('_CONFIG')).length,
        masterData: objectDetails.filter(o =>
          ['GL_ACCOUNT_MASTER', 'BUSINESS_PARTNER', 'MATERIAL_MASTER', 'COST_CENTER',
            'PROFIT_CENTER', 'BANK_MASTER', 'EMPLOYEE_MASTER', 'EQUIPMENT_MASTER',
            'FUNCTIONAL_LOCATION', 'WORK_CENTER'].includes(o.objectId)
        ).length,
        transactional: objectDetails.filter(o =>
          ['GL_BALANCE', 'CUSTOMER_OPEN_ITEM', 'VENDOR_OPEN_ITEM', 'PURCHASE_ORDER',
            'SALES_ORDER', 'FIXED_ASSET', 'PRODUCTION_ORDER', 'MAINTENANCE_ORDER'].includes(o.objectId)
        ).length,
        interfaces: objectDetails.filter(o =>
          ['RFC_DESTINATION', 'IDOC_CONFIG', 'WEB_SERVICE', 'BATCH_JOB'].includes(o.objectId)
        ).length,
      },
    };
  }

  /**
   * Generate actionable recommendations.
   */
  _generateRecommendations(forensicResult, objectDetails, risks) {
    const recs = [];

    // Data quality first
    recs.push({
      phase: 'profile',
      action: 'Run data profiling on all master data objects before migration',
      objects: objectDetails
        .filter(o => o.estimatedRecords > 0 && o.priority >= 85)
        .map(o => o.objectId),
    });

    // High-risk items
    const highRisks = risks.filter(r => r.level === 'high');
    if (highRisks.length > 0) {
      recs.push({
        phase: 'pre-migration',
        action: 'Resolve high-risk items before starting migration',
        details: highRisks.map(r => r.description),
      });
    }

    // Config objects first
    const configObjects = objectDetails.filter(o => o.objectId.endsWith('_CONFIG'));
    if (configObjects.length > 0) {
      recs.push({
        phase: 'configure',
        action: 'Migrate configuration objects first — they are prerequisites for data',
        objects: configObjects.map(o => o.objectId),
      });
    }

    // BP dedup
    if (objectDetails.find(o => o.objectId === 'BUSINESS_PARTNER')) {
      recs.push({
        phase: 'profile',
        action: 'Run fuzzy duplicate detection on Business Partners before migration',
        details: 'Customers and vendors may overlap — use BP merge logic',
      });
    }

    return recs;
  }
}

module.exports = MigrationBridge;
