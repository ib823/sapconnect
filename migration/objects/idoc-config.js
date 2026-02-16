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
 * IDoc Configuration Migration Object
 *
 * Migrates IDoc flow configurations from ECC (EDPAR/EDP13/WE20)
 * to S/4HANA. Covers message types, partner profiles, port definitions,
 * and IDoc type assignments.
 *
 * ~25 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class IDocConfigMigrationObject extends BaseMigrationObject {
  get objectId() { return 'IDOC_CONFIG'; }
  get name() { return 'IDoc Configuration'; }

  getFieldMappings() {
    return [
      // ── Flow identification ────────────────────────────────────
      { source: 'MESTYP', target: 'MessageType' },
      { source: 'IDOCTP', target: 'IDocType' },
      { source: 'CIMTYP', target: 'ExtensionType' },
      { source: 'DIRECT', target: 'Direction' },
      { source: 'RCVPRN', target: 'PartnerNumber' },
      { source: 'RCVPRT', target: 'PartnerType' },
      { source: 'RCVPFC', target: 'PartnerFunction' },
      { source: 'SNDPRN', target: 'SenderPartner' },
      { source: 'SNDPRT', target: 'SenderPartnerType' },

      // ── Port & processing ──────────────────────────────────────
      { source: 'PORT', target: 'Port' },
      { source: 'RFCDEST', target: 'RFCDestination' },
      { source: 'OUTMODE', target: 'OutputMode' },
      { source: 'PACKSZ', target: 'PacketSize', convert: 'toInteger' },
      { source: 'QUEUEID', target: 'QueueID' },

      // ── Volume & monitoring ────────────────────────────────────
      { source: 'VOLUME', target: 'DailyVolume', convert: 'toInteger' },
      { source: 'DESCRIPTION', target: 'Description' },
      { source: 'STATUS', target: 'FlowStatus' },
      { source: 'LASTRUN', target: 'LastProcessedDate', convert: 'toDate' },

      // ── Segment / mapping info ─────────────────────────────────
      { source: 'SEGNUM', target: 'SegmentCount', convert: 'toInteger' },
      { source: 'MESSION_APVER', target: 'MappingVersion' },

      // ── Migration assessment ───────────────────────────────────
      { source: 'MIGSTRATEGY', target: 'MigrationStrategy' },
      { source: 'IMPACT', target: 'ImpactLevel' },
      { source: 'S4_REPLACEMENT', target: 'S4HANAReplacement' },

      // ── Metadata ───────────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'IDOC_CONFIG' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['MessageType', 'IDocType', 'Direction', 'PartnerNumber'],
      exactDuplicate: { keys: ['MessageType', 'IDocType', 'Direction', 'PartnerNumber'] },
      range: [
        { field: 'DailyVolume', min: 0, max: 1000000 },
      ],
    };
  }

  /**
   * Classify IDoc flow migration strategy.
   */
  _classifyFlow(messageType, idocType, partner) {
    // Business partner replaces customer/vendor
    if (/^(DEBMAS|CREMAS)/.test(messageType)) {
      return { strategy: 'replace', impact: 'high', replacement: 'BUMAS (Business Partner IDoc)' };
    }
    // WM IDocs replaced by EWM
    if (/^(WMMBID|WMTOCO)/.test(messageType)) {
      return { strategy: 'replace', impact: 'high', replacement: 'Embedded EWM or decentralized EWM APIs' };
    }
    // Material master — segment changes
    if (/^MATMAS/.test(messageType)) {
      return { strategy: 'update-segments', impact: 'medium', replacement: 'MATMAS with 40-char MATNR segments' };
    }
    // Cloud destinations
    if (/SF_EC|ARIBA|CONCUR/.test(partner)) {
      return { strategy: 'route-via-cpi', impact: 'medium', replacement: 'CPI standard content package' };
    }
    // BW flows
    if (/BW/.test(partner)) {
      return { strategy: 'review', impact: 'medium', replacement: 'CDS-based extraction or embedded analytics' };
    }
    // APO flows
    if (/APO/.test(partner)) {
      return { strategy: 'decommission', impact: 'high', replacement: 'Embedded PP/DS' };
    }
    // Standard EDI — keep with review
    return { strategy: 'keep-review', impact: 'low', replacement: 'Verify segment compatibility' };
  }

  _extractMock() {
    const records = [];
    const flows = [
      { msg: 'ORDERS', idoc: 'ORDERS05', dir: '1', partner: 'EDI_PROVIDER', desc: 'Purchase order from customer', vol: 1200, segs: 45 },
      { msg: 'ORDRSP', idoc: 'ORDERS05', dir: '2', partner: 'EDI_PROVIDER', desc: 'Order confirmation', vol: 1100, segs: 45 },
      { msg: 'DESADV', idoc: 'DESADV01', dir: '2', partner: 'EDI_PROVIDER', desc: 'Advance shipping notice', vol: 800, segs: 30 },
      { msg: 'INVOIC', idoc: 'INVOIC02', dir: '2', partner: 'EDI_PROVIDER', desc: 'Invoice outbound', vol: 950, segs: 50 },
      { msg: 'INVOIC', idoc: 'INVOIC02', dir: '1', partner: 'EDI_PROVIDER', desc: 'Vendor invoice', vol: 600, segs: 50 },
      { msg: 'MATMAS', idoc: 'MATMAS05', dir: '2', partner: 'ERP_TO_BW', desc: 'Material master dist', vol: 350, segs: 65 },
      { msg: 'DEBMAS', idoc: 'DEBMAS07', dir: '2', partner: 'ERP_TO_CRM', desc: 'Customer master dist', vol: 200, segs: 40 },
      { msg: 'CREMAS', idoc: 'CREMAS05', dir: '2', partner: 'ERP_TO_SRM', desc: 'Vendor master dist', vol: 150, segs: 35 },
      { msg: 'WMMBID', idoc: 'WMMBID02', dir: '1', partner: 'ERP_TO_EWM', desc: 'WM goods movement', vol: 2500, segs: 20 },
      { msg: 'HRMD_A', idoc: 'HRMD_A07', dir: '2', partner: 'SF_EC', desc: 'HR master data', vol: 100, segs: 80 },
      { msg: 'PORDCR', idoc: 'PORDCR05', dir: '2', partner: 'ARIBA_NETWORK', desc: 'PO creation', vol: 400, segs: 35 },
      { msg: 'SHPMNT', idoc: 'SHPMNT06', dir: '2', partner: 'ERP_TO_TM', desc: 'Shipment', vol: 300, segs: 25 },
      { msg: 'LOIPRO', idoc: 'LOIPRO01', dir: '1', partner: 'ERP_TO_MES', desc: 'Production order', vol: 500, segs: 30 },
      { msg: 'FIDCCP', idoc: 'FIDCCP01', dir: '2', partner: 'BANK_SFTP', desc: 'Payment file', vol: 60, segs: 15 },
      { msg: 'FINSTA', idoc: 'FINSTA01', dir: '1', partner: 'BANK_SFTP', desc: 'Bank statement', vol: 30, segs: 20 },
      { msg: 'ACC_DOCUMENT', idoc: 'ACC_DOCUMENT04', dir: '2', partner: 'ERP_TO_BW', desc: 'Accounting doc', vol: 5000, segs: 55 },
      { msg: 'DELVRY', idoc: 'DELVRY03', dir: '2', partner: 'ERP_TO_EWM', desc: 'Delivery', vol: 700, segs: 35 },
      { msg: 'WMTOCO', idoc: 'WMTOCO01', dir: '2', partner: 'ERP_TO_EWM', desc: 'WM transfer order', vol: 1800, segs: 18 },
      { msg: 'ARTMAS', idoc: 'ARTMAS09', dir: '2', partner: 'ERP_TO_APO', desc: 'Article master', vol: 160, segs: 70 },
      { msg: 'TRVREQ', idoc: 'TRVREQ01', dir: '2', partner: 'CONCUR_API', desc: 'Travel request', vol: 40, segs: 25 },
      { msg: 'DELFOR', idoc: 'DELFOR01', dir: '1', partner: 'EDI_PROVIDER', desc: 'Delivery forecast', vol: 220, segs: 28 },
      { msg: 'REMADV', idoc: 'REMADV01', dir: '1', partner: 'EDI_PROVIDER', desc: 'Remittance advice', vol: 80, segs: 22 },
      { msg: 'GSVERF', idoc: 'GSVERF02', dir: '2', partner: 'ERP_TO_GTS', desc: 'GTS compliance', vol: 120, segs: 30 },
      { msg: 'CIFMAT', idoc: 'CIFMAT01', dir: '2', partner: 'ERP_TO_APO', desc: 'CIF material', vol: 140, segs: 40 },
      { msg: 'GLMAST', idoc: 'GLMAST02', dir: '2', partner: 'ERP_TO_BW', desc: 'GL account master', vol: 30, segs: 15 },
    ];

    for (const f of flows) {
      const classification = this._classifyFlow(f.msg, f.idoc, f.partner);
      records.push({
        MESTYP: f.msg,
        IDOCTP: f.idoc,
        CIMTYP: '',
        DIRECT: f.dir,
        RCVPRN: f.dir === '2' ? f.partner : 'SELF',
        RCVPRT: 'LS',
        RCVPFC: '',
        SNDPRN: f.dir === '1' ? f.partner : 'SELF',
        SNDPRT: 'LS',
        PORT: `PORT_${f.partner}`,
        RFCDEST: f.partner,
        OUTMODE: f.dir === '2' ? '4' : '',
        PACKSZ: '50',
        QUEUEID: '',
        VOLUME: String(f.vol),
        DESCRIPTION: f.desc,
        STATUS: 'active',
        LASTRUN: '20240115',
        SEGNUM: String(f.segs),
        MESSION_APVER: '001',
        MIGSTRATEGY: classification.strategy,
        IMPACT: classification.impact,
        S4_REPLACEMENT: classification.replacement,
      });
    }

    return records; // 25 records
  }
}

module.exports = IDocConfigMigrationObject;
