const cds = require('@sap/cds');

module.exports = class CustomerService extends cds.ApplicationService {

  init() {
    const { Customers, Projects } = this.entities;

    // --- Event handlers ---

    this.before('CREATE', 'Customers', async (req) => {
      // Auto-set active project count
      if (req.data.activeProjects === undefined) {
        req.data.activeProjects = 0;
      }
    });

    // --- Functions & Actions ---

    this.on('getProjectStats', async () => {
      const projects = await SELECT.from(Projects);

      const byStatus = {};
      for (const p of projects) {
        const status = p.status_code || 'unknown';
        byStatus[status] = (byStatus[status] || 0) + 1;
      }

      return {
        total: projects.length,
        byStatus: Object.entries(byStatus).map(([status, count]) => ({
          status,
          count,
        })),
      };
    });

    this.on('lookupBusinessPartner', async (req) => {
      const { sapId } = req.data;

      // In production, this would call the real SAP API_BUSINESS_PARTNER
      // For demo/mock mode, return simulated data
      const mockPartners = {
        '1000001': { name: 'Acme Manufacturing Inc.', country: 'US' },
        '1000002': { name: 'Nordic Retail Group AB', country: 'SE' },
        '1000003': { name: 'TechFlow Solutions GmbH', country: 'DE' },
        '1000004': { name: 'Pacific Logistics Pty Ltd', country: 'AU' },
        '1000005': { name: 'Green Energy Corp', country: 'CA' },
      };

      const partner = mockPartners[sapId];
      if (partner) {
        return {
          sapId,
          name: partner.name,
          country: partner.country,
          found: true,
          source: 'mock',
        };
      }

      return {
        sapId,
        name: null,
        country: null,
        found: false,
        source: 'mock',
      };
    });

    return super.init();
  }
};
