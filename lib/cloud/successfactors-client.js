'use strict';

/**
 * SuccessFactors OData V2 Client
 *
 * Provides CRUD operations against SuccessFactors OData V2 APIs
 * with effective dating support, CSRF token management, and $batch.
 *
 * Supports both Basic auth and OAuth 2.0 SAML Bearer assertion.
 */

const Logger = require('../logger');
const { SuccessFactorsError } = require('../errors');

// ── Mock Data ────────────────────────────────────────────────────────

const MOCK_COMPANIES = [
  { externalCode: 'ACME', name: 'ACME Corp', country: 'US', currency: 'USD', status: 'A', startDate: '2010-01-01' },
  { externalCode: 'GLOB', name: 'Global Inc', country: 'DE', currency: 'EUR', status: 'A', startDate: '2012-06-15' },
  { externalCode: 'TECH', name: 'Tech Solutions', country: 'IN', currency: 'INR', status: 'A', startDate: '2015-03-20' },
];

const MOCK_DEPARTMENTS = [
  { externalCode: 'HR001', name: 'Human Resources', companyNav: 'ACME', headOfDepartment: 'EMP001', status: 'A' },
  { externalCode: 'FIN001', name: 'Finance', companyNav: 'ACME', headOfDepartment: 'EMP002', status: 'A' },
  { externalCode: 'IT001', name: 'Information Technology', companyNav: 'GLOB', headOfDepartment: 'EMP003', status: 'A' },
  { externalCode: 'SAL001', name: 'Sales', companyNav: 'GLOB', headOfDepartment: 'EMP004', status: 'A' },
  { externalCode: 'OPS001', name: 'Operations', companyNav: 'TECH', headOfDepartment: 'EMP005', status: 'A' },
];

const MOCK_DIVISIONS = [
  { externalCode: 'DIV_NA', name: 'North America', status: 'A' },
  { externalCode: 'DIV_EU', name: 'Europe', status: 'A' },
  { externalCode: 'DIV_AP', name: 'Asia Pacific', status: 'A' },
];

const MOCK_JOBCODES = [
  { externalCode: 'CEO', name: 'Chief Executive Officer', grade: 'E1', jobFunction: 'EXEC', status: 'A' },
  { externalCode: 'CFO', name: 'Chief Financial Officer', grade: 'E1', jobFunction: 'EXEC', status: 'A' },
  { externalCode: 'CTO', name: 'Chief Technology Officer', grade: 'E1', jobFunction: 'EXEC', status: 'A' },
  { externalCode: 'VP_SALES', name: 'VP of Sales', grade: 'E2', jobFunction: 'SALES', status: 'A' },
  { externalCode: 'SR_DEV', name: 'Senior Developer', grade: 'P3', jobFunction: 'IT', status: 'A' },
  { externalCode: 'DEV', name: 'Software Developer', grade: 'P2', jobFunction: 'IT', status: 'A' },
  { externalCode: 'HR_MGR', name: 'HR Manager', grade: 'M2', jobFunction: 'HR', status: 'A' },
  { externalCode: 'FIN_ANLST', name: 'Financial Analyst', grade: 'P2', jobFunction: 'FIN', status: 'A' },
  { externalCode: 'SALES_REP', name: 'Sales Representative', grade: 'P1', jobFunction: 'SALES', status: 'A' },
  { externalCode: 'OPS_MGR', name: 'Operations Manager', grade: 'M2', jobFunction: 'OPS', status: 'A' },
];

const MOCK_LOCATIONS = [
  { externalCode: 'LOC_NY', name: 'New York Office', country: 'US', city: 'New York', timezone: 'America/New_York' },
  { externalCode: 'LOC_SF', name: 'San Francisco Office', country: 'US', city: 'San Francisco', timezone: 'America/Los_Angeles' },
  { externalCode: 'LOC_BER', name: 'Berlin Office', country: 'DE', city: 'Berlin', timezone: 'Europe/Berlin' },
  { externalCode: 'LOC_MUM', name: 'Mumbai Office', country: 'IN', city: 'Mumbai', timezone: 'Asia/Kolkata' },
];

const MOCK_COSTCENTERS = [
  { externalCode: 'CC1000', name: 'Corporate', companyCode: 'ACME', status: 'A' },
  { externalCode: 'CC2000', name: 'Engineering', companyCode: 'GLOB', status: 'A' },
  { externalCode: 'CC3000', name: 'Sales & Marketing', companyCode: 'GLOB', status: 'A' },
  { externalCode: 'CC4000', name: 'Research', companyCode: 'TECH', status: 'A' },
];

