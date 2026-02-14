'use strict';

/**
 * AI-Powered Test Generation Engine
 *
 * Generates SAP test cases from natural language descriptions, configuration
 * deltas, BPMN process models, and built-in module regression patterns.
 * Supports mock and live modes for dual operation without SAP system.
 */

const Logger = require('../logger');
const { TestingError } = require('../errors');

/** SAP module keyword mappings for NL parsing */
const MODULE_KEYWORDS = {
  FI: ['gl', 'posting', 'journal', 'ledger', 'account', 'finance', 'financial', 'invoice', 'payment', 'bank', 'asset', 'depreciation', 'tax', 'period', 'close', 'reconciliation', 'fb01', 'fb08', 'fb70', 'f-53'],
  MM: ['purchase', 'vendor', 'po', 'procurement', 'goods receipt', 'material', 'stock', 'inventory', 'warehouse', 'requisition', 'me21n', 'migo', 'miro', 'xk01', 'transfer'],
  SD: ['sales', 'order', 'delivery', 'billing', 'customer', 'pricing', 'atp', 'credit', 'shipping', 'va01', 'vl01n', 'vf01', 'quotation', 'contract'],
  HR: ['employee', 'payroll', 'personnel', 'time', 'attendance', 'org', 'organization', 'position', 'wage', 'salary', 'benefit', 'pa30', 'pa61', 'pc00'],
  CO: ['cost', 'profit', 'controlling', 'allocation', 'settlement', 'activity', 'overhead', 'cost center', 'profit center', 'internal order', 'co01'],
  PP: ['production', 'bom', 'routing', 'work order', 'confirmation', 'planning', 'mrp', 'capacity', 'shop floor', 'cs01', 'ca01', 'co11n'],
};

/** Action keyword mappings for NL parsing */
const ACTION_KEYWORDS = {
  create: ['create', 'add', 'new', 'insert', 'generate', 'open'],
  post: ['post', 'submit', 'book', 'record', 'enter'],
  verify: ['verify', 'check', 'validate', 'confirm', 'ensure', 'assert'],
  approve: ['approve', 'release', 'authorize', 'sign off'],
  reject: ['reject', 'deny', 'decline', 'refuse'],
  transfer: ['transfer', 'move', 'shift', 'relocate'],
  reverse: ['reverse', 'cancel', 'undo', 'storno', 'void'],
  modify: ['modify', 'change', 'update', 'edit', 'alter'],
  delete: ['delete', 'remove', 'deactivate', 'block'],
  display: ['display', 'view', 'show', 'list', 'report'],
};

