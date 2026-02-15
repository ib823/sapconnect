/**
 * Equipment / Industrial Equipment Industry Package
 *
 * Covers service management, warranty tracking, rental/lease,
 * depot repair, field service, and installed base management for
 * equipment manufacturer and dealer migrations.
 */

const BaseIndustryPackage = require('./base-industry-package');

class EquipmentPackage extends BaseIndustryPackage {
  get industryId() { return 'EQUIPMENT'; }
  get name() { return 'Equipment'; }
  get description() {
    return 'Migration package for equipment manufacturers and dealers covering service management, warranty tracking, rental and lease management, depot repair operations, field service, and installed base management.';
  }

  getComplianceRequirements() {
    return [
      {
        id: 'EQ-COMP-001',
        name: 'IFRS 16 Lease Accounting',
        description: 'International Financial Reporting Standard for lease recognition and measurement',
        regulation: 'IFRS 16 / ASC 842',
        sapSolution: 'SAP RE-FX with IFRS 16 lease classification, right-of-use asset calculation, and lease liability management',
        priority: 'critical',
      },
      {
        id: 'EQ-COMP-002',
        name: 'Revenue Recognition (IFRS 15)',
        description: 'Revenue recognition for equipment sales with bundled service contracts and extended warranties',
        regulation: 'IFRS 15 / ASC 606',
        sapSolution: 'SAP Revenue Accounting and Reporting (RAR) with multi-element arrangement unbundling',
        priority: 'high',
      },
      {
        id: 'EQ-COMP-003',
        name: 'Product Safety Standards',
        description: 'Equipment safety standards compliance for machinery and industrial equipment',
        regulation: 'OSHA / ANSI / CE Marking',
        sapSolution: 'SAP QM with safety inspection plans, compliance documentation, and certification tracking',
        priority: 'high',
      },
      {
        id: 'EQ-COMP-004',
        name: 'Emissions Regulations',
        description: 'EPA and state emissions regulations for equipment with internal combustion engines',
        regulation: 'EPA Tier 4 / EU Stage V',
        sapSolution: 'SAP material master with emissions tier classification and SAP EHS for emissions tracking',
        priority: 'medium',
      },
    ];
  }

  getGapAnalysis() {
    return [
      {
        id: 'EQ-GAP-001',
        name: 'Service Management',
        description: 'Comprehensive service management with service contracts, SLA monitoring, and service order processing',
        inforCapability: 'Infor CloudSuite Equipment with integrated service management and contract processing',
        sapGap: 'SAP CS (Customer Service) provides service order management but SLA monitoring requires Service Cloud integration',
        mitigation: 'Configure SAP S/4HANA Service Management or deploy SAP Service Cloud for comprehensive SLA-driven service processing',
        effort: 'high',
      },
      {
        id: 'EQ-GAP-002',
        name: 'Warranty Tracking',
        description: 'Multi-tier warranty management with base, extended, and component-level warranty tracking and claim processing',
        inforCapability: 'Infor warranty management with multi-level warranty definitions and automated claim processing',
        sapGap: 'SAP warranty management handles basic warranties but multi-tier and component-level tracking requires configuration',
        mitigation: 'Configure SAP warranty management with multi-level warranty master records and integrate claim processing with CS orders',
        effort: 'medium',
      },
      {
        id: 'EQ-GAP-003',
        name: 'Rental/Lease Management',
        description: 'Equipment rental and lease lifecycle management with rate calculation, billing, and fleet utilization tracking',
        inforCapability: 'Infor Equipment rental management with rate books, rental contracts, and utilization dashboards',
        sapGap: 'SAP lacks native equipment rental management; requires SAP RE-FX extension or custom development',
        mitigation: 'Implement rental management on SAP BTP with integration to SAP billing and asset management, or deploy partner solution',
        effort: 'high',
      },
      {
        id: 'EQ-GAP-004',
        name: 'Depot Repair',
        description: 'Depot repair operations with tear-down, repair/replace decision, quoting, and rebuild tracking',
        inforCapability: 'Infor depot repair with work scoping, quoting, and repair order management',
        sapGap: 'SAP PM refurbishment order supports basic repair but depot repair workflow with quoting needs enhancement',
        mitigation: 'Configure SAP PM refurbishment orders with integration to SD for customer quoting and approval workflow',
        effort: 'medium',
      },
      {
        id: 'EQ-GAP-005',
        name: 'Field Service',
        description: 'Mobile field service with technician dispatching, mobile work orders, and parts consumption',
        inforCapability: 'Infor field service management with mobile technician app and GPS dispatching',
        sapGap: 'SAP Field Service Management (FSM) provides mobile field service but requires separate deployment',
        mitigation: 'Deploy SAP Field Service Management (FSM) with integration to SAP CS for work order flow and parts availability',
        effort: 'medium',
      },
      {
        id: 'EQ-GAP-006',
        name: 'Installed Base Management',
        description: 'Customer installed base tracking with equipment hierarchy, configuration, and service history',
        inforCapability: 'Infor installed base with equipment hierarchy and full service history tracking',
        sapGap: 'SAP installed base (IBase) supports equipment hierarchy but service history consolidation requires CS integration',
        mitigation: 'Configure SAP IBase with functional locations, equipment hierarchy, and link to CS notification/order history',
        effort: 'low',
      },
    ];
  }

  getVerticalTransforms() {
    return [
      {
        id: 'EQ-TX-001',
        name: 'Installed Base Conversion',
        description: 'Map Infor installed base to SAP IBase with equipment hierarchy',
        sourceField: 'INSTALLED_BASE',
        targetField: 'SAP_IBASE',
        transformLogic: 'Convert Infor installed base records to SAP IBase components with equipment master, functional location, and serial number linkage',
      },
      {
        id: 'EQ-TX-002',
        name: 'Warranty Master Conversion',
        description: 'Map Infor warranty definitions to SAP warranty master records',
        sourceField: 'WARRANTY_DEF',
        targetField: 'SAP_WARRANTY',
        transformLogic: 'Convert Infor warranty types and conditions to SAP warranty master records with date calculation rules and counter-based triggers',
      },
      {
        id: 'EQ-TX-003',
        name: 'Service Contract Conversion',
        description: 'Map Infor service contracts to SAP CS service contracts',
        sourceField: 'SERVICE_CONTRACT',
        targetField: 'CS_SERVICE_CONTRACT',
        transformLogic: 'Convert Infor service contract terms to SAP CS service contracts with response profiles, SLA conditions, and billing plans',
      },
    ];
  }

  getRecommendations() {
    return [
      { title: 'Installed Base Migration First', description: 'Migrate installed base and equipment master data before service contracts and warranty data to establish reference linkages.' },
      { title: 'Rental Solution Decision', description: 'Evaluate build vs. buy for rental management early as it is a significant functional gap requiring architectural decisions.' },
      { title: 'Field Service Deployment', description: 'Deploy SAP FSM in parallel with core S/4HANA to enable mobile field service from day one of go-live.' },
      { title: 'Warranty Data Cleansing', description: 'Cleanse warranty master data and validate expiration dates before migration to avoid incorrect warranty coverage post-cutover.' },
    ];
  }
}

module.exports = EquipmentPackage;
