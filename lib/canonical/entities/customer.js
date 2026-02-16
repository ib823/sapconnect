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
 * Canonical Customer Entity
 *
 * OAGIS-aligned representation of a customer master record.
 * Source tables: SAP KNA1/KNVV, Infor LN tccom100, Infor M3 CIDMAS
 */

const BaseCanonicalEntity = require('../base-entity');

class Customer extends BaseCanonicalEntity {
  constructor() {
    super('Customer');
  }

  getRequiredFields() {
    return ['customerId', 'name', 'country'];
  }

  getFieldDefinitions() {
    return {
      customerId:          { type: 'string',  required: true,  maxLength: 10,  description: 'Unique customer identifier' },
      name:                { type: 'string',  required: true,  maxLength: 35,  description: 'Customer name (line 1)' },
      name2:               { type: 'string',  required: false, maxLength: 35,  description: 'Customer name (line 2)' },
      searchTerm:          { type: 'string',  required: false, maxLength: 20,  description: 'Search term / sort field' },
      street:              { type: 'string',  required: false, maxLength: 60,  description: 'Street address' },
      city:                { type: 'string',  required: false, maxLength: 40,  description: 'City' },
      postalCode:          { type: 'string',  required: false, maxLength: 10,  description: 'Postal / ZIP code' },
      country:             { type: 'string',  required: true,  maxLength: 3,   description: 'Country key (ISO 3166)' },
      region:              { type: 'string',  required: false, maxLength: 3,   description: 'State / region code' },
      phone:               { type: 'string',  required: false, maxLength: 30,  description: 'Primary phone number' },
      email:               { type: 'string',  required: false, maxLength: 241, description: 'Email address' },
      taxNumber:           { type: 'string',  required: false, maxLength: 20,  description: 'Tax registration number' },
      paymentTerms:        { type: 'string',  required: false, maxLength: 4,   description: 'Payment terms key' },
      currency:            { type: 'string',  required: false, maxLength: 5,   description: 'Customer currency (ISO 4217)' },
      accountGroup:        { type: 'string',  required: false, maxLength: 4,   description: 'Customer account group' },
      salesOrg:            { type: 'string',  required: false, maxLength: 4,   description: 'Sales organization' },
      distributionChannel: { type: 'string',  required: false, maxLength: 2,   description: 'Distribution channel' },
    };
  }
}

module.exports = Customer;
