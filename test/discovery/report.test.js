const Report = require('../../discovery/report');

/**
 * Build a full mock results object matching the shape produced by Scanner.scanMock().
 * Optionally override individual fields.
 */
function buildMockResults(overrides = {}) {
  return {
    mode: 'mock',
    system: {
      type: 'SAP S/4HANA Public Cloud',
      version: '2502',
      tenant: 'demo-tenant.s4hana.cloud.sap',
      scannedAt: '2025-06-15T10:30:00Z',
    },
    summary: {
      totalScenarios: 2,
      totalAPIs: 2,
      totalEvents: 1,
      totalExtensionPoints: 1,
      categories: ['Master Data', 'Sales'],
    },
    communicationScenarios: [
      {
        id: 'SAP_COM_0008',
        name: 'Business Partner Integration',
        description: 'Inbound/outbound integration for business partner master data',
        apis: ['API_BUSINESS_PARTNER'],
        direction: 'both',
        category: 'Master Data',
      },
      {
        id: 'SAP_COM_0009',
        name: 'Sales Order Integration',
        description: 'Create, read, and update sales orders',
        apis: ['API_SALES_ORDER_SRV'],
        direction: 'both',
        category: 'Sales',
      },
    ],
    releasedAPIs: [
      {
        name: 'API_BUSINESS_PARTNER',
        title: 'Business Partner (A2X)',
        protocol: 'OData V2',
        releaseStatus: 'released',
        category: 'Master Data',
        entities: ['A_BusinessPartner', 'A_BusinessPartnerAddress'],
        operations: ['read', 'create', 'update', 'delete'],
      },
      {
        name: 'API_SALES_ORDER_SRV',
        title: 'Sales Order (A2X)',
        protocol: 'OData V2',
        releaseStatus: 'released',
        category: 'Sales',
        entities: ['A_SalesOrder', 'A_SalesOrderItem'],
        operations: ['read', 'create', 'update'],
      },
    ],
    events: [
      {
        topic: 'sap/s4/beh/businesspartner/v1/BusinessPartner/Created/v1',
        description: 'Triggered when a business partner is created',
      },
    ],
    extensionPoints: [
      {
        type: 'Custom Fields',
        description: 'Add custom fields to standard business objects via Key User Tools',
        objects: ['BusinessPartner', 'SalesOrder'],
        method: 'Key User Extensibility',
      },
    ],
    ...overrides,
  };
}

