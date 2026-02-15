/**
 * Chemicals Industry Package
 *
 * Covers EHS management (SAP advantage), REACH/GHS compliance,
 * SDS authoring, hazmat transport, batch genealogy, and formula
 * management for chemical manufacturing migrations.
 */

const BaseIndustryPackage = require('./base-industry-package');

class ChemicalsPackage extends BaseIndustryPackage {
  get industryId() { return 'CHEMICALS'; }
  get name() { return 'Chemicals'; }
  get description() {
    return 'Migration package for chemical manufacturers covering Environment Health & Safety (EHS) management, REACH and GHS regulatory compliance, Safety Data Sheet authoring, hazardous materials transport, batch genealogy, and recipe/formula management.';
  }

  getComplianceRequirements() {
    return [
      {
        id: 'CHEM-COMP-001',
        name: 'REACH Registration',
        description: 'EU Registration, Evaluation, Authorisation and Restriction of Chemicals regulation',
        regulation: 'REACH (EC 1907/2006)',
        sapSolution: 'SAP EHS with substance volume tracking, registration dossier management, and SVHC candidate list screening',
        priority: 'critical',
      },
      {
        id: 'CHEM-COMP-002',
        name: 'GHS Classification',
        description: 'Globally Harmonized System for classification and labelling of chemicals',
        regulation: 'GHS / CLP (EC 1272/2008)',
        sapSolution: 'SAP EHS with GHS classification engine, hazard pictogram assignment, and label generation',
        priority: 'critical',
      },
      {
        id: 'CHEM-COMP-003',
        name: 'TSCA Compliance',
        description: 'Toxic Substances Control Act inventory listing and reporting for US chemical substances',
        regulation: 'TSCA (15 USC 2601)',
        sapSolution: 'SAP EHS with TSCA inventory checking, CDR reporting, and new chemical notification support',
        priority: 'high',
      },
      {
        id: 'CHEM-COMP-004',
        name: 'Hazardous Material Transport',
        description: 'Dangerous goods transport classification and documentation per DOT/IATA/IMDG regulations',
        regulation: 'DOT 49 CFR / IATA DGR / IMDG Code',
        sapSolution: 'SAP EHS dangerous goods management with transport mode-specific classification and documentation',
        priority: 'high',
      },
      {
        id: 'CHEM-COMP-005',
        name: 'EPA Reporting (TRI)',
        description: 'Toxics Release Inventory reporting for chemical release and waste management data',
        regulation: 'EPCRA Section 313 / TRI',
        sapSolution: 'SAP EHS with emissions management, waste tracking, and TRI reporting via EH&S Expert',
        priority: 'medium',
      },
    ];
  }

  getGapAnalysis() {
    return [
      {
        id: 'CHEM-GAP-001',
        name: 'EHS Management (SAP Advantage)',
        description: 'SAP EHS is a recognized strength area providing integrated substance management, regulatory compliance, and SDS authoring',
        inforCapability: 'Infor EHS relies on third-party integration for comprehensive substance management',
        sapGap: 'No gap - SAP EHS is an industry-leading solution providing native EHS capabilities',
        mitigation: 'Leverage SAP EHS as a migration advantage; configure substance master data and regulatory content early',
        effort: 'low',
      },
      {
        id: 'CHEM-GAP-002',
        name: 'SDS Authoring',
        description: 'Safety Data Sheet authoring and distribution in multiple languages and regional formats',
        inforCapability: 'Infor relies on third-party SDS solutions (e.g., Sphera) for SDS authoring',
        sapGap: 'SAP EHS provides native SDS authoring with multi-language support via EH&S Expert',
        mitigation: 'Configure SAP EHS SDS authoring with regional phrase libraries and distribution workflows',
        effort: 'medium',
      },
      {
        id: 'CHEM-GAP-003',
        name: 'Batch Genealogy',
        description: 'Complete batch genealogy tracking from raw materials through intermediate products to finished goods',
        inforCapability: 'Infor M3 batch tracking with process manufacturing genealogy',
        sapGap: 'SAP batch management supports genealogy but process manufacturing batch splitting needs configuration',
        mitigation: 'Configure SAP batch management with process order batch assignment and batch where-used traceability',
        effort: 'medium',
      },
      {
        id: 'CHEM-GAP-004',
        name: 'Formula/Recipe Management',
        description: 'Recipe management with version control, scaling, and yield optimization for chemical formulations',
        inforCapability: 'Infor M3 process manufacturing with recipe management and formula scaling',
        sapGap: 'SAP Recipe Management supports formulations but scaling and optimization require Production Planning integration',
        mitigation: 'Configure SAP Recipe Management with master recipe versioning and integrate with PP-PI for process order execution',
        effort: 'medium',
      },
      {
        id: 'CHEM-GAP-005',
        name: 'Hazmat Transport Documentation',
        description: 'Automated dangerous goods documentation generation for multi-modal transport',
        inforCapability: 'Infor transportation management with basic dangerous goods documentation',
        sapGap: 'SAP EHS dangerous goods management provides comprehensive transport documentation',
        mitigation: 'Configure SAP EHS DG management with transport mode profiles and integrate with SAP TM for multi-modal shipments',
        effort: 'low',
      },
    ];
  }

  getVerticalTransforms() {
    return [
      {
        id: 'CHEM-TX-001',
        name: 'Substance Master Conversion',
        description: 'Map Infor chemical substance records to SAP EHS substance master',
        sourceField: 'SUBSTANCE_RECORD',
        targetField: 'EHS_SUBSTANCE',
        transformLogic: 'Convert Infor substance identifiers (CAS, EINECS) to SAP EHS substance master with regulatory list assignments and composition data',
      },
      {
        id: 'CHEM-TX-002',
        name: 'GHS Classification Mapping',
        description: 'Map existing hazard classifications to SAP EHS GHS classification',
        sourceField: 'HAZARD_CLASS',
        targetField: 'EHS_GHS_CLASS',
        transformLogic: 'Convert Infor hazard classification codes to SAP EHS GHS hazard categories with H-statements and P-statements',
      },
      {
        id: 'CHEM-TX-003',
        name: 'Recipe/Formula Conversion',
        description: 'Map Infor formulas to SAP Recipe Management master recipes',
        sourceField: 'FORMULA',
        targetField: 'MASTER_RECIPE',
        transformLogic: 'Convert Infor formula definitions to SAP master recipes with phases, operations, and material assignments with quantity scaling',
      },
    ];
  }

  getRecommendations() {
    return [
      { title: 'EHS Early Deployment', description: 'Deploy SAP EHS substance master and regulatory content early as it is a foundational data source for multiple processes.' },
      { title: 'SDS Migration Validation', description: 'Validate SDS content generation against existing Infor/third-party SDS to ensure regulatory accuracy before cutover.' },
      { title: 'Batch Traceability Testing', description: 'Conduct end-to-end batch traceability tests from raw material receipt through finished goods to validate genealogy.' },
      { title: 'Regulatory Content Subscription', description: 'Activate SAP EHS regulatory content subscription for REACH, GHS, and TSCA lists before substance master migration.' },
    ];
  }
}

module.exports = ChemicalsPackage;
