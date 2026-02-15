/**
 * Canonical Vendor (Supplier) Entity
 *
 * OAGIS-aligned representation of a vendor/supplier master record.
 * Source tables: SAP LFA1/LFM1, Infor LN tccom100 (supplier role), Infor M3 CIDVEN
 */

const BaseCanonicalEntity = require('../base-entity');

class Vendor extends BaseCanonicalEntity {
  constructor() {
    super('Vendor');
  }

  getRequiredFields() {
    return ['vendorId', 'name', 'country'];
  }

  getFieldDefinitions() {
    return {
      vendorId:       { type: 'string',  required: true,  maxLength: 10,  description: 'Unique vendor identifier' },
      name:           { type: 'string',  required: true,  maxLength: 35,  description: 'Vendor name (line 1)' },
      name2:          { type: 'string',  required: false, maxLength: 35,  description: 'Vendor name (line 2)' },
      searchTerm:     { type: 'string',  required: false, maxLength: 20,  description: 'Search term / sort field' },
      street:         { type: 'string',  required: false, maxLength: 60,  description: 'Street address' },
      city:           { type: 'string',  required: false, maxLength: 40,  description: 'City' },
      postalCode:     { type: 'string',  required: false, maxLength: 10,  description: 'Postal / ZIP code' },
      country:        { type: 'string',  required: true,  maxLength: 3,   description: 'Country key (ISO 3166)' },
      region:         { type: 'string',  required: false, maxLength: 3,   description: 'State / region code' },
      phone:          { type: 'string',  required: false, maxLength: 30,  description: 'Primary phone number' },
      email:          { type: 'string',  required: false, maxLength: 241, description: 'Email address' },
      taxNumber:      { type: 'string',  required: false, maxLength: 20,  description: 'Tax registration number' },
      paymentTerms:   { type: 'string',  required: false, maxLength: 4,   description: 'Payment terms key' },
      currency:       { type: 'string',  required: false, maxLength: 5,   description: 'Vendor currency (ISO 4217)' },
      accountGroup:   { type: 'string',  required: false, maxLength: 4,   description: 'Vendor account group' },
      purchaseOrg:    { type: 'string',  required: false, maxLength: 4,   description: 'Purchasing organization' },
    };
  }
}

module.exports = Vendor;
