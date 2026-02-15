/**
 * Food & Beverage Industry Package
 *
 * Covers catch weight handling, grower accounting, allergen management,
 * FDA FSMA/HACCP/GFSI compliance, shelf life/expiry management,
 * and lot traceability for food and beverage migrations.
 */

const BaseIndustryPackage = require('./base-industry-package');

class FoodBeveragePackage extends BaseIndustryPackage {
  get industryId() { return 'FOOD_BEVERAGE'; }
  get name() { return 'Food & Beverage'; }
  get description() {
    return 'Migration package for food and beverage manufacturers covering catch weight handling, grower accounting, allergen management, FDA FSMA and HACCP compliance, shelf life and expiry management, and full lot traceability.';
  }

  getComplianceRequirements() {
    return [
      {
        id: 'FB-COMP-001',
        name: 'FDA FSMA Compliance',
        description: 'Food Safety Modernization Act requiring preventive controls, supply chain verification, and traceability',
        regulation: 'FDA FSMA (21 CFR 117)',
        sapSolution: 'SAP QM with HACCP integration, batch traceability, and supplier qualification management',
        priority: 'critical',
      },
      {
        id: 'FB-COMP-002',
        name: 'HACCP Compliance',
        description: 'Hazard Analysis Critical Control Points system for systematic food safety hazard prevention',
        regulation: 'Codex Alimentarius HACCP / 21 CFR 120',
        sapSolution: 'SAP QM inspection plans with CCP monitoring, corrective action management, and inspection lot recording',
        priority: 'critical',
      },
      {
        id: 'FB-COMP-003',
        name: 'GFSI Certification Support',
        description: 'Global Food Safety Initiative benchmarked standard support (SQF, BRC, FSSC 22000)',
        regulation: 'GFSI / SQF / BRC / FSSC 22000',
        sapSolution: 'SAP QM audit management with corrective action tracking and document management for GFSI certifications',
        priority: 'high',
      },
      {
        id: 'FB-COMP-004',
        name: 'FDA 21 CFR Part 11',
        description: 'Electronic records and electronic signatures requirements for FDA-regulated food manufacturing',
        regulation: 'FDA 21 CFR Part 11',
        sapSolution: 'SAP electronic signature framework with audit trail and access controls',
        priority: 'high',
      },
      {
        id: 'FB-COMP-005',
        name: 'Allergen Labeling (FALCPA)',
        description: 'Food Allergen Labeling and Consumer Protection Act requiring major allergen declaration',
        regulation: 'FALCPA / FDA Food Labeling',
        sapSolution: 'SAP Recipe Management with allergen classification and label generation via SAP EHS',
        priority: 'high',
      },
    ];
  }

  getGapAnalysis() {
    return [
      {
        id: 'FB-GAP-001',
        name: 'Catch Weight Handling',
        description: 'Dual unit-of-measure processing where items are ordered by count but priced/invoiced by actual weight',
        inforCapability: 'Infor M3 native catch weight handling with dual UoM throughout procurement, production, and sales',
        sapGap: 'SAP S/4HANA catch weight management requires activation and careful configuration of material types',
        mitigation: 'Activate SAP Catch Weight Management (CWM) with material type configuration for variable weight items',
        effort: 'high',
      },
      {
        id: 'FB-GAP-002',
        name: 'Grower Accounting',
        description: 'Agricultural grower/farmer settlement accounting with quality-based pricing and pool accounting',
        inforCapability: 'Infor Agribusiness with grower contracts, quality-based settlement, and advance payment management',
        sapGap: 'SAP lacks native grower accounting module; requires custom development or partner solution',
        mitigation: 'Implement SAP Agricultural Contract Management (ACM) or custom extension for grower settlement with quality premiums',
        effort: 'high',
      },
      {
        id: 'FB-GAP-003',
        name: 'Allergen Management',
        description: 'Cross-contact allergen tracking through production with equipment cleaning validation',
        inforCapability: 'Infor food safety module with allergen tracking and cross-contamination analysis',
        sapGap: 'SAP Recipe Management handles ingredient allergens but cross-contact tracking requires extension',
        mitigation: 'Configure SAP EHS substance management for allergen classification and extend with cleaning validation workflow',
        effort: 'medium',
      },
      {
        id: 'FB-GAP-004',
        name: 'Shelf Life and Expiry Management',
        description: 'Multi-tier shelf life management with remaining shelf life checks during goods receipt and delivery',
        inforCapability: 'Infor M3 shelf life management with customer-specific minimum remaining shelf life rules',
        sapGap: 'SAP batch management supports shelf life but customer-specific MSRL requires configuration',
        mitigation: 'Configure SAP batch determination with shelf life checks and customer-specific minimum remaining shelf life in sales',
        effort: 'medium',
      },
      {
        id: 'FB-GAP-005',
        name: 'Lot Traceability (One-Up/One-Down)',
        description: 'Full lot traceability from raw material receipt through production to finished goods delivery',
        inforCapability: 'Infor lot traceability with batch genealogy and one-up/one-down tracking',
        sapGap: 'SAP batch traceability requires batch where-used and batch genealogy activation',
        mitigation: 'Activate SAP batch traceability with batch where-used analysis and integrate with SAP IBP for recall management',
        effort: 'medium',
      },
    ];
  }

  getVerticalTransforms() {
    return [
      {
        id: 'FB-TX-001',
        name: 'Catch Weight Material Conversion',
        description: 'Map Infor catch weight items to SAP CWM material master configuration',
        sourceField: 'CW_ITEM_CONFIG',
        targetField: 'MATERIAL_CWM_PROFILE',
        transformLogic: 'Convert Infor catch weight item settings to SAP material master with CWM profile, valuation UoM, and tolerance percentages',
      },
      {
        id: 'FB-TX-002',
        name: 'Allergen Classification Mapping',
        description: 'Map Infor allergen codes to SAP EHS substance classifications',
        sourceField: 'ALLERGEN_CODE',
        targetField: 'EHS_SUBSTANCE_CLASS',
        transformLogic: 'Map Infor allergen identifiers to SAP EHS regulatory list entries with FALCPA major allergen categories',
      },
      {
        id: 'FB-TX-003',
        name: 'Batch Attribute Conversion',
        description: 'Map Infor lot attributes to SAP batch classification characteristics',
        sourceField: 'LOT_ATTRIBUTES',
        targetField: 'BATCH_CLASSIFICATION',
        transformLogic: 'Convert Infor lot quality attributes to SAP classification characteristics with value ranges for batch determination',
      },
    ];
  }

  getRecommendations() {
    return [
      { title: 'Catch Weight Prototype', description: 'Build a catch weight prototype early covering procurement, production, and sales to validate dual UoM accuracy.' },
      { title: 'Traceability Mock Recall', description: 'Conduct mock recall exercises using SAP batch traceability to validate one-up/one-down tracking before go-live.' },
      { title: 'FDA Audit Preparation', description: 'Prepare FDA audit documentation package demonstrating FSMA compliance through SAP quality management processes.' },
      { title: 'Allergen Data Migration', description: 'Migrate allergen master data and validate cross-contact rules before production data migration.' },
    ];
  }
}

module.exports = FoodBeveragePackage;
