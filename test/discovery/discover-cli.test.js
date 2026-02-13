const Scanner = require('../../discovery/scanner');
const Report = require('../../discovery/report');

describe('Discovery CLI (discover.js)', () => {
  describe('Scanner and Report integration', () => {
    it('should require Scanner and Report without errors', () => {
      expect(Scanner).toBeDefined();
      expect(Report).toBeDefined();
      expect(typeof Scanner).toBe('function');
      expect(typeof Report).toBe('function');
    });
  });

  describe('Scanner mock mode result shape', () => {
    let results;

    beforeEach(async () => {
      const scanner = new Scanner();
      results = await scanner.scan();
    });

    it('should produce results in mock mode', () => {
      expect(results.mode).toBe('mock');
    });

    it('should include a system object with type, version, tenant, and scannedAt', () => {
      expect(results.system).toHaveProperty('type');
      expect(results.system).toHaveProperty('version');
      expect(results.system).toHaveProperty('tenant');
      expect(results.system).toHaveProperty('scannedAt');
      expect(typeof results.system.type).toBe('string');
      expect(typeof results.system.version).toBe('string');
      expect(typeof results.system.tenant).toBe('string');
      expect(typeof results.system.scannedAt).toBe('string');
    });

    it('should include a summary object with correct count fields', () => {
      expect(results.summary).toHaveProperty('totalScenarios');
      expect(results.summary).toHaveProperty('totalAPIs');
      expect(results.summary).toHaveProperty('totalEvents');
      expect(results.summary).toHaveProperty('totalExtensionPoints');
      expect(results.summary).toHaveProperty('categories');
      expect(typeof results.summary.totalScenarios).toBe('number');
      expect(typeof results.summary.totalAPIs).toBe('number');
      expect(typeof results.summary.totalEvents).toBe('number');
      expect(typeof results.summary.totalExtensionPoints).toBe('number');
      expect(Array.isArray(results.summary.categories)).toBe(true);
    });

    it('should include communicationScenarios as an array of objects with expected fields', () => {
      expect(Array.isArray(results.communicationScenarios)).toBe(true);
      expect(results.communicationScenarios.length).toBeGreaterThan(0);

      for (const scenario of results.communicationScenarios) {
        expect(scenario).toHaveProperty('id');
        expect(scenario).toHaveProperty('name');
        expect(scenario).toHaveProperty('description');
        expect(scenario).toHaveProperty('apis');
        expect(scenario).toHaveProperty('direction');
        expect(scenario).toHaveProperty('category');
        expect(Array.isArray(scenario.apis)).toBe(true);
      }
    });

    it('should include releasedAPIs as an array of objects with expected fields', () => {
      expect(Array.isArray(results.releasedAPIs)).toBe(true);
      expect(results.releasedAPIs.length).toBeGreaterThan(0);

      for (const api of results.releasedAPIs) {
        expect(api).toHaveProperty('name');
        expect(api).toHaveProperty('title');
        expect(api).toHaveProperty('protocol');
        expect(api).toHaveProperty('releaseStatus');
        expect(api).toHaveProperty('category');
        expect(api).toHaveProperty('entities');
        expect(api).toHaveProperty('operations');
        expect(Array.isArray(api.entities)).toBe(true);
        expect(Array.isArray(api.operations)).toBe(true);
      }
    });

    it('should include events as an array of objects with topic and description', () => {
      expect(Array.isArray(results.events)).toBe(true);
      expect(results.events.length).toBeGreaterThan(0);

      for (const event of results.events) {
        expect(event).toHaveProperty('topic');
        expect(event).toHaveProperty('description');
        expect(typeof event.topic).toBe('string');
        expect(typeof event.description).toBe('string');
      }
    });

    it('should include extensionPoints as an array of objects with type, method, description, objects', () => {
      expect(Array.isArray(results.extensionPoints)).toBe(true);
      expect(results.extensionPoints.length).toBeGreaterThan(0);

      for (const ext of results.extensionPoints) {
        expect(ext).toHaveProperty('type');
        expect(ext).toHaveProperty('method');
        expect(ext).toHaveProperty('description');
        expect(ext).toHaveProperty('objects');
        expect(Array.isArray(ext.objects)).toBe(true);
      }
    });

    it('should have summary counts that match array lengths', () => {
      expect(results.summary.totalScenarios).toBe(results.communicationScenarios.length);
      expect(results.summary.totalAPIs).toBe(results.releasedAPIs.length);
      expect(results.summary.totalEvents).toBe(results.events.length);
      expect(results.summary.totalExtensionPoints).toBe(results.extensionPoints.length);
    });

    it('should have sorted categories extracted from APIs and events', () => {
      const categories = results.summary.categories;
      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });
  });

  describe('Report terminal formatting from Scanner results', () => {
    let output;

    beforeEach(async () => {
      const scanner = new Scanner();
      const results = await scanner.scan();
      const report = new Report(results);
      output = report.toTerminal();
    });

    it('should produce a non-empty string', () => {
      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);
    });

    it('should contain the report title', () => {
      expect(output).toContain('SAP API Discovery Report');
    });

    it('should contain mode as MOCK', () => {
      expect(output).toContain('Mode:    MOCK');
    });

    it('should contain the actual system type from mock catalog', () => {
      expect(output).toContain('SAP S/4HANA Public Cloud');
    });

    it('should contain all section headers', () => {
      expect(output).toContain('SUMMARY');
      expect(output).toContain('COMMUNICATION SCENARIOS');
      expect(output).toContain('RELEASED APIs');
      expect(output).toContain('BUSINESS EVENTS');
      expect(output).toContain('EXTENSION POINTS');
    });

    it('should list all 5 communication scenarios from mock catalog', () => {
      expect(output).toContain('SAP_COM_0008');
      expect(output).toContain('SAP_COM_0009');
      expect(output).toContain('SAP_COM_0053');
      expect(output).toContain('SAP_COM_0109');
      expect(output).toContain('SAP_COM_0289');
    });

    it('should list all 5 released APIs from mock catalog', () => {
      expect(output).toContain('API_BUSINESS_PARTNER');
      expect(output).toContain('API_SALES_ORDER_SRV');
      expect(output).toContain('API_PURCHASEORDER_PROCESS_SRV');
      expect(output).toContain('API_PRODUCT_SRV');
      expect(output).toContain('CE_APIFORBUSINESSEVENTS_0001');
    });

    it('should list business events from mock catalog', () => {
      expect(output).toContain('sap/s4/beh/businesspartner/v1/BusinessPartner/Created/v1');
      expect(output).toContain('sap/s4/beh/salesorder/v1/SalesOrder/Created/v1');
      expect(output).toContain('sap/s4/beh/purchaseorder/v1/PurchaseOrder/Created/v1');
    });

    it('should list extension point types from mock catalog', () => {
      expect(output).toContain('Custom Fields');
      expect(output).toContain('Custom Logic');
      expect(output).toContain('Custom CDS Views');
    });
  });

  describe('Report markdown formatting from Scanner results', () => {
    let output;

    beforeEach(async () => {
      const scanner = new Scanner();
      const results = await scanner.scan();
      const report = new Report(results);
      output = report.toMarkdown();
    });

    it('should produce a non-empty string', () => {
      expect(typeof output).toBe('string');
      expect(output.length).toBeGreaterThan(0);
    });

    it('should contain proper markdown heading', () => {
      expect(output).toContain('# SAP API Discovery Report');
    });

    it('should contain the system info table', () => {
      expect(output).toContain('| Field | Value |');
      expect(output).toContain('| Mode | mock |');
    });

    it('should contain all markdown section headers', () => {
      expect(output).toContain('## Summary');
      expect(output).toContain('## Communication Scenarios');
      expect(output).toContain('## Released APIs');
      expect(output).toContain('## Business Events');
      expect(output).toContain('## Extension Points');
    });

    it('should list comm scenarios in a markdown table', () => {
      expect(output).toContain('| ID | Name | Category | Direction |');
      expect(output).toContain('| SAP_COM_0008 | Business Partner Integration | Master Data | both |');
      expect(output).toContain('| SAP_COM_0289 | Bank Statement Integration | Finance | inbound |');
    });

    it('should list released APIs in a markdown table with entity counts', () => {
      expect(output).toContain('| API | Title | Protocol | Category | Entities |');
      // API_BUSINESS_PARTNER has 5 entities
      expect(output).toContain('| API_BUSINESS_PARTNER | Business Partner (A2X) | OData V2 | Master Data | 5 |');
      // CE_APIFORBUSINESSEVENTS_0001 has 0 entities
      expect(output).toContain('| CE_APIFORBUSINESSEVENTS_0001 | Business Events | REST | Events | 0 |');
    });

    it('should list events as backtick-formatted list items', () => {
      expect(output).toContain(
        '- `sap/s4/beh/businesspartner/v1/BusinessPartner/Created/v1` - Triggered when a business partner is created'
      );
    });

    it('should list extension points with H3 subheadings', () => {
      expect(output).toContain('### Custom Fields');
      expect(output).toContain('### Custom Logic');
      expect(output).toContain('### Custom CDS Views');
    });

    it('should list extension point methods', () => {
      expect(output).toContain('- **Method:** Key User Extensibility');
      expect(output).toContain('- **Method:** Developer Extensibility (ABAP Cloud)');
    });
  });

  describe('Integration: Scanner mock mode -> Report round-trip', () => {
    it('should produce valid terminal output from Scanner results without errors', async () => {
      const scanner = new Scanner();
      const results = await scanner.scan();
      const report = new Report(results);

      // This should not throw
      const terminal = report.toTerminal();
      expect(typeof terminal).toBe('string');
      expect(terminal.length).toBeGreaterThan(100);
    });

    it('should produce valid markdown output from Scanner results without errors', async () => {
      const scanner = new Scanner();
      const results = await scanner.scan();
      const report = new Report(results);

      // This should not throw
      const markdown = report.toMarkdown();
      expect(typeof markdown).toBe('string');
      expect(markdown.length).toBeGreaterThan(100);
    });

    it('terminal output should reflect the same counts as the summary', async () => {
      const scanner = new Scanner();
      const results = await scanner.scan();
      const report = new Report(results);
      const terminal = report.toTerminal();

      expect(terminal).toContain(`Communication Scenarios:  ${results.summary.totalScenarios}`);
      expect(terminal).toContain(`Released APIs:            ${results.summary.totalAPIs}`);
      expect(terminal).toContain(`Business Events:          ${results.summary.totalEvents}`);
      expect(terminal).toContain(`Extension Points:         ${results.summary.totalExtensionPoints}`);
    });

    it('markdown output should reflect the same counts as the summary', async () => {
      const scanner = new Scanner();
      const results = await scanner.scan();
      const report = new Report(results);
      const markdown = report.toMarkdown();

      expect(markdown).toContain(`- **${results.summary.totalScenarios}** Communication Scenarios`);
      expect(markdown).toContain(`- **${results.summary.totalAPIs}** Released APIs`);
      expect(markdown).toContain(`- **${results.summary.totalEvents}** Business Events`);
      expect(markdown).toContain(`- **${results.summary.totalExtensionPoints}** Extension Points`);
    });

    it('every communication scenario from scan should appear in both outputs', async () => {
      const scanner = new Scanner();
      const results = await scanner.scan();
      const report = new Report(results);
      const terminal = report.toTerminal();
      const markdown = report.toMarkdown();

      for (const scenario of results.communicationScenarios) {
        expect(terminal).toContain(scenario.id);
        expect(terminal).toContain(scenario.name);
        expect(markdown).toContain(scenario.id);
        expect(markdown).toContain(scenario.name);
      }
    });

    it('every released API from scan should appear in both outputs', async () => {
      const scanner = new Scanner();
      const results = await scanner.scan();
      const report = new Report(results);
      const terminal = report.toTerminal();
      const markdown = report.toMarkdown();

      for (const api of results.releasedAPIs) {
        expect(terminal).toContain(api.name);
        expect(terminal).toContain(api.title);
        expect(markdown).toContain(api.name);
        expect(markdown).toContain(api.title);
      }
    });

    it('every event from scan should appear in both outputs', async () => {
      const scanner = new Scanner();
      const results = await scanner.scan();
      const report = new Report(results);
      const terminal = report.toTerminal();
      const markdown = report.toMarkdown();

      for (const event of results.events) {
        expect(terminal).toContain(event.topic);
        expect(markdown).toContain(event.topic);
      }
    });

    it('every extension point from scan should appear in both outputs', async () => {
      const scanner = new Scanner();
      const results = await scanner.scan();
      const report = new Report(results);
      const terminal = report.toTerminal();
      const markdown = report.toMarkdown();

      for (const ext of results.extensionPoints) {
        expect(terminal).toContain(ext.type);
        expect(terminal).toContain(ext.method);
        expect(markdown).toContain(ext.type);
        expect(markdown).toContain(ext.method);
      }
    });
  });
});
