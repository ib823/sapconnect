/**
 * Canonical Bill of Materials (BOM) Entity
 *
 * OAGIS-aligned representation of a bill of materials with components.
 * Source tables: SAP STKO/STPO, Infor LN tibom001/010, Infor M3 MPDHED/MPDMAT
 */

const BaseCanonicalEntity = require('../base-entity');

class Bom extends BaseCanonicalEntity {
  constructor() {
    super('Bom');
  }

  getRequiredFields() {
    return ['bomNumber', 'materialNumber', 'plant', 'baseQuantity', 'baseUnit'];
  }

  getFieldDefinitions() {
    return {
      bomNumber:      { type: 'string',  required: true,  maxLength: 8,   description: 'BOM group number' },
      materialNumber: { type: 'string',  required: true,  maxLength: 40,  description: 'Header material' },
      plant:          { type: 'string',  required: true,  maxLength: 4,   description: 'Plant code' },
      bomUsage:       { type: 'string',  required: false, maxLength: 1,   description: 'BOM usage (1=production, 2=engineering, 5=sales)' },
      baseQuantity:   { type: 'number',  required: true,                   description: 'Base quantity for component ratios' },
      baseUnit:       { type: 'string',  required: true,  maxLength: 3,   description: 'Base unit of measure (ISO)' },
      validFrom:      { type: 'date',    required: false,                  description: 'Valid-from date' },
      validTo:        { type: 'date',    required: false,                  description: 'Valid-to date' },
      components:     { type: 'array',   required: false,                  description: 'BOM component items' },
    };
  }
}

module.exports = Bom;