const MOCK_PAYGROUPS = [
  { externalCode: 'PG_US_MON', name: 'US Monthly', country: 'US', payFrequency: 'MONTHLY' },
  { externalCode: 'PG_US_BI', name: 'US Biweekly', country: 'US', payFrequency: 'BIWEEKLY' },
  { externalCode: 'PG_DE_MON', name: 'Germany Monthly', country: 'DE', payFrequency: 'MONTHLY' },
];

const MOCK_EMPLOYEES = [
  {
    personIdExternal: 'EMP001', userId: 'jdoe', startDate: '2015-01-15',
    personal: { firstName: 'John', lastName: 'Doe', gender: 'M', dateOfBirth: '1985-03-22', nationality: 'US' },
    employment: { startDate: '2015-01-15', endDate: null, employmentType: 'FT', company: 'ACME' },
    job: { jobCode: 'CEO', department: 'HR001', location: 'LOC_NY', costCenter: 'CC1000', managerId: null, jobTitle: 'Chief Executive Officer', startDate: '2020-01-01' },
    compensation: { payGrade: 'E1', payGroup: 'PG_US_MON', annualSalary: 350000, currency: 'USD', startDate: '2024-01-01' },
    email: { emailAddress: 'john.doe@acme.com', emailType: 'B', isPrimary: true },
    phone: { phoneNumber: '+1-212-555-0101', phoneType: 'B', isPrimary: true },
  },
  {
    personIdExternal: 'EMP002', userId: 'asmith', startDate: '2016-06-01',
    personal: { firstName: 'Alice', lastName: 'Smith', gender: 'F', dateOfBirth: '1990-07-14', nationality: 'US' },
    employment: { startDate: '2016-06-01', endDate: null, employmentType: 'FT', company: 'ACME' },
    job: { jobCode: 'CFO', department: 'FIN001', location: 'LOC_NY', costCenter: 'CC1000', managerId: 'EMP001', jobTitle: 'Chief Financial Officer', startDate: '2021-04-01' },
    compensation: { payGrade: 'E1', payGroup: 'PG_US_MON', annualSalary: 300000, currency: 'USD', startDate: '2024-01-01' },
    email: { emailAddress: 'alice.smith@acme.com', emailType: 'B', isPrimary: true },
    phone: { phoneNumber: '+1-212-555-0102', phoneType: 'B', isPrimary: true },
  },
  {
    personIdExternal: 'EMP003', userId: 'bmueller', startDate: '2017-03-15',
    personal: { firstName: 'Boris', lastName: 'Mueller', gender: 'M', dateOfBirth: '1982-11-30', nationality: 'DE' },
    employment: { startDate: '2017-03-15', endDate: null, employmentType: 'FT', company: 'GLOB' },
    job: { jobCode: 'CTO', department: 'IT001', location: 'LOC_BER', costCenter: 'CC2000', managerId: null, jobTitle: 'Chief Technology Officer', startDate: '2019-07-01' },
    compensation: { payGrade: 'E1', payGroup: 'PG_DE_MON', annualSalary: 250000, currency: 'EUR', startDate: '2024-01-01' },
    email: { emailAddress: 'boris.mueller@global-inc.com', emailType: 'B', isPrimary: true },
    phone: { phoneNumber: '+49-30-555-0103', phoneType: 'B', isPrimary: true },
  },
  {
    personIdExternal: 'EMP004', userId: 'cwilson', startDate: '2018-09-01',
    personal: { firstName: 'Catherine', lastName: 'Wilson', gender: 'F', dateOfBirth: '1988-05-18', nationality: 'US' },
    employment: { startDate: '2018-09-01', endDate: null, employmentType: 'FT', company: 'GLOB' },
    job: { jobCode: 'VP_SALES', department: 'SAL001', location: 'LOC_SF', costCenter: 'CC3000', managerId: 'EMP003', jobTitle: 'VP of Sales', startDate: '2022-01-01' },
    compensation: { payGrade: 'E2', payGroup: 'PG_US_BI', annualSalary: 220000, currency: 'USD', startDate: '2024-01-01' },
    email: { emailAddress: 'catherine.wilson@global-inc.com', emailType: 'B', isPrimary: true },
    phone: { phoneNumber: '+1-415-555-0104', phoneType: 'B', isPrimary: true },
  },
  {
    personIdExternal: 'EMP005', userId: 'rpatel', startDate: '2019-11-20',
    personal: { firstName: 'Raj', lastName: 'Patel', gender: 'M', dateOfBirth: '1992-09-10', nationality: 'IN' },
    employment: { startDate: '2019-11-20', endDate: null, employmentType: 'FT', company: 'TECH' },
    job: { jobCode: 'SR_DEV', department: 'OPS001', location: 'LOC_MUM', costCenter: 'CC4000', managerId: 'EMP003', jobTitle: 'Senior Developer', startDate: '2023-04-01' },
    compensation: { payGrade: 'P3', payGroup: 'PG_US_MON', annualSalary: 180000, currency: 'INR', startDate: '2024-01-01' },
    email: { emailAddress: 'raj.patel@techsolutions.in', emailType: 'B', isPrimary: true },
    phone: { phoneNumber: '+91-22-555-0105', phoneType: 'B', isPrimary: true },
  },
];

