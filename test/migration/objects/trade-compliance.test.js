const TradeCompliance = require('../../../migration/objects/trade-compliance');

describe('TradeComplianceMigrationObject', () => {
  const gw = { mode: 'mock' };
  let obj;

  beforeEach(() => { obj = new TradeCompliance(gw); });

  it('has correct objectId and name', () => {
    expect(obj.objectId).toBe('TRADE_COMPLIANCE');
    expect(obj.name).toBe('Trade Compliance');
  });

  it('has 35+ field mappings', () => {
    expect(obj.getFieldMappings().length).toBeGreaterThanOrEqual(35);
  });

  it('extracts 22 mock records', () => {
    const records = obj._extractMock();
    expect(records).toHaveLength(22);
  });

  it('has all 4 compliance types', () => {
    const records = obj._extractMock();
    const types = new Set(records.map(r => r.COMPL_TYPE));
    expect(types.has('SPL_SCREENING')).toBe(true);
    expect(types.has('EXPORT_CONTROL')).toBe(true);
    expect(types.has('CUSTOMS_TARIFF')).toBe(true);
    expect(types.has('TRADE_LICENSE')).toBe(true);
  });

  it('has 5 sanctions screening records', () => {
    const records = obj._extractMock();
    const spl = records.filter(r => r.COMPL_TYPE === 'SPL_SCREENING');
    expect(spl).toHaveLength(5);
  });

  it('has blocked and clear screening statuses', () => {
    const records = obj._extractMock();
    const spl = records.filter(r => r.COMPL_TYPE === 'SPL_SCREENING');
    const statuses = new Set(spl.map(r => r.SPL_STATUS));
    expect(statuses.has('CLEAR')).toBe(true);
    expect(statuses.has('BLOCKED')).toBe(true);
  });

  it('has 8 customs tariff codes', () => {
    const records = obj._extractMock();
    const tariffs = records.filter(r => r.COMPL_TYPE === 'CUSTOMS_TARIFF');
    expect(tariffs).toHaveLength(8);
    expect(tariffs.every(r => r.HS_CODE !== '')).toBe(true);
  });

  it('has trade licenses with quantity tracking', () => {
    const records = obj._extractMock();
    const licenses = records.filter(r => r.COMPL_TYPE === 'TRADE_LICENSE');
    expect(licenses).toHaveLength(4);
    expect(licenses.every(r => r.LICENSE_NO !== '')).toBe(true);
    expect(licenses.every(r => r.LICENSE_QTY !== '')).toBe(true);
  });

  it('has padLeft40 conversion for material', () => {
    const mappings = obj.getFieldMappings();
    const matnr = mappings.find(m => m.source === 'MATNR');
    expect(matnr.convert).toBe('padLeft40');
  });

  it('runs full lifecycle', async () => {
    const result = await obj.run();
    expect(result.objectId).toBe('TRADE_COMPLIANCE');
    expect(['completed', 'completed_with_errors']).toContain(result.status);
    expect(result.phases.extract.recordCount).toBe(22);
    expect(result.phases.validate.status).toBe('completed');
  });
});
