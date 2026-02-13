const ProcessMiningEngine = require('../../../extraction/process/process-mining-engine');

describe('ProcessMiningEngine', () => {
  const mockResults = {
    CHANGE_DOCUMENTS: {
      headers: [
        { OBJECTCLAS: 'VERKBELEG', OBJECTID: '500001', CHANGENR: '001', USERNAME: 'JSMITH', UDATE: '20231015', UTIME: '143022', TCODE: 'VA01' },
        { OBJECTCLAS: 'VERKBELEG', OBJECTID: '500001', CHANGENR: '002', USERNAME: 'JSMITH', UDATE: '20231016', UTIME: '091500', TCODE: 'VA02' },
        { OBJECTCLAS: 'EINKBELEG', OBJECTID: '450001', CHANGENR: '003', USERNAME: 'KLEE', UDATE: '20231015', UTIME: '100000', TCODE: 'ME21N' },
      ],
      items: [
        { OBJECTCLAS: 'VERKBELEG', OBJECTID: '500001', CHANGENR: '001', TABNAME: 'VBAK', FNAME: 'AUART', CHNGIND: 'I', VALUE_NEW: 'OR', VALUE_OLD: '' },
      ],
      objectClasses: [
        { OBJECT: 'VERKBELEG', OBTEXT: 'Sales Document' },
        { OBJECT: 'EINKBELEG', OBTEXT: 'Purchasing Document' },
      ],
    },
    USAGE_STATISTICS: {
      transactionUsage: [
        { tcode: 'VA01', executions: 15420, totalTime: 462600, avgTime: 30 },
        { tcode: 'ME21N', executions: 8900, totalTime: 267000, avgTime: 30 },
      ],
      userActivity: [
        { user: 'JSMITH', totalExecutions: 12500, topTcodes: ['VA01', 'VA02'] },
      ],
      timeDistribution: [{ hour: 9, executions: 15200 }],
    },
  };

  it('should reconstruct processes from change documents', async () => {
    const engine = new ProcessMiningEngine(mockResults);
    const catalog = await engine.reconstructProcesses();
    expect(catalog).toBeDefined();
    expect(catalog.processes.length).toBeGreaterThan(0);
  });

  it('should produce O2C events from sales document changes', async () => {
    const engine = new ProcessMiningEngine(mockResults);
    const catalog = await engine.reconstructProcesses();
    const o2c = catalog.getProcess('O2C');
    expect(o2c).toBeDefined();
    expect(o2c.name).toBe('Order to Cash');
    expect(o2c.evidence.changeDocuments).toBeGreaterThan(0);
  });

  it('should produce P2P events from purchasing document changes', async () => {
    const engine = new ProcessMiningEngine(mockResults);
    const catalog = await engine.reconstructProcesses();
    const p2p = catalog.getProcess('P2P');
    expect(p2p).toBeDefined();
    expect(p2p.name).toBe('Procure to Pay');
  });

  it('should return a process catalog with toJSON and toMarkdown', async () => {
    const engine = new ProcessMiningEngine(mockResults);
    const catalog = await engine.reconstructProcesses();
    const json = catalog.toJSON();
    expect(json.totalProcesses).toBeGreaterThan(0);
    const md = catalog.toMarkdown();
    expect(md).toContain('Process Catalog');
  });
});
