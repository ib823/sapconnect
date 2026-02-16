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
 * Fashion Industry Package
 *
 * Covers style-color-size variant configuration, royalty management,
 * season/collection management, and size scale mapping for fashion
 * and apparel migrations.
 */

const BaseIndustryPackage = require('./base-industry-package');

class FashionPackage extends BaseIndustryPackage {
  get industryId() { return 'FASHION'; }
  get name() { return 'Fashion & Apparel'; }
  get description() {
    return 'Migration package for fashion and apparel companies covering style-color-size variant configuration using SAP Generic Article, royalty management, season and collection lifecycle management, and size scale mapping.';
  }

  getComplianceRequirements() {
    return [
      {
        id: 'FSH-COMP-001',
        name: 'Product Safety (CPSIA)',
        description: 'Consumer Product Safety Improvement Act compliance for apparel including lead content and flammability testing',
        regulation: 'CPSIA / CPSC 16 CFR',
        sapSolution: 'SAP QM with inspection plans for CPSIA testing and certificate of compliance management',
        priority: 'high',
      },
      {
        id: 'FSH-COMP-002',
        name: 'Textile Labeling (Textile Act)',
        description: 'Fiber content labeling and country of origin marking requirements',
        regulation: 'Textile Fiber Products Identification Act / FTC Rules',
        sapSolution: 'SAP material classification with fiber composition characteristics and label generation',
        priority: 'medium',
      },
      {
        id: 'FSH-COMP-003',
        name: 'Customs & Trade Compliance',
        description: 'Tariff classification, preferential origin determination, and import duty calculation for global sourcing',
        regulation: 'HTS / CBP Regulations',
        sapSolution: 'SAP GTS with tariff classification, preferential origin determination, and duty calculation',
        priority: 'high',
      },
      {
        id: 'FSH-COMP-004',
        name: 'Sustainability Reporting',
        description: 'Supply chain sustainability and ESG reporting for fashion industry transparency requirements',
        regulation: 'EU CSRD / Fashion Pact',
        sapSolution: 'SAP Sustainability Control Tower with supply chain carbon footprint tracking',
        priority: 'medium',
      },
    ];
  }

  getGapAnalysis() {
    return [
      {
        id: 'FSH-GAP-001',
        name: 'Style-Color-Size Variant Configuration',
        description: 'Configurable article management with style/color/size dimensions generating variant SKUs',
        inforCapability: 'Infor Fashion PLM with style-color-size matrix and automatic variant generation',
        sapGap: 'SAP Generic Article / Variant Configuration requires careful setup of characteristics and variant tables',
        mitigation: 'Configure SAP Generic Article with Fashion Management (FMS) characteristics for style, color, and size dimensions',
        effort: 'high',
      },
      {
        id: 'FSH-GAP-002',
        name: 'Royalty Management',
        description: 'Royalty calculation and payment for licensed brands based on sales, minimums, and tiered rates',
        inforCapability: 'Infor Fashion royalty management with tiered rates, minimum guarantees, and sublicensing',
        sapGap: 'SAP lacks native royalty management for fashion; requires custom development or SAP BRIM extension',
        mitigation: 'Implement royalty calculation as custom extension with SAP BRIM or partner solution for license fee management',
        effort: 'high',
      },
      {
        id: 'FSH-GAP-003',
        name: 'Season/Collection Management',
        description: 'Season and collection lifecycle management with pre-season planning, in-season management, and markdown',
        inforCapability: 'Infor Fashion PLM with season/collection hierarchy and lifecycle status management',
        sapGap: 'SAP Fashion Management supports seasons but collection lifecycle requires configuration',
        mitigation: 'Configure SAP FMS season management with collection hierarchies and integrate with SAP Assortment Planning',
        effort: 'medium',
      },
      {
        id: 'FSH-GAP-004',
        name: 'Size Scale Mapping',
        description: 'Regional size scale conversion (US/EU/UK/Asia) with size run management for orders',
        inforCapability: 'Infor size scale management with regional conversion tables and size run templates',
        sapGap: 'SAP FMS supports size categories but cross-regional size mapping needs characteristic configuration',
        mitigation: 'Configure SAP classification characteristics for size scales with conversion tables per region',
        effort: 'medium',
      },
      {
        id: 'FSH-GAP-005',
        name: 'Pre-Pack and Assortment Planning',
        description: 'Pre-pack configuration with store-specific size curves and assortment allocation',
        inforCapability: 'Infor Fashion assortment planning with pre-pack templates and size curve optimization',
        sapGap: 'SAP allocation table supports pre-packs but size curve optimization requires SAP CAR/Assortment Planning',
        mitigation: 'Implement SAP Customer Activity Repository (CAR) for assortment planning with pre-pack optimization',
        effort: 'medium',
      },
    ];
  }

  getVerticalTransforms() {
    return [
      {
        id: 'FSH-TX-001',
        name: 'Style-Color-Size Matrix Conversion',
        description: 'Map Infor style/color/size matrix to SAP Generic Article variant structure',
        sourceField: 'STYLE_COLOR_SIZE',
        targetField: 'GENERIC_ARTICLE_VARIANT',
        transformLogic: 'Convert Infor style-color-size tuples to SAP Generic Article with characteristic value combinations and variant material numbers',
      },
      {
        id: 'FSH-TX-002',
        name: 'Season Code Mapping',
        description: 'Map Infor season identifiers to SAP FMS season management codes',
        sourceField: 'SEASON_CODE',
        targetField: 'FMS_SEASON',
        transformLogic: 'Convert Infor season codes (e.g., SS25, FW25) to SAP Fashion Management season records with date ranges',
      },
      {
        id: 'FSH-TX-003',
        name: 'Size Scale Conversion',
        description: 'Map Infor size scales to SAP classification characteristics',
        sourceField: 'SIZE_SCALE',
        targetField: 'SAP_SIZE_CHARACTERISTIC',
        transformLogic: 'Convert Infor regional size scale tables to SAP characteristic values with cross-region mapping tables',
      },
    ];
  }

  getRecommendations() {
    return [
      { title: 'Generic Article Pilot', description: 'Configure one product line as a Generic Article pilot to validate style-color-size variant generation before mass migration.' },
      { title: 'Size Scale Data Cleansing', description: 'Cleanse and standardize size scale data across all regions before migration to avoid variant explosion.' },
      { title: 'Royalty Solution Selection', description: 'Evaluate SAP BRIM vs. custom extension vs. partner solution for royalty management before design phase.' },
      { title: 'Season Cutover Planning', description: 'Plan migration cutover between fashion seasons to minimize disruption to buying and allocation processes.' },
    ];
  }
}

module.exports = FashionPackage;
