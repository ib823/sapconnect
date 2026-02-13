const Logger = require('../lib/logger');

/**
 * Cutover Plan Generator
 *
 * Generates sequenced cutover steps with dependencies, timing,
 * and responsible parties. Mock mode produces a realistic cutover timeline.
 */
class CutoverPlan {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.goLiveDate = options.goLiveDate || this._nextMonday();
    this.clientName = options.clientName || 'SAP Client';
    this.logger = new Logger('cutover', { level: options.logLevel || 'info' });
  }

  _log(msg) {
    this.logger.info(msg);
  }

  _nextMonday() {
    const d = new Date();
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
    return d.toISOString().split('T')[0];
  }

  /**
   * Generate cutover plan
   * @returns {object} { phases[], milestones[], stats }
   */
  generate() {
    this._log('Generating cutover plan...');

    const phases = this._generatePhases();
    const milestones = this._generateMilestones();
    const risks = this._generateRisks();

    let totalTasks = 0;
    let totalHours = 0;
    for (const phase of phases) {
      totalTasks += phase.tasks.length;
      for (const task of phase.tasks) {
        totalHours += task.durationHours;
      }
    }

    return {
      phases,
      milestones,
      risks,
      stats: {
        totalPhases: phases.length,
        totalTasks,
        totalHours,
        totalDays: Math.ceil(totalHours / 8),
        goLiveDate: this.goLiveDate,
        cutoverWindowHours: 48,
      },
    };
  }

  _generatePhases() {
    return [
      {
        id: 'PRE-1',
        name: 'Pre-Cutover Preparation',
        timing: 'T-14 to T-7 days',
        status: 'pending',
        tasks: [
          { id: 'PRE-1.1', name: 'Final data reconciliation', owner: 'Data Team', durationHours: 16, depends: [], status: 'pending' },
          { id: 'PRE-1.2', name: 'Freeze custom code changes in ECC', owner: 'Development', durationHours: 2, depends: [], status: 'pending' },
          { id: 'PRE-1.3', name: 'Execute final transport to S/4HANA QAS', owner: 'Basis', durationHours: 4, depends: ['PRE-1.2'], status: 'pending' },
          { id: 'PRE-1.4', name: 'Run regression test suite', owner: 'Testing', durationHours: 24, depends: ['PRE-1.3'], status: 'pending' },
          { id: 'PRE-1.5', name: 'Communication to business users', owner: 'PMO', durationHours: 2, depends: [], status: 'pending' },
          { id: 'PRE-1.6', name: 'Prepare rollback procedure', owner: 'Basis', durationHours: 8, depends: [], status: 'pending' },
        ],
      },
      {
        id: 'CUT-1',
        name: 'System Lockdown',
        timing: 'T-0 Friday 18:00',
        status: 'pending',
        tasks: [
          { id: 'CUT-1.1', name: 'Block ECC user access (except migration)', owner: 'Basis', durationHours: 1, depends: ['PRE-1.4'], status: 'pending' },
          { id: 'CUT-1.2', name: 'Stop ECC batch jobs', owner: 'Basis', durationHours: 1, depends: ['CUT-1.1'], status: 'pending' },
          { id: 'CUT-1.3', name: 'Close open FI posting periods', owner: 'FI Team', durationHours: 2, depends: ['CUT-1.1'], status: 'pending' },
          { id: 'CUT-1.4', name: 'Close open MM/SD documents or flag as legacy', owner: 'Business', durationHours: 4, depends: ['CUT-1.1'], status: 'pending' },
        ],
      },
      {
        id: 'CUT-2',
        name: 'Delta Data Migration',
        timing: 'T-0 Friday 22:00 - Saturday',
        status: 'pending',
        tasks: [
          { id: 'CUT-2.1', name: 'Extract delta FI documents since last load', owner: 'Data Team', durationHours: 3, depends: ['CUT-1.3'], status: 'pending' },
          { id: 'CUT-2.2', name: 'Extract delta MM/SD transactions', owner: 'Data Team', durationHours: 3, depends: ['CUT-1.4'], status: 'pending' },
          { id: 'CUT-2.3', name: 'Transform and load delta data', owner: 'Data Team', durationHours: 6, depends: ['CUT-2.1', 'CUT-2.2'], status: 'pending' },
          { id: 'CUT-2.4', name: 'Reconcile opening balances', owner: 'FI Team', durationHours: 8, depends: ['CUT-2.3'], status: 'pending' },
        ],
      },
      {
        id: 'CUT-3',
        name: 'Validation & Verification',
        timing: 'T-0 Saturday',
        status: 'pending',
        tasks: [
          { id: 'CUT-3.1', name: 'Run data comparison tests', owner: 'Testing', durationHours: 4, depends: ['CUT-2.4'], status: 'pending' },
          { id: 'CUT-3.2', name: 'Run business process tests', owner: 'Testing', durationHours: 6, depends: ['CUT-3.1'], status: 'pending' },
          { id: 'CUT-3.3', name: 'Business sign-off on data', owner: 'Business', durationHours: 4, depends: ['CUT-3.1'], status: 'pending' },
          { id: 'CUT-3.4', name: 'Go/No-Go decision', owner: 'Steering Committee', durationHours: 2, depends: ['CUT-3.2', 'CUT-3.3'], status: 'pending' },
        ],
      },
      {
        id: 'CUT-4',
        name: 'Go-Live Activation',
        timing: 'T-0 Sunday',
        status: 'pending',
        tasks: [
          { id: 'CUT-4.1', name: 'Open S/4HANA posting periods', owner: 'FI Team', durationHours: 1, depends: ['CUT-3.4'], status: 'pending' },
          { id: 'CUT-4.2', name: 'Configure S/4HANA batch jobs', owner: 'Basis', durationHours: 4, depends: ['CUT-3.4'], status: 'pending' },
          { id: 'CUT-4.3', name: 'Enable user access in S/4HANA', owner: 'Security', durationHours: 2, depends: ['CUT-4.1'], status: 'pending' },
          { id: 'CUT-4.4', name: 'DNS/URL cutover to S/4HANA', owner: 'Basis', durationHours: 1, depends: ['CUT-4.3'], status: 'pending' },
          { id: 'CUT-4.5', name: 'Integration channel activation', owner: 'Integration', durationHours: 2, depends: ['CUT-4.4'], status: 'pending' },
        ],
      },
      {
        id: 'POST-1',
        name: 'Post Go-Live Hypercare',
        timing: 'T+1 to T+14 days',
        status: 'pending',
        tasks: [
          { id: 'POST-1.1', name: 'Monitor system performance', owner: 'Basis', durationHours: 40, depends: ['CUT-4.5'], status: 'pending' },
          { id: 'POST-1.2', name: 'Triage and resolve issues', owner: 'All Teams', durationHours: 80, depends: ['CUT-4.5'], status: 'pending' },
          { id: 'POST-1.3', name: 'Daily status calls', owner: 'PMO', durationHours: 14, depends: ['CUT-4.5'], status: 'pending' },
          { id: 'POST-1.4', name: 'First period-end close', owner: 'FI Team', durationHours: 16, depends: ['CUT-4.5'], status: 'pending' },
          { id: 'POST-1.5', name: 'Decommission ECC access', owner: 'Basis', durationHours: 4, depends: ['POST-1.4'], status: 'pending' },
        ],
      },
    ];
  }

  _generateMilestones() {
    return [
      { id: 'M1', name: 'Code Freeze', date: this._offsetDate(-14), status: 'pending' },
      { id: 'M2', name: 'Regression Tests Pass', date: this._offsetDate(-7), status: 'pending' },
      { id: 'M3', name: 'System Lockdown', date: this._offsetDate(0), status: 'pending' },
      { id: 'M4', name: 'Delta Migration Complete', date: this._offsetDate(1), status: 'pending' },
      { id: 'M5', name: 'Go/No-Go Decision', date: this._offsetDate(1), status: 'pending' },
      { id: 'M6', name: 'Go-Live', date: this.goLiveDate, status: 'pending' },
      { id: 'M7', name: 'Hypercare Complete', date: this._offsetDate(14), status: 'pending' },
    ];
  }

  _generateRisks() {
    return [
      { id: 'R1', risk: 'Delta data volume exceeds cutover window', probability: 'Medium', impact: 'High', mitigation: 'Pre-migrate 90% of data; minimize delta window', owner: 'Data Team' },
      { id: 'R2', risk: 'Integration failures during activation', probability: 'Medium', impact: 'High', mitigation: 'Test all interfaces in dress rehearsal; have manual fallback', owner: 'Integration' },
      { id: 'R3', risk: 'Performance issues at scale', probability: 'Low', impact: 'High', mitigation: 'Load test with production volumes; have HANA scaling plan', owner: 'Basis' },
      { id: 'R4', risk: 'Business user readiness gaps', probability: 'Medium', impact: 'Medium', mitigation: 'Training completed T-30; super user support in place', owner: 'PMO' },
      { id: 'R5', risk: 'Rollback required', probability: 'Low', impact: 'Critical', mitigation: 'Full ECC backup; tested rollback procedure; 4-hour RPO', owner: 'Basis' },
    ];
  }

  _offsetDate(days) {
    const d = new Date(this.goLiveDate);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
}

module.exports = CutoverPlan;