// ── Entity set metadata definitions ──────────────────────────────────

const METADATA_DEFINITIONS = {
  FOCompany: {
    entityType: 'FOCompany',
    keyFields: ['externalCode', 'startDate'],
    fields: [
      { name: 'externalCode', type: 'Edm.String', key: true },
      { name: 'startDate', type: 'Edm.DateTime', key: true },
      { name: 'name', type: 'Edm.String' },
      { name: 'country', type: 'Edm.String' },
      { name: 'currency', type: 'Edm.String' },
      { name: 'status', type: 'Edm.String' },
    ],
  },
  FODepartment: {
    entityType: 'FODepartment',
    keyFields: ['externalCode', 'startDate'],
    fields: [
      { name: 'externalCode', type: 'Edm.String', key: true },
      { name: 'startDate', type: 'Edm.DateTime', key: true },
      { name: 'name', type: 'Edm.String' },
      { name: 'companyNav', type: 'Edm.String' },
      { name: 'headOfDepartment', type: 'Edm.String' },
      { name: 'status', type: 'Edm.String' },
    ],
  },
  FODivision: {
    entityType: 'FODivision',
    keyFields: ['externalCode', 'startDate'],
    fields: [
      { name: 'externalCode', type: 'Edm.String', key: true },
      { name: 'startDate', type: 'Edm.DateTime', key: true },
      { name: 'name', type: 'Edm.String' },
      { name: 'status', type: 'Edm.String' },
    ],
  },
  FOJobCode: {
    entityType: 'FOJobCode',
    keyFields: ['externalCode', 'startDate'],
    fields: [
      { name: 'externalCode', type: 'Edm.String', key: true },
      { name: 'startDate', type: 'Edm.DateTime', key: true },
      { name: 'name', type: 'Edm.String' },
      { name: 'grade', type: 'Edm.String' },
      { name: 'jobFunction', type: 'Edm.String' },
      { name: 'status', type: 'Edm.String' },
    ],
  },
  FOLocation: {
    entityType: 'FOLocation',
    keyFields: ['externalCode', 'startDate'],
    fields: [
      { name: 'externalCode', type: 'Edm.String', key: true },
      { name: 'startDate', type: 'Edm.DateTime', key: true },
      { name: 'name', type: 'Edm.String' },
      { name: 'country', type: 'Edm.String' },
      { name: 'city', type: 'Edm.String' },
      { name: 'timezone', type: 'Edm.String' },
    ],
  },
  FOCostCenter: {
    entityType: 'FOCostCenter',
    keyFields: ['externalCode', 'startDate'],
    fields: [
      { name: 'externalCode', type: 'Edm.String', key: true },
      { name: 'startDate', type: 'Edm.DateTime', key: true },
      { name: 'name', type: 'Edm.String' },
      { name: 'companyCode', type: 'Edm.String' },
      { name: 'status', type: 'Edm.String' },
    ],
  },
  FOPayGroup: {
    entityType: 'FOPayGroup',
    keyFields: ['externalCode', 'startDate'],
    fields: [
      { name: 'externalCode', type: 'Edm.String', key: true },
      { name: 'startDate', type: 'Edm.DateTime', key: true },
      { name: 'name', type: 'Edm.String' },
      { name: 'country', type: 'Edm.String' },
      { name: 'payFrequency', type: 'Edm.String' },
    ],
  },
  EmpEmployment: {
    entityType: 'EmpEmployment',
    keyFields: ['personIdExternal', 'userId'],
    fields: [
      { name: 'personIdExternal', type: 'Edm.String', key: true },
      { name: 'userId', type: 'Edm.String', key: true },
      { name: 'startDate', type: 'Edm.DateTime' },
      { name: 'endDate', type: 'Edm.DateTime' },
      { name: 'employmentType', type: 'Edm.String' },
      { name: 'company', type: 'Edm.String' },
    ],
  },
  EmpJob: {
    entityType: 'EmpJob',
    keyFields: ['userId', 'startDate'],
    fields: [
      { name: 'userId', type: 'Edm.String', key: true },
      { name: 'startDate', type: 'Edm.DateTime', key: true },
      { name: 'jobCode', type: 'Edm.String' },
      { name: 'department', type: 'Edm.String' },
      { name: 'location', type: 'Edm.String' },
      { name: 'costCenter', type: 'Edm.String' },
      { name: 'managerId', type: 'Edm.String' },
      { name: 'jobTitle', type: 'Edm.String' },
    ],
  },
  EmpCompensation: {
    entityType: 'EmpCompensation',
    keyFields: ['userId', 'startDate'],
    fields: [
      { name: 'userId', type: 'Edm.String', key: true },
      { name: 'startDate', type: 'Edm.DateTime', key: true },
      { name: 'payGrade', type: 'Edm.String' },
      { name: 'payGroup', type: 'Edm.String' },
      { name: 'annualSalary', type: 'Edm.Decimal' },
      { name: 'currency', type: 'Edm.String' },
    ],
  },
  PerPersonal: {
    entityType: 'PerPersonal',
    keyFields: ['personIdExternal', 'startDate'],
    fields: [
      { name: 'personIdExternal', type: 'Edm.String', key: true },
      { name: 'startDate', type: 'Edm.DateTime', key: true },
      { name: 'firstName', type: 'Edm.String' },
      { name: 'lastName', type: 'Edm.String' },
      { name: 'gender', type: 'Edm.String' },
      { name: 'dateOfBirth', type: 'Edm.DateTime' },
      { name: 'nationality', type: 'Edm.String' },
    ],
  },
  PerEmail: {
    entityType: 'PerEmail',
    keyFields: ['personIdExternal', 'emailType'],
    fields: [
      { name: 'personIdExternal', type: 'Edm.String', key: true },
      { name: 'emailType', type: 'Edm.String', key: true },
      { name: 'emailAddress', type: 'Edm.String' },
      { name: 'isPrimary', type: 'Edm.Boolean' },
    ],
  },
  PerPhone: {
    entityType: 'PerPhone',
    keyFields: ['personIdExternal', 'phoneType'],
    fields: [
      { name: 'personIdExternal', type: 'Edm.String', key: true },
      { name: 'phoneType', type: 'Edm.String', key: true },
      { name: 'phoneNumber', type: 'Edm.String' },
      { name: 'isPrimary', type: 'Edm.Boolean' },
    ],
  },
};

