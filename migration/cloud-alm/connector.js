/**
 * Cloud ALM Connector
 *
 * Integrates with SAP Cloud ALM for:
 * - Project synchronization (create/update projects in Cloud ALM)
 * - Task tracking (sync migration tasks with Cloud ALM tasks)
 * - Status reporting (push migration status updates)
 * - Issue management (create/close issues from validation failures)
 *
 * Supports live mode (OData to Cloud ALM APIs) and mock mode.
 */

const Logger = require('../../lib/logger');
const ODataClient = require('../../lib/odata/client');
const { OAuth2ClientCredentialsProvider } = require('../../lib/odata/auth');

const CLOUD_ALM_PATHS = {
  projects: '/api/calm-projects/v1/projects',
  tasks: '/api/calm-tasks/v1/tasks',
  requirements: '/api/calm-requirements/v1/requirements',
  testCases: '/api/calm-test/v1/testCases',
};

class CloudALMConnector {
  constructor(options = {}) {
    this.logger = new Logger('cloud-alm', { level: options.verbose ? 'debug' : 'info' });
    this.mode = options.mode || 'mock';
    this.baseUrl = options.baseUrl || '';
    this.credentials = options.credentials || null;
    this._client = null;
    this._mockStore = {
      projects: new Map(),
      tasks: new Map(),
      issues: new Map(),
      statusUpdates: [],
    };
    this._idCounter = 0;

    if (this.mode === 'live' && this.baseUrl && this.credentials) {
      this._initLiveClient();
    }
  }

  _initLiveClient() {
    const authProvider = new OAuth2ClientCredentialsProvider(
      this.credentials.tokenUrl,
      this.credentials.clientId,
      this.credentials.clientSecret,
      this.credentials.scope || '',
    );
    this._client = new ODataClient({
      baseUrl: this.baseUrl,
      authProvider,
      version: 'v4',
      timeout: 30000,
      retries: 2,
      logger: this.logger.child('odata'),
    });
  }

  /**
   * Sync a migration project to Cloud ALM
   */
  async syncProject(projectData) {
    this.logger.info(`Syncing project ${projectData.projectId} to Cloud ALM`);

    if (this.mode === 'mock') {
      return this._mockSyncProject(projectData);
    }

    return this._liveSyncProject(projectData);
  }

  /**
   * Create or update a task in Cloud ALM
   */
  async syncTask(task) {
    this.logger.debug(`Syncing task ${task.taskId || 'new'} to Cloud ALM`);

    if (this.mode === 'mock') {
      return this._mockSyncTask(task);
    }

    return this._liveSyncTask(task);
  }

  /**
   * Push a status update for a migration run
   */
  async pushStatus(statusUpdate) {
    this.logger.info(`Pushing status update for ${statusUpdate.projectId}`);

    if (this.mode === 'mock') {
      return this._mockPushStatus(statusUpdate);
    }

    return this._livePushStatus(statusUpdate);
  }

  /**
   * Create an issue from a validation/reconciliation failure
   */
  async createIssue(issue) {
    this.logger.debug(`Creating issue: ${issue.title}`);

    if (this.mode === 'mock') {
      return this._mockCreateIssue(issue);
    }

    return this._liveCreateIssue(issue);
  }

  /**
   * Close an issue
   */
  async closeIssue(issueId, resolution) {
    this.logger.debug(`Closing issue ${issueId}`);

    if (this.mode === 'mock') {
      return this._mockCloseIssue(issueId, resolution);
    }

    return this._liveCloseIssue(issueId, resolution);
  }

  /**
   * Get project status from Cloud ALM
   */
  async getProjectStatus(projectId) {
    if (this.mode === 'mock') {
      return this._mockGetProjectStatus(projectId);
    }

    return this._liveGetProjectStatus(projectId);
  }

  /**
   * Get all issues for a project
   */
  async getIssues(projectId) {
    if (this.mode === 'mock') {
      return this._mockGetIssues(projectId);
    }

    return this._liveGetIssues(projectId);
  }

  /**
   * Push migration results as Cloud ALM test results
   */
  async pushTestResults(projectId, testResults) {
    this.logger.info(`Pushing ${testResults.length} test results for ${projectId}`);

    if (this.mode === 'mock') {
      return this._mockPushTestResults(projectId, testResults);
    }

    return this._livePushTestResults(projectId, testResults);
  }

  // ── Live implementations ────────────────────────────────────

