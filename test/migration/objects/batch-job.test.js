const BatchJob = require('../../../migration/objects/batch-job');

describe('BatchJobMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new BatchJob(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('BATCH_JOB');
    expect(obj.name).toBe('Batch Job');
  });

  it('has 16+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(16);
  });

  it('extracts 18 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(18);
    expect(records[0]).toHaveProperty('JOBNAME');
    expect(records[0]).toHaveProperty('PROGNAME');
    expect(records[0]).toHaveProperty('FREQUENCY');
  });

  it('requires JobName, ProgramName, Frequency', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toEqual(['JobName', 'ProgramName', 'Frequency']);
  });

  it('deduplicates on JobName', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['JobName']);
  });

  it('validates AvgRuntimeMinutes range (0-1440)', () => {
    const checks = obj.getQualityChecks();
    const rangeCheck = checks.range.find(r => r.field === 'AvgRuntimeMinutes');
    expect(rangeCheck).toBeDefined();
    expect(rangeCheck.min).toBe(0);
    expect(rangeCheck.max).toBe(1440);
  });

  it('classifies standard SAP jobs as keep', () => {
    const records = obj._extractMock();
    const sapJob = records.find(r => r.JOBNAME === 'SAP_COLLECTOR_FOR_PERFMONITOR');
    expect(sapJob.MIGSTRATEGY).toBe('keep');
  });

  it('classifies hourly custom jobs as convert-to-app-job', () => {
    const records = obj._extractMock();
    const hourlyCustom = records.find(r => r.JOBNAME === 'Z_CUSTOMER_SYNC');
    expect(hourlyCustom.MIGSTRATEGY).toBe('convert-to-app-job');
  });

  it('classifies long-running custom jobs as review-performance', () => {
    const records = obj._extractMock();
    const longJob = records.find(r => r.JOBNAME === 'Z_FI_MONTHLY_CLOSE');
    expect(longJob.MIGSTRATEGY).toBe('review-performance');
  });

  it('identifies custom code flag', () => {
    const records = obj._extractMock();
    const custom = records.filter(r => r.CUSTOMCODE === 'X');
    const standard = records.filter(r => r.CUSTOMCODE === '');
    expect(custom.length).toBe(15);
    expect(standard.length).toBe(3);
  });

  it('has diverse frequencies', () => {
    const records = obj._extractMock();
    const freqs = new Set(records.map(r => r.FREQUENCY));
    expect(freqs.has('hourly')).toBe(true);
    expect(freqs.has('daily')).toBe(true);
    expect(freqs.has('weekly')).toBe(true);
    expect(freqs.has('monthly')).toBe(true);
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('BATCH_JOB');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(18);
    expect(result.phases.transform.recordCount).toBe(18);
    expect(result.phases.validate.status).toBe('completed');
  });
});
