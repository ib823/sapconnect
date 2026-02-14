/**
 * BAPI Execution Catalog
 *
 * Wraps FunctionCaller with pre-configured BAPI signatures for greenfield
 * data loading. Provides both mock and live execution modes with input
 * validation against known BAPI parameter structures.
 */

const Logger = require('../logger');
const { FunctionCaller } = require('../rfc/function-caller');

/**
 * BAPI registry: definitions of all supported BAPIs, their SAP function
 * module names, required fields, parameter structures, and mock generators.
 */
const BAPI_REGISTRY = {
  createCostCenter: {
    name: 'BAPI_COSTCENTER_CREATEMULTIPLE',
    description: 'Create one or more cost centers',
    requiredFields: ['controllingArea', 'costCenter', 'validFrom', 'validTo', 'name'],
    parameterStructure: {
      controllingArea: { sapField: 'CO_AREA', type: 'CHAR', length: 4 },
      costCenter: { sapField: 'COSTCENTER', type: 'CHAR', length: 10 },
      validFrom: { sapField: 'VALID_FROM', type: 'DATE', length: 8 },
      validTo: { sapField: 'VALID_TO', type: 'DATE', length: 8 },
      name: { sapField: 'NAME', type: 'CHAR', length: 20 },
      description: { sapField: 'DESCRIPT', type: 'CHAR', length: 40 },
      personResponsible: { sapField: 'PERSON_IN_CHARGE', type: 'CHAR', length: 20 },
      department: { sapField: 'DEPARTMENT', type: 'CHAR', length: 12 },
      costCenterType: { sapField: 'COSTCENTER_TYPE', type: 'CHAR', length: 1 },
      hierarchyGroup: { sapField: 'COSTCENTER_HIERGRP', type: 'CHAR', length: 12 },
      companyCode: { sapField: 'COMP_CODE', type: 'CHAR', length: 4 },
      currency: { sapField: 'CURRENCY', type: 'CUKY', length: 5 },
      profitCenter: { sapField: 'PROFIT_CTR', type: 'CHAR', length: 10 },
    },
  },

  createProfitCenter: {
    name: 'BAPI_PROFITCENTER_CREATE',
    description: 'Create a profit center with transaction commit',
    requiredFields: ['controllingArea', 'profitCenter', 'validFrom', 'validTo', 'name'],
    parameterStructure: {
      controllingArea: { sapField: 'CO_AREA', type: 'CHAR', length: 4 },
      profitCenter: { sapField: 'PROFIT_CTR', type: 'CHAR', length: 10 },
      validFrom: { sapField: 'VALID_FROM', type: 'DATE', length: 8 },
      validTo: { sapField: 'VALID_TO', type: 'DATE', length: 8 },
      name: { sapField: 'LONG_TEXT', type: 'CHAR', length: 40 },
      description: { sapField: 'DESCRIPT', type: 'CHAR', length: 40 },
      department: { sapField: 'DEPARTMENT', type: 'CHAR', length: 12 },
      personResponsible: { sapField: 'PERSON_IN_CHARGE', type: 'CHAR', length: 20 },
      companyCode: { sapField: 'COMP_CODE', type: 'CHAR', length: 4 },
      hierarchyGroup: { sapField: 'HIER_GROUP', type: 'CHAR', length: 12 },
    },
  },

  createInternalOrder: {
    name: 'BAPI_INTERNALORDER_CREATE',
    description: 'Create an internal order',
    requiredFields: ['orderType', 'controllingArea', 'description'],
    parameterStructure: {
      orderType: { sapField: 'ORDER_TYPE', type: 'CHAR', length: 4 },
      controllingArea: { sapField: 'CO_AREA', type: 'CHAR', length: 4 },
      description: { sapField: 'DESCRIPTION', type: 'CHAR', length: 40 },
      companyCode: { sapField: 'COMP_CODE', type: 'CHAR', length: 4 },
      objectClass: { sapField: 'OBJECT_CLASS', type: 'CHAR', length: 2 },
      currency: { sapField: 'CURRENCY', type: 'CUKY', length: 5 },
      responsibleCostCenter: { sapField: 'RESP_CCTR', type: 'CHAR', length: 10 },
      profitCenter: { sapField: 'PROFIT_CTR', type: 'CHAR', length: 10 },
    },
  },

  createGlAccount: {
    name: 'BAPI_GL_ACCOUNT_CREATE',
    description: 'Create a G/L account in chart of accounts and company code',
    requiredFields: ['chartOfAccounts', 'glAccount', 'shortText', 'accountGroup'],
    parameterStructure: {
      chartOfAccounts: { sapField: 'CHART_OF_ACCOUNTS', type: 'CHAR', length: 4 },
      glAccount: { sapField: 'GL_ACCOUNT', type: 'CHAR', length: 10 },
      shortText: { sapField: 'SHORT_TEXT', type: 'CHAR', length: 20 },
      longText: { sapField: 'LONG_TEXT', type: 'CHAR', length: 50 },
      accountGroup: { sapField: 'ACCT_GROUP', type: 'CHAR', length: 4 },
      plBsIndicator: { sapField: 'PL_BS_IND', type: 'CHAR', length: 1 },
      companyCode: { sapField: 'COMP_CODE', type: 'CHAR', length: 4 },
      currency: { sapField: 'CURRENCY', type: 'CUKY', length: 5 },
      taxCategory: { sapField: 'TAX_CATEGORY', type: 'CHAR', length: 2 },
      fieldStatus: { sapField: 'FIELD_STATUS', type: 'CHAR', length: 4 },
    },
  },

  createExchangeRate: {
    name: 'BAPI_EXCHANGERATE_CREATE',
    description: 'Create a single exchange rate',
    requiredFields: ['rateType', 'fromCurrency', 'toCurrency', 'validFrom', 'exchangeRate'],
    parameterStructure: {
      rateType: { sapField: 'RATE_TYPE', type: 'CHAR', length: 4 },
      fromCurrency: { sapField: 'FROM_CURR', type: 'CUKY', length: 5 },
      toCurrency: { sapField: 'TO_CURR', type: 'CUKY', length: 5 },
      validFrom: { sapField: 'VALID_FROM', type: 'DATE', length: 8 },
      exchangeRate: { sapField: 'EXCH_RATE', type: 'DEC', length: 12 },
      fromFactor: { sapField: 'FROM_FACTOR', type: 'NUM', length: 5 },
      toFactor: { sapField: 'TO_FACTOR', type: 'NUM', length: 5 },
    },
  },

  createExchangeRatesBatch: {
    name: 'BAPI_EXCHRATE_CREATEMULTIPLE',
    description: 'Create multiple exchange rates in a batch',
    requiredFields: ['rates'],
    parameterStructure: {
      rates: {
        sapField: 'EXCHRATE_LIST',
        type: 'TABLE',
        rowFields: {
          rateType: { sapField: 'RATE_TYPE', type: 'CHAR', length: 4 },
          fromCurrency: { sapField: 'FROM_CURR', type: 'CUKY', length: 5 },
          toCurrency: { sapField: 'TO_CURR', type: 'CUKY', length: 5 },
          validFrom: { sapField: 'VALID_FROM', type: 'DATE', length: 8 },
          exchangeRate: { sapField: 'EXCH_RATE', type: 'DEC', length: 12 },
        },
      },
    },
  },

  createBusinessPartner: {
    name: 'BAPI_BUPA_CREATE_FROM_DATA',
    description: 'Create a business partner (multi-step with role assignment and commit)',
    requiredFields: ['partnerCategory', 'partnerGroup', 'name'],
    parameterStructure: {
      partnerCategory: { sapField: 'PARTNER_CATEGORY', type: 'CHAR', length: 1 },
      partnerGroup: { sapField: 'PARTNER_GROUP', type: 'CHAR', length: 4 },
      name: { sapField: 'NAME_FIRST', type: 'CHAR', length: 40 },
      lastName: { sapField: 'NAME_LAST', type: 'CHAR', length: 40 },
      organizationName: { sapField: 'NAME_ORG1', type: 'CHAR', length: 40 },
      title: { sapField: 'TITLE', type: 'CHAR', length: 4 },
      searchTerm: { sapField: 'SEARCHTERM1', type: 'CHAR', length: 20 },
      street: { sapField: 'STREET', type: 'CHAR', length: 60 },
      city: { sapField: 'CITY', type: 'CHAR', length: 40 },
      postalCode: { sapField: 'POSTL_CODE', type: 'CHAR', length: 10 },
      country: { sapField: 'COUNTRY', type: 'CHAR', length: 3 },
      role: { sapField: 'ROLE', type: 'CHAR', length: 6 },
    },
  },

  createMaterial: {
    name: 'BAPI_MATERIAL_SAVEDATA',
    description: 'Create or change a material master',
    requiredFields: ['materialNumber', 'materialType', 'industryCode', 'description'],
    parameterStructure: {
      materialNumber: { sapField: 'MATERIAL', type: 'CHAR', length: 18 },
      materialType: { sapField: 'MATL_TYPE', type: 'CHAR', length: 4 },
      industryCode: { sapField: 'IND_SECTOR', type: 'CHAR', length: 1 },
      description: { sapField: 'MATL_DESC', type: 'CHAR', length: 40 },
      baseUnit: { sapField: 'BASE_UOM', type: 'UNIT', length: 3 },
      materialGroup: { sapField: 'MATL_GROUP', type: 'CHAR', length: 9 },
      plant: { sapField: 'PLANT', type: 'CHAR', length: 4 },
      storageLocation: { sapField: 'STGE_LOC', type: 'CHAR', length: 4 },
      salesOrg: { sapField: 'SALES_ORG', type: 'CHAR', length: 4 },
      distributionChannel: { sapField: 'DISTR_CHAN', type: 'CHAR', length: 2 },
      weight: { sapField: 'GROSS_WT', type: 'DEC', length: 13 },
      weightUnit: { sapField: 'UNIT_OF_WT', type: 'UNIT', length: 3 },
      extensionData: { sapField: 'EXTENSIONIN', type: 'TABLE', length: 0 },
    },
  },

  createPurchaseOrder: {
    name: 'BAPI_PO_CREATE1',
    description: 'Create a purchase order',
    requiredFields: ['vendorNumber', 'purchasingOrg', 'purchasingGroup', 'companyCode', 'items'],
    parameterStructure: {
      vendorNumber: { sapField: 'VENDOR', type: 'CHAR', length: 10 },
      purchasingOrg: { sapField: 'PURCH_ORG', type: 'CHAR', length: 4 },
      purchasingGroup: { sapField: 'PUR_GROUP', type: 'CHAR', length: 3 },
      companyCode: { sapField: 'COMP_CODE', type: 'CHAR', length: 4 },
      documentType: { sapField: 'DOC_TYPE', type: 'CHAR', length: 4 },
      items: {
        sapField: 'POITEM',
        type: 'TABLE',
        rowFields: {
          material: { sapField: 'MATERIAL', type: 'CHAR', length: 18 },
          plant: { sapField: 'PLANT', type: 'CHAR', length: 4 },
          quantity: { sapField: 'QUANTITY', type: 'DEC', length: 13 },
          deliveryDate: { sapField: 'DELIV_DATE', type: 'DATE', length: 8 },
          netPrice: { sapField: 'NET_PRICE', type: 'DEC', length: 12 },
        },
      },
    },
  },

  createSalesOrder: {
    name: 'BAPI_SALESORDER_CREATEFROMDAT2',
    description: 'Create a sales order',
    requiredFields: ['orderType', 'salesOrg', 'distributionChannel', 'division', 'soldToParty', 'items'],
    parameterStructure: {
      orderType: { sapField: 'DOC_TYPE', type: 'CHAR', length: 4 },
      salesOrg: { sapField: 'SALES_ORG', type: 'CHAR', length: 4 },
      distributionChannel: { sapField: 'DISTR_CHAN', type: 'CHAR', length: 2 },
      division: { sapField: 'DIVISION', type: 'CHAR', length: 2 },
      soldToParty: { sapField: 'PARTN_NUMB', type: 'CHAR', length: 10 },
      requestedDeliveryDate: { sapField: 'REQ_DATE_H', type: 'DATE', length: 8 },
      purchaseOrderNumber: { sapField: 'PURCH_NO', type: 'CHAR', length: 20 },
      items: {
        sapField: 'ORDER_ITEMS_IN',
        type: 'TABLE',
        rowFields: {
          material: { sapField: 'MATERIAL', type: 'CHAR', length: 18 },
          quantity: { sapField: 'TARGET_QTY', type: 'DEC', length: 13 },
          plant: { sapField: 'PLANT', type: 'CHAR', length: 4 },
          itemCategory: { sapField: 'ITEM_CATEG', type: 'CHAR', length: 4 },
        },
      },
    },
  },

  createBank: {
    name: 'BAPI_BANK_CREATE',
    description: 'Create a bank master record',
    requiredFields: ['bankCountry', 'bankKey', 'bankName'],
    parameterStructure: {
      bankCountry: { sapField: 'BANK_CTRY', type: 'CHAR', length: 3 },
      bankKey: { sapField: 'BANK_KEY', type: 'CHAR', length: 15 },
      bankName: { sapField: 'BANK_NAME', type: 'CHAR', length: 60 },
      city: { sapField: 'CITY', type: 'CHAR', length: 25 },
      swiftCode: { sapField: 'SWIFT_CODE', type: 'CHAR', length: 11 },
      bankGroup: { sapField: 'BANK_GROUP', type: 'CHAR', length: 4 },
      street: { sapField: 'STREET', type: 'CHAR', length: 35 },
      region: { sapField: 'REGION', type: 'CHAR', length: 3 },
      postalCode: { sapField: 'POST_CODE', type: 'CHAR', length: 10 },
    },
  },
};

