/**
 * Enhancement Framework Discovery
 *
 * Discovers and catalogs BAdI/Enhancement spots in an SAP system.
 * Provides both ADT-based live discovery and a comprehensive mock
 * catalog organized by module.
 */

const Logger = require('../logger');

/**
 * Comprehensive BAdI catalog organized by SAP module.
 * Each entry includes the BAdI name, description, interface, and filter type.
 */
const BADI_CATALOG = {
  FI: [
    { name: 'BADI_ACC_DOCUMENT', description: 'Accounting Document: Substitution/Validation', interface: 'IF_EX_ACC_DOCUMENT', filterType: 'BUKRS', fallbackClass: 'CL_EX_ACC_DOCUMENT', methods: ['CHANGE', 'CHECK'] },
    { name: 'BADI_ACC_POSTING', description: 'Account Posting: Enhancement', interface: 'IF_EX_ACC_POSTING', filterType: 'BUKRS', fallbackClass: '', methods: ['BEFORE_POST', 'AFTER_POST'] },
    { name: 'BADI_FDCB_SUBBAS01', description: 'FI Customer/Vendor Line Items', interface: 'IF_EX_FDCB_SUBBAS01', filterType: '', fallbackClass: '', methods: ['CHANGE_AFTER_CHECK'] },
    { name: 'BADI_FI_TAX_CALC', description: 'Tax Calculation Enhancement', interface: 'IF_EX_FI_TAX_CALC', filterType: 'KALSM', fallbackClass: '', methods: ['TAX_CALCULATE', 'TAX_CHECK'] },
    { name: 'BADI_AP_INVOICE', description: 'Accounts Payable Invoice Verification', interface: 'IF_EX_AP_INVOICE', filterType: 'BUKRS', fallbackClass: '', methods: ['CHANGE_BEFORE_CHECK', 'CHANGE_AFTER_CHECK'] },
    { name: 'BADI_FI_PAYMENT', description: 'Payment Processing Enhancement', interface: 'IF_EX_FI_PAYMENT', filterType: 'ZBUKR', fallbackClass: '', methods: ['BEFORE_PAYMENT', 'AFTER_PAYMENT', 'CHECK_PAYMENT'] },
    { name: 'BADI_FI_ASSET_POSTING', description: 'Asset Accounting Posting', interface: 'IF_EX_FI_ASSET_POSTING', filterType: 'BUKRS', fallbackClass: '', methods: ['CHANGE', 'POST'] },
  ],

  CO: [
    { name: 'BADI_CO_DOCUMENT', description: 'CO Document: Actual Posting', interface: 'IF_EX_CO_DOCUMENT', filterType: 'KOKRS', fallbackClass: '', methods: ['CHANGE', 'CHECK'] },
    { name: 'BADI_CO_PLANNING', description: 'CO Planning Enhancement', interface: 'IF_EX_CO_PLANNING', filterType: 'KOKRS', fallbackClass: '', methods: ['PLAN_CHANGE', 'PLAN_CHECK'] },
    { name: 'BADI_CO_COSTCENTER', description: 'Cost Center Master Data', interface: 'IF_EX_CO_COSTCENTER', filterType: 'KOKRS', fallbackClass: '', methods: ['BEFORE_SAVE', 'AFTER_SAVE'] },
    { name: 'BADI_CO_PROFITCENTER', description: 'Profit Center Accounting', interface: 'IF_EX_CO_PROFITCENTER', filterType: 'KOKRS', fallbackClass: '', methods: ['DERIVE', 'CHECK'] },
    { name: 'BADI_CO_SETTLE', description: 'CO Settlement Enhancement', interface: 'IF_EX_CO_SETTLE', filterType: 'KOKRS', fallbackClass: '', methods: ['BEFORE_SETTLE', 'AFTER_SETTLE'] },
  ],

  MM: [
    { name: 'BADI_MM_PO_CREATE', description: 'Purchase Order Creation Enhancement', interface: 'IF_EX_ME_PROCESS_PO', filterType: 'BSART', fallbackClass: '', methods: ['PROCESS_HEADER', 'PROCESS_ITEM', 'CHECK', 'POST'] },
    { name: 'BADI_MM_GOODS_MOVEMENT', description: 'Goods Movement Enhancement', interface: 'IF_EX_MB_GOODS_MOVEMENT', filterType: 'BWART', fallbackClass: '', methods: ['BEFORE_POST', 'AFTER_POST', 'CHECK_ITEM'] },
    { name: 'BADI_MM_MATERIAL_MASTER', description: 'Material Master Maintenance', interface: 'IF_EX_MM_MATERIAL', filterType: 'MTART', fallbackClass: '', methods: ['BEFORE_SAVE', 'CHECK_DATA', 'AFTER_SAVE'] },
    { name: 'BADI_MM_INVOICE_VERIF', description: 'Invoice Verification Enhancement', interface: 'IF_EX_MM_INVOICE', filterType: 'BUKRS', fallbackClass: '', methods: ['CHANGE_BEFORE_CHECK', 'CHECK', 'POST'] },
    { name: 'BADI_MM_RESERVATION', description: 'Reservation Enhancement', interface: 'IF_EX_MM_RESERVATION', filterType: 'BWART', fallbackClass: '', methods: ['BEFORE_SAVE', 'CHECK'] },
    { name: 'BADI_MM_INVENTORY', description: 'Physical Inventory Enhancement', interface: 'IF_EX_MM_INVENTORY', filterType: 'WERKS', fallbackClass: '', methods: ['COUNT', 'POST_COUNT'] },
  ],

  SD: [
    { name: 'BADI_SD_SALES', description: 'Sales Document Processing', interface: 'IF_EX_SD_SALES_DOC', filterType: 'AUART', fallbackClass: '', methods: ['SAVE_DOCUMENT', 'CHECK_DOCUMENT', 'CHANGE_DOCUMENT'] },
    { name: 'BADI_SD_BILLING', description: 'Billing Document Enhancement', interface: 'IF_EX_SD_BILLING', filterType: 'FKART', fallbackClass: '', methods: ['BEFORE_CREATE', 'AFTER_CREATE', 'CHECK'] },
    { name: 'BADI_SD_DELIVERY', description: 'Delivery Processing Enhancement', interface: 'IF_EX_SD_DELIVERY', filterType: 'LFART', fallbackClass: '', methods: ['BEFORE_SAVE', 'AFTER_SAVE', 'CHECK'] },
    { name: 'BADI_SD_PRICING', description: 'Pricing Enhancement', interface: 'IF_EX_SD_PRICING', filterType: 'KALSM', fallbackClass: '', methods: ['PRICE_DETERMINE', 'PRICE_CHECK'] },
    { name: 'BADI_SD_AVAILABILITY', description: 'Availability Check Enhancement', interface: 'IF_EX_SD_AVAILABILITY', filterType: 'WERKS', fallbackClass: '', methods: ['CHECK_AVAILABILITY', 'OVERRIDE'] },
  ],

  PP: [
    { name: 'BADI_PP_ORDER_CREATE', description: 'Production Order Creation', interface: 'IF_EX_PP_ORDER_CREATE', filterType: 'AUART', fallbackClass: '', methods: ['CHANGE_ORDER', 'CHECK_ORDER'] },
    { name: 'BADI_PP_CONFIRMATION', description: 'Production Order Confirmation', interface: 'IF_EX_PP_CONFIRMATION', filterType: 'AUART', fallbackClass: '', methods: ['BEFORE_CONFIRM', 'AFTER_CONFIRM', 'CHECK'] },
    { name: 'BADI_PP_BOM', description: 'Bill of Materials Enhancement', interface: 'IF_EX_PP_BOM', filterType: 'STLTY', fallbackClass: '', methods: ['CHANGE_BOM', 'EXPLODE_BOM'] },
    { name: 'BADI_PP_ROUTING', description: 'Routing Enhancement', interface: 'IF_EX_PP_ROUTING', filterType: 'PLNTY', fallbackClass: '', methods: ['CHANGE_ROUTING', 'CHECK_ROUTING'] },
    { name: 'BADI_PP_MRP', description: 'MRP Enhancement', interface: 'IF_EX_PP_MRP', filterType: 'WERKS', fallbackClass: '', methods: ['CHANGE_PLANNED_ORDER', 'RESCHEDULE'] },
  ],

  PM: [
    { name: 'BADI_PM_ORDER', description: 'Plant Maintenance Order', interface: 'IF_EX_PM_ORDER', filterType: 'AUART', fallbackClass: '', methods: ['BEFORE_SAVE', 'AFTER_SAVE', 'CHECK'] },
    { name: 'BADI_PM_NOTIFICATION', description: 'PM Notification Enhancement', interface: 'IF_EX_PM_NOTIFICATION', filterType: 'QMART', fallbackClass: '', methods: ['CREATE', 'CHANGE', 'CHECK'] },
    { name: 'BADI_PM_EQUIPMENT', description: 'Equipment Master Enhancement', interface: 'IF_EX_PM_EQUIPMENT', filterType: 'EQTYP', fallbackClass: '', methods: ['BEFORE_SAVE', 'CHECK'] },
    { name: 'BADI_PM_FUNCLOCN', description: 'Functional Location Enhancement', interface: 'IF_EX_PM_FUNCLOCN', filterType: '', fallbackClass: '', methods: ['BEFORE_SAVE', 'CHECK'] },
    { name: 'BADI_PM_MEASUREMENT', description: 'Measurement Document Enhancement', interface: 'IF_EX_PM_MEASUREMENT', filterType: '', fallbackClass: '', methods: ['BEFORE_SAVE', 'AFTER_SAVE'] },
  ],

  HR: [
    { name: 'BADI_HR_MASTERDATA', description: 'HR Master Data Enhancement', interface: 'IF_EX_HR_MASTERDATA', filterType: 'INFTY', fallbackClass: '', methods: ['BEFORE_SAVE', 'AFTER_SAVE', 'CHECK'] },
    { name: 'BADI_HR_PAYROLL', description: 'Payroll Enhancement', interface: 'IF_EX_HR_PAYROLL', filterType: 'ABKRS', fallbackClass: '', methods: ['BEFORE_CALC', 'AFTER_CALC'] },
    { name: 'BADI_HR_TIME_MGMT', description: 'Time Management Enhancement', interface: 'IF_EX_HR_TIME_MGMT', filterType: 'SCHKZ', fallbackClass: '', methods: ['EVALUATE', 'CHECK_TIME'] },
    { name: 'BADI_HR_ORG_MGMT', description: 'Organizational Management', interface: 'IF_EX_HR_ORG_MGMT', filterType: 'OTYPE', fallbackClass: '', methods: ['BEFORE_SAVE', 'CHECK'] },
    { name: 'BADI_HR_RECRUITING', description: 'Recruitment Enhancement', interface: 'IF_EX_HR_RECRUITING', filterType: '', fallbackClass: '', methods: ['BEFORE_SAVE', 'EVALUATE_CANDIDATE'] },
  ],

  BC: [
    { name: 'BADI_WORKFLOW', description: 'Workflow Enhancement', interface: 'IF_EX_WORKFLOW', filterType: 'WF_TYPE', fallbackClass: '', methods: ['BEFORE_START', 'AFTER_COMPLETE', 'CHECK_AGENT'] },
    { name: 'BADI_AUTH_CHECK', description: 'Authorization Check Enhancement', interface: 'IF_EX_AUTH_CHECK', filterType: 'OBJECT', fallbackClass: '', methods: ['CHECK_AUTHORITY', 'DERIVE_AUTH'] },
    { name: 'BADI_OUTPUT_CONTROL', description: 'Output Control Enhancement', interface: 'IF_EX_OUTPUT_CONTROL', filterType: 'KAPPL', fallbackClass: '', methods: ['DETERMINE', 'PROCESS'] },
    { name: 'BADI_NUMBER_RANGE', description: 'Number Range Enhancement', interface: 'IF_EX_NUMBER_RANGE', filterType: 'OBJECT', fallbackClass: '', methods: ['GET_NUMBER', 'RESERVE_NUMBERS'] },
    { name: 'BADI_IDOC_PROCESSING', description: 'IDoc Processing Enhancement', interface: 'IF_EX_IDOC', filterType: 'MESTYP', fallbackClass: '', methods: ['BEFORE_SEND', 'AFTER_RECEIVE', 'MAP_DATA'] },
  ],
};

