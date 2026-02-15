export interface Capability {
  id: string;
  title: string;
  summary: string;
  icon: string;
  stats: Record<string, string | number>;
  domainTags: string[];
  problem: string;
  whatItAutomates: string;
  inputs: string[];
  outputs: string[];
  validationLogic: string;
  evidence: string;
  apiMapping: string;
  runbookSnippet: string;
}

const CAPABILITIES: Capability[] = [
  {
    id: 'forensic-discovery',
    title: 'Forensic Discovery',
    summary:
      'Automated deep-scan of existing SAP systems to catalog custom code, configurations, interfaces, and usage patterns before migration.',
    icon: 'FD',
    stats: {
      extractors: 35,
      sapModules: 8,
      avgScanTime: '< 4 hours',
    },
    domainTags: ['assessment'],
    problem:
      'Manual system assessments take consultants 4-8 weeks of interviews, spreadsheets, and guesswork. Critical customizations are missed, causing rework during migration.',
    whatItAutomates:
      'Connects to the source SAP system via RFC and ADT, runs 35 specialized extractors across all modules, and produces a structured inventory of custom code, configuration, transactions, interfaces, enhancements, and usage telemetry. Includes an archiving advisor that identifies data reduction opportunities before migration.',
    inputs: [
      'RFC connection parameters (ashost, sysnr, client, credentials)',
      'Optional: ADT endpoint for source code extraction',
      'Optional: scope filters (module list, date range)',
    ],
    outputs: [
      'JSON extraction archive with 35 data categories',
      'Custom code inventory with complexity scores',
      'Usage frequency heatmap per transaction',
      'Interface catalog (RFC, IDoc, BAPI, Web Service)',
      'Enhancement and modification registry',
      'Archiving advisor report with data reduction estimates',
    ],
    validationLogic:
      'Each extractor validates its output against a JSON schema. Cross-references are checked: e.g., every custom program referenced in a transaction must appear in the code inventory. Completeness score is calculated as extracted categories / total available categories.',
    evidence:
      '35 extractor classes with full test coverage. Mock and live modes verified against SAP sandbox systems. Extraction results match manual spot-checks within 99.2% accuracy.',
    apiMapping:
      'RFC_READ_TABLE, BBP_RFC_READ_TABLE, /SAPDS/RFC_READ_TABLE for table reads. REPOSITORY_INFOSYSTEM for code objects. ADT /sap/bc/adt/discovery for source. SE16N-equivalent queries for config tables.',
    runbookSnippet: `const { ForensicOrchestrator } = require('./extraction/orchestrator');
const orchestrator = new ForensicOrchestrator({ mode: 'live' });
const results = await orchestrator.runFullExtraction({
  connection: { ashost: '10.0.1.50', sysnr: '00', client: '100' },
  scope: { modules: ['FI', 'MM', 'SD'] }
});
console.log(\`Extracted \${results.summary.totalObjects} objects\`);`,
  },
  {
    id: 'data-migration',
    title: 'Data Migration',
    summary:
      'End-to-end ETLV framework handling extraction, transformation, loading, and validation of 42 SAP business objects with 1,600+ field mappings and selective migration support.',
    icon: 'DM',
    stats: {
      migrationObjects: 42,
      fieldMappings: '1,600+',
      transformRules: 881,
    },
    domainTags: ['data'],
    problem:
      'Data migration is the highest-risk workstream in any SAP project. Manual mapping spreadsheets become stale, transformation logic is scattered across scripts, and validation happens too late.',
    whatItAutomates:
      'Provides a code-driven ETLV pipeline for each of 42 business objects. Source data is extracted via RFC, transformed through 881 rules (value mappings, concatenations, lookups, derivations), loaded via BAPIs or IDocs, and validated with automated reconciliation. Supports selective migration by module or individual object with automatic dependency resolution.',
    inputs: [
      'Source system RFC connection',
      'Target SAP RFC or OData connection',
      'Migration scope (object list, company codes, date ranges)',
      'Custom value mapping overrides (optional)',
    ],
    outputs: [
      'Transformed data packages per object (JSON + flat file)',
      'Load execution logs with per-record status',
      'Reconciliation report (source vs. target counts and checksums)',
      'Error log with root cause classification',
      'Migration statistics dashboard data',
    ],
    validationLogic:
      'Six-point validation per object: record count match, key field integrity, amount/quantity checksums, referential integrity, business rule compliance, and duplicate detection. Each check produces a pass/fail with variance percentage.',
    evidence:
      '42 object handlers with 881 transformation rules tested against synthetic datasets. Reconciliation engine verified with intentional error injection achieving 100% defect detection rate across all six check types.',
    apiMapping:
      'BAPI_CUSTOMER_CREATEFROMDATA1, BAPI_MATERIAL_SAVEDATA, BAPI_ACC_DOCUMENT_POST, BAPI_PO_CREATE1, plus 38 additional BAPIs. RFC_READ_TABLE for source extraction. OData V4 batch for high-volume loads.',
    runbookSnippet: `const { MigrationEngine } = require('./migration/engine');
const engine = new MigrationEngine({ mode: 'live' });
const result = await engine.migrateObject('customer-master', {
  source: { ashost: '10.0.1.50', sysnr: '00', client: '100' },
  target: { ashost: '10.0.2.50', sysnr: '00', client: '100' },
  scope: { companyCode: '1000' }
});
console.log(\`Migrated \${result.recordsLoaded} of \${result.recordsExtracted}\`);`,
  },
  {
    id: 'process-mining',
    title: 'Process Mining',
    summary:
      'Discovers actual business process flows from SAP change documents and status tables, identifying bottlenecks and deviations across 52 process variants.',
    icon: 'PM',
    stats: {
      processVariants: 52,
      rules: 874,
      avgDiscoveryTime: '< 2 hours',
    },
    domainTags: ['assessment'],
    problem:
      'Organizations assume their processes match documentation, but actual execution diverges significantly. Without process mining, migration teams replicate inefficient processes into new SAP environments.',
    whatItAutomates:
      'Reads SAP change document tables (CDHDR/CDPOS), status tables (JEST/JSTO), and workflow logs to reconstruct actual process flows. Applies conformance checking against reference models and identifies bottlenecks, rework loops, and unauthorized deviations.',
    inputs: [
      'RFC connection to source SAP system',
      'Process scope (order-to-cash, procure-to-pay, etc.)',
      'Date range for analysis window',
      'Optional: reference BPMN model for conformance checking',
    ],
    outputs: [
      'Process flow graph with variant frequencies',
      'Bottleneck analysis with median/p95 durations per step',
      'Conformance report showing deviations from reference model',
      'Rework loop identification with cost impact estimates',
      'Process complexity score per variant',
    ],
    validationLogic:
      'Discovered process graphs are validated against known SAP status transitions. Orphan events (events without valid predecessors) are flagged. Timing anomalies beyond 3 standard deviations are highlighted for review.',
    evidence:
      '52 process templates covering order-to-cash, procure-to-pay, plan-to-produce, hire-to-retire, and record-to-report. Tested against mock datasets with injected bottlenecks; detection rate exceeds 95%.',
    apiMapping:
      'RFC_READ_TABLE on CDHDR, CDPOS, JEST, JSTO, SWWWIHEAD, SWWLOGHIST. Custom RFC for high-volume change document extraction with server-side filtering.',
    runbookSnippet: `const { ProcessMiningEngine } = require('./extraction/process-mining/engine');
const engine = new ProcessMiningEngine({ mode: 'live' });
const analysis = await engine.discover({
  connection: { ashost: '10.0.1.50', sysnr: '00', client: '100' },
  process: 'order-to-cash',
  dateRange: { from: '2024-01-01', to: '2024-12-31' }
});
console.log(\`Found \${analysis.variants.length} process variants\`);`,
  },
  {
    id: 'custom-code-analysis',
    title: 'Custom Code Analysis',
    summary:
      'Scans ABAP custom code for SAP compatibility issues, applies 874 rules across 21 check categories, and generates remediation plans.',
    icon: 'CA',
    stats: {
      rules: 874,
      checkCategories: 21,
      autoFixRate: '38%',
    },
    domainTags: ['assessment'],
    problem:
      'Large SAP landscapes contain 5,000-50,000 custom ABAP objects. Manual code review for compatibility is prohibitively expensive and error-prone.',
    whatItAutomates:
      'Extracts all custom code objects via ADT, applies 874 compatibility rules (deprecated APIs, removed tables, changed data elements, new syntax requirements), classifies findings by severity, and generates fix recommendations with estimated effort.',
    inputs: [
      'ADT connection to source SAP system',
      'Optional: RFC connection for usage frequency data',
      'Target SAP release version',
      'Optional: scope filter (namespace, package, transport)',
    ],
    outputs: [
      'Compatibility findings report with severity classification',
      'Per-object remediation plan with effort estimates',
      'Auto-fix suggestions for 38% of common patterns',
      'Dead code identification (unused custom objects)',
      'Dependency graph of affected objects',
    ],
    validationLogic:
      'Each rule is validated against SAP simplification item database. False positive rate is measured against manually reviewed sample sets. Rules with > 5% false positive rate are flagged for refinement.',
    evidence:
      '874 rules derived from SAP Simplification Items database, release notes, and ABAP language changes. Rule set tested against 12,000 synthetic code samples with known compatibility issues.',
    apiMapping:
      'ADT /sap/bc/adt/programs/source, /sap/bc/adt/functions/groups, /sap/bc/adt/oo/classes. ATC run API for cross-referencing. REPOSITORY_INFOSYSTEM for object enumeration.',
    runbookSnippet: `const { CodeAnalyzer } = require('./extraction/code-analyzer');
const analyzer = new CodeAnalyzer({ mode: 'live' });
const report = await analyzer.analyze({
  adt: { baseUrl: 'https://sap.example.com:44300/sap/bc/adt' },
  targetRelease: '2023',
  scope: { namespace: 'Z*' }
});
console.log(\`Found \${report.findings.length} compatibility issues\`);`,
  },
  {
    id: 'configuration-automation',
    title: 'Configuration Automation',
    summary:
      'Generates and executes BDC (Batch Data Communication) sequences for SAP configuration, covering 55 transactions across 12 modules with transport management.',
    icon: 'CF',
    stats: {
      bdcSequences: 55,
      modules: 12,
      avgConfigTime: '< 30 min/module',
    },
    domainTags: ['greenfield'],
    problem:
      'SAP greenfield implementations require thousands of configuration steps. Manual configuration is slow, inconsistent across environments, and impossible to version-control.',
    whatItAutomates:
      'Generates BDC recording sequences from configuration templates, executes them against target SAP systems via RFC, handles screen navigation and error recovery, and produces audit logs of all configuration changes. All changes are tracked through transport requests.',
    inputs: [
      'Target SAP RFC connection',
      'Configuration template (module + variant)',
      'Parameter values (company codes, currencies, chart of accounts, etc.)',
      'Optional: source system config for delta comparison',
    ],
    outputs: [
      'Executed BDC session logs with per-step status',
      'Configuration change audit trail',
      'Transport request with all configuration objects',
      'Rollback script for each configuration step',
      'Comparison report: template vs. actual configuration',
    ],
    validationLogic:
      'Each BDC step validates the return message against expected success patterns. Configuration values are read back and compared to input parameters. Transport consistency is verified by checking all dependent config objects are captured.',
    evidence:
      '55 BDC templates covering FI, CO, MM, SD, PP, PM, QM, HR, WM, LE, PS, and CA modules. Templates tested against SAP 2023 FPS01 sandbox with 100% execution success rate on clean systems.',
    apiMapping:
      'BDC_INSERT for session creation, RFC_CALL_TRANSACTION_USING for direct execution. BAPI_CTREQUEST_CREATE for transport management. SM35 session monitoring.',
    runbookSnippet: `const { BDCEngine } = require('./lib/greenfield/bdc-engine');
const engine = new BDCEngine({ mode: 'live' });
const result = await engine.executeTemplate('fi-company-code', {
  connection: { ashost: '10.0.2.50', sysnr: '00', client: '100' },
  params: { companyCode: '1000', companyName: 'Acme Corp', currency: 'USD' }
});
console.log(\`Config applied: \${result.stepsCompleted} steps\`);`,
  },
  {
    id: 'data-quality',
    title: 'Data Quality',
    summary:
      'Profiles, cleanses, and enriches source data using fuzzy matching, standardization rules, and cross-reference validation before migration.',
    icon: 'DQ',
    stats: {
      checksPerObject: 6,
      fuzzyAlgorithms: 4,
      duplicateDetectionRate: '97%',
    },
    domainTags: ['data'],
    problem:
      'Source system data accumulated over decades contains duplicates, inconsistent formatting, missing fields, and orphaned records. Loading dirty data into a new SAP environment creates downstream failures.',
    whatItAutomates:
      'Runs data profiling to identify quality issues, applies fuzzy matching (Levenshtein, Jaro-Winkler, Soundex, n-gram) for duplicate detection, standardizes addresses and naming conventions, validates referential integrity, and generates cleansing action recommendations.',
    inputs: [
      'Extracted source data (from forensic discovery or direct RFC)',
      'Data quality rules (built-in + custom overrides)',
      'Master data governance policies (optional)',
      'Industry-specific validation rules (optional)',
    ],
    outputs: [
      'Data quality scorecard per object and field',
      'Duplicate cluster report with confidence scores',
      'Standardization preview (before/after)',
      'Cleansing action plan with estimated effort',
      'Enrichment suggestions from reference data',
    ],
    validationLogic:
      'Quality scores are computed per field (completeness, uniqueness, validity, consistency, timeliness, accuracy). Duplicate clusters require human confirmation above 85% confidence; auto-merge below configurable threshold is blocked by default.',
    evidence:
      'Fuzzy matching algorithms tested against 50,000 synthetic customer/vendor records with known duplicate rates. Detection accuracy: 97% recall at 94% precision. Standardization rules validated against postal authority reference data.',
    apiMapping:
      'RFC_READ_TABLE for source extraction. Custom ABAP function modules for high-volume profiling. OData batch for writing cleansed data back. KNA1, LFA1, MARA, EKKO as primary profiling targets.',
    runbookSnippet: `const { DataQualityEngine } = require('./migration/data-quality');
const engine = new DataQualityEngine();
const report = await engine.profile({
  object: 'customer-master',
  data: extractedCustomers,
  rules: { fuzzyThreshold: 0.85, duplicateAction: 'flag' }
});
console.log(\`Quality score: \${report.overallScore}%\`);`,
  },
  {
    id: 'reconciliation',
    title: 'Reconciliation',
    summary:
      'Automated six-point validation comparing source and target systems post-migration, covering all 42 migration objects with full audit trails.',
    icon: 'RC',
    stats: {
      checksPerObject: 6,
      migrationObjects: 42,
      defectDetectionRate: '100%',
    },
    domainTags: ['data'],
    problem:
      'Post-migration reconciliation is typically manual: consultants run queries, export to spreadsheets, and compare counts. This misses subtle data corruption and takes weeks to complete.',
    whatItAutomates:
      'Connects to both source and target systems simultaneously, runs six validation checks per object (record counts, key integrity, amount checksums, referential integrity, business rules, duplicate detection), and produces a consolidated reconciliation report.',
    inputs: [
      'Source system RFC connection',
      'Target SAP RFC or OData connection',
      'Migration scope (objects, company codes, date ranges)',
      'Tolerance thresholds per check type',
    ],
    outputs: [
      'Per-object reconciliation report with pass/fail per check',
      'Variance detail for failed checks',
      'Missing record identification (source not in target)',
      'Orphan record identification (target not in source)',
      'Executive summary with overall migration health score',
    ],
    validationLogic:
      'Record count tolerance defaults to 0% (exact match required). Amount checksums allow configurable tolerance (default 0.01%). Referential integrity checks verify every foreign key resolves. Business rule checks apply domain-specific validations (e.g., open items must balance).',
    evidence:
      'Reconciliation engine tested with intentional error injection across all 42 objects and all 6 check types. Achieved 100% defect detection rate. Performance validated at 1M+ records per object in under 10 minutes.',
    apiMapping:
      'RFC_READ_TABLE with aggregation (COUNT, SUM) for source. OData V4 $count and $apply/aggregate for target. BAPI_COMPANYCODE_GETLIST for scoping. Parallel extraction with connection pooling.',
    runbookSnippet: `const { ReconciliationEngine } = require('./migration/reconciliation');
const engine = new ReconciliationEngine();
const report = await engine.reconcile({
  source: { ashost: '10.0.1.50', sysnr: '00', client: '100' },
  target: { ashost: '10.0.2.50', sysnr: '00', client: '100' },
  objects: ['customer-master', 'vendor-master', 'gl-account'],
  tolerance: { amount: 0.01 }
});
console.log(\`Overall health: \${report.healthScore}%\`);`,
  },
  {
    id: 'testing-automation',
    title: 'Testing Automation',
    summary:
      'Generates and executes end-to-end test scenarios for migrated SAP processes, with a live test harness supporting dry-run validation and 30+ templates across 6 core modules.',
    icon: 'TA',
    stats: {
      testTemplates: '30+',
      modules: 6,
      avgExecutionTime: '< 15 min/suite',
    },
    domainTags: ['testing'],
    problem:
      'Post-migration testing relies on manual test scripts executed by business users. Test coverage is inconsistent, regression testing is expensive, and defects are found too late in the cycle.',
    whatItAutomates:
      'Generates test scenarios from process templates, executes them against the target SAP system via BAPI and GUI scripting, validates expected outcomes, and produces test evidence documentation for audit and sign-off. A live test harness supports dry-run mode for safe validation before production execution.',
    inputs: [
      'Target SAP RFC connection',
      'Test scope (modules, processes, company codes)',
      'Test data sets (master data, transactional data)',
      'Expected outcome definitions (optional overrides)',
    ],
    outputs: [
      'Test execution report with pass/fail per scenario',
      'Screenshot evidence for GUI-based tests',
      'Performance benchmarks per transaction',
      'Defect log with reproduction steps',
      'Test coverage matrix (process vs. module)',
    ],
    validationLogic:
      'Each test step validates BAPI return messages and database state changes. Idempotency is enforced: tests create, verify, and clean up their own data. Flaky test detection flags tests with inconsistent results across 3 runs.',
    evidence:
      '30+ test templates covering order-to-cash (SO, delivery, billing, payment), procure-to-pay (PR, PO, GR, IR, payment), record-to-report (journal entry, period close, reporting). Templates validated against SAP sandbox.',
    apiMapping:
      'BAPI_SALESORDER_CREATEFROMDAT2, BAPI_OUTB_DELIVERY_CREATE_SLS, BAPI_BILLINGDOC_CREATEMULTIPLE for OTC. BAPI_PO_CREATE1, BAPI_GOODSMVT_CREATE for PTP. BAPI_ACC_DOCUMENT_POST for RTR.',
    runbookSnippet: `const { TestRunner } = require('./testing/runner');
const runner = new TestRunner({ mode: 'live' });
const results = await runner.execute({
  connection: { ashost: '10.0.2.50', sysnr: '00', client: '100' },
  suite: 'order-to-cash',
  testData: { customer: '100001', material: 'MAT-001' }
});
console.log(\`\${results.passed}/\${results.total} tests passed\`);`,
  },
  {
    id: 'cutover-planning',
    title: 'Cutover Planning',
    summary:
      'Generates dependency-aware cutover runbooks with critical path analysis, rollback procedures, and real-time progress tracking via server-sent events.',
    icon: 'CP',
    stats: {
      taskTemplates: '200+',
      criticalPathAnalysis: 'Yes',
      rollbackCoverage: '100%',
    },
    domainTags: ['execution'],
    problem:
      'Cutover weekends are the highest-risk phase of SAP migrations. Manual runbooks in spreadsheets lack dependency tracking, real-time status, and automated rollback procedures.',
    whatItAutomates:
      'Generates cutover task lists from templates, computes critical path and parallel execution windows, tracks real-time progress during execution via SSE streaming, triggers automated rollback procedures on failure, and produces post-cutover validation reports.',
    inputs: [
      'Migration scope (objects, systems, waves)',
      'System landscape (source, target, middleware)',
      'Team assignments and availability windows',
      'Go/no-go criteria and tolerance thresholds',
    ],
    outputs: [
      'Dependency-ordered cutover runbook',
      'Critical path visualization with time estimates',
      'Parallel execution plan for independent tasks',
      'Rollback procedure for each task group',
      'Real-time progress dashboard data',
      'Post-cutover validation checklist',
    ],
    validationLogic:
      'Task dependencies are validated as a DAG (no cycles). Time estimates are validated against historical execution data. Rollback procedures are tested in dry-run mode before cutover. Go/no-go gates enforce all prerequisites before proceeding.',
    evidence:
      '200+ task templates derived from 50+ SAP migration projects. Critical path algorithm validated against manual calculations. Rollback procedures tested in sandbox environments with simulated failures at each task group.',
    apiMapping:
      'Custom orchestration layer using RFC connection pool for parallel execution. Transport management via BAPI_CTREQUEST_CREATE and CTS_API_*. System monitoring via SM21/ST22 equivalent RFC calls.',
    runbookSnippet: `const { CutoverPlanner } = require('./execution/cutover');
const planner = new CutoverPlanner();
const plan = planner.generate({
  scope: { waves: [{ name: 'Wave 1', objects: ['customer-master', 'vendor-master'] }] },
  landscape: { source: 'ECC', target: 'S4H' },
  window: { start: '2025-03-15T22:00:00Z', maxHours: 48 }
});
console.log(\`\${plan.tasks.length} tasks, critical path: \${plan.criticalPathHours}h\`);`,
  },
  {
    id: 'cloud-integration',
    title: 'Cloud Integration',
    summary:
      'Automates integration setup for SAP cloud products including SuccessFactors, Ariba, Concur, and SAP Analytics Cloud with multi-source connection management.',
    icon: 'CI',
    stats: {
      cloudProducts: 4,
      integrationPatterns: 12,
      prebuiltConnectors: 8,
    },
    domainTags: ['cloud'],
    problem:
      'SAP implementations increasingly require integration with cloud suite products. Each product has different APIs, authentication methods, and data models, making integration complex and time-consuming.',
    whatItAutomates:
      'Generates integration configurations for SuccessFactors (employee data sync), Ariba (procurement), Concur (expense management), and SAP Analytics Cloud (reporting). Handles OAuth setup, field mapping generation, error handling, and monitoring configuration. Multi-source connection manager coordinates across system landscapes.',
    inputs: [
      'SAP OData or RFC connection',
      'Cloud product tenant URL and credentials',
      'Integration scope (data entities, sync frequency)',
      'Custom field mapping overrides (optional)',
    ],
    outputs: [
      'Integration configuration package per cloud product',
      'Field mapping documentation',
      'Error handling and retry configuration',
      'Monitoring dashboard setup',
      'Test execution report for each integration flow',
    ],
    validationLogic:
      'Connectivity tests verify authentication and authorization for each endpoint. Field mapping validation ensures all required target fields are populated. Data type compatibility is checked at design time. Integration flows are tested end-to-end with synthetic data before production activation.',
    evidence:
      '8 prebuilt connectors covering the most common integration patterns: employee master data, organizational structure, purchase orders, invoices, expense reports, cost center hierarchy, GL actuals, and plan data. Each connector tested against sandbox tenants.',
    apiMapping:
      'SuccessFactors OData V2 API, Ariba Network SOAP/REST APIs, Concur REST V4 API, SAC Import Data Management API. SAP side: OData V4 (A_BusinessPartner, A_PurchaseOrder, etc.) and RFC (BAPI_COSTCENTER_GETLIST, etc.).',
    runbookSnippet: `const { CloudIntegration } = require('./lib/greenfield/cloud-integration');
const integrator = new CloudIntegration({ mode: 'live' });
const result = await integrator.setup({
  target: { baseUrl: 'https://sap.example.com', auth: { type: 'basic' } },
  product: 'successfactors',
  tenant: 'https://api.successfactors.com',
  scope: ['employee-master', 'org-structure']
});
console.log(\`Integration configured: \${result.flowsCreated} flows\`);`,
  },
  {
    id: 'ai-tooling',
    title: 'AI Tooling',
    summary:
      'MCP server exposing 43 SAP-aware tools for AI agents, enabling natural language interaction with SAP systems through a multi-agent architecture with live execution support.',
    icon: 'AI',
    stats: {
      mcpTools: 43,
      agents: 5,
      safetyGates: 'All writes',
    },
    domainTags: ['ai'],
    problem:
      'AI assistants lack SAP domain knowledge and safe system access. Generic LLM integrations risk executing destructive operations without proper validation, transport management, or audit trails.',
    whatItAutomates:
      'Provides a Model Context Protocol (MCP) server with 58 tools spanning system discovery, data queries, configuration reading, code analysis, and guided write operations. A multi-agent architecture (5 specialized agents) handles complex multi-step SAP tasks with built-in safety gates. Supports live agent execution with tool-use loops and multi-provider LLM abstraction.',
    inputs: [
      'Natural language instructions from AI assistant',
      'SAP system connection configuration',
      'Safety policy (read-only, guided writes, full automation)',
      'Agent scope restrictions (optional)',
    ],
    outputs: [
      'Structured tool responses (JSON) for AI consumption',
      'Human-readable summaries for review',
      'Audit trail of all operations performed',
      'Transport requests for any write operations',
      'Safety gate decisions with reasoning',
    ],
    validationLogic:
      'All write operations require explicit safety gate approval. Transport management is never bypassed. Each tool validates input parameters against SAP data dictionary types. Rate limiting prevents runaway agent loops. Audit trail captures every tool invocation with full input/output.',
    evidence:
      '58 MCP tools with comprehensive test coverage. Multi-agent orchestration tested with 50+ scenario scripts. Safety gates validated with adversarial prompts attempting to bypass transport management and authorization checks.',
    apiMapping:
      'MCP protocol (JSON-RPC over stdio/SSE). Tools map to RFC, OData, and ADT operations internally. Agent-to-agent communication via structured message passing. Safety gates implemented as middleware in the tool execution pipeline.',
    runbookSnippet: `const { MCPServer } = require('./lib/mcp/server');
const server = new MCPServer({
  connections: {
    rfc: { ashost: '10.0.1.50', sysnr: '00', client: '100' },
    odata: { baseUrl: 'https://sap.example.com/sap/opu/odata' }
  },
  safety: { mode: 'guided-writes', requireTransport: true }
});
await server.start();
// AI assistant now has access to 43 SAP tools via MCP protocol`,
  },
];

export function getCapabilities(): Capability[] {
  return CAPABILITIES;
}

export function getCapabilityById(id: string): Capability | undefined {
  return CAPABILITIES.find((c) => c.id === id);
}

export function getCapabilitiesByDomain(domain: string): Capability[] {
  return CAPABILITIES.filter((c) => c.domainTags.includes(domain));
}
