const MigrationObjectRegistry = require('../../../migration/objects/registry');
const { DEPENDENCIES } = require('../../../migration/dependency-graph');

describe('MigrationObjectRegistry — Dependency-Ordered Execution', () => {
  let registry;
  const mockGw = { mode: 'mock' };

  beforeEach(() => {
    registry = new MigrationObjectRegistry();
  });

  // ── Basic runAll shape ──────────────────────────────────────────

  describe('runAll returns correct stats shape', () => {
    it('returns stats.waves > 0', async () => {
      const result = await registry.runAll(mockGw);
      expect(result.stats.waves).toBeGreaterThan(0);
    });

    it('returns stats.executionOrder as array of wave arrays', async () => {
      const result = await registry.runAll(mockGw);
      expect(Array.isArray(result.stats.executionOrder)).toBe(true);
      expect(result.stats.executionOrder.length).toBe(result.stats.waves);
      for (const wave of result.stats.executionOrder) {
        expect(Array.isArray(wave)).toBe(true);
        expect(wave.length).toBeGreaterThan(0);
      }
    });

    it('returns stats.total equal to number of registered objects', async () => {
      const result = await registry.runAll(mockGw);
      expect(result.stats.total).toBe(42);
    });

    it('returns totalDurationMs as a number', async () => {
      const result = await registry.runAll(mockGw);
      expect(typeof result.stats.totalDurationMs).toBe('number');
      expect(result.stats.totalDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('completed + failed equals total', async () => {
      const result = await registry.runAll(mockGw);
      expect(result.stats.completed + result.stats.failed).toBe(result.stats.total);
    });
  });

  // ── All 42 objects produce results ──────────────────────────────

  describe('all 42 objects produce results', () => {
    it('results array has 42 entries', async () => {
      const result = await registry.runAll(mockGw);
      expect(result.results).toHaveLength(42);
    });

    it('every object ID appears exactly once across all waves', async () => {
      const result = await registry.runAll(mockGw);
      const allIds = result.stats.executionOrder.flat();
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(42);
      expect(allIds.length).toBe(42);
    });

    it('every result has an objectId', async () => {
      const result = await registry.runAll(mockGw);
      for (const r of result.results) {
        expect(r.objectId).toBeDefined();
        expect(typeof r.objectId).toBe('string');
      }
    });

    it('every registered object ID appears in results', async () => {
      const result = await registry.runAll(mockGw);
      const resultIds = result.results.map(r => r.objectId);
      const registeredIds = registry.listObjectIds();
      for (const id of registeredIds) {
        expect(resultIds).toContain(id);
      }
    });
  });

  // ── Dependency ordering correctness ─────────────────────────────

  describe('dependency ordering', () => {
    /**
     * Helper: given executionOrder (array of wave arrays), return the wave index
     * in which the given objectId appears.
     */
    function waveIndexOf(executionOrder, objectId) {
      for (let i = 0; i < executionOrder.length; i++) {
        if (executionOrder[i].includes(objectId)) return i;
      }
      return -1;
    }

    it('GL_ACCOUNT_MASTER runs before GL_BALANCE (earlier wave)', async () => {
      const result = await registry.runAll(mockGw);
      const waves = result.stats.executionOrder;
      const masterWave = waveIndexOf(waves, 'GL_ACCOUNT_MASTER');
      const balanceWave = waveIndexOf(waves, 'GL_BALANCE');
      expect(masterWave).toBeGreaterThanOrEqual(0);
      expect(balanceWave).toBeGreaterThanOrEqual(0);
      expect(masterWave).toBeLessThan(balanceWave);
    });

    it('BUSINESS_PARTNER runs before CUSTOMER_OPEN_ITEM', async () => {
      const result = await registry.runAll(mockGw);
      const waves = result.stats.executionOrder;
      const bpWave = waveIndexOf(waves, 'BUSINESS_PARTNER');
      const coiWave = waveIndexOf(waves, 'CUSTOMER_OPEN_ITEM');
      expect(bpWave).toBeLessThan(coiWave);
    });

    it('BUSINESS_PARTNER runs before VENDOR_OPEN_ITEM', async () => {
      const result = await registry.runAll(mockGw);
      const waves = result.stats.executionOrder;
      const bpWave = waveIndexOf(waves, 'BUSINESS_PARTNER');
      const voiWave = waveIndexOf(waves, 'VENDOR_OPEN_ITEM');
      expect(bpWave).toBeLessThan(voiWave);
    });

    it('COST_CENTER runs before FIXED_ASSET (via chain: PROFIT_CENTER → COST_CENTER → FIXED_ASSET)', async () => {
      const result = await registry.runAll(mockGw);
      const waves = result.stats.executionOrder;
      const pcWave = waveIndexOf(waves, 'PROFIT_CENTER');
      const ccWave = waveIndexOf(waves, 'COST_CENTER');
      const faWave = waveIndexOf(waves, 'FIXED_ASSET');
      expect(pcWave).toBeLessThan(ccWave);
      expect(ccWave).toBeLessThan(faWave);
    });

    it('BANK_MASTER runs before BUSINESS_PARTNER', async () => {
      const result = await registry.runAll(mockGw);
      const waves = result.stats.executionOrder;
      const bankWave = waveIndexOf(waves, 'BANK_MASTER');
      const bpWave = waveIndexOf(waves, 'BUSINESS_PARTNER');
      expect(bankWave).toBeLessThan(bpWave);
    });

    it('MATERIAL_MASTER and BUSINESS_PARTNER run before PURCHASE_ORDER', async () => {
      const result = await registry.runAll(mockGw);
      const waves = result.stats.executionOrder;
      const matWave = waveIndexOf(waves, 'MATERIAL_MASTER');
      const bpWave = waveIndexOf(waves, 'BUSINESS_PARTNER');
      const poWave = waveIndexOf(waves, 'PURCHASE_ORDER');
      expect(matWave).toBeLessThan(poWave);
      expect(bpWave).toBeLessThan(poWave);
    });

    it('MATERIAL_MASTER and WORK_CENTER run before BOM_ROUTING', async () => {
      const result = await registry.runAll(mockGw);
      const waves = result.stats.executionOrder;
      const matWave = waveIndexOf(waves, 'MATERIAL_MASTER');
      const wcWave = waveIndexOf(waves, 'WORK_CENTER');
      const bomWave = waveIndexOf(waves, 'BOM_ROUTING');
      expect(matWave).toBeLessThan(bomWave);
      expect(wcWave).toBeLessThan(bomWave);
    });

    it('FUNCTIONAL_LOCATION runs before EQUIPMENT_MASTER', async () => {
      const result = await registry.runAll(mockGw);
      const waves = result.stats.executionOrder;
      const flWave = waveIndexOf(waves, 'FUNCTIONAL_LOCATION');
      const eqWave = waveIndexOf(waves, 'EQUIPMENT_MASTER');
      expect(flWave).toBeLessThan(eqWave);
    });

    it('FIXED_ASSET runs before ASSET_ACQUISITION', async () => {
      const result = await registry.runAll(mockGw);
      const waves = result.stats.executionOrder;
      const faWave = waveIndexOf(waves, 'FIXED_ASSET');
      const aaWave = waveIndexOf(waves, 'ASSET_ACQUISITION');
      expect(faWave).toBeLessThan(aaWave);
    });

    it('PROFIT_CENTER runs before PROFIT_SEGMENT', async () => {
      const result = await registry.runAll(mockGw);
      const waves = result.stats.executionOrder;
      const pcWave = waveIndexOf(waves, 'PROFIT_CENTER');
      const psWave = waveIndexOf(waves, 'PROFIT_SEGMENT');
      expect(pcWave).toBeLessThan(psWave);
    });

    it('objects with no dependencies appear in wave 0', async () => {
      const result = await registry.runAll(mockGw);
      const wave0 = result.stats.executionOrder[0];
      // These have no dependencies and must be in the first wave
      const noDeps = Object.entries(DEPENDENCIES)
        .filter(([, deps]) => deps.length === 0)
        .map(([id]) => id)
        .filter(id => registry.listObjectIds().includes(id));
      for (const id of noDeps) {
        expect(wave0).toContain(id);
      }
    });

    it('within any wave, no object depends on another object in the same wave', async () => {
      const result = await registry.runAll(mockGw);
      const allIds = new Set(registry.listObjectIds());
      for (const wave of result.stats.executionOrder) {
        const waveSet = new Set(wave);
        for (const id of wave) {
          const deps = (DEPENDENCIES[id] || []).filter(d => allIds.has(d));
          for (const dep of deps) {
            expect(waveSet.has(dep)).toBe(false);
          }
        }
      }
    });
  });

  // ── options.objectIds (subset execution) ────────────────────────

  describe('options.objectIds — subset execution', () => {
    it('runs only the specified objects', async () => {
      const subset = ['GL_ACCOUNT_MASTER', 'COST_CENTER', 'PROFIT_CENTER'];
      const result = await registry.runAll(mockGw, { objectIds: subset });
      expect(result.results).toHaveLength(3);
      expect(result.stats.total).toBe(3);
      const ids = result.results.map(r => r.objectId);
      for (const id of subset) {
        expect(ids).toContain(id);
      }
    });

    it('respects dependency ordering within subset', async () => {
      const subset = ['GL_BALANCE', 'GL_ACCOUNT_MASTER'];
      const result = await registry.runAll(mockGw, { objectIds: subset });
      const waves = result.stats.executionOrder;
      // GL_ACCOUNT_MASTER should be in an earlier wave than GL_BALANCE
      let masterWave = -1;
      let balanceWave = -1;
      for (let i = 0; i < waves.length; i++) {
        if (waves[i].includes('GL_ACCOUNT_MASTER')) masterWave = i;
        if (waves[i].includes('GL_BALANCE')) balanceWave = i;
      }
      expect(masterWave).toBeLessThan(balanceWave);
    });

    it('single object produces one wave', async () => {
      const result = await registry.runAll(mockGw, { objectIds: ['MATERIAL_MASTER'] });
      expect(result.stats.waves).toBe(1);
      expect(result.stats.executionOrder).toHaveLength(1);
      expect(result.stats.executionOrder[0]).toEqual(['MATERIAL_MASTER']);
      expect(result.results).toHaveLength(1);
    });

    it('independent objects can share a wave', async () => {
      // MATERIAL_MASTER, GL_ACCOUNT_MASTER, PROFIT_CENTER have no deps on each other
      const subset = ['MATERIAL_MASTER', 'GL_ACCOUNT_MASTER', 'PROFIT_CENTER'];
      const result = await registry.runAll(mockGw, { objectIds: subset });
      // All independent — should be one wave
      expect(result.stats.waves).toBe(1);
      expect(result.stats.executionOrder[0].sort()).toEqual(subset.sort());
    });

    it('chain of dependencies produces multiple waves', async () => {
      // PROFIT_CENTER → COST_CENTER → FIXED_ASSET → ASSET_ACQUISITION
      const subset = ['ASSET_ACQUISITION', 'FIXED_ASSET', 'COST_CENTER', 'PROFIT_CENTER'];
      const result = await registry.runAll(mockGw, { objectIds: subset });
      expect(result.stats.waves).toBe(4);
    });
  });

  // ── options.onProgress callback ─────────────────────────────────

  describe('options.onProgress callback', () => {
    it('is called once per object', async () => {
      const calls = [];
      const onProgress = (objectId, result) => calls.push({ objectId, result });
      await registry.runAll(mockGw, { onProgress });
      expect(calls).toHaveLength(42);
    });

    it('receives objectId and result for each call', async () => {
      const calls = [];
      const onProgress = (objectId, result) => calls.push({ objectId, result });
      await registry.runAll(mockGw, { onProgress });
      for (const call of calls) {
        expect(typeof call.objectId).toBe('string');
        expect(call.result).toBeDefined();
        expect(call.result.objectId).toBe(call.objectId);
      }
    });

    it('is called for subset too', async () => {
      const calls = [];
      const onProgress = (objectId) => calls.push(objectId);
      await registry.runAll(mockGw, {
        objectIds: ['GL_BALANCE', 'GL_ACCOUNT_MASTER'],
        onProgress,
      });
      expect(calls).toHaveLength(2);
      expect(calls).toContain('GL_BALANCE');
      expect(calls).toContain('GL_ACCOUNT_MASTER');
    });

    it('callback errors do not break execution', async () => {
      const onProgress = () => { throw new Error('callback boom'); };
      const result = await registry.runAll(mockGw, { onProgress });
      // Should still complete all objects
      expect(result.stats.total).toBe(42);
      expect(result.stats.completed + result.stats.failed).toBe(42);
    });

    it('calls arrive in dependency order', async () => {
      const order = [];
      const onProgress = (objectId) => order.push(objectId);
      await registry.runAll(mockGw, {
        objectIds: ['GL_BALANCE', 'GL_ACCOUNT_MASTER'],
        onProgress,
      });
      const masterIdx = order.indexOf('GL_ACCOUNT_MASTER');
      const balanceIdx = order.indexOf('GL_BALANCE');
      expect(masterIdx).toBeLessThan(balanceIdx);
    });
  });

  // ── options.parallel=false (sequential within waves) ────────────

  describe('options.parallel=false — sequential execution', () => {
    it('still returns correct results for all objects', async () => {
      const result = await registry.runAll(mockGw, { parallel: false });
      expect(result.results).toHaveLength(42);
      expect(result.stats.total).toBe(42);
      expect(result.stats.completed + result.stats.failed).toBe(42);
    });

    it('preserves dependency ordering', async () => {
      const result = await registry.runAll(mockGw, { parallel: false });
      const waves = result.stats.executionOrder;
      // Same wave structure as parallel
      expect(waves.length).toBeGreaterThan(0);

      // Check a known dependency
      let masterWave = -1;
      let balanceWave = -1;
      for (let i = 0; i < waves.length; i++) {
        if (waves[i].includes('GL_ACCOUNT_MASTER')) masterWave = i;
        if (waves[i].includes('GL_BALANCE')) balanceWave = i;
      }
      expect(masterWave).toBeLessThan(balanceWave);
    });

    it('same number of waves as parallel mode', async () => {
      const [parallelResult, seqResult] = await Promise.all([
        registry.runAll(mockGw, { parallel: true }),
        new MigrationObjectRegistry().runAll(mockGw, { parallel: false }),
      ]);
      expect(seqResult.stats.waves).toBe(parallelResult.stats.waves);
    });

    it('works with subset', async () => {
      const subset = ['COST_CENTER', 'PROFIT_CENTER', 'FIXED_ASSET'];
      const result = await registry.runAll(mockGw, {
        objectIds: subset,
        parallel: false,
      });
      expect(result.results).toHaveLength(3);
      expect(result.stats.total).toBe(3);
    });
  });

  // ── Combined options ────────────────────────────────────────────

  describe('combined options', () => {
    it('objectIds + parallel=false + onProgress all work together', async () => {
      const calls = [];
      const result = await registry.runAll(mockGw, {
        objectIds: ['BUSINESS_PARTNER', 'CUSTOMER_OPEN_ITEM', 'BANK_MASTER'],
        parallel: false,
        onProgress: (id) => calls.push(id),
      });
      expect(result.results).toHaveLength(3);
      expect(calls).toHaveLength(3);
      // BANK_MASTER → BUSINESS_PARTNER → CUSTOMER_OPEN_ITEM
      expect(calls.indexOf('BANK_MASTER')).toBeLessThan(calls.indexOf('BUSINESS_PARTNER'));
      expect(calls.indexOf('BUSINESS_PARTNER')).toBeLessThan(calls.indexOf('CUSTOMER_OPEN_ITEM'));
    });
  });

  // ── Wave structure properties ───────────────────────────────────

  describe('wave structure properties', () => {
    it('every wave is non-empty', async () => {
      const result = await registry.runAll(mockGw);
      for (const wave of result.stats.executionOrder) {
        expect(wave.length).toBeGreaterThan(0);
      }
    });

    it('the union of all waves equals all registered IDs', async () => {
      const result = await registry.runAll(mockGw);
      const allWaveIds = result.stats.executionOrder.flat().sort();
      const registeredIds = registry.listObjectIds().sort();
      expect(allWaveIds).toEqual(registeredIds);
    });

    it('first wave contains only objects with no internal dependencies', async () => {
      const result = await registry.runAll(mockGw);
      const allIds = new Set(registry.listObjectIds());
      const wave0 = result.stats.executionOrder[0];
      for (const id of wave0) {
        const deps = (DEPENDENCIES[id] || []).filter(d => allIds.has(d));
        expect(deps.length).toBe(0);
      }
    });

    it('multiple waves exist because real dependency chains exist', async () => {
      const result = await registry.runAll(mockGw);
      // GL_ACCOUNT_MASTER → GL_BALANCE is at minimum 2 waves
      expect(result.stats.waves).toBeGreaterThanOrEqual(2);
    });
  });
});