/**
 * Mock document number generators — produce realistic SAP document numbers.
 */
let _mockCounter = 1000000;
function nextMockNumber(prefix) {
  _mockCounter++;
  return `${prefix || ''}${_mockCounter}`;
}

const MOCK_RESPONSES = {
  createCostCenter: (data) => ({
    RETURN: [{ TYPE: 'S', ID: 'KI', NUMBER: '110', MESSAGE: `Cost center ${data.costCenter} created successfully` }],
    COSTCENTERLIST: [{ COSTCENTER: data.costCenter, CO_AREA: data.controllingArea }],
  }),

  createProfitCenter: (data) => ({
    RETURN: [{ TYPE: 'S', ID: 'KE', NUMBER: '203', MESSAGE: `Profit center ${data.profitCenter} created successfully` }],
    PROFITCENTER: data.profitCenter,
  }),

  createInternalOrder: (data) => ({
    RETURN: [{ TYPE: 'S', ID: 'KO', NUMBER: '001', MESSAGE: `Internal order created` }],
    ORDERID: nextMockNumber('8'),
  }),

  createGlAccount: (data) => ({
    RETURN: [{ TYPE: 'S', ID: 'FS', NUMBER: '001', MESSAGE: `G/L account ${data.glAccount} created` }],
  }),

  createExchangeRate: (data) => ({
    RETURN: [{ TYPE: 'S', ID: 'FX', NUMBER: '001', MESSAGE: `Exchange rate ${data.fromCurrency}/${data.toCurrency} created` }],
  }),

  createExchangeRatesBatch: (data) => ({
    RETURN: [{ TYPE: 'S', ID: 'FX', NUMBER: '002', MESSAGE: `${(data.rates || []).length} exchange rates created` }],
  }),

  createBusinessPartner: (data) => ({
    RETURN: [{ TYPE: 'S', ID: 'BP', NUMBER: '001', MESSAGE: `Business partner created` }],
    BUSINESSPARTNER: nextMockNumber(''),
  }),

  createMaterial: (data) => ({
    RETURN: [{ TYPE: 'S', ID: 'MM', NUMBER: '001', MESSAGE: `Material ${data.materialNumber} created` }],
  }),

  createPurchaseOrder: (data) => ({
    RETURN: [{ TYPE: 'S', ID: 'ME', NUMBER: '001', MESSAGE: `Purchase order created` }],
    PURCHASEORDER: nextMockNumber('45'),
  }),

  createSalesOrder: (data) => ({
    RETURN: [{ TYPE: 'S', ID: 'SD', NUMBER: '001', MESSAGE: `Sales order created` }],
    SALESDOCUMENT: nextMockNumber('00'),
  }),

  createBank: (data) => ({
    RETURN: [{ TYPE: 'S', ID: 'BA', NUMBER: '001', MESSAGE: `Bank ${data.bankKey} created` }],
  }),
};

