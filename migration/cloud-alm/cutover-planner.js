/**
 * Cutover Planner
 *
 * Plans and manages the cutover sequence for go-live:
 * - Task sequencing with dependencies
 * - Duration estimation from historical data
 * - Critical path calculation
 * - Go/no-go checklist generation
 * - Rollback plan generation
 */

const Logger = require('../../lib/logger');

class CutoverPlanner {
  constructor(options = {}) {
    this.logger = new Logger('cutover-plan', { level: options.verbose ? 'debug' : 'info' });
    this._tasks = [];
    this._checklistItems = [];
  }

  /**
   * Generate a cutover plan from migration results and project config
   */
  generatePlan(projectConfig, migrationResults) {
    const tasks = this._generateTasks(projectConfig, migrationResults);
    const checklist = this._generateChecklist(projectConfig, migrationResults);
    const criticalPath = this._calculateCriticalPath(tasks);
    const rollback = this._generateRollbackPlan(projectConfig);

    this._tasks = tasks;
    this._checklistItems = checklist;

    return {
      projectId: projectConfig.projectId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalTasks: tasks.length,
        totalDurationHrs: this._totalDuration(tasks),
        criticalPathHrs: this._totalDuration(criticalPath),
        phases: this._getPhases(tasks),
        checklistItems: checklist.length,
      },
      tasks,
      criticalPath: criticalPath.map(t => t.id),
      checklist,
      rollback,
    };
  }

  /**
   * Generate cutover tasks
   */
  _generateTasks(config, results) {
    const tasks = [];
    let seq = 0;

    // Phase 1: Pre-cutover preparation
    tasks.push(this._task(++seq, 'PREP', 'System backup', 4, [], 'critical'));
    tasks.push(this._task(++seq, 'PREP', 'Lock users in source system', 0.5, [1], 'critical'));
    tasks.push(this._task(++seq, 'PREP', 'Verify no open transactions', 1, [2], 'critical'));
    tasks.push(this._task(++seq, 'PREP', 'Export configuration transport', 2, [1], 'high'));

    // Phase 2: Data migration
    const migStart = seq + 1;
    tasks.push(this._task(++seq, 'MIGRATE', 'Run master data migration', 3, [3], 'critical'));
    tasks.push(this._task(++seq, 'MIGRATE', 'Run transactional data migration', 4, [migStart], 'critical'));
    tasks.push(this._task(++seq, 'MIGRATE', 'Run open items migration', 2, [migStart], 'high'));
    tasks.push(this._task(++seq, 'MIGRATE', 'Run configuration migration', 1, [3], 'high'));

    // Phase 3: Validation
    const valStart = seq + 1;
    tasks.push(this._task(++seq, 'VALIDATE', 'Record count reconciliation', 1, [6, 7], 'critical'));
    tasks.push(this._task(++seq, 'VALIDATE', 'Financial balance reconciliation', 2, [6], 'critical'));
    tasks.push(this._task(++seq, 'VALIDATE', 'Master data spot checks', 1, [5], 'high'));
    tasks.push(this._task(++seq, 'VALIDATE', 'Data quality report review', 1, [valStart], 'high'));

    // Phase 4: Testing
    tasks.push(this._task(++seq, 'TEST', 'Execute critical business process tests', 3, [valStart, valStart + 1], 'critical'));
    tasks.push(this._task(++seq, 'TEST', 'Execute integration tests', 2, [13], 'high'));
    tasks.push(this._task(++seq, 'TEST', 'Execute performance tests', 2, [13], 'medium'));

    // Phase 5: Go-live
    tasks.push(this._task(++seq, 'GOLIVE', 'Go/No-Go decision', 0.5, [13, 14], 'critical'));
    tasks.push(this._task(++seq, 'GOLIVE', 'Unlock users in target system', 0.5, [16], 'critical'));
    tasks.push(this._task(++seq, 'GOLIVE', 'Enable production interfaces', 1, [17], 'critical'));
    tasks.push(this._task(++seq, 'GOLIVE', 'Hypercare monitoring start', 0, [18], 'critical'));

    // Add object-specific migration tasks if results provided
    if (results && results.length > 0) {
      for (const r of results.slice(0, 10)) {
        tasks.push(this._task(++seq, 'MIGRATE',
          `Verify ${r.objectId}: ${r.phases?.extract?.recordCount || 0} records`,
          0.5, [5], 'medium'));
      }
    }

    return tasks;
  }

  _task(seq, phase, name, durationHrs, dependencies, priority) {
    return {
      id: seq,
      phase,
      name,
      durationHrs,
      dependencies,
      priority,
      status: 'planned',
    };
  }

  /**
   * Calculate critical path (simplified: longest path through dependencies)
   */
  _calculateCriticalPath(tasks) {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const memo = new Map();

    const longestPath = (taskId) => {
      if (memo.has(taskId)) return memo.get(taskId);
      const task = taskMap.get(taskId);
      if (!task) return [];

      if (task.dependencies.length === 0) {
        const path = [task];
        memo.set(taskId, path);
        return path;
      }

      let longest = [];
      for (const depId of task.dependencies) {
        const depPath = longestPath(depId);
        if (this._pathDuration(depPath) > this._pathDuration(longest)) {
          longest = depPath;
        }
      }

      const path = [...longest, task];
      memo.set(taskId, path);
      return path;
    };

    // Find the terminal task with the longest path
    let criticalPath = [];
    for (const task of tasks) {
      const path = longestPath(task.id);
      if (this._pathDuration(path) > this._pathDuration(criticalPath)) {
        criticalPath = path;
      }
    }

    return criticalPath;
  }

  _pathDuration(path) {
    return path.reduce((s, t) => s + t.durationHrs, 0);
  }

  /**
   * Generate go/no-go checklist
   */
  _generateChecklist(config, results) {
    const items = [
      { id: 'CHK-001', category: 'Data', item: 'All migration objects completed successfully', mandatory: true },
      { id: 'CHK-002', category: 'Data', item: 'Record count reconciliation passed', mandatory: true },
      { id: 'CHK-003', category: 'Data', item: 'Financial balance reconciliation passed', mandatory: true },
      { id: 'CHK-004', category: 'Data', item: 'Data quality report reviewed and accepted', mandatory: true },
      { id: 'CHK-005', category: 'Testing', item: 'All critical business process tests passed', mandatory: true },
      { id: 'CHK-006', category: 'Testing', item: 'Integration tests passed', mandatory: true },
      { id: 'CHK-007', category: 'Testing', item: 'Performance tests within SLA', mandatory: false },
      { id: 'CHK-008', category: 'Technical', item: 'System backup completed', mandatory: true },
      { id: 'CHK-009', category: 'Technical', item: 'Rollback plan tested', mandatory: true },
      { id: 'CHK-010', category: 'Technical', item: 'Network/firewall rules configured', mandatory: true },
      { id: 'CHK-011', category: 'Organization', item: 'Go-live communication sent', mandatory: true },
      { id: 'CHK-012', category: 'Organization', item: 'Support team on standby', mandatory: true },
      { id: 'CHK-013', category: 'Organization', item: 'Business sign-off received', mandatory: true },
      { id: 'CHK-014', category: 'Technical', item: 'Interfaces tested in production', mandatory: false },
      { id: 'CHK-015', category: 'Technical', item: 'Monitoring and alerting configured', mandatory: true },
    ];

    return items.map(item => ({ ...item, status: 'pending' }));
  }

  /**
   * Generate rollback plan
   */
  _generateRollbackPlan(config) {
    return {
      triggerCriteria: [
        'Critical business process failure that cannot be resolved within 4 hours',
        'Data integrity issue affecting financial reporting',
        'System performance below acceptable thresholds for >2 hours',
        'Business decision to abort go-live',
      ],
      steps: [
        { seq: 1, action: 'Lock users in target S/4HANA system', durationMin: 5 },
        { seq: 2, action: 'Disable production interfaces', durationMin: 15 },
        { seq: 3, action: 'Restore source system from backup', durationMin: 120 },
        { seq: 4, action: 'Verify source system data integrity', durationMin: 60 },
        { seq: 5, action: 'Re-enable source system interfaces', durationMin: 30 },
        { seq: 6, action: 'Unlock users in source system', durationMin: 5 },
        { seq: 7, action: 'Communicate rollback to stakeholders', durationMin: 15 },
        { seq: 8, action: 'Root cause analysis', durationMin: 240 },
      ],
      totalRollbackTimeMin: 490,
      maxDecisionWindowHrs: 4,
    };
  }

  _totalDuration(tasks) {
    return Math.round(tasks.reduce((s, t) => s + t.durationHrs, 0) * 10) / 10;
  }

  _getPhases(tasks) {
    const phases = {};
    for (const t of tasks) {
      if (!phases[t.phase]) phases[t.phase] = { count: 0, durationHrs: 0 };
      phases[t.phase].count++;
      phases[t.phase].durationHrs += t.durationHrs;
    }
    return phases;
  }
}

module.exports = CutoverPlanner;
