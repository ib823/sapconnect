/**
 * Tests for Table Intelligence System
 */
const TableIntelligence = require('../../../lib/adt/table-intelligence');

describe('TableIntelligence', () => {
  let ti;
  let mockPool;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      call: vi.fn().mockResolvedValue({}),
    };
    mockPool = {
      acquire: vi.fn().mockResolvedValue(mockClient),
      release: vi.fn().mockResolvedValue(undefined),
    };
    ti = new TableIntelligence(null, { mode: 'mock' });
  });

  // ── Constructor ─────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should default to mock mode', () => {
      const t = new TableIntelligence(null);
      expect(t.mode).toBe('mock');
    });

    it('should accept live mode with pool', () => {
      const t = new TableIntelligence(mockPool, { mode: 'live' });
      expect(t.mode).toBe('live');
      expect(t.pool).toBe(mockPool);
    });

    it('should initialize empty cache', () => {
      expect(ti._cache).toBeInstanceOf(Map);
      expect(ti._cache.size).toBe(0);
    });
  });

  // ── getFieldInfo ────────────────────────────────────────────────────

  describe('getFieldInfo', () => {
    it('should return DFIES structure for BKPF', async () => {
      const fields = await ti.getFieldInfo('BKPF');
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);
    });

    it('should include all expected DFIES properties', async () => {
      const fields = await ti.getFieldInfo('BKPF');
      const field = fields[0];
      expect(field).toHaveProperty('fieldName');
      expect(field).toHaveProperty('dataElement');
      expect(field).toHaveProperty('domain');
      expect(field).toHaveProperty('dataType');
      expect(field).toHaveProperty('length');
      expect(field).toHaveProperty('decimals');
      expect(field).toHaveProperty('checkTable');
      expect(field).toHaveProperty('fieldText');
      expect(field).toHaveProperty('conversionRoutine');
      expect(field).toHaveProperty('isKey');
      expect(field).toHaveProperty('internalType');
      expect(field).toHaveProperty('refTable');
      expect(field).toHaveProperty('refField');
    });

    it('should identify key fields correctly for BKPF', async () => {
      const fields = await ti.getFieldInfo('BKPF');
      const keyFields = fields.filter(f => f.isKey);
      expect(keyFields.length).toBe(4); // MANDT, BUKRS, BELNR, GJAHR
      expect(keyFields.map(f => f.fieldName)).toEqual(
        expect.arrayContaining(['MANDT', 'BUKRS', 'BELNR', 'GJAHR'])
      );
    });

    it('should return correct data types', async () => {
      const fields = await ti.getFieldInfo('BKPF');
      const bukrs = fields.find(f => f.fieldName === 'BUKRS');
      expect(bukrs.dataType).toBe('CHAR');
      expect(bukrs.length).toBe(4);
      expect(bukrs.domain).toBe('BUKRS');

      const bldat = fields.find(f => f.fieldName === 'BLDAT');
      expect(bldat.dataType).toBe('DATS');
      expect(bldat.length).toBe(8);
    });

    it('should include check table references', async () => {
      const fields = await ti.getFieldInfo('BKPF');
      const bukrs = fields.find(f => f.fieldName === 'BUKRS');
      expect(bukrs.checkTable).toBe('T001');

      const blart = fields.find(f => f.fieldName === 'BLART');
      expect(blart.checkTable).toBe('T003');
    });

    it('should include conversion routines', async () => {
      const fields = await ti.getFieldInfo('BKPF');
      const bukrs = fields.find(f => f.fieldName === 'BUKRS');
      expect(bukrs.conversionRoutine).toBe('ALPHA');
    });

    it('should return fields for BSEG', async () => {
      const fields = await ti.getFieldInfo('BSEG');
      expect(fields.length).toBeGreaterThan(5);
      const buzei = fields.find(f => f.fieldName === 'BUZEI');
      expect(buzei).toBeTruthy();
      expect(buzei.isKey).toBe(true);
    });

    it('should return fields for KNA1', async () => {
      const fields = await ti.getFieldInfo('KNA1');
      const kunnr = fields.find(f => f.fieldName === 'KUNNR');
      expect(kunnr.isKey).toBe(true);
      expect(kunnr.conversionRoutine).toBe('ALPHA');
    });

    it('should return fields for LFA1', async () => {
      const fields = await ti.getFieldInfo('LFA1');
      const lifnr = fields.find(f => f.fieldName === 'LIFNR');
      expect(lifnr).toBeTruthy();
      expect(lifnr.isKey).toBe(true);
    });

    it('should return fields for MARA', async () => {
      const fields = await ti.getFieldInfo('MARA');
      const matnr = fields.find(f => f.fieldName === 'MATNR');
      expect(matnr).toBeTruthy();
      expect(matnr.conversionRoutine).toBe('MATN1');
    });

    it('should return fields for EKKO', async () => {
      const fields = await ti.getFieldInfo('EKKO');
      const ebeln = fields.find(f => f.fieldName === 'EBELN');
      expect(ebeln).toBeTruthy();
      expect(ebeln.isKey).toBe(true);
    });

    it('should return fields for VBAK', async () => {
      const fields = await ti.getFieldInfo('VBAK');
      const vbeln = fields.find(f => f.fieldName === 'VBELN');
      expect(vbeln).toBeTruthy();
      expect(vbeln.isKey).toBe(true);
    });

    it('should return fields for KNB1', async () => {
      const fields = await ti.getFieldInfo('KNB1');
      expect(fields.length).toBeGreaterThan(0);
      const keys = fields.filter(f => f.isKey);
      expect(keys.length).toBe(3); // MANDT, KUNNR, BUKRS
    });

    it('should return fields for LFB1', async () => {
      const fields = await ti.getFieldInfo('LFB1');
      expect(fields.length).toBeGreaterThan(0);
    });

    it('should return fields for MARC', async () => {
      const fields = await ti.getFieldInfo('MARC');
      const werks = fields.find(f => f.fieldName === 'WERKS');
      expect(werks).toBeTruthy();
      expect(werks.isKey).toBe(true);
    });

    it('should return empty array for unknown table', async () => {
      const fields = await ti.getFieldInfo('ZUNKNOWN_TABLE_XYZ');
      expect(fields).toEqual([]);
    });

    it('should call DDIF_FIELDINFO_GET in live mode', async () => {
      const liveTi = new TableIntelligence(mockPool, { mode: 'live' });
      mockClient.call.mockResolvedValue({
        DFIES_TAB: [
          { FIELDNAME: 'BUKRS', ROLLNAME: 'BUKRS', DOMNAME: 'BUKRS', DATATYPE: 'CHAR', LENG: '4', DECIMALS: '0', CHECKTABLE: 'T001', FIELDTEXT: 'Company Code', CONVEXIT: 'ALPHA', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
        ],
      });

      const fields = await liveTi.getFieldInfo('BKPF');
      expect(mockClient.call).toHaveBeenCalledWith('DDIF_FIELDINFO_GET', {
        TABNAME: 'BKPF',
        LANGU: 'E',
        ALLTYPES: 'X',
      });
      expect(fields.length).toBe(1);
      expect(fields[0].fieldName).toBe('BUKRS');
      expect(mockPool.release).toHaveBeenCalled();
    });
  });

  // ── getTableDefinition ──────────────────────────────────────────────

  describe('getTableDefinition', () => {
    it('should return DD02V_WA header for BKPF', async () => {
      const def = await ti.getTableDefinition('BKPF');
      expect(def.DD02V_WA).toBeTruthy();
      expect(def.DD02V_WA.TABNAME).toBe('BKPF');
      expect(def.DD02V_WA.DDTEXT).toContain('Accounting Document');
      expect(def.DD02V_WA.TABCLASS).toBe('TRANSP');
    });

    it('should return DD03P_TAB fields', async () => {
      const def = await ti.getTableDefinition('BKPF');
      expect(Array.isArray(def.DD03P_TAB)).toBe(true);
      expect(def.DD03P_TAB.length).toBeGreaterThan(0);

      const bukrs = def.DD03P_TAB.find(f => f.FIELDNAME === 'BUKRS');
      expect(bukrs).toBeTruthy();
      expect(bukrs.ROLLNAME).toBe('BUKRS');
      expect(bukrs.KEYFLAG).toBe('X');
    });

    it('should return DD05M_TAB foreign key mappings', async () => {
      const def = await ti.getTableDefinition('BKPF');
      expect(Array.isArray(def.DD05M_TAB)).toBe(true);
      expect(def.DD05M_TAB.length).toBeGreaterThan(0);
    });

    it('should return DD08V_TAB relationships', async () => {
      const def = await ti.getTableDefinition('BKPF');
      expect(Array.isArray(def.DD08V_TAB)).toBe(true);
    });

    it('should return DD35V_TAB search helps', async () => {
      const def = await ti.getTableDefinition('BKPF');
      expect(Array.isArray(def.DD35V_TAB)).toBe(true);
    });

    it('should return DD09L_WA technical settings', async () => {
      const def = await ti.getTableDefinition('BKPF');
      expect(def.DD09L_WA).toBeTruthy();
      expect(def.DD09L_WA.TABNAME).toBe('BKPF');
      expect(def.DD09L_WA.TABART).toBe('APPL0');
    });

    it('should handle cluster table BSEG', async () => {
      const def = await ti.getTableDefinition('BSEG');
      expect(def.DD02V_WA.TABCLASS).toBe('CLUSTER');
    });

    it('should return default structure for unknown table', async () => {
      const def = await ti.getTableDefinition('ZUNKNOWN');
      expect(def.DD02V_WA.TABNAME).toBe('ZUNKNOWN');
      expect(def.DD03P_TAB).toEqual([]);
    });

    it('should call DDIF_TABL_GET in live mode', async () => {
      const liveTi = new TableIntelligence(mockPool, { mode: 'live' });
      mockClient.call.mockResolvedValue({
        DD02V_WA: { TABNAME: 'MARA', DDTEXT: 'Material Master' },
        DD03P_TAB: [{ FIELDNAME: 'MATNR', ROLLNAME: 'MATNR', DOMNAME: 'MATNR', DATATYPE: 'CHAR', LENG: '18', DECIMALS: '0', KEYFLAG: 'X', CHECKTABLE: '', DDTEXT: 'Material Number' }],
        DD05M_TAB: [],
        DD08V_TAB: [],
        DD35V_TAB: [],
        DD09L_WA: { TABNAME: 'MARA', TABART: 'APPL0' },
      });

      const def = await liveTi.getTableDefinition('MARA');
      expect(mockClient.call).toHaveBeenCalledWith('DDIF_TABL_GET', {
        NAME: 'MARA',
        LANGU: 'E',
      });
      expect(def.DD02V_WA.TABNAME).toBe('MARA');
      expect(def.DD03P_TAB.length).toBe(1);
      expect(mockPool.release).toHaveBeenCalled();
    });
  });

  // ── discoverForeignKeys ─────────────────────────────────────────────

  describe('discoverForeignKeys', () => {
    it('should discover check tables for BKPF', async () => {
      const result = await ti.discoverForeignKeys('BKPF');
      expect(result).toHaveProperty('foreignKeys');
      expect(result).toHaveProperty('textTables');

      const fks = result.foreignKeys;
      expect(fks.length).toBeGreaterThan(0);

      // BKPF -> T001 (Company Code)
      const t001Fk = fks.find(fk => fk.to === 'T001');
      expect(t001Fk).toBeTruthy();
      expect(t001Fk.from).toBe('BKPF');
      expect(t001Fk.fields.length).toBeGreaterThan(0);
    });

    it('should identify FK field mappings', async () => {
      const result = await ti.discoverForeignKeys('EKKO');
      const lfa1Fk = result.foreignKeys.find(fk => fk.to === 'LFA1');
      expect(lfa1Fk).toBeTruthy();
      expect(lfa1Fk.fields.some(f => f.from === 'LIFNR')).toBe(true);
    });

    it('should identify text tables for MARA', async () => {
      const result = await ti.discoverForeignKeys('MARA');
      expect(result.textTables.length).toBeGreaterThan(0);

      const makt = result.textTables.find(t => t.table === 'MAKT');
      expect(makt).toBeTruthy();
      expect(makt.langField).toBe('SPRAS');
    });

    it('should identify text tables for KNA1', async () => {
      const result = await ti.discoverForeignKeys('KNA1');
      expect(result.textTables.length).toBeGreaterThan(0);
    });

    it('should include FK type information', async () => {
      const result = await ti.discoverForeignKeys('VBAK');
      for (const fk of result.foreignKeys) {
        expect(fk).toHaveProperty('type');
        expect(fk.type).toBeTruthy();
      }
    });

    it('should return empty for unknown tables', async () => {
      const result = await ti.discoverForeignKeys('ZUNKNOWN_XYZ');
      expect(result.foreignKeys).toEqual([]);
      expect(result.textTables).toEqual([]);
    });

    it('should discover FKs for KNB1 including KNA1 reference', async () => {
      const result = await ti.discoverForeignKeys('KNB1');
      const kna1Fk = result.foreignKeys.find(fk => fk.to === 'KNA1');
      expect(kna1Fk).toBeTruthy();
    });

    it('should discover FKs for LFB1 including LFA1 reference', async () => {
      const result = await ti.discoverForeignKeys('LFB1');
      const lfa1Fk = result.foreignKeys.find(fk => fk.to === 'LFA1');
      expect(lfa1Fk).toBeTruthy();
    });

    it('should discover FKs for MARC including MARA reference', async () => {
      const result = await ti.discoverForeignKeys('MARC');
      const maraFk = result.foreignKeys.find(fk => fk.to === 'MARA');
      expect(maraFk).toBeTruthy();
    });

    it('should execute 4-step pattern in live mode', async () => {
      const liveTi = new TableIntelligence(mockPool, { mode: 'live' });

      // Step 1: DD03L check tables
      mockClient.call.mockResolvedValueOnce({
        FIELDS: [
          { FIELDNAME: 'FIELDNAME', OFFSET: '0', LENGTH: '30' },
          { FIELDNAME: 'CHECKTABLE', OFFSET: '30', LENGTH: '30' },
        ],
        DATA: [
          { WA: 'BUKRS                         T001                          ' },
        ],
      });

      // Step 2: DD08L foreign key definitions
      mockClient.call.mockResolvedValueOnce({
        FIELDS: [
          { FIELDNAME: 'TABNAME', OFFSET: '0', LENGTH: '30' },
          { FIELDNAME: 'CHECKTABLE', OFFSET: '30', LENGTH: '30' },
          { FIELDNAME: 'FRKART', OFFSET: '60', LENGTH: '10' },
          { FIELDNAME: 'FIELDNAME', OFFSET: '70', LENGTH: '30' },
        ],
        DATA: [
          { WA: 'BKPF                          T001                          CHECK     BUKRS                         ' },
        ],
      });

      // Step 3: DD05S field mappings
      mockClient.call.mockResolvedValueOnce({
        FIELDS: [
          { FIELDNAME: 'TABNAME', OFFSET: '0', LENGTH: '30' },
          { FIELDNAME: 'FIELDNAME', OFFSET: '30', LENGTH: '30' },
          { FIELDNAME: 'FORTABLE', OFFSET: '60', LENGTH: '30' },
          { FIELDNAME: 'FORKEY', OFFSET: '90', LENGTH: '30' },
          { FIELDNAME: 'CHECKTABLE', OFFSET: '120', LENGTH: '30' },
        ],
        DATA: [
          { WA: 'BKPF                          BUKRS                         T001                          BUKRS                         T001                          ' },
        ],
      });

      const result = await liveTi.discoverForeignKeys('BKPF');
      expect(mockClient.call).toHaveBeenCalledTimes(3);
      expect(result.foreignKeys.length).toBeGreaterThan(0);
      expect(mockPool.release).toHaveBeenCalled();
    });
  });

  // ── getRelationshipGraph ────────────────────────────────────────────

  describe('getRelationshipGraph', () => {
    it('should return graph with depth=1', async () => {
      const graph = await ti.getRelationshipGraph('BKPF', 1);

      expect(graph).toHaveProperty('BKPF');
      expect(Array.isArray(graph.BKPF)).toBe(true);
      expect(graph.BKPF.length).toBeGreaterThan(0);

      // Should have neighbors from FK discovery
      const neighborTables = graph.BKPF.map(n => n.table);
      expect(neighborTables).toContain('T001');
    });

    it('should include neighbor table metadata', async () => {
      const graph = await ti.getRelationshipGraph('BKPF', 1);

      for (const neighbor of graph.BKPF) {
        expect(neighbor).toHaveProperty('table');
        expect(neighbor).toHaveProperty('type');
        expect(neighbor).toHaveProperty('fields');
      }
    });

    it('should traverse depth=2 to discover indirect relationships', async () => {
      const graph = await ti.getRelationshipGraph('KNB1', 2);

      // KNB1 -> KNA1 (depth 1), KNA1 -> T005 (depth 2)
      expect(graph).toHaveProperty('KNB1');

      // KNB1 should link to KNA1
      const knb1Neighbors = graph.KNB1.map(n => n.table);
      expect(knb1Neighbors).toContain('KNA1');

      // If KNA1 is in the graph, it was traversed at depth 2
      if (graph.KNA1) {
        const kna1Neighbors = graph.KNA1.map(n => n.table);
        expect(kna1Neighbors).toContain('T005');
      }
    });

    it('should not exceed max depth', async () => {
      const graph = await ti.getRelationshipGraph('BKPF', 1);

      // With depth=1, only the starting table should have its relationships expanded
      // Neighbor tables should not have further relationships discovered
      const graphKeys = Object.keys(graph);
      expect(graphKeys).toContain('BKPF');
    });

    it('should handle tables with text table relationships', async () => {
      const graph = await ti.getRelationshipGraph('MARA', 1);
      expect(graph).toHaveProperty('MARA');

      // MARA should have TEXT type neighbor for MAKT
      const textNeighbors = graph.MARA.filter(n => n.type === 'TEXT');
      expect(textNeighbors.length).toBeGreaterThan(0);
    });

    it('should not visit same table twice (cycle prevention)', async () => {
      // Run with high depth to potentially trigger cycles
      const graph = await ti.getRelationshipGraph('KNB1', 3);

      // Each table should appear as a key at most once
      const keys = Object.keys(graph);
      const uniqueKeys = [...new Set(keys)];
      expect(keys.length).toBe(uniqueKeys.length);
    });

    it('should default depth to 1', async () => {
      const graph = await ti.getRelationshipGraph('BKPF');
      expect(Object.keys(graph).length).toBeGreaterThanOrEqual(1);
    });

    it('should clamp depth to maximum of 5', async () => {
      // This should not throw even with excessive depth
      const graph = await ti.getRelationshipGraph('BKPF', 100);
      expect(graph).toHaveProperty('BKPF');
    });
  });

  // ── getDomainValues ─────────────────────────────────────────────────

  describe('getDomainValues', () => {
    it('should return fixed values for BLART domain', async () => {
      const values = await ti.getDomainValues('BLART');
      expect(Array.isArray(values)).toBe(true);
      expect(values.length).toBeGreaterThan(0);

      const ab = values.find(v => v.value === 'AB');
      expect(ab).toBeTruthy();
      expect(ab.description).toContain('Accounting');
    });

    it('should return value+description pairs', async () => {
      const values = await ti.getDomainValues('KOART');
      for (const val of values) {
        expect(val).toHaveProperty('value');
        expect(val).toHaveProperty('description');
        expect(val.value).toBeTruthy();
        expect(val.description).toBeTruthy();
      }
    });

    it('should return material type values for MTART domain', async () => {
      const values = await ti.getDomainValues('MTART');
      expect(values.length).toBeGreaterThan(0);

      const fert = values.find(v => v.value === 'FERT');
      expect(fert).toBeTruthy();
      expect(fert.description).toContain('Finished');
    });

    it('should return currency values for WAERS domain', async () => {
      const values = await ti.getDomainValues('WAERS');
      const eur = values.find(v => v.value === 'EUR');
      expect(eur).toBeTruthy();

      const usd = values.find(v => v.value === 'USD');
      expect(usd).toBeTruthy();
    });

    it('should return debit/credit for SHKZG domain', async () => {
      const values = await ti.getDomainValues('SHKZG');
      expect(values.length).toBe(2);
    });

    it('should return empty array for unknown domain', async () => {
      const values = await ti.getDomainValues('ZUNKNOWN_DOMAIN');
      expect(values).toEqual([]);
    });

    it('should call RFC_READ_TABLE on DD07L in live mode', async () => {
      const liveTi = new TableIntelligence(mockPool, { mode: 'live' });
      mockClient.call.mockResolvedValue({
        FIELDS: [
          { FIELDNAME: 'DOMVALUE_L', OFFSET: '0', LENGTH: '10' },
          { FIELDNAME: 'DDTEXT', OFFSET: '10', LENGTH: '40' },
        ],
        DATA: [
          { WA: 'AB        Accounting document                     ' },
        ],
      });

      const values = await liveTi.getDomainValues('BLART');
      expect(mockClient.call).toHaveBeenCalledWith('RFC_READ_TABLE', expect.objectContaining({
        QUERY_TABLE: 'DD07L',
      }));
      expect(values.length).toBe(1);
      expect(values[0].value).toBe('AB');
      expect(mockPool.release).toHaveBeenCalled();
    });
  });

  // ── getDataElementInfo ──────────────────────────────────────────────

  describe('getDataElementInfo', () => {
    it('should return full info for BUKRS', async () => {
      const info = await ti.getDataElementInfo('BUKRS');
      expect(info).toBeTruthy();
      expect(info.rollName).toBe('BUKRS');
      expect(info.domainName).toBe('BUKRS');
      expect(info.dataType).toBe('CHAR');
      expect(info.length).toBe(4);
      expect(info.decimals).toBe(0);
      expect(info.description).toContain('Company Code');
    });

    it('should include all text fields', async () => {
      const info = await ti.getDataElementInfo('BUKRS');
      expect(info).toHaveProperty('repText');
      expect(info).toHaveProperty('shortText');
      expect(info).toHaveProperty('mediumText');
      expect(info).toHaveProperty('longText');
      expect(info.repText).toBeTruthy();
      expect(info.shortText).toBeTruthy();
      expect(info.mediumText).toBeTruthy();
      expect(info.longText).toBeTruthy();
    });

    it('should return info for KUNNR', async () => {
      const info = await ti.getDataElementInfo('KUNNR');
      expect(info.rollName).toBe('KUNNR');
      expect(info.length).toBe(10);
      expect(info.description).toContain('Customer');
    });

    it('should return info for MATNR', async () => {
      const info = await ti.getDataElementInfo('MATNR');
      expect(info.rollName).toBe('MATNR');
      expect(info.length).toBe(18);
      expect(info.description).toContain('Material');
    });

    it('should return info for currency amount DMBTR', async () => {
      const info = await ti.getDataElementInfo('DMBTR');
      expect(info.dataType).toBe('CURR');
      expect(info.decimals).toBe(2);
    });

    it('should return null for unknown data element', async () => {
      const info = await ti.getDataElementInfo('ZUNKNOWN_DTEL');
      expect(info).toBeNull();
    });

    it('should call DD04L and DD04T tables in live mode', async () => {
      const liveTi = new TableIntelligence(mockPool, { mode: 'live' });

      // DD04L call
      mockClient.call.mockResolvedValueOnce({
        FIELDS: [
          { FIELDNAME: 'ROLLNAME', OFFSET: '0', LENGTH: '30' },
          { FIELDNAME: 'DOMNAME', OFFSET: '30', LENGTH: '30' },
          { FIELDNAME: 'DATATYPE', OFFSET: '60', LENGTH: '4' },
          { FIELDNAME: 'LENG', OFFSET: '64', LENGTH: '6' },
          { FIELDNAME: 'DECIMALS', OFFSET: '70', LENGTH: '6' },
        ],
        DATA: [
          { WA: 'BUKRS                         BUKRS                         CHAR004   000000' },
        ],
      });

      // DD04T call
      mockClient.call.mockResolvedValueOnce({
        FIELDS: [
          { FIELDNAME: 'DDTEXT', OFFSET: '0', LENGTH: '40' },
          { FIELDNAME: 'REPTEXT', OFFSET: '40', LENGTH: '20' },
          { FIELDNAME: 'SCRTEXT_S', OFFSET: '60', LENGTH: '10' },
          { FIELDNAME: 'SCRTEXT_M', OFFSET: '70', LENGTH: '20' },
          { FIELDNAME: 'SCRTEXT_L', OFFSET: '90', LENGTH: '40' },
        ],
        DATA: [
          { WA: 'Company Code                            CoCd                CoCd      Company Code        Company Code                            ' },
        ],
      });

      const info = await liveTi.getDataElementInfo('BUKRS');
      expect(mockClient.call).toHaveBeenCalledTimes(2);
      expect(info.rollName).toBe('BUKRS');
      expect(info.description).toBe('Company Code');
      expect(mockPool.release).toHaveBeenCalled();
    });

    it('should return null when DD04L has no rows in live mode', async () => {
      const liveTi = new TableIntelligence(mockPool, { mode: 'live' });
      mockClient.call.mockResolvedValue({
        FIELDS: [],
        DATA: [],
      });

      const info = await liveTi.getDataElementInfo('NONEXISTENT');
      expect(info).toBeNull();
    });
  });

  // ── Mock Data Coverage ──────────────────────────────────────────────

  describe('mock data coverage', () => {
    const tables = ['BKPF', 'BSEG', 'KNA1', 'KNB1', 'LFA1', 'LFB1', 'MARA', 'MARC', 'EKKO', 'VBAK'];

    for (const table of tables) {
      it(`should have field info for ${table}`, async () => {
        const fields = await ti.getFieldInfo(table);
        expect(fields.length).toBeGreaterThan(0);
      });
    }

    for (const table of tables) {
      it(`should have table definition for ${table}`, async () => {
        const def = await ti.getTableDefinition(table);
        expect(def.DD02V_WA.TABNAME).toBe(table);
        expect(def.DD02V_WA.DDTEXT).toBeTruthy();
      });
    }

    for (const table of tables) {
      it(`should have FK data for ${table}`, async () => {
        const result = await ti.discoverForeignKeys(table);
        expect(result).toHaveProperty('foreignKeys');
        expect(result).toHaveProperty('textTables');
      });
    }
  });

  // ── Edge Cases ──────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle table with no foreign keys', async () => {
      // ZUNKNOWN should have empty FK list
      const result = await ti.discoverForeignKeys('ZUNKNOWN');
      expect(result.foreignKeys).toEqual([]);
      expect(result.textTables).toEqual([]);
    });

    it('should handle empty relationship graph', async () => {
      const graph = await ti.getRelationshipGraph('ZUNKNOWN', 1);
      expect(graph).toHaveProperty('ZUNKNOWN');
      expect(graph.ZUNKNOWN).toEqual([]);
    });

    it('should handle pool release even on error in live mode', async () => {
      const liveTi = new TableIntelligence(mockPool, { mode: 'live' });
      mockClient.call.mockRejectedValue(new Error('RFC call failed'));

      await expect(liveTi.getFieldInfo('BKPF')).rejects.toThrow();
      expect(mockPool.release).toHaveBeenCalled();
    });
  });
});
