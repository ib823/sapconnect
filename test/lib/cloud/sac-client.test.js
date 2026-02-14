/**
 * Tests for SAP Analytics Cloud (SAC) REST API Client
 */
const SACClient = require('../../../lib/cloud/sac-client');
const { SACError } = require('../../../lib/errors');

describe('SACClient', () => {
  let client;

  beforeEach(() => {
    client = new SACClient({ mode: 'mock', tenantId: 'TEST_TENANT' });
  });

  // ── Constructor ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const c = new SACClient({});
      expect(c.mode).toBe('mock');
    });

    it('should accept custom options', () => {
      const c = new SACClient({
        baseUrl: 'https://sac.example.com',
        tenantId: 'MY_TENANT',
        clientId: 'cid',
        clientSecret: 'secret',
        mode: 'mock',
      });
      expect(c.baseUrl).toBe('https://sac.example.com');
      expect(c.tenantId).toBe('MY_TENANT');
    });

    it('should throw when tenantId missing in live mode', () => {
      expect(() => new SACClient({ mode: 'live' }))
        .toThrow(SACError);
    });
  });

  // ── authenticate ─────────────────────────────────────────────────

  describe('authenticate', () => {
    it('should authenticate in mock mode', async () => {
      const result = await client.authenticate();
      expect(result.authenticated).toBe(true);
      expect(result.mode).toBe('mock');
    });

    it('should store access token', async () => {
      await client.authenticate();
      expect(client._accessToken).toBeDefined();
      expect(client._accessToken).toContain('mock-sac-token');
    });

    it('should throw when not authenticated', () => {
      const unauthClient = new SACClient({ mode: 'mock' });
      expect(() => unauthClient.getModels()).rejects.toThrow(SACError);
    });
  });

  // ── Models ───────────────────────────────────────────────────────

  describe('models', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return models list', async () => {
      const result = await client.getModels();
      expect(result.models).toBeDefined();
      expect(result.models.length).toBeGreaterThan(0);
    });

    it('should get model by ID with full definition', async () => {
      const model = await client.getModel('MDL_FIN_001');
      expect(model.id).toBe('MDL_FIN_001');
      expect(model.name).toBe('Financial Planning');
      expect(model.dimensions).toBeDefined();
      expect(model.measures).toBeDefined();
    });

    it('should have 3 mock models', async () => {
      const result = await client.getModels();
      expect(result.models).toHaveLength(3);
    });

    it('should have correct model structure with dimensions and measures', async () => {
      const model = await client.getModel('MDL_FIN_001');
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('description');
      expect(model).toHaveProperty('category');
      expect(model).toHaveProperty('dimensions');
      expect(model).toHaveProperty('measures');
      expect(model.dimensions[0]).toHaveProperty('id');
      expect(model.dimensions[0]).toHaveProperty('name');
      expect(model.dimensions[0]).toHaveProperty('type');
      expect(model.measures[0]).toHaveProperty('id');
      expect(model.measures[0]).toHaveProperty('name');
      expect(model.measures[0]).toHaveProperty('type');
    });

    it('should get model data with filters', async () => {
      const data = await client.getModelData('MDL_FIN_001', { Company: 'ACME' });
      expect(data.modelId).toBe('MDL_FIN_001');
      expect(data.data).toBeDefined();
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.columns).toBeDefined();
      expect(data.rowCount).toBeGreaterThan(0);
    });
  });

  // ── Data Import ──────────────────────────────────────────────────

  describe('data import', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should import data and return job ID', async () => {
      const result = await client.importData('MDL_FIN_001', {
        rows: [
          { Company: 'ACME', Region: 'NA', Revenue: 1000000 },
          { Company: 'GLOB', Region: 'EMEA', Revenue: 800000 },
        ],
      });
      expect(result.jobId).toBeDefined();
      expect(result.status).toBe('RUNNING');
    });

    it('should get import job status', async () => {
      const importResult = await client.importData('MDL_FIN_001', { rows: [{ Revenue: 100 }] });
      const status = await client.getImportJobStatus(importResult.jobId);
      expect(status.jobId).toBe(importResult.jobId);
      expect(status.status).toBe('COMPLETED');
      expect(status.rowsProcessed).toBeDefined();
      expect(status.rowsAccepted).toBeDefined();
    });

    it('should report job status values', async () => {
      const importResult = await client.importData('MDL_FIN_001', { rows: [] });
      const status = await client.getImportJobStatus(importResult.jobId);
      expect(['RUNNING', 'COMPLETED', 'FAILED']).toContain(status.status);
    });

    it('should throw for invalid model', async () => {
      await expect(client.importData('NONEXISTENT', { rows: [] }))
        .rejects.toThrow(SACError);
    });
  });

  // ── Stories ──────────────────────────────────────────────────────

  describe('stories', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should return stories list', async () => {
      const result = await client.getStories();
      expect(result.stories).toBeDefined();
      expect(result.stories.length).toBeGreaterThan(0);
    });

    it('should get story by ID', async () => {
      const story = await client.getStory('STR_001');
      expect(story.id).toBe('STR_001');
      expect(story.name).toBe('Financial Overview');
    });

    it('should get story widgets', async () => {
      const result = await client.getStoryWidgets('STR_001');
      expect(result.storyId).toBe('STR_001');
      expect(result.widgets).toBeDefined();
      expect(result.widgets.length).toBeGreaterThan(0);
    });

    it('should have 5 mock stories', async () => {
      const result = await client.getStories();
      expect(result.stories).toHaveLength(5);
    });

    it('should have correct story structure', async () => {
      const story = await client.getStory('STR_001');
      expect(story).toHaveProperty('id');
      expect(story).toHaveProperty('name');
      expect(story).toHaveProperty('description');
      expect(story).toHaveProperty('createdBy');
      expect(story).toHaveProperty('modelId');
      expect(story).toHaveProperty('widgets');
    });
  });

  // ── Dimensions ───────────────────────────────────────────────────

  describe('dimensions', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should get dimensions for a model', async () => {
      const result = await client.getDimensions('MDL_FIN_001');
      expect(result.modelId).toBe('MDL_FIN_001');
      expect(result.dimensions).toBeDefined();
      expect(result.dimensions.length).toBeGreaterThan(0);
    });

    it('should get master data for a dimension', async () => {
      const result = await client.getMasterData('MDL_FIN_001', 'DIM_COMPANY');
      expect(result.modelId).toBe('MDL_FIN_001');
      expect(result.dimensionId).toBe('DIM_COMPANY');
      expect(result.members).toBeDefined();
      expect(result.members.length).toBeGreaterThan(0);
    });

    it('should have correct dimension member structure', async () => {
      const result = await client.getMasterData('MDL_FIN_001', 'DIM_COMPANY');
      const member = result.members[0];
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('description');
    });

    it('should throw on unknown dimension', async () => {
      await expect(client.getMasterData('MDL_FIN_001', 'DIM_NONEXISTENT'))
        .rejects.toThrow(SACError);
    });
  });

  // ── Planning Versions ────────────────────────────────────────────

  describe('planning versions', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should get versions for a model', async () => {
      const result = await client.getVersions('MDL_FIN_001');
      expect(result.modelId).toBe('MDL_FIN_001');
      expect(result.versions).toBeDefined();
      expect(result.versions.length).toBeGreaterThan(0);
    });

    it('should publish a version', async () => {
      const result = await client.publishVersion('MDL_FIN_001', 'VER_FORECAST');
      expect(result.status).toBe('Published');
      expect(result.modelId).toBe('MDL_FIN_001');
      expect(result.versionId).toBe('VER_FORECAST');
    });

    it('should have correct version structure', async () => {
      const result = await client.getVersions('MDL_FIN_001');
      const version = result.versions[0];
      expect(version).toHaveProperty('id');
      expect(version).toHaveProperty('name');
      expect(version).toHaveProperty('category');
      expect(version).toHaveProperty('status');
      expect(['Actual', 'Budget', 'Forecast']).toContain(version.category);
    });

    it('should throw on unknown version', async () => {
      await expect(client.publishVersion('MDL_FIN_001', 'VER_NONEXISTENT'))
        .rejects.toThrow(SACError);
    });
  });

  // ── Error handling ───────────────────────────────────────────────

  describe('error handling', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should throw SACError', async () => {
      try {
        await client.getModel('NONEXISTENT');
        expect.unreachable('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(SACError);
      }
    });

    it('should have correct error code', async () => {
      try {
        await client.getModel('NONEXISTENT');
        expect.unreachable('should have thrown');
      } catch (err) {
        expect(err.code).toBe('ERR_SAC');
      }
    });

    it('should throw on unknown model', async () => {
      await expect(client.getModel('NONEXISTENT'))
        .rejects.toThrow(SACError);
    });

    it('should throw on unknown story', async () => {
      await expect(client.getStory('NONEXISTENT'))
        .rejects.toThrow(SACError);
    });
  });

  // ── Mock data quality ────────────────────────────────────────────

  describe('mock data quality', () => {
    beforeEach(async () => {
      await client.authenticate();
    });

    it('should have realistic measure names', async () => {
      const model = await client.getModel('MDL_FIN_001');
      const measureNames = model.measures.map((m) => m.name);
      expect(measureNames).toContain('Revenue');
      expect(measureNames).toContain('Cost');
      expect(measureNames).toContain('Profit');
    });

    it('should have realistic dimension names', async () => {
      const model = await client.getModel('MDL_FIN_001');
      const dimNames = model.dimensions.map((d) => d.name);
      expect(dimNames).toContain('Company');
      expect(dimNames).toContain('Region');
      expect(dimNames).toContain('Product');
    });

    it('should have consistent IDs', async () => {
      const models = await client.getModels();
      const story = await client.getStory('STR_001');
      const modelIds = models.models.map((m) => m.id);
      expect(modelIds).toContain(story.modelId);
    });
  });
});
