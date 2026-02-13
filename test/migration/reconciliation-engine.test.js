const ReconciliationEngine = require('../../migration/reconciliation-engine');

describe('ReconciliationEngine', () => {
  let engine;

  beforeEach(() => { engine = new ReconciliationEngine(); });

  // ── Constructor ────────────────────────────────────────────

  it('creates with default tolerances', () => {
    expect(engine.tolerances.amount).toBe(0.01);
    expect(engine.tolerances.count).toBe(0);
    expect(engine.tolerances.percentage).toBe(0.001);
  });

  it('accepts custom tolerances', () => {
    const e = new ReconciliationEngine({ amountTolerance: 0.05, countTolerance: 2 });
    expect(e.tolerances.amount).toBe(0.05);
    expect(e.tolerances.count).toBe(2);
  });

  it('merges override tolerances', () => {
    const e = new ReconciliationEngine({ tolerances: { custom: 10 } });
    expect(e.tolerances.custom).toBe(10);
    expect(e.tolerances.amount).toBe(0.01);
  });

  // ── reconcile ──────────────────────────────────────────────

  describe('reconcile', () => {
    const source = [
      { ID: '1', NAME: 'Alpha', AMOUNT: '100.00' },
      { ID: '2', NAME: 'Beta', AMOUNT: '200.00' },
      { ID: '3', NAME: 'Gamma', AMOUNT: '300.00' },
    ];
    const target = [
      { ID: '1', NAME: 'Alpha', AMOUNT: '100.00' },
      { ID: '2', NAME: 'Beta', AMOUNT: '200.00' },
      { ID: '3', NAME: 'Gamma', AMOUNT: '300.00' },
    ];

    it('returns report with correct structure', () => {
      const report = engine.reconcile({
        objectId: 'TEST',
        sourceRecords: source,
        targetRecords: target,
        keyFields: ['ID'],
        valueFields: ['NAME', 'AMOUNT'],
        aggregateFields: ['AMOUNT'],
      });
      expect(report.objectId).toBe('TEST');
      expect(report.timestamp).toBeDefined();
      expect(report.checks).toBeInstanceOf(Array);
      expect(report.summary).toHaveProperty('total');
      expect(report.summary).toHaveProperty('passed');
      expect(report.summary).toHaveProperty('failed');
      expect(report.summary).toHaveProperty('status');
    });

    it('PASSES when source and target match', () => {
      const report = engine.reconcile({
        objectId: 'TEST',
        sourceRecords: source,
        targetRecords: target,
        keyFields: ['ID'],
        valueFields: ['NAME', 'AMOUNT'],
        aggregateFields: ['AMOUNT'],
      });
      expect(report.summary.status).toBe('PASSED');
      expect(report.summary.failed).toBe(0);
    });

    it('runs all 6 check types when all fields provided', () => {
      const report = engine.reconcile({
        objectId: 'TEST',
        sourceRecords: source,
        targetRecords: target,
        keyFields: ['ID'],
        valueFields: ['NAME', 'AMOUNT'],
        aggregateFields: ['AMOUNT'],
      });
      const types = report.checks.map(c => c.type);
      expect(types).toContain('count');
      expect(types).toContain('coverage');
      expect(types).toContain('aggregate');
      expect(types).toContain('sample');
      expect(types).toContain('duplicates');
      expect(types).toContain('completeness');
    });

    it('FAILS when counts mismatch', () => {
      const report = engine.reconcile({
        objectId: 'TEST',
        sourceRecords: source,
        targetRecords: source.slice(0, 2),
        keyFields: ['ID'],
        valueFields: [],
      });
      expect(report.summary.status).toBe('FAILED');
      expect(report.summary.failed).toBeGreaterThan(0);
    });

    it('skips key checks when no keyFields', () => {
      const report = engine.reconcile({
        objectId: 'TEST',
        sourceRecords: source,
        targetRecords: target,
        keyFields: [],
        valueFields: [],
      });
      const types = report.checks.map(c => c.type);
      expect(types).not.toContain('coverage');
      expect(types).not.toContain('duplicates');
    });
  });

  // ── _checkRecordCount ──────────────────────────────────────

  describe('_checkRecordCount', () => {
    it('passes when counts match', () => {
      const result = engine._checkRecordCount([1, 2, 3], [1, 2, 3]);
      expect(result.status).toBe('passed');
      expect(result.variance).toBe(0);
    });

    it('fails when counts differ', () => {
      const result = engine._checkRecordCount([1, 2, 3], [1, 2]);
      expect(result.status).toBe('failed');
      expect(result.variance).toBe(-1);
    });

    it('respects count tolerance', () => {
      const tolerant = new ReconciliationEngine({ countTolerance: 1 });
      const result = tolerant._checkRecordCount([1, 2, 3], [1, 2]);
      expect(result.status).toBe('passed');
    });
  });

  // ── _checkKeyCoverage ──────────────────────────────────────

  describe('_checkKeyCoverage', () => {
    it('passes when all source keys exist in target', () => {
      const source = [{ ID: '1' }, { ID: '2' }];
      const target = [{ ID: '1' }, { ID: '2' }, { ID: '3' }];
      const result = engine._checkKeyCoverage(source, target, ['ID']);
      expect(result.status).toBe('passed');
      expect(result.missingKeys).toBe(0);
    });

    it('fails when source keys missing from target', () => {
      const source = [{ ID: '1' }, { ID: '2' }, { ID: '3' }];
      const target = [{ ID: '1' }];
      const result = engine._checkKeyCoverage(source, target, ['ID']);
      expect(result.status).toBe('failed');
      expect(result.missingKeys).toBe(2);
      expect(result.missingExamples).toHaveLength(2);
    });

    it('handles composite keys', () => {
      const source = [{ CO: '1000', YR: '2024' }];
      const target = [{ CO: '1000', YR: '2024' }];
      const result = engine._checkKeyCoverage(source, target, ['CO', 'YR']);
      expect(result.status).toBe('passed');
    });

    it('limits missing examples to 5', () => {
      const source = Array.from({ length: 10 }, (_, i) => ({ ID: String(i) }));
      const target = [];
      const result = engine._checkKeyCoverage(source, target, ['ID']);
      expect(result.missingExamples).toHaveLength(5);
      expect(result.missingKeys).toBe(10);
    });
  });

  // ── _checkAggregateValue ───────────────────────────────────

  describe('_checkAggregateValue', () => {
    it('passes when sums match', () => {
      const source = [{ AMT: '100' }, { AMT: '200' }];
      const target = [{ AMT: '100' }, { AMT: '200' }];
      const result = engine._checkAggregateValue(source, target, 'AMT');
      expect(result.status).toBe('passed');
      expect(result.sourceValue).toBe(300);
      expect(result.targetValue).toBe(300);
    });

    it('fails when sums differ beyond tolerance', () => {
      const source = [{ AMT: '100' }];
      const target = [{ AMT: '200' }];
      const result = engine._checkAggregateValue(source, target, 'AMT');
      expect(result.status).toBe('failed');
      expect(result.variance).toBe(100);
    });

    it('passes within tolerance', () => {
      const source = [{ AMT: '100.00' }];
      const target = [{ AMT: '100.005' }];
      const result = engine._checkAggregateValue(source, target, 'AMT');
      expect(result.status).toBe('passed');
    });

    it('treats non-numeric as 0', () => {
      const source = [{ AMT: 'abc' }, { AMT: '50' }];
      const target = [{ AMT: '50' }];
      const result = engine._checkAggregateValue(source, target, 'AMT');
      expect(result.status).toBe('passed');
    });
  });

  // ── _checkFieldSample ──────────────────────────────────────

  describe('_checkFieldSample', () => {
    it('passes when all sampled fields match', () => {
      const source = [{ ID: '1', NAME: 'A' }, { ID: '2', NAME: 'B' }];
      const target = [{ ID: '1', NAME: 'A' }, { ID: '2', NAME: 'B' }];
      const result = engine._checkFieldSample(source, target, ['ID'], ['NAME']);
      expect(result.status).toBe('passed');
      expect(result.mismatches).toBe(0);
    });

    it('warns on 1-3 mismatches', () => {
      const source = [{ ID: '1', NAME: 'A' }, { ID: '2', NAME: 'B' }];
      const target = [{ ID: '1', NAME: 'X' }, { ID: '2', NAME: 'B' }];
      const result = engine._checkFieldSample(source, target, ['ID'], ['NAME']);
      expect(result.status).toBe('warning');
      expect(result.mismatches).toBe(1);
    });

    it('fails on 4+ mismatches', () => {
      const source = Array.from({ length: 10 }, (_, i) => ({ ID: String(i), NAME: `N${i}`, CODE: `C${i}` }));
      const target = Array.from({ length: 10 }, (_, i) => ({ ID: String(i), NAME: `X${i}`, CODE: `X${i}` }));
      const result = engine._checkFieldSample(source, target, ['ID'], ['NAME', 'CODE']);
      expect(result.status).toBe('failed');
      expect(result.mismatches).toBeGreaterThanOrEqual(4);
    });

    it('limits mismatch details to 5', () => {
      const source = Array.from({ length: 20 }, (_, i) => ({ ID: String(i), NAME: `N${i}` }));
      const target = Array.from({ length: 20 }, (_, i) => ({ ID: String(i), NAME: `X${i}` }));
      const result = engine._checkFieldSample(source, target, ['ID'], ['NAME']);
      expect(result.mismatchDetails.length).toBeLessThanOrEqual(5);
    });

    it('skips records not found in target', () => {
      const source = [{ ID: '1', NAME: 'A' }, { ID: '999', NAME: 'Z' }];
      const target = [{ ID: '1', NAME: 'A' }];
      const result = engine._checkFieldSample(source, target, ['ID'], ['NAME']);
      expect(result.sampledRecords).toBe(1);
      expect(result.status).toBe('passed');
    });
  });

  // ── _checkTargetDuplicates ─────────────────────────────────

  describe('_checkTargetDuplicates', () => {
    it('passes with no duplicates', () => {
      const target = [{ ID: '1' }, { ID: '2' }, { ID: '3' }];
      const result = engine._checkTargetDuplicates(target, ['ID']);
      expect(result.status).toBe('passed');
      expect(result.duplicateCount).toBe(0);
    });

    it('fails with duplicates', () => {
      const target = [{ ID: '1' }, { ID: '2' }, { ID: '1' }];
      const result = engine._checkTargetDuplicates(target, ['ID']);
      expect(result.status).toBe('failed');
      expect(result.duplicateCount).toBe(1);
    });

    it('handles composite key duplicates', () => {
      const target = [
        { CO: '1000', YR: '2024' },
        { CO: '1000', YR: '2025' },
        { CO: '1000', YR: '2024' },
      ];
      const result = engine._checkTargetDuplicates(target, ['CO', 'YR']);
      expect(result.duplicateCount).toBe(1);
    });
  });

  // ── _checkNullFields ───────────────────────────────────────

  describe('_checkNullFields', () => {
    it('passes when all cells have values', () => {
      const target = [{ A: 'x', B: 'y' }, { A: 'z', B: 'w' }];
      const result = engine._checkNullFields(target, ['A', 'B']);
      expect(result.status).toBe('passed');
      expect(result.nullCells).toBe(0);
      expect(result.nullRate).toBe(0);
    });

    it('fails when null rate exceeds 15%', () => {
      const target = [
        { A: '', B: null },
        { A: '', B: '' },
      ];
      const result = engine._checkNullFields(target, ['A', 'B']);
      expect(result.status).toBe('failed');
      expect(result.nullCells).toBe(4);
      expect(result.nullRate).toBe(100);
    });

    it('warns between 5% and 15%', () => {
      // 10 records, 1 field, 1 null = 10%
      const target = Array.from({ length: 10 }, (_, i) => ({ A: i === 0 ? '' : 'val' }));
      const result = engine._checkNullFields(target, ['A']);
      expect(result.status).toBe('warning');
    });

    it('reports field breakdown', () => {
      const target = [
        { A: 'x', B: '' },
        { A: '', B: 'y' },
      ];
      const result = engine._checkNullFields(target, ['A', 'B']);
      expect(result.fieldBreakdown.A).toBe(1);
      expect(result.fieldBreakdown.B).toBe(1);
    });

    it('handles empty target array', () => {
      const result = engine._checkNullFields([], ['A']);
      expect(result.status).toBe('passed');
      expect(result.nullRate).toBe(0);
    });
  });

  // ── reconcileAll ───────────────────────────────────────────

  describe('reconcileAll', () => {
    it('reconciles multiple migration results', () => {
      const migrationResults = [
        {
          objectId: 'OBJ1',
          phases: {
            extract: { records: [{ ID: '1', AMT: '100' }] },
            transform: { records: [{ ID: '1', AMT: '100' }] },
          },
        },
        {
          objectId: 'OBJ2',
          phases: {
            extract: { records: [{ ID: '1' }, { ID: '2' }] },
            transform: { records: [{ ID: '1' }, { ID: '2' }] },
          },
        },
      ];

      const result = engine.reconcileAll(migrationResults);
      expect(result.reports).toHaveLength(2);
      expect(result.summary.objectsReconciled).toBe(2);
      expect(result.summary.overallStatus).toBe('PASSED');
    });

    it('skips results without extract or transform', () => {
      const migrationResults = [
        { objectId: 'X', phases: { extract: { records: [{ ID: '1' }] } } }, // no transform
        { objectId: 'Y' }, // no phases
      ];
      const result = engine.reconcileAll(migrationResults);
      expect(result.reports).toHaveLength(0);
    });

    it('skips results with empty records', () => {
      const migrationResults = [
        { objectId: 'Z', phases: { extract: { records: [] }, transform: { records: [] } } },
      ];
      const result = engine.reconcileAll(migrationResults);
      expect(result.reports).toHaveLength(0);
    });

    it('reports FAILED when any object fails', () => {
      const migrationResults = [
        {
          objectId: 'FAIL',
          phases: {
            extract: { records: [{ ID: '1' }, { ID: '2' }, { ID: '3' }] },
            transform: { records: [{ ID: '1' }] }, // missing 2 records
          },
        },
      ];
      const result = engine.reconcileAll(migrationResults);
      expect(result.summary.overallStatus).toBe('FAILED');
      expect(result.summary.totalFailed).toBeGreaterThan(0);
    });
  });

  // ── _makeKey ───────────────────────────────────────────────

  describe('_makeKey', () => {
    it('joins fields with pipe', () => {
      const key = engine._makeKey({ A: '1', B: '2' }, ['A', 'B']);
      expect(key).toBe('1|2');
    });

    it('handles null/undefined as empty string', () => {
      const key = engine._makeKey({ A: null }, ['A', 'B']);
      expect(key).toBe('|');
    });
  });

  // ── Inference helpers ──────────────────────────────────────

  describe('inference helpers', () => {
    it('_inferKeyFields returns first 3 fields', () => {
      const result = {
        phases: { extract: { records: [{ A: 1, B: 2, C: 3, D: 4 }] } },
      };
      expect(engine._inferKeyFields(result)).toEqual(['A', 'B', 'C']);
    });

    it('_inferValueFields returns fields 4-8', () => {
      const result = {
        phases: { extract: { records: [{ A: 1, B: 2, C: 3, D: 4, E: 5, F: 6 }] } },
      };
      expect(engine._inferValueFields(result)).toEqual(['D', 'E', 'F']);
    });

    it('_inferAggregateFields finds numeric fields', () => {
      const result = {
        phases: { extract: { records: [{ NAME: 'abc', AMT: '100.50', QTY: '5', FLAG: '' }] } },
      };
      const fields = engine._inferAggregateFields(result);
      expect(fields).toContain('AMT');
      expect(fields).toContain('QTY');
      expect(fields).not.toContain('NAME');
    });

    it('_inferKeyFields handles empty records', () => {
      expect(engine._inferKeyFields({ phases: { extract: { records: [] } } })).toEqual([]);
    });

    it('_inferAggregateFields limits to 3', () => {
      const result = {
        phases: { extract: { records: [{ A: '1', B: '2', C: '3', D: '4', E: '5' }] } },
      };
      expect(engine._inferAggregateFields(result).length).toBeLessThanOrEqual(3);
    });
  });
});