/** Built-in regression patterns per module */
const MODULE_PATTERNS = {
  FI: {
    smoke: [
      { name: 'GL Posting (FB01)', tcode: 'FB01', steps: [
        { action: 'Open FB01 transaction', type: 'rfc_call', params: { tcode: 'FB01' }, expectedResult: 'Transaction screen opens' },
        { action: 'Enter document header: company code, posting date, document type', type: 'field_validation', params: { companyCode: '1000', docType: 'SA' }, expectedResult: 'Header fields accepted' },
        { action: 'Enter line items with GL accounts and amounts', type: 'bapi_call', params: { bapi: 'BAPI_ACC_DOCUMENT_POST' }, expectedResult: 'Line items balanced' },
        { action: 'Post document', type: 'bapi_call', params: { bapi: 'BAPI_TRANSACTION_COMMIT' }, expectedResult: 'Document number generated' },
      ]},
      { name: 'Document Reversal (FB08)', tcode: 'FB08', steps: [
        { action: 'Open FB08 transaction', type: 'rfc_call', params: { tcode: 'FB08' }, expectedResult: 'Reversal screen opens' },
        { action: 'Enter document number and reversal reason', type: 'field_validation', params: { reversalReason: '01' }, expectedResult: 'Document found for reversal' },
        { action: 'Execute reversal', type: 'bapi_call', params: { bapi: 'BAPI_ACC_DOCUMENT_REV_POST' }, expectedResult: 'Reversal document created' },
      ]},
      { name: 'Balance Check', tcode: 'FAGLB03', steps: [
        { action: 'Display GL account balance', type: 'table_check', params: { table: 'FAGLFLEXT' }, expectedResult: 'Balance displayed correctly' },
      ]},
    ],
    standard: [
      { name: 'Period Close', tcode: 'S_ALR_87012377', steps: [
        { action: 'Open period maintenance', type: 'rfc_call', params: { tcode: 'OB52' }, expectedResult: 'Period table displayed' },
        { action: 'Close current period for posting', type: 'table_check', params: { table: 'T001B' }, expectedResult: 'Period status updated' },
        { action: 'Verify no open items in closed period', type: 'table_check', params: { table: 'BKPF' }, expectedResult: 'No new postings allowed' },
      ]},
      { name: 'Tax Posting', tcode: 'FB01', steps: [
        { action: 'Create document with tax code', type: 'bapi_call', params: { bapi: 'BAPI_ACC_DOCUMENT_POST', taxCode: 'V1' }, expectedResult: 'Tax amount calculated automatically' },
        { action: 'Verify tax line items generated', type: 'table_check', params: { table: 'BSET' }, expectedResult: 'Tax lines present in document' },
      ]},
      { name: 'Foreign Currency Posting', tcode: 'FB01', steps: [
        { action: 'Create document in foreign currency', type: 'bapi_call', params: { currency: 'USD' }, expectedResult: 'Exchange rate applied' },
        { action: 'Verify local currency amount', type: 'table_check', params: { table: 'BSEG' }, expectedResult: 'Local amount matches rate conversion' },
      ]},
    ],
  },
  MM: {
    smoke: [
      { name: 'PO Creation (ME21N)', tcode: 'ME21N', steps: [
        { action: 'Open ME21N transaction', type: 'rfc_call', params: { tcode: 'ME21N' }, expectedResult: 'PO creation screen opens' },
        { action: 'Enter vendor and material details', type: 'field_validation', params: { vendor: '1000', material: 'MAT001' }, expectedResult: 'Vendor and material validated' },
        { action: 'Enter quantity and price', type: 'field_validation', params: { quantity: 100, price: 10.00 }, expectedResult: 'Pricing conditions applied' },
        { action: 'Save PO', type: 'bapi_call', params: { bapi: 'BAPI_PO_CREATE1' }, expectedResult: 'PO number generated' },
      ]},
      { name: 'Goods Receipt (MIGO)', tcode: 'MIGO', steps: [
        { action: 'Open MIGO for goods receipt', type: 'rfc_call', params: { tcode: 'MIGO', action: 'A01' }, expectedResult: 'GR screen opens' },
        { action: 'Enter PO reference', type: 'field_validation', params: { poNumber: '4500000001' }, expectedResult: 'PO items loaded' },
        { action: 'Confirm quantities and post', type: 'bapi_call', params: { bapi: 'BAPI_GOODSMVT_CREATE' }, expectedResult: 'Material document created' },
      ]},
      { name: 'Invoice Verification (MIRO)', tcode: 'MIRO', steps: [
        { action: 'Open MIRO for invoice entry', type: 'rfc_call', params: { tcode: 'MIRO' }, expectedResult: 'Invoice entry screen opens' },
        { action: 'Enter PO reference and invoice amount', type: 'field_validation', params: { poNumber: '4500000001', amount: 1000.00 }, expectedResult: 'Three-way match checked' },
        { action: 'Post invoice', type: 'bapi_call', params: { bapi: 'BAPI_INCOMINGINVOICE_CREATE' }, expectedResult: 'Invoice document created' },
      ]},
    ],
    standard: [
      { name: 'Stock Overview', tcode: 'MMBE', steps: [
        { action: 'Display stock overview for material', type: 'table_check', params: { table: 'MARD' }, expectedResult: 'Stock quantities displayed by storage location' },
      ]},
      { name: 'Vendor Evaluation', tcode: 'ME61', steps: [
        { action: 'Run vendor evaluation', type: 'rfc_call', params: { tcode: 'ME61' }, expectedResult: 'Vendor scores calculated' },
        { action: 'Check evaluation criteria', type: 'table_check', params: { table: 'EINA' }, expectedResult: 'Criteria weights applied correctly' },
      ]},
    ],
  },
  SD: {
    smoke: [
      { name: 'Sales Order (VA01)', tcode: 'VA01', steps: [
        { action: 'Open VA01 transaction', type: 'rfc_call', params: { tcode: 'VA01' }, expectedResult: 'Sales order creation screen opens' },
        { action: 'Enter sold-to party and material', type: 'field_validation', params: { customer: 'CUST001', material: 'MAT001' }, expectedResult: 'Customer and material validated' },
        { action: 'Enter quantity and check pricing', type: 'field_validation', params: { quantity: 10 }, expectedResult: 'Pricing determined automatically' },
        { action: 'Save order', type: 'bapi_call', params: { bapi: 'BAPI_SALESORDER_CREATEFROMDAT2' }, expectedResult: 'Sales order number generated' },
      ]},
      { name: 'Delivery (VL01N)', tcode: 'VL01N', steps: [
        { action: 'Create outbound delivery from sales order', type: 'bapi_call', params: { bapi: 'BAPI_OUTB_DELIVERY_CREATE_SLS' }, expectedResult: 'Delivery document created' },
        { action: 'Pick and pack items', type: 'rfc_call', params: { tcode: 'VL02N' }, expectedResult: 'Picked quantity confirmed' },
        { action: 'Post goods issue', type: 'bapi_call', params: { bapi: 'BAPI_OUTB_DELIVERY_CONFIRM_DEC' }, expectedResult: 'Goods issue posted, stock reduced' },
      ]},
      { name: 'Billing (VF01)', tcode: 'VF01', steps: [
        { action: 'Create billing document from delivery', type: 'bapi_call', params: { bapi: 'BAPI_BILLINGDOC_CREATEMULTIPLE' }, expectedResult: 'Billing document created' },
        { action: 'Verify accounting document generated', type: 'table_check', params: { table: 'VBRK' }, expectedResult: 'Accounting document linked to billing' },
      ]},
    ],
    standard: [
      { name: 'Pricing Condition', tcode: 'VK11', steps: [
        { action: 'Maintain pricing condition record', type: 'rfc_call', params: { tcode: 'VK11' }, expectedResult: 'Condition record created' },
        { action: 'Verify condition in sales order', type: 'table_check', params: { table: 'KONV' }, expectedResult: 'Price condition applied correctly' },
      ]},
      { name: 'ATP Check', tcode: 'CO09', steps: [
        { action: 'Run ATP check for material', type: 'rfc_call', params: { tcode: 'CO09' }, expectedResult: 'Available quantity displayed' },
        { action: 'Verify confirmed quantity', type: 'table_check', params: { table: 'VBBE' }, expectedResult: 'ATP quantity matches stock minus requirements' },
      ]},
      { name: 'Credit Check', tcode: 'FD32', steps: [
        { action: 'Check customer credit exposure', type: 'table_check', params: { table: 'KNKK' }, expectedResult: 'Credit limit and exposure displayed' },
        { action: 'Verify credit block on order if exceeded', type: 'field_validation', params: { creditStatus: 'blocked' }, expectedResult: 'Order blocked when credit exceeded' },
      ]},
    ],
  },
  HR: {
    smoke: [
      { name: 'Employee Create (PA30)', tcode: 'PA30', steps: [
        { action: 'Open PA30 for personnel administration', type: 'rfc_call', params: { tcode: 'PA30' }, expectedResult: 'Personnel master data screen opens' },
        { action: 'Enter personal data infotype 0002', type: 'field_validation', params: { infotype: '0002', firstName: 'Test', lastName: 'Employee' }, expectedResult: 'Personal data saved' },
        { action: 'Enter organizational assignment infotype 0001', type: 'field_validation', params: { infotype: '0001', orgUnit: 'ORG001' }, expectedResult: 'Org assignment saved' },
        { action: 'Verify employee record created', type: 'table_check', params: { table: 'PA0001' }, expectedResult: 'Employee number assigned' },
      ]},
      { name: 'Payroll Simulation (PC00)', tcode: 'PC00', steps: [
        { action: 'Run payroll simulation for employee', type: 'rfc_call', params: { tcode: 'PC00_M99_CALC_SIMU' }, expectedResult: 'Payroll simulation completed' },
        { action: 'Verify gross and net amounts', type: 'table_check', params: { table: 'PCL2' }, expectedResult: 'Gross/net calculation correct' },
      ]},
      { name: 'Time Entry (PA61)', tcode: 'PA61', steps: [
        { action: 'Enter time data infotype 2001', type: 'field_validation', params: { infotype: '2001', absenceType: '0100' }, expectedResult: 'Absence recorded' },
        { action: 'Verify time record', type: 'table_check', params: { table: 'PA2001' }, expectedResult: 'Time record stored correctly' },
      ]},
    ],
    standard: [
      { name: 'Org Assignment', tcode: 'PA30', steps: [
        { action: 'Change org assignment infotype 0001', type: 'field_validation', params: { infotype: '0001' }, expectedResult: 'Org assignment updated' },
        { action: 'Verify position and cost center', type: 'table_check', params: { table: 'PA0001' }, expectedResult: 'Position and cost center match' },
      ]},
      { name: 'Wage Type', tcode: 'PA30', steps: [
        { action: 'Enter basic pay infotype 0008', type: 'field_validation', params: { infotype: '0008', wageType: '1000' }, expectedResult: 'Wage type record created' },
        { action: 'Verify wage type amount', type: 'table_check', params: { table: 'PA0008' }, expectedResult: 'Amount matches input' },
      ]},
    ],
  },
  CO: {
    smoke: [
      { name: 'Cost Center Posting', tcode: 'KB11N', steps: [
        { action: 'Open manual cost posting', type: 'rfc_call', params: { tcode: 'KB11N' }, expectedResult: 'Manual cost posting screen opens' },
        { action: 'Enter cost center and cost element', type: 'field_validation', params: { costCenter: 'CC001', costElement: '400000' }, expectedResult: 'Cost center and element validated' },
        { action: 'Post amount', type: 'bapi_call', params: { bapi: 'BAPI_ACC_MANUAL_ALLOC_POST' }, expectedResult: 'CO document created' },
      ]},
      { name: 'Internal Order Settlement', tcode: 'KO88', steps: [
        { action: 'Execute settlement for internal order', type: 'rfc_call', params: { tcode: 'KO88' }, expectedResult: 'Settlement run executed' },
        { action: 'Verify settlement amounts', type: 'table_check', params: { table: 'COEP' }, expectedResult: 'Amounts settled to receivers' },
      ]},
      { name: 'Profit Center Assignment', tcode: 'KE51', steps: [
        { action: 'Assign cost center to profit center', type: 'field_validation', params: { costCenter: 'CC001', profitCenter: 'PC001' }, expectedResult: 'Assignment saved' },
        { action: 'Verify assignment in master data', type: 'table_check', params: { table: 'CEPC' }, expectedResult: 'Profit center assignment correct' },
      ]},
    ],
    standard: [
      { name: 'Activity Allocation', tcode: 'KB21N', steps: [
        { action: 'Enter activity allocation', type: 'rfc_call', params: { tcode: 'KB21N' }, expectedResult: 'Activity allocation screen opens' },
        { action: 'Enter sender and receiver cost centers', type: 'field_validation', params: { sender: 'CC001', receiver: 'CC002' }, expectedResult: 'Sender/receiver validated' },
        { action: 'Post allocation', type: 'bapi_call', params: { bapi: 'BAPI_ACC_ACTIVITY_ALLOC_POST' }, expectedResult: 'Allocation document created' },
      ]},
      { name: 'Cost Element Verification', tcode: 'KA03', steps: [
        { action: 'Display cost element', type: 'rfc_call', params: { tcode: 'KA03' }, expectedResult: 'Cost element details displayed' },
        { action: 'Verify cost element type and category', type: 'table_check', params: { table: 'CSKA' }, expectedResult: 'Type and category match configuration' },
      ]},
    ],
  },
  PP: {
    smoke: [
      { name: 'BOM Creation (CS01)', tcode: 'CS01', steps: [
        { action: 'Open BOM creation', type: 'rfc_call', params: { tcode: 'CS01' }, expectedResult: 'BOM creation screen opens' },
        { action: 'Enter header material and plant', type: 'field_validation', params: { material: 'FERT001', plant: '1000' }, expectedResult: 'Header material validated' },
        { action: 'Add component items', type: 'bapi_call', params: { bapi: 'CSAP_MAT_BOM_CREATE' }, expectedResult: 'BOM items added successfully' },
        { action: 'Save BOM', type: 'bapi_call', params: { bapi: 'BAPI_TRANSACTION_COMMIT' }, expectedResult: 'BOM number assigned' },
      ]},
      { name: 'Routing (CA01)', tcode: 'CA01', steps: [
        { action: 'Create routing for material', type: 'rfc_call', params: { tcode: 'CA01' }, expectedResult: 'Routing creation screen opens' },
        { action: 'Enter operations with work centers', type: 'field_validation', params: { workCenter: 'WC001' }, expectedResult: 'Operations defined' },
        { action: 'Save routing', type: 'rfc_call', params: { tcode: 'CA01' }, expectedResult: 'Routing saved with group number' },
      ]},
      { name: 'Production Order (CO01)', tcode: 'CO01', steps: [
        { action: 'Create production order', type: 'bapi_call', params: { bapi: 'BAPI_PRODORD_CREATE' }, expectedResult: 'Production order created' },
        { action: 'Release production order', type: 'bapi_call', params: { bapi: 'BAPI_PRODORD_RELEASE' }, expectedResult: 'Order released for execution' },
      ]},
    ],
    standard: [
      { name: 'Order Confirmation (CO11N)', tcode: 'CO11N', steps: [
        { action: 'Enter confirmation for production order', type: 'rfc_call', params: { tcode: 'CO11N' }, expectedResult: 'Confirmation screen opens' },
        { action: 'Enter yield and activity quantities', type: 'field_validation', params: { yield: 100 }, expectedResult: 'Quantities validated' },
        { action: 'Post confirmation', type: 'bapi_call', params: { bapi: 'BAPI_PRODORDCONF_CREATE_TT' }, expectedResult: 'Confirmation document created' },
      ]},
      { name: 'Goods Issue for Production', tcode: 'MIGO', steps: [
        { action: 'Issue components to production order', type: 'bapi_call', params: { bapi: 'BAPI_GOODSMVT_CREATE', movementType: '261' }, expectedResult: 'Goods issue posted' },
        { action: 'Verify component stock reduced', type: 'table_check', params: { table: 'MSEG' }, expectedResult: 'Component stock reduced by issued quantity' },
      ]},
    ],
  },
};

