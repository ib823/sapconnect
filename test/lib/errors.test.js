const {
  SapConnectError,
  ConnectionError,
  AuthenticationError,
  ODataError,
  RfcError,
  RuleValidationError,
  TransformError,
  MigrationObjectError,
} = require('../../lib/errors');

describe('Error Hierarchy', () => {
  describe('SapConnectError', () => {
    it('should set message, code, and details', () => {
      const err = new SapConnectError('test error', 'ERR_TEST', { key: 'val' });
      expect(err.message).toBe('test error');
      expect(err.code).toBe('ERR_TEST');
      expect(err.details).toEqual({ key: 'val' });
      expect(err.timestamp).toBeDefined();
    });

    it('should use default code when not provided', () => {
      const err = new SapConnectError('test');
      expect(err.code).toBe('ERR_SAPCONNECT');
    });

    it('should be an instance of Error', () => {
      const err = new SapConnectError('test');
      expect(err).toBeInstanceOf(Error);
    });

    it('should serialize to JSON', () => {
      const err = new SapConnectError('test', 'ERR_T', { x: 1 });
      const json = err.toJSON();
      expect(json.name).toBe('SapConnectError');
      expect(json.message).toBe('test');
      expect(json.code).toBe('ERR_T');
      expect(json.details).toEqual({ x: 1 });
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('Subclasses', () => {
    const subclasses = [
      { Class: ConnectionError, name: 'ConnectionError', code: 'ERR_CONNECTION' },
      { Class: AuthenticationError, name: 'AuthenticationError', code: 'ERR_AUTH' },
      { Class: RfcError, name: 'RfcError', code: 'ERR_RFC' },
      { Class: RuleValidationError, name: 'RuleValidationError', code: 'ERR_RULE_VALIDATION' },
      { Class: TransformError, name: 'TransformError', code: 'ERR_TRANSFORM' },
      { Class: MigrationObjectError, name: 'MigrationObjectError', code: 'ERR_MIGRATION_OBJECT' },
    ];

    for (const { Class, name, code } of subclasses) {
      it(`${name} should extend SapConnectError with code ${code}`, () => {
        const err = new Class('msg', { detail: true });
        expect(err).toBeInstanceOf(SapConnectError);
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe(name);
        expect(err.code).toBe(code);
        expect(err.details).toEqual({ detail: true });
      });
    }
  });

  describe('ODataError', () => {
    it('should include statusCode and response', () => {
      const err = new ODataError('Not Found', 404, { error: { message: 'nope' } });
      expect(err).toBeInstanceOf(SapConnectError);
      expect(err.name).toBe('ODataError');
      expect(err.code).toBe('ERR_ODATA');
      expect(err.statusCode).toBe(404);
      expect(err.response).toEqual({ error: { message: 'nope' } });
    });

    it('should serialize statusCode and response to JSON', () => {
      const err = new ODataError('Forbidden', 403, { error: 'forbidden' }, { url: '/test' });
      const json = err.toJSON();
      expect(json.statusCode).toBe(403);
      expect(json.response).toEqual({ error: 'forbidden' });
      expect(json.details).toEqual({ url: '/test' });
    });
  });
});
