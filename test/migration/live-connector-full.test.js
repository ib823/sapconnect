const { LiveConnector, OBJECT_SERVICE_MAP } = require('../../migration/live-connector');

const ALL_42_IDS = [
  'GL_BALANCE',
  'GL_ACCOUNT_MASTER',
  'CUSTOMER_OPEN_ITEM',
  'VENDOR_OPEN_ITEM',
  'COST_ELEMENT',
  'ASSET_ACQUISITION',
  'PROFIT_SEGMENT',
  'COST_CENTER',
  'PROFIT_CENTER',
  'INTERNAL_ORDER',
  'WBS_ELEMENT',
  'BUSINESS_PARTNER',
  'MATERIAL_MASTER',
  'PURCHASE_ORDER',
  'SALES_ORDER',
  'PRICING_CONDITION',
  'SOURCE_LIST',
  'SCHEDULING_AGREEMENT',
  'PURCHASE_CONTRACT',
  'BATCH_MASTER',
  'BANK_MASTER',
  'EQUIPMENT_MASTER',
  'FUNCTIONAL_LOCATION',
  'WORK_CENTER',
  'MAINTENANCE_ORDER',
  'PRODUCTION_ORDER',
  'BOM_ROUTING',
  'INSPECTION_PLAN',
  'FIXED_ASSET',
  'EMPLOYEE_MASTER',
  'WAREHOUSE_STRUCTURE',
  'TRANSPORT_ROUTE',
  'TRADE_COMPLIANCE',
  'BW_EXTRACTOR',
  'RFC_DESTINATION',
  'IDOC_CONFIG',
  'WEB_SERVICE',
  'BATCH_JOB',
  'FI_CONFIG',
  'CO_CONFIG',
  'MM_CONFIG',
  'SD_CONFIG',
];