  async _liveSyncProject(projectData) {
    const payload = {
      name: projectData.name || projectData.projectId,
      externalId: projectData.projectId,
      description: projectData.description || `Migration project ${projectData.projectId}`,
      status: projectData.status || 'IN_PROGRESS',
      type: 'IMPLEMENTATION',
      startDate: projectData.startDate || new Date().toISOString().split('T')[0],
    };

    try {
      // Try update first (PATCH by externalId filter)
      const existing = await this._client.get(CLOUD_ALM_PATHS.projects, {
        $filter: `externalId eq '${projectData.projectId}'`,
      });
      const results = this._extractResults(existing);

      if (results.length > 0) {
        const almId = results[0].id || results[0].ID;
        await this._client.patch(`${CLOUD_ALM_PATHS.projects}('${almId}')`, payload);
        return { success: true, almId, action: 'updated' };
      }

      // Create new
      const created = await this._client.post(CLOUD_ALM_PATHS.projects, payload);
      const newId = created.id || created.ID || created.d?.id;
      return { success: true, almId: newId, action: 'created' };
    } catch (err) {
      this.logger.error('Cloud ALM syncProject failed', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  async _liveSyncTask(task) {
    const payload = {
      title: task.title || task.taskId,
      externalId: task.taskId,
      projectId: task.projectId,
      status: task.status || 'OPEN',
      description: task.description || '',
      assignee: task.assignee || null,
      dueDate: task.dueDate || null,
    };

    try {
      const existing = await this._client.get(CLOUD_ALM_PATHS.tasks, {
        $filter: `externalId eq '${task.taskId}'`,
      });
      const results = this._extractResults(existing);

      if (results.length > 0) {
        const almTaskId = results[0].id || results[0].ID;
        await this._client.patch(`${CLOUD_ALM_PATHS.tasks}('${almTaskId}')`, payload);
        return { success: true, taskId: task.taskId, almTaskId };
      }

      const created = await this._client.post(CLOUD_ALM_PATHS.tasks, payload);
      const newId = created.id || created.ID || created.d?.id;
      return { success: true, taskId: task.taskId, almTaskId: newId };
    } catch (err) {
      this.logger.error('Cloud ALM syncTask failed', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  async _livePushStatus(statusUpdate) {
    try {
      // Push status as a requirement/note on the project
      const payload = {
        projectId: statusUpdate.projectId,
        title: `Migration Status: ${statusUpdate.phase || 'update'}`,
        description: JSON.stringify(statusUpdate),
        type: 'STATUS_UPDATE',
        status: statusUpdate.status || 'IN_PROGRESS',
        createdAt: new Date().toISOString(),
      };
      const result = await this._client.post(CLOUD_ALM_PATHS.requirements, payload);
      return { success: true, statusId: result.id || result.ID || result.d?.id };
    } catch (err) {
      this.logger.error('Cloud ALM pushStatus failed', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  async _liveCreateIssue(issue) {
    try {
      const payload = {
        title: issue.title,
        projectId: issue.projectId,
        description: issue.description || '',
        priority: issue.priority || 'MEDIUM',
        type: 'DEFECT',
        status: 'OPEN',
      };
      const result = await this._client.post(CLOUD_ALM_PATHS.tasks, payload);
      const issueId = result.id || result.ID || result.d?.id;
      return { success: true, issueId };
    } catch (err) {
      this.logger.error('Cloud ALM createIssue failed', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  async _liveCloseIssue(issueId, resolution) {
    try {
      await this._client.patch(`${CLOUD_ALM_PATHS.tasks}('${issueId}')`, {
        status: 'CLOSED',
        resolution: resolution || 'FIXED',
      });
      return { success: true, issueId };
    } catch (err) {
      this.logger.error('Cloud ALM closeIssue failed', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  async _liveGetProjectStatus(projectId) {
    try {
      const projectData = await this._client.get(CLOUD_ALM_PATHS.projects, {
        $filter: `externalId eq '${projectId}'`,
      });
      const projects = this._extractResults(projectData);
      if (projects.length === 0) return null;

      const project = projects[0];
      const almProjectId = project.id || project.ID;

      const tasksData = await this._client.get(CLOUD_ALM_PATHS.tasks, {
        $filter: `projectId eq '${almProjectId}'`,
      });
      const tasks = this._extractResults(tasksData);
      const openIssues = tasks.filter(t => t.type === 'DEFECT' && t.status === 'OPEN').length;

      return {
        project,
        taskCount: tasks.length,
        openIssues,
        statusUpdates: 0,
      };
    } catch (err) {
      this.logger.error('Cloud ALM getProjectStatus failed', { error: err.message });
      return null;
    }
  }

  async _liveGetIssues(projectId) {
    try {
      const projectData = await this._client.get(CLOUD_ALM_PATHS.projects, {
        $filter: `externalId eq '${projectId}'`,
      });
      const projects = this._extractResults(projectData);
      if (projects.length === 0) return [];

      const almProjectId = projects[0].id || projects[0].ID;
      const tasksData = await this._client.get(CLOUD_ALM_PATHS.tasks, {
        $filter: `projectId eq '${almProjectId}' and type eq 'DEFECT'`,
      });
      return this._extractResults(tasksData);
    } catch (err) {
      this.logger.error('Cloud ALM getIssues failed', { error: err.message });
      return [];
    }
  }

  async _livePushTestResults(projectId, testResults) {
    try {
      let pushed = 0;
      for (const result of testResults) {
        await this._client.post(CLOUD_ALM_PATHS.testCases, {
          projectId,
          name: result.name || result.scenarioId,
          status: result.status || 'PASSED',
          executedAt: new Date().toISOString(),
          details: JSON.stringify(result),
        });
        pushed++;
      }
      return {
        success: true,
        projectId,
        resultCount: pushed,
        syncedAt: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.error('Cloud ALM pushTestResults failed', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  _extractResults(data) {
    if (Array.isArray(data)) return data;
    if (data?.value) return data.value;
    if (data?.d?.results) return data.d.results;
    if (data?.d) return [data.d];
    return [];
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
