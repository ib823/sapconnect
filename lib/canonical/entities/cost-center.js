/**
 * Canonical Cost Center Entity
 *
 * OAGIS-aligned representation of a controlling cost center master record.
 * Source tables: SAP CSKS/CSKT, Infor LN tcmcs065, Infor M3 FCRCST
 */

const BaseCanonicalEntity = require('../base-entity');

class CostCenter extends BaseCanonicalEntity {
  constructor() {
    super('CostCenter');
  }

  getRequiredFields() {
    return ['costCenterId', 'description', 'companyCode', 'controllingArea'];
  }

  getFieldDefinitions() {
    return {
      costCenterId:        { type: 'string',  required: true,  maxLength: 10,  description: 'Cost center identifier' },
      description:         { type: 'string',  required: true,  maxLength: 40,  description: 'Cost center description' },
      responsiblePerson:   { type: 'string',  required: false, maxLength: 20,  description: 'Person responsible for cost center' },
      costCenterCategory:  { type: 'string',  required: false, maxLength: 1,   description: 'Cost center category (F=production, H=admin, etc.)' },
      companyCode:         { type: 'string',  required: true,  maxLength: 4,   description: 'Company code' },
      controllingArea:     { type: 'string',  required: true,  maxLength: 4,   description: 'Controlling area' },
      profitCenter:        { type: 'string',  required: false, maxLength: 10,  description: 'Assigned profit center' },
      validFrom:           { type: 'date',    required: false,                  description: 'Valid-from date' },
      validTo:             { type: 'date',    required: false,                  description: 'Valid-to date' },
      currency:            { type: 'string',  required: false, maxLength: 5,   description: 'Cost center currency (ISO 4217)' },
    };
  }
}

module.exports = CostCenter;
