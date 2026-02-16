/**
 * Copyright 2024-2026 SEN Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Automotive Industry Package
 *
 * Covers EDI connectors (VDA/Odette/AIAG), JIT/JIS scheduling,
 * MMOG/LE assessment, container management, and ASN/ship notice
 * for automotive supply chain migrations.
 */

const BaseIndustryPackage = require('./base-industry-package');

class AutomotivePackage extends BaseIndustryPackage {
  get industryId() { return 'AUTOMOTIVE'; }
  get name() { return 'Automotive'; }
  get description() {
    return 'Migration package for automotive OEMs and suppliers covering EDI standards (VDA/Odette/AIAG), JIT/JIS sequenced delivery, MMOG/LE logistics evaluation, container/packaging management, and advanced shipping notifications.';
  }

  getComplianceRequirements() {
    return [
      {
        id: 'AUTO-COMP-001',
        name: 'VDA EDI Standards',
        description: 'Verband der Automobilindustrie electronic data interchange standards for German automotive supply chain',
        regulation: 'VDA 4905/4913/4915',
        sapSolution: 'SAP EDI/IDoc with VDA message types and partner profiles',
        priority: 'critical',
      },
      {
        id: 'AUTO-COMP-002',
        name: 'Odette Standards',
        description: 'Organization for Data Exchange by Tele-Transmission in Europe standards for pan-European automotive EDI',
        regulation: 'Odette OFTP2/ENGDAT',
        sapSolution: 'SAP Integration Suite with Odette OFTP2 adapter and ENGDAT support',
        priority: 'high',
      },
      {
        id: 'AUTO-COMP-003',
        name: 'AIAG Standards',
        description: 'Automotive Industry Action Group standards for North American automotive EDI',
        regulation: 'AIAG B-10/B-16',
        sapSolution: 'SAP EDI with ANSI X12 830/862/856 message mapping for AIAG compliance',
        priority: 'high',
      },
      {
        id: 'AUTO-COMP-004',
        name: 'IATF 16949 Quality',
        description: 'Automotive quality management system standard based on ISO 9001 with automotive-specific requirements',
        regulation: 'IATF 16949:2016',
        sapSolution: 'SAP QM with control plans, PPAP documentation, and APQP project tracking',
        priority: 'high',
      },
      {
        id: 'AUTO-COMP-005',
        name: 'IMDS Material Compliance',
        description: 'International Material Data System for tracking material composition and restricted substances',
        regulation: 'IMDS / REACH / ELV Directive',
        sapSolution: 'SAP EHS with substance volume tracking and IMDS interface via SAP Product Compliance',
        priority: 'medium',
      },
    ];
  }

  getGapAnalysis() {
    return [
      {
        id: 'AUTO-GAP-001',
        name: 'JIT/JIS Sequenced Delivery',
        description: 'Just-in-Time and Just-in-Sequence delivery processing with sequenced call-off scheduling',
        inforCapability: 'Infor Automotive CloudSuite with native JIT/JIS processing and sequence numbers',
        sapGap: 'SAP JIT/JIS processing requires dedicated JIT outbound/inbound component activation',
        mitigation: 'Activate SAP JIT/JIS component with sequence number assignment and integrate with production sequencing',
        effort: 'high',
      },
      {
        id: 'AUTO-GAP-002',
        name: 'MMOG/LE Self-Assessment',
        description: 'Materials Management Operations Guideline / Logistics Evaluation for supply chain maturity assessment',
        inforCapability: 'Infor provides MMOG/LE templates and assessment tools within supply chain module',
        sapGap: 'SAP does not include native MMOG/LE assessment tooling',
        mitigation: 'Implement MMOG/LE assessment as custom Fiori application or integrate with third-party MMOG/LE tool',
        effort: 'medium',
      },
      {
        id: 'AUTO-GAP-003',
        name: 'Container/Packaging Management',
        description: 'Returnable transport packaging management with container tracking and deposit accounting',
        inforCapability: 'Infor container management with returnable container tracking and balance management',
        sapGap: 'SAP packaging management handles packaging instructions but returnable container balances need configuration',
        mitigation: 'Configure SAP Handling Unit Management with returnable packaging material types and container balance tracking',
        effort: 'medium',
      },
      {
        id: 'AUTO-GAP-004',
        name: 'EDI Multi-Standard Support',
        description: 'Simultaneous support for VDA, Odette, AIAG, and custom OEM EDI formats',
        inforCapability: 'Infor ION integration supports multiple EDI standards with unified mapping',
        sapGap: 'SAP EDI supports all standards but requires separate partner profile configuration per standard',
        mitigation: 'Configure SAP Integration Suite with multi-standard EDI mapping and unified monitoring dashboard',
        effort: 'medium',
      },
      {
        id: 'AUTO-GAP-005',
        name: 'Advanced Shipping Notification',
        description: 'ASN generation with barcode label integration (AIAG B-10) and packing list hierarchy',
        inforCapability: 'Infor ASN with integrated label printing and packing hierarchy',
        sapGap: 'SAP delivery note with ASN IDoc requires label printing integration',
        mitigation: 'Configure SAP output determination for ASN with handling unit-based packing and barcode label printing',
        effort: 'low',
      },
    ];
  }

  getVerticalTransforms() {
    return [
      {
        id: 'AUTO-TX-001',
        name: 'EDI Partner Profile Mapping',
        description: 'Map Infor ION connection points to SAP EDI partner profiles',
        sourceField: 'ION_CONNECTION_POINT',
        targetField: 'EDI_PARTNER_PROFILE',
        transformLogic: 'Map Infor ION connection identifiers to SAP partner number, partner type, and message type combinations',
      },
      {
        id: 'AUTO-TX-002',
        name: 'JIT Call-Off Schedule Mapping',
        description: 'Map Infor JIT schedule format to SAP JIT call structure',
        sourceField: 'JIT_SCHEDULE',
        targetField: 'SAP_JIT_CALL',
        transformLogic: 'Convert Infor JIT schedule entries to SAP JIT calls with sequence numbers, delivery dates, and quantities',
      },
      {
        id: 'AUTO-TX-003',
        name: 'Container Master Conversion',
        description: 'Map Infor container types to SAP packaging material types',
        sourceField: 'CONTAINER_TYPE',
        targetField: 'PACKAGING_MATERIAL',
        transformLogic: 'Convert Infor container type codes to SAP packaging material master with dimensions and tare weight',
      },
    ];
  }

  getRecommendations() {
    return [
      { title: 'EDI Parallel Run', description: 'Run EDI interfaces in parallel with Infor and SAP during transition to validate message accuracy with each OEM partner.' },
      { title: 'JIT/JIS Pilot Line', description: 'Select one production line for JIT/JIS pilot before full rollout to validate sequencing accuracy.' },
      { title: 'OEM Certification', description: 'Coordinate with OEM customers on new EDI credentials and test connectivity before production cutover.' },
      { title: 'Label Compliance Testing', description: 'Test barcode label formats with OEM scanning systems to ensure AIAG B-10 compliance.' },
    ];
  }
}

module.exports = AutomotivePackage;