class BapiCatalog {
  /**
   * @param {object} rfcPoolOrFunctionCaller - RFC pool or FunctionCaller instance
   * @param {object} [options]
   * @param {'mock'|'live'} [options.mode='mock']
   * @param {object} [options.logger]
   */
  constructor(rfcPoolOrFunctionCaller, options = {}) {
    this.mode = options.mode || 'mock';
    this.log = options.logger || new Logger('bapi-catalog');

    if (rfcPoolOrFunctionCaller instanceof FunctionCaller) {
      this.caller = rfcPoolOrFunctionCaller;
    } else if (rfcPoolOrFunctionCaller && typeof rfcPoolOrFunctionCaller.acquire === 'function') {
      this.caller = new FunctionCaller(rfcPoolOrFunctionCaller, { logger: this.log.child('fc') });
    } else {
      this.caller = null;
    }
  }

  /**
   * Create one or more cost centers.
   */
  async createCostCenter(data) {
    this._validateRequiredOrThrow('createCostCenter', data);

    if (this.mode === 'mock') {
      this.log.info('Mock: creating cost center', { costCenter: data.costCenter });
      return MOCK_RESPONSES.createCostCenter(data);
    }

    const inputList = [{
      CO_AREA: data.controllingArea,
      COSTCENTER: data.costCenter,
      VALID_FROM: data.validFrom,
      VALID_TO: data.validTo,
      NAME: data.name,
      DESCRIPT: data.description || '',
      PERSON_IN_CHARGE: data.personResponsible || '',
      DEPARTMENT: data.department || '',
      COSTCENTER_TYPE: data.costCenterType || '',
      COSTCENTER_HIERGRP: data.hierarchyGroup || '',
      COMP_CODE: data.companyCode || '',
      CURRENCY: data.currency || '',
      PROFIT_CTR: data.profitCenter || '',
    }];

    return this.caller.call('BAPI_COSTCENTER_CREATEMULTIPLE', {
      CCINPUTLIST: inputList,
    });
  }

