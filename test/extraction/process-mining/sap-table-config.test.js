'use strict';

const {
  TABLE_TYPES,
  PROCESS_CONFIGS,
  getProcessConfig,
  getAllProcessIds,
  getTablesForProcess,
  isS4Hana,
  adaptConfigForS4,
  getActivityFromTcode,
} = require('../../../extraction/process-mining/sap-table-config');

const ALL_PROCESS_IDS = ['O2C', 'P2P', 'R2R', 'A2R', 'H2R', 'P2M', 'M2S'];

// ===========================================================================
// TABLE_TYPES
// ===========================================================================

describe('TABLE_TYPES', () => {
  it('defines all 7 expected types', () => {
    expect(TABLE_TYPES.RECORD).toBe('record');
    expect(TABLE_TYPES.TRANSACTION).toBe('transaction');
    expect(TABLE_TYPES.FLOW).toBe('flow');
    expect(TABLE_TYPES.CHANGE).toBe('change');
    expect(TABLE_TYPES.DETAIL).toBe('detail');
    expect(TABLE_TYPES.STATUS).toBe('status');
    expect(TABLE_TYPES.MASTER).toBe('master');
  });

  it('has exactly 7 entries', () => {
    expect(Object.keys(TABLE_TYPES)).toHaveLength(7);
  });
});

// ===========================================================================
// PROCESS_CONFIGS
// ===========================================================================

