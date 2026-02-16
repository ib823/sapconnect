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
 * Canonical Inventory Entity
 *
 * OAGIS-aligned representation of a warehouse/plant stock position.
 * Source tables: SAP MARD/MCHB, Infor LN whwmd200, Infor M3 MITBAL
 */

const BaseCanonicalEntity = require('../base-entity');

class Inventory extends BaseCanonicalEntity {
  constructor() {
    super('Inventory');
  }

  getRequiredFields() {
    return ['materialNumber', 'plant', 'quantity', 'unit'];
  }

  getFieldDefinitions() {
    return {
      materialNumber:  { type: 'string',  required: true,  maxLength: 40,  description: 'Material number' },
      plant:           { type: 'string',  required: true,  maxLength: 4,   description: 'Plant / warehouse code' },
      storageLocation: { type: 'string',  required: false, maxLength: 4,   description: 'Storage location within plant' },
      batch:           { type: 'string',  required: false, maxLength: 10,  description: 'Batch / lot number' },
      quantity:        { type: 'number',  required: true,                   description: 'Stock quantity on hand' },
      unit:            { type: 'string',  required: true,  maxLength: 3,   description: 'Unit of measure (ISO)' },
      qualityStatus:   { type: 'string',  required: false, maxLength: 20,  description: 'Quality inspection status' },
      stockType:       { type: 'string',  required: false, maxLength: 20,  description: 'Stock type (unrestricted/blocked/qualityInspection)' },
      valuationType:   { type: 'string',  required: false, maxLength: 10,  description: 'Valuation type for split valuation' },
      specialStock:    { type: 'string',  required: false, maxLength: 1,   description: 'Special stock indicator (E=sales order, W=consignment)' },
    };
  }
}

module.exports = Inventory;
