const WebService = require('../../../migration/objects/web-service');

describe('WebServiceMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new WebService(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('WEB_SERVICE');
    expect(obj.name).toBe('Web Service');
  });

  it('has 18+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(18);
  });

  it('extracts 12 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(12);
    expect(records[0]).toHaveProperty('SRVNAME');
    expect(records[0]).toHaveProperty('SRVTYPE');
    expect(records[0]).toHaveProperty('DIRECTION');
  });

  it('requires ServiceName, ServiceType, Direction', () => {
    const checks = obj.getQualityChecks();
    expect(checks.required).toEqual(['ServiceName', 'ServiceType', 'Direction']);
  });

  it('deduplicates on ServiceName + ServiceVersion', () => {
    const checks = obj.getQualityChecks();
    expect(checks.exactDuplicate.keys).toEqual(['ServiceName', 'ServiceVersion']);
  });

  it('has SOAP, REST, and OData service types', () => {
    const records = obj._extractMock();
    const types = new Set(records.map(r => r.SRVTYPE));
    expect(types.has('SOAP')).toBe(true);
    expect(types.has('REST')).toBe(true);
    expect(types.has('OData')).toBe(true);
  });

  it('has provider and consumer directions', () => {
    const records = obj._extractMock();
    const dirs = new Set(records.map(r => r.DIRECTION));
    expect(dirs.has('provider')).toBe(true);
    expect(dirs.has('consumer')).toBe(true);
  });

  it('classifies SOAP services for migration to OData', () => {
    const records = obj._extractMock();
    const soapServices = records.filter(r => r.SRVTYPE === 'SOAP' && r.DIRECTION === 'provider');
    expect(soapServices.every(r => r.MIGPATH === 'soap→odata')).toBe(true);
  });

  it('classifies standard SAP APIs as keep', () => {
    const records = obj._extractMock();
    const standard = records.find(r => r.SRVNAME === 'API_BUSINESS_PARTNER');
    expect(standard.MIGPATH).toBe('keep');
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('WEB_SERVICE');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(12);
    expect(result.phases.transform.recordCount).toBe(12);
    expect(result.phases.validate.status).toBe('completed');
  });
});
