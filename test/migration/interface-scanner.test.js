const InterfaceScanner = require('../../migration/interface-scanner');

describe('InterfaceScanner', () => {
  let scanner;

  beforeEach(() => {
    const mockGateway = { mode: 'mock' };
    scanner = new InterfaceScanner(mockGateway);
  });

  it('should return interface scan result', async () => {
    const result = await scanner.scan();

    expect(result).toHaveProperty('rfcDestinations');
    expect(result).toHaveProperty('idocTypes');
    expect(result).toHaveProperty('webServices');
    expect(result).toHaveProperty('batchJobs');
    expect(result).toHaveProperty('summary');
  });

  it('should have 24 RFC destinations', async () => {
    const result = await scanner.scan();
    expect(result.rfcDestinations).toHaveLength(24);
  });

  it('should have 34 IDoc flows', async () => {
    const result = await scanner.scan();
    expect(result.idocTypes).toHaveLength(34);
  });

  it('should have 8 web services', async () => {
    const result = await scanner.scan();
    expect(result.webServices).toHaveLength(8);
  });

  it('should have 15 batch jobs', async () => {
    const result = await scanner.scan();
    expect(result.batchJobs).toHaveLength(15);
  });

  it('should have correct summary totals', async () => {
    const result = await scanner.scan();

    expect(result.summary.totalRfcDestinations).toBe(24);
    expect(result.summary.totalIdocFlows).toBe(34);
    expect(result.summary.totalWebServices).toBe(8);
    expect(result.summary.totalBatchJobs).toBe(15);
    expect(result.summary.interfaceComplexity).toBe('High');
  });

  it('should have required fields on RFC destinations', async () => {
    const result = await scanner.scan();
    for (const rfc of result.rfcDestinations) {
      expect(rfc.destination).toBeTruthy();
      expect(rfc.type).toBeTruthy();
      expect(['active', 'inactive']).toContain(rfc.status);
    }
  });

  it('should have required fields on IDoc types', async () => {
    const result = await scanner.scan();
    for (const idoc of result.idocTypes) {
      expect(idoc.messageType).toBeTruthy();
      expect(idoc.idocType).toBeTruthy();
      expect(['inbound', 'outbound']).toContain(idoc.direction);
      expect(idoc.volume).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have required fields on batch jobs', async () => {
    const result = await scanner.scan();
    for (const job of result.batchJobs) {
      expect(job.jobName).toBeTruthy();
      expect(job.program).toBeTruthy();
      expect(job.frequency).toBeTruthy();
    }
  });
});
