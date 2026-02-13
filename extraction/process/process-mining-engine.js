/**
 * Process Mining Engine
 *
 * Reconstructs actual business processes from evidence:
 * change documents, usage statistics, batch jobs, and workflows.
 */

const EventLogBuilder = require('./event-log-builder');
const UsagePatternAnalyzer = require('./usage-pattern-analyzer');
const ProcessCatalog = require('./process-catalog');

class ProcessMiningEngine {
  /**
   * @param {object} extractionResults - Map of extractorId → result from all extractors
   */
  constructor(extractionResults) {
    this.results = extractionResults;
    this._catalog = new ProcessCatalog();
  }

  async reconstructProcesses() {
    await this._mineFromChangeDocuments();
    await this._mineFromUsageStatistics();
    await this._mineFromBatchJobs();
    await this._mineFromWorkflows();
    await this._correlateProcesses();
    return this._catalog;
  }

  async _mineFromChangeDocuments() {
    const changeDocs = this.results.get?.('CHANGE_DOCUMENTS') || this.results.CHANGE_DOCUMENTS;
    if (!changeDocs || !changeDocs.headers) return;

    const builder = new EventLogBuilder(changeDocs);

    const processSpecs = [
      { method: 'buildO2CEventLog', id: 'O2C', name: 'Order to Cash', category: 'core' },
      { method: 'buildP2PEventLog', id: 'P2P', name: 'Procure to Pay', category: 'core' },
      { method: 'buildR2REventLog', id: 'R2R', name: 'Record to Report', category: 'core' },
      { method: 'buildA2REventLog', id: 'A2R', name: 'Acquire to Retire', category: 'support' },
      { method: 'buildP2MEventLog', id: 'P2M', name: 'Plan to Manufacture', category: 'core' },
      { method: 'buildM2SEventLog', id: 'M2S', name: 'Maintain to Settle', category: 'support' },
      { method: 'buildH2REventLog', id: 'H2R', name: 'Hire to Retire', category: 'support' },
    ];

    for (const spec of processSpecs) {
      const eventLog = builder[spec.method]();
      if (eventLog.totalEvents === 0) continue;

      // Derive variants from case patterns
      const variants = this._deriveVariants(eventLog);

      this._catalog.addProcess({
        processId: spec.id,
        name: spec.name,
        category: spec.category,
        variants,
        interfaces: [],
        customCode: [],
        configuration: [],
        evidence: {
          changeDocuments: eventLog.totalEvents,
          usageStatistics: 0,
          batchJobs: [],
          workflows: [],
        },
        gaps: [],
      });
    }
  }

  async _mineFromUsageStatistics() {
    const usage = this.results.get?.('USAGE_STATISTICS') || this.results.USAGE_STATISTICS;
    if (!usage) return;

    const analyzer = new UsagePatternAnalyzer(usage);
    const deptPatterns = analyzer.getDepartmentPatterns();

    // Enrich existing processes with usage data
    for (const proc of this._catalog.processes) {
      proc.evidence.usageStatistics = usage.transactionUsage?.length || 0;
    }

    // Add discovered custom processes from high-volume Z* transactions
    const customTcodes = (usage.transactionUsage || [])
      .filter(t => t.tcode.startsWith('Z') || t.tcode.startsWith('Y'))
      .filter(t => t.executions > 100);

    if (customTcodes.length > 0) {
      this._catalog.addProcess({
        processId: 'CUSTOM_TRANSACTIONS',
        name: 'Custom Transaction Processes',
        category: 'custom',
        variants: customTcodes.map(tc => ({
          variantId: `CUSTOM_${tc.tcode}`,
          description: `Custom process via ${tc.tcode}`,
          steps: [{ tcode: tc.tcode, activity: tc.tcode, avgDuration: tc.avgTime, automation: 'manual' }],
          volume: tc.executions,
          users: [],
        })),
        evidence: { changeDocuments: 0, usageStatistics: customTcodes.length, batchJobs: [], workflows: [] },
        gaps: ['Custom transaction logic not analyzed — source code review needed'],
      });
    }
  }

