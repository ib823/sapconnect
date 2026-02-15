/**
 * Industrial Manufacturing Industry Package
 *
 * Covers MES integration, shop floor control, advanced planning (APS),
 * tool management, and engineering change management for discrete and
 * process manufacturing migrations.
 */

const BaseIndustryPackage = require('./base-industry-package');

class IndustrialMfgPackage extends BaseIndustryPackage {
  get industryId() { return 'INDUSTRIAL_MFG'; }
  get name() { return 'Industrial Manufacturing'; }
  get description() {
    return 'Migration package for industrial manufacturers covering Manufacturing Execution System integration, shop floor control, advanced planning and scheduling (APS), tool management, and engineering change management processes.';
  }

  getComplianceRequirements() {
    return [
      {
        id: 'MFG-COMP-001',
        name: 'ISO 9001 Quality Management',
        description: 'Quality management system requirements for consistent product quality and continuous improvement',
        regulation: 'ISO 9001:2015',
        sapSolution: 'SAP QM with quality planning, inspection processing, quality certificates, and CAPA management',
        priority: 'high',
      },
      {
        id: 'MFG-COMP-002',
        name: 'ISO 14001 Environmental',
        description: 'Environmental management system requirements for manufacturing environmental impact control',
        regulation: 'ISO 14001:2015',
        sapSolution: 'SAP EHS with emissions management, waste tracking, and environmental compliance reporting',
        priority: 'medium',
      },
      {
        id: 'MFG-COMP-003',
        name: 'OSHA Safety Standards',
        description: 'Occupational Safety and Health Administration requirements for manufacturing workplaces',
        regulation: 'OSHA 29 CFR 1910',
        sapSolution: 'SAP EHS with incident management, safety training tracking, and workplace hazard assessment',
        priority: 'high',
      },
      {
        id: 'MFG-COMP-004',
        name: 'Product Liability Documentation',
        description: 'Manufacturing documentation requirements supporting product liability defense and recall management',
        regulation: 'Product Liability (UCC/Restatement)',
        sapSolution: 'SAP QM with device history record, batch protocols, and SAP DMS for manufacturing documentation',
        priority: 'medium',
      },
    ];
  }

  getGapAnalysis() {
    return [
      {
        id: 'MFG-GAP-001',
        name: 'MES Integration',
        description: 'Manufacturing Execution System integration for real-time shop floor data collection, OEE tracking, and machine connectivity',
        inforCapability: 'Infor CloudSuite Industrial with integrated MES functionality and IoT data collection',
        sapGap: 'SAP Manufacturing Integration and Intelligence (MII) or SAP Digital Manufacturing Cloud required for MES-level functionality',
        mitigation: 'Implement SAP Digital Manufacturing Cloud (DMC) or integrate existing MES via SAP MII/Plant Connectivity (PCo)',
        effort: 'high',
      },
      {
        id: 'MFG-GAP-002',
        name: 'Shop Floor Control',
        description: 'Real-time production order tracking with operator-level time confirmations and scrap reporting',
        inforCapability: 'Infor shop floor control with barcode-driven confirmations and real-time WIP tracking',
        sapGap: 'SAP PP Shop Floor Control handles confirmations but real-time operator interface requires Fiori or MES integration',
        mitigation: 'Deploy SAP Fiori production operator dashboard or SAP DMC for real-time shop floor data entry and monitoring',
        effort: 'medium',
      },
      {
        id: 'MFG-GAP-003',
        name: 'Advanced Planning and Scheduling',
        description: 'Finite capacity scheduling with constraint-based optimization and visual scheduling board',
        inforCapability: 'Infor APS with finite capacity scheduling, drum-buffer-rope, and visual scheduling',
        sapGap: 'SAP PP/DS provides finite scheduling but visual scheduling and constraint optimization require SAP IBP or APO',
        mitigation: 'Implement SAP Integrated Business Planning (IBP) for response and supply or SAP PP/DS for detailed scheduling',
        effort: 'high',
      },
      {
        id: 'MFG-GAP-004',
        name: 'Tool Management',
        description: 'Production tool lifecycle management with tool assignments to operations, tool availability checks, and maintenance scheduling',
        inforCapability: 'Infor tool management with tool tracking, assignment, and maintenance integration',
        sapGap: 'SAP PP tool management covers tool assignment to operations but lifecycle and maintenance tracking needs PM integration',
        mitigation: 'Configure SAP PP Production Resource/Tool (PRT) management and integrate with SAP PM for tool maintenance scheduling',
        effort: 'medium',
      },
      {
        id: 'MFG-GAP-005',
        name: 'Engineering Change Management',
        description: 'Engineering change order processing with effectivity management, impact analysis, and multi-level BOM updates',
        inforCapability: 'Infor PLM with engineering change management and revision control',
        sapGap: 'SAP Engineering Change Management (ECM) handles changes but PLM integration required for full lifecycle management',
        mitigation: 'Configure SAP ECM with change master records, effectivity types, and integrate with SAP PLM for design-to-manufacture flow',
        effort: 'medium',
      },
    ];
  }

  getVerticalTransforms() {
    return [
      {
        id: 'MFG-TX-001',
        name: 'Work Center Conversion',
        description: 'Map Infor work centers to SAP PP work center master with capacity data',
        sourceField: 'WORK_CENTER',
        targetField: 'PP_WORK_CENTER',
        transformLogic: 'Convert Infor work center definitions to SAP work centers with capacity categories, formulas, and available capacity data',
      },
      {
        id: 'MFG-TX-002',
        name: 'Routing Operation Mapping',
        description: 'Map Infor routing operations to SAP routing with operation details',
        sourceField: 'ROUTING_OPERATION',
        targetField: 'PP_ROUTING',
        transformLogic: 'Convert Infor routing operations to SAP routing operations with setup time, machine time, labor time, and work center assignment',
      },
      {
        id: 'MFG-TX-003',
        name: 'Tool Master Conversion',
        description: 'Map Infor tool records to SAP Production Resource/Tool master',
        sourceField: 'TOOL_MASTER',
        targetField: 'PP_PRT',
        transformLogic: 'Convert Infor tool master records to SAP PRT entries with tool type, location, usage count, and maintenance schedule linkage',
      },
    ];
  }

  getRecommendations() {
    return [
      { title: 'MES Integration Assessment', description: 'Assess current MES landscape and decide between SAP DMC replacement or existing MES integration via SAP PCo/MII.' },
      { title: 'APS Proof of Concept', description: 'Build a finite scheduling proof of concept for one production area to validate SAP PP/DS or IBP capabilities.' },
      { title: 'Shop Floor Pilot', description: 'Deploy shop floor operator interface on one production line before full rollout to validate usability and data accuracy.' },
      { title: 'ECM Process Alignment', description: 'Align engineering change management process between design and manufacturing teams before system migration.' },
    ];
  }
}

module.exports = IndustrialMfgPackage;
