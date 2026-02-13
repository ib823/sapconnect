/**
 * Cloud ALM Connector
 *
 * Integrates with SAP Cloud ALM for:
 * - Project synchronization (create/update projects in Cloud ALM)
 * - Task tracking (sync migration tasks with Cloud ALM tasks)
 * - Status reporting (push migration status updates)
 * - Issue management (create/close issues from validation failures)
 *
 * Supports mock mode for testing without Cloud ALM credentials.
 */

const Logger = require('../../lib/logger');

class CloudALMConnector {
  constructor(options = {}) {
    this.logger = new Logger('cloud-alm', { level: options.verbose ? 'debug' : 'info' });
    this.mode = options.mode || 'mock';
    this.baseUrl = options.baseUrl || '';
    this.credentials = options.credentials || null;
    this._mockStore = {
      projects: new Map(),
      tasks: new Map(),
      issues: new Map(),
      statusUpdates: [],
    };
    this._idCounter = 0;
  }

  /**
   * Sync a migration project to Cloud ALM
   */
  async syncProject(projectData) {
    this.logger.info(`Syncing project ${projectData.projectId} to Cloud ALM`);

    if (this.mode === 'mock') {
      return this._mockSyncProject(projectData);
    }

    throw new Error('Live Cloud ALM integration not yet implemented');
  }

  /**
   * Create or update a task in Cloud ALM
   */
  async syncTask(task) {
    this.logger.debug(`Syncing task ${task.taskId || 'new'} to Cloud ALM`);

    if (this.mode === 'mock') {
      return this._mockSyncTask(task);
    }

    throw new Error('Live Cloud ALM integration not yet implemented');
  }

  /**
   * Push a status update for a migration run
   */
  async pushStatus(statusUpdate) {
    this.logger.info(`Pushing status update for ${statusUpdate.projectId}`);

    if (this.mode === 'mock') {
      return this._mockPushStatus(statusUpdate);
    }

    throw new Error('Live Cloud ALM integration not yet implemented');
  }

  /**
   * Create an issue from a validation/reconciliation failure
   */
  async createIssue(issue) {
    this.logger.debug(`Creating issue: ${issue.title}`);

    if (this.mode === 'mock') {
      return this._mockCreateIssue(issue);
    }

    throw new Error('Live Cloud ALM integration not yet implemented');
  }

  /**
   * Close an issue
   */
  async closeIssue(issueId, resolution) {
    this.logger.debug(`Closing issue ${issueId}`);

    if (this.mode === 'mock') {
      return this._mockCloseIssue(issueId, resolution);
    }

    throw new Error('Live Cloud ALM integration not yet implemented');
  }

  /**
   * Get project status from Cloud ALM
   */
  async getProjectStatus(projectId) {
    if (this.mode === 'mock') {
      return this._mockGetProjectStatus(projectId);
    }

    throw new Error('Live Cloud ALM integration not yet implemented');
  }

  /**
   * Get all issues for a project
   */
  async getIssues(projectId) {
    if (this.mode === 'mock') {
      return this._mockGetIssues(projectId);
    }

    throw new Error('Live Cloud ALM integration not yet implemented');
  }

  /**
   * Push migration results as Cloud ALM test results
   */
  async pushTestResults(projectId, testResults) {
    this.logger.info(`Pushing ${testResults.length} test results for ${projectId}`);

    if (this.mode === 'mock') {
      return this._mockPushTestResults(projectId, testResults);
    }

    throw new Error('Live Cloud ALM integration not yet implemented');
  }

  // ── Mock implementations ───────────────────────────────────

  _mockSyncProject(projectData) {
    const existing = this._mockStore.projects.get(projectData.projectId);
    const project = {
      ...existing,
      ...projectData,
      almId: existing?.almId || `ALM-${++this._idCounter}`,
      syncedAt: new Date().toISOString(),
      status: projectData.status || 'active',
    };
    this._mockStore.projects.set(projectData.projectId, project);
    return { success: true, almId: project.almId, action: existing ? 'updated' : 'created' };
  }

  _mockSyncTask(task) {
    const taskId = task.taskId || `TASK-${++this._idCounter}`;
    const existing = this._mockStore.tasks.get(taskId);
    const stored = {
      ...existing,
      ...task,
      taskId,
      almTaskId: existing?.almTaskId || `ALM-T-${this._idCounter}`,
      syncedAt: new Date().toISOString(),
    };
    this._mockStore.tasks.set(taskId, stored);
    return { success: true, taskId, almTaskId: stored.almTaskId };
  }

  _mockPushStatus(statusUpdate) {
    this._mockStore.statusUpdates.push({
      ...statusUpdate,
      pushedAt: new Date().toISOString(),
    });
    return { success: true, statusId: `STATUS-${++this._idCounter}` };
  }

  _mockCreateIssue(issue) {
    const issueId = `ISSUE-${++this._idCounter}`;
    this._mockStore.issues.set(issueId, {
      ...issue,
      issueId,
      status: 'open',
      createdAt: new Date().toISOString(),
    });
    return { success: true, issueId };
  }

  _mockCloseIssue(issueId, resolution) {
    const issue = this._mockStore.issues.get(issueId);
    if (!issue) return { success: false, error: 'Issue not found' };
    issue.status = 'closed';
    issue.resolution = resolution;
    issue.closedAt = new Date().toISOString();
    return { success: true, issueId };
  }

  _mockGetProjectStatus(projectId) {
    const project = this._mockStore.projects.get(projectId);
    if (!project) return null;
    const tasks = Array.from(this._mockStore.tasks.values())
      .filter(t => t.projectId === projectId);
    const issues = Array.from(this._mockStore.issues.values())
      .filter(i => i.projectId === projectId);
    return {
      project,
      taskCount: tasks.length,
      openIssues: issues.filter(i => i.status === 'open').length,
      statusUpdates: this._mockStore.statusUpdates
        .filter(s => s.projectId === projectId).length,
    };
  }

  _mockGetIssues(projectId) {
    return Array.from(this._mockStore.issues.values())
      .filter(i => i.projectId === projectId);
  }

  _mockPushTestResults(projectId, testResults) {
    return {
      success: true,
      projectId,
      resultCount: testResults.length,
      syncedAt: new Date().toISOString(),
    };
  }
}

module.exports = CloudALMConnector;
