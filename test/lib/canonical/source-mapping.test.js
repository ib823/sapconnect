/**
 * Tests for source-mapping
 */

const { getMappings, getSourceSystems } = require('../../../lib/canonical/source-mapping');
const { CanonicalMappingError } = require('../../../lib/errors');

describe('Source Mapping', () => {
  describe('getSourceSystems()', () => {
    it('returns all five supported source systems', () => {
      const systems = getSourceSystems();
      expect(systems).toContain('SAP');
      expect(systems).toContain('INFOR_LN');
      expect(systems).toContain('INFOR_M3');
      expect(systems).toContain('INFOR_CSI');
      expect(systems).toContain('INFOR_LAWSON');
      expect(systems.length).toBe(5);
    });
  });

  describe('getMappings()', () => {
    it('throws for unsupported source system', () => {
      expect(() => getMappings('ORACLE', 'Item')).toThrow(CanonicalMappingError);
      expect(() => getMappings('ORACLE', 'Item')).toThrow('Unsupported source system: ORACLE');
    });

    it('returns null for unmapped entity type within a valid system', () => {
      const result = getMappings('SAP', 'NonExistentEntity');
      expect(result).toBeNull();
    });

    // ── SAP Mappings ──────────────────────────────────────────────────

    describe('SAP', () => {
      it('maps MARA fields to Item', () => {
        const mappings = getMappings('SAP', 'Item');
        expect(Array.isArray(mappings)).toBe(true);
        expect(mappings.length).toBeGreaterThan(0);

        const matnrMap = mappings.find(m => m.source === 'MATNR');
        expect(matnrMap).toBeDefined();
        expect(matnrMap.target).toBe('itemId');

        const meinsMap = mappings.find(m => m.source === 'MEINS');
        expect(meinsMap.target).toBe('baseUom');
      });

      it('maps KNA1 fields to Customer', () => {
        const mappings = getMappings('SAP', 'Customer');
        expect(mappings.find(m => m.source === 'KUNNR').target).toBe('customerId');
        expect(mappings.find(m => m.source === 'NAME1').target).toBe('name');
        expect(mappings.find(m => m.source === 'LAND1').target).toBe('country');
        expect(mappings.find(m => m.source === 'SMTP_ADDR').target).toBe('email');
      });

      it('maps LFA1 fields to Vendor', () => {
        const mappings = getMappings('SAP', 'Vendor');
        expect(mappings.find(m => m.source === 'LIFNR').target).toBe('vendorId');
        expect(mappings.find(m => m.source === 'EKORG').target).toBe('purchaseOrg');
      });

      it('maps SKA1 fields to ChartOfAccounts with convert', () => {
        const mappings = getMappings('SAP', 'ChartOfAccounts');
        const gvtypMap = mappings.find(m => m.source === 'GVTYP');
        expect(gvtypMap.target).toBe('accountType');
        expect(typeof gvtypMap.convert).toBe('function');
        expect(gvtypMap.convert('X')).toBe('BS');
        expect(gvtypMap.convert('')).toBe('PL');
      });

      it('has convert functions for numeric SAP fields', () => {
        const mappings = getMappings('SAP', 'Item');
        const brgew = mappings.find(m => m.source === 'BRGEW');
        expect(typeof brgew.convert).toBe('function');
        expect(brgew.convert('12.50')).toBe(12.5);
        expect(brgew.convert('')).toBe(0);
        expect(brgew.convert(null)).toBe(0);
      });

      it('maps SalesOrder, PurchaseOrder, ProductionOrder', () => {
        expect(getMappings('SAP', 'SalesOrder').length).toBeGreaterThan(5);
        expect(getMappings('SAP', 'PurchaseOrder').length).toBeGreaterThan(5);
        expect(getMappings('SAP', 'ProductionOrder').length).toBeGreaterThan(5);
      });

      it('maps Inventory, GlEntry, Employee', () => {
        expect(getMappings('SAP', 'Inventory').length).toBeGreaterThan(3);
        expect(getMappings('SAP', 'GlEntry').length).toBeGreaterThan(5);
        expect(getMappings('SAP', 'Employee').length).toBeGreaterThan(5);
      });

      it('maps Bom, Routing, FixedAsset, CostCenter', () => {
        expect(getMappings('SAP', 'Bom').length).toBeGreaterThan(3);
        expect(getMappings('SAP', 'Routing').length).toBeGreaterThan(2);
        expect(getMappings('SAP', 'FixedAsset').length).toBeGreaterThan(5);
        expect(getMappings('SAP', 'CostCenter').length).toBeGreaterThan(5);
      });
    });

    // ── Infor LN Mappings ─────────────────────────────────────────────

    describe('INFOR_LN', () => {
      it('maps tcibd001 fields to Item', () => {
        const mappings = getMappings('INFOR_LN', 'Item');
        expect(mappings.find(m => m.source === 'T$ITEM').target).toBe('itemId');
        expect(mappings.find(m => m.source === 'T$DSCA').target).toBe('description');
        expect(mappings.find(m => m.source === 'T$CUNI').target).toBe('baseUom');
      });

      it('converts LN item type codes to canonical types', () => {
        const mappings = getMappings('INFOR_LN', 'Item');
        const ctypMap = mappings.find(m => m.source === 'T$CTYP');
        expect(ctypMap.convert(1)).toBe('FERT');
        expect(ctypMap.convert(2)).toBe('HALB');
        expect(ctypMap.convert(3)).toBe('ROH');
        expect(ctypMap.convert(4)).toBe('HIBE');
      });

      it('maps tccom100 to Customer', () => {
        const mappings = getMappings('INFOR_LN', 'Customer');
        expect(mappings.find(m => m.source === 'T$BPID').target).toBe('customerId');
        expect(mappings.find(m => m.source === 'T$NAMA').target).toBe('name');
      });

      it('maps tccom100 (supplier) to Vendor', () => {
        const mappings = getMappings('INFOR_LN', 'Vendor');
        expect(mappings.find(m => m.source === 'T$BPID').target).toBe('vendorId');
      });

      it('maps tfgld010 to ChartOfAccounts with accountType convert', () => {
        const mappings = getMappings('INFOR_LN', 'ChartOfAccounts');
        const actpMap = mappings.find(m => m.source === 'T$ACTP');
        expect(actpMap.convert(1)).toBe('BS');
        expect(actpMap.convert(2)).toBe('PL');
      });
    });

    // ── Infor M3 Mappings ─────────────────────────────────────────────

    describe('INFOR_M3', () => {
      it('maps MITMAS fields to Item', () => {
        const mappings = getMappings('INFOR_M3', 'Item');
        expect(mappings.find(m => m.source === 'MMITNO').target).toBe('itemId');
        expect(mappings.find(m => m.source === 'MMITDS').target).toBe('description');
        expect(mappings.find(m => m.source === 'MMUNMS').target).toBe('baseUom');
      });

      it('converts M3 item type codes to canonical types', () => {
        const mappings = getMappings('INFOR_M3', 'Item');
        const ittyMap = mappings.find(m => m.source === 'MMITTY');
        expect(ittyMap.convert('10')).toBe('FERT');
        expect(ittyMap.convert('20')).toBe('HALB');
        expect(ittyMap.convert('30')).toBe('ROH');
      });

      it('maps CIDMAS to Customer', () => {
        const mappings = getMappings('INFOR_M3', 'Customer');
        expect(mappings.find(m => m.source === 'OKCUNO').target).toBe('customerId');
        expect(mappings.find(m => m.source === 'OKCUNM').target).toBe('name');
        expect(mappings.find(m => m.source === 'OKCSCD').target).toBe('country');
      });

      it('maps CIDVEN to Vendor', () => {
        const mappings = getMappings('INFOR_M3', 'Vendor');
        expect(mappings.find(m => m.source === 'IISUNO').target).toBe('vendorId');
        expect(mappings.find(m => m.source === 'IISUNM').target).toBe('name');
      });

      it('maps FCHACC to ChartOfAccounts', () => {
        const mappings = getMappings('INFOR_M3', 'ChartOfAccounts');
        expect(mappings.find(m => m.source === 'AIAITM').target).toBe('accountNumber');
        expect(mappings.find(m => m.source === 'AIAITX').target).toBe('description');
      });
    });

    // ── Infor CSI Mappings ────────────────────────────────────────────

    describe('INFOR_CSI', () => {
      it('maps SLItems to Item', () => {
        const mappings = getMappings('INFOR_CSI', 'Item');
        expect(mappings.find(m => m.source === 'Item').target).toBe('itemId');
        expect(mappings.find(m => m.source === 'Description').target).toBe('description');
        expect(mappings.find(m => m.source === 'UM').target).toBe('baseUom');
      });

      it('maps SLCustomers to Customer', () => {
        const mappings = getMappings('INFOR_CSI', 'Customer');
        expect(mappings.find(m => m.source === 'CustNum').target).toBe('customerId');
        expect(mappings.find(m => m.source === 'Name').target).toBe('name');
      });

      it('maps SLVendors to Vendor', () => {
        const mappings = getMappings('INFOR_CSI', 'Vendor');
        expect(mappings.find(m => m.source === 'VendNum').target).toBe('vendorId');
      });

      it('maps SLChartOfAccounts to ChartOfAccounts with type convert', () => {
        const mappings = getMappings('INFOR_CSI', 'ChartOfAccounts');
        const typeMap = mappings.find(m => m.source === 'Type');
        expect(typeMap.convert('B')).toBe('BS');
        expect(typeMap.convert('P')).toBe('PL');
      });
    });

    // ── Infor Lawson Mappings ─────────────────────────────────────────

    describe('INFOR_LAWSON', () => {
      it('maps IC11 fields to Item', () => {
        const mappings = getMappings('INFOR_LAWSON', 'Item');
        expect(mappings.find(m => m.source === 'ITEM-NUMBER').target).toBe('itemId');
        expect(mappings.find(m => m.source === 'DESCRIPTION').target).toBe('description');
        expect(mappings.find(m => m.source === 'UM').target).toBe('baseUom');
      });

      it('maps AR01 to Customer', () => {
        const mappings = getMappings('INFOR_LAWSON', 'Customer');
        expect(mappings.find(m => m.source === 'CUSTOMER').target).toBe('customerId');
        expect(mappings.find(m => m.source === 'NAME').target).toBe('name');
      });

      it('maps AP01 to Vendor', () => {
        const mappings = getMappings('INFOR_LAWSON', 'Vendor');
        expect(mappings.find(m => m.source === 'VENDOR').target).toBe('vendorId');
      });

      it('maps GL01 to ChartOfAccounts with type convert', () => {
        const mappings = getMappings('INFOR_LAWSON', 'ChartOfAccounts');
        const typeMap = mappings.find(m => m.source === 'ACCOUNT-TYPE');
        expect(typeMap.convert('B')).toBe('BS');
        expect(typeMap.convert('P')).toBe('PL');
        expect(typeMap.convert('R')).toBe('PL');
      });
    });

    // ── Cross-system consistency ──────────────────────────────────────

    describe('cross-system consistency', () => {
      it('all systems map Item to the same canonical target fields', () => {
        const systems = getSourceSystems();
        for (const system of systems) {
          const mappings = getMappings(system, 'Item');
          expect(mappings).not.toBeNull();
          const targets = mappings.map(m => m.target);
          expect(targets).toContain('itemId');
          expect(targets).toContain('description');
          expect(targets).toContain('baseUom');
        }
      });

      it('all systems map Customer to the same canonical target fields', () => {
        const systems = getSourceSystems();
        for (const system of systems) {
          const mappings = getMappings(system, 'Customer');
          expect(mappings).not.toBeNull();
          const targets = mappings.map(m => m.target);
          expect(targets).toContain('customerId');
          expect(targets).toContain('name');
          expect(targets).toContain('country');
        }
      });

      it('all systems map Vendor to the same canonical target fields', () => {
        const systems = getSourceSystems();
        for (const system of systems) {
          const mappings = getMappings(system, 'Vendor');
          expect(mappings).not.toBeNull();
          const targets = mappings.map(m => m.target);
          expect(targets).toContain('vendorId');
          expect(targets).toContain('name');
          expect(targets).toContain('country');
        }
      });

      it('all systems map ChartOfAccounts to the same canonical target fields', () => {
        const systems = getSourceSystems();
        for (const system of systems) {
          const mappings = getMappings(system, 'ChartOfAccounts');
          expect(mappings).not.toBeNull();
          const targets = mappings.map(m => m.target);
          expect(targets).toContain('accountNumber');
          expect(targets).toContain('description');
          expect(targets).toContain('accountType');
        }
      });

      it('every mapping has source and target fields', () => {
        const systems = getSourceSystems();
        for (const system of systems) {
          // Get entity types that exist for this system
          for (const entityType of ['Item', 'Customer', 'Vendor', 'ChartOfAccounts']) {
            const mappings = getMappings(system, entityType);
            if (!mappings) continue;
            for (const mapping of mappings) {
              expect(mapping.source).toBeDefined();
              expect(typeof mapping.source).toBe('string');
              expect(mapping.target).toBeDefined();
              expect(typeof mapping.target).toBe('string');
            }
          }
        }
      });
    });
  });
});
