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
 * Canonical Production Order Entity
 *
 * OAGIS-aligned representation of a manufacturing/production order.
 * Source tables: SAP AUFK/AFKO, Infor LN tisfc001, Infor M3 MWOHED
 */

const BaseCanonicalEntity = require('../base-entity');

class ProductionOrder extends BaseCanonicalEntity {
  constructor() {
    super('ProductionOrder');
  }

  getRequiredFields() {
    return ['orderNumber', 'materialNumber', 'quantity', 'unit', 'plant'];
  }

  getFieldDefinitions() {
    return {
      orderNumber:    { type: 'string',  required: true,  maxLength: 12,  description: 'Production order number' },
      orderType:      { type: 'string',  required: false, maxLength: 4,   description: 'Order type (PP01, PP02)' },
      materialNumber: { type: 'string',  required: true,  maxLength: 40,  description: 'Material to be produced' },
      quantity:       { type: 'number',  required: true,                   description: 'Total order quantity' },
      unit:           { type: 'string',  required: true,  maxLength: 3,   description: 'Unit of measure (ISO)' },
      startDate:      { type: 'date',    required: false,                  description: 'Scheduled start date' },
      endDate:        { type: 'date',    required: false,                  description: 'Scheduled finish date' },
      plant:          { type: 'string',  required: true,  maxLength: 4,   description: 'Production plant' },
      status:         { type: 'string',  required: false, maxLength: 20,  description: 'System status (CRTD, REL, TECO, CLSD)' },
      routingNumber:  { type: 'string',  required: false, maxLength: 10,  description: 'Associated routing number' },
      bomNumber:      { type: 'string',  required: false, maxLength: 10,  description: 'Associated BOM number' },
    };
  }
}

module.exports = ProductionOrder;