  /**
   * Create a profit center with automatic commit.
   */
  async createProfitCenter(data) {
    this._validateRequiredOrThrow('createProfitCenter', data);

    if (this.mode === 'mock') {
      this.log.info('Mock: creating profit center', { profitCenter: data.profitCenter });
      return MOCK_RESPONSES.createProfitCenter(data);
    }

    return this.caller.callWithCommit('BAPI_PROFITCENTER_CREATE', {
      PROFITCENTER: {
        CO_AREA: data.controllingArea,
        PROFIT_CTR: data.profitCenter,
        VALID_FROM: data.validFrom,
        VALID_TO: data.validTo,
        LONG_TEXT: data.name,
        DESCRIPT: data.description || '',
        DEPARTMENT: data.department || '',
        PERSON_IN_CHARGE: data.personResponsible || '',
        COMP_CODE: data.companyCode || '',
        HIER_GROUP: data.hierarchyGroup || '',
      },
    });
  }

  /**
   * Create an internal order.
   */
  async createInternalOrder(data) {
    this._validateRequiredOrThrow('createInternalOrder', data);

    if (this.mode === 'mock') {
      this.log.info('Mock: creating internal order');
      return MOCK_RESPONSES.createInternalOrder(data);
    }

    return this.caller.callWithCommit('BAPI_INTERNALORDER_CREATE', {
      ORDERDATA: {
        ORDER_TYPE: data.orderType,
        CO_AREA: data.controllingArea,
        DESCRIPTION: data.description,
        COMP_CODE: data.companyCode || '',
        OBJECT_CLASS: data.objectClass || '',
        CURRENCY: data.currency || '',
        RESP_CCTR: data.responsibleCostCenter || '',
        PROFIT_CTR: data.profitCenter || '',
      },
    });
  }

