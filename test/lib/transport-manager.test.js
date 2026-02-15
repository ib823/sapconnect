/**
 * Tests for TransportManager — change management integration.
 */

const { TransportManager, TRANSPORT_STATUS, TRANSPORT_TYPES } = require('../../lib/transport-manager');

describe('TransportManager', () => {
  let mgr;

  beforeEach(() => {
    mgr = new TransportManager({ mode: 'mock' });
  });

  describe('constants', () => {
    it('should export transport statuses', () => {
      expect(TRANSPORT_STATUS.MODIFIABLE).toBe('D');
      expect(TRANSPORT_STATUS.RELEASED).toBe('R');
      expect(TRANSPORT_STATUS.IMPORTED).toBe('I');
    });

    it('should export transport types', () => {
      expect(TRANSPORT_TYPES.WORKBENCH).toBe('K');
      expect(TRANSPORT_TYPES.CUSTOMIZING).toBe('W');
    });
  });

  describe('createTransport', () => {
    it('should create a workbench transport', async () => {
      const tr = await mgr.createTransport({ description: 'S/4 Migration Wave 1' });
      expect(tr.number).toBeDefined();
      expect(tr.number).toMatch(/^SC/);
      expect(tr.description).toBe('S/4 Migration Wave 1');
      expect(tr.type).toBe(TRANSPORT_TYPES.WORKBENCH);
      expect(tr.status).toBe(TRANSPORT_STATUS.MODIFIABLE);
      expect(tr.objects).toEqual([]);
      expect(tr.createdAt).toBeDefined();
    });

    it('should create a customizing transport', async () => {
      const tr = await mgr.createTransport({ description: 'Config changes', type: 'customizing' });
      expect(tr.type).toBe(TRANSPORT_TYPES.CUSTOMIZING);
    });

    it('should assign unique numbers', async () => {
      const tr1 = await mgr.createTransport({ description: 'First' });
      const tr2 = await mgr.createTransport({ description: 'Second' });
      expect(tr1.number).not.toBe(tr2.number);
    });
  });

  describe('addObject', () => {
    it('should add an object to a transport', async () => {
      const tr = await mgr.createTransport({ description: 'Test' });
      const obj = await mgr.addObject(tr.number, {
        pgmid: 'R3TR',
        object: 'CLAS',
        name: 'ZCL_MYCLASS',
      });

      expect(obj.pgmid).toBe('R3TR');
      expect(obj.object).toBe('CLAS');
      expect(obj.name).toBe('ZCL_MYCLASS');

      const updated = await mgr.getTransport(tr.number);
      expect(updated.objects).toHaveLength(1);
    });

    it('should add multiple objects', async () => {
      const tr = await mgr.createTransport({ description: 'Multi' });
      await mgr.addObject(tr.number, { object: 'CLAS', name: 'ZCL_A' });
      await mgr.addObject(tr.number, { object: 'PROG', name: 'Z_REPORT' });
      await mgr.addObject(tr.number, { object: 'TABL', name: 'ZTABLE' });

      const updated = await mgr.getTransport(tr.number);
      expect(updated.objects).toHaveLength(3);
    });

    it('should throw for non-existent transport', async () => {
      await expect(mgr.addObject('INVALID', { object: 'CLAS', name: 'X' }))
        .rejects.toThrow('not found');
    });

    it('should throw for released transport', async () => {
      const tr = await mgr.createTransport({ description: 'Released' });
      await mgr.release(tr.number);
      await expect(mgr.addObject(tr.number, { object: 'CLAS', name: 'X' }))
        .rejects.toThrow('not modifiable');
    });
  });

  describe('release', () => {
    it('should release a transport', async () => {
      const tr = await mgr.createTransport({ description: 'To release' });
      const released = await mgr.release(tr.number);
      expect(released.status).toBe(TRANSPORT_STATUS.RELEASED);
      expect(released.releasedAt).toBeDefined();
    });

    it('should throw for already released transport', async () => {
      const tr = await mgr.createTransport({ description: 'Already released' });
      await mgr.release(tr.number);
      await expect(mgr.release(tr.number)).rejects.toThrow('cannot be released');
    });
  });

  describe('getTransport', () => {
    it('should return null for non-existent transport', async () => {
      const tr = await mgr.getTransport('NONEXISTENT');
      expect(tr).toBeNull();
    });
  });

  describe('listTransports', () => {
    it('should list all transports', async () => {
      await mgr.createTransport({ description: 'A' });
      await mgr.createTransport({ description: 'B' });

      const list = await mgr.listTransports();
      expect(list).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const tr = await mgr.createTransport({ description: 'Released' });
      await mgr.createTransport({ description: 'Open' });
      await mgr.release(tr.number);

      const released = await mgr.listTransports({ status: TRANSPORT_STATUS.RELEASED });
      expect(released).toHaveLength(1);
    });

    it('should filter by owner', async () => {
      await mgr.createTransport({ description: 'A', owner: 'USER1' });
      await mgr.createTransport({ description: 'B', owner: 'USER2' });

      const user1 = await mgr.listTransports({ owner: 'USER1' });
      expect(user1).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      const tr1 = await mgr.createTransport({ description: 'A' });
      const tr2 = await mgr.createTransport({ description: 'B' });
      await mgr.addObject(tr1.number, { object: 'CLAS', name: 'ZCL_A' });
      await mgr.addObject(tr1.number, { object: 'CLAS', name: 'ZCL_B' });
      await mgr.release(tr2.number);

      const stats = await mgr.getStats();
      expect(stats.total).toBe(2);
      expect(stats.modifiable).toBe(1);
      expect(stats.released).toBe(1);
      expect(stats.totalObjects).toBe(2);
    });
  });

  describe('full lifecycle', () => {
    it('should support create → add objects → release flow', async () => {
      // 1. Create transport
      const tr = await mgr.createTransport({
        description: 'S/4HANA Migration — Wave 1 Custom Code',
        type: 'workbench',
        owner: 'SAPCONNECT',
      });
      expect(tr.status).toBe(TRANSPORT_STATUS.MODIFIABLE);

      // 2. Add objects
      await mgr.addObject(tr.number, { pgmid: 'R3TR', object: 'CLAS', name: 'ZCL_MIGRATION_HELPER' });
      await mgr.addObject(tr.number, { pgmid: 'R3TR', object: 'PROG', name: 'Z_MIGRATION_REPORT' });
      await mgr.addObject(tr.number, { pgmid: 'R3TR', object: 'TABL', name: 'ZMIGRATION_LOG' });

      const loaded = await mgr.getTransport(tr.number);
      expect(loaded.objects).toHaveLength(3);

      // 3. Release
      const released = await mgr.release(tr.number);
      expect(released.status).toBe(TRANSPORT_STATUS.RELEASED);
      expect(released.releasedAt).toBeDefined();

      // 4. Verify stats
      const stats = await mgr.getStats();
      expect(stats.released).toBe(1);
      expect(stats.totalObjects).toBe(3);
    });
  });
});
