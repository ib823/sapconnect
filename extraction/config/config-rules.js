/**
 * Configuration Interpretation Rules
 *
 * Declarative rules that describe how to interpret SAP configuration.
 * Each rule checks specific table data and produces human-readable interpretations.
 */

const CONFIG_RULES = [
  {
    ruleId: 'FI-COCD-001',
    description: 'Company Code Configuration',
    tables: ['T001'],
    condition: (data) => data.companyCodes && data.companyCodes.length > 0,
    interpretation: (data) => {
      const codes = data.companyCodes || [];
      return `${codes.length} company code(s) configured: ${codes.map(c => `${c.BUKRS} (${c.BUTXT || c.BUKRS})`).join(', ')}`;
    },
    impact: 'Company codes define the organizational structure for financial accounting',
    s4hanaRelevance: 'Company codes carry over to S/4HANA without structural changes',
  },
  {
    ruleId: 'FI-DOC-SPLIT-001',
    description: 'Document Splitting Active',
    tables: ['FAGL_SPLINFO', 'T001'],
    condition: (data) => data.documentSplitting && data.documentSplitting.length > 0,
    interpretation: (data) => {
      const splits = data.documentSplitting || [];
      return `Document splitting is active for ${splits.length} configuration(s). ${splits.some(s => s.SPLIT_ACTIVE === 'X') ? 'Active splitting rules found.' : 'Splitting configured but may not be active.'}`;
    },
    impact: 'All FI postings will be split according to splitting rules',
    s4hanaRelevance: 'Document splitting is mandatory in S/4HANA — this is already aligned',
  },
  {
    ruleId: 'FI-LEDGER-001',
    description: 'Ledger Configuration',
    tables: ['FINSC_LEDGER'],
    condition: (data) => data.ledgerConfig && data.ledgerConfig.length > 0,
    interpretation: (data) => {
      const ledgers = data.ledgerConfig || [];
      return `${ledgers.length} ledger(s) configured: ${ledgers.map(l => `${l.RLDNR} (${l.NAME || 'no name'})`).join(', ')}`;
    },
    impact: 'Multiple ledgers indicate parallel accounting requirements',
    s4hanaRelevance: 'S/4HANA uses the leading ledger approach — verify ledger group assignments',
  },
  {
    ruleId: 'FI-TAX-001',
    description: 'Tax Code Configuration',
    tables: ['T007A'],
    condition: (data) => data.taxCodes && data.taxCodes.length > 0,
    interpretation: (data) => {
      const codes = data.taxCodes || [];
      return `${codes.length} tax code(s) configured across all countries`;
    },
    impact: 'Tax codes drive automatic tax calculation in procurement and sales',
    s4hanaRelevance: 'Tax codes require review for S/4HANA advanced compliance reporting',
  },
  {
    ruleId: 'CO-AREA-001',
    description: 'Controlling Area Setup',
    tables: ['TKA01'],
    condition: (data) => data.controllingAreas && data.controllingAreas.length > 0,
    interpretation: (data) => {
      const areas = data.controllingAreas || [];
      return `${areas.length} controlling area(s): ${areas.map(a => `${a.KOKRS} (currency: ${a.WAERS || 'N/A'})`).join(', ')}`;
    },
    impact: 'Controlling areas define the CO organizational boundary',
    s4hanaRelevance: 'In S/4HANA, CO-FI integration is tighter — 1:1 KOKRS:BUKRS recommended',
  },
  {
    ruleId: 'MM-PLANT-001',
    description: 'Plant Configuration',
    tables: ['T001W'],
    condition: (data) => data.plants && data.plants.length > 0,
    interpretation: (data) => {
      const plants = data.plants || [];
      return `${plants.length} plant(s) configured: ${plants.map(p => `${p.WERKS} (${p.NAME1 || p.WERKS})`).join(', ')}`;
    },
    impact: 'Plants are central to logistics — MRP, inventory, and production all operate at plant level',
    s4hanaRelevance: 'Plant structure carries over; review for stock management simplification',
  },
  {
    ruleId: 'SD-PRICING-001',
    description: 'Pricing Procedure Configuration',
    tables: ['T683'],
    condition: (data) => data.pricingProcedures && data.pricingProcedures.length > 0,
    interpretation: (data) => {
      const procs = data.pricingProcedures || [];
      return `${procs.length} pricing procedure(s) configured`;
    },
    impact: 'Pricing procedures control price determination in sales orders and billing',
    s4hanaRelevance: 'Pricing procedures migrate to S/4HANA — review for compatibility with new condition technique',
  },
  {
    ruleId: 'SEC-SAPALL-001',
    description: 'Users with SAP_ALL Profile',
    tables: ['USR02'],
    condition: (data) => data.usersWithSapAll && data.usersWithSapAll.length > 0,
    interpretation: (data) => {
      const users = data.usersWithSapAll || [];
      return `WARNING: ${users.length} user(s) have SAP_ALL profile (full authorization): ${users.map(u => u.BNAME || u).join(', ')}`;
    },
    impact: 'SAP_ALL grants unrestricted access — significant security risk',
    s4hanaRelevance: 'Must be addressed before S/4HANA migration — SAP_ALL should be removed',
  },
  {
    ruleId: 'INT-RFC-001',
    description: 'RFC Destinations',
    tables: ['RFCDES'],
    condition: (data) => data.rfcDestinations && data.rfcDestinations.length > 0,
    interpretation: (data) => {
      const dests = data.rfcDestinations || [];
      const byType = {};
      for (const d of dests) {
        const type = d.RFCTYPE || 'U';
        byType[type] = (byType[type] || 0) + 1;
      }
      return `${dests.length} RFC destination(s): ${Object.entries(byType).map(([t, c]) => `Type ${t}: ${c}`).join(', ')}`;
    },
    impact: 'RFC destinations define system-to-system connectivity',
    s4hanaRelevance: 'All RFC destinations need review — some may point to deprecated systems',
  },
];

module.exports = CONFIG_RULES;
