/**
 * Infor LN Business Partner Migration Object
 *
 * Migrates LN Business Partners (tccom100/tccom130) to SAP Business Partner
 * (BUT000/BUT020/ADRC/BUT021_FS/BUT0BK/KNVV).
 *
 * Key transforms:
 * - Dual role merge: entities with both customer and vendor roles
 *   are merged into a single BP with both FLCU01 and FLVN01 roles
 * - LN partner ID (bptid) maps to BUT000-PARTNER
 * - Bank data from LN banking details maps to BUT0BK
 * - Customer sales data from tccom130 maps to KNVV
 *
 * ~25 field mappings. Mock: 12 business partners.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforLNBusinessPartnerMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_LN_BUSINESS_PARTNER'; }
  get name() { return 'LN Business Partner to SAP BP'; }

  getFieldMappings() {
    return [
      // ── General data (BUT000) ────────────────────────────────
      { source: 'bptid', target: 'BUT000-PARTNER', convert: 'padLeft10' },
      { source: 'nama', target: 'BUT000-NAME_ORG1' },
      { source: 'nama2', target: 'BUT000-NAME_ORG2' },
      { source: 'bptype', target: 'BUT000-BU_TYPE', valueMap: {
        'C': '2', 'V': '2', 'CV': '2', 'P': '1',
      }, default: '2' },
      { source: 'bprl', target: 'BUT000-BU_GROUP' },
      { source: 'lnge', target: 'BUT000-BU_LANGU', convert: 'toUpperCase' },

      // ── Address data (BUT020/ADRC) ───────────────────────────
      { source: 'caession_dr', target: 'BUT020-ADDR_TYPE', default: '1' },
      { source: 'naession_st', target: 'ADRC-STREET' },
      { source: 'pstc', target: 'ADRC-POST_CODE1' },
      { source: 'dsca_city', target: 'ADRC-CITY1' },
      { source: 'cste', target: 'ADRC-REGION' },
      { source: 'ccur', target: 'ADRC-COUNTRY', convert: 'toUpperCase' },
      { source: 'phon', target: 'ADRC-TEL_NUMBER' },
      { source: 'fax', target: 'ADRC-FAX_NUMBER' },
      { source: 'emal', target: 'ADRC-SMTP_ADDR' },

      // ── Bank data (BUT0BK) ──────────────────────────────────
      { source: 'ln_bank', target: 'BUT0BK-BANKL' },
      { source: 'ln_bkac', target: 'BUT0BK-BANKN' },
      { source: 'ln_iban', target: 'BUT0BK-IBAN' },
      { source: 'ln_swift', target: 'BUT0BK-SWIFT' },

      // ── Customer sales data (KNVV) ──────────────────────────
      { source: 'cprj', target: 'KNVV-VKORG' },
      { source: 'cdis', target: 'KNVV-VTWEG', default: '10' },
      { source: 'cpay', target: 'KNVV-ZTERM' },
      { source: 'ccur', target: 'KNVV-WAERS' },
      { source: 'role', target: 'BP_ROLE' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_LN' },
      { target: 'MigrationObjectId', default: 'INFOR_LN_BUSINESS_PARTNER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['BUT000-PARTNER', 'BUT000-NAME_ORG1', 'ADRC-COUNTRY'],
      exactDuplicate: { keys: ['BUT000-PARTNER'] },
      fuzzyDuplicate: { keys: ['BUT000-NAME_ORG1', 'ADRC-CITY1'], threshold: 0.85 },
    };
  }

  /**
   * Override transform to add dual-role merge post-processing.
   * Entities with both customer and vendor records in LN are merged
   * into a single BP with roles FLCU01 and FLVN01.
   */
  transform(records) {
    const result = super.transform(records);
    result.records = this._mergeRoles(result.records);
    result.recordCount = result.records.length;
    result.mergedCount = records.length - result.records.length;
    return result;
  }

  /**
   * Merge customer and vendor records that represent the same entity.
   * Match on BUT000-NAME_ORG1 + ADRC-CITY1 (both uppercased).
   */
  _mergeRoles(records) {
    const map = new Map();
    const merged = [];

    const hasValue = (v) => v !== null && v !== undefined && v !== '' && v !== '0000000000';

    for (const rec of records) {
      const key = `${(rec['BUT000-NAME_ORG1'] || '').toUpperCase()}|${(rec['ADRC-CITY1'] || '').toUpperCase()}`;
      if (map.has(key)) {
        const existing = map.get(key);
        for (const [k, v] of Object.entries(rec)) {
          if (k === '_roles') continue;
          if ((existing[k] === null || existing[k] === undefined || existing[k] === '') && hasValue(v)) {
            existing[k] = v;
          }
        }
        if (rec.BP_ROLE === 'C' && !existing._roles.includes('FLCU01')) existing._roles.push('FLCU01');
        if (rec.BP_ROLE === 'V' && !existing._roles.includes('FLVN01')) existing._roles.push('FLVN01');
      } else {
        rec._roles = [];
        if (rec.BP_ROLE === 'C' || rec.BP_ROLE === 'CV') rec._roles.push('FLCU01');
        if (rec.BP_ROLE === 'V' || rec.BP_ROLE === 'CV') rec._roles.push('FLVN01');
        map.set(key, rec);
        merged.push(rec);
      }
    }

    return merged;
  }

  _extractMock() {
    const records = [
      // Customers
      { bptid: '100001', nama: 'Acme Manufacturing Co', nama2: '', bptype: 'C', bprl: 'CUST', lnge: 'EN', caession_dr: '1', naession_st: '100 Industrial Blvd', pstc: '60601', dsca_city: 'Chicago', cste: 'IL', ccur: 'US', phon: '312-555-0101', fax: '312-555-0102', emal: 'orders@acmemfg.com', ln_bank: '021000021', ln_bkac: '1234567890', ln_iban: '', ln_swift: 'CHASUS33', cprj: '1000', cdis: '10', cpay: 'N30', role: 'C' },
      { bptid: '100002', nama: 'Global Distribution Inc', nama2: '', bptype: 'C', bprl: 'CUST', lnge: 'EN', caession_dr: '1', naession_st: '250 Logistics Way', pstc: '90001', dsca_city: 'Los Angeles', cste: 'CA', ccur: 'US', phon: '310-555-0201', fax: '', emal: 'purchasing@globaldist.com', ln_bank: '021000089', ln_bkac: '2345678901', ln_iban: '', ln_swift: 'CITIUS33', cprj: '1000', cdis: '10', cpay: 'N45', role: 'C' },
      { bptid: '100003', nama: 'Nordic Electronics AB', nama2: 'Gothenburg Branch', bptype: 'C', bprl: 'CUST', lnge: 'EN', caession_dr: '1', naession_st: 'Kungsgatan 12', pstc: '41119', dsca_city: 'Gothenburg', cste: '', ccur: 'SE', phon: '+46-31-555-0301', fax: '', emal: 'info@nordicelec.se', ln_bank: 'NDEASESS', ln_bkac: '9876543210', ln_iban: 'SE3550000000054910000003', ln_swift: 'NDEASESS', cprj: '2000', cdis: '10', cpay: 'N60', role: 'C' },
      { bptid: '100004', nama: 'Precision Parts Ltd', nama2: '', bptype: 'C', bprl: 'CUST', lnge: 'EN', caession_dr: '1', naession_st: '45 Engineering Road', pstc: 'B1 1BB', dsca_city: 'Birmingham', cste: '', ccur: 'GB', phon: '+44-121-555-0401', fax: '', emal: 'orders@precisionparts.co.uk', ln_bank: 'BARCGB22', ln_bkac: '45678901', ln_iban: 'GB82WEST12345698765432', ln_swift: 'BARCGB22', cprj: '2000', cdis: '10', cpay: 'N30', role: 'C' },
      { bptid: '100005', nama: 'MexiParts SA de CV', nama2: '', bptype: 'C', bprl: 'CUST', lnge: 'EN', caession_dr: '1', naession_st: 'Av Reforma 500', pstc: '06600', dsca_city: 'Mexico City', cste: 'DF', ccur: 'MX', phon: '+52-55-555-0501', fax: '', emal: 'compras@mexiparts.mx', ln_bank: '', ln_bkac: '', ln_iban: '', ln_swift: '', cprj: '1000', cdis: '10', cpay: 'N30', role: 'C' },
      // Vendors
      { bptid: '200001', nama: 'Steel Supply Corp', nama2: '', bptype: 'V', bprl: 'VEND', lnge: 'EN', caession_dr: '1', naession_st: '800 Metal Drive', pstc: '15201', dsca_city: 'Pittsburgh', cste: 'PA', ccur: 'US', phon: '412-555-0601', fax: '412-555-0602', emal: 'sales@steelsupply.com', ln_bank: '021000021', ln_bkac: '3456789012', ln_iban: '', ln_swift: 'CHASUS33', cprj: '', cdis: '', cpay: 'N45', role: 'V' },
      { bptid: '200002', nama: 'ElectroParts GmbH', nama2: '', bptype: 'V', bprl: 'VEND', lnge: 'DE', caession_dr: '1', naession_st: 'Industriestr. 42', pstc: '70174', dsca_city: 'Stuttgart', cste: 'BW', ccur: 'DE', phon: '+49-711-555-0701', fax: '', emal: 'vertrieb@electroparts.de', ln_bank: 'COBADEFF', ln_bkac: '7890123456', ln_iban: 'DE89370400440532013000', ln_swift: 'COBADEFF', cprj: '', cdis: '', cpay: 'N60', role: 'V' },
      { bptid: '200003', nama: 'Chemical Solutions Inc', nama2: '', bptype: 'V', bprl: 'VEND', lnge: 'EN', caession_dr: '1', naession_st: '500 Polymer Blvd', pstc: '77001', dsca_city: 'Houston', cste: 'TX', ccur: 'US', phon: '713-555-0801', fax: '', emal: 'orders@chemsolutions.com', ln_bank: '021000021', ln_bkac: '4567890123', ln_iban: '', ln_swift: 'CHASUS33', cprj: '', cdis: '', cpay: 'N30', role: 'V' },
      { bptid: '200004', nama: 'Japan Bearings Co Ltd', nama2: '', bptype: 'V', bprl: 'VEND', lnge: 'EN', caession_dr: '1', naession_st: '2-1 Marunouchi', pstc: '100-0005', dsca_city: 'Tokyo', cste: '', ccur: 'JP', phon: '+81-3-555-0901', fax: '', emal: 'export@jpbearings.co.jp', ln_bank: 'BOTKJPJT', ln_bkac: '5678901234', ln_iban: '', ln_swift: 'BOTKJPJT', cprj: '', cdis: '', cpay: 'N90', role: 'V' },
      // Dual role (customer + vendor) — same name/city as customer 100001
      { bptid: '300001', nama: 'Acme Manufacturing Co', nama2: 'Vendor Division', bptype: 'V', bprl: 'VEND', lnge: 'EN', caession_dr: '1', naession_st: '100 Industrial Blvd', pstc: '60601', dsca_city: 'Chicago', cste: 'IL', ccur: 'US', phon: '312-555-0103', fax: '', emal: 'ap@acmemfg.com', ln_bank: '021000021', ln_bkac: '6789012345', ln_iban: '', ln_swift: 'CHASUS33', cprj: '', cdis: '', cpay: 'N30', role: 'V' },
      // Dual role — same name/city as customer 100002
      { bptid: '300002', nama: 'Global Distribution Inc', nama2: 'Returns Dept', bptype: 'V', bprl: 'VEND', lnge: 'EN', caession_dr: '1', naession_st: '250 Logistics Way', pstc: '90001', dsca_city: 'Los Angeles', cste: 'CA', ccur: 'US', phon: '310-555-0203', fax: '', emal: 'returns@globaldist.com', ln_bank: '021000089', ln_bkac: '7890123456', ln_iban: '', ln_swift: 'CITIUS33', cprj: '', cdis: '', cpay: 'N30', role: 'V' },
      // Additional customer
      { bptid: '100006', nama: 'TechBuild Solutions', nama2: '', bptype: 'C', bprl: 'CUST', lnge: 'EN', caession_dr: '1', naession_st: '900 Innovation Park', pstc: '94025', dsca_city: 'Menlo Park', cste: 'CA', ccur: 'US', phon: '650-555-1001', fax: '', emal: 'procurement@techbuild.com', ln_bank: '021000021', ln_bkac: '8901234567', ln_iban: '', ln_swift: 'CHASUS33', cprj: '1000', cdis: '10', cpay: 'N30', role: 'C' },
    ];

    return records;
  }
}

module.exports = InforLNBusinessPartnerMigrationObject;