  /**
   * Create a G/L account.
   */
  async createGlAccount(data) {
    this._validateRequiredOrThrow('createGlAccount', data);

    if (this.mode === 'mock') {
      this.log.info('Mock: creating G/L account', { glAccount: data.glAccount });
      return MOCK_RESPONSES.createGlAccount(data);
    }

    return this.caller.callWithCommit('BAPI_GL_ACCOUNT_CREATE', {
      CHART_OF_ACCOUNTS: data.chartOfAccounts,
      GL_ACCOUNT: data.glAccount,
      GL_ACCOUNT_DATA: {
        SHORT_TEXT: data.shortText,
        LONG_TEXT: data.longText || '',
        ACCT_GROUP: data.accountGroup,
        PL_BS_IND: data.plBsIndicator || '',
      },
      COMPANY_CODE_DATA: data.companyCode ? {
        COMP_CODE: data.companyCode,
        CURRENCY: data.currency || '',
        TAX_CATEGORY: data.taxCategory || '',
        FIELD_STATUS: data.fieldStatus || '',
      } : undefined,
    });
  }

  /**
   * Create a single exchange rate.
   */
  async createExchangeRate(data) {
    this._validateRequiredOrThrow('createExchangeRate', data);

    if (this.mode === 'mock') {
      this.log.info('Mock: creating exchange rate', { from: data.fromCurrency, to: data.toCurrency });
      return MOCK_RESPONSES.createExchangeRate(data);
    }

    return this.caller.call('BAPI_EXCHANGERATE_CREATE', {
      RATE_TYPE: data.rateType,
      FROM_CURR: data.fromCurrency,
      TO_CURR: data.toCurrency,
      VALID_FROM: data.validFrom,
      EXCH_RATE: data.exchangeRate,
      FROM_FACTOR: data.fromFactor || 1,
      TO_FACTOR: data.toFactor || 1,
    });
  }

