const BaseMigrationObject = require('../../../migration/objects/base-migration-object');

// Minimal concrete subclass for testing
class TestObject extends BaseMigrationObject {
  get objectId() { return 'TEST_OBJ'; }
  get name() { return 'Test Object'; }
  getFieldMappings() {
    return [
      { source: 'SRC_A', target: 'TGT_A' },
      { source: 'SRC_B', target: 'TGT_B', convert: 'toUpperCase' },
    ];
  }
  getQualityChecks() {
    return { required: ['TGT_A'] };
  }
  _extractMock() {
    return [
      { SRC_A: 'alpha', SRC_B: 'hello' },
      { SRC_A: 'beta', SRC_B: 'world' },
    ];
  }
}

// Subclass that returns failing validation
class FailingValidationObject extends BaseMigrationObject {
  get objectId() { return 'FAIL_OBJ'; }
  get name() { return 'Failing Object'; }
  getFieldMappings() {
    return [{ source: 'X', target: 'Y' }];
  }
  getQualityChecks() {
    return { required: ['MISSING_FIELD'] };
  }
  _extractMock() {
    return [{ X: 'val' }];
  }
}

describe('BaseMigrationObject', () => {
  const mockGateway = { mode: 'mock' };

  it('cannot be instantiated directly', () => {
    expect(() => new BaseMigrationObject(mockGateway)).toThrow(/Cannot instantiate/);
  });

  it('subclass has objectId and name', () => {
    const obj = new TestObject(mockGateway);
    expect(obj.objectId).toBe('TEST_OBJ');
    expect(obj.name).toBe('Test Object');
  });

  describe('extract', () => {
    it('returns mock records', async () => {
      const obj = new TestObject(mockGateway);
      const result = await obj.extract();
      expect(result.status).toBe('completed');
      expect(result.recordCount).toBe(2);
      expect(result.records).toHaveLength(2);
    });
  });

  describe('transform', () => {
    it('applies field mappings', () => {
      const obj = new TestObject(mockGateway);
      const records = [{ SRC_A: 'val', SRC_B: 'hello' }];
      const result = obj.transform(records);
      expect(result.status).toBe('completed');
      expect(result.recordCount).toBe(1);
      expect(result.records[0]).toEqual({ TGT_A: 'val', TGT_B: 'HELLO' });
    });
  });

  describe('validate', () => {
    it('passes when data is clean', () => {
      const obj = new TestObject(mockGateway);
      const records = [{ TGT_A: 'val', TGT_B: 'HELLO' }];
      const result = obj.validate(records);
      expect(result.status).toBe('completed');
      expect(result.errorCount).toBe(0);
    });

    it('fails when required fields missing', () => {
      const obj = new TestObject(mockGateway);
      const records = [{ TGT_A: '', TGT_B: 'HELLO' }];
      const result = obj.validate(records);
      expect(result.status).toBe('failed');
      expect(result.errorCount).toBeGreaterThan(0);
    });
  });

  describe('load', () => {
    it('simulates load in mock mode', async () => {
      const obj = new TestObject(mockGateway);
      const records = [{ TGT_A: 'val' }];
      const result = await obj.load(records);
      expect(result.recordCount).toBe(1);
      expect(result.successCount).toBeDefined();
    });
  });

  describe('run (full lifecycle)', () => {
    it('runs all 4 phases successfully', async () => {
      const obj = new TestObject(mockGateway);
      const result = await obj.run();
      expect(result.objectId).toBe('TEST_OBJ');
      expect(result.name).toBe('Test Object');
      expect(result.status).toBe('completed');
      expect(result.phases.extract).toBeDefined();
      expect(result.phases.transform).toBeDefined();
      expect(result.phases.validate).toBeDefined();
      expect(result.phases.load).toBeDefined();
      expect(result.stats.extractedRecords).toBe(2);
      expect(result.stats.transformedRecords).toBe(2);
    });

    it('skips load when validation fails', async () => {
      const obj = new FailingValidationObject(mockGateway);
      const result = await obj.run();
      expect(result.status).toBe('validation_failed');
      expect(result.phases.load.status).toBe('skipped');
      expect(result.stats.loadedRecords).toBe(0);
    });

    it('handles empty extraction', async () => {
      class EmptyObject extends BaseMigrationObject {
        get objectId() { return 'EMPTY'; }
        get name() { return 'Empty'; }
        getFieldMappings() { return []; }
        _extractMock() { return []; }
      }
      const obj = new EmptyObject(mockGateway);
      const result = await obj.run();
      expect(result.status).toBe('completed');
      expect(result.phases.extract.recordCount).toBe(0);
      expect(result.phases.transform).toBeUndefined();
    });
  });
});