describe('PROCESS_CONFIGS', () => {
  it('contains all 7 process definitions', () => {
    for (const id of ALL_PROCESS_IDS) {
      expect(PROCESS_CONFIGS[id]).toBeDefined();
    }
  });

  it('has exactly 7 entries', () => {
    expect(Object.keys(PROCESS_CONFIGS)).toHaveLength(7);
  });

  it.each(ALL_PROCESS_IDS)('%s has required top-level properties', (id) => {
    const config = PROCESS_CONFIGS[id];
    expect(config.id).toBe(id);
    expect(typeof config.name).toBe('string');
    expect(config.name.length).toBeGreaterThan(0);
    expect(typeof config.description).toBe('string');
    expect(config.description.length).toBeGreaterThan(0);
    expect(config.caseId).toBeDefined();
    expect(config.caseId.primary).toBeDefined();
    expect(config.tables).toBeDefined();
    expect(Object.keys(config.tables).length).toBeGreaterThan(0);
    expect(config.kpis).toBeDefined();
    expect(Object.keys(config.kpis).length).toBeGreaterThan(0);
  });

  it.each(ALL_PROCESS_IDS)('%s has a tcodeMap with at least one entry', (id) => {
    const config = PROCESS_CONFIGS[id];
    expect(config.tcodeMap).toBeDefined();
    expect(Object.keys(config.tcodeMap).length).toBeGreaterThan(0);
  });

  it.each(ALL_PROCESS_IDS)('%s has referenceActivities array', (id) => {
    const config = PROCESS_CONFIGS[id];
    expect(Array.isArray(config.referenceActivities)).toBe(true);
    expect(config.referenceActivities.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Table structure within each process
// ===========================================================================

describe('Table structure', () => {
  const validTypes = Object.values(TABLE_TYPES);

  it.each(ALL_PROCESS_IDS)('%s — every table has a valid type', (id) => {
    const config = PROCESS_CONFIGS[id];
    for (const [tableName, tableDef] of Object.entries(config.tables)) {
      expect(validTypes).toContain(tableDef.type);
    }
  });

  it.each(ALL_PROCESS_IDS)('%s — every table has a fields array', (id) => {
    const config = PROCESS_CONFIGS[id];
    for (const [tableName, tableDef] of Object.entries(config.tables)) {
      expect(Array.isArray(tableDef.fields)).toBe(true);
      expect(tableDef.fields.length).toBeGreaterThan(0);
    }
  });

  it.each(ALL_PROCESS_IDS)('%s — every table has a description', (id) => {
    const config = PROCESS_CONFIGS[id];
    for (const [tableName, tableDef] of Object.entries(config.tables)) {
      expect(typeof tableDef.description).toBe('string');
      expect(tableDef.description.length).toBeGreaterThan(0);
    }
  });

  it('O2C VBAK is a RECORD type with activityMapping', () => {
    const vbak = PROCESS_CONFIGS.O2C.tables.VBAK;
    expect(vbak.type).toBe(TABLE_TYPES.RECORD);
    expect(vbak.activityMapping).toBeDefined();
    expect(vbak.activityMapping.activity).toBe('Create Sales Order');
    expect(vbak.caseIdField).toBe('VBELN');
  });

  it('O2C VBFA is a FLOW type with documentTypeMap', () => {
    const vbfa = PROCESS_CONFIGS.O2C.tables.VBFA;
    expect(vbfa.type).toBe(TABLE_TYPES.FLOW);
    expect(vbfa.documentTypeMap).toBeDefined();
    expect(Object.keys(vbfa.documentTypeMap).length).toBeGreaterThan(5);
  });

  it('O2C VBUK is marked ecc_only', () => {
    const vbuk = PROCESS_CONFIGS.O2C.tables.VBUK;
    expect(vbuk.ecc_only).toBe(true);
  });

  it('P2P EKBE is a FLOW type with documentTypeMap', () => {
    const ekbe = PROCESS_CONFIGS.P2P.tables.EKBE;
    expect(ekbe.type).toBe(TABLE_TYPES.FLOW);
    expect(ekbe.documentTypeMap).toBeDefined();
  });
});

// ===========================================================================
// getProcessConfig()
// ===========================================================================

describe('getProcessConfig()', () => {
  it.each(ALL_PROCESS_IDS)('returns correct config for %s', (id) => {
    const config = getProcessConfig(id);
    expect(config).not.toBeNull();
    expect(config.id).toBe(id);
  });

  it('returns null for unknown process ID', () => {
    expect(getProcessConfig('UNKNOWN')).toBeNull();
    expect(getProcessConfig('')).toBeNull();
    expect(getProcessConfig(undefined)).toBeNull();
  });
});

// ===========================================================================
// getAllProcessIds()
// ===========================================================================

describe('getAllProcessIds()', () => {
  it('returns all 7 process IDs', () => {
    const ids = getAllProcessIds();
    expect(ids).toHaveLength(7);
    for (const id of ALL_PROCESS_IDS) {
      expect(ids).toContain(id);
    }
  });

  it('returns an array of strings', () => {
    const ids = getAllProcessIds();
    for (const id of ids) {
      expect(typeof id).toBe('string');
    }
  });
});

// ===========================================================================
// getTablesForProcess()
// ===========================================================================

describe('getTablesForProcess()', () => {
  it.each(ALL_PROCESS_IDS)('returns non-empty array of table names for %s', (id) => {
    const tables = getTablesForProcess(id);
    expect(Array.isArray(tables)).toBe(true);
    expect(tables.length).toBeGreaterThan(0);
    for (const t of tables) {
      expect(typeof t).toBe('string');
    }
  });

  it('O2C includes key sales tables', () => {
    const tables = getTablesForProcess('O2C');
    expect(tables).toContain('VBAK');
    expect(tables).toContain('VBAP');
    expect(tables).toContain('LIKP');
    expect(tables).toContain('VBRK');
    expect(tables).toContain('VBFA');
    expect(tables).toContain('BKPF');
  });

  it('P2P includes key procurement tables', () => {
    const tables = getTablesForProcess('P2P');
    expect(tables).toContain('EKKO');
    expect(tables).toContain('EKPO');
    expect(tables).toContain('EBAN');
    expect(tables).toContain('EKBE');
    expect(tables).toContain('RBKP');
  });

  it('R2R includes key financial tables', () => {
    const tables = getTablesForProcess('R2R');
    expect(tables).toContain('BKPF');
    expect(tables).toContain('BSEG');
  });

  it('returns empty array for unknown process', () => {
    expect(getTablesForProcess('NOPE')).toEqual([]);
  });
});

// ===========================================================================
// getActivityFromTcode()
// ===========================================================================

describe('getActivityFromTcode()', () => {
  it('maps O2C tcodes correctly', () => {
    expect(getActivityFromTcode('VA01', 'O2C')).toBe('Create Sales Order');
    expect(getActivityFromTcode('VF01', 'O2C')).toBe('Create Invoice');
    expect(getActivityFromTcode('VL01N', 'O2C')).toBe('Create Delivery');
  });

  it('maps P2P tcodes correctly', () => {
    expect(getActivityFromTcode('ME21N', 'P2P')).toBe('Create Purchase Order');
    expect(getActivityFromTcode('MIGO', 'P2P')).toBe('Goods Receipt');
    expect(getActivityFromTcode('MIRO', 'P2P')).toBe('Invoice Receipt');
  });

  it('falls back to scanning all processes when processId omitted', () => {
    expect(getActivityFromTcode('VA01')).toBe('Create Sales Order');
    expect(getActivityFromTcode('ME21N')).toBe('Create Purchase Order');
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(getActivityFromTcode('va01')).toBe('Create Sales Order');
    expect(getActivityFromTcode(' VA01 ')).toBe('Create Sales Order');
  });

  it('returns null for unknown tcode', () => {
    expect(getActivityFromTcode('ZZZZZ')).toBeNull();
    expect(getActivityFromTcode('ZZZZZ', 'O2C')).toBeNull();
  });

  it('returns null for empty / null input', () => {
    expect(getActivityFromTcode(null)).toBeNull();
    expect(getActivityFromTcode('')).toBeNull();
    expect(getActivityFromTcode(undefined)).toBeNull();
  });
});

// ===========================================================================
// isS4Hana()
// ===========================================================================

describe('isS4Hana()', () => {
  it('returns false for null input', () => {
    expect(isS4Hana(null)).toBe(false);
    expect(isS4Hana(undefined)).toBe(false);
  });

  it('detects S/4HANA by component string', () => {
    expect(isS4Hana({ component: 'SAP S/4HANA 2021' })).toBe(true);
    expect(isS4Hana({ COMPONENT: 'S4CORE' })).toBe(true);
  });

  it('detects S/4HANA by release number >= 1709', () => {
    expect(isS4Hana({ release: '1909' })).toBe(true);
    expect(isS4Hana({ release: '1709' })).toBe(true);
    expect(isS4Hana({ release: '751' })).toBe(false);
  });

  it('detects S/4HANA by sapProduct', () => {
    expect(isS4Hana({ sapProduct: 'SAP S/4HANA Cloud' })).toBe(true);
  });

  it('detects S/4HANA by installed components', () => {
    expect(isS4Hana({
      installedComponents: [{ COMPONENT: 'S4CORE', RELEASE: '106' }],
    })).toBe(true);
  });

  it('detects S/4HANA by table existence heuristic', () => {
    expect(isS4Hana({ tableExists: { ACDOCA: true, VBUK: false } })).toBe(true);
    // ECC pattern: no ACDOCA
    expect(isS4Hana({ tableExists: { ACDOCA: false, VBUK: true } })).toBe(false);
  });

  it('returns false for a plain ECC system', () => {
    expect(isS4Hana({ component: 'SAP ECC 6.0', release: '617' })).toBe(false);
  });
});

// ===========================================================================
// adaptConfigForS4()
// ===========================================================================

describe('adaptConfigForS4()', () => {
  it('returns input as-is for null/undefined', () => {
    expect(adaptConfigForS4(null)).toBeNull();
    expect(adaptConfigForS4(undefined)).toBeUndefined();
  });

  it('removes ECC-only tables from O2C (VBUK, VBUP)', () => {
    const adapted = adaptConfigForS4(PROCESS_CONFIGS.O2C);
    expect(adapted.tables.VBUK).toBeUndefined();
    expect(adapted.tables.VBUP).toBeUndefined();
    // Other tables remain
    expect(adapted.tables.VBAK).toBeDefined();
    expect(adapted.tables.LIKP).toBeDefined();
  });

  it('replaces FAGLFLEXA with ACDOCA for R2R', () => {
    const adapted = adaptConfigForS4(PROCESS_CONFIGS.R2R);
    expect(adapted.tables.FAGLFLEXA).toBeUndefined();
    // ACDOCA already exists in R2R, so FAGLFLEXA should just be removed
    expect(adapted.tables.ACDOCA).toBeDefined();
  });

  it('marks the result with _s4adapted flag', () => {
    const adapted = adaptConfigForS4(PROCESS_CONFIGS.O2C);
    expect(adapted._s4adapted).toBe(true);
  });

  it('does not mutate the original config', () => {
    const originalTableCount = Object.keys(PROCESS_CONFIGS.O2C.tables).length;
    adaptConfigForS4(PROCESS_CONFIGS.O2C);
    expect(Object.keys(PROCESS_CONFIGS.O2C.tables)).toHaveLength(originalTableCount);
    expect(PROCESS_CONFIGS.O2C.tables.VBUK).toBeDefined();
  });

  it('applies S/4 field migrations for O2C', () => {
    const adapted = adaptConfigForS4(PROCESS_CONFIGS.O2C);
    // VBUK.GBSTK -> VBAK.GBSTK means VBAK should now include GBSTK
    const vbakFields = adapted.tables.VBAK.fields;
    expect(vbakFields).toContain('GBSTK');
  });

  it('P2P has no table replacements but keeps tables', () => {
    const adapted = adaptConfigForS4(PROCESS_CONFIGS.P2P);
    expect(adapted.tables.EKKO).toBeDefined();
    expect(adapted.tables.EBAN).toBeDefined();
    expect(adapted._s4adapted).toBe(true);
  });
});

// ===========================================================================
// Process-specific validations
// ===========================================================================

describe('O2C specific config', () => {
  const o2c = PROCESS_CONFIGS.O2C;

  it('has correct name and description', () => {
    expect(o2c.name).toBe('Order to Cash');
    expect(o2c.description).toContain('sales');
  });

  it('primary caseId is VBAK.VBELN', () => {
    expect(o2c.caseId.primary.table).toBe('VBAK');
    expect(o2c.caseId.primary.field).toBe('VBELN');
  });

  it('has correlations linking to delivery, billing, and accounting', () => {
    const corrTables = o2c.caseId.correlations.map(c => c.table);
    expect(corrTables).toContain('VBFA');
    expect(corrTables).toContain('LIKP');
    expect(corrTables).toContain('VBRK');
    expect(corrTables).toContain('BKPF');
  });

  it('has KPIs including standard O2C metrics', () => {
    expect(o2c.kpis['Order to Delivery Time']).toBeDefined();
    expect(o2c.kpis['Days Sales Outstanding']).toBeDefined();
    expect(o2c.kpis['Order to Cash Cycle']).toBeDefined();
  });

  it('has s4hana configuration', () => {
    expect(o2c.s4hana).toBeDefined();
    expect(o2c.s4hana.tableReplacements).toBeDefined();
    expect(o2c.s4hana.tableReplacements.VBUK).toBeNull();
    expect(o2c.s4hana.tableReplacements.VBUP).toBeNull();
  });

  it('has enrichment configuration', () => {
    expect(o2c.enrichment).toBeDefined();
    expect(o2c.enrichment.KNA1).toBeDefined();
    expect(o2c.enrichment.KNA1.joinField).toBe('KUNNR');
  });
});

describe('P2P specific config', () => {
  it('primary caseId is EKKO.EBELN', () => {
    expect(PROCESS_CONFIGS.P2P.caseId.primary.table).toBe('EKKO');
    expect(PROCESS_CONFIGS.P2P.caseId.primary.field).toBe('EBELN');
  });
});

describe('R2R specific config', () => {
  it('includes both FAGLFLEXA (ECC) and ACDOCA (S/4) tables', () => {
    const tables = getTablesForProcess('R2R');
    expect(tables).toContain('FAGLFLEXA');
    expect(tables).toContain('ACDOCA');
  });

  it('FAGLFLEXA is marked ecc_only', () => {
    expect(PROCESS_CONFIGS.R2R.tables.FAGLFLEXA.ecc_only).toBe(true);
  });
});
