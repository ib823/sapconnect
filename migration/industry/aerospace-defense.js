/**
 * Aerospace & Defense Industry Package
 *
 * Covers ITAR/EAR/DFARS compliance, MRO operations, BOM effectivity,
 * CIS-GovCon requirements, and export control screening for A&D
 * migrations from Infor to SAP S/4HANA.
 */

const BaseIndustryPackage = require('./base-industry-package');

class AerospaceDefensePackage extends BaseIndustryPackage {
  get industryId() { return 'AEROSPACE_DEFENSE'; }
  get name() { return 'Aerospace & Defense'; }
  get description() {
    return 'Migration package for aerospace and defense manufacturers covering ITAR/EAR export controls, MRO operations, BOM effectivity with date ranges, government contract accounting (CIS-GovCon), and DFARS compliance.';
  }

  getComplianceRequirements() {
    return [
      {
        id: 'AD-COMP-001',
        name: 'ITAR Export Control',
        description: 'International Traffic in Arms Regulations requiring access control and data segregation for defense articles',
        regulation: 'ITAR (22 CFR 120-130)',
        sapSolution: 'SAP GTS with ITAR screening, access control via authorization objects',
        priority: 'critical',
      },
      {
        id: 'AD-COMP-002',
        name: 'EAR Export Control',
        description: 'Export Administration Regulations for dual-use items requiring license determination and denied party screening',
        regulation: 'EAR (15 CFR 730-774)',
        sapSolution: 'SAP GTS Export Management with automated license determination and compliance screening',
        priority: 'critical',
      },
      {
        id: 'AD-COMP-003',
        name: 'DFARS Compliance',
        description: 'Defense Federal Acquisition Regulation Supplement for government contract cost accounting',
        regulation: 'DFARS (48 CFR 200-299)',
        sapSolution: 'SAP S/4HANA Project Systems with WBS cost collection and DCAA-compliant reporting',
        priority: 'critical',
      },
      {
        id: 'AD-COMP-004',
        name: 'CAS Compliance',
        description: 'Cost Accounting Standards for consistent allocation of costs to government contracts',
        regulation: 'CAS (48 CFR 9900)',
        sapSolution: 'SAP CO allocation cycles with CAS-compliant indirect rate pools and allocation bases',
        priority: 'high',
      },
      {
        id: 'AD-COMP-005',
        name: 'FAR Part 31 Cost Principles',
        description: 'Allowable cost determination for government contract cost proposals and incurred cost submissions',
        regulation: 'FAR Part 31',
        sapSolution: 'SAP cost element categorization with allowability flags and incurred cost reporting',
        priority: 'high',
      },
      {
        id: 'AD-COMP-006',
        name: 'Cybersecurity Maturity Model',
        description: 'CMMC requirements for protecting Controlled Unclassified Information in non-federal systems',
        regulation: 'CMMC 2.0 / NIST SP 800-171',
        sapSolution: 'SAP security hardening, encryption at rest/transit, audit trail via Security Audit Log',
        priority: 'high',
      },
    ];
  }

