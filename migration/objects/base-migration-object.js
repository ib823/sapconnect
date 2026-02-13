/**
 * Base Migration Object — Abstract ETLV Lifecycle
 *
 * All concrete migration objects (GL Balance, Business Partner, etc.)
 * extend this class and implement:
 *   - get objectId()
 *   - get name()
 *   - getFieldMappings()
 *   - getQualityChecks()
 *   - _extractMock()
 *
 * The base class provides shared transform(), validate(), load(), and run().
 */

const Logger = require('../../lib/logger');
const { MigrationObjectError } = require('../../lib/errors');
const { FieldMappingEngine } = require('../field-mapping');
const { DataQualityChecker } = require('../data-quality');

class BaseMigrationObject {
  constructor(gateway, options = {}) {
    if (new.target === BaseMigrationObject) {
      throw new MigrationObjectError(
        'Cannot instantiate BaseMigrationObject directly',
        'MIGOBJ_ABSTRACT'
      );
    }
    this.gateway = gateway;
    this.options = options;
    this.logger = new Logger(`mig-obj:${this.objectId}`, { level: options.logLevel || 'info' });
    this._mappingEngine = null;
    this._qualityChecker = new DataQualityChecker({ logLevel: options.logLevel });
  }

  /** @abstract */
  get objectId() { throw new MigrationObjectError('objectId not implemented', 'MIGOBJ_ABSTRACT'); }

  /** @abstract */
  get name() { throw new MigrationObjectError('name not implemented', 'MIGOBJ_ABSTRACT'); }

  /** @abstract — return array of field mapping definitions */
  getFieldMappings() { throw new MigrationObjectError('getFieldMappings not implemented', 'MIGOBJ_ABSTRACT'); }

  /** @abstract — return checks config for DataQualityChecker.check() */
  getQualityChecks() { return {}; }

  /** @abstract — return mock records for demo/test */
  _extractMock() { return []; }

  /**
   * Extract records from source system
   */
  async extract() {
    const start = Date.now();
    this.logger.info(`Extracting ${this.name}...`);

    let records;
    if (this.gateway.mode === 'mock') {
      records = this._extractMock();
    } else {
      // Live/vsp: subclasses can override _extractLive()
      records = await this._extractLive();
    }

    return {
      status: 'completed',
      recordCount: records.length,
      records,
      durationMs: Date.now() - start,
    };
  }

  /** Override in subclass for live extraction */
  async _extractLive() {
    this.logger.warn('Live extraction not implemented, falling back to mock');
    return this._extractMock();
  }

  /**
   * Transform source records to target format using field mappings
   */
  transform(records) {
    const start = Date.now();
    this.logger.info(`Transforming ${records.length} records...`);

    if (!this._mappingEngine) {
      this._mappingEngine = new FieldMappingEngine(this.getFieldMappings(), {
        logLevel: this.options.logLevel,
      });
    }

    const transformed = this._mappingEngine.applyBatch(records);
    const summary = this._mappingEngine.getSummary();

    return {
      status: 'completed',
      recordCount: transformed.length,
      records: transformed,
      mappingSummary: summary,
      durationMs: Date.now() - start,
    };
  }

  /**
   * Validate transformed records for data quality
   */
  validate(records) {
    const start = Date.now();
    this.logger.info(`Validating ${records.length} records...`);

    const checks = this.getQualityChecks();
    const result = this._qualityChecker.check(records, checks);

    return {
      status: result.status === 'errors' ? 'failed' : 'completed',
      qualityStatus: result.status,
      recordCount: records.length,
      errorCount: result.errorCount,
      warningCount: result.warningCount,
      checks: result.checks,
      durationMs: Date.now() - start,
    };
  }

  /**
   * Load records into target system
   */
  async load(records) {
    const start = Date.now();
    this.logger.info(`Loading ${records.length} records...`);

    if (this.gateway.mode === 'mock') {
      return this._loadMock(records);
    }
    return this._loadLive(records);
  }

  /** Mock load simulation */
  _loadMock(records) {
    const batchSize = this.options.batchSize || 100;
    const batches = Math.ceil(records.length / batchSize);
    // Simulate ~2% error rate
    const errorCount = Math.floor(records.length * 0.02);
    const successCount = records.length - errorCount;

    return {
      status: errorCount > 0 ? 'completed_with_errors' : 'completed',
      recordCount: records.length,
      successCount,
      errorCount,
      batches,
      batchSize,
      durationMs: Date.now() - Date.now(), // instant in mock
    };
  }

  /** Override in subclass for live loading */
  async _loadLive(records) {
    this.logger.warn('Live loading not implemented, falling back to mock');
    return this._loadMock(records);
  }

  /**
   * Run full ETLV lifecycle: Extract → Transform → Validate → Load
   */
  async run() {
    const start = Date.now();
    this.logger.info(`Running ${this.name} migration object...`);

    const result = {
      objectId: this.objectId,
      name: this.name,
      status: 'completed',
      phases: {},
      stats: {},
    };

    try {
      // Extract
      const extractResult = await this.extract();
      result.phases.extract = extractResult;

      if (extractResult.recordCount === 0) {
        result.status = 'completed';
        result.stats = this._buildStats(result, Date.now() - start);
        this.logger.info(`No records to migrate for ${this.name}`);
        return result;
      }

      // Transform
      const transformResult = this.transform(extractResult.records);
      result.phases.transform = transformResult;

      // Validate
      const validateResult = this.validate(transformResult.records);
      result.phases.validate = validateResult;

      // Load — skip if validation errors
      if (validateResult.status === 'failed') {
        result.status = 'validation_failed';
        result.phases.load = { status: 'skipped', reason: 'Validation errors found' };
        this.logger.warn(`Load skipped for ${this.name}: validation errors`);
      } else {
        const loadResult = await this.load(transformResult.records);
        result.phases.load = loadResult;
        if (loadResult.status === 'completed_with_errors') {
          result.status = 'completed_with_errors';
        }
      }
    } catch (err) {
      result.status = 'error';
      result.error = err.message;
      this.logger.error(`Migration object ${this.name} failed: ${err.message}`);
    }

    result.stats = this._buildStats(result, Date.now() - start);
    return result;
  }

  /** Build summary stats from phase results */
  _buildStats(result, totalMs) {
    return {
      totalDurationMs: totalMs,
      extractedRecords: result.phases.extract ? result.phases.extract.recordCount : 0,
      transformedRecords: result.phases.transform ? result.phases.transform.recordCount : 0,
      validationStatus: result.phases.validate ? result.phases.validate.qualityStatus : 'n/a',
      loadedRecords: result.phases.load && result.phases.load.successCount != null
        ? result.phases.load.successCount
        : 0,
      loadErrors: result.phases.load && result.phases.load.errorCount != null
        ? result.phases.load.errorCount
        : 0,
    };
  }
}

module.exports = BaseMigrationObject;