describe('Report', () => {
  let results;
  let report;

  beforeEach(() => {
    results = buildMockResults();
    report = new Report(results);
  });

  describe('constructor', () => {
    it('should store the results object', () => {
      expect(report.results).toBe(results);
    });

    it('should store results with all expected top-level keys', () => {
      expect(report.results).toHaveProperty('mode');
      expect(report.results).toHaveProperty('system');
      expect(report.results).toHaveProperty('summary');
      expect(report.results).toHaveProperty('communicationScenarios');
      expect(report.results).toHaveProperty('releasedAPIs');
      expect(report.results).toHaveProperty('events');
      expect(report.results).toHaveProperty('extensionPoints');
    });
  });

  describe('toTerminal()', () => {
    it('should contain the report title', () => {
      const output = report.toTerminal();
      expect(output).toContain('SAP API Discovery Report');
    });

    it('should display the mode in uppercase', () => {
      const output = report.toTerminal();
      expect(output).toContain('MOCK');
    });

    it('should display system type and version', () => {
      const output = report.toTerminal();
      expect(output).toContain('SAP S/4HANA Public Cloud');
      expect(output).toContain('2502');
    });

    it('should display tenant information', () => {
      const output = report.toTerminal();
      expect(output).toContain('demo-tenant.s4hana.cloud.sap');
    });

    it('should display the scanned timestamp', () => {
      const output = report.toTerminal();
      expect(output).toContain('2025-06-15T10:30:00Z');
    });

    it('should contain SUMMARY section header', () => {
      const output = report.toTerminal();
      expect(output).toContain('SUMMARY');
    });

    it('should display summary counts', () => {
      const output = report.toTerminal();
      expect(output).toContain('Communication Scenarios:  2');
      expect(output).toContain('Released APIs:            2');
      expect(output).toContain('Business Events:          1');
      expect(output).toContain('Extension Points:         1');
    });

    it('should display categories from the summary', () => {
      const output = report.toTerminal();
      expect(output).toContain('Master Data, Sales');
    });

    it('should contain COMMUNICATION SCENARIOS section', () => {
      const output = report.toTerminal();
      expect(output).toContain('COMMUNICATION SCENARIOS');
    });

    it('should list communication scenarios with id, name, and description', () => {
      const output = report.toTerminal();
      expect(output).toContain('SAP_COM_0008 - Business Partner Integration');
      expect(output).toContain('Inbound/outbound integration for business partner master data');
      expect(output).toContain('SAP_COM_0009 - Sales Order Integration');
    });

    it('should display APIs and direction for each communication scenario', () => {
      const output = report.toTerminal();
      expect(output).toContain('APIs: API_BUSINESS_PARTNER | Direction: both');
      expect(output).toContain('APIs: API_SALES_ORDER_SRV | Direction: both');
    });

    it('should contain RELEASED APIs section', () => {
      const output = report.toTerminal();
      expect(output).toContain('RELEASED APIs');
    });

    it('should list released APIs with title, protocol, status, and category', () => {
      const output = report.toTerminal();
      expect(output).toContain('API_BUSINESS_PARTNER');
      expect(output).toContain('Business Partner (A2X) (OData V2)');
      expect(output).toContain('Status: released | Category: Master Data');
    });

    it('should list entities for each API', () => {
      const output = report.toTerminal();
      expect(output).toContain('Entities: A_BusinessPartner, A_BusinessPartnerAddress');
    });

    it('should list operations for each API', () => {
      const output = report.toTerminal();
      expect(output).toContain('Operations: read, create, update, delete');
      expect(output).toContain('Operations: read, create, update');
    });

    it('should contain BUSINESS EVENTS section', () => {
      const output = report.toTerminal();
      expect(output).toContain('BUSINESS EVENTS');
    });

    it('should list events with topic and description', () => {
      const output = report.toTerminal();
      expect(output).toContain('sap/s4/beh/businesspartner/v1/BusinessPartner/Created/v1');
      expect(output).toContain('Triggered when a business partner is created');
    });

    it('should contain EXTENSION POINTS section', () => {
      const output = report.toTerminal();
      expect(output).toContain('EXTENSION POINTS');
    });

    it('should list extension points with type, method, description, and objects', () => {
      const output = report.toTerminal();
      expect(output).toContain('Custom Fields (Key User Extensibility)');
      expect(output).toContain('Add custom fields to standard business objects via Key User Tools');
      expect(output).toContain('Objects: BusinessPartner, SalesOrder');
    });

    it('should use separator lines made of equals and dashes', () => {
      const output = report.toTerminal();
      expect(output).toContain('='.repeat(60));
      expect(output).toContain('-'.repeat(60));
    });

    it('should return a string', () => {
      const output = report.toTerminal();
      expect(typeof output).toBe('string');
    });
  });

  describe('toMarkdown()', () => {
    it('should start with an H1 heading', () => {
      const output = report.toMarkdown();
      expect(output).toContain('# SAP API Discovery Report');
    });

    it('should contain a system info table with proper markdown headers', () => {
      const output = report.toMarkdown();
      expect(output).toContain('| Field | Value |');
      expect(output).toContain('|-------|-------|');
    });

    it('should display mode in the system info table', () => {
      const output = report.toMarkdown();
      expect(output).toContain('| Mode | mock |');
    });

    it('should display system type and version in the table', () => {
      const output = report.toMarkdown();
      expect(output).toContain('| System | SAP S/4HANA Public Cloud 2502 |');
    });

    it('should display tenant in the table', () => {
      const output = report.toMarkdown();
      expect(output).toContain('| Tenant | demo-tenant.s4hana.cloud.sap |');
    });

    it('should display scanned timestamp in the table', () => {
      const output = report.toMarkdown();
      expect(output).toContain('| Scanned | 2025-06-15T10:30:00Z |');
    });

    it('should contain a Summary H2 section with bold counts', () => {
      const output = report.toMarkdown();
      expect(output).toContain('## Summary');
      expect(output).toContain('- **2** Communication Scenarios');
      expect(output).toContain('- **2** Released APIs');
      expect(output).toContain('- **1** Business Events');
      expect(output).toContain('- **1** Extension Points');
    });

    it('should contain Communication Scenarios H2 with a markdown table', () => {
      const output = report.toMarkdown();
      expect(output).toContain('## Communication Scenarios');
      expect(output).toContain('| ID | Name | Category | Direction |');
      expect(output).toContain('|----|------|----------|-----------|');
    });

    it('should list communication scenarios in the table', () => {
      const output = report.toMarkdown();
      expect(output).toContain('| SAP_COM_0008 | Business Partner Integration | Master Data | both |');
      expect(output).toContain('| SAP_COM_0009 | Sales Order Integration | Sales | both |');
    });

    it('should contain Released APIs H2 with a markdown table', () => {
      const output = report.toMarkdown();
      expect(output).toContain('## Released APIs');
      expect(output).toContain('| API | Title | Protocol | Category | Entities |');
      expect(output).toContain('|-----|-------|----------|----------|----------|');
    });

    it('should list released APIs in the table with entity counts', () => {
      const output = report.toMarkdown();
      expect(output).toContain(
        '| API_BUSINESS_PARTNER | Business Partner (A2X) | OData V2 | Master Data | 2 |'
      );
      expect(output).toContain(
        '| API_SALES_ORDER_SRV | Sales Order (A2X) | OData V2 | Sales | 2 |'
      );
    });

    it('should contain Business Events H2 with event list', () => {
      const output = report.toMarkdown();
      expect(output).toContain('## Business Events');
      expect(output).toContain(
        '- `sap/s4/beh/businesspartner/v1/BusinessPartner/Created/v1` - Triggered when a business partner is created'
      );
    });

    it('should contain Extension Points H2 with subheadings', () => {
      const output = report.toMarkdown();
      expect(output).toContain('## Extension Points');
      expect(output).toContain('### Custom Fields');
      expect(output).toContain('- **Method:** Key User Extensibility');
      expect(output).toContain('- Add custom fields to standard business objects via Key User Tools');
      expect(output).toContain('- Objects: BusinessPartner, SalesOrder');
    });

    it('should return a string', () => {
      const output = report.toMarkdown();
      expect(typeof output).toBe('string');
    });
  });

  describe('empty arrays handling', () => {
    let emptyResults;

    beforeEach(() => {
      emptyResults = buildMockResults({
        communicationScenarios: [],
        releasedAPIs: [],
        events: [],
        extensionPoints: [],
        summary: {
          totalScenarios: 0,
          totalAPIs: 0,
          totalEvents: 0,
          totalExtensionPoints: 0,
          categories: [],
        },
      });
    });

    it('toTerminal() should still contain all section headers with empty arrays', () => {
      const report = new Report(emptyResults);
      const output = report.toTerminal();

      expect(output).toContain('SAP API Discovery Report');
      expect(output).toContain('SUMMARY');
      expect(output).toContain('COMMUNICATION SCENARIOS');
      expect(output).toContain('RELEASED APIs');
      expect(output).toContain('BUSINESS EVENTS');
      expect(output).toContain('EXTENSION POINTS');
    });

    it('toTerminal() should display zero counts with empty arrays', () => {
      const report = new Report(emptyResults);
      const output = report.toTerminal();

      expect(output).toContain('Communication Scenarios:  0');
      expect(output).toContain('Released APIs:            0');
      expect(output).toContain('Business Events:          0');
      expect(output).toContain('Extension Points:         0');
    });

    it('toTerminal() should display empty categories with empty arrays', () => {
      const report = new Report(emptyResults);
      const output = report.toTerminal();

      // categories.join(', ') with empty array produces empty string
      expect(output).toContain('Categories:');
    });

    it('toMarkdown() should still contain all section headers with empty arrays', () => {
      const report = new Report(emptyResults);
      const output = report.toMarkdown();

      expect(output).toContain('# SAP API Discovery Report');
      expect(output).toContain('## Summary');
      expect(output).toContain('## Communication Scenarios');
      expect(output).toContain('## Released APIs');
      expect(output).toContain('## Business Events');
      expect(output).toContain('## Extension Points');
    });

    it('toMarkdown() should display zero counts with empty arrays', () => {
      const report = new Report(emptyResults);
      const output = report.toMarkdown();

      expect(output).toContain('- **0** Communication Scenarios');
      expect(output).toContain('- **0** Released APIs');
      expect(output).toContain('- **0** Business Events');
      expect(output).toContain('- **0** Extension Points');
    });

    it('toMarkdown() should still have table headers even with no data rows', () => {
      const report = new Report(emptyResults);
      const output = report.toMarkdown();

      expect(output).toContain('| ID | Name | Category | Direction |');
      expect(output).toContain('| API | Title | Protocol | Category | Entities |');
    });
  });

  describe('APIs with empty entities', () => {
    it('toTerminal() should display N/A when entities array is empty', () => {
      const resultsWithEmptyEntities = buildMockResults({
        releasedAPIs: [
          {
            name: 'CE_EVENTS_API',
            title: 'Events API',
            protocol: 'REST',
            releaseStatus: 'released',
            category: 'Events',
            entities: [],
            operations: ['read'],
          },
        ],
      });
      const report = new Report(resultsWithEmptyEntities);
      const output = report.toTerminal();

      expect(output).toContain('Entities: N/A');
    });

    it('toMarkdown() should display 0 for entity count when entities array is empty', () => {
      const resultsWithEmptyEntities = buildMockResults({
        releasedAPIs: [
          {
            name: 'CE_EVENTS_API',
            title: 'Events API',
            protocol: 'REST',
            releaseStatus: 'released',
            category: 'Events',
            entities: [],
            operations: ['read'],
          },
        ],
      });
      const report = new Report(resultsWithEmptyEntities);
      const output = report.toMarkdown();

      expect(output).toContain('| CE_EVENTS_API | Events API | REST | Events | 0 |');
    });
  });
});
