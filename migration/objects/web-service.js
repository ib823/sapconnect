/**
 * Web Service Migration Object
 *
 * Migrates web service configurations (SOAP/REST/OData) from ECC
 * to S/4HANA. Assesses modernization path for each service.
 *
 * ~20 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class WebServiceMigrationObject extends BaseMigrationObject {
  get objectId() { return 'WEB_SERVICE'; }
  get name() { return 'Web Service'; }

  getFieldMappings() {
    return [
      // ── Service identification ─────────────────────────────────
      { source: 'SRVNAME', target: 'ServiceName' },
      { source: 'SRVTYPE', target: 'ServiceType' },
      { source: 'DIRECTION', target: 'Direction' },
      { source: 'BINDING', target: 'BindingClass' },
      { source: 'NAMESPACE', target: 'Namespace' },
      { source: 'VERSION', target: 'ServiceVersion' },

      // ── Technical details ──────────────────────────────────────
      { source: 'ENDPOINT', target: 'EndpointURL' },
      { source: 'AUTHTYPE', target: 'AuthenticationType' },
      { source: 'PROTOCOL', target: 'Protocol' },
      { source: 'WSDLPATH', target: 'WSDLPath' },
      { source: 'PACKAGE', target: 'ABAPPackage' },
      { source: 'TRANSPORT', target: 'TransportRequest' },

      // ── Status ─────────────────────────────────────────────────
      { source: 'STATUS', target: 'Status' },
      { source: 'LASTCALL', target: 'LastCalledDate', convert: 'toDate' },
      { source: 'CALLCOUNT', target: 'MonthlyCallCount', convert: 'toInteger' },

      // ── Migration assessment ───────────────────────────────────
      { source: 'MIGPATH', target: 'MigrationPath' },
      { source: 'S4REPLACEMENT', target: 'S4HANAReplacement' },
      { source: 'EFFORT', target: 'EstimatedEffort' },

      // ── Metadata ───────────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'WEB_SERVICE' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['ServiceName', 'ServiceType', 'Direction'],
      exactDuplicate: { keys: ['ServiceName', 'ServiceVersion'] },
    };
  }

  _extractMock() {
    const records = [];
    const services = [
      // SOAP providers
      { name: 'ZSOAP_CUSTOMER_SYNC', type: 'SOAP', dir: 'provider', binding: 'ZCL_WS_CUSTOMER', ns: 'urn:sap-com:document:sap:rfc:functions', calls: 5000, path: 'soap→odata', repl: 'API_BUSINESS_PARTNER' },
      { name: 'ZSOAP_VENDOR_SYNC', type: 'SOAP', dir: 'provider', binding: 'ZCL_WS_VENDOR', ns: 'urn:sap-com:document:sap:rfc:functions', calls: 3200, path: 'soap→odata', repl: 'API_BUSINESS_PARTNER' },
      { name: 'ZSOAP_PO_CREATE', type: 'SOAP', dir: 'provider', binding: 'ZCL_WS_PO', ns: 'urn:sap-com:document:sap:rfc:functions', calls: 2800, path: 'soap→odata', repl: 'API_PURCHASEORDER_PROCESS_SRV' },
      { name: 'ZSOAP_INVENTORY_INQ', type: 'SOAP', dir: 'consumer', binding: 'ZCL_WS_INV_PROXY', ns: 'http://inv.external.com', calls: 8000, path: 'cpi-route', repl: 'Route via CPI' },
      // REST services
      { name: 'ZREST_ORDER_STATUS', type: 'REST', dir: 'provider', binding: 'ZCL_REST_ORDER', ns: '/sap/zrest/order', calls: 12000, path: 'keep-enhance', repl: 'Enhance with RAP' },
      { name: 'ZREST_PAYMENT_POST', type: 'REST', dir: 'consumer', binding: 'ZCL_REST_PAY', ns: 'https://pay.stripe.com/api', calls: 1500, path: 'cpi-route', repl: 'Route via CPI' },
      { name: 'ZREST_SHIPMENT_TRACK', type: 'REST', dir: 'consumer', binding: 'ZCL_REST_SHIP', ns: 'https://track.carrier.com/api', calls: 900, path: 'cpi-route', repl: 'Route via CPI' },
      // OData services
      { name: 'ZODATA_MATERIAL_SRV', type: 'OData', dir: 'provider', binding: 'ZCL_ODATA_MAT', ns: '/sap/opu/odata/sap', calls: 15000, path: 'migrate-to-rap', repl: 'RAP-based OData v4' },
      { name: 'ZODATA_SALES_SRV', type: 'OData', dir: 'provider', binding: 'ZCL_ODATA_SALES', ns: '/sap/opu/odata/sap', calls: 9500, path: 'migrate-to-rap', repl: 'RAP-based OData v4' },
      { name: 'ZODATA_EMPLOYEE_SRV', type: 'OData', dir: 'provider', binding: 'ZCL_ODATA_HR', ns: '/sap/opu/odata/sap', calls: 4200, path: 'migrate-to-rap', repl: 'RAP-based OData v4' },
      // Standard SAP services (already S/4-ready)
      { name: 'API_BUSINESS_PARTNER', type: 'OData', dir: 'provider', binding: 'CL_BP_ODATA', ns: '/sap/opu/odata/sap', calls: 20000, path: 'keep', repl: 'Already S/4HANA native' },
      { name: 'API_MATERIAL_DOCUMENT_SRV', type: 'OData', dir: 'provider', binding: 'CL_MATDOC_ODATA', ns: '/sap/opu/odata/sap', calls: 7500, path: 'keep', repl: 'Already S/4HANA native' },
    ];

    const effortMap = { 'keep': 'none', 'keep-enhance': 'low', 'soap→odata': 'medium', 'migrate-to-rap': 'medium', 'cpi-route': 'high' };

    for (const s of services) {
      records.push({
        SRVNAME: s.name,
        SRVTYPE: s.type,
        DIRECTION: s.dir,
        BINDING: s.binding,
        NAMESPACE: s.ns,
        VERSION: '0001',
        ENDPOINT: s.type === 'OData' ? `/sap/opu/odata/sap/${s.name}` : `/sap/bc/srt/wsdl/${s.name}`,
        AUTHTYPE: 'BASIC',
        PROTOCOL: s.type === 'SOAP' ? 'HTTP/1.1' : 'HTTP/2',
        WSDLPATH: s.type === 'SOAP' ? `/sap/bc/srt/wsdl/${s.name}?sap-client=100` : '',
        PACKAGE: `Z${s.type}_PKG`,
        TRANSPORT: 'DEVK900001',
        STATUS: 'active',
        LASTCALL: '20240115',
        CALLCOUNT: String(s.calls),
        MIGPATH: s.path,
        S4REPLACEMENT: s.repl,
        EFFORT: effortMap[s.path] || 'medium',
      });
    }

    return records; // 12 records
  }
}

module.exports = WebServiceMigrationObject;
