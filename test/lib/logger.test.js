const Logger = require('../../lib/logger');

describe('Logger', () => {
  let output;
  let logger;

  beforeEach(() => {
    output = { log: vi.fn() };
  });

  describe('level filtering', () => {
    it('should filter debug messages at info level', () => {
      logger = new Logger('test', { level: 'info', output });
      logger.debug('hidden');
      expect(output.log).not.toHaveBeenCalled();
    });

    it('should show info messages at info level', () => {
      logger = new Logger('test', { level: 'info', output });
      logger.info('visible');
      expect(output.log).toHaveBeenCalledOnce();
    });

    it('should show all messages at debug level', () => {
      logger = new Logger('test', { level: 'debug', output });
      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');
      expect(output.log).toHaveBeenCalledTimes(4);
    });

    it('should only show errors at error level', () => {
      logger = new Logger('test', { level: 'error', output });
      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');
      expect(output.log).toHaveBeenCalledOnce();
    });
  });

  describe('text format', () => {
    it('should prefix with logger name', () => {
      logger = new Logger('scanner', { level: 'debug', format: 'text', output });
      logger.info('scanning');
      expect(output.log).toHaveBeenCalledWith('  [scanner] scanning');
    });

    it('should tag errors and warnings', () => {
      logger = new Logger('test', { level: 'debug', format: 'text', output });
      logger.error('fail');
      expect(output.log).toHaveBeenCalledWith('  [test] ERROR: fail');
      logger.warn('caution');
      expect(output.log).toHaveBeenCalledWith('  [test] WARN: caution');
    });

    it('should pass details as second argument', () => {
      logger = new Logger('test', { level: 'debug', format: 'text', output });
      const details = { count: 5 };
      logger.info('result', details);
      expect(output.log).toHaveBeenCalledWith('  [test] result', details);
    });
  });

  describe('json format', () => {
    it('should output valid JSON', () => {
      logger = new Logger('test', { level: 'debug', format: 'json', output });
      logger.info('hello');
      const arg = output.log.mock.calls[0][0];
      const parsed = JSON.parse(arg);
      expect(parsed.level).toBe('info');
      expect(parsed.name).toBe('test');
      expect(parsed.msg).toBe('hello');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should include details in JSON', () => {
      logger = new Logger('test', { level: 'debug', format: 'json', output });
      logger.error('fail', { code: 500 });
      const parsed = JSON.parse(output.log.mock.calls[0][0]);
      expect(parsed.details).toEqual({ code: 500 });
    });
  });

  describe('child loggers', () => {
    it('should create child with namespaced name', () => {
      logger = new Logger('migration', { level: 'debug', format: 'text', output });
      const child = logger.child('scanner');
      child.info('found');
      expect(output.log).toHaveBeenCalledWith('  [migration:scanner] found');
    });

    it('should inherit level and format from parent', () => {
      logger = new Logger('root', { level: 'error', format: 'json', output });
      const child = logger.child('child');
      child.info('hidden');
      expect(output.log).not.toHaveBeenCalled();
      child.error('visible');
      expect(output.log).toHaveBeenCalledOnce();
      const parsed = JSON.parse(output.log.mock.calls[0][0]);
      expect(parsed.name).toBe('root:child');
    });
  });
});
