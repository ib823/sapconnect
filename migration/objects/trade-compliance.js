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
 * Trade Compliance Migration Object
 *
 * Migrates GTS compliance master data: sanctioned party lists,
 * export control classifications, customs tariff codes, and
 * license management data for S/4HANA integration.
 *
 * ~35 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class TradeComplianceMigrationObject extends BaseMigrationObject {
  get objectId() { return 'TRADE_COMPLIANCE'; }
  get name() { return 'Trade Compliance'; }

  getFieldMappings() {
    return [
      // Core identification
      { source: 'COMPL_ID', target: 'ComplianceId' },
      { source: 'COMPL_TYPE', target: 'ComplianceType' },
      { source: 'DESCRIPTION', target: 'Description' },
      // Partner data
      { source: 'PARTNER', target: 'BusinessPartner' },
      { source: 'PARTNER_NAME', target: 'PartnerName' },
      { source: 'COUNTRY', target: 'Country', convert: 'toUpperCase' },
      { source: 'REGION', target: 'Region' },
      // Screening
      { source: 'SPL_STATUS', target: 'ScreeningStatus' },
      { source: 'SPL_LIST', target: 'SanctionsList' },
      { source: 'SPL_MATCH_SCORE', target: 'MatchScore', convert: 'toDecimal' },
      { source: 'LAST_SCREENED', target: 'LastScreenedDate', convert: 'toDate' },
      // Export control
      { source: 'ECCN', target: 'ExportControlClass' },
      { source: 'ECCN_DESC', target: 'ECCNDescription' },
      { source: 'AL_CODE', target: 'AuthorizationListCode' },
      { source: 'DEST_COUNTRY', target: 'DestinationCountry', convert: 'toUpperCase' },
      { source: 'LICENSE_REQ', target: 'LicenseRequired', convert: 'boolYN' },
      // Customs
      { source: 'HS_CODE', target: 'HSCode' },
      { source: 'HS_DESC', target: 'HSCodeDescription' },
      { source: 'TARIFF_RATE', target: 'TariffRate', convert: 'toDecimal' },
      { source: 'ORIGIN_COUNTRY', target: 'CountryOfOrigin', convert: 'toUpperCase' },
      { source: 'PREF_ELIGIBLE', target: 'PreferenceEligible', convert: 'boolYN' },
      { source: 'FTA_CODE', target: 'FreeTradeAgreement' },
      // License management
      { source: 'LICENSE_NO', target: 'LicenseNumber' },
      { source: 'LICENSE_TYPE', target: 'LicenseType' },
      { source: 'LICENSE_QTY', target: 'LicensedQuantity', convert: 'toDecimal' },
      { source: 'LICENSE_USED', target: 'UsedQuantity', convert: 'toDecimal' },
      { source: 'LICENSE_UNIT', target: 'QuantityUnit' },
      { source: 'LICENSE_VALID', target: 'LicenseValidTo', convert: 'toDate' },
      // Product reference
      { source: 'MATNR', target: 'Product', convert: 'padLeft40' },
      { source: 'MATNR_DESC', target: 'ProductDescription' },
      // Status
      { source: 'STATUS', target: 'RecordStatus' },
      { source: 'VALID_FROM', target: 'ValidFrom', convert: 'toDate' },
      { source: 'VALID_TO', target: 'ValidTo', convert: 'toDate' },
      // Metadata
      { target: 'SourceSystem', default: 'GTS' },
      { target: 'MigrationObjectId', default: 'TRADE_COMPLIANCE' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['ComplianceId', 'ComplianceType', 'Description'],
      exactDuplicate: { keys: ['ComplianceId'] },
    };
  }

  _extractMock() {
    const records = [];
    let id = 0;

    // Sanctioned party screening records
    const splEntries = [
      { partner: 'BP001', name: 'Acme Global', country: 'US', status: 'CLEAR', score: '0' },
      { partner: 'BP002', name: 'EuroTrade GmbH', country: 'DE', status: 'CLEAR', score: '0' },
      { partner: 'BP003', name: 'Asia Pacific Ltd', country: 'SG', status: 'REVIEW', score: '72' },
      { partner: 'BP004', name: 'Blocked Entity LLC', country: 'IR', status: 'BLOCKED', score: '98' },
      { partner: 'BP005', name: 'CaribTrade Inc', country: 'CU', status: 'BLOCKED', score: '95' },
    ];

    for (const e of splEntries) {
      id++;
      records.push(this._complianceRecord('SPL_SCREENING', `SPL${String(id).padStart(4, '0')}`,
        `SPL Check: ${e.name}`, {
          PARTNER: e.partner, PARTNER_NAME: e.name, COUNTRY: e.country,
          SPL_STATUS: e.status, SPL_LIST: 'SDN', SPL_MATCH_SCORE: e.score,
          LAST_SCREENED: '20240601',
        }));
    }

    // Export control classifications
    const eccnEntries = [
      { eccn: 'EAR99', desc: 'No license required', dest: 'DE', req: '' },
      { eccn: '3A001', desc: 'Electronics', dest: 'CN', req: 'X' },
      { eccn: '5A002', desc: 'Encryption', dest: 'RU', req: 'X' },
      { eccn: '1C350', desc: 'Chemicals', dest: 'IN', req: '' },
      { eccn: '9A004', desc: 'Propulsion', dest: 'KR', req: '' },
    ];

    for (const e of eccnEntries) {
      id++;
      records.push(this._complianceRecord('EXPORT_CONTROL', `EXP${String(id).padStart(4, '0')}`,
        `Export: ${e.eccn} - ${e.desc}`, {
          ECCN: e.eccn, ECCN_DESC: e.desc, AL_CODE: 'CCL',
          DEST_COUNTRY: e.dest, LICENSE_REQ: e.req,
          MATNR: `MAT${String(id).padStart(4, '0')}`, MATNR_DESC: e.desc,
        }));
    }

    // Customs tariff codes
    const hsEntries = [
      { hs: '8471.30.01', desc: 'Laptops', rate: '0', origin: 'CN', pref: '', fta: '' },
      { hs: '8703.23.00', desc: 'Automobiles', rate: '2.5', origin: 'DE', pref: 'X', fta: 'EU-FTA' },
      { hs: '3004.90.92', desc: 'Pharmaceuticals', rate: '0', origin: 'IN', pref: '', fta: '' },
      { hs: '6110.20.20', desc: 'Cotton Sweaters', rate: '16.5', origin: 'BD', pref: 'X', fta: 'GSP' },
      { hs: '2204.21.50', desc: 'Wine', rate: '6.3', origin: 'FR', pref: 'X', fta: 'EU-FTA' },
      { hs: '0901.11.00', desc: 'Coffee beans', rate: '0', origin: 'BR', pref: '', fta: '' },
      { hs: '7108.12.10', desc: 'Gold', rate: '0', origin: 'ZA', pref: '', fta: '' },
      { hs: '8517.12.00', desc: 'Smartphones', rate: '0', origin: 'KR', pref: 'X', fta: 'KORUS' },
    ];

    for (const e of hsEntries) {
      id++;
      records.push(this._complianceRecord('CUSTOMS_TARIFF', `TAR${String(id).padStart(4, '0')}`,
        `HS ${e.hs}: ${e.desc}`, {
          HS_CODE: e.hs, HS_DESC: e.desc, TARIFF_RATE: e.rate,
          ORIGIN_COUNTRY: e.origin, PREF_ELIGIBLE: e.pref, FTA_CODE: e.fta,
          MATNR: `MAT${String(id).padStart(4, '0')}`, MATNR_DESC: e.desc,
        }));
    }

    // Trade licenses
    const licEntries = [
      { type: 'GENERAL', no: 'LIC-GEN-001', qty: '999999', used: '50000', unit: 'EA', valid: '20251231' },
      { type: 'INDIVIDUAL', no: 'LIC-IND-001', qty: '1000', used: '750', unit: 'KG', valid: '20240930' },
      { type: 'INDIVIDUAL', no: 'LIC-IND-002', qty: '500', used: '100', unit: 'EA', valid: '20250630' },
      { type: 'GENERAL', no: 'LIC-GEN-002', qty: '999999', used: '120000', unit: 'EA', valid: '20261231' },
    ];

    for (const e of licEntries) {
      id++;
      records.push(this._complianceRecord('TRADE_LICENSE', `LIC${String(id).padStart(4, '0')}`,
        `License ${e.no}`, {
          LICENSE_NO: e.no, LICENSE_TYPE: e.type,
          LICENSE_QTY: e.qty, LICENSE_USED: e.used,
          LICENSE_UNIT: e.unit, LICENSE_VALID: e.valid,
        }));
    }

    return records; // 5 + 5 + 8 + 4 = 22
  }

  _complianceRecord(type, id, desc, extra = {}) {
    return {
      COMPL_ID: id,
      COMPL_TYPE: type,
      DESCRIPTION: desc,
      PARTNER: '', PARTNER_NAME: '', COUNTRY: '', REGION: '',
      SPL_STATUS: '', SPL_LIST: '', SPL_MATCH_SCORE: '', LAST_SCREENED: '',
      ECCN: '', ECCN_DESC: '', AL_CODE: '', DEST_COUNTRY: '',
      LICENSE_REQ: '',
      HS_CODE: '', HS_DESC: '', TARIFF_RATE: '', ORIGIN_COUNTRY: '',
      PREF_ELIGIBLE: '', FTA_CODE: '',
      LICENSE_NO: '', LICENSE_TYPE: '', LICENSE_QTY: '', LICENSE_USED: '',
      LICENSE_UNIT: '', LICENSE_VALID: '',
      MATNR: '', MATNR_DESC: '',
      STATUS: 'ACTIVE', VALID_FROM: '20200101', VALID_TO: '99991231',
      ...extra,
    };
  }
}

module.exports = TradeComplianceMigrationObject;
