/**
 * RFC Destination Migration Object
 *
 * Migrates RFC Destination configurations from ECC (RFCDES)
 * to S/4HANA. Classifies destinations by migration strategy:
 * keep, redirect, replace-with-CPI, or decommission.
 *
 * ~20 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class RFCDestinationMigrationObject extends BaseMigrationObject {
  get objectId() { return 'RFC_DESTINATION'; }
  get name() { return 'RFC Destination'; }

  getFieldMappings() {
    return [
      { source: 'RFCDEST', target: 'Destination' },
      { source: 'RFCTYPE', target: 'RFCType' },
      { source: 'RFCOPTIONS', target: 'Description' },
      { source: 'RFCHOST', target: 'TargetHost' },
      { source: 'RFCSYSID', target: 'SystemID' },
      { source: 'RFCCLIENT', target: 'Client' },
      { source: 'RFCUSER', target: 'LogonUser' },
      { source: 'RFCAUTH', target: 'AuthType' },
      { source: 'RFCSNC', target: 'SNCEnabled', convert: 'boolYN' },
      { source: 'RFCSNCQOP', target: 'SNCQualityOfProtection' },
      { source: 'RFCSAMEUSR', target: 'SameUser', convert: 'boolYN' },
      { source: 'RFCPORT', target: 'Port' },
      { source: 'RFCINSTNO', target: 'InstanceNumber' },
      { source: 'RFCGWHOST', target: 'GatewayHost' },
      { source: 'RFCGWSERV', target: 'GatewayService' },
      { source: 'RFCMSGSRV', target: 'MessageServer' },
      { source: 'RFCGROUP', target: 'LogonGroup' },
      { source: 'RFCSTATUS', target: 'Status' },
      { source: 'RFCMIGSTRATEGY', target: 'MigrationStrategy' },
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'RFC_DESTINATION' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['Destination', 'RFCType', 'TargetHost'],
      exactDuplicate: { keys: ['Destination'] },
    };
  }

  /**
   * Classify RFC destination migration strategy based on type and target.
   */
  _classifyStrategy(dest) {
    // Embedded systems (APO, CRM, SRM) — decommission
    if (/APO|CRM|SRM/i.test(dest.RFCDEST)) return 'decommission';
    // PI/PO middleware — replace with CPI
    if (/PI|PO_/i.test(dest.RFCDEST)) return 'replace-with-cpi';
    // Solution Manager — replace with Cloud ALM
    if (/SOLMAN/i.test(dest.RFCDEST)) return 'replace-with-cloud-alm';
    // BW — review for embedded analytics
    if (/BW/i.test(dest.RFCDEST)) return 'review';
    // Cloud destinations (SuccessFactors, Ariba, Concur) — route through CPI
    if (/SF_|ARIBA|CONCUR|SALESFORCE/i.test(dest.RFCDEST)) return 'route-via-cpi';
    // Type T (TCP/IP file transfer) — replace with CPI SFTP
    if (dest.RFCTYPE === 'T') return 'replace-with-cpi';
    // Type H (HTTP) to external — route through CPI
    if (dest.RFCTYPE === 'H') return 'route-via-cpi';
    // Type 3 (ABAP) internal — keep and redirect
    if (dest.RFCTYPE === '3') return 'keep-redirect';
    return 'review';
  }

  _extractMock() {
    const records = [];
    const destinations = [
      { dest: 'SAPFTP', type: 'T', desc: 'FTP transfer', host: 'ftp.acme.com', status: 'active' },
      { dest: 'ERP_TO_CRM', type: '3', desc: 'CRM integration', host: 'crm.acme.com', status: 'active' },
      { dest: 'ERP_TO_BW', type: '3', desc: 'BW extraction', host: 'bw.acme.com', status: 'active' },
      { dest: 'ERP_TO_PI', type: '3', desc: 'PI middleware', host: 'pi.acme.com', status: 'active' },
      { dest: 'ERP_TO_SRM', type: '3', desc: 'SRM procurement', host: 'srm.acme.com', status: 'active' },
      { dest: 'ERP_TO_PORTAL', type: 'H', desc: 'Enterprise Portal', host: 'portal.acme.com', status: 'active' },
      { dest: 'BANK_SFTP', type: 'T', desc: 'Bank file transfer', host: 'sftp.bank.com', status: 'active' },
      { dest: 'EDI_PROVIDER', type: 'H', desc: 'EDI VAN provider', host: 'edi.provider.com', status: 'active' },
      { dest: 'TAX_ENGINE', type: 'H', desc: 'Tax calculation', host: 'tax.vertex.com', status: 'active' },
      { dest: 'ERP_TO_GTS', type: '3', desc: 'GTS compliance', host: 'gts.acme.com', status: 'active' },
      { dest: 'ERP_TO_EWM', type: '3', desc: 'Extended WM', host: 'ewm.acme.com', status: 'active' },
      { dest: 'ARIBA_NETWORK', type: 'H', desc: 'Ariba Network', host: 'api.ariba.com', status: 'active' },
      { dest: 'SF_EC', type: 'H', desc: 'SuccessFactors EC', host: 'api.successfactors.com', status: 'active' },
      { dest: 'CONCUR_API', type: 'H', desc: 'SAP Concur', host: 'api.concursolutions.com', status: 'active' },
      { dest: 'LEGACY_MAINFRAME', type: '3', desc: 'Mainframe legacy', host: 'mainframe.acme.com', status: 'inactive' },
      { dest: 'ERP_TO_MES', type: '3', desc: 'MES shopfloor', host: 'mes.acme.com', status: 'active' },
      { dest: 'ERP_TO_SOLMAN', type: '3', desc: 'Solution Manager', host: 'solman.acme.com', status: 'active' },
      { dest: 'SALESFORCE_API', type: 'H', desc: 'Salesforce CRM', host: 'api.salesforce.com', status: 'active' },
      { dest: 'ERP_TO_APO', type: '3', desc: 'APO planning', host: 'apo.acme.com', status: 'active' },
      { dest: 'PRINT_SERVER', type: 'T', desc: 'Print services', host: 'print.acme.com', status: 'active' },
    ];

    for (const d of destinations) {
      const rec = {
        RFCDEST: d.dest,
        RFCTYPE: d.type,
        RFCOPTIONS: d.desc,
        RFCHOST: d.host,
        RFCSYSID: d.type === '3' ? 'S4H' : '',
        RFCCLIENT: d.type === '3' ? '100' : '',
        RFCUSER: 'RFC_USER',
        RFCAUTH: d.type === 'H' ? 'BASIC' : 'DIALOG',
        RFCSNC: d.type === '3' ? 'X' : '',
        RFCSNCQOP: d.type === '3' ? '3' : '',
        RFCSAMEUSR: '',
        RFCPORT: d.type === 'H' ? '443' : d.type === 'T' ? '22' : '3300',
        RFCINSTNO: d.type === '3' ? '00' : '',
        RFCGWHOST: d.type === '3' ? d.host : '',
        RFCGWSERV: d.type === '3' ? 'sapgw00' : '',
        RFCMSGSRV: '',
        RFCGROUP: '',
        RFCSTATUS: d.status,
      };
      rec.RFCMIGSTRATEGY = this._classifyStrategy(rec);
      records.push(rec);
    }

    return records; // 20 records
  }
}

module.exports = RFCDestinationMigrationObject;