// ── Helper: build mock entity set data ───────────────────────────────

function _buildMockEntitySets() {
  const sets = {
    FOCompany: JSON.parse(JSON.stringify(MOCK_COMPANIES)),
    FODepartment: JSON.parse(JSON.stringify(MOCK_DEPARTMENTS)),
    FODivision: JSON.parse(JSON.stringify(MOCK_DIVISIONS)),
    FOJobCode: JSON.parse(JSON.stringify(MOCK_JOBCODES)),
    FOLocation: JSON.parse(JSON.stringify(MOCK_LOCATIONS)),
    FOCostCenter: JSON.parse(JSON.stringify(MOCK_COSTCENTERS)),
    FOPayGroup: JSON.parse(JSON.stringify(MOCK_PAYGROUPS)),
    EmpEmployment: MOCK_EMPLOYEES.map((e) => ({
      personIdExternal: e.personIdExternal,
      userId: e.userId,
      ...e.employment,
    })),
    EmpJob: MOCK_EMPLOYEES.map((e) => ({
      userId: e.userId,
      ...e.job,
    })),
    EmpCompensation: MOCK_EMPLOYEES.map((e) => ({
      userId: e.userId,
      ...e.compensation,
    })),
    PerPersonal: MOCK_EMPLOYEES.map((e) => ({
      personIdExternal: e.personIdExternal,
      ...e.personal,
    })),
    PerEmail: MOCK_EMPLOYEES.map((e) => ({
      personIdExternal: e.personIdExternal,
      ...e.email,
    })),
    PerPhone: MOCK_EMPLOYEES.map((e) => ({
      personIdExternal: e.personIdExternal,
      ...e.phone,
    })),
  };
  return sets;
}

// ── SuccessFactorsClient ─────────────────────────────────────────────

