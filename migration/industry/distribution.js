/**
 * Distribution Industry Package
 *
 * Covers WMS migration, cross-docking, wave management,
 * lot/serial tracking, vendor-managed inventory, and pick/pack/ship
 * operations for wholesale distribution migrations.
 */

const BaseIndustryPackage = require('./base-industry-package');

class DistributionPackage extends BaseIndustryPackage {
  get industryId() { return 'DISTRIBUTION'; }
  get name() { return 'Distribution'; }
  get description() {
    return 'Migration package for wholesale distribution companies covering warehouse management system migration, cross-docking operations, wave management, lot and serial number tracking, vendor-managed inventory, and pick/pack/ship processes.';
  }

  getComplianceRequirements() {
    return [
      {
        id: 'DIST-COMP-001',
        name: 'FDA Drug Supply Chain (DSCSA)',
        description: 'Drug Supply Chain Security Act requirements for pharmaceutical distributors including serialization and verification',
        regulation: 'DSCSA (Title II of DQSA)',
        sapSolution: 'SAP ATTP (Advanced Track and Trace for Pharmaceuticals) with serialization and verification services',
        priority: 'critical',
      },
      {
        id: 'DIST-COMP-002',
        name: 'OSHA Warehouse Safety',
        description: 'Occupational Safety and Health Administration requirements for warehouse operations',
        regulation: 'OSHA 29 CFR 1910',
        sapSolution: 'SAP EHS with incident management, safety inspection tracking, and hazardous material storage rules',
        priority: 'high',
      },
      {
        id: 'DIST-COMP-003',
        name: 'DOT Hazmat Transport',
        description: 'Department of Transportation hazardous materials transportation regulations for distribution',
        regulation: 'DOT 49 CFR 171-180',
        sapSolution: 'SAP EHS dangerous goods management with DOT classification and shipping documentation',
        priority: 'high',
      },
      {
        id: 'DIST-COMP-004',
        name: 'C-TPAT Security',
        description: 'Customs-Trade Partnership Against Terrorism supply chain security requirements',
        regulation: 'CBP C-TPAT',
        sapSolution: 'SAP GTS with partner screening, conveyance security, and supply chain visibility',
        priority: 'medium',
      },
    ];
  }

  getGapAnalysis() {
    return [
      {
        id: 'DIST-GAP-001',
        name: 'WMS Migration',
        description: 'Full warehouse management system migration from Infor WMS to SAP EWM with RF/mobile integration',
        inforCapability: 'Infor WMS with comprehensive warehouse operations, RF-directed work, and labor management',
        sapGap: 'SAP EWM provides equivalent functionality but migration requires careful bin structure and process redesign',
        mitigation: 'Conduct warehouse process workshops and design SAP EWM layout, process flows, and RF transaction mapping',
        effort: 'high',
      },
      {
        id: 'DIST-GAP-002',
        name: 'Cross-Docking',
        description: 'Inbound-to-outbound cross-docking with flow-through and merge-in-transit processing',
        inforCapability: 'Infor WMS with planned and opportunistic cross-docking operations',
        sapGap: 'SAP EWM supports cross-docking but requires configuration of cross-docking rules and criteria',
        mitigation: 'Configure SAP EWM cross-docking with push, pull, and opportunistic strategies based on order and inventory rules',
        effort: 'medium',
      },
      {
        id: 'DIST-GAP-003',
        name: 'Wave Management',
        description: 'Order wave planning and release with capacity-based wave sizing and optimized pick path sequencing',
        inforCapability: 'Infor WMS wave planning with configurable wave rules and pick path optimization',
        sapGap: 'SAP EWM wave management supports wave creation but pick path optimization requires layout-based configuration',
        mitigation: 'Configure SAP EWM wave management with wave templates, capacity rules, and storage bin sort sequences for pick optimization',
        effort: 'medium',
      },
      {
        id: 'DIST-GAP-004',
        name: 'Vendor-Managed Inventory',
        description: 'VMI program management with supplier portal, automatic replenishment, and consignment stock tracking',
        inforCapability: 'Infor supply chain with VMI processing and supplier collaboration portal',
        sapGap: 'SAP supports VMI via scheduling agreements and SAP IBP but supplier portal requires SAP Ariba or custom development',
        mitigation: 'Configure SAP scheduling agreements with VMI indicators and deploy SAP Ariba Supplier Collaboration for VMI portal',
        effort: 'medium',
      },
      {
        id: 'DIST-GAP-005',
        name: 'Pick/Pack/Ship Optimization',
        description: 'Multi-order pick optimization with batch picking, zone picking, and automated packing station integration',
        inforCapability: 'Infor WMS with multi-order picking strategies and packing station integration',
        sapGap: 'SAP EWM supports pick strategies but multi-order optimization requires warehouse process type configuration',
        mitigation: 'Configure SAP EWM picking strategies (batch, zone, cluster) with packing station process and shipping cockpit',
        effort: 'medium',
      },
    ];
  }

  getVerticalTransforms() {
    return [
      {
        id: 'DIST-TX-001',
        name: 'Warehouse Layout Conversion',
        description: 'Map Infor WMS warehouse structure to SAP EWM warehouse layout',
        sourceField: 'WMS_LAYOUT',
        targetField: 'EWM_LAYOUT',
        transformLogic: 'Convert Infor WMS warehouse/zone/aisle/level/bin hierarchy to SAP EWM warehouse number/storage type/storage section/bin structure',
      },
      {
        id: 'DIST-TX-002',
        name: 'Lot/Serial Master Conversion',
        description: 'Map Infor lot and serial records to SAP batch and serial number master',
        sourceField: 'LOT_SERIAL_MASTER',
        targetField: 'BATCH_SERIAL_MASTER',
        transformLogic: 'Convert Infor lot records to SAP batch master with classification and Infor serial records to SAP serial number profiles',
      },
      {
        id: 'DIST-TX-003',
        name: 'Pick Strategy Mapping',
        description: 'Map Infor picking rules to SAP EWM warehouse process types',
        sourceField: 'PICK_RULE',
        targetField: 'EWM_PROCESS_TYPE',
        transformLogic: 'Convert Infor picking rule configurations to SAP EWM warehouse process types with determination strategies and sort rules',
      },
    ];
  }

  getRecommendations() {
    return [
      { title: 'Warehouse Pilot Site', description: 'Select one warehouse for pilot EWM implementation to validate bin structure, RF transactions, and process flows before rollout.' },
      { title: 'RF Transaction Mapping', description: 'Map all Infor WMS RF transactions to SAP EWM RF framework screens to minimize warehouse operator retraining.' },
      { title: 'Inventory Freeze Cutover', description: 'Plan a physical inventory freeze during cutover to ensure accurate stock transfer from Infor WMS to SAP EWM.' },
      { title: 'VMI Partner Communication', description: 'Notify VMI partners of system change and coordinate EDI/portal transition timeline for uninterrupted replenishment.' },
    ];
  }
}

module.exports = DistributionPackage;