  /**
   * Create multiple exchange rates in a batch.
   */
  async createExchangeRatesBatch(data) {
    this._validateRequiredOrThrow('createExchangeRatesBatch', data);

    if (this.mode === 'mock') {
      this.log.info('Mock: creating exchange rates batch', { count: data.rates.length });
      return MOCK_RESPONSES.createExchangeRatesBatch(data);
    }

    const rateTable = data.rates.map(r => ({
      RATE_TYPE: r.rateType,
      FROM_CURR: r.fromCurrency,
      TO_CURR: r.toCurrency,
      VALID_FROM: r.validFrom,
      EXCH_RATE: r.exchangeRate,
    }));

    return this.caller.call('BAPI_EXCHRATE_CREATEMULTIPLE', {}, {
      EXCHRATE_LIST: rateTable,
    });
  }

  /**
   * Create a business partner with role assignment and commit.
   */
  async createBusinessPartner(data) {
    this._validateRequiredOrThrow('createBusinessPartner', data);

    if (this.mode === 'mock') {
      this.log.info('Mock: creating business partner');
      return MOCK_RESPONSES.createBusinessPartner(data);
    }

    const client = await this.caller.pool.acquire();
    try {
      // Step 1: Create the business partner
      const centralData = {
        PARTNER_CATEGORY: data.partnerCategory,
        PARTNER_GROUP: data.partnerGroup,
      };

      const centralDataOrg = data.partnerCategory === '2' ? {
        NAME1: data.organizationName || data.name,
        SEARCHTERM1: data.searchTerm || (data.organizationName || data.name).substring(0, 20),
      } : undefined;

      const centralDataPerson = data.partnerCategory === '1' ? {
        FIRSTNAME: data.name,
        LASTNAME: data.lastName || '',
        TITLE: data.title || '',
      } : undefined;

      const addressData = {
        STREET: data.street || '',
        CITY: data.city || '',
        POSTL_CODE: data.postalCode || '',
        COUNTRY: data.country || '',
      };

      const createResult = await client.call('BAPI_BUPA_CREATE_FROM_DATA', {
        PARTNERCATEGORY: data.partnerCategory,
        PARTNERGROUP: data.partnerGroup,
        CENTRALDATA: centralData,
        CENTRALDATAPERSON: centralDataPerson,
        CENTRALDATAORGANIZATION: centralDataOrg,
        ADDRESSDATA: addressData,
      });

      const bpNumber = createResult.BUSINESSPARTNER;

      // Step 2: Add role if provided
      if (data.role && bpNumber) {
        await client.call('BAPI_BUPA_ROLE_ADD_2', {
          BUSINESSPARTNER: bpNumber,
          BUSINESSPARTNERROLECATEGORY: data.role,
        });
      }

      // Step 3: Commit
      await client.call('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });

      return createResult;
    } catch (err) {
      try {
        await client.call('BAPI_TRANSACTION_ROLLBACK');
      } catch { /* ignore rollback error */ }
      throw err;
    } finally {
      await this.caller.pool.release(client);
    }
  }

  /**
   * Create or change a material master.
   */
  async createMaterial(data) {
    this._validateRequiredOrThrow('createMaterial', data);

    if (this.mode === 'mock') {
      this.log.info('Mock: creating material', { material: data.materialNumber });
      return MOCK_RESPONSES.createMaterial(data);
    }

    const params = {
      HEADDATA: {
        MATERIAL: data.materialNumber,
        MATL_TYPE: data.materialType,
        IND_SECTOR: data.industryCode,
        BASIC_VIEW: 'X',
      },
      CLIENTDATA: {
        MATL_GROUP: data.materialGroup || '',
        BASE_UOM: data.baseUnit || 'EA',
        GROSS_WT: data.weight || 0,
        UNIT_OF_WT: data.weightUnit || 'KG',
      },
      CLIENTDATAX: {
        MATL_GROUP: data.materialGroup ? 'X' : '',
        BASE_UOM: 'X',
        GROSS_WT: data.weight ? 'X' : '',
        UNIT_OF_WT: data.weightUnit ? 'X' : '',
      },
      MATERIALDESCRIPTION: [{
        LANGU: 'EN',
        MATL_DESC: data.description,
      }],
    };

    if (data.plant) {
      params.PLANTDATA = {
        PLANT: data.plant,
      };
      params.PLANTDATAX = {
        PLANT: data.plant,
      };
    }

    if (data.extensionData) {
      params.EXTENSIONIN = data.extensionData;
    }

    return this.caller.callWithCommit('BAPI_MATERIAL_SAVEDATA', params);
  }

  /**
   * Create a purchase order.
   */
  async createPurchaseOrder(data) {
    this._validateRequiredOrThrow('createPurchaseOrder', data);

    if (this.mode === 'mock') {
      this.log.info('Mock: creating purchase order');
      return MOCK_RESPONSES.createPurchaseOrder(data);
    }

    const header = {
      VENDOR: data.vendorNumber,
      PURCH_ORG: data.purchasingOrg,
      PUR_GROUP: data.purchasingGroup,
      COMP_CODE: data.companyCode,
      DOC_TYPE: data.documentType || 'NB',
    };

    const items = data.items.map((item, idx) => ({
      PO_ITEM: String((idx + 1) * 10).padStart(5, '0'),
      MATERIAL: item.material,
      PLANT: item.plant,
      QUANTITY: item.quantity,
      DELIV_DATE: item.deliveryDate || '',
      NET_PRICE: item.netPrice || 0,
    }));

    return this.caller.callWithCommit('BAPI_PO_CREATE1', {
      POHEADER: header,
      POITEM: items,
    });
  }

  /**
   * Create a sales order.
   */
  async createSalesOrder(data) {
    this._validateRequiredOrThrow('createSalesOrder', data);

    if (this.mode === 'mock') {
      this.log.info('Mock: creating sales order');
      return MOCK_RESPONSES.createSalesOrder(data);
    }

    const header = {
      DOC_TYPE: data.orderType,
      SALES_ORG: data.salesOrg,
      DISTR_CHAN: data.distributionChannel,
      DIVISION: data.division,
      REQ_DATE_H: data.requestedDeliveryDate || '',
      PURCH_NO: data.purchaseOrderNumber || '',
    };

    const partners = [
      { PARTN_ROLE: 'AG', PARTN_NUMB: data.soldToParty },
    ];

    const items = data.items.map((item, idx) => ({
      ITM_NUMBER: String((idx + 1) * 10).padStart(6, '0'),
      MATERIAL: item.material,
      TARGET_QTY: item.quantity,
      PLANT: item.plant || '',
      ITEM_CATEG: item.itemCategory || '',
    }));

    return this.caller.callWithCommit('BAPI_SALESORDER_CREATEFROMDAT2', {
      ORDER_HEADER_IN: header,
      ORDER_PARTNERS: partners,
      ORDER_ITEMS_IN: items,
    });
  }

  /**
   * Create a bank master record.
   */
  async createBank(data) {
    this._validateRequiredOrThrow('createBank', data);

    if (this.mode === 'mock') {
      this.log.info('Mock: creating bank', { bankKey: data.bankKey });
      return MOCK_RESPONSES.createBank(data);
    }

    return this.caller.call('BAPI_BANK_CREATE', {
      BANK_CTRY: data.bankCountry,
      BANK_KEY: data.bankKey,
      BANK_ADDRESS: {
        BANK_NAME: data.bankName,
        CITY: data.city || '',
        SWIFT_CODE: data.swiftCode || '',
        BANK_GROUP: data.bankGroup || '',
        STREET: data.street || '',
        REGION: data.region || '',
        POST_CODE: data.postalCode || '',
      },
    });
  }

  /**
   * List all available BAPIs with descriptions and parameter structures.
   * @returns {object[]}
   */
  listAvailableBapis() {
    return Object.entries(BAPI_REGISTRY).map(([methodName, def]) => ({
      method: methodName,
      functionModule: def.name,
      description: def.description,
      requiredFields: def.requiredFields,
      parameterStructure: def.parameterStructure,
    }));
  }

  /**
   * Validate input data against a known BAPI parameter structure.
   * @param {string} bapiName - Method name (e.g., 'createCostCenter')
   * @param {object} data - Input data
   * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
   */
  validateInput(bapiName, data) {
    const def = BAPI_REGISTRY[bapiName];
    if (!def) {
      return { valid: false, errors: [`Unknown BAPI: "${bapiName}"`], warnings: [] };
    }

    const errors = [];
    const warnings = [];

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Input data must be a non-null object'], warnings: [] };
    }

    // Check required fields
    for (const field of def.requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push(`Required field "${field}" is missing or empty`);
      }
    }

