const { InputValidator, ValidationError, SCHEMAS } = require('../../../lib/security/input-validator');

describe('InputValidator', () => {
  let validator;

  beforeEach(() => { validator = new InputValidator(); });

  describe('validate', () => {
    it('validates valid objectId', () => {
      expect(validator.validate('GL_BALANCE', 'objectId')).toBe('GL_BALANCE');
    });

    it('rejects invalid objectId', () => {
      expect(() => validator.validate('gl-balance', 'objectId')).toThrow(ValidationError);
    });

    it('rejects empty objectId', () => {
      expect(() => validator.validate('', 'objectId')).toThrow();
    });

    it('validates valid projectId', () => {
      expect(validator.validate('PRJ-001', 'projectId')).toBe('PRJ-001');
    });

    it('rejects projectId with special chars', () => {
      expect(() => validator.validate('PRJ<script>', 'projectId')).toThrow();
    });

    it('validates projectName within length', () => {
      expect(validator.validate('My Migration Project', 'projectName')).toBe('My Migration Project');
    });

    it('rejects projectName exceeding max length', () => {
      expect(() => validator.validate('x'.repeat(201), 'projectName')).toThrow();
    });

    it('validates valid template', () => {
      expect(validator.validate('greenfield_full', 'template')).toBe('greenfield_full');
    });

    it('rejects invalid template', () => {
      expect(() => validator.validate('invalid_template', 'template')).toThrow();
    });

    it('validates valid mode', () => {
      expect(validator.validate('mock', 'mode')).toBe('mock');
      expect(validator.validate('live', 'mode')).toBe('live');
    });

    it('rejects invalid mode', () => {
      expect(() => validator.validate('invalid', 'mode')).toThrow();
    });

    it('validates modules array', () => {
      const result = validator.validate(['FI', 'CO', 'MM'], 'modules');
      expect(result).toEqual(['FI', 'CO', 'MM']);
    });

    it('rejects modules with invalid items', () => {
      expect(() => validator.validate(['FI', 'invalid_long'], 'modules')).toThrow();
    });

    it('rejects non-array modules', () => {
      expect(() => validator.validate('FI', 'modules')).toThrow();
    });

    it('trims and sanitizes string inputs', () => {
      const result = validator.validate('  GL_BALANCE  ', 'objectId');
      expect(result).toBe('GL_BALANCE');
    });

    it('removes control characters', () => {
      const result = validator.validate('PRJ\x00001', 'projectId');
      expect(result).toBe('PRJ001');
    });

    it('throws on unknown schema', () => {
      expect(() => validator.validate('test', 'nonexistent')).toThrow(/Unknown schema/);
    });
  });

  describe('validateObject', () => {
    it('validates multiple fields', () => {
      const result = validator.validateObject(
        { id: 'GL_BALANCE', name: 'Test' },
        { id: 'objectId', name: 'projectName' }
      );
      expect(result.id).toBe('GL_BALANCE');
      expect(result.name).toBe('Test');
    });

    it('collects all errors', () => {
      try {
        validator.validateObject(
          { id: 'invalid', name: '' },
          { id: 'objectId', name: 'projectName' }
        );
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.errors.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('skips undefined fields', () => {
      const result = validator.validateObject(
        { id: 'GL_BALANCE' },
        { id: 'objectId', name: 'projectName' }
      );
      expect(result.id).toBe('GL_BALANCE');
      expect(result.name).toBeUndefined();
    });
  });

  describe('middleware', () => {
    it('returns a function', () => {
      const mw = validator.middleware({ id: 'objectId' });
      expect(typeof mw).toBe('function');
    });

    it('calls next on valid params', () => {
      const mw = validator.middleware({ id: 'objectId' });
      const next = vi.fn();
      mw({ params: { id: 'GL_BALANCE' }, body: {}, query: {} }, {}, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('calls next with error on invalid params', () => {
      const mw = validator.middleware({ id: 'objectId' });
      const next = vi.fn();
      mw({ params: { id: 'invalid!' }, body: {}, query: {} }, {}, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('SCHEMAS', () => {
    it('has all expected schemas', () => {
      expect(SCHEMAS.objectId).toBeDefined();
      expect(SCHEMAS.projectId).toBeDefined();
      expect(SCHEMAS.projectName).toBeDefined();
      expect(SCHEMAS.template).toBeDefined();
      expect(SCHEMAS.mode).toBeDefined();
      expect(SCHEMAS.modules).toBeDefined();
      expect(SCHEMAS.pagination).toBeDefined();
    });
  });
});
