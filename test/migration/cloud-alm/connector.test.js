const CloudALMConnector = require('../../../migration/cloud-alm/connector');

describe('CloudALMConnector', () => {
  let connector;

  beforeEach(() => { connector = new CloudALMConnector({ mode: 'mock' }); });

  // ── syncProject ────────────────────────────────────────────

  describe('syncProject', () => {
    it('creates a new project in ALM', async () => {
      const result = await connector.syncProject({ projectId: 'PRJ-001', name: 'Test Migration' });
      expect(result.success).toBe(true);
      expect(result.almId).toBeDefined();
      expect(result.action).toBe('created');
    });

    it('updates an existing project', async () => {
      await connector.syncProject({ projectId: 'PRJ-001', name: 'V1' });
      const result = await connector.syncProject({ projectId: 'PRJ-001', name: 'V2' });
      expect(result.action).toBe('updated');
    });
  });

  // ── syncTask ───────────────────────────────────────────────

  describe('syncTask', () => {
    it('creates a new task', async () => {
      const result = await connector.syncTask({ taskId: 'T-001', projectId: 'PRJ-001', title: 'Migrate GL' });
      expect(result.success).toBe(true);
      expect(result.taskId).toBe('T-001');
      expect(result.almTaskId).toBeDefined();
    });

    it('generates taskId when not provided', async () => {
      const result = await connector.syncTask({ projectId: 'PRJ-001', title: 'Auto ID' });
      expect(result.success).toBe(true);
      expect(result.taskId).toMatch(/^TASK-/);
    });
  });

  // ── pushStatus ─────────────────────────────────────────────

  describe('pushStatus', () => {
    it('pushes status update', async () => {
      const result = await connector.pushStatus({
        projectId: 'PRJ-001',
        status: 'completed',
        objectsRun: 24,
        objectsCompleted: 23,
      });
      expect(result.success).toBe(true);
      expect(result.statusId).toBeDefined();
    });
  });

  // ── createIssue / closeIssue ───────────────────────────────

  describe('issues', () => {
    it('creates an issue', async () => {
      const result = await connector.createIssue({
        projectId: 'PRJ-001',
        title: 'GL Balance mismatch',
        severity: 'high',
      });
      expect(result.success).toBe(true);
      expect(result.issueId).toBeDefined();
    });

    it('closes an issue', async () => {
      const created = await connector.createIssue({ projectId: 'PRJ-001', title: 'Test issue' });
      const closed = await connector.closeIssue(created.issueId, 'Fixed');
      expect(closed.success).toBe(true);
    });

    it('returns error for unknown issue', async () => {
      const result = await connector.closeIssue('NONEXISTENT', 'N/A');
      expect(result.success).toBe(false);
    });
  });

  // ── getProjectStatus ───────────────────────────────────────

  describe('getProjectStatus', () => {
    it('returns null for unknown project', async () => {
      const status = await connector.getProjectStatus('UNKNOWN');
      expect(status).toBeNull();
    });

    it('returns project with counts', async () => {
      await connector.syncProject({ projectId: 'PRJ-001', name: 'Test' });
      await connector.syncTask({ taskId: 'T1', projectId: 'PRJ-001' });
      await connector.createIssue({ projectId: 'PRJ-001', title: 'Issue 1' });
      await connector.pushStatus({ projectId: 'PRJ-001', status: 'running' });

      const status = await connector.getProjectStatus('PRJ-001');
      expect(status.project.projectId).toBe('PRJ-001');
      expect(status.taskCount).toBe(1);
      expect(status.openIssues).toBe(1);
      expect(status.statusUpdates).toBe(1);
    });
  });

  // ── getIssues ──────────────────────────────────────────────

  describe('getIssues', () => {
    it('returns issues for project', async () => {
      await connector.createIssue({ projectId: 'PRJ-001', title: 'A' });
      await connector.createIssue({ projectId: 'PRJ-001', title: 'B' });
      await connector.createIssue({ projectId: 'PRJ-002', title: 'C' });

      const issues = await connector.getIssues('PRJ-001');
      expect(issues).toHaveLength(2);
    });
  });

  // ── pushTestResults ────────────────────────────────────────

  describe('pushTestResults', () => {
    it('pushes test results', async () => {
      const result = await connector.pushTestResults('PRJ-001', [
        { id: 'T1', status: 'passed' },
        { id: 'T2', status: 'failed' },
      ]);
      expect(result.success).toBe(true);
      expect(result.resultCount).toBe(2);
    });
  });

  // ── mode check ─────────────────────────────────────────────

  it('throws in live mode', async () => {
    const live = new CloudALMConnector({ mode: 'live' });
    await expect(live.syncProject({ projectId: 'X' })).rejects.toThrow(/not yet implemented/);
  });
});