    // Check for unknown fields
    const knownFields = new Set(Object.keys(def.parameterStructure));
    for (const field of Object.keys(data)) {
      if (!knownFields.has(field)) {
        warnings.push(`Unknown field "${field}" (will be ignored)`);
      }
    }

    // Type-specific validations
    for (const [field, spec] of Object.entries(def.parameterStructure)) {
      if (data[field] === undefined || data[field] === null) continue;

      if (spec.type === 'DATE' && typeof data[field] === 'string') {
        if (!/^\d{4}-?\d{2}-?\d{2}$/.test(data[field])) {
          errors.push(`Field "${field}" must be a date in YYYYMMDD or YYYY-MM-DD format`);
        }
      }

      if (spec.type === 'CHAR' && typeof data[field] === 'string' && spec.length > 0) {
        if (data[field].length > spec.length) {
          warnings.push(`Field "${field}" exceeds max length ${spec.length} (${data[field].length} chars)`);
        }
      }

      if (spec.type === 'TABLE' && !Array.isArray(data[field])) {
        errors.push(`Field "${field}" must be an array`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Execute a batch of BAPI operations sequentially with commit after each.
   * @param {Array<{ bapi: string, data: object }>} operations
   * @returns {{ results: object[], summary: { total: number, successful: number, failed: number, errors: object[] } }}
   */
  async executeBatch(operations) {
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new Error('Operations must be a non-empty array');
    }

    const results = [];
    const errors = [];
    let successful = 0;

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      try {
        if (!op.bapi || !op.data) {
          throw new Error('Each operation must have "bapi" and "data" fields');
        }

        if (typeof this[op.bapi] !== 'function') {
          throw new Error(`Unknown BAPI method: "${op.bapi}"`);
        }

        const result = await this[op.bapi](op.data);
        results.push({ index: i, bapi: op.bapi, success: true, result });
        successful++;
      } catch (err) {
        errors.push({ index: i, bapi: op.bapi, error: err.message });
        results.push({ index: i, bapi: op.bapi, success: false, error: err.message });
      }
    }

    this.log.info('Batch BAPI execution complete', {
      total: operations.length,
      successful,
      failed: errors.length,
    });

    return {
      results,
      summary: {
        total: operations.length,
        successful,
        failed: errors.length,
        errors,
      },
    };
  }

  /**
   * @private
   */
  _validateRequiredOrThrow(bapiName, data) {
    const validation = this.validateInput(bapiName, data);
    if (!validation.valid) {
      throw new Error(`Validation failed for ${bapiName}: ${validation.errors.join(', ')}`);
    }
  }
}

module.exports = { BapiCatalog, BAPI_REGISTRY };
