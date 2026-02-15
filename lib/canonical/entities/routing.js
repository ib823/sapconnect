/**
 * Canonical Routing Entity
 *
 * OAGIS-aligned representation of a manufacturing routing with operations.
 * Source tables: SAP PLKO/PLPO, Infor LN tirou001/002, Infor M3 MPDOPE
 */

const BaseCanonicalEntity = require('../base-entity');

class Routing extends BaseCanonicalEntity {
  constructor() {
    super('Routing');
  }

  getRequiredFields() {
    return ['routingNumber', 'materialNumber', 'plant'];
  }

  getFieldDefinitions() {
    return {
      routingNumber:  { type: 'string',  required: true,  maxLength: 10,  description: 'Routing / task list group number' },
      materialNumber: { type: 'string',  required: true,  maxLength: 40,  description: 'Material assigned to routing' },
      plant:          { type: 'string',  required: true,  maxLength: 4,   description: 'Plant code' },
      routingUsage:   { type: 'string',  required: false, maxLength: 1,   description: 'Task list usage (1=production, 2=engineering)' },
      operations:     { type: 'array',   required: false,                  description: 'Routing operation steps' },
    };
  }
}

module.exports = Routing;