  async _mineFromBatchJobs() {
    const jobs = this.results.get?.('BATCH_JOBS') || this.results.BATCH_JOBS;
    if (!jobs || !jobs.jobOverview) return;

    // Identify job chains as automated processes
    const activeJobs = (jobs.jobOverview || []).filter(j => j.STATUS === 'S' || j.STATUS === 'R');

    if (activeJobs.length > 0) {
      this._catalog.addProcess({
        processId: 'BATCH_PROCESSES',
        name: 'Automated Batch Processes',
        category: 'support',
        variants: [{
          variantId: 'BATCH_ACTIVE',
          description: 'Active scheduled batch jobs',
          steps: activeJobs.slice(0, 20).map(j => ({
            tcode: 'SM36',
            activity: (j.JOBNAME || '').trim(),
            avgDuration: 0,
            automation: 'batch',
          })),
          volume: activeJobs.length,
          users: [],
        }],
        evidence: { changeDocuments: 0, usageStatistics: 0, batchJobs: activeJobs.map(j => j.JOBNAME), workflows: [] },
        gaps: [],
      });
    }
  }

  async _mineFromWorkflows() {
    const wf = this.results.get?.('WORKFLOWS') || this.results.WORKFLOWS;
    if (!wf || !wf.templates) return;

    const templates = wf.templates || [];
    if (templates.length > 0) {
      this._catalog.addProcess({
        processId: 'WORKFLOW_PROCESSES',
        name: 'Workflow-Mediated Processes',
        category: 'support',
        variants: templates.map(t => ({
          variantId: `WF_${t.WI_ID || t.TASK_ID || 'unknown'}`,
          description: (t.WI_TEXT || t.SHORT_TEXT || 'Workflow').trim(),
          steps: (wf.templateSteps || [])
            .filter(s => s.WI_ID === t.WI_ID || s.TASK_ID === t.TASK_ID)
            .map(s => ({ activity: (s.STEP_TEXT || s.WI_TEXT || '').trim(), automation: 'workflow' })),
          volume: 0,
          users: [],
        })),
        evidence: { changeDocuments: 0, usageStatistics: 0, batchJobs: [], workflows: templates.map(t => t.WI_ID || t.TASK_ID) },
        gaps: [],
      });
    }
  }

  async _correlateProcesses() {
    // Cross-reference: link interfaces and custom code to processes
    const interfaces = this.results.get?.('INTERFACES') || this.results.INTERFACES;
    const customCode = this.results.get?.('CUSTOM_CODE') || this.results.CUSTOM_CODE;

    for (const proc of this._catalog.processes) {
      if (interfaces && interfaces.rfcDestinations) {
        proc.interfaces = interfaces.rfcDestinations
          .filter(r => r.RFCTYPE === '3')
          .slice(0, 5)
          .map(r => (r.RFCDEST || '').trim());
      }
      if (customCode && customCode.stats) {
        proc.customCode = [`${customCode.stats.totalCustom || 0} custom objects total`];
      }
    }
  }

  _deriveVariants(eventLog) {
    const casePatterns = new Map();
    for (const [caseId, events] of Object.entries(eventLog.cases)) {
      const pattern = events.map(e => e.activity).join(' → ');
      if (!casePatterns.has(pattern)) {
        casePatterns.set(pattern, { events: events, count: 0, users: new Set() });
      }
      casePatterns.get(pattern).count++;
      for (const e of events) {
        casePatterns.get(pattern).users.add(e.user);
      }
    }

    return Array.from(casePatterns.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([pattern, data], i) => ({
        variantId: `V${i + 1}`,
        description: pattern,
        steps: data.events.map(e => ({
          tcode: e.tcode,
          activity: e.activity,
          avgDuration: 0,
          automation: 'manual',
        })),
        volume: data.count,
        users: Array.from(data.users),
      }));
  }

  getProcessCatalog() {
    return this._catalog;
  }
}

module.exports = ProcessMiningEngine;