class SuccessFactorsClient {
  /**
   * @param {object} options
   * @param {string} options.baseUrl - SuccessFactors API base URL
   * @param {string} options.companyId - Company ID
   * @param {string} [options.username] - Basic auth user
   * @param {string} [options.password] - Basic auth password
   * @param {object} [options.oauth] - OAuth 2.0 SAML bearer options
   * @param {string} [options.oauth.clientId] - OAuth client ID
   * @param {string} [options.oauth.privateKey] - SAML signing key
   * @param {string} [options.oauth.userId] - Assertion user
   * @param {string} [options.oauth.tokenUrl] - Token endpoint
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   */
  constructor(options = {}) {
    if (!options.baseUrl && options.mode === 'live') {
      throw new SuccessFactorsError('baseUrl is required', { field: 'baseUrl' });
    }

    this.baseUrl = (options.baseUrl || 'https://mock-sf-api.successfactors.com').replace(/\/+$/, '');
    this.companyId = options.companyId || 'MOCK_COMPANY';
    this.username = options.username || null;
    this.password = options.password || null;
    this.oauth = options.oauth || null;
    this.mode = options.mode || 'mock';

    this._authenticated = false;
    this._csrfToken = null;
    this._csrfExpiry = 0;
    this._accessToken = null;

    this._mockData = _buildMockEntitySets();
    this._mockCreated = {};

    this.log = new Logger('sf-client');
    this.log.info(`SuccessFactors client initialized in ${this.mode} mode`, { companyId: this.companyId });
  }

  /**
   * Authenticate to SuccessFactors via Basic auth or OAuth 2.0 SAML Bearer
   */
  async authenticate() {
    this.log.info('Authenticating to SuccessFactors');

    if (this.mode === 'mock') {
      this._authenticated = true;
      this._accessToken = 'mock-sf-token-' + Date.now();
      this.log.info('Mock authentication successful');
      return { authenticated: true, mode: 'mock' };
    }

    // Live mode: Basic auth or OAuth
    try {
      if (this.oauth) {
        this._accessToken = await this._authenticateOAuth();
      } else if (this.username && this.password) {
        this._accessToken = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      } else {
        throw new SuccessFactorsError('No credentials provided. Supply username/password or oauth config.');
      }
      this._authenticated = true;
      return { authenticated: true, mode: 'live' };
    } catch (err) {
      if (err instanceof SuccessFactorsError) throw err;
      throw new SuccessFactorsError(`Authentication failed: ${err.message}`, { cause: err.message });
    }
  }

  /**
   * GET single entity by key
   * @param {string} entitySet
   * @param {string} key - Entity key value (e.g. 'ACME' or "personIdExternal='EMP001'")
   * @param {object} [params] - Query params ($select, $expand, asOfDate, etc.)
   */
  async getEntity(entitySet, key, params = {}) {
    this._ensureAuthenticated();
    this._validateEntitySet(entitySet);

    this.log.debug(`GET ${entitySet}('${key}')`, params);

    if (this.mode === 'mock') {
      return this._mockGetEntity(entitySet, key, params);
    }

    const queryParams = this._buildQueryParams(params);
    const url = `${this.baseUrl}/odata/v2/${entitySet}('${encodeURIComponent(key)}')`;
    return this._liveRequest('GET', url, null, queryParams);
  }

  /**
   * Query entity set with OData parameters
   * @param {string} entitySet
   * @param {object} [params] - $filter, $select, $expand, $top, $skip, $orderby, asOfDate, fromDate, toDate
   */
  async queryEntities(entitySet, params = {}) {
    this._ensureAuthenticated();
    this._validateEntitySet(entitySet);

    this.log.debug(`GET ${entitySet}`, params);

    if (this.mode === 'mock') {
      return this._mockQueryEntities(entitySet, params);
    }

    const queryParams = this._buildQueryParams(params);
    const url = `${this.baseUrl}/odata/v2/${entitySet}`;
    return this._liveRequest('GET', url, null, queryParams);
  }

  /**
   * Create a new entity
   * @param {string} entitySet
   * @param {object} data - Entity fields
   */
  async createEntity(entitySet, data) {
    this._ensureAuthenticated();
    this._validateEntitySet(entitySet);

    if (!data || typeof data !== 'object') {
      throw new SuccessFactorsError('Entity data is required for create', { entitySet });
    }

    this.log.debug(`POST ${entitySet}`, { fields: Object.keys(data) });

    if (this.mode === 'mock') {
      return this._mockCreateEntity(entitySet, data);
    }

    await this._ensureCsrfToken();
    const url = `${this.baseUrl}/odata/v2/${entitySet}`;
    return this._liveRequest('POST', url, data);
  }

