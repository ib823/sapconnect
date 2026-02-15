/**
 * Canonical Purchase Order Entity
 *
 * OAGIS-aligned representation of a purchase order with header and line items.
 * Source tables: SAP EKKO/EKPO, Infor LN tdpur400/401, Infor M3 MPHEAD/MPLINE
 */

const BaseCanonicalEntity = require('../base-entity');

class PurchaseOrder extends BaseCanonicalEntity {
  constructor() {
    super('PurchaseOrder');
  }

  getRequiredFields() {
    return ['orderNumber', 'orderType', 'vendorNumber', 'orderDate', 'currency'];
  }

  getFieldDefinitions() {
    return {
      orderNumber:     { type: 'string',  required: true,  maxLength: 10,  description: 'Purchase order number' },
      orderType:       { type: 'string',  required: true,  maxLength: 4,   description: 'PO document type (NB, FO, UB)' },
      vendorNumber:    { type: 'string',  required: true,  maxLength: 10,  description: 'Vendor account number' },
      orderDate:       { type: 'date',    required: true,                   description: 'Document date of the PO' },
      currency:        { type: 'string',  required: true,  maxLength: 5,   description: 'Document currency (ISO 4217)' },
      purchaseOrg:     { type: 'string',  required: false, maxLength: 4,   description: 'Purchasing organization' },
      purchaseGroup:   { type: 'string',  required: false, maxLength: 3,   description: 'Purchasing group' },
      companyCode:     { type: 'string',  required: false, maxLength: 4,   description: 'Company code' },
      items:           { type: 'array',   required: false,                  description: 'PO line items' },
    };
  }
}

module.exports = PurchaseOrder;
