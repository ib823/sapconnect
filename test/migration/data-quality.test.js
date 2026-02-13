const { DataQualityChecker, levenshtein, normalizedSimilarity } = require('../../migration/data-quality');

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('abc', 'abc')).toBe(0);
  });

  it('returns string length for empty comparison', () => {
    expect(levenshtein('abc', '')).toBe(3);
    expect(levenshtein('', 'xyz')).toBe(3);
  });

  it('computes distance correctly', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('saturday', 'sunday')).toBe(3);
  });
});

describe('normalizedSimilarity', () => {
  it('returns 1.0 for identical strings', () => {
    expect(normalizedSimilarity('abc', 'abc')).toBe(1);
  });

  it('returns 0 for completely different strings', () => {
    expect(normalizedSimilarity('abc', 'xyz')).toBeLessThan(0.1);
  });

  it('returns high similarity for close strings', () => {
    expect(normalizedSimilarity('ACME Corp', 'ACME Corp.')).toBeGreaterThanOrEqual(0.9);
  });
});

describe('DataQualityChecker', () => {
  const checker = new DataQualityChecker();

  describe('checkRequired', () => {
    it('passes when all required fields present', () => {
      const records = [
        { NAME: 'A', COUNTRY: 'US' },
        { NAME: 'B', COUNTRY: 'DE' },
      ];
      const r = checker.checkRequired(records, ['NAME', 'COUNTRY']);
      expect(r.severity).toBe('pass');
      expect(r.count).toBe(0);
    });

    it('errors when fields missing', () => {
      const records = [
        { NAME: 'A', COUNTRY: 'US' },
        { NAME: '', COUNTRY: 'DE' },
        { NAME: 'C', COUNTRY: null },
      ];
      const r = checker.checkRequired(records, ['NAME', 'COUNTRY']);
      expect(r.severity).toBe('error');
      expect(r.count).toBe(2);
    });
  });

  describe('findExactDuplicates', () => {
    it('finds no duplicates in clean data', () => {
      const records = [{ ID: '1' }, { ID: '2' }, { ID: '3' }];
      const r = checker.findExactDuplicates(records, ['ID']);
      expect(r.severity).toBe('pass');
      expect(r.count).toBe(0);
    });

    it('finds exact duplicates', () => {
      const records = [{ ID: '1' }, { ID: '2' }, { ID: '1' }];
      const r = checker.findExactDuplicates(records, ['ID']);
      expect(r.severity).toBe('error');
      expect(r.count).toBe(1);
      expect(r.details[0].row).toBe(2);
      expect(r.details[0].duplicateOf).toBe(0);
    });

    it('supports composite keys', () => {
      const records = [
        { CO: '1000', GL: '100000' },
        { CO: '1000', GL: '200000' },
        { CO: '1000', GL: '100000' },
      ];
      const r = checker.findExactDuplicates(records, ['CO', 'GL']);
      expect(r.count).toBe(1);
    });
  });

  describe('findFuzzyDuplicates', () => {
    it('finds no fuzzy duplicates in distinct data', () => {
      const records = [
        { NAME: 'Alpha Corp' },
        { NAME: 'Zebra Industries' },
      ];
      const r = checker.findFuzzyDuplicates(records, ['NAME'], 0.85);
      expect(r.severity).toBe('pass');
    });

    it('finds fuzzy duplicates', () => {
      const records = [
        { NAME: 'ACME Corporation', CITY: 'New York' },
        { NAME: 'ACME Corp.', CITY: 'New York' },
        { NAME: 'Totally Different Inc', CITY: 'London' },
      ];
      const r = checker.findFuzzyDuplicates(records, ['NAME', 'CITY'], 0.70);
      expect(r.severity).toBe('warning');
      expect(r.count).toBeGreaterThan(0);
      expect(r.details[0].rowA).toBe(0);
      expect(r.details[0].rowB).toBe(1);
    });
  });

  describe('checkReferentialIntegrity', () => {
    it('passes with valid references', () => {
      const records = [{ BUKRS: '1000' }, { BUKRS: '2000' }];
      const r = checker.checkReferentialIntegrity(records, 'BUKRS', new Set(['1000', '2000', '3000']));
      expect(r.severity).toBe('pass');
    });

    it('fails with invalid references', () => {
      const records = [{ BUKRS: '1000' }, { BUKRS: '9999' }];
      const r = checker.checkReferentialIntegrity(records, 'BUKRS', ['1000', '2000']);
      expect(r.severity).toBe('error');
      expect(r.count).toBe(1);
      expect(r.details[0].value).toBe('9999');
    });
  });

  describe('checkFormat', () => {
    it('passes valid format', () => {
      const records = [{ DATE: '2024-01-15' }, { DATE: '2023-12-31' }];
      const r = checker.checkFormat(records, 'DATE', /^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
      expect(r.severity).toBe('pass');
    });

    it('warns on format violations', () => {
      const records = [{ DATE: '2024-01-15' }, { DATE: '15/01/2024' }];
      const r = checker.checkFormat(records, 'DATE', /^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
      expect(r.severity).toBe('warning');
      expect(r.count).toBe(1);
    });
  });

  describe('checkRange', () => {
    it('passes valid ranges', () => {
      const records = [{ YEAR: 2020 }, { YEAR: 2024 }];
      const r = checker.checkRange(records, 'YEAR', 2000, 2030);
      expect(r.severity).toBe('pass');
    });

    it('warns on out-of-range values', () => {
      const records = [{ YEAR: 2020 }, { YEAR: 1990 }, { YEAR: 2050 }];
      const r = checker.checkRange(records, 'YEAR', 2000, 2030);
      expect(r.severity).toBe('warning');
      expect(r.count).toBe(2);
    });
  });

  describe('check (combined)', () => {
    it('runs all checks and returns aggregate result', () => {
      const records = [
        { ID: '1', NAME: 'Alpha', COUNTRY: 'US' },
        { ID: '2', NAME: 'Beta', COUNTRY: 'DE' },
        { ID: '3', NAME: 'Gamma', COUNTRY: 'US' },
      ];
      const result = checker.check(records, {
        required: ['ID', 'NAME'],
        exactDuplicate: { keys: ['ID'] },
        referential: [{ field: 'COUNTRY', validSet: ['US', 'DE', 'FR'] }],
      });
      expect(result.status).toBe('passed');
      expect(result.totalRecords).toBe(3);
      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
      expect(result.checks.length).toBe(3);
    });

    it('returns errors status when required fields missing', () => {
      const records = [
        { ID: '1', NAME: '' },
      ];
      const result = checker.check(records, {
        required: ['NAME'],
      });
      expect(result.status).toBe('errors');
      expect(result.errorCount).toBe(1);
    });

    it('returns warnings status on fuzzy dupes', () => {
      const records = [
        { NAME: 'ACME Corp' },
        { NAME: 'ACME Corp.' },
      ];
      const result = checker.check(records, {
        fuzzyDuplicate: { keys: ['NAME'], threshold: 0.85 },
      });
      expect(result.status).toBe('warnings');
    });
  });
});
