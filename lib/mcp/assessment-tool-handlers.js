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
 * MCP Assessment Tool Handlers
 *
 * Handler functions for each of the 7 assessment MCP tools.
 * Mock mode returns realistic SAP migration assessment data;
 * live mode will connect to actual extraction and analysis engines.
 */

'use strict';

const Logger = require('../logger');

class AssessmentToolHandlers {
  /**
   * @param {object} [options]
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   * @param {object} [options.sessionContext] - Shared SessionContext instance for caching
   * @param {object} [options.logger] - Logger instance
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.sessionContext = options.sessionContext || {};
    this.logger = options.logger || new Logger('mcp-assessment-handlers');
  }

  /**
   * Route a tool call to the correct handler.
   * @param {string} toolName - Tool name (e.g., 'assessment_analyze_gaps')
   * @param {object} params - Tool parameters
   * @returns {object} Result payload
   */
  async handle(toolName, params) {
    const handlerName = `_handle_${toolName}`;
    const handler = this[handlerName];
    if (!handler) {
      throw new Error(`Unknown assessment tool: ${toolName}`);
    }
    this.logger.debug(`Handling ${toolName}`, { params });
    const result = await handler.call(this, params || {});
    this.logger.debug(`Completed ${toolName}`, { resultKeys: Object.keys(result) });
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Gap Analysis Tools
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Run gap analysis between source and target systems.
   * @param {object} params
   * @param {string} [params.sourceSystem='ECC']
   * @param {string} [params.targetSystem='S4HANA']
   * @param {string[]} [params.modules]
   * @returns {object} Gap analysis results
   */
  async _handle_assessment_analyze_gaps(params) {
    const sourceSystem = params.sourceSystem || 'ECC';
    const targetSystem = params.targetSystem || 'S4HANA';
    const modules = params.modules || ['FI', 'MM', 'SD', 'PP', 'WM'];

    const report = {
      sourceSystem,
      targetSystem,
      modules,
      totalGaps: 47,
      criticalGaps: 8,
      gapsByCategory: {
        functionality: 15,
        customCode: 18,
        integration: 8,
        data: 6,
      },
      topGaps: [
        {
          id: 'GAP-001',
          area: 'Custom Code',
          severity: 'critical',
          description: 'Custom ABAP pricing engine (Z_PRICING_*) uses obsolete ALV and direct table access incompatible with S/4HANA simplified data model',
          recommendation: 'Refactor to use AMDP or CDS views with new pricing conditions',
          effort: 'high',
        },
        {
          id: 'GAP-002',
          area: 'Data Migration',
          severity: 'critical',
          description: 'Material ledger data in CKMLHD/CKMLCR requires migration to universal journal (ACDOCA) with new valuation logic',
          recommendation: 'Use SAP migration cockpit with ML-specific extractors; validate parallel valuation areas',
          effort: 'high',
        },
        {
          id: 'GAP-003',
          area: 'Integration',
          severity: 'critical',
          description: 'RFC interfaces to 5 external warehouse systems use deprecated BAPI_GOODSMVT_CREATE without S/4 equivalent handling',
          recommendation: 'Migrate to S/4HANA Goods Movement API_GOODSMVT_CREATE with new parameter structure',
          effort: 'medium',
        },
        {
          id: 'GAP-004',
          area: 'Functionality',
          severity: 'high',
          description: 'Credit management uses classic FI-AR credit control; S/4HANA requires migration to SAP Credit Management (FIN-FSCM-CR)',
          recommendation: 'Map credit segments, configure SAP Credit Management, migrate credit master data',
          effort: 'medium',
        },
        {
          id: 'GAP-005',
          area: 'Functionality',
          severity: 'high',
          description: 'Warehouse Management (WM) transactions must be migrated to Extended Warehouse Management (EWM) or stock-room managed inventory',
          recommendation: 'Assess warehouse complexity; simple warehouses can use embedded EWM, complex ones need decentralized EWM',
          effort: 'high',
        },
      ],
      overallReadiness: 68,
      humanDecisionsRequired: [
        {
          id: 'HD-001',
          category: 'Business Process',
          question: 'Should custom pricing engine be replicated as-is or redesigned to leverage S/4HANA standard condition technique?',
          impact: 'Determines custom code remediation scope and timeline for SD module',
        },
        {
          id: 'HD-002',
          category: 'Business Process',
          question: 'Which warehouse management approach should be adopted: embedded EWM, decentralized EWM, or simplified stock room management?',
          impact: 'Affects WM-to-EWM migration scope, integration architecture, and go-live sequencing',
        },
      ],
    };

    // Cache in session context
    this.sessionContext.lastGapReport = report;

    return report;
  }

  /**
   * Get cached gap analysis report.
   * @returns {object} Cached report or unavailable message
   */
  async _handle_assessment_get_gap_report() {
    if (this.sessionContext.lastGapReport) {
      return this.sessionContext.lastGapReport;
    }
    return {
      available: false,
      message: 'No gap report. Run assessment_analyze_gaps first.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Confidence & Readiness
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get confidence score for migration readiness.
   * @returns {object} Confidence breakdown with risk factors
   */
  async _handle_assessment_get_confidence() {
    return {
      overallConfidence: 0.72,
      breakdown: {
        dataQuality: 0.85,
        customCodeCoverage: 0.65,
        processAlignment: 0.70,
        integrationReadiness: 0.68,
      },
      riskFactors: [
        {
          area: 'Custom Code',
          score: 0.35,
          description: '142 custom programs identified; 38 use deprecated APIs or direct cluster table access',
        },
        {
          area: 'Data Volume',
          score: 0.20,
          description: 'BSEG contains 85M line items; migration window may require parallel loading strategy',
        },
        {
          area: 'Integration Complexity',
          score: 0.25,
          description: '23 RFC destinations active; 5 target non-SAP systems requiring interface redesign',
        },
        {
          area: 'Organizational Readiness',
          score: 0.15,
          description: 'Key user availability limited during Q3; training plan not finalized for 3 modules',
        },
      ],
      recommendation: 'Overall readiness is moderate. Address custom code remediation (38 critical programs) and finalize data migration strategy for high-volume tables before proceeding to system conversion rehearsal.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Human Checklist
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get human validation checklist from gap analysis.
   * @returns {object} Checklist with pending items
   */
  async _handle_assessment_get_human_checklist() {
    const checklist = [
      {
        id: 'CHK-001',
        area: 'Business Process',
        question: 'Confirm target chart of accounts structure: retain existing or adopt SAP Best Practice CoA?',
        priority: 'critical',
        status: 'pending',
        assignee: null,
      },
      {
        id: 'CHK-002',
        area: 'Business Process',
        question: 'Validate that simplified SD pricing conditions cover all existing custom pricing scenarios',
        priority: 'critical',
        status: 'pending',
        assignee: null,
      },
      {
        id: 'CHK-003',
        area: 'Data Ownership',
        question: 'Identify data owners for customer master, material master, and vendor master cleansing sign-off',
        priority: 'high',
        status: 'pending',
        assignee: null,
      },
      {
        id: 'CHK-004',
        area: 'Data Ownership',
        question: 'Confirm historical data retention policy: how many years of transactional data to migrate?',
        priority: 'high',
        status: 'pending',
        assignee: null,
      },
      {
        id: 'CHK-005',
        area: 'Cutover',
        question: 'Define acceptable downtime window for production cutover and validate with business stakeholders',
        priority: 'high',
        status: 'pending',
        assignee: null,
      },
      {
        id: 'CHK-006',
        area: 'Cutover',
        question: 'Confirm month-end/year-end alignment for go-live date to minimize parallel period closing',
        priority: 'medium',
        status: 'pending',
        assignee: null,
      },
      {
        id: 'CHK-007',
        area: 'Testing',
        question: 'Approve test case coverage for all critical business processes (OTC, PTP, RTR) before UAT',
        priority: 'high',
        status: 'pending',
        assignee: null,
      },
      {
        id: 'CHK-008',
        area: 'Testing',
        question: 'Validate integration test scenarios cover all 23 active RFC interfaces with external systems',
        priority: 'medium',
        status: 'pending',
        assignee: null,
      },
    ];

    return {
      checklist,
      totalItems: checklist.length,
      completedItems: 0,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Process Mining
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Run process mining on extracted data.
   * @param {object} params
   * @param {string} [params.processArea]
   * @param {number} [params.maxVariants=20]
   * @returns {object} Process mining results
   */
  async _handle_assessment_mine_processes(params) {
    const processArea = params.processArea || 'order-to-cash';
    const maxVariants = params.maxVariants || 20;

    return {
      processArea,
      totalVariants: Math.min(maxVariants, 14),
      variants: [
        {
          id: 'VAR-001',
          name: 'Standard Order-to-Invoice',
          frequency: 0.42,
          avgDuration: '3.2 days',
          steps: 7,
          conformance: 0.95,
        },
        {
          id: 'VAR-002',
          name: 'Order with Credit Block',
          frequency: 0.18,
          avgDuration: '5.8 days',
          steps: 11,
          conformance: 0.82,
        },
        {
          id: 'VAR-003',
          name: 'Rush Order (Expedited)',
          frequency: 0.12,
          avgDuration: '1.1 days',
          steps: 5,
          conformance: 0.88,
        },
        {
          id: 'VAR-004',
          name: 'Returns and Credit Memo',
          frequency: 0.15,
          avgDuration: '6.5 days',
          steps: 9,
          conformance: 0.78,
        },
        {
          id: 'VAR-005',
          name: 'Intercompany Order',
          frequency: 0.08,
          avgDuration: '4.7 days',
          steps: 12,
          conformance: 0.71,
        },
      ],
      bottlenecks: [
        {
          step: 'Credit Check',
          avgWait: '1.8 days',
          impact: 'Delays 18% of orders; manual release required for credit blocks over threshold',
        },
        {
          step: 'Delivery Scheduling',
          avgWait: '0.9 days',
          impact: 'Warehouse capacity constraints cause scheduling delays in peak periods',
        },
        {
          step: 'Billing Document Creation',
          avgWait: '0.4 days',
          impact: 'Batch billing job runs once daily; real-time billing could reduce cycle time',
        },
      ],
      automationOpportunities: [
        {
          process: 'Credit Check Auto-Release',
          currentEffort: '2.1 hours/day',
          potentialSaving: '85% reduction with rule-based auto-release for low-risk customers',
        },
        {
          process: 'Invoice Verification',
          currentEffort: '4.5 hours/day',
          potentialSaving: '60% reduction with 3-way match automation and ML-based exception handling',
        },
        {
          process: 'Delivery Note Creation',
          currentEffort: '1.8 hours/day',
          potentialSaving: '70% reduction with automatic delivery creation on goods issue',
        },
      ],
    };
  }

  /**
   * Get the process catalog from mining.
   * @returns {object} Catalog of discovered SAP business processes
   */
  async _handle_assessment_get_process_catalog() {
    return {
      processes: [
        {
          id: 'PROC-OTC',
          name: 'Order to Cash',
          area: 'Sales & Distribution',
          variants: 14,
          transactions: ['VA01', 'VA02', 'VL01N', 'VL02N', 'VF01', 'VF02', 'FBL5N'],
          complexity: 'high',
        },
        {
          id: 'PROC-PTP',
          name: 'Procure to Pay',
          area: 'Materials Management',
          variants: 11,
          transactions: ['ME21N', 'ME22N', 'MIGO', 'MIRO', 'FBL1N', 'F110'],
          complexity: 'high',
        },
        {
          id: 'PROC-RTR',
          name: 'Record to Report',
          area: 'Financial Accounting',
          variants: 8,
          transactions: ['FB01', 'FB50', 'F.01', 'S_ALR_87012284', 'FAGLB03', 'FK10N'],
          complexity: 'medium',
        },
        {
          id: 'PROC-P2P',
          name: 'Plan to Produce',
          area: 'Production Planning',
          variants: 9,
          transactions: ['MD04', 'CO01', 'CO02', 'CO11N', 'CO15', 'MFBF'],
          complexity: 'high',
        },
        {
          id: 'PROC-HR',
          name: 'Hire to Retire',
          area: 'Human Capital Management',
          variants: 7,
          transactions: ['PA20', 'PA30', 'PA40', 'PT61', 'PC00_M99_CIPE'],
          complexity: 'medium',
        },
        {
          id: 'PROC-ATR',
          name: 'Acquire to Retire',
          area: 'Asset Management',
          variants: 5,
          transactions: ['AS01', 'AS02', 'ABAVN', 'AW01N', 'S_ALR_87011990'],
          complexity: 'low',
        },
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Migration Planning
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate a migration plan based on forensic and gap data.
   * @param {object} params
   * @param {string} [params.strategy='phased']
   * @param {string} [params.timeline='standard']
   * @returns {object} Complete migration plan
   */
  async _handle_assessment_plan_migration(params) {
    const strategy = params.strategy || 'phased';
    const timeline = params.timeline || 'standard';

    const durationMultiplier = timeline === 'aggressive' ? 0.7 : timeline === 'conservative' ? 1.4 : 1.0;
    const baseDuration = strategy === 'big-bang' ? 32 : strategy === 'hybrid' ? 38 : 44;
    const totalDurationWeeks = Math.round(baseDuration * durationMultiplier);

    const plan = {
      planId: `MIG-PLAN-${Date.now()}`,
      strategy,
      timeline,
      phases: [
        {
          phase: 1,
          name: 'Discover & Prepare',
          duration: `${Math.round(8 * durationMultiplier)} weeks`,
          activities: [
            'Complete system forensic extraction and analysis',
            'Finalize gap remediation roadmap',
            'Establish sandbox and development environments',
            'Configure SAP migration cockpit and tools',
            'Define data migration objects and mapping rules',
          ],
          dependencies: [],
          milestones: ['Forensic analysis complete', 'Gap remediation plan signed off', 'Sandbox provisioned'],
        },
        {
          phase: 2,
          name: 'Build & Configure',
          duration: `${Math.round(14 * durationMultiplier)} weeks`,
          activities: [
            'Configure S/4HANA target system per fit-gap decisions',
            'Remediate custom ABAP code (142 programs)',
            'Build data migration programs and transformation rules',
            'Redesign integration interfaces for S/4HANA APIs',
            'Develop extensions and custom Fiori apps',
          ],
          dependencies: ['Phase 1: Gap remediation plan signed off'],
          milestones: ['Configuration complete', 'Custom code remediation 100%', 'First data load test'],
        },
        {
          phase: 3,
          name: 'Test & Validate',
          duration: `${Math.round(12 * durationMultiplier)} weeks`,
          activities: [
            'Execute unit and integration testing',
            'Perform data migration dry runs with full volume',
            'Conduct user acceptance testing (UAT) with key users',
            'Run performance and stress testing',
            'Execute cutover rehearsal with timing measurements',
          ],
          dependencies: ['Phase 2: Configuration complete', 'Phase 2: Custom code remediation 100%'],
          milestones: ['UAT sign-off', 'Performance benchmarks met', 'Cutover rehearsal passed'],
        },
        {
          phase: 4,
          name: 'Deploy & Hypercare',
          duration: `${Math.round(6 * durationMultiplier)} weeks`,
          activities: [
            'Execute production cutover per rehearsed plan',
            'Migrate production data within defined downtime window',
            'Validate production system with critical business processes',
            'Provide hypercare support with dedicated team',
            'Transition to steady-state operations and support model',
          ],
          dependencies: ['Phase 3: UAT sign-off', 'Phase 3: Cutover rehearsal passed'],
          milestones: ['Go-live', 'Hypercare exit criteria met', 'Project closure'],
        },
        {
          phase: 5,
          name: 'Optimize & Close',
          duration: `${Math.round(4 * durationMultiplier)} weeks`,
          activities: [
            'Resolve post-go-live issues and optimization backlog',
            'Implement deferred scope items',
            'Conduct lessons-learned workshops',
            'Archive project documentation and decommission legacy system',
          ],
          dependencies: ['Phase 4: Hypercare exit criteria met'],
          milestones: ['Legacy system decommissioned', 'Project formally closed'],
        },
      ],
      totalDurationWeeks,
      resourceRequirements: {
        functional: 8,
        technical: 12,
        projectMgmt: 3,
      },
      risks: [
        {
          id: 'RISK-001',
          description: 'Custom code remediation may uncover additional dependencies not detected in static analysis',
          probability: 'high',
          impact: 'medium',
          mitigation: 'Include 20% buffer in remediation estimates; prioritize critical path programs first',
        },
        {
          id: 'RISK-002',
          description: 'Data migration volume for BSEG/ACDOCA may exceed cutover window',
          probability: 'medium',
          impact: 'high',
          mitigation: 'Implement parallel loading strategy; rehearse with full production volume at least twice',
        },
        {
          id: 'RISK-003',
          description: 'Key user availability conflicts with business-critical periods (month-end, quarter-end)',
          probability: 'medium',
          impact: 'medium',
          mitigation: 'Align UAT and cutover with low-activity periods; secure management commitment for dedicated time',
        },
        {
          id: 'RISK-004',
          description: 'Third-party interface partners may delay API migration to S/4HANA-compatible formats',
          probability: 'medium',
          impact: 'high',
          mitigation: 'Engage integration partners early; define fallback wrapper strategy for delayed partners',
        },
      ],
      humanDecisionsRequired: [
        {
          id: 'DECIDE-001',
          category: 'Strategy',
          question: 'Should brownfield (system conversion) or greenfield (new implementation) approach be used for each module?',
          options: ['Brownfield for all', 'Greenfield for all', 'Selective per module based on gap analysis'],
          impact: 'Determines data migration scope, testing effort, and overall timeline',
          blocking: true,
        },
        {
          id: 'DECIDE-002',
          category: 'Data',
          question: 'What is the cutoff date for historical transactional data migration?',
          options: ['Current fiscal year only', 'Last 3 fiscal years', 'Last 5 fiscal years', 'All available history'],
          impact: 'Directly affects migration volume, cutover duration, and storage requirements',
          blocking: true,
        },
        {
          id: 'DECIDE-003',
          category: 'Cutover',
          question: 'What is the maximum acceptable production downtime during cutover?',
          options: ['24 hours', '48 hours', '72 hours (weekend)', 'Extended weekend (Friday-Monday)'],
          impact: 'Constrains migration execution approach and parallel loading strategy',
          blocking: true,
        },
        {
          id: 'DECIDE-004',
          category: 'Organization',
          question: 'Will the project team be dedicated full-time or shared with operational duties?',
          options: ['Fully dedicated core team', 'Shared with backfill plan', 'Mixed — leads dedicated, SMEs shared'],
          impact: 'Affects project velocity, timeline achievability, and quality of deliverables',
          blocking: false,
        },
      ],
    };

    // Cache in session context
    this.sessionContext.lastMigrationPlan = plan;

    return plan;
  }
}

module.exports = { AssessmentToolHandlers };
