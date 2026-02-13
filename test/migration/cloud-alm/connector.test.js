const CloudALMConnector = require('../../../migration/cloud-alm/connector');

describe('CloudALMConnector', () => {
  let connector;

  beforeEach(() => {
    connector = new CloudALMConnector({ mode: 'mock' });
  });

  // ── Constructor / mode ───────────────────────────────────────

  describe('constructor', () => {
    it('defaults to mock mode', () => {
      const c = new CloudALMConnector();
      expect(c.mode).toBe('mock');
    });

    it('mock mode does not create OData client', () => {
      expect(connector._client).toBeNull();
    });

    it('live mode sets up OData client when credentials provided', () => {
      const live = new CloudALMConnector({
        mode: 'live',
        baseUrl: 'https://calm.example.com',
        credentials: {
          tokenUrl: 'https://auth.example.com/token',
          clientId: 'test-id',
          clientSecret: 'test-secret',
        },
      });
      expect(live.mode).toBe('live');
      expect(live._client).not.toBeNull();
    });
  });

  // ── syncProject ──────────────────────────────────────────────

  describe('syncProject', () => {
    it('creates a new project and returns almId', async () => {
      const result = await connector.syncProject({
        projectId: 'PRJ-001',
        name: 'Test Migration',
      });
      expect(result.success).toBe(true);
      expect(result.almId).toBeDefined();
      expect(typeof result.almId).toBe('string');
      expect(result.action).toBe('created');
    });

    it('updates an existing project', async () => {
      await connector.syncProject({ projectId: 'PRJ-001', name: 'V1' });
      const result = await connector.syncProject({ projectId: 'PRJ-001', name: 'V2' });
      expect(result.success).toBe(true);
      expect(result.action).toBe('updated');
    });
  });

  // ── syncTask ─────────────────────────────────────────────────

  describe('syncTask', () => {
    it('creates a new task', async () => {
      const result = await connector.syncTask({
        taskId: 'T-001',
        projectId: 'PRJ-001',
        title: 'Migrate GL',
      });
      expect(result.success).toBe(true);
      expect(result.taskId).toBe('T-001');
      expect(result.almTaskId).toBeDefined();
    });

    it('updates an existing task', async () => {
      await connector.syncTask({
        taskId: 'T-001',
        projectId: 'PRJ-001',
        title: 'Migrate GL v1',
      });
      const result = await connector.syncTask({
        taskId: 'T-001',
        projectId: 'PRJ-001',
        title: 'Migrate GL v2',
      });
      expect(result.success).toBe(true);
      expect(result.taskId).toBe('T-001');
      expect(result.almTaskId).toBeDefined();
    });
  });

  // ── pushStatus ───────────────────────────────────────────────

  describe('pushStatus', () => {
    it('stores status update and returns statusId', async () => {
      const result = await connector.pushStatus({
        projectId: 'PRJ-001',
        phase: 'testing',
        status: 'in_progress',
      });
      expect(result.success).toBe(true);
      expect(result.statusId).toBeDefined();
      expect(typeof result.statusId).toBe('string');
    });
  });

  // ── createIssue / closeIssue ─────────────────────────────────

  describe('createIssue', () => {
    it('creates and returns issueId', async () => {
      const result = await connector.createIssue({
        projectId: 'PRJ-001',
        title: 'GL Balance mismatch',
        priority: 'high',
      });
      expect(result.success).toBe(true);
      expect(result.issueId).toBeDefined();
      expect(typeof result.issueId).toBe('string');
    });
  });

  describe('closeIssue', () => {
    it('closes an existing issue', async () => {
      const created = await connector.createIssue({
        projectId: 'PRJ-001',
        title: 'Test issue',
      });
      const closed = await connector.closeIssue(created.issueId, 'Fixed');
      expect(closed.success).toBe(true);
      expect(closed.issueId).toBe(created.issueId);
    });

    it('returns error for non-existent issue', async () => {
      const result = await connector.closeIssue('NONEXISTENT-999', 'N/A');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ── getProjectStatus ─────────────────────────────────────────

  describe('getProjectStatus', () => {
    it('returns null for unknown project', async () => {
      const status = await connector.getProjectStatus('UNKNOWN-PRJ');
      expect(status).toBeNull();
    });

    it('returns stats for known project', async () => {
      await connector.syncProject({ projectId: 'PRJ-001', name: 'Test' });
      await connector.syncTask({ taskId: 'T-1', projectId: 'PRJ-001' });
      await connector.syncTask({ taskId: 'T-2', projectId: 'PRJ-001' });
      await connector.createIssue({ projectId: 'PRJ-001', title: 'Issue A' });
      await connector.pushStatus({ projectId: 'PRJ-001', status: 'running' });

      const status = await connector.getProjectStatus('PRJ-001');
      expect(status).not.toBeNull();
      expect(status.project.projectId).toBe('PRJ-001');
      expect(status.taskCount).toBe(2);
      expect(status.openIssues).toBe(1);
      expect(status.statusUpdates).toBe(1);
    });
  });

  // ── getIssues ────────────────────────────────────────────────

  describe('getIssues', () => {
    it('returns filtered issues for a specific project', async () => {
      await connector.createIssue({ projectId: 'PRJ-001', title: 'Issue A' });
      await connector.createIssue({ projectId: 'PRJ-001', title: 'Issue B' });
      await connector.createIssue({ projectId: 'PRJ-002', title: 'Issue C' });

      const issues = await connector.getIssues('PRJ-001');
      expect(issues).toHaveLength(2);
      for (const issue of issues) {
        expect(issue.projectId).toBe('PRJ-001');
      }
    });

    it('returns empty array for project with no issues', async () => {
      const issues = await connector.getIssues('PRJ-EMPTY');
      expect(issues).toEqual([]);
    });
  });

  // ── pushTestResults ──────────────────────────────────────────

  describe('pushTestResults', () => {
    it('returns success with result count', async () => {
      const result = await connector.pushTestResults('PRJ-001', [
        { id: 'T1', name: 'GL Balance', status: 'passed' },
        { id: 'T2', name: 'Stock Level', status: 'failed' },
        { id: 'T3', name: 'Open POs', status: 'passed' },
      ]);
      expect(result.success).toBe(true);
      expect(result.resultCount).toBe(3);
      expect(result.projectId).toBe('PRJ-001');
      expect(result.syncedAt).toBeDefined();
    });
  });

  // ── Full lifecycle ───────────────────────────────────────────

  describe('full lifecycle', () => {
    it('create project -> add tasks -> push status -> create issues -> close issues -> get status', async () => {
      // 1. Create project
      const project = await connector.syncProject({
        projectId: 'LIFECYCLE-001',
        name: 'Full Lifecycle Test',
      });
      expect(project.success).toBe(true);
      expect(project.action).toBe('created');

      // 2. Add tasks
      const task1 = await connector.syncTask({
        taskId: 'LT-001',
        projectId: 'LIFECYCLE-001',
        title: 'Migrate FI data',
      });
      const task2 = await connector.syncTask({
        taskId: 'LT-002',
        projectId: 'LIFECYCLE-001',
        title: 'Migrate MM data',
      });
      expect(task1.success).toBe(true);
      expect(task2.success).toBe(true);

      // 3. Push status
      const status1 = await connector.pushStatus({
        projectId: 'LIFECYCLE-001',
        phase: 'extraction',
        status: 'in_progress',
      });
      expect(status1.success).toBe(true);

      // 4. Create issues
      const issue1 = await connector.createIssue({
        projectId: 'LIFECYCLE-001',
        title: 'GL Balance mismatch in company code 1000',
        priority: 'high',
      });
      const issue2 = await connector.createIssue({
        projectId: 'LIFECYCLE-001',
        title: 'Missing vendor master records',
        priority: 'medium',
      });
      expect(issue1.success).toBe(true);
      expect(issue2.success).toBe(true);

      // 5. Close one issue
      const closed = await connector.closeIssue(issue1.issueId, 'Resolved via delta load');
      expect(closed.success).toBe(true);

      // 6. Verify final status
      const finalStatus = await connector.getProjectStatus('LIFECYCLE-001');
      expect(finalStatus).not.toBeNull();
      expect(finalStatus.project.projectId).toBe('LIFECYCLE-001');
      expect(finalStatus.taskCount).toBe(2);
      expect(finalStatus.openIssues).toBe(1); // one closed, one still open
      expect(finalStatus.statusUpdates).toBe(1);

      // 7. Verify issues list
      const allIssues = await connector.getIssues('LIFECYCLE-001');
      expect(allIssues).toHaveLength(2);
      const openIssues = allIssues.filter(i => i.status === 'open');
      const closedIssues = allIssues.filter(i => i.status === 'closed');
      expect(openIssues).toHaveLength(1);
      expect(closedIssues).toHaveLength(1);
    });
  });
});