describe('LiveConnector — Full 42/42 Service Mappings', () => {
  let connector;

  beforeEach(() => {
    connector = new LiveConnector({ logLevel: 'error' });
  });

  // ── Map count ───────────────────────────────────────────────────

  describe('OBJECT_SERVICE_MAP completeness', () => {
    it('has exactly 42 entries', () => {
      expect(Object.keys(OBJECT_SERVICE_MAP)).toHaveLength(42);
    });

    it('contains every one of the 42 known object IDs', () => {
      for (const id of ALL_42_IDS) {
        expect(OBJECT_SERVICE_MAP).toHaveProperty(id);
      }
    });

    it('contains no extra/unknown IDs beyond the 42', () => {
      const mapIds = Object.keys(OBJECT_SERVICE_MAP).sort();
      const expected = [...ALL_42_IDS].sort();
      expect(mapIds).toEqual(expected);
    });
  });

  // ── Field shape validation ──────────────────────────────────────

  describe('every entry has required fields with correct types', () => {
    it.each(ALL_42_IDS)('%s has system (source|target)', (id) => {
      expect(OBJECT_SERVICE_MAP[id].system).toMatch(/^(source|target)$/);
    });

    it.each(ALL_42_IDS)('%s has service as non-empty string', (id) => {
      expect(typeof OBJECT_SERVICE_MAP[id].service).toBe('string');
      expect(OBJECT_SERVICE_MAP[id].service.length).toBeGreaterThan(0);
    });

    it.each(ALL_42_IDS)('%s has entitySet as non-empty string', (id) => {
      expect(typeof OBJECT_SERVICE_MAP[id].entitySet).toBe('string');
      expect(OBJECT_SERVICE_MAP[id].entitySet.length).toBeGreaterThan(0);
    });

    it.each(ALL_42_IDS)('%s has version v2 or v4', (id) => {
      expect(OBJECT_SERVICE_MAP[id].version).toMatch(/^v[24]$/);
    });
  });

  // ── System assignment ───────────────────────────────────────────

  describe('system assignment correctness', () => {
    it('GL_BALANCE is source system', () => {
      expect(OBJECT_SERVICE_MAP.GL_BALANCE.system).toBe('source');
    });

    it('GL_ACCOUNT_MASTER is target system', () => {
      expect(OBJECT_SERVICE_MAP.GL_ACCOUNT_MASTER.system).toBe('target');
    });

    it('BUSINESS_PARTNER is target system', () => {
      expect(OBJECT_SERVICE_MAP.BUSINESS_PARTNER.system).toBe('target');
    });

    it('CUSTOMER_OPEN_ITEM is source system', () => {
      expect(OBJECT_SERVICE_MAP.CUSTOMER_OPEN_ITEM.system).toBe('source');
    });

    it('VENDOR_OPEN_ITEM is source system', () => {
      expect(OBJECT_SERVICE_MAP.VENDOR_OPEN_ITEM.system).toBe('source');
    });

    it('BW_EXTRACTOR is source system', () => {
      expect(OBJECT_SERVICE_MAP.BW_EXTRACTOR.system).toBe('source');
    });
  });

  // ── Interface and config objects with RFC transport ─────────────

  describe('RFC transport objects', () => {
    const RFC_OBJECTS = ['RFC_DESTINATION', 'IDOC_CONFIG', 'BATCH_JOB', 'FI_CONFIG', 'CO_CONFIG', 'MM_CONFIG', 'SD_CONFIG'];

    it('RFC_DESTINATION has transport: rfc', () => {
      expect(OBJECT_SERVICE_MAP.RFC_DESTINATION.transport).toBe('rfc');
    });

    it('IDOC_CONFIG has transport: rfc', () => {
      expect(OBJECT_SERVICE_MAP.IDOC_CONFIG.transport).toBe('rfc');
    });

    it('BATCH_JOB has transport: rfc', () => {
      expect(OBJECT_SERVICE_MAP.BATCH_JOB.transport).toBe('rfc');
    });

    it('FI_CONFIG has transport: rfc', () => {
      expect(OBJECT_SERVICE_MAP.FI_CONFIG.transport).toBe('rfc');
    });

    it('CO_CONFIG has transport: rfc', () => {
      expect(OBJECT_SERVICE_MAP.CO_CONFIG.transport).toBe('rfc');
    });

    it('MM_CONFIG has transport: rfc', () => {
      expect(OBJECT_SERVICE_MAP.MM_CONFIG.transport).toBe('rfc');
    });

    it('SD_CONFIG has transport: rfc', () => {
      expect(OBJECT_SERVICE_MAP.SD_CONFIG.transport).toBe('rfc');
    });

    it('all RFC transport objects are source system', () => {
      for (const id of RFC_OBJECTS) {
        expect(OBJECT_SERVICE_MAP[id].system).toBe('source');
      }
    });

    it('non-RFC objects do not have transport field', () => {
      const nonRfc = ALL_42_IDS.filter(id => !RFC_OBJECTS.includes(id));
      for (const id of nonRfc) {
        // WEB_SERVICE does not have transport: rfc
        if (id === 'WEB_SERVICE') continue;
        expect(OBJECT_SERVICE_MAP[id].transport).toBeUndefined();
      }
    });
  });

  // ── Version assignments ─────────────────────────────────────────

  describe('OData version assignments', () => {
    it('GL_ACCOUNT_MASTER uses v4', () => {
      expect(OBJECT_SERVICE_MAP.GL_ACCOUNT_MASTER.version).toBe('v4');
    });

    it('most objects use v2', () => {
      const v2Count = ALL_42_IDS.filter(id => OBJECT_SERVICE_MAP[id].version === 'v2').length;
      expect(v2Count).toBeGreaterThanOrEqual(40);
    });
  });

  // ── LiveConnector.hasMapping for all 42 ─────────────────────────

  describe('hasMapping returns true for all 42 IDs', () => {
    it.each(ALL_42_IDS)('hasMapping("%s") returns true', (id) => {
      expect(connector.hasMapping(id)).toBe(true);
    });

    it('hasMapping returns false for unknown ID', () => {
      expect(connector.hasMapping('DOES_NOT_EXIST')).toBe(false);
      expect(connector.hasMapping('')).toBe(false);
      expect(connector.hasMapping('gl_balance')).toBe(false); // case-sensitive
    });
  });

  // ── LiveConnector.getMapping for all 42 ─────────────────────────

  describe('getMapping returns valid shape for all 42 IDs', () => {
    it.each(ALL_42_IDS)('getMapping("%s") returns correct shape', (id) => {
      const mapping = connector.getMapping(id);
      expect(mapping).not.toBeNull();
      expect(mapping).toHaveProperty('system');
      expect(mapping).toHaveProperty('service');
      expect(mapping).toHaveProperty('entitySet');
      expect(mapping).toHaveProperty('version');
      expect(mapping.system).toMatch(/^(source|target)$/);
      expect(typeof mapping.service).toBe('string');
      expect(typeof mapping.entitySet).toBe('string');
      expect(mapping.version).toMatch(/^v[24]$/);
    });

    it('getMapping returns null for unknown ID', () => {
      expect(connector.getMapping('NONEXISTENT')).toBeNull();
    });

    it('getMapping returns same data as OBJECT_SERVICE_MAP', () => {
      for (const id of ALL_42_IDS) {
        const mapping = connector.getMapping(id);
        expect(mapping).toEqual(OBJECT_SERVICE_MAP[id]);
      }
    });
  });

  // ── Entity set uniqueness ───────────────────────────────────────

  describe('entity set and service naming', () => {
    it('all services are non-empty strings', () => {
      for (const id of ALL_42_IDS) {
        expect(OBJECT_SERVICE_MAP[id].service.trim().length).toBeGreaterThan(0);
      }
    });

    it('all entity sets are non-empty strings', () => {
      for (const id of ALL_42_IDS) {
        expect(OBJECT_SERVICE_MAP[id].entitySet.trim().length).toBeGreaterThan(0);
      }
    });
  });

  // ── Module grouping spot checks ─────────────────────────────────

  describe('module grouping spot checks', () => {
    it('finance objects are present', () => {
      const financeIds = ['GL_BALANCE', 'GL_ACCOUNT_MASTER', 'CUSTOMER_OPEN_ITEM', 'VENDOR_OPEN_ITEM', 'COST_ELEMENT', 'ASSET_ACQUISITION', 'PROFIT_SEGMENT'];
      for (const id of financeIds) {
        expect(OBJECT_SERVICE_MAP[id]).toBeDefined();
      }
    });

    it('controlling objects are present', () => {
      const coIds = ['COST_CENTER', 'PROFIT_CENTER', 'INTERNAL_ORDER', 'WBS_ELEMENT'];
      for (const id of coIds) {
        expect(OBJECT_SERVICE_MAP[id]).toBeDefined();
      }
    });

    it('logistics objects are present', () => {
      const logIds = ['BUSINESS_PARTNER', 'MATERIAL_MASTER', 'PURCHASE_ORDER', 'SALES_ORDER', 'PRICING_CONDITION', 'SOURCE_LIST', 'SCHEDULING_AGREEMENT', 'PURCHASE_CONTRACT', 'BATCH_MASTER', 'BANK_MASTER'];
      for (const id of logIds) {
        expect(OBJECT_SERVICE_MAP[id]).toBeDefined();
      }
    });

    it('plant maintenance objects are present', () => {
      const pmIds = ['EQUIPMENT_MASTER', 'FUNCTIONAL_LOCATION', 'WORK_CENTER', 'MAINTENANCE_ORDER'];
      for (const id of pmIds) {
        expect(OBJECT_SERVICE_MAP[id]).toBeDefined();
      }
    });

    it('production objects are present', () => {
      const ppIds = ['PRODUCTION_ORDER', 'BOM_ROUTING', 'INSPECTION_PLAN'];
      for (const id of ppIds) {
        expect(OBJECT_SERVICE_MAP[id]).toBeDefined();
      }
    });

    it('extended objects are present', () => {
      const extIds = ['WAREHOUSE_STRUCTURE', 'TRANSPORT_ROUTE', 'TRADE_COMPLIANCE', 'BW_EXTRACTOR'];
      for (const id of extIds) {
        expect(OBJECT_SERVICE_MAP[id]).toBeDefined();
      }
    });

    it('interface objects are present', () => {
      const intIds = ['RFC_DESTINATION', 'IDOC_CONFIG', 'WEB_SERVICE', 'BATCH_JOB'];
      for (const id of intIds) {
        expect(OBJECT_SERVICE_MAP[id]).toBeDefined();
      }
    });

    it('configuration objects are present', () => {
      const cfgIds = ['FI_CONFIG', 'CO_CONFIG', 'MM_CONFIG', 'SD_CONFIG'];
      for (const id of cfgIds) {
        expect(OBJECT_SERVICE_MAP[id]).toBeDefined();
      }
    });
  });

  // ── Specific entity set values ──────────────────────────────────

  describe('specific entity set values', () => {
    it('GL_BALANCE entity set is FAGLFLEXT', () => {
      expect(OBJECT_SERVICE_MAP.GL_BALANCE.entitySet).toBe('FAGLFLEXT');
    });

    it('BUSINESS_PARTNER entity set is A_BusinessPartner', () => {
      expect(OBJECT_SERVICE_MAP.BUSINESS_PARTNER.entitySet).toBe('A_BusinessPartner');
    });

    it('MATERIAL_MASTER entity set is A_Product', () => {
      expect(OBJECT_SERVICE_MAP.MATERIAL_MASTER.entitySet).toBe('A_Product');
    });

    it('PURCHASE_ORDER entity set is A_PurchaseOrder', () => {
      expect(OBJECT_SERVICE_MAP.PURCHASE_ORDER.entitySet).toBe('A_PurchaseOrder');
    });

    it('SALES_ORDER entity set is A_SalesOrder', () => {
      expect(OBJECT_SERVICE_MAP.SALES_ORDER.entitySet).toBe('A_SalesOrder');
    });

    it('FIXED_ASSET entity set is A_FixedAsset', () => {
      expect(OBJECT_SERVICE_MAP.FIXED_ASSET.entitySet).toBe('A_FixedAsset');
    });

    it('COST_CENTER entity set is A_CostCenter', () => {
      expect(OBJECT_SERVICE_MAP.COST_CENTER.entitySet).toBe('A_CostCenter');
    });

    it('PROFIT_CENTER entity set is A_ProfitCenter', () => {
      expect(OBJECT_SERVICE_MAP.PROFIT_CENTER.entitySet).toBe('A_ProfitCenter');
    });
  });
});
