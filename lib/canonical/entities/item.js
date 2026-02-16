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
 * Canonical Item (Material Master) Entity
 *
 * OAGIS-aligned representation of a material/item master record.
 * Source tables: SAP MARA/MAKT, Infor LN tcibd001, Infor M3 MITMAS
 */

const BaseCanonicalEntity = require('../base-entity');

class Item extends BaseCanonicalEntity {
  constructor() {
    super('Item');
  }

  getRequiredFields() {
    return ['itemId', 'description', 'baseUom'];
  }

  getFieldDefinitions() {
    return {
      itemId:         { type: 'string',  required: true,  maxLength: 40,  description: 'Unique material/item identifier' },
      description:    { type: 'string',  required: true,  maxLength: 40,  description: 'Material short description' },
      baseUom:        { type: 'string',  required: true,  maxLength: 3,   description: 'Base unit of measure (ISO)' },
      itemType:       { type: 'string',  required: false, maxLength: 4,   description: 'Material type (FERT/HALB/ROH/HIBE)' },
      itemGroup:      { type: 'string',  required: false, maxLength: 9,   description: 'Material group for classification' },
      grossWeight:    { type: 'number',  required: false,                  description: 'Gross weight of material' },
      netWeight:      { type: 'number',  required: false,                  description: 'Net weight of material' },
      weightUnit:     { type: 'string',  required: false, maxLength: 3,   description: 'Unit of weight (KG, LB, G)' },
      volume:         { type: 'number',  required: false,                  description: 'Volume of material' },
      volumeUnit:     { type: 'string',  required: false, maxLength: 3,   description: 'Unit of volume (L, GAL, M3)' },
      materialGroup:  { type: 'string',  required: false, maxLength: 9,   description: 'Material group for procurement' },
      purchaseGroup:  { type: 'string',  required: false, maxLength: 3,   description: 'Purchasing group responsible' },
      mrpType:        { type: 'string',  required: false, maxLength: 2,   description: 'MRP type (PD, VB, ND)' },
      lotSize:        { type: 'string',  required: false, maxLength: 2,   description: 'Lot sizing procedure' },
      safetyStock:    { type: 'number',  required: false,                  description: 'Safety stock quantity' },
    };
  }
}

module.exports = Item;