  /**
   * Update an entity (PUT/MERGE semantics)
   * @param {string} entitySet
   * @param {string} key
   * @param {object} data
   */
  async updateEntity(entitySet, key, data) {
    this._ensureAuthenticated();
    this._validateEntitySet(entitySet);

    if (!key) {
      throw new SuccessFactorsError('Entity key is required for update', { entitySet });
    }

    this.log.debug(`MERGE ${entitySet}('${key}')`, { fields: Object.keys(data) });

    if (this.mode === 'mock') {
      return this._mockUpdateEntity(entitySet, key, data);
    }

    await this._ensureCsrfToken();
    const url = `${this.baseUrl}/odata/v2/${entitySet}('${encodeURIComponent(key)}')`;
    return this._liveRequest('MERGE', url, data);
  }

  /**
   * Delete an entity
   * @param {string} entitySet
   * @param {string} key
   */
  async deleteEntity(entitySet, key) {
    this._ensureAuthenticated();
    this._validateEntitySet(entitySet);

    if (!key) {
      throw new SuccessFactorsError('Entity key is required for delete', { entitySet });
    }

    this.log.debug(`DELETE ${entitySet}('${key}')`);

    if (this.mode === 'mock') {
      return this._mockDeleteEntity(entitySet, key);
    }

    await this._ensureCsrfToken();
    const url = `${this.baseUrl}/odata/v2/${entitySet}('${encodeURIComponent(key)}')`;
    return this._liveRequest('DELETE', url);
  }

  /**
   * Execute batch operations
   * @param {Array} operations - [{ method, entitySet, key?, data? }]
   */
  async executeBatch(operations) {
    this._ensureAuthenticated();

    if (!operations || operations.length === 0) {
      return { results: [], status: 'empty' };
    }

    this.log.debug(`$batch with ${operations.length} operations`);

    if (this.mode === 'mock') {
      return this._mockExecuteBatch(operations);
    }

    await this._ensureCsrfToken();
    const batchBody = this._buildBatchBody(operations);
    const url = `${this.baseUrl}/odata/v2/$batch`;
    return this._liveRequest('POST', url, batchBody, {}, { 'Content-Type': 'multipart/mixed; boundary=batch' });
  }

  /**
   * Get metadata for entity sets
   * @param {string} [entitySet] - Specific entity set (optional, returns all if omitted)
   */
  async getMetadata(entitySet) {
    this._ensureAuthenticated();

    this.log.debug('GET $metadata', { entitySet });

    if (this.mode === 'mock') {
      if (entitySet) {
        if (!METADATA_DEFINITIONS[entitySet]) {
          throw new SuccessFactorsError(`Unknown entity set: ${entitySet}`, { entitySet });
        }
        return METADATA_DEFINITIONS[entitySet];
      }
      return { ...METADATA_DEFINITIONS };
    }

    const url = `${this.baseUrl}/odata/v2/$metadata`;
    return this._liveRequest('GET', url);
  }

  // ── Private: mock operations ───────────────────────────────────────

  _mockGetEntity(entitySet, key, params) {
    const data = this._mockData[entitySet] || [];
    const meta = METADATA_DEFINITIONS[entitySet];
    if (!meta) {
      throw new SuccessFactorsError(`Unknown entity set: ${entitySet}`, { entitySet });
    }

    const primaryKey = meta.keyFields[0];
    const entity = data.find((e) => e[primaryKey] === key);

    if (!entity) {
      throw new SuccessFactorsError(`Entity not found: ${entitySet}('${key}')`, {
        entitySet,
        key,
        statusCode: 404,
      });
    }

    let result = { ...entity };
    if (params.$select) {
      const fields = params.$select.split(',').map((f) => f.trim());
      result = {};
      for (const field of fields) {
        if (entity[field] !== undefined) {
          result[field] = entity[field];
        }
      }
    }

    return { d: result };
  }

