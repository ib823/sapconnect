/**
 * Tests for BAPI Execution Catalog
 */

const { BapiCatalog, BAPI_REGISTRY } = require('../../../lib/greenfield/bapi-catalog');

describe('BapiCatalog', () => {
  let catalog;

  beforeEach(() => {
    catalog = new BapiCatalog(null, { mode: 'mock' });
  });

  describe('createCostCenter', () => {
    it('should return success with cost center details', async () => {
      const result = await catalog.createCostCenter({
        controllingArea: '1000',
        costCenter: 'CC001',
        validFrom: '20240101',
        validTo: '99991231',
        name: 'Test Cost Center',
      });
      expect(result.RETURN[0].TYPE).toBe('S');
      expect(result.COSTCENTERLIST).toBeDefined();
      expect(result.COSTCENTERLIST[0].COSTCENTER).toBe('CC001');
    });

    it('should throw on missing required fields', async () => {
      await expect(catalog.createCostCenter({ controllingArea: '1000' }))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('createProfitCenter', () => {
    it('should return success with profit center', async () => {
      const result = await catalog.createProfitCenter({
        controllingArea: '1000',
        profitCenter: 'PC001',
        validFrom: '20240101',
        validTo: '99991231',
        name: 'Test Profit Center',
      });
      expect(result.RETURN[0].TYPE).toBe('S');
      expect(result.PROFITCENTER).toBe('PC001');
    });

    it('should throw on missing name field', async () => {
      await expect(catalog.createProfitCenter({
        controllingArea: '1000',
        profitCenter: 'PC001',
        validFrom: '20240101',
        validTo: '99991231',
      })).rejects.toThrow('name');
    });
  });

  describe('createInternalOrder', () => {
    it('should return success with generated order ID', async () => {
      const result = await catalog.createInternalOrder({
        orderType: 'KA01',
        controllingArea: '1000',
        description: 'Test Internal Order',
      });
      expect(result.RETURN[0].TYPE).toBe('S');
      expect(result.ORDERID).toBeDefined();
      expect(result.ORDERID).toMatch(/^8\d+$/);
    });
  });

  describe('createGlAccount', () => {
    it('should return success for G/L account creation', async () => {
      const result = await catalog.createGlAccount({
        chartOfAccounts: 'CAUS',
        glAccount: '0000100000',
        shortText: 'Test Account',
        accountGroup: 'BS',
      });
      expect(result.RETURN[0].TYPE).toBe('S');
      expect(result.RETURN[0].MESSAGE).toContain('0000100000');
    });
  });

  describe('createExchangeRate', () => {
    it('should return success for exchange rate creation', async () => {
      const result = await catalog.createExchangeRate({
        rateType: 'M',
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        validFrom: '20240101',
        exchangeRate: 1.0856,
      });
      expect(result.RETURN[0].TYPE).toBe('S');
      expect(result.RETURN[0].MESSAGE).toContain('EUR');
    });
  });

  describe('createExchangeRatesBatch', () => {
    it('should return success for batch exchange rate creation', async () => {
      const result = await catalog.createExchangeRatesBatch({
        rates: [
          { rateType: 'M', fromCurrency: 'EUR', toCurrency: 'USD', validFrom: '20240101', exchangeRate: 1.08 },
          { rateType: 'M', fromCurrency: 'GBP', toCurrency: 'USD', validFrom: '20240101', exchangeRate: 1.27 },
        ],
      });
      expect(result.RETURN[0].TYPE).toBe('S');
      expect(result.RETURN[0].MESSAGE).toContain('2');
    });
  });

  describe('createBusinessPartner', () => {
    it('should return success with BP number', async () => {
      const result = await catalog.createBusinessPartner({
        partnerCategory: '1',
        partnerGroup: 'BP01',
        name: 'John Doe',
      });
      expect(result.RETURN[0].TYPE).toBe('S');
      expect(result.BUSINESSPARTNER).toBeDefined();
      expect(result.BUSINESSPARTNER.length).toBeGreaterThan(0);
    });
  });

  describe('createMaterial', () => {
    it('should return success for material creation', async () => {
      const result = await catalog.createMaterial({
        materialNumber: 'MAT-001',
        materialType: 'ROH',
        industryCode: 'M',
        description: 'Test Material',
      });
      expect(result.RETURN[0].TYPE).toBe('S');
      expect(result.RETURN[0].MESSAGE).toContain('MAT-001');
    });
  });

  describe('createPurchaseOrder', () => {
    it('should return success with PO number', async () => {
      const result = await catalog.createPurchaseOrder({
        vendorNumber: '0000001000',
        purchasingOrg: '1000',
        purchasingGroup: '001',
        companyCode: '1000',
        items: [
          { material: 'MAT-001', plant: '1000', quantity: 100, deliveryDate: '20240301', netPrice: 10.50 },
        ],
      });
      expect(result.RETURN[0].TYPE).toBe('S');
      expect(result.PURCHASEORDER).toBeDefined();
      expect(result.PURCHASEORDER).toMatch(/^45\d+$/);
    });
  });

  describe('createSalesOrder', () => {
    it('should return success with sales document number', async () => {
      const result = await catalog.createSalesOrder({
        orderType: 'TA',
        salesOrg: '1000',
        distributionChannel: '10',
        division: '00',
        soldToParty: '0000001000',
        items: [
          { material: 'MAT-001', quantity: 50, plant: '1000' },
        ],
      });
      expect(result.RETURN[0].TYPE).toBe('S');
      expect(result.SALESDOCUMENT).toBeDefined();
      expect(result.SALESDOCUMENT).toMatch(/^00\d+$/);
    });
  });

  describe('createBank', () => {
    it('should return success for bank creation', async () => {
      const result = await catalog.createBank({
        bankCountry: 'US',
        bankKey: '021000021',
        bankName: 'Chase Bank',
      });
      expect(result.RETURN[0].TYPE).toBe('S');
      expect(result.RETURN[0].MESSAGE).toContain('021000021');
    });
  });

  describe('listAvailableBapis', () => {
    it('should return all 11 registered BAPIs', () => {
      const bapis = catalog.listAvailableBapis();
      expect(bapis).toHaveLength(11);
    });

    it('should include method name, function module, and description', () => {
      const bapis = catalog.listAvailableBapis();
      for (const bapi of bapis) {
        expect(bapi.method).toBeDefined();
        expect(bapi.functionModule).toBeDefined();
        expect(bapi.description).toBeDefined();
        expect(bapi.requiredFields).toBeInstanceOf(Array);
        expect(bapi.parameterStructure).toBeDefined();
      }
    });

    it('should include createCostCenter with correct FM name', () => {
      const bapis = catalog.listAvailableBapis();
      const cc = bapis.find(b => b.method === 'createCostCenter');
      expect(cc.functionModule).toBe('BAPI_COSTCENTER_CREATEMULTIPLE');
    });

    it('should include createBusinessPartner with correct FM name', () => {
      const bapis = catalog.listAvailableBapis();
      const bp = bapis.find(b => b.method === 'createBusinessPartner');
      expect(bp.functionModule).toBe('BAPI_BUPA_CREATE_FROM_DATA');
    });
  });

  describe('validateInput', () => {
    it('should accept valid cost center data', () => {
      const result = catalog.validateInput('createCostCenter', {
        controllingArea: '1000',
        costCenter: 'CC001',
        validFrom: '20240101',
        validTo: '99991231',
        name: 'Test',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing required fields', () => {
      const result = catalog.validateInput('createCostCenter', {
        controllingArea: '1000',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('costCenter'))).toBe(true);
    });

    it('should warn on unknown fields', () => {
      const result = catalog.validateInput('createCostCenter', {
        controllingArea: '1000',
        costCenter: 'CC001',
        validFrom: '20240101',
        validTo: '99991231',
        name: 'Test',
        unknownField: 'value',
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('unknownField');
    });

    it('should reject unknown BAPI name', () => {
      const result = catalog.validateInput('nonExistentBapi', { field: 'value' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unknown BAPI');
    });

    it('should reject null data', () => {
      const result = catalog.validateInput('createCostCenter', null);
      expect(result.valid).toBe(false);
    });

    it('should validate date format', () => {
      const result = catalog.validateInput('createCostCenter', {
        controllingArea: '1000',
        costCenter: 'CC001',
        validFrom: 'not-a-date',
        validTo: '99991231',
        name: 'Test',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('date'))).toBe(true);
    });

    it('should warn on exceeding max field length', () => {
      const result = catalog.validateInput('createCostCenter', {
        controllingArea: '1000',
        costCenter: 'CC001',
        validFrom: '20240101',
        validTo: '99991231',
        name: 'This name is way too long for the field limit',
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('exceeds max length'))).toBe(true);
    });

    it('should validate table fields are arrays', () => {
      const result = catalog.validateInput('createExchangeRatesBatch', {
        rates: 'not an array',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('array'))).toBe(true);
    });

    it('should accept empty string required field as missing', () => {
      const result = catalog.validateInput('createBank', {
        bankCountry: 'US',
        bankKey: '',
        bankName: 'Test Bank',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('bankKey'))).toBe(true);
    });
  });

  describe('executeBatch', () => {
    it('should execute multiple operations sequentially', async () => {
      const result = await catalog.executeBatch([
        { bapi: 'createCostCenter', data: { controllingArea: '1000', costCenter: 'CC001', validFrom: '20240101', validTo: '99991231', name: 'CC A' } },
        { bapi: 'createProfitCenter', data: { controllingArea: '1000', profitCenter: 'PC001', validFrom: '20240101', validTo: '99991231', name: 'PC A' } },
      ]);

      expect(result.results).toHaveLength(2);
      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
    });

    it('should continue on error and report failures', async () => {
      const result = await catalog.executeBatch([
        { bapi: 'createCostCenter', data: { controllingArea: '1000', costCenter: 'CC001', validFrom: '20240101', validTo: '99991231', name: 'CC A' } },
        { bapi: 'createCostCenter', data: {} }, // Missing required fields
        { bapi: 'createBank', data: { bankCountry: 'US', bankKey: '001', bankName: 'Bank A' } },
      ]);

      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(1);
      expect(result.summary.errors).toHaveLength(1);
      expect(result.summary.errors[0].index).toBe(1);
    });

    it('should reject unknown BAPI names in batch', async () => {
      const result = await catalog.executeBatch([
        { bapi: 'nonExistentMethod', data: { field: 'value' } },
      ]);

      expect(result.summary.failed).toBe(1);
      expect(result.results[0].success).toBe(false);
    });

    it('should reject operations without bapi or data', async () => {
      const result = await catalog.executeBatch([
        { data: { field: 'value' } },
      ]);

      expect(result.summary.failed).toBe(1);
      expect(result.results[0].error).toContain('bapi');
    });

    it('should throw on empty operations array', async () => {
      await expect(catalog.executeBatch([])).rejects.toThrow('non-empty array');
    });

    it('should throw on non-array input', async () => {
      await expect(catalog.executeBatch('not an array')).rejects.toThrow('non-empty array');
    });

    it('should include index in each result', async () => {
      const result = await catalog.executeBatch([
        { bapi: 'createBank', data: { bankCountry: 'US', bankKey: '001', bankName: 'Bank' } },
        { bapi: 'createBank', data: { bankCountry: 'DE', bankKey: '002', bankName: 'Bank DE' } },
      ]);

      expect(result.results[0].index).toBe(0);
      expect(result.results[1].index).toBe(1);
    });
  });

  describe('BAPI_REGISTRY', () => {
    it('should contain all 11 BAPI definitions', () => {
      expect(Object.keys(BAPI_REGISTRY)).toHaveLength(11);
    });

    it('should have required fields for each BAPI', () => {
      for (const [name, def] of Object.entries(BAPI_REGISTRY)) {
        expect(def.requiredFields).toBeInstanceOf(Array);
        expect(def.requiredFields.length).toBeGreaterThan(0);
        expect(def.name).toBeDefined();
        expect(def.description).toBeDefined();
      }
    });

    it('should have parameterStructure for each BAPI', () => {
      for (const [name, def] of Object.entries(BAPI_REGISTRY)) {
        expect(def.parameterStructure).toBeDefined();
        expect(typeof def.parameterStructure).toBe('object');
      }
    });
  });

  describe('constructor', () => {
    it('should accept FunctionCaller instance', () => {
      const { FunctionCaller } = require('../../../lib/rfc/function-caller');
      const mockPool = { acquire: vi.fn(), release: vi.fn() };
      const fc = new FunctionCaller(mockPool);
      const cat = new BapiCatalog(fc, { mode: 'mock' });
      expect(cat.caller).toBe(fc);
    });

    it('should accept RFC pool and create FunctionCaller', () => {
      const mockPool = { acquire: vi.fn(), release: vi.fn() };
      const cat = new BapiCatalog(mockPool, { mode: 'mock' });
      expect(cat.caller).toBeDefined();
    });

    it('should handle null input gracefully', () => {
      const cat = new BapiCatalog(null, { mode: 'mock' });
      expect(cat.caller).toBeNull();
    });
  });

  describe('mock response uniqueness', () => {
    it('should generate unique document numbers across calls', async () => {
      const r1 = await catalog.createInternalOrder({
        orderType: 'KA01', controllingArea: '1000', description: 'Order 1',
      });
      const r2 = await catalog.createInternalOrder({
        orderType: 'KA01', controllingArea: '1000', description: 'Order 2',
      });
      expect(r1.ORDERID).not.toBe(r2.ORDERID);
    });

    it('should generate unique PO numbers', async () => {
      const r1 = await catalog.createPurchaseOrder({
        vendorNumber: '1000', purchasingOrg: '1000', purchasingGroup: '001',
        companyCode: '1000', items: [{ material: 'M1', plant: '1000', quantity: 10 }],
      });
      const r2 = await catalog.createPurchaseOrder({
        vendorNumber: '2000', purchasingOrg: '1000', purchasingGroup: '001',
        companyCode: '1000', items: [{ material: 'M2', plant: '1000', quantity: 20 }],
      });
      expect(r1.PURCHASEORDER).not.toBe(r2.PURCHASEORDER);
    });
  });
});
