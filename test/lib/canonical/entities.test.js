/**
 * Tests for all 14 canonical entity types
 */

const Item            = require('../../../lib/canonical/entities/item');
const Customer        = require('../../../lib/canonical/entities/customer');
const Vendor          = require('../../../lib/canonical/entities/vendor');
const ChartOfAccounts = require('../../../lib/canonical/entities/chart-of-accounts');
const SalesOrder      = require('../../../lib/canonical/entities/sales-order');
const PurchaseOrder   = require('../../../lib/canonical/entities/purchase-order');
const ProductionOrder = require('../../../lib/canonical/entities/production-order');
const Inventory       = require('../../../lib/canonical/entities/inventory');
const GlEntry         = require('../../../lib/canonical/entities/gl-entry');
const Employee        = require('../../../lib/canonical/entities/employee');
const Bom             = require('../../../lib/canonical/entities/bom');
const Routing         = require('../../../lib/canonical/entities/routing');
const FixedAsset      = require('../../../lib/canonical/entities/fixed-asset');
const CostCenter      = require('../../../lib/canonical/entities/cost-center');

// ── Helper: validate entity contract ──────────────────────────────────

function testEntityContract(EntityClass, entityType, requiredFields, sampleData) {
  describe(entityType, () => {
    it('creates with correct entityType', () => {
      const entity = new EntityClass();
      expect(entity.entityType).toBe(entityType);
      expect(entity.data).toEqual({});
    });

    it('declares required fields', () => {
      const entity = new EntityClass();
      const required = entity.getRequiredFields();
      expect(Array.isArray(required)).toBe(true);
      expect(required.length).toBeGreaterThan(0);
      for (const field of requiredFields) {
        expect(required).toContain(field);
      }
    });

    it('declares field definitions for all required fields', () => {
      const entity = new EntityClass();
      const defs = entity.getFieldDefinitions();
      const required = entity.getRequiredFields();
      for (const field of required) {
        expect(defs[field]).toBeDefined();
        expect(defs[field].required).toBe(true);
      }
    });

    it('has type and description for every field definition', () => {
      const entity = new EntityClass();
      const defs = entity.getFieldDefinitions();
      for (const [fieldName, def] of Object.entries(defs)) {
        expect(def.type).toBeDefined();
        expect(['string', 'number', 'date', 'array', 'boolean']).toContain(def.type);
        expect(def.description).toBeDefined();
        expect(typeof def.description).toBe('string');
      }
    });

    it('validates valid data as correct', () => {
      const entity = new EntityClass();
      entity.data = { ...sampleData };
      const result = entity.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates empty data as invalid', () => {
      const entity = new EntityClass();
      const result = entity.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('serializes to JSON with metadata', () => {
      const entity = new EntityClass();
      entity.data = { ...sampleData };
      const json = entity.toJSON();
      expect(json._entityType).toBe(entityType);
      expect(json._timestamp).toBeDefined();
      for (const [key, value] of Object.entries(sampleData)) {
        expect(json[key]).toEqual(value);
      }
    });
  });
}

// ── Entity tests ──────────────────────────────────────────────────────

describe('Canonical Entities', () => {
  testEntityContract(Item, 'Item', ['itemId', 'description', 'baseUom'], {
    itemId: 'MAT-001',
    description: 'Steel Bearing 6205',
    baseUom: 'EA',
    itemType: 'FERT',
    itemGroup: 'BEARINGS',
    grossWeight: 0.35,
    netWeight: 0.30,
    weightUnit: 'KG',
  });

  testEntityContract(Customer, 'Customer', ['customerId', 'name', 'country'], {
    customerId: 'CUST-001',
    name: 'Acme Corp',
    name2: 'Manufacturing Division',
    searchTerm: 'ACME',
    street: '123 Industrial Blvd',
    city: 'Chicago',
    postalCode: '60601',
    country: 'US',
    region: 'IL',
    phone: '+1-312-555-0100',
    email: 'orders@acme.com',
    paymentTerms: 'NT30',
    currency: 'USD',
  });

  testEntityContract(Vendor, 'Vendor', ['vendorId', 'name', 'country'], {
    vendorId: 'VEND-001',
    name: 'Global Supplies Ltd',
    country: 'DE',
    street: 'Industriestr. 42',
    city: 'Stuttgart',
    postalCode: '70173',
    currency: 'EUR',
  });

  testEntityContract(ChartOfAccounts, 'ChartOfAccounts', ['accountNumber', 'description', 'accountType'], {
    accountNumber: '100000',
    description: 'Cash and Cash Equivalents',
    accountType: 'BS',
    accountGroup: '1000',
    balanceSheetIndicator: 'X',
    currency: 'USD',
  });

  testEntityContract(SalesOrder, 'SalesOrder', ['orderNumber', 'orderType', 'customerNumber', 'orderDate', 'currency'], {
    orderNumber: '5000001',
    orderType: 'OR',
    customerNumber: 'CUST-001',
    purchaseOrderNumber: 'PO-EXT-999',
    orderDate: '2025-03-15',
    requestedDeliveryDate: '2025-04-01',
    currency: 'USD',
    salesOrg: '1000',
    distributionChannel: '10',
    division: '00',
    items: [
      { materialNumber: 'MAT-001', quantity: 100, unit: 'EA', netPrice: 12.50, plant: '1000' },
    ],
  });

  testEntityContract(PurchaseOrder, 'PurchaseOrder', ['orderNumber', 'orderType', 'vendorNumber', 'orderDate', 'currency'], {
    orderNumber: '4500001',
    orderType: 'NB',
    vendorNumber: 'VEND-001',
    orderDate: '2025-02-20',
    currency: 'EUR',
    purchaseOrg: '1000',
    purchaseGroup: '001',
    companyCode: '1000',
    items: [
      { materialNumber: 'RAW-100', quantity: 500, unit: 'KG', netPrice: 2.80, plant: '1000', storageLocation: '0001' },
    ],
  });

  testEntityContract(ProductionOrder, 'ProductionOrder', ['orderNumber', 'materialNumber', 'quantity', 'unit', 'plant'], {
    orderNumber: '1000001',
    orderType: 'PP01',
    materialNumber: 'MAT-001',
    quantity: 1000,
    unit: 'EA',
    startDate: '2025-03-01',
    endDate: '2025-03-05',
    plant: '1000',
    status: 'REL',
    routingNumber: 'R-001',
    bomNumber: 'B-001',
  });

  testEntityContract(Inventory, 'Inventory', ['materialNumber', 'plant', 'quantity', 'unit'], {
    materialNumber: 'MAT-001',
    plant: '1000',
    storageLocation: '0001',
    batch: 'B2025-001',
    quantity: 2500,
    unit: 'EA',
    stockType: 'unrestricted',
  });

  testEntityContract(GlEntry, 'GlEntry', ['documentNumber', 'companyCode', 'fiscalYear', 'postingDate', 'currency'], {
    documentNumber: '1900001',
    companyCode: '1000',
    fiscalYear: '2025',
    postingDate: '2025-03-15',
    documentDate: '2025-03-15',
    documentType: 'SA',
    currency: 'USD',
    referenceNumber: 'INV-2025-001',
    headerText: 'Monthly depreciation',
    items: [
      { lineItem: 1, glAccount: '400000', amount: 5000, debitCredit: 'D', costCenter: 'CC-100' },
      { lineItem: 2, glAccount: '700000', amount: 5000, debitCredit: 'C', profitCenter: 'PC-200' },
    ],
  });

  testEntityContract(Employee, 'Employee', ['employeeId', 'firstName', 'lastName'], {
    employeeId: '00001000',
    firstName: 'Jane',
    lastName: 'Smith',
    fullName: 'Jane Smith',
    personnelArea: '1000',
    personnelSubarea: '0001',
    employeeGroup: '1',
    employeeSubgroup: 'U0',
    position: '50000001',
    jobTitle: 'Senior Engineer',
    orgUnit: '00001000',
    costCenter: 'CC-ENG',
    startDate: '2020-06-15',
    email: 'jane.smith@company.com',
  });

  testEntityContract(Bom, 'Bom', ['bomNumber', 'materialNumber', 'plant', 'baseQuantity', 'baseUnit'], {
    bomNumber: '00000001',
    materialNumber: 'MAT-001',
    plant: '1000',
    bomUsage: '1',
    baseQuantity: 1,
    baseUnit: 'EA',
    validFrom: '2025-01-01',
    validTo: '9999-12-31',
    components: [
      { componentMaterial: 'RAW-100', quantity: 2.5, unit: 'KG', itemCategory: 'L', sortString: '0010' },
      { componentMaterial: 'RAW-200', quantity: 1, unit: 'EA', itemCategory: 'L', sortString: '0020' },
    ],
  });

  testEntityContract(Routing, 'Routing', ['routingNumber', 'materialNumber', 'plant'], {
    routingNumber: 'R-000001',
    materialNumber: 'MAT-001',
    plant: '1000',
    routingUsage: '1',
    operations: [
      { operationNumber: '0010', workCenter: 'WC-MILL', controlKey: 'PP01', description: 'Rough milling', setupTime: 30, machineTime: 120, laborTime: 60, timeUnit: 'MIN' },
      { operationNumber: '0020', workCenter: 'WC-LATHE', controlKey: 'PP01', description: 'Finish turning', setupTime: 15, machineTime: 90, laborTime: 45, timeUnit: 'MIN' },
    ],
  });

  testEntityContract(FixedAsset, 'FixedAsset', ['assetNumber', 'description', 'assetClass', 'companyCode'], {
    assetNumber: '000000001000',
    assetSubnumber: '0000',
    description: 'CNC Milling Machine',
    assetClass: '3100',
    capitalizationDate: '2022-07-01',
    companyCode: '1000',
    costCenter: 'CC-PROD',
    quantity: 1,
    serialNumber: 'CNC-2022-0042',
    inventoryNumber: 'INV-M-1000',
  });

  testEntityContract(CostCenter, 'CostCenter', ['costCenterId', 'description', 'companyCode', 'controllingArea'], {
    costCenterId: 'CC-1000',
    description: 'Production Cost Center',
    responsiblePerson: 'J. Smith',
    costCenterCategory: 'F',
    companyCode: '1000',
    controllingArea: '1000',
    profitCenter: 'PC-1000',
    validFrom: '2020-01-01',
    validTo: '9999-12-31',
    currency: 'USD',
  });
});
