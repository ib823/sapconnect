/**
 * Canonical Sales Order Entity
 *
 * OAGIS-aligned representation of a sales order with header and line items.
 * Source tables: SAP VBAK/VBAP, Infor LN tdsls040/041, Infor M3 OOHEAD/OOLINE
 */

const BaseCanonicalEntity = require('../base-entity');

class SalesOrder extends BaseCanonicalEntity {
  constructor() {
    super('SalesOrder');
  }

  getRequiredFields() {
    return ['orderNumber', 'orderType', 'customerNumber', 'orderDate', 'currency'];
  }

  getFieldDefinitions() {
    return {
      orderNumber:           { type: 'string',  required: true,  maxLength: 10,  description: 'Sales order number' },
      orderType:             { type: 'string',  required: true,  maxLength: 4,   description: 'Sales order type (TA, OR, SO)' },
      customerNumber:        { type: 'string',  required: true,  maxLength: 10,  description: 'Sold-to customer number' },
      purchaseOrderNumber:   { type: 'string',  required: false, maxLength: 35,  description: 'Customer purchase order reference' },
      orderDate:             { type: 'date',    required: true,                   description: 'Document date of the order' },
      requestedDeliveryDate: { type: 'date',    required: false,                  description: 'Requested delivery date' },
      currency:              { type: 'string',  required: true,  maxLength: 5,   description: 'Document currency (ISO 4217)' },
      salesOrg:              { type: 'string',  required: false, maxLength: 4,   description: 'Sales organization' },
      distributionChannel:   { type: 'string',  required: false, maxLength: 2,   description: 'Distribution channel' },
      division:              { type: 'string',  required: false, maxLength: 2,   description: 'Division' },
      items:                 { type: 'array',   required: false,                  description: 'Order line items' },
    };
  }
}

module.exports = SalesOrder;