/**
 * S/4HANA Cloud released BAdIs by release version.
 */
const S4HANA_RELEASED_BADIS = {
  '2302': [
    { name: 'BADI_FDCB_SUBBAS01', description: 'FI Customer/Vendor Line Items', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_ACC_DOCUMENT', description: 'Accounting Document Enhancement', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_SALES', description: 'Sales Document Processing', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_BILLING', description: 'Billing Document Enhancement', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_MM_PO_CREATE', description: 'Purchase Order Creation', module: 'MM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_MM_GOODS_MOVEMENT', description: 'Goods Movement Enhancement', module: 'MM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_FI_TAX_CALC', description: 'Tax Calculation', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_CO_DOCUMENT', description: 'CO Document Enhancement', module: 'CO', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PP_ORDER_CREATE', description: 'Production Order Enhancement', module: 'PP', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_PRICING', description: 'Pricing Enhancement', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_DELIVERY', description: 'Delivery Enhancement', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_MM_MATERIAL_MASTER', description: 'Material Master Enhancement', module: 'MM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_HR_MASTERDATA', description: 'HR Master Data Enhancement', module: 'HR', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_WORKFLOW', description: 'Workflow Enhancement', module: 'BC', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_OUTPUT_CONTROL', description: 'Output Control', module: 'BC', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_IDOC_PROCESSING', description: 'IDoc Processing', module: 'BC', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
  ],
  '2308': [
    { name: 'BADI_FDCB_SUBBAS01', description: 'FI Customer/Vendor Line Items', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_ACC_DOCUMENT', description: 'Accounting Document Enhancement', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_ACC_POSTING', description: 'Account Posting Enhancement', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_SALES', description: 'Sales Document Processing', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_BILLING', description: 'Billing Document Enhancement', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_PRICING', description: 'Pricing Enhancement', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_DELIVERY', description: 'Delivery Enhancement', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_AVAILABILITY', description: 'Availability Check', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_MM_PO_CREATE', description: 'Purchase Order Creation', module: 'MM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_MM_GOODS_MOVEMENT', description: 'Goods Movement Enhancement', module: 'MM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_MM_MATERIAL_MASTER', description: 'Material Master Enhancement', module: 'MM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_MM_INVOICE_VERIF', description: 'Invoice Verification', module: 'MM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_FI_TAX_CALC', description: 'Tax Calculation', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_FI_PAYMENT', description: 'Payment Processing', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_CO_DOCUMENT', description: 'CO Document Enhancement', module: 'CO', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_CO_PLANNING', description: 'CO Planning Enhancement', module: 'CO', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PP_ORDER_CREATE', description: 'Production Order Enhancement', module: 'PP', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PP_CONFIRMATION', description: 'Production Confirmation', module: 'PP', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PP_BOM', description: 'BOM Enhancement', module: 'PP', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PM_ORDER', description: 'PM Order Enhancement', module: 'PM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PM_NOTIFICATION', description: 'PM Notification', module: 'PM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_HR_MASTERDATA', description: 'HR Master Data Enhancement', module: 'HR', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_HR_PAYROLL', description: 'Payroll Enhancement', module: 'HR', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_WORKFLOW', description: 'Workflow Enhancement', module: 'BC', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_AUTH_CHECK', description: 'Authorization Check', module: 'BC', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_OUTPUT_CONTROL', description: 'Output Control', module: 'BC', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_IDOC_PROCESSING', description: 'IDoc Processing', module: 'BC', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_NUMBER_RANGE', description: 'Number Range Enhancement', module: 'BC', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
  ],
  '2402': [
    { name: 'BADI_FDCB_SUBBAS01', description: 'FI Customer/Vendor Line Items', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_ACC_DOCUMENT', description: 'Accounting Document Enhancement', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_ACC_POSTING', description: 'Account Posting Enhancement', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_AP_INVOICE', description: 'AP Invoice Enhancement', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_FI_TAX_CALC', description: 'Tax Calculation', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_FI_PAYMENT', description: 'Payment Processing', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_FI_ASSET_POSTING', description: 'Asset Posting', module: 'FI', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_CO_DOCUMENT', description: 'CO Document Enhancement', module: 'CO', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_CO_PLANNING', description: 'CO Planning Enhancement', module: 'CO', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_CO_COSTCENTER', description: 'Cost Center Enhancement', module: 'CO', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_CO_PROFITCENTER', description: 'Profit Center Enhancement', module: 'CO', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_CO_SETTLE', description: 'Settlement Enhancement', module: 'CO', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_SALES', description: 'Sales Document Processing', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_BILLING', description: 'Billing Document Enhancement', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_PRICING', description: 'Pricing Enhancement', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_DELIVERY', description: 'Delivery Enhancement', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_SD_AVAILABILITY', description: 'Availability Check', module: 'SD', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_MM_PO_CREATE', description: 'Purchase Order Creation', module: 'MM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_MM_GOODS_MOVEMENT', description: 'Goods Movement Enhancement', module: 'MM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_MM_MATERIAL_MASTER', description: 'Material Master Enhancement', module: 'MM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_MM_INVOICE_VERIF', description: 'Invoice Verification', module: 'MM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_MM_RESERVATION', description: 'Reservation Enhancement', module: 'MM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_MM_INVENTORY', description: 'Physical Inventory', module: 'MM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PP_ORDER_CREATE', description: 'Production Order Enhancement', module: 'PP', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PP_CONFIRMATION', description: 'Production Confirmation', module: 'PP', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PP_BOM', description: 'BOM Enhancement', module: 'PP', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PP_ROUTING', description: 'Routing Enhancement', module: 'PP', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PP_MRP', description: 'MRP Enhancement', module: 'PP', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PM_ORDER', description: 'PM Order Enhancement', module: 'PM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PM_NOTIFICATION', description: 'PM Notification', module: 'PM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PM_EQUIPMENT', description: 'Equipment Master Enhancement', module: 'PM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PM_FUNCLOCN', description: 'Functional Location Enhancement', module: 'PM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_PM_MEASUREMENT', description: 'Measurement Document', module: 'PM', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_HR_MASTERDATA', description: 'HR Master Data Enhancement', module: 'HR', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_HR_PAYROLL', description: 'Payroll Enhancement', module: 'HR', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_HR_TIME_MGMT', description: 'Time Management', module: 'HR', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_HR_ORG_MGMT', description: 'Organizational Management', module: 'HR', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_HR_RECRUITING', description: 'Recruitment Enhancement', module: 'HR', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_WORKFLOW', description: 'Workflow Enhancement', module: 'BC', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_AUTH_CHECK', description: 'Authorization Check', module: 'BC', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_OUTPUT_CONTROL', description: 'Output Control', module: 'BC', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_NUMBER_RANGE', description: 'Number Range Enhancement', module: 'BC', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
    { name: 'BADI_IDOC_PROCESSING', description: 'IDoc Processing', module: 'BC', releaseStatus: 'Released', apiState: 'Cloud-Enabled' },
  ],
};

class EnhancementDiscovery {
  /**
   * @param {object} adtClientOrMock - ADT client for live mode, or null for mock
   * @param {object} [options]
   * @param {'mock'|'live'} [options.mode='mock']
   * @param {object} [options.logger]
   */
  constructor(adtClientOrMock, options = {}) {
    this.mode = options.mode || 'mock';
    this.adtClient = adtClientOrMock;
    this.log = options.logger || new Logger('enhancement-discovery');
  }

  /**
   * Discover BAdIs by application component (module).
   * @param {string} applicationComponent - Module key (FI, CO, MM, SD, PP, PM, HR, BC)
   * @returns {object[]}
   */
  async discoverBadis(applicationComponent) {
    if (!applicationComponent) {
      throw new Error('Application component is required');
    }

    const component = applicationComponent.toUpperCase();

    if (this.mode === 'mock') {
      const badis = BADI_CATALOG[component];
      if (!badis) {
        this.log.warn('No BAdIs found for component', { component });
        return [];
      }

      this.log.info(`Discovered ${badis.length} BAdIs for ${component}`);

      return badis.map(b => ({
        name: b.name,
        description: b.description,
        interface: b.interface,
        filterType: b.filterType,
        module: component,
      }));
    }

    // Live mode: ADT search for enhancement spots
    const searchPath = `/sap/bc/adt/enhancementspots?search=${encodeURIComponent(component)}`;
    const response = await this.adtClient.get(searchPath);

    if (!response || !response.data) {
      return [];
    }

    // Parse ADT XML response
    const spots = this._parseAdtEnhancementSpots(response.data);

    this.log.info(`Discovered ${spots.length} BAdIs for ${component}`);

    return spots;
  }

  /**
   * Get the full definition of a BAdI.
   * @param {string} badiName
   * @returns {object}
   */
  async getBadiDefinition(badiName) {
    if (!badiName) {
      throw new Error('BAdI name is required');
    }

    if (this.mode === 'mock') {
      // Search across all modules for this BAdI
      for (const [module, badis] of Object.entries(BADI_CATALOG)) {
        const badi = badis.find(b => b.name === badiName);
        if (badi) {
          return {
            name: badi.name,
            description: badi.description,
            interface: badi.interface,
            filterType: badi.filterType,
            fallbackClass: badi.fallbackClass,
            module,
            methods: badi.methods.map(m => ({
              name: m,
              description: `Method ${m} of ${badi.interface}`,
              parameters: [
                { name: 'IV_DATA', direction: 'importing', type: 'ANY' },
                { name: 'CV_RESULT', direction: 'changing', type: 'ANY' },
              ],
            })),
            isMultipleUse: true,
            isFilterDependent: !!badi.filterType,
          };
        }
      }

      throw new Error(`BAdI "${badiName}" not found in catalog`);
    }

    // Live mode: ADT read
    const path = `/sap/bc/adt/enhancements/badi/${encodeURIComponent(badiName)}`;
    const response = await this.adtClient.get(path);

    return this._parseAdtBadiDefinition(response.data);
  }

  /**
   * Search source code for exit points.
   * @param {string} programName
   * @returns {object[]}
   */
  async findExitPoints(programName) {
    if (!programName) {
      throw new Error('Program name is required');
    }

    if (this.mode === 'mock') {
      // Return realistic mock exit points for a typical SAP program
      const exitPoints = [
        {
          type: 'BAdI',
          id: `BADI_${programName.substring(0, 10).toUpperCase()}`,
          line: 145,
          statement: 'GET BADI lo_badi.',
          program: programName,
        },
        {
          type: 'CustomerExit',
          id: '001',
          line: 320,
          statement: "CALL CUSTOMER-FUNCTION '001'",
          program: programName,
        },
        {
          type: 'EnhancementPoint',
          id: `EP_${programName.substring(0, 8).toUpperCase()}_01`,
          line: 510,
          statement: 'ENHANCEMENT-POINT ep_01 SPOTS spot_01.',
          program: programName,
        },
        {
          type: 'UserExit',
          id: `USEREXIT_${programName.substring(0, 6).toUpperCase()}`,
          line: 725,
          statement: `PERFORM USEREXIT_${programName.substring(0, 6).toUpperCase()}.`,
          program: programName,
        },
      ];

      this.log.info(`Found ${exitPoints.length} exit points in ${programName}`);
      return exitPoints;
    }

    // Live mode: search source code via ADT
    const path = `/sap/bc/adt/programs/programs/${encodeURIComponent(programName)}/source/main`;
    const response = await this.adtClient.get(path);

    const source = response.data || '';
    const exitPoints = [];
    const lines = source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toUpperCase();

      // BAdI calls
      const badiMatch = line.match(/GET\s+BADI\s+(\w+)/);
      if (badiMatch) {
        exitPoints.push({
          type: 'BAdI',
          id: badiMatch[1],
          line: i + 1,
          statement: lines[i].trim(),
          program: programName,
        });
      }

      // Customer function calls
      const custMatch = line.match(/CALL\s+CUSTOMER-FUNCTION\s+'(\d+)'/);
      if (custMatch) {
        exitPoints.push({
          type: 'CustomerExit',
          id: custMatch[1],
          line: i + 1,
          statement: lines[i].trim(),
          program: programName,
        });
      }

      // Enhancement points
      const enhMatch = line.match(/ENHANCEMENT-POINT\s+(\w+)/);
      if (enhMatch) {
        exitPoints.push({
          type: 'EnhancementPoint',
          id: enhMatch[1],
          line: i + 1,
          statement: lines[i].trim(),
          program: programName,
        });
      }

      // User exits
      const userExitMatch = line.match(/PERFORM\s+(USEREXIT_\w+)/);
      if (userExitMatch) {
        exitPoints.push({
          type: 'UserExit',
          id: userExitMatch[1],
          line: i + 1,
          statement: lines[i].trim(),
          program: programName,
        });
      }
    }

    this.log.info(`Found ${exitPoints.length} exit points in ${programName}`);
    return exitPoints;
  }

  /**
   * Generate a skeleton ABAP implementation class for a BAdI.
   * @param {string} badiName
   * @param {string} implementationName
   * @returns {{ className: string, source: string, badiName: string }}
   */
  async generateBadiImplementation(badiName, implementationName) {
    if (!badiName) throw new Error('BAdI name is required');
    if (!implementationName) throw new Error('Implementation name is required');

    // Get definition to know the interface and methods
    const definition = await this.getBadiDefinition(badiName);

    const className = `ZCL_${implementationName.toUpperCase()}`;
    const interfaceName = definition.interface;
    const methods = definition.methods || [];

    const methodImplementations = methods.map(m => {
      const params = (m.parameters || [])
        .map(p => `*       ${p.direction.toUpperCase()} ${p.name} TYPE ${p.type}`)
        .join('\n');

      return `  METHOD ${interfaceName}~${m.name}.
*   Implementation for ${m.description || m.name}
${params}
*   TODO: Add custom logic here
  ENDMETHOD.`;
    }).join('\n\n');

    const source = `CLASS ${className} DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES ${interfaceName}.

  PROTECTED SECTION.
  PRIVATE SECTION.
ENDCLASS.

CLASS ${className} IMPLEMENTATION.

${methodImplementations}

ENDCLASS.`;

    this.log.info('Generated BAdI implementation', { className, badiName, methods: methods.length });

    return {
      className,
      source,
      badiName,
      interface: interfaceName,
      methodCount: methods.length,
    };
  }

  /**
   * Get the full BAdI catalog organized by module.
   * @returns {object}
   */
  getCatalog() {
    const catalog = {};

    for (const [module, badis] of Object.entries(BADI_CATALOG)) {
      catalog[module] = badis.map(b => ({
        name: b.name,
        description: b.description,
        interface: b.interface,
        filterType: b.filterType,
        methods: b.methods,
      }));
    }

    return catalog;
  }

  /**
   * Get BAdIs released for S/4HANA Cloud by release version.
   * @param {string} [release='2402'] - S/4HANA release version
   * @returns {object[]}
   */
  getS4HanaReleasedBadis(release) {
    const releaseKey = release || '2402';

    const badis = S4HANA_RELEASED_BADIS[releaseKey];
    if (!badis) {
      const availableReleases = Object.keys(S4HANA_RELEASED_BADIS);
      throw new Error(`Release "${releaseKey}" not found. Available: ${availableReleases.join(', ')}`);
    }

    this.log.info(`Returning ${badis.length} released BAdIs for S/4HANA ${releaseKey}`);

    return badis;
  }

  /**
   * Parse ADT enhancement spots XML response.
   * @param {string} xml
   * @returns {object[]}
   * @private
   */
  _parseAdtEnhancementSpots(xml) {
    // Simple XML parsing for ADT responses
    const spots = [];
    const regex = /<enhancementspot[^>]*name="([^"]*)"[^>]*description="([^"]*)"/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      spots.push({
        name: match[1],
        description: match[2],
        interface: '',
        filterType: '',
        module: '',
      });
    }
    return spots;
  }

  /**
   * Parse ADT BAdI definition XML response.
   * @param {string} xml
   * @returns {object}
   * @private
   */
  _parseAdtBadiDefinition(xml) {
    // Extract key fields from ADT XML
    const nameMatch = xml.match(/name="([^"]*)"/);
    const ifaceMatch = xml.match(/interface="([^"]*)"/);
    const filterMatch = xml.match(/filter="([^"]*)"/);
    const fallbackMatch = xml.match(/fallbackClass="([^"]*)"/);

    return {
      name: nameMatch ? nameMatch[1] : '',
      interface: ifaceMatch ? ifaceMatch[1] : '',
      filterType: filterMatch ? filterMatch[1] : '',
      fallbackClass: fallbackMatch ? fallbackMatch[1] : '',
      methods: [],
      isMultipleUse: true,
      isFilterDependent: false,
    };
  }
}

module.exports = { EnhancementDiscovery, BADI_CATALOG, S4HANA_RELEASED_BADIS };
