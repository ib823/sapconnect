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
 * Industry Package Registry
 *
 * Central registry for all industry-specific migration packages.
 * Provides lookup by industry ID, listing, and convenience analysis method.
 */

const Logger = require('../../lib/logger');
const { SapConnectError } = require('../../lib/errors');

const AerospaceDefensePackage = require('./aerospace-defense');
const AutomotivePackage = require('./automotive');
const FoodBeveragePackage = require('./food-beverage');
const FashionPackage = require('./fashion');
const HealthcarePackage = require('./healthcare');
const PublicSectorPackage = require('./public-sector');
const ChemicalsPackage = require('./chemicals');
const DistributionPackage = require('./distribution');
const IndustrialMfgPackage = require('./industrial-mfg');
const EquipmentPackage = require('./equipment');

const log = new Logger('industry:registry');

const _packages = new Map();

function _register(PackageClass) {
  const instance = new PackageClass();
  _packages.set(instance.industryId, instance);
}

// Register all industry packages
_register(AerospaceDefensePackage);
_register(AutomotivePackage);
_register(FoodBeveragePackage);
_register(FashionPackage);
_register(HealthcarePackage);
_register(PublicSectorPackage);
_register(ChemicalsPackage);
_register(DistributionPackage);
_register(IndustrialMfgPackage);
_register(EquipmentPackage);

/**
 * Get an industry package by ID.
 *
 * @param {string} industryId - Industry identifier (e.g. 'AUTOMOTIVE')
 * @returns {BaseIndustryPackage} The industry package instance
 * @throws {SapConnectError} If the industry ID is not found
 */
function getPackage(industryId) {
  const pkg = _packages.get(industryId);
  if (!pkg) {
    throw new SapConnectError(
      `Unknown industry package: ${industryId}. Available: ${[..._packages.keys()].join(', ')}`,
      'ERR_INDUSTRY_UNKNOWN'
    );
  }
  return pkg;
}

/**
 * List all available industry packages.
 *
 * @returns {Array<Object>} Array of { industryId, name, description }
 */
function listPackages() {
  return [..._packages.values()].map(pkg => ({
    industryId: pkg.industryId,
    name: pkg.name,
    description: pkg.description,
  }));
}

/**
 * Run industry-specific analysis for a given industry.
 *
 * @param {string} industryId - Industry identifier
 * @param {Object} [extractionResults] - Optional extraction data
 * @returns {Object} Industry analysis results
 */
function analyzeForIndustry(industryId, extractionResults) {
  log.info(`Running industry analysis for ${industryId}`);
  const pkg = getPackage(industryId);
  return pkg.analyze(extractionResults);
}

module.exports = {
  getPackage,
  listPackages,
  analyzeForIndustry,
  // Export classes for direct instantiation if needed
  AerospaceDefensePackage,
  AutomotivePackage,
  FoodBeveragePackage,
  FashionPackage,
  HealthcarePackage,
  PublicSectorPackage,
  ChemicalsPackage,
  DistributionPackage,
  IndustrialMfgPackage,
  EquipmentPackage,
};
