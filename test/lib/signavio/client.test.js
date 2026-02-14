/**
 * Tests for Signavio REST API Client
 */
const { SignavioClient, SignavioError } = require('../../../lib/signavio');

describe('SignavioClient', () => {
  let client;

  beforeEach(() => {
    client = new SignavioClient({
      baseUrl: 'https://editor.signavio.com',
      tenantId: 'test-tenant-001',
      username: 'test@example.com',
      password: 'secret',
      mode: 'mock',
    });
  });

  // ── Constructor ─────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should use mock mode by default', () => {
      const c = new SignavioClient({});
      expect(c.mode).toBe('mock');
      expect(c.baseUrl).toBe('https://editor.signavio.com');
      expect(c.timeout).toBe(30000);
    });

    it('should accept custom options', () => {
      expect(client.baseUrl).toBe('https://editor.signavio.com');
      expect(client.tenantId).toBe('test-tenant-001');
      expect(client.username).toBe('test@example.com');
      expect(client.mode).toBe('mock');
    });

    it('should validate baseUrl in live mode', () => {
      expect(() => {
        new SignavioClient({ mode: 'live' });
      }).toThrow(SignavioError);
    });
  });

  // ── Authentication ──────────────────────────────────────────────────

  describe('authenticate', () => {
    it('should authenticate successfully in mock mode', async () => {
      const result = await client.authenticate();
      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.sessionId).toBeDefined();
    });

    it('should store token after authentication', async () => {
      await client.authenticate();
      expect(client._token).toBeDefined();
      expect(client._token).toContain('mock-signavio-jwt-token');
    });

    it('should set auth expiry after authentication', async () => {
      await client.authenticate();
      expect(client._authExpiry).toBeGreaterThan(Date.now());
    });

    it('should throw SignavioError on auth failure in live mode', async () => {
      const liveClient = new SignavioClient({
        baseUrl: 'https://invalid.signavio.com',
        mode: 'live',
      });
      await expect(liveClient.authenticate()).rejects.toThrow();
    });
  });

  // ── getModel ────────────────────────────────────────────────────────

  describe('getModel', () => {
    it('should return model JSON for valid revisionId', async () => {
      const model = await client.getModel('rev-o2c-001');
      expect(model).toBeDefined();
      expect(model.name).toBe('Order-to-Cash (O2C)');
      expect(model.elements).toBeDefined();
      expect(model.elements.tasks).toBeInstanceOf(Array);
      expect(model.elements.tasks.length).toBeGreaterThan(0);
    });

    it('should throw for model not found', async () => {
      await expect(client.getModel('rev-nonexistent')).rejects.toThrow(SignavioError);
    });

    it('should require revisionId parameter', async () => {
      await expect(client.getModel()).rejects.toThrow(SignavioError);
      await expect(client.getModel('')).rejects.toThrow(SignavioError);
    });
  });

  // ── getModelSvg ─────────────────────────────────────────────────────

  describe('getModelSvg', () => {
    it('should return SVG string for valid revisionId', async () => {
      const svg = await client.getModelSvg('rev-o2c-001');
      expect(svg).toBeDefined();
      expect(typeof svg).toBe('string');
      expect(svg).toContain('<svg');
    });

    it('should throw for SVG not found', async () => {
      await expect(client.getModelSvg('rev-nonexistent')).rejects.toThrow(SignavioError);
    });
  });

  // ── listModels ──────────────────────────────────────────────────────

  describe('listModels', () => {
    it('should return array of models', async () => {
      const models = await client.listModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return all 5 mock models when no folder specified', async () => {
      const models = await client.listModels();
      expect(models.length).toBe(5);
    });

    it('should filter by folderId and handle empty folder', async () => {
      const models = await client.listModels('folder-nonexistent');
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBe(0);
    });
  });

  // ── searchModels ────────────────────────────────────────────────────

  describe('searchModels', () => {
    it('should find matching models by name', async () => {
      const results = await client.searchModels('Order');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Order');
    });

    it('should return empty array for no match', async () => {
      const results = await client.searchModels('zzz-no-match-zzz');
      expect(results).toEqual([]);
    });

    it('should require query parameter', async () => {
      await expect(client.searchModels()).rejects.toThrow(SignavioError);
      await expect(client.searchModels('')).rejects.toThrow(SignavioError);
    });
  });

  // ── getDictionary ───────────────────────────────────────────────────

  describe('getDictionary', () => {
    it('should return glossary entries', async () => {
      const entries = await client.getDictionary();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(5);
      expect(entries[0].name).toBeDefined();
      expect(entries[0].description).toBeDefined();
    });

    it('should return single entry by ID', async () => {
      const entry = await client.getDictionaryEntry('glossary-001');
      expect(entry).toBeDefined();
      expect(entry.name).toBe('Company Code');
      expect(entry.sapReference).toBe('BUKRS');
    });
  });

  // ── getModelBpmn ────────────────────────────────────────────────────

  describe('getModelBpmn', () => {
    it('should return BPMN XML string', async () => {
      const bpmn = await client.getModelBpmn('rev-o2c-001');
      expect(typeof bpmn).toBe('string');
      expect(bpmn.length).toBeGreaterThan(0);
    });

    it('should contain valid BPMN XML structure', async () => {
      const bpmn = await client.getModelBpmn('rev-o2c-001');
      expect(bpmn).toContain('<?xml');
      expect(bpmn).toContain('bpmn:definitions');
      expect(bpmn).toContain('bpmn:process');
    });
  });

  // ── createModel ─────────────────────────────────────────────────────

  describe('createModel', () => {
    it('should return created model with id and revisionId', async () => {
      const model = await client.createModel('folder-main-001', 'New Test Process');
      expect(model).toBeDefined();
      expect(model.id).toBeDefined();
      expect(model.revisionId).toBeDefined();
      expect(model.name).toBe('New Test Process');
      expect(model.folderId).toBe('folder-main-001');
    });

    it('should validate required parameters', async () => {
      await expect(client.createModel()).rejects.toThrow(SignavioError);
      await expect(client.createModel('folder-1')).rejects.toThrow(SignavioError);
      await expect(client.createModel('folder-1', '')).rejects.toThrow(SignavioError);
    });
  });

  // ── updateModel ─────────────────────────────────────────────────────

  describe('updateModel', () => {
    it('should return updated model', async () => {
      const result = await client.updateModel('model-o2c-001', '<bpmn>updated</bpmn>');
      expect(result).toBeDefined();
      expect(result.id).toBe('model-o2c-001');
      expect(result.updated).toBe(true);
      expect(result.revisionId).toBeDefined();
    });

    it('should validate required parameters', async () => {
      await expect(client.updateModel()).rejects.toThrow(SignavioError);
      await expect(client.updateModel('model-1')).rejects.toThrow(SignavioError);
      await expect(client.updateModel('model-1', '')).rejects.toThrow(SignavioError);
    });
  });

  // ── getDictionaryEntry ──────────────────────────────────────────────

  describe('getDictionaryEntry', () => {
    it('should return single glossary entry by ID', async () => {
      const entry = await client.getDictionaryEntry('glossary-003');
      expect(entry.name).toBe('Material Master');
      expect(entry.category).toBe('Master Data');
    });

    it('should throw for unknown entry ID', async () => {
      await expect(client.getDictionaryEntry('glossary-unknown')).rejects.toThrow(SignavioError);
    });

    it('should require entryId parameter', async () => {
      await expect(client.getDictionaryEntry()).rejects.toThrow(SignavioError);
    });
  });

  // ── Error handling ──────────────────────────────────────────────────

  describe('error handling', () => {
    it('should throw SignavioError instances', async () => {
      try {
        await client.getModel('nonexistent-revision');
      } catch (err) {
        expect(err).toBeInstanceOf(SignavioError);
      }
    });

    it('should have correct error code', async () => {
      try {
        await client.getModel('nonexistent-revision');
      } catch (err) {
        expect(err.code).toBe('ERR_SIGNAVIO');
      }
    });

    it('should include error details', async () => {
      try {
        await client.getModel('nonexistent-revision');
      } catch (err) {
        expect(err.details).toBeDefined();
        expect(err.details.revisionId).toBe('nonexistent-revision');
      }
    });
  });

  // ── Mock data consistency ───────────────────────────────────────────

  describe('mock data', () => {
    it('should have 5 mock models', () => {
      expect(SignavioClient.MOCK_MODELS.length).toBe(5);
    });

    it('should have required fields on all mock models', () => {
      for (const model of SignavioClient.MOCK_MODELS) {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.description).toBeDefined();
        expect(model.revisionId).toBeDefined();
        expect(model.folderId).toBeDefined();
        expect(model.lastModified).toBeDefined();
        expect(model.author).toBeDefined();
      }
    });

    it('should have consistent IDs between model and revision', () => {
      for (const model of SignavioClient.MOCK_MODELS) {
        expect(model.id).toMatch(/^model-/);
        expect(model.revisionId).toMatch(/^rev-/);
        expect(model.folderId).toMatch(/^folder-/);
      }
    });
  });
});
