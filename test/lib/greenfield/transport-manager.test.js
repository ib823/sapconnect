/**
 * Tests for Transport Pipeline Manager
 */

const { TransportManager, TRANSPORT_STATUS, STATUS_LABELS } = require('../../../lib/greenfield/transport-manager');

describe('TransportManager', () => {
  let tm;

  beforeEach(() => {
    tm = new TransportManager(null, { mode: 'mock' });
  });

  describe('createRequest', () => {
    it('should return transport number in DEVK format', async () => {
      const result = await tm.createRequest('Test request', 'K', 'TESTUSER');
      expect(result.requestNumber).toMatch(/^DEVK\d+$/);
    });

    it('should return at least one task', async () => {
      const result = await tm.createRequest('Test request', 'K', 'TESTUSER');
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].taskNumber).toMatch(/^DEVK\d+$/);
      expect(result.tasks[0].owner).toBe('TESTUSER');
    });

    it('should return description and type', async () => {
      const result = await tm.createRequest('My transport', 'W', 'DEVELOPER');
      expect(result.description).toBe('My transport');
      expect(result.type).toBe('W');
    });

    it('should return Modifiable status for new request', async () => {
      const result = await tm.createRequest('Test', 'K', 'USER');
      expect(result.status).toBe('Modifiable');
    });

    it('should throw on missing description', async () => {
      await expect(tm.createRequest('', 'K', 'USER')).rejects.toThrow('Description');
    });

    it('should throw on invalid type', async () => {
      await expect(tm.createRequest('Test', 'X', 'USER')).rejects.toThrow('Type');
    });

    it('should throw on missing owner', async () => {
      await expect(tm.createRequest('Test', 'K', '')).rejects.toThrow('Owner');
    });

    it('should generate unique request numbers', async () => {
      const r1 = await tm.createRequest('Req 1', 'K', 'USER');
      const r2 = await tm.createRequest('Req 2', 'W', 'USER');
      expect(r1.requestNumber).not.toBe(r2.requestNumber);
    });
  });

  describe('addObjectToTransport', () => {
    it('should add an E071 entry to the transport', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      const result = await tm.addObjectToTransport(req.requestNumber, 'TABU', 'T001', 'R3TR');

      expect(result.success).toBe(true);
      expect(result.entry.TRKORR).toBe(req.requestNumber);
      expect(result.entry.OBJECT).toBe('TABU');
      expect(result.entry.OBJ_NAME).toBe('T001');
      expect(result.entry.PGMID).toBe('R3TR');
    });

    it('should default programId to R3TR', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      const result = await tm.addObjectToTransport(req.requestNumber, 'PROG', 'ZPROG01');
      expect(result.entry.PGMID).toBe('R3TR');
    });

    it('should throw on non-existent request', async () => {
      await expect(tm.addObjectToTransport('DEVK000000', 'TABU', 'T001'))
        .rejects.toThrow('not found');
    });

    it('should throw on released request', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      await tm.releaseRequest(req.requestNumber);
      await expect(tm.addObjectToTransport(req.requestNumber, 'TABU', 'T001'))
        .rejects.toThrow('already released');
    });

    it('should throw on missing request number', async () => {
      await expect(tm.addObjectToTransport('', 'TABU', 'T001'))
        .rejects.toThrow('Request number');
    });

    it('should throw on missing object type', async () => {
      await expect(tm.addObjectToTransport('DEVK900001', '', 'T001'))
        .rejects.toThrow('Object type');
    });

    it('should persist objects for getRequestStatus', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      await tm.addObjectToTransport(req.requestNumber, 'TABU', 'T001');
      await tm.addObjectToTransport(req.requestNumber, 'PROG', 'ZPROG');

      const status = await tm.getRequestStatus(req.requestNumber);
      expect(status.objects).toHaveLength(2);
    });
  });

  describe('addKeysToTransport', () => {
    it('should add E071K entries', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      const result = await tm.addKeysToTransport(req.requestNumber, 'T001', [
        { field: 'BUKRS', value: '1000' },
        { field: 'BUKRS', value: '2000' },
      ]);

      expect(result.success).toBe(true);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].OBJ_NAME).toBe('T001');
    });

    it('should throw on empty keys array', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      await expect(tm.addKeysToTransport(req.requestNumber, 'T001', []))
        .rejects.toThrow('non-empty array');
    });

    it('should throw on released request', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      await tm.releaseRequest(req.requestNumber);
      await expect(tm.addKeysToTransport(req.requestNumber, 'T001', [{ field: 'X', value: 'Y' }]))
        .rejects.toThrow('already released');
    });
  });

  describe('releaseRequest', () => {
    it('should change status to Released', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      const result = await tm.releaseRequest(req.requestNumber);

      expect(result.success).toBe(true);
      expect(result.status).toBe('Released');
    });

    it('should update status in getRequestStatus', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      await tm.releaseRequest(req.requestNumber);

      const status = await tm.getRequestStatus(req.requestNumber);
      expect(status.status).toBe('Released');
      expect(status.statusCode).toBe(TRANSPORT_STATUS.RELEASED);
    });

    it('should throw on already released request', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      await tm.releaseRequest(req.requestNumber);
      await expect(tm.releaseRequest(req.requestNumber)).rejects.toThrow('already released');
    });

    it('should throw on non-existent request', async () => {
      await expect(tm.releaseRequest('DEVK000000')).rejects.toThrow('not found');
    });
  });

  describe('getRequestStatus', () => {
    it('should return full request details', async () => {
      const req = await tm.createRequest('My request', 'W', 'DEVELOPER');
      const status = await tm.getRequestStatus(req.requestNumber);

      expect(status.requestNumber).toBe(req.requestNumber);
      expect(status.description).toBe('My request');
      expect(status.owner).toBe('DEVELOPER');
      expect(status.type).toBe('W');
      expect(status.status).toBe('Modifiable');
    });

    it('should include objects and keys', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      await tm.addObjectToTransport(req.requestNumber, 'TABU', 'T001');
      await tm.addKeysToTransport(req.requestNumber, 'T001', [{ field: 'BUKRS', value: '1000' }]);

      const status = await tm.getRequestStatus(req.requestNumber);
      expect(status.objects).toHaveLength(1);
      expect(status.keys).toHaveLength(1);
    });

    it('should throw on non-existent request', async () => {
      await expect(tm.getRequestStatus('DEVK000000')).rejects.toThrow('not found');
    });
  });

  describe('listRequests', () => {
    it('should return all requests when no filters', async () => {
      await tm.createRequest('Req 1', 'K', 'USER1');
      await tm.createRequest('Req 2', 'W', 'USER2');

      const list = await tm.listRequests();
      expect(list).toHaveLength(2);
    });

    it('should filter by user', async () => {
      await tm.createRequest('Req 1', 'K', 'USER1');
      await tm.createRequest('Req 2', 'W', 'USER2');
      await tm.createRequest('Req 3', 'K', 'USER1');

      const list = await tm.listRequests('USER1');
      expect(list).toHaveLength(2);
      expect(list.every(r => r.owner === 'USER1')).toBe(true);
    });

    it('should filter by status', async () => {
      const req1 = await tm.createRequest('Req 1', 'K', 'USER');
      await tm.createRequest('Req 2', 'W', 'USER');
      await tm.releaseRequest(req1.requestNumber);

      const released = await tm.listRequests(undefined, TRANSPORT_STATUS.RELEASED);
      expect(released).toHaveLength(1);
      expect(released[0].statusCode).toBe(TRANSPORT_STATUS.RELEASED);
    });

    it('should filter by both user and status', async () => {
      const req1 = await tm.createRequest('Req 1', 'K', 'USER1');
      await tm.createRequest('Req 2', 'W', 'USER2');
      await tm.createRequest('Req 3', 'K', 'USER1');
      await tm.releaseRequest(req1.requestNumber);

      const list = await tm.listRequests('USER1', TRANSPORT_STATUS.RELEASED);
      expect(list).toHaveLength(1);
      expect(list[0].owner).toBe('USER1');
    });

    it('should return empty array when no matches', async () => {
      await tm.createRequest('Req 1', 'K', 'USER1');
      const list = await tm.listRequests('NONEXISTENT');
      expect(list).toHaveLength(0);
    });
  });

  describe('createPipeline', () => {
    it('should create a pipeline with name and systems', () => {
      const pipeline = tm.createPipeline('standard', ['DEV', 'QAS', 'PRD']);
      expect(pipeline.name).toBe('standard');
      expect(pipeline.systems).toEqual(['DEV', 'QAS', 'PRD']);
      expect(pipeline.createdAt).toBeDefined();
    });

    it('should throw on missing name', () => {
      expect(() => tm.createPipeline('', ['DEV', 'QAS'])).toThrow('name');
    });

    it('should throw on fewer than 2 systems', () => {
      expect(() => tm.createPipeline('test', ['DEV'])).toThrow('at least 2 systems');
    });

    it('should throw on non-array systems', () => {
      expect(() => tm.createPipeline('test', 'DEV')).toThrow('at least 2 systems');
    });
  });

  describe('promoteTo', () => {
    it('should promote a released transport to target system', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      await tm.releaseRequest(req.requestNumber);
      tm.createPipeline('standard', ['DEV', 'QAS', 'PRD']);

      const result = await tm.promoteTo(req.requestNumber, 'QAS');
      expect(result.success).toBe(true);
      expect(result.targetSystem).toBe('QAS');
      expect(result.status).toBe('imported');
    });

    it('should throw when promoting unreleased transport', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      await expect(tm.promoteTo(req.requestNumber, 'QAS')).rejects.toThrow('released');
    });

    it('should track promotions in pipeline status', async () => {
      const req = await tm.createRequest('Test', 'K', 'USER');
      await tm.releaseRequest(req.requestNumber);
      tm.createPipeline('standard', ['DEV', 'QAS', 'PRD']);

      await tm.promoteTo(req.requestNumber, 'QAS');
      const status = tm.getPipelineStatus('standard');
      expect(status.promotions).toHaveLength(1);
      expect(status.promotions[0].targetSystem).toBe('QAS');
    });
  });

  describe('getPipelineStatus', () => {
    it('should return pipeline definition and system summaries', () => {
      tm.createPipeline('standard', ['DEV', 'QAS', 'PRD']);
      const status = tm.getPipelineStatus('standard');

      expect(status.pipeline.name).toBe('standard');
      expect(status.pipeline.systems).toEqual(['DEV', 'QAS', 'PRD']);
      expect(status.systems).toHaveLength(3);
      expect(status.systems[0].system).toBe('DEV');
    });

    it('should track transport counts per system', async () => {
      const req1 = await tm.createRequest('Req 1', 'K', 'USER');
      const req2 = await tm.createRequest('Req 2', 'K', 'USER');
      await tm.releaseRequest(req1.requestNumber);
      await tm.releaseRequest(req2.requestNumber);
      tm.createPipeline('standard', ['DEV', 'QAS', 'PRD']);

      await tm.promoteTo(req1.requestNumber, 'QAS');
      await tm.promoteTo(req2.requestNumber, 'QAS');
      await tm.promoteTo(req1.requestNumber, 'PRD');

      const status = tm.getPipelineStatus('standard');
      const qas = status.systems.find(s => s.system === 'QAS');
      const prd = status.systems.find(s => s.system === 'PRD');
      expect(qas.transportCount).toBe(2);
      expect(prd.transportCount).toBe(1);
    });

    it('should throw on non-existent pipeline', () => {
      expect(() => tm.getPipelineStatus('nonexistent')).toThrow('not found');
    });
  });

  describe('TRANSPORT_STATUS constants', () => {
    it('should define standard transport statuses', () => {
      expect(TRANSPORT_STATUS.MODIFIABLE).toBe('D');
      expect(TRANSPORT_STATUS.RELEASED).toBe('R');
      expect(TRANSPORT_STATUS.IMPORTED).toBe('I');
    });

    it('should have labels for all status codes', () => {
      for (const code of Object.values(TRANSPORT_STATUS)) {
        expect(STATUS_LABELS[code]).toBeDefined();
      }
    });
  });

  describe('mock state persistence', () => {
    it('should persist state across multiple operations', async () => {
      const req = await tm.createRequest('Full lifecycle', 'K', 'DEV_USER');
      await tm.addObjectToTransport(req.requestNumber, 'TABU', 'T001');
      await tm.addObjectToTransport(req.requestNumber, 'TABU', 'T001W');
      await tm.addKeysToTransport(req.requestNumber, 'T001', [{ field: 'BUKRS', value: '1000' }]);

      const preRelease = await tm.getRequestStatus(req.requestNumber);
      expect(preRelease.objects).toHaveLength(2);
      expect(preRelease.keys).toHaveLength(1);
      expect(preRelease.status).toBe('Modifiable');

      await tm.releaseRequest(req.requestNumber);
      const postRelease = await tm.getRequestStatus(req.requestNumber);
      expect(postRelease.status).toBe('Released');
      expect(postRelease.objects).toHaveLength(2);
    });
  });
});