/** Step type definitions */
const VALID_STEP_TYPES = ['rfc_call', 'bapi_call', 'odata_request', 'table_check', 'field_validation', 'workflow_trigger'];

/** Test case type definitions */
const VALID_TEST_TYPES = ['unit', 'integration', 'e2e', 'regression', 'smoke', 'negative'];

/** Module definitions */
const VALID_MODULES = ['FI', 'MM', 'SD', 'HR', 'CO', 'PP'];

/** Priority definitions */
const VALID_PRIORITIES = ['critical', 'high', 'medium', 'low'];

let _idCounter = 0;

class TestEngine {
  /**
   * @param {object} options
   * @param {string} options.mode - 'mock' or 'live'
   * @param {string[]} [options.modules] - SAP modules to focus on (default: all)
   */
  constructor(options = {}) {
    this.mode = options.mode || 'mock';
    this.modules = options.modules || VALID_MODULES;
    this.log = new Logger('test-engine');
    _idCounter = 0;
  }

  /**
   * Generate a unique test case ID
   * @param {string} module - SAP module code
   * @returns {string}
   */
  _generateId(module) {
    _idCounter += 1;
    return `TC-${module}-${String(_idCounter).padStart(3, '0')}`;
  }

  /**
   * Detect SAP modules from natural language text
   * @param {string} text - Input text
   * @returns {string[]} - Array of detected module codes
   */
  _detectModules(text) {
    const lower = text.toLowerCase();
    const detected = [];

    for (const [mod, keywords] of Object.entries(MODULE_KEYWORDS)) {
      if (!this.modules.includes(mod)) continue;
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          if (!detected.includes(mod)) detected.push(mod);
          break;
        }
      }
    }

    return detected.length > 0 ? detected : [this.modules[0]];
  }

  /**
   * Detect actions from natural language text
   * @param {string} text - Input text
   * @returns {string[]} - Array of detected action types
   */
  _detectActions(text) {
    const lower = text.toLowerCase();
    const detected = [];

    for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          if (!detected.includes(action)) detected.push(action);
          break;
        }
      }
    }

    return detected.length > 0 ? detected : ['verify'];
  }

  /**
   * Build a step object
   * @param {number} stepNumber
   * @param {string} action
   * @param {string} type
   * @param {object} params
   * @param {string} expectedResult
   * @returns {object}
   */
  _buildStep(stepNumber, action, type, params, expectedResult) {
    return { stepNumber, action, type, params: params || {}, expectedResult };
  }

  /**
   * Generate test cases from a natural language description
   * @param {string} naturalLanguage - Description of what to test
   * @returns {object[]} - Array of test cases
   */
  generateFromDescription(naturalLanguage) {
    if (!naturalLanguage || typeof naturalLanguage !== 'string' || naturalLanguage.trim().length === 0) {
      throw new TestingError('Natural language description is required', { input: naturalLanguage });
    }

    this.log.info('Generating tests from description', { length: naturalLanguage.length });

    const modules = this._detectModules(naturalLanguage);
    const actions = this._detectActions(naturalLanguage);
    const testCases = [];

    for (const mod of modules) {
      for (const action of actions) {
        const tc = this._buildTestCaseFromAction(mod, action, naturalLanguage);
        testCases.push(tc);

        // Generate a negative test for create/post actions
        if (['create', 'post'].includes(action)) {
          const negativeTc = this._buildNegativeTestCase(mod, action, naturalLanguage);
          testCases.push(negativeTc);
        }
      }
    }

    // Limit to 2-5 test cases as specified
    const result = testCases.slice(0, 5);
    if (result.length < 2 && testCases.length >= 1) {
      // Ensure at least 2 by adding a verification test
      const verifyTc = this._buildTestCaseFromAction(modules[0], 'verify', naturalLanguage);
      verifyTc.id = this._generateId(modules[0]);
      result.push(verifyTc);
    }

    this.log.info('Generated test cases', { count: result.length });
    return result.slice(0, 5);
  }

  /**
   * Build a test case from action and module
   * @param {string} mod - Module code
   * @param {string} action - Action type
   * @param {string} description - Original description
   * @returns {object}
   */
  _buildTestCaseFromAction(mod, action, description) {
    const actionSteps = this._getStepsForAction(mod, action);
    const priority = ['create', 'post', 'reverse'].includes(action) ? 'critical' : 'high';
    const testType = action === 'verify' ? 'integration' : 'e2e';

    return {
      id: this._generateId(mod),
      name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${mod} - ${description.substring(0, 50)}`,
      type: testType,
      module: mod,
      priority,
      tags: [mod.toLowerCase(), action, 'generated'],
      steps: actionSteps,
      expectedResults: actionSteps.map(s => s.expectedResult),
      preconditions: this._getPreconditions(mod, action),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Build a negative test case
   * @param {string} mod
   * @param {string} action
   * @param {string} description
   * @returns {object}
   */
  _buildNegativeTestCase(mod, action, description) {
    return {
      id: this._generateId(mod),
      name: `Negative: ${action} ${mod} with invalid data - ${description.substring(0, 40)}`,
      type: 'negative',
      module: mod,
      priority: 'high',
      tags: [mod.toLowerCase(), action, 'negative', 'generated'],
      steps: [
        this._buildStep(1, `Attempt to ${action} with missing required fields`, 'field_validation', { incomplete: true }, 'Validation error returned'),
        this._buildStep(2, `Attempt to ${action} with invalid data`, 'bapi_call', { invalidData: true }, 'BAPI returns error in RETURN table'),
        this._buildStep(3, 'Verify no data was persisted', 'table_check', { expectEmpty: true }, 'No record created in database'),
      ],
      expectedResults: ['Validation error returned', 'BAPI returns error in RETURN table', 'No record created in database'],
      preconditions: ['Test system available', 'User has authorization'],
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get steps for a given module and action
   * @param {string} mod
   * @param {string} action
   * @returns {object[]}
   */
  _getStepsForAction(mod, action) {
    const stepsMap = {
      create: [
        this._buildStep(1, `Navigate to ${mod} creation transaction`, 'rfc_call', { module: mod }, 'Transaction screen opens'),
        this._buildStep(2, 'Enter required master data fields', 'field_validation', { module: mod }, 'All required fields validated'),
        this._buildStep(3, `Execute ${mod} object creation via BAPI`, 'bapi_call', { module: mod }, 'Object created successfully with ID'),
        this._buildStep(4, 'Verify object exists in database', 'table_check', { module: mod }, 'Record found in relevant SAP table'),
      ],
      post: [
        this._buildStep(1, `Open ${mod} posting transaction`, 'rfc_call', { module: mod }, 'Posting screen opens'),
        this._buildStep(2, 'Enter posting data with amounts', 'field_validation', { module: mod }, 'Data validated and balanced'),
        this._buildStep(3, 'Execute posting', 'bapi_call', { module: mod }, 'Document posted successfully'),
        this._buildStep(4, 'Verify document in accounting', 'table_check', { module: mod }, 'Document visible in system'),
      ],
      verify: [
        this._buildStep(1, `Display ${mod} data`, 'rfc_call', { module: mod }, 'Data displayed correctly'),
        this._buildStep(2, 'Check field values against expected', 'field_validation', { module: mod }, 'All fields match expected values'),
        this._buildStep(3, 'Verify data consistency across tables', 'table_check', { module: mod }, 'Data consistent across related tables'),
      ],
      approve: [
        this._buildStep(1, `Open ${mod} approval workflow`, 'workflow_trigger', { module: mod }, 'Workflow item displayed'),
        this._buildStep(2, 'Review document details', 'field_validation', { module: mod }, 'Document data correct for approval'),
        this._buildStep(3, 'Approve document', 'workflow_trigger', { module: mod, action: 'approve' }, 'Document approved and status updated'),
      ],
      reject: [
        this._buildStep(1, `Open ${mod} approval workflow`, 'workflow_trigger', { module: mod }, 'Workflow item displayed'),
        this._buildStep(2, 'Review document details', 'field_validation', { module: mod }, 'Document data displayed'),
        this._buildStep(3, 'Reject document with reason', 'workflow_trigger', { module: mod, action: 'reject' }, 'Document rejected and status updated'),
      ],
      transfer: [
        this._buildStep(1, `Open ${mod} transfer transaction`, 'rfc_call', { module: mod }, 'Transfer screen opens'),
        this._buildStep(2, 'Enter source and destination', 'field_validation', { module: mod }, 'Source and destination validated'),
        this._buildStep(3, 'Execute transfer', 'bapi_call', { module: mod }, 'Transfer document created'),
        this._buildStep(4, 'Verify quantities at both locations', 'table_check', { module: mod }, 'Stock updated correctly at both locations'),
      ],
      reverse: [
        this._buildStep(1, `Open ${mod} reversal transaction`, 'rfc_call', { module: mod }, 'Reversal screen opens'),
        this._buildStep(2, 'Enter original document reference', 'field_validation', { module: mod }, 'Original document found'),
        this._buildStep(3, 'Execute reversal', 'bapi_call', { module: mod }, 'Reversal document created'),
        this._buildStep(4, 'Verify original document marked as reversed', 'table_check', { module: mod }, 'Original document status updated'),
      ],
      modify: [
        this._buildStep(1, `Open ${mod} change transaction`, 'rfc_call', { module: mod }, 'Change screen opens'),
        this._buildStep(2, 'Modify field values', 'field_validation', { module: mod }, 'Changes validated'),
        this._buildStep(3, 'Save changes', 'bapi_call', { module: mod }, 'Changes saved successfully'),
        this._buildStep(4, 'Verify updated values', 'table_check', { module: mod }, 'Database reflects changes'),
      ],
      delete: [
        this._buildStep(1, `Open ${mod} object for deletion`, 'rfc_call', { module: mod }, 'Object displayed'),
        this._buildStep(2, 'Mark object for deletion/deactivation', 'bapi_call', { module: mod }, 'Deletion flag set'),
        this._buildStep(3, 'Verify object status', 'table_check', { module: mod }, 'Object marked as deleted/inactive'),
      ],
      display: [
        this._buildStep(1, `Open ${mod} display transaction`, 'rfc_call', { module: mod }, 'Display screen opens'),
        this._buildStep(2, 'Verify all data fields displayed', 'field_validation', { module: mod }, 'All fields populated correctly'),
        this._buildStep(3, 'Check related data and history', 'table_check', { module: mod }, 'Related data accessible'),
      ],
    };

    return stepsMap[action] || stepsMap.verify;
  }

  /**
   * Get preconditions for a module and action
   * @param {string} mod
   * @param {string} action
   * @returns {string[]}
   */
  _getPreconditions(mod, action) {
    const base = ['SAP system available', `User has ${mod} authorization`];

    const actionPreconditions = {
      create: [...base, 'Required master data exists (company code, org units)'],
      post: [...base, 'Posting period is open', 'Required master data exists'],
      verify: [...base, 'Test data has been created'],
      approve: [...base, 'Workflow configured', 'Document pending approval'],
      reject: [...base, 'Workflow configured', 'Document pending approval'],
      transfer: [...base, 'Source and target locations exist', 'Sufficient stock available'],
      reverse: [...base, 'Original document exists and is not yet reversed'],
      modify: [...base, 'Object exists and is not locked'],
      delete: [...base, 'Object exists and has no dependent objects'],
      display: [...base, 'Object exists in system'],
    };

    return actionPreconditions[action] || base;
  }

  /**
   * Generate validation tests from configuration changes
   * @param {object[]} configChanges - Array of { table, field, oldValue, newValue, description }
   * @returns {object[]}
   */
  generateFromConfig(configChanges) {
    if (!Array.isArray(configChanges)) {
      throw new TestingError('configChanges must be an array', { input: typeof configChanges });
    }

    if (configChanges.length === 0) {
      return [];
    }

    this.log.info('Generating tests from config changes', { count: configChanges.length });

    const testCases = [];

    for (const change of configChanges) {
      if (!change.table || !change.field) {
        throw new TestingError('Each config change must have table and field', { change });
      }

      const mod = this._detectModuleFromTable(change.table);

      // Positive test: new value works
      testCases.push({
        id: this._generateId(mod),
        name: `Config: ${change.description || `${change.table}.${change.field}`} - Positive`,
        type: 'integration',
        module: mod,
        priority: 'critical',
        tags: [mod.toLowerCase(), 'config', 'positive'],
        steps: [
          this._buildStep(1, `Verify config table ${change.table} field ${change.field}`, 'table_check',
            { table: change.table, field: change.field, expectedValue: change.newValue },
            `Field ${change.field} has new value ${change.newValue}`),
          this._buildStep(2, `Execute business process affected by ${change.field}`, 'bapi_call',
            { module: mod, configField: change.field },
            'Process executes with new configuration'),
          this._buildStep(3, 'Verify process outcome matches new config', 'field_validation',
            { expectedBehavior: 'new' },
            'Business outcome reflects new configuration value'),
        ],
        expectedResults: [
          `Configuration value ${change.newValue} is active`,
          'Business process works with new value',
          'Outcome matches expected behavior',
        ],
        preconditions: [
          'SAP system available',
          `Configuration change applied: ${change.table}.${change.field} = ${change.newValue}`,
          'Transport imported to test system',
        ],
        generatedAt: new Date().toISOString(),
      });

      // Negative test: old value behavior changed
      testCases.push({
        id: this._generateId(mod),
        name: `Config: ${change.description || `${change.table}.${change.field}`} - Negative`,
        type: 'negative',
        module: mod,
        priority: 'high',
        tags: [mod.toLowerCase(), 'config', 'negative'],
        steps: [
          this._buildStep(1, `Verify old value ${change.oldValue} is no longer active`, 'table_check',
            { table: change.table, field: change.field, notExpectedValue: change.oldValue },
            `Field ${change.field} no longer has old value ${change.oldValue}`),
          this._buildStep(2, `Test process behavior that depended on old value ${change.oldValue}`, 'bapi_call',
            { module: mod, configField: change.field, oldValue: change.oldValue },
            'Process behavior has changed from previous'),
        ],
        expectedResults: [
          `Old value ${change.oldValue} is no longer in effect`,
          'Behavior dependent on old value has changed',
        ],
        preconditions: [
          'SAP system available',
          `Previous value was: ${change.table}.${change.field} = ${change.oldValue}`,
        ],
        generatedAt: new Date().toISOString(),
      });
    }

    this.log.info('Generated config test cases', { count: testCases.length });
    return testCases;
  }

  /**
   * Detect module from SAP table name
   * @param {string} tableName
   * @returns {string}
   */
  _detectModuleFromTable(tableName) {
    const upper = tableName.toUpperCase();
    if (/^(BKPF|BSEG|SKA1|T001|FAGL|BSET)/.test(upper)) return 'FI';
    if (/^(EKKO|EKPO|MARA|MARC|EINA|MARD)/.test(upper)) return 'MM';
    if (/^(VBAK|VBAP|VBRK|KONV|KNA1|VBBE)/.test(upper)) return 'SD';
    if (/^(PA0|HRP|PCL|T500)/.test(upper)) return 'HR';
    if (/^(COEP|CSKS|CEPC|CSKA|COBK)/.test(upper)) return 'CO';
    if (/^(AFKO|AFPO|STKO|PLKO|MAST)/.test(upper)) return 'PP';
    return 'FI'; // default
  }

  /**
   * Generate test scenarios from a BPMN process model
   * @param {object} bpmnModel - Parsed BPMN model
   * @returns {object[]}
   */
  generateFromBpmn(bpmnModel) {
    if (!bpmnModel || typeof bpmnModel !== 'object') {
      throw new TestingError('Valid BPMN model object is required', { input: typeof bpmnModel });
    }

    const tasks = bpmnModel.tasks || [];
    const gateways = bpmnModel.gateways || [];
    const flows = bpmnModel.flows || [];

    if (tasks.length === 0) {
      return [];
    }

    this.log.info('Generating tests from BPMN model', { tasks: tasks.length, gateways: gateways.length });

    const paths = this._findPaths(tasks, gateways, flows);
    const testCases = [];

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const mod = this._detectModuleFromBpmn(path);
      const steps = path.map((task, idx) =>
        this._buildStep(idx + 1, task.name || task.id, this._mapBpmnTaskType(task), task.params || {}, task.expectedResult || `${task.name || task.id} completed`)
      );

      testCases.push({
        id: this._generateId(mod),
        name: `BPMN Path ${i + 1}: ${path.map(t => t.name || t.id).join(' -> ').substring(0, 60)}`,
        type: 'e2e',
        module: mod,
        priority: i === 0 ? 'critical' : 'high',
        tags: [mod.toLowerCase(), 'bpmn', `path-${i + 1}`],
        steps,
        expectedResults: steps.map(s => s.expectedResult),
        preconditions: ['SAP system available', 'Process configured in system', 'Test data prepared'],
        generatedAt: new Date().toISOString(),
      });
    }

    this.log.info('Generated BPMN test cases', { count: testCases.length });
    return testCases;
  }

  /**
   * Find unique paths through BPMN model
   * @param {object[]} tasks
   * @param {object[]} gateways
   * @param {object[]} flows
   * @returns {object[][]}
   */
  _findPaths(tasks, gateways, flows) {
    if (tasks.length === 0) return [];

    // If no gateways, single path through all tasks
    if (gateways.length === 0) {
      return [tasks];
    }

    // Build adjacency from flows
    const adj = {};
    const taskMap = {};
    for (const t of tasks) { taskMap[t.id] = t; }
    for (const g of gateways) { taskMap[g.id] = g; }

    for (const f of flows) {
      if (!adj[f.from]) adj[f.from] = [];
      adj[f.from].push(f.to);
    }

    // Find start nodes (not target of any flow)
    const targets = new Set(flows.map(f => f.to));
    let startNodes = [...tasks, ...gateways].filter(n => !targets.has(n.id));
    if (startNodes.length === 0) startNodes = [tasks[0]];

    // DFS to find all paths
    const allPaths = [];
    const visited = new Set();

    const dfs = (nodeId, currentPath) => {
      const node = taskMap[nodeId];
      if (!node) return;

      if (visited.has(nodeId)) {
        if (currentPath.length > 0) allPaths.push([...currentPath]);
        return;
      }

      visited.add(nodeId);

      // Only add tasks to path, not gateways
      const isTask = tasks.some(t => t.id === nodeId);
      if (isTask) currentPath.push(node);

      const next = adj[nodeId] || [];
      if (next.length === 0) {
        if (currentPath.length > 0) allPaths.push([...currentPath]);
      } else {
        for (const nextId of next) {
          visited.delete(nextId); // Allow revisiting for different paths
          dfs(nextId, [...currentPath]);
        }
      }

      visited.delete(nodeId);
    };

    for (const start of startNodes) {
      dfs(start.id, []);
    }

    // Deduplicate paths
    const uniquePaths = [];
    const pathKeys = new Set();
    for (const p of allPaths) {
      const key = p.map(t => t.id).join('|');
      if (!pathKeys.has(key)) {
        pathKeys.add(key);
        uniquePaths.push(p);
      }
    }

    return uniquePaths.length > 0 ? uniquePaths : [tasks];
  }

  /**
   * Detect module from BPMN path tasks
   * @param {object[]} path
   * @returns {string}
   */
  _detectModuleFromBpmn(path) {
    const text = path.map(t => (t.name || '') + ' ' + (t.type || '')).join(' ');
    const detected = this._detectModules(text);
    return detected[0];
  }

  /**
   * Map BPMN task type to test step type
   * @param {object} task
   * @returns {string}
   */
  _mapBpmnTaskType(task) {
    const typeMap = {
      serviceTask: 'bapi_call',
      userTask: 'field_validation',
      scriptTask: 'rfc_call',
      sendTask: 'odata_request',
      receiveTask: 'odata_request',
      manualTask: 'field_validation',
    };
    return typeMap[task.type] || 'rfc_call';
  }

  /**
   * Generate a module-specific regression test suite
   * @param {string} module - SAP module: 'FI', 'MM', 'SD', 'HR', 'CO', 'PP'
   * @param {string} scope - 'smoke', 'standard', 'comprehensive'
   * @returns {object[]}
   */
  generateRegressionSuite(module, scope = 'smoke') {
    const mod = (module || '').toUpperCase();

    if (!VALID_MODULES.includes(mod)) {
      throw new TestingError(`Unknown module: ${module}. Valid modules: ${VALID_MODULES.join(', ')}`, { module });
    }

    if (!['smoke', 'standard', 'comprehensive'].includes(scope)) {
      throw new TestingError(`Unknown scope: ${scope}. Valid scopes: smoke, standard, comprehensive`, { scope });
    }

    this.log.info('Generating regression suite', { module: mod, scope });

    const patterns = MODULE_PATTERNS[mod];
    if (!patterns) {
      throw new TestingError(`No patterns defined for module: ${mod}`, { module: mod });
    }

    let sourcePatterns = [];

    if (scope === 'smoke') {
      sourcePatterns = patterns.smoke || [];
    } else if (scope === 'standard') {
      sourcePatterns = [...(patterns.smoke || []), ...(patterns.standard || [])];
    } else if (scope === 'comprehensive') {
      sourcePatterns = [...(patterns.smoke || []), ...(patterns.standard || [])];
      // Add additional edge-case tests for comprehensive
    }

    const testCases = sourcePatterns.map((pattern, idx) => {
      const steps = pattern.steps.map((s, sIdx) => ({
        stepNumber: sIdx + 1,
        action: s.action,
        type: s.type,
        params: s.params || {},
        expectedResult: s.expectedResult,
      }));

      const priority = idx === 0 ? 'critical' : (scope === 'smoke' ? 'high' : 'medium');

      return {
        id: this._generateId(mod),
        name: `${mod} Regression: ${pattern.name}`,
        type: scope === 'smoke' ? 'smoke' : 'regression',
        module: mod,
        priority,
        tags: [mod.toLowerCase(), scope, 'regression', pattern.tcode.toLowerCase()],
        steps,
        expectedResults: steps.map(s => s.expectedResult),
        preconditions: ['SAP system available', `User has ${mod} authorization`, 'Test data prepared'],
        generatedAt: new Date().toISOString(),
      };
    });

    this.log.info('Generated regression suite', { count: testCases.length });
    return testCases;
  }
}

module.exports = { TestEngine, VALID_STEP_TYPES, VALID_TEST_TYPES, VALID_MODULES, VALID_PRIORITIES };
