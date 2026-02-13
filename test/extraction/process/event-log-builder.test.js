const EventLogBuilder = require('../../../extraction/process/event-log-builder');

describe('EventLogBuilder', () => {
  const changeDocs = {
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
  };

  it('should build O2C event log from sales doc changes', () => {
    const builder = new EventLogBuilder(changeDocs);
    const log = builder.buildO2CEventLog();
    expect(log.processName).toBe('Order to Cash');
    expect(log.totalEvents).toBe(2);
    expect(log.totalCases).toBe(1);
  });

  it('should build P2P event log from purchasing doc changes', () => {
    const builder = new EventLogBuilder(changeDocs);
    const log = builder.buildP2PEventLog();
    expect(log.processName).toBe('Procure to Pay');
    expect(log.totalEvents).toBe(1);
  });

  it('should map tcode to activity name', () => {
    const builder = new EventLogBuilder(changeDocs);
    const log = builder.buildO2CEventLog();
    expect(log.events[0].activity).toBe('Create Sales Order');
  });

  it('should build custom event log', () => {
    const builder = new EventLogBuilder(changeDocs);
    const log = builder.buildCustomEventLog({
      name: 'Custom',
      objectClasses: ['VERKBELEG'],
      tcodeMap: { VA01: 'Step 1' },
    });
    expect(log.processName).toBe('Custom');
    expect(log.totalEvents).toBeGreaterThan(0);
  });
});
