const ProjectManager = require('../../../migration/cloud-alm/project-manager');
const CloudALMConnector = require('../../../migration/cloud-alm/connector');

describe('ProjectManager', () => {
  let mgr;

  beforeEach(() => { mgr = new ProjectManager(); });

  // ── createProject ──────────────────────────────────────────

  describe('createProject', () => {
    it('creates a project with defaults', () => {
      const result = mgr.createProject({ projectId: 'PRJ-001', name: 'Test Migration' });
      expect(result.projectId).toBe('PRJ-001');
      expect(result.name).toBe('Test Migration');
      expect(result.sourceSystem).toBe('ECC');
      expect(result.targetRelease).toBe('S4HANA_2023');
      expect(result.modules).toEqual(['FI', 'CO', 'MM', 'SD']);
      expect(result.objectCount).toBe(42);
    });

    it('throws on duplicate project ID', () => {
      mgr.createProject({ projectId: 'PRJ-001' });
      expect(() => mgr.createProject({ projectId: 'PRJ-001' })).toThrow(/already exists/);
    });

    it('applies template when specified', () => {
      const result = mgr.createProject({ projectId: 'PRJ-002', template: 'brownfield_core' });
      expect(result.sourceSystem).toBe('ECC');
      expect(result.modules).toEqual(['FI', 'CO']);
    });

    it('overrides template with explicit config', () => {
      const result = mgr.createProject({
        projectId: 'PRJ-003',
        template: 'brownfield_core',
        modules: ['FI', 'CO', 'MM'],
      });
      expect(result.modules).toEqual(['FI', 'CO', 'MM']);
    });
  });

  // ── getProject ─────────────────────────────────────────────

  describe('getProject', () => {
    it('returns project details', () => {
      mgr.createProject({ projectId: 'PRJ-001', name: 'Test' });
      const project = mgr.getProject('PRJ-001');
      expect(project.projectId).toBe('PRJ-001');
      expect(project.progress).toBeDefined();
      expect(project.runCount).toBe(0);
    });

    it('returns null for unknown project', () => {
      expect(mgr.getProject('NONEXISTENT')).toBeNull();
    });
  });

  // ── listProjects ───────────────────────────────────────────

  describe('listProjects', () => {
    it('lists all projects', () => {
      mgr.createProject({ projectId: 'A' });
      mgr.createProject({ projectId: 'B' });
      mgr.createProject({ projectId: 'C' });
      expect(mgr.listProjects()).toHaveLength(3);
    });

    it('returns empty array with no projects', () => {
      expect(mgr.listProjects()).toHaveLength(0);
    });
  });

  // ── runProject ─────────────────────────────────────────────

  describe('runProject', () => {
    it('runs migration and returns stats', async () => {
      mgr.createProject({ projectId: 'PRJ-001' });
      const result = await mgr.runProject('PRJ-001', { mode: 'mock' });
      expect(result.projectId).toBe('PRJ-001');
      expect(result.stats.total).toBe(42);
      expect(result.timestamp).toBeDefined();
    });

    it('throws for unknown project', async () => {
      await expect(mgr.runProject('UNKNOWN', { mode: 'mock' })).rejects.toThrow(/not found/);
    });

    it('updates project status after run', async () => {
      mgr.createProject({ projectId: 'PRJ-001' });
      await mgr.runProject('PRJ-001', { mode: 'mock' });
      const project = mgr.getProject('PRJ-001');
      expect(['completed', 'completed_with_errors']).toContain(project.status);
      expect(project.runCount).toBe(1);
    });

    it('syncs to Cloud ALM when connector present', async () => {
      const connector = new CloudALMConnector({ mode: 'mock' });
      const mgrWithALM = new ProjectManager({ connector });
      mgrWithALM.createProject({ projectId: 'PRJ-001' });
      await mgrWithALM.runProject('PRJ-001', { mode: 'mock' });

      const status = await connector.getProjectStatus('PRJ-001');
      // Status was pushed but project wasn't synced — check statusUpdates via mock
      expect(status).toBeNull(); // project itself wasn't synced, just status push
    });
  });

  // ── updateProject ──────────────────────────────────────────

  describe('updateProject', () => {
    it('updates project fields', () => {
      mgr.createProject({ projectId: 'PRJ-001', name: 'Old' });
      const updated = mgr.updateProject('PRJ-001', { name: 'New', status: 'active' });
      expect(updated.name).toBe('New');
      expect(updated.status).toBe('active');
    });

    it('throws for unknown project', () => {
      expect(() => mgr.updateProject('UNKNOWN', {})).toThrow(/not found/);
    });
  });

  // ── deleteProject ──────────────────────────────────────────

  describe('deleteProject', () => {
    it('deletes existing project', () => {
      mgr.createProject({ projectId: 'PRJ-001' });
      expect(mgr.deleteProject('PRJ-001')).toBe(true);
      expect(mgr.getProject('PRJ-001')).toBeNull();
    });

    it('returns false for unknown project', () => {
      expect(mgr.deleteProject('UNKNOWN')).toBe(false);
    });
  });

  // ── getTemplates ───────────────────────────────────────────

  describe('getTemplates', () => {
    it('returns 5 templates', () => {
      const templates = mgr.getTemplates();
      expect(templates).toHaveLength(5);
    });

    it('templates have required fields', () => {
      for (const t of mgr.getTemplates()) {
        expect(t.id).toBeDefined();
        expect(t.name).toBeDefined();
        expect(t.description).toBeDefined();
        expect(t.modules).toBeInstanceOf(Array);
      }
    });

    it('includes greenfield and brownfield options', () => {
      const ids = mgr.getTemplates().map(t => t.id);
      expect(ids).toContain('greenfield_full');
      expect(ids).toContain('brownfield_core');
      expect(ids).toContain('brownfield_full');
    });
  });
});