  getGapAnalysis() {
    return [
      {
        id: 'AD-GAP-001',
        name: 'MRO Work Scoping',
        description: 'Maintenance, repair, and overhaul work scoping with tear-down inspection and progressive discovery',
        inforCapability: 'Infor EAM/CloudSuite Aerospace MRO work scoping with dynamic task addition',
        sapGap: 'SAP PM/CS lacks native MRO work scoping with tear-down discovery workflow',
        mitigation: 'Implement SAP MRO solution (part of S/4HANA for A&D) or custom work scoping extension',
        effort: 'high',
      },
      {
        id: 'AD-GAP-002',
        name: 'BOM Effectivity with Date Ranges',
        description: 'Engineering BOM effectivity by serial number ranges, date ranges, and lot/batch for configuration management',
        inforCapability: 'Infor PLM supports serial/date effectivity on BOM components natively',
        sapGap: 'SAP Engineering Change Management supports date effectivity but serial effectivity requires enhancement',
        mitigation: 'Use SAP ECM with change numbers and date effectivity; extend for serial number effectivity via BADI',
        effort: 'medium',
      },
      {
        id: 'AD-GAP-003',
        name: 'CIS-GovCon Contract Accounting',
        description: 'Government contract accounting with progress billing, cost-plus, T&M, and CPFF contract types',
        inforCapability: 'Infor CloudSuite Aerospace GovCon module with native contract types and EAC/ETC',
        sapGap: 'SAP PS supports progress billing but requires configuration for government contract types',
        mitigation: 'Configure SAP PS billing plans, revenue recognition with IFRS 15, and milestone billing for government contracts',
        effort: 'high',
      },
      {
        id: 'AD-GAP-004',
        name: 'Export Control Screening Integration',
        description: 'Real-time denied party screening and license determination during order processing',
        inforCapability: 'Infor relies on third-party integration for export control screening',
        sapGap: 'SAP GTS provides native export control but requires content subscription and configuration',
        mitigation: 'Deploy SAP GTS with sanctioned party list subscriptions and integrate with SD order processing',
        effort: 'medium',
      },
      {
        id: 'AD-GAP-005',
        name: 'Program Management',
        description: 'Multi-contract program management with cost sharing, common cost pools, and program-level reporting',
        inforCapability: 'Infor CloudSuite Aerospace program management with cross-contract visibility',
        sapGap: 'SAP PS project hierarchy supports program structure but cross-project reporting requires configuration',
        mitigation: 'Design PS project hierarchy with program-level WBS and configure cross-project reporting in SAC',
        effort: 'medium',
      },
    ];
  }

  getVerticalTransforms() {
    return [
      {
        id: 'AD-TX-001',
        name: 'ECCN Classification Mapping',
        description: 'Map Infor export classification codes to SAP GTS ECCN format',
        sourceField: 'EXPORT_CLASS_CODE',
        targetField: 'GTS_ECCN',
        transformLogic: 'Map Infor export classification to SAP GTS Export Control Classification Number with category prefix',
      },
      {
        id: 'AD-TX-002',
        name: 'MRO Work Order Type Mapping',
        description: 'Map Infor MRO work order types to SAP PM order types',
        sourceField: 'MRO_WO_TYPE',
        targetField: 'PM_ORDER_TYPE',
        transformLogic: 'Map Infor MRO work order categories (inspection, repair, overhaul) to SAP PM order type configuration',
      },
      {
        id: 'AD-TX-003',
        name: 'Government Contract Type Mapping',
        description: 'Map Infor contract types to SAP PS billing configurations',
        sourceField: 'GOV_CONTRACT_TYPE',
        targetField: 'PS_BILLING_PLAN_TYPE',
        transformLogic: 'Map FFP/CPFF/T&M/CPIF contract types to SAP PS billing plan types and revenue recognition methods',
      },
      {
        id: 'AD-TX-004',
        name: 'BOM Effectivity Conversion',
        description: 'Convert Infor BOM effectivity ranges to SAP ECM change number effectivity',
        sourceField: 'BOM_EFFECTIVITY',
        targetField: 'ECM_CHANGE_NUMBER',
        transformLogic: 'Convert Infor date/serial effectivity ranges to SAP Engineering Change Master records with valid-from dates',
      },
    ];
  }

  getRecommendations() {
    return [
      { title: 'Deploy SAP GTS Early', description: 'Export control compliance is critical for A&D; deploy and test SAP GTS in parallel with core S/4HANA implementation.' },
      { title: 'MRO Prototype Sprint', description: 'Conduct a dedicated MRO prototype sprint to validate tear-down and work scoping processes before full build.' },
      { title: 'DCAA Audit Readiness', description: 'Engage DCAA-experienced consultants to validate government contract accounting configuration meets audit requirements.' },
      { title: 'Configuration Management', description: 'Establish engineering change management process early to support BOM effectivity and configuration control.' },
    ];
  }
}

module.exports = AerospaceDefensePackage;
