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
 * Canonical Fixed Asset Entity
 *
 * OAGIS-aligned representation of a fixed asset master record.
 * Source tables: SAP ANLA/ANLZ, Infor LN tffam100, Infor M3 CFAMAS
 */

const BaseCanonicalEntity = require('../base-entity');

class FixedAsset extends BaseCanonicalEntity {
  constructor() {
    super('FixedAsset');
  }

  getRequiredFields() {
    return ['assetNumber', 'description', 'assetClass', 'companyCode'];
  }

  getFieldDefinitions() {
    return {
      assetNumber:        { type: 'string',  required: true,  maxLength: 12,  description: 'Main asset number' },
      assetSubnumber:     { type: 'string',  required: false, maxLength: 4,   description: 'Asset sub-number' },
      description:        { type: 'string',  required: true,  maxLength: 50,  description: 'Asset description' },
      assetClass:         { type: 'string',  required: true,  maxLength: 8,   description: 'Asset class' },
      capitalizationDate: { type: 'date',    required: false,                  description: 'Capitalization date' },
      deactivationDate:   { type: 'date',    required: false,                  description: 'Asset deactivation / retirement date' },
      companyCode:        { type: 'string',  required: true,  maxLength: 4,   description: 'Company code' },
      costCenter:         { type: 'string',  required: false, maxLength: 10,  description: 'Cost center assignment' },
      quantity:           { type: 'number',  required: false,                  description: 'Asset quantity' },
      serialNumber:       { type: 'string',  required: false, maxLength: 18,  description: 'Serial number' },
      inventoryNumber:    { type: 'string',  required: false, maxLength: 25,  description: 'Inventory number' },
    };
  }
}

module.exports = FixedAsset;