  _mockQueryEntities(entitySet, params) {
    let data = [...(this._mockData[entitySet] || [])];
    const meta = METADATA_DEFINITIONS[entitySet];
    if (!meta) {
      throw new SuccessFactorsError(`Unknown entity set: ${entitySet}`, { entitySet });
    }

    // Apply effective dating
    if (params.asOfDate || params.fromDate || params.toDate) {
      data = this._applyEffectiveDating(data, params);
    }

    // Apply simple filter matching
    if (params.$filter) {
      data = this._applyMockFilter(data, params.$filter);
    }

    // Apply ordering
    if (params.$orderby) {
      const [field, dir] = params.$orderby.split(' ');
      data.sort((a, b) => {
        if (a[field] < b[field]) return dir === 'desc' ? 1 : -1;
        if (a[field] > b[field]) return dir === 'desc' ? -1 : 1;
        return 0;
      });
    }

    const total = data.length;

    // Apply pagination
    if (params.$skip) {
      data = data.slice(Number(params.$skip));
    }
    if (params.$top) {
      data = data.slice(0, Number(params.$top));
    }

    // Apply select
    if (params.$select) {
      const fields = params.$select.split(',').map((f) => f.trim());
      data = data.map((e) => {
        const result = {};
        for (const field of fields) {
          if (e[field] !== undefined) result[field] = e[field];
        }
        return result;
      });
    }

    return { d: { results: data, __count: String(total) } };
  }

  _mockCreateEntity(entitySet, data) {
    const created = { ...data, __metadata: { uri: `${entitySet}('${data.externalCode || Date.now()}')`, type: entitySet } };

    if (!this._mockCreated[entitySet]) {
      this._mockCreated[entitySet] = [];
    }
    this._mockCreated[entitySet].push(created);
    this._mockData[entitySet].push(created);

    return { d: created };
  }

  _mockUpdateEntity(entitySet, key, data) {
    const meta = METADATA_DEFINITIONS[entitySet];
    const primaryKey = meta.keyFields[0];
    const idx = this._mockData[entitySet].findIndex((e) => e[primaryKey] === key);

    if (idx === -1) {
      throw new SuccessFactorsError(`Entity not found: ${entitySet}('${key}')`, { entitySet, key, statusCode: 404 });
    }

    this._mockData[entitySet][idx] = { ...this._mockData[entitySet][idx], ...data };
    return { d: this._mockData[entitySet][idx] };
  }

  _mockDeleteEntity(entitySet, key) {
    const meta = METADATA_DEFINITIONS[entitySet];
    const primaryKey = meta.keyFields[0];
    const idx = this._mockData[entitySet].findIndex((e) => e[primaryKey] === key);

    if (idx === -1) {
      throw new SuccessFactorsError(`Entity not found: ${entitySet}('${key}')`, { entitySet, key, statusCode: 404 });
    }

    this._mockData[entitySet].splice(idx, 1);
    return { status: 204 };
  }

  _mockExecuteBatch(operations) {
    const results = [];

    for (const op of operations) {
      try {
        let result;
        switch (op.method.toUpperCase()) {
          case 'GET':
            result = op.key
              ? this._mockGetEntity(op.entitySet, op.key, {})
              : this._mockQueryEntities(op.entitySet, {});
            results.push({ status: 200, data: result });
            break;
          case 'POST':
            result = this._mockCreateEntity(op.entitySet, op.data || {});
            results.push({ status: 201, data: result });
            break;
          case 'MERGE':
          case 'PUT':
            result = this._mockUpdateEntity(op.entitySet, op.key, op.data || {});
            results.push({ status: 200, data: result });
            break;
          case 'DELETE':
            this._mockDeleteEntity(op.entitySet, op.key);
            results.push({ status: 204, data: null });
            break;
          default:
            results.push({ status: 400, data: { error: `Unknown method: ${op.method}` } });
        }
      } catch (err) {
        results.push({ status: err.details?.statusCode || 500, data: { error: err.message } });
      }
    }

    return { results, status: 'completed' };
  }

  // ── Private: helpers ───────────────────────────────────────────────

  _ensureAuthenticated() {
    if (!this._authenticated) {
      throw new SuccessFactorsError('Not authenticated. Call authenticate() first.');
    }
  }

  _validateEntitySet(entitySet) {
    if (!METADATA_DEFINITIONS[entitySet]) {
      throw new SuccessFactorsError(`Unknown entity set: ${entitySet}`, { entitySet });
    }
  }

  _buildQueryParams(params) {
    const queryParams = {};
    const odataKeys = ['$filter', '$select', '$expand', '$top', '$skip', '$orderby', '$inlinecount'];
    const dateKeys = ['asOfDate', 'fromDate', 'toDate'];

    for (const key of [...odataKeys, ...dateKeys]) {
      if (params[key] !== undefined) {
        queryParams[key] = params[key];
      }
    }
    return queryParams;
  }

