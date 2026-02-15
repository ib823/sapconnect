/**
 * Integration tests for canonical data model fromSource flow
 *
 * Tests end-to-end mapping from source system records to canonical entities.
 */

const EntityRegistry = require('../../../lib/canonical/entity-registry');
const Item = require('../../../lib/canonical/entities/item');
const Customer = require('../../../lib/canonical/entities/customer');
const Vendor = require('../../../lib/canonical/entities/vendor');
const ChartOfAccounts = require('../../../lib/canonical/entities/chart-of-accounts');

describe('Canonical Data Model Integration', () => {

  // ── SAP → Canonical ─────────────────────────────────────────────────

  describe('SAP source mapping', () => {
    it('maps SAP MARA record to canonical Item', () => {
      const item = new Item();
      item.fromSource('SAP', {
        MATNR: 'MAT-12345',
        MAKTX: 'Precision Ball Bearing',
        MEINS: 'EA',
        MTART: 'FERT',
        MATKL: 'BEARINGS',
        BRGEW: '0.450',
        NTGEW: '0.380',
        GEWEI: 'KG',
        VOLUM: '0.001',
        VOLEH: 'M3',
        EKGRP: '001',
        DISMM: 'PD',
        DISLS: 'EX',
        EISBE: '500',
      });

      expect(item.data.itemId).toBe('MAT-12345');
      expect(item.data.description).toBe('Precision Ball Bearing');
      expect(item.data.baseUom).toBe('EA');
      expect(item.data.itemType).toBe('FERT');
      expect(item.data.grossWeight).toBe(0.45);
      expect(item.data.netWeight).toBe(0.38);
      expect(item.data.weightUnit).toBe('KG');
      expect(item.data.volume).toBe(0.001);
      expect(item.data.volumeUnit).toBe('M3');
      expect(item.data.purchaseGroup).toBe('001');
      expect(item.data.mrpType).toBe('PD');
      expect(item.data.safetyStock).toBe(500);

      const validation = item.validate();
      expect(validation.valid).toBe(true);
    });

    it('maps SAP KNA1 record to canonical Customer', () => {
      const customer = new Customer();
      customer.fromSource('SAP', {
        KUNNR: '0001000001',
        NAME1: 'Schneider Electric SE',
        NAME2: 'Industrial Division',
        SORTL: 'SCHNEIDER',
        STRAS: 'Boulevard de Bercy 35',
        ORT01: 'Paris',
        PSTLZ: '75012',
        LAND1: 'FR',
        REGIO: 'IDF',
        TELF1: '+33-1-4100-0000',
        SMTP_ADDR: 'contact@se.com',
        STCEG: 'FR12345678901',
        ZTERM: '0030',
        WAERS: 'EUR',
        KTOKD: '0001',
        VKORG: '1000',
        VTWEG: '10',
      });

      expect(customer.data.customerId).toBe('0001000001');
      expect(customer.data.name).toBe('Schneider Electric SE');
      expect(customer.data.name2).toBe('Industrial Division');
      expect(customer.data.country).toBe('FR');
      expect(customer.data.email).toBe('contact@se.com');
      expect(customer.data.paymentTerms).toBe('0030');
      expect(customer.data.salesOrg).toBe('1000');

      const validation = customer.validate();
      expect(validation.valid).toBe(true);
    });

    it('maps SAP LFA1 record to canonical Vendor', () => {
      const vendor = new Vendor();
      vendor.fromSource('SAP', {
        LIFNR: '0002000001',
        NAME1: 'Bosch Rexroth AG',
        STRAS: 'Bahnhofplatz 1',
        ORT01: 'Lohr am Main',
        PSTLZ: '97816',
        LAND1: 'DE',
        TELF1: '+49-9352-18-0',
        ZTERM: '0045',
        WAERS: 'EUR',
        KTOKK: 'KRED',
        EKORG: '1000',
      });

      expect(vendor.data.vendorId).toBe('0002000001');
      expect(vendor.data.name).toBe('Bosch Rexroth AG');
      expect(vendor.data.country).toBe('DE');
      expect(vendor.data.purchaseOrg).toBe('1000');

      const validation = vendor.validate();
      expect(validation.valid).toBe(true);
    });

    it('maps SAP SKA1 record to canonical ChartOfAccounts', () => {
      const coa = new ChartOfAccounts();
      coa.fromSource('SAP', {
        SAKNR: '0010000000',
        TXT50: 'Cash on Hand',
        GVTYP: 'X',
        KTOKS: '1000',
        XBILK: 'X',
        WAERS: 'USD',
        MWSKZ: 'V0',
        MITKZ: '',
      });

      expect(coa.data.accountNumber).toBe('0010000000');
      expect(coa.data.description).toBe('Cash on Hand');
      expect(coa.data.accountType).toBe('BS');
      expect(coa.data.balanceSheetIndicator).toBe('X');
      expect(coa.data.currency).toBe('USD');

      const validation = coa.validate();
      expect(validation.valid).toBe(true);
    });
  });

  // ── Infor LN → Canonical ────────────────────────────────────────────

  describe('Infor LN source mapping', () => {
    it('maps LN tcibd001 record to canonical Item', () => {
      const item = new Item();
      item.fromSource('INFOR_LN', {
        'T$ITEM': 'LN-ITEM-001',
        'T$DSCA': 'Hydraulic Cylinder Assembly',
        'T$CUNI': 'PC',
        'T$CTYP': 1,
        'T$CITG': 'HYDRAUL',
        'T$GRWE': '25.0',
        'T$NEWE': '22.5',
        'T$WUNI': 'KG',
      });

      expect(item.data.itemId).toBe('LN-ITEM-001');
      expect(item.data.description).toBe('Hydraulic Cylinder Assembly');
      expect(item.data.baseUom).toBe('PC');
      expect(item.data.itemType).toBe('FERT');
      expect(item.data.grossWeight).toBe(25.0);
      expect(item.data.netWeight).toBe(22.5);

      const validation = item.validate();
      expect(validation.valid).toBe(true);
    });

    it('maps LN tccom100 record to canonical Customer', () => {
      const customer = new Customer();
      customer.fromSource('INFOR_LN', {
        'T$BPID': 'BP-10001',
        'T$NAMA': 'Volvo Trucks',
        'T$NAMB': 'Gothenburg Plant',
        'T$SEAK': 'VOLVO',
        'T$LNAD': 'Gropegardsgatan 2',
        'T$LNCI': 'Gothenburg',
        'T$LNPC': '405 08',
        'T$LNCC': 'SE',
        'T$TELP': '+46-31-660000',
        'T$EMAL': 'procurement@volvo.com',
        'T$CCUR': 'SEK',
      });

      expect(customer.data.customerId).toBe('BP-10001');
      expect(customer.data.name).toBe('Volvo Trucks');
      expect(customer.data.country).toBe('SE');
      expect(customer.data.currency).toBe('SEK');

      const validation = customer.validate();
      expect(validation.valid).toBe(true);
    });
  });

  // ── Infor M3 → Canonical ────────────────────────────────────────────

  describe('Infor M3 source mapping', () => {
    it('maps M3 MITMAS record to canonical Item', () => {
      const item = new Item();
      item.fromSource('INFOR_M3', {
        MMITNO: 'M3-MAT-001',
        MMITDS: 'Stainless Steel Flange',
        MMUNMS: 'EA',
        MMITTY: '10',
        MMITGR: 'FLANGE',
        MMGRWE: '3.2',
        MMNEWE: '2.8',
        MMWUOM: 'KG',
        MMVOL3: '0.0025',
        MMVUOM: 'M3',
      });

      expect(item.data.itemId).toBe('M3-MAT-001');
      expect(item.data.description).toBe('Stainless Steel Flange');
      expect(item.data.baseUom).toBe('EA');
      expect(item.data.itemType).toBe('FERT');
      expect(item.data.grossWeight).toBe(3.2);
      expect(item.data.volume).toBe(0.0025);

      const validation = item.validate();
      expect(validation.valid).toBe(true);
    });

    it('maps M3 CIDMAS record to canonical Customer', () => {
      const customer = new Customer();
      customer.fromSource('INFOR_M3', {
        OKCUNO: 'M3-C-001',
        OKCUNM: 'Atlas Copco AB',
        OKCUN2: 'Compressor Division',
        OKALCU: 'ATLAS',
        OKCUA1: 'Sickla Industrivaeg 19',
        OKTOWN: 'Nacka',
        OKPONO: '131 54',
        OKCSCD: 'SE',
        OKECAR: 'AB',
        OKPHNO: '+46-8-743-8000',
        OKMAIL: 'order@atlascopco.com',
        OKTEPY: 'N30',
        OKCUCD: 'SEK',
      });

      expect(customer.data.customerId).toBe('M3-C-001');
      expect(customer.data.name).toBe('Atlas Copco AB');
      expect(customer.data.country).toBe('SE');
      expect(customer.data.email).toBe('order@atlascopco.com');

      const validation = customer.validate();
      expect(validation.valid).toBe(true);
    });

    it('maps M3 CIDVEN record to canonical Vendor', () => {
      const vendor = new Vendor();
      vendor.fromSource('INFOR_M3', {
        IISUNO: 'M3-V-001',
        IISUNM: 'Sandvik Materials',
        IISUN2: 'Coromant Division',
        IIALSU: 'SANDVIK',
        IISUA1: 'Sandviken HQ',
        IITOWN: 'Sandviken',
        IIPONO: '811 81',
        IICSCD: 'SE',
        IIPHNO: '+46-26-260000',
        IIMAIL: 'supply@sandvik.com',
        IITEPY: 'N45',
        IICUCD: 'SEK',
      });

      expect(vendor.data.vendorId).toBe('M3-V-001');
      expect(vendor.data.name).toBe('Sandvik Materials');
      expect(vendor.data.country).toBe('SE');

      const validation = vendor.validate();
      expect(validation.valid).toBe(true);
    });
  });

  // ── Infor CSI → Canonical ───────────────────────────────────────────

  describe('Infor CSI source mapping', () => {
    it('maps CSI SLItems record to canonical Item', () => {
      const item = new Item();
      item.fromSource('INFOR_CSI', {
        Item: 'CSI-001',
        Description: 'Pneumatic Valve Assembly',
        UM: 'EA',
        ProductCode: 'VALV',
        ItemGroup: 'PNEUM',
        UnitWeight: '1.2',
        NetWeight: '1.0',
        WeightUnits: 'LB',
      });

      expect(item.data.itemId).toBe('CSI-001');
      expect(item.data.description).toBe('Pneumatic Valve Assembly');
      expect(item.data.baseUom).toBe('EA');
      expect(item.data.grossWeight).toBe(1.2);
      expect(item.data.netWeight).toBe(1.0);

      const validation = item.validate();
      expect(validation.valid).toBe(true);
    });
  });

  // ── Infor Lawson → Canonical ────────────────────────────────────────

  describe('Infor Lawson source mapping', () => {
    it('maps Lawson IC11 record to canonical Item', () => {
      const item = new Item();
      item.fromSource('INFOR_LAWSON', {
        'ITEM-NUMBER': 'LAW-001',
        'DESCRIPTION': 'Motor Drive Unit',
        'UM': 'EA',
        'ITEM-TYPE': 'FERT',
        'ITEM-GROUP': 'MOTORS',
        'WEIGHT': '15.5',
        'WEIGHT-UM': 'KG',
      });

      expect(item.data.itemId).toBe('LAW-001');
      expect(item.data.description).toBe('Motor Drive Unit');
      expect(item.data.baseUom).toBe('EA');
      expect(item.data.grossWeight).toBe(15.5);

      const validation = item.validate();
      expect(validation.valid).toBe(true);
    });

    it('maps Lawson AR01 record to canonical Customer', () => {
      const customer = new Customer();
      customer.fromSource('INFOR_LAWSON', {
        'CUSTOMER': 'LAW-C-001',
        'NAME': 'Parker Hannifin Corp',
        'ADDRESS-1': '6035 Parkland Blvd',
        'CITY': 'Cleveland',
        'POSTAL-CODE': '44124',
        'COUNTRY': 'US',
        'STATE': 'OH',
        'PHONE-NUMBER': '+1-216-896-3000',
        'EMAIL-ADDRESS': 'info@parker.com',
        'PAY-TERMS': 'N30',
        'CURRENCY': 'USD',
      });

      expect(customer.data.customerId).toBe('LAW-C-001');
      expect(customer.data.name).toBe('Parker Hannifin Corp');
      expect(customer.data.country).toBe('US');
      expect(customer.data.region).toBe('OH');

      const validation = customer.validate();
      expect(validation.valid).toBe(true);
    });
  });

  // ── EntityRegistry + fromSource ─────────────────────────────────────

  describe('registry-driven mapping', () => {
    it('creates entity from registry and maps SAP data', () => {
      const item = EntityRegistry.create('Item');
      item.fromSource('SAP', {
        MATNR: 'REG-001',
        MAKTX: 'Registry Test Item',
        MEINS: 'KG',
      });

      expect(item.entityType).toBe('Item');
      expect(item.data.itemId).toBe('REG-001');
      expect(item.data.description).toBe('Registry Test Item');

      const json = item.toJSON();
      expect(json._entityType).toBe('Item');
      expect(json.itemId).toBe('REG-001');
    });

    it('creates entity from registry and maps Infor M3 data', () => {
      const vendor = EntityRegistry.create('Vendor');
      vendor.fromSource('INFOR_M3', {
        IISUNO: 'REG-V-001',
        IISUNM: 'Registry Test Vendor',
        IICSCD: 'NO',
      });

      expect(vendor.entityType).toBe('Vendor');
      expect(vendor.data.vendorId).toBe('REG-V-001');
      expect(vendor.data.country).toBe('NO');
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('skips source fields that are undefined', () => {
      const item = new Item();
      item.fromSource('SAP', {
        MATNR: 'EDGE-001',
        MAKTX: 'Edge Case Item',
        MEINS: 'EA',
        // MTART is not provided — should not appear
      });

      expect(item.data.itemId).toBe('EDGE-001');
      expect(item.data.itemType).toBeUndefined();
    });

    it('skips source fields that are null', () => {
      const item = new Item();
      item.fromSource('SAP', {
        MATNR: 'EDGE-002',
        MAKTX: 'Null Test',
        MEINS: 'EA',
        MTART: null,
      });

      expect(item.data.itemType).toBeUndefined();
    });

    it('applies convert function when present', () => {
      const item = new Item();
      item.fromSource('SAP', {
        MATNR: 'EDGE-003',
        MAKTX: 'Convert Test',
        MEINS: 'EA',
        BRGEW: '99.99',
      });

      expect(item.data.grossWeight).toBe(99.99);
      expect(typeof item.data.grossWeight).toBe('number');
    });

    it('handles empty source record', () => {
      const item = new Item();
      item.fromSource('SAP', {});

      // No fields mapped
      expect(Object.keys(item.data).length).toBe(0);
      const validation = item.validate();
      expect(validation.valid).toBe(false);
    });

    it('serializes and validates mapped entity round-trip', () => {
      const customer = new Customer();
      customer.fromSource('SAP', {
        KUNNR: 'RT-001',
        NAME1: 'Round Trip Inc',
        LAND1: 'US',
      });

      const json = customer.toJSON();
      expect(json._entityType).toBe('Customer');
      expect(json.customerId).toBe('RT-001');

      // Create a new entity and set data from serialized
      const customer2 = new Customer();
      const { _entityType, _timestamp, ...fields } = json;
      customer2.data = fields;
      const validation = customer2.validate();
      expect(validation.valid).toBe(true);
    });
  });
});
