/**
 * Public Sector Industry Package
 *
 * Covers community development gaps, grant management, fund accounting,
 * FedRAMP compliance, GASB reporting, and encumbrance accounting for
 * government and public sector migrations.
 */

const BaseIndustryPackage = require('./base-industry-package');

class PublicSectorPackage extends BaseIndustryPackage {
  get industryId() { return 'PUBLIC_SECTOR'; }
  get name() { return 'Public Sector'; }
  get description() {
    return 'Migration package for government and public sector organizations covering community development programs, grant management, fund accounting, FedRAMP compliance, GASB reporting standards, and encumbrance accounting.';
  }

  getComplianceRequirements() {
    return [
      {
        id: 'PS-COMP-001',
        name: 'FedRAMP Compliance',
        description: 'Federal Risk and Authorization Management Program for cloud service provider security assessment',
        regulation: 'FedRAMP (NIST SP 800-53)',
        sapSolution: 'SAP BTP with FedRAMP authorized infrastructure and SAP security baseline configuration',
        priority: 'critical',
      },
      {
        id: 'PS-COMP-002',
        name: 'GASB Reporting Standards',
        description: 'Governmental Accounting Standards Board reporting requirements for state and local governments',
        regulation: 'GASB Standards (34/87/96)',
        sapSolution: 'SAP Public Sector Management with fund accounting and GASB-compliant financial reporting',
        priority: 'critical',
      },
      {
        id: 'PS-COMP-003',
        name: 'Uniform Guidance (2 CFR 200)',
        description: 'Federal grant and cooperative agreement administrative requirements and cost principles',
        regulation: '2 CFR 200 (Uniform Guidance)',
        sapSolution: 'SAP Grants Management with cost allocation, indirect rate calculation, and A-133 audit support',
        priority: 'high',
      },
      {
        id: 'PS-COMP-004',
        name: 'FOIA Compliance',
        description: 'Freedom of Information Act requirements for public records access and disclosure',
        regulation: 'FOIA (5 USC 552)',
        sapSolution: 'SAP document management with records retention policies and redaction capabilities',
        priority: 'medium',
      },
      {
        id: 'PS-COMP-005',
        name: 'Section 508 Accessibility',
        description: 'Federal accessibility requirements for information and communication technology',
        regulation: 'Section 508 / WCAG 2.1 AA',
        sapSolution: 'SAP Fiori design system with WCAG 2.1 AA compliance and screen reader support',
        priority: 'high',
      },
    ];
  }

  getGapAnalysis() {
    return [
      {
        id: 'PS-GAP-001',
        name: 'Community Development',
        description: 'Community development block grant (CDBG) management with housing and urban development tracking',
        inforCapability: 'Infor Public Sector with community development module for HUD program management',
        sapGap: 'SAP lacks native community development program management for CDBG/HOME programs',
        mitigation: 'Implement custom community development tracking on SAP BTP with integration to HUD reporting systems',
        effort: 'high',
      },
      {
        id: 'PS-GAP-002',
        name: 'Grant Management',
        description: 'Federal and state grant lifecycle management from application through closeout with compliance monitoring',
        inforCapability: 'Infor Public Sector grant management with award tracking and compliance monitoring',
        sapGap: 'SAP Grants Management (GM) covers grant accounting but requires configuration for full lifecycle management',
        mitigation: 'Configure SAP Grants Management with sponsored programs, budget control, and reporting aligned to Uniform Guidance',
        effort: 'medium',
      },
      {
        id: 'PS-GAP-003',
        name: 'Fund Accounting',
        description: 'Multi-fund governmental accounting with fund balance classifications per GASB 54',
        inforCapability: 'Infor Public Sector fund accounting with governmental fund types and GASB 54 classifications',
        sapGap: 'SAP PSM Funds Management supports fund accounting but GASB 54 fund balance classification requires configuration',
        mitigation: 'Configure SAP PSM with fund types, fund balance classifications, and government-wide reporting for GASB compliance',
        effort: 'medium',
      },
      {
        id: 'PS-GAP-004',
        name: 'Encumbrance Accounting',
        description: 'Pre-encumbrance, encumbrance, and expenditure tracking for budgetary control',
        inforCapability: 'Infor Public Sector with three-stage encumbrance accounting integrated with purchasing',
        sapGap: 'SAP Funds Management supports commitment management but three-stage encumbrance requires enhancement',
        mitigation: 'Configure SAP FM commitment management with pre-commitment (requisition), commitment (PO), and actual postings',
        effort: 'medium',
      },
      {
        id: 'PS-GAP-005',
        name: 'Citizen Self-Service Portal',
        description: 'Citizen-facing portal for permit applications, utility billing, and service requests',
        inforCapability: 'Infor Citizen Self-Service portal with integrated permitting and utility billing',
        sapGap: 'SAP does not include a citizen portal; requires custom development on SAP BTP or third-party integration',
        mitigation: 'Develop citizen portal on SAP BTP with SAP Build Apps or integrate with existing citizen engagement platform',
        effort: 'high',
      },
    ];
  }

  getVerticalTransforms() {
    return [
      {
        id: 'PS-TX-001',
        name: 'Fund Code Mapping',
        description: 'Map Infor fund codes to SAP Funds Management fund master records',
        sourceField: 'FUND_CODE',
        targetField: 'FM_FUND',
        transformLogic: 'Convert Infor fund identifiers to SAP Fund Master records with fund type, fund center, and GASB 54 classification',
      },
      {
        id: 'PS-TX-002',
        name: 'Grant Award Conversion',
        description: 'Map Infor grant awards to SAP Grants Management sponsored programs',
        sourceField: 'GRANT_AWARD',
        targetField: 'GM_SPONSORED_PROGRAM',
        transformLogic: 'Convert Infor grant records to SAP GM sponsored programs with funding sources, budget periods, and cost sharing rules',
      },
      {
        id: 'PS-TX-003',
        name: 'Budget Structure Mapping',
        description: 'Map Infor budget structure to SAP budgetary ledger structure',
        sourceField: 'BUDGET_STRUCTURE',
        targetField: 'FM_BUDGET_STRUCTURE',
        transformLogic: 'Convert Infor appropriation/allotment/allocation structure to SAP FM commitment items and fund centers',
      },
    ];
  }

  getRecommendations() {
    return [
      { title: 'FedRAMP Assessment', description: 'Validate SAP BTP FedRAMP authorization status and conduct agency-specific security assessment before deployment.' },
      { title: 'GASB Reporting Validation', description: 'Validate all GASB-required financial statements (34, 87, 96) can be generated from SAP configuration before go-live.' },
      { title: 'Fund Migration Sequencing', description: 'Migrate fund master data and opening balances by fund type, validating governmental fund reporting before proprietary funds.' },
      { title: 'Year-End Cutover', description: 'Plan migration cutover at fiscal year-end to simplify fund balance migration and avoid mid-year encumbrance conversion.' },
    ];
  }
}

module.exports = PublicSectorPackage;