  _applyEffectiveDating(data, params) {
    // Simple effective-dating simulation: if records have a startDate field, filter accordingly
    return data.filter((e) => {
      if (!e.startDate) return true;
      const start = new Date(e.startDate);
      if (params.asOfDate) {
        const asOf = new Date(params.asOfDate);
        return start <= asOf;
      }
      if (params.fromDate && params.toDate) {
        const from = new Date(params.fromDate);
        const to = new Date(params.toDate);
        return start >= from && start <= to;
      }
      return true;
    });
  }

  _applyMockFilter(data, filter) {
    // Parse simple eq filters: "field eq 'value'"
    const eqMatch = filter.match(/(\w+)\s+eq\s+'([^']+)'/);
    if (eqMatch) {
      const [, field, value] = eqMatch;
      return data.filter((e) => e[field] === value);
    }
    return data;
  }

  async _ensureCsrfToken() {
    if (this._csrfToken && Date.now() < this._csrfExpiry) return;

    try {
      const headers = this._getAuthHeaders();
      headers['x-csrf-token'] = 'Fetch';

      const response = await fetch(this.baseUrl + '/odata/v2/', {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000),
      });

      this._csrfToken = response.headers.get('x-csrf-token') || 'unused';
      this._csrfExpiry = Date.now() + 25 * 60 * 1000;
    } catch (err) {
      this.log.warn('CSRF token fetch failed', { error: err.message });
      this._csrfToken = 'fallback';
      this._csrfExpiry = Date.now() + 5 * 60 * 1000;
    }
  }

  _getAuthHeaders() {
    const headers = {};
    if (this.oauth && this._accessToken) {
      headers['Authorization'] = `Bearer ${this._accessToken}`;
    } else if (this._accessToken) {
      headers['Authorization'] = `Basic ${this._accessToken}`;
    }
    return headers;
  }

  async _authenticateOAuth() {
    const tokenUrl = this.oauth.tokenUrl || `${this.baseUrl}/oauth/token`;
    const params = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer',
      client_id: this.oauth.clientId,
      company_id: this.companyId,
      user_id: this.oauth.userId,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new SuccessFactorsError(`OAuth token request failed: ${response.status}`, { status: response.status });
    }

    const tokenData = await response.json();
    return tokenData.access_token;
  }

  async _liveRequest(method, url, body, queryParams = {}, extraHeaders = {}) {
    const fullUrl = new URL(url);
    for (const [k, v] of Object.entries(queryParams)) {
      fullUrl.searchParams.set(k, v);
    }

    const headers = {
      ...this._getAuthHeaders(),
      ...extraHeaders,
      Accept: 'application/json',
    };

    if (this._csrfToken && ['POST', 'PUT', 'MERGE', 'DELETE'].includes(method)) {
      headers['x-csrf-token'] = this._csrfToken;
    }

    const fetchOptions = {
      method: method === 'MERGE' ? 'POST' : method,
      headers,
      signal: AbortSignal.timeout(30000),
    };

    if (method === 'MERGE') {
      headers['X-HTTP-Method'] = 'MERGE';
    }

    if (body && method !== 'GET') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(fullUrl.toString(), fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new SuccessFactorsError(`Request failed: ${response.status} ${response.statusText}`, {
        status: response.status,
        url: fullUrl.toString(),
        body: errorText,
      });
    }

    if (response.status === 204) return { status: 204 };

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  _buildBatchBody(operations) {
    const boundary = 'batch_' + Date.now();
    const changeset = 'changeset_' + Date.now();
    let body = '';

    for (const op of operations) {
      if (op.method === 'GET') {
        body += `--${boundary}\r\n`;
        body += 'Content-Type: application/http\r\n\r\n';
        body += `GET ${op.entitySet}${op.key ? `('${op.key}')` : ''} HTTP/1.1\r\n`;
        body += 'Accept: application/json\r\n\r\n';
      } else {
        body += `--${boundary}\r\n`;
        body += `Content-Type: multipart/mixed; boundary=${changeset}\r\n\r\n`;
        body += `--${changeset}\r\n`;
        body += 'Content-Type: application/http\r\n\r\n';
        body += `${op.method} ${op.entitySet}${op.key ? `('${op.key}')` : ''} HTTP/1.1\r\n`;
        body += 'Content-Type: application/json\r\n\r\n';
        if (op.data) body += JSON.stringify(op.data);
        body += `\r\n--${changeset}--\r\n`;
      }
    }

    body += `--${boundary}--`;
    return body;
  }
}

module.exports = SuccessFactorsClient;
