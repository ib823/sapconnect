/**
 * Business Partner Migration Object
 *
 * Migrates Customer master (KNA1/KNB1/KNVV) and Vendor master (LFA1/LFB1)
 * into unified Business Partner (BUT000/BUT020/BUT050/BUT100).
 *
 * ~80 field mappings with role merge logic:
 * Entities with matching NAME1+ORT01 are merged into a single BP
 * with both FLCU01 (customer) and FLVN01 (vendor) roles.
 */

const BaseMigrationObject = require('./base-migration-object');

class BusinessPartnerMigrationObject extends BaseMigrationObject {
  get objectId() { return 'BUSINESS_PARTNER'; }
  get name() { return 'Business Partner'; }

  getFieldMappings() {
    return [
      // ── General data (25) ──────────────────────────────────
      { source: 'PARTNER', target: 'BusinessPartner', convert: 'padLeft10' },
      { source: 'TYPE', target: 'BusinessPartnerCategory', valueMap: { '1': '1', '2': '2', 'ORG': '2', 'PERSON': '1' }, default: '2' },
      { source: 'NAME1', target: 'BusinessPartnerFullName' },
      { source: 'NAME1', target: 'OrganizationBPName1' },
      { source: 'NAME2', target: 'OrganizationBPName2' },
      { source: 'NAME3', target: 'OrganizationBPName3' },
      { source: 'NAME4', target: 'OrganizationBPName4' },
      { source: 'SORTL', target: 'SearchTerm1', convert: 'toUpperCase' },
      { source: 'STCEG', target: 'TaxNumber1' },
      { source: 'STCD1', target: 'TaxNumber2' },
      { source: 'STCD2', target: 'TaxNumber3' },
      { source: 'STKZN', target: 'TaxNumberResponsible' },
      { source: 'BRSCH', target: 'IndustrySector' },
      { source: 'KTOKD', target: 'BusinessPartnerGrouping' },
      { source: 'LOEVM', target: 'IsMarkedForDeletion', convert: 'boolYN' },
      { source: 'SPERR', target: 'IsBlocked', convert: 'boolYN' },
      { source: 'SPRAS', target: 'Language', convert: 'toUpperCase' },
      { source: 'ERDAT', target: 'CreationDate', convert: 'toDate' },
      { source: 'ERNAM', target: 'CreatedByUser' },
      { source: 'AEDAT', target: 'LastChangeDate', convert: 'toDate' },
      { source: 'AENAM', target: 'LastChangedByUser' },
      { source: 'KONZS', target: 'GroupKey' },
      { source: 'KUNNR', target: 'Customer', convert: 'padLeft10' },
      { source: 'LIFNR', target: 'Supplier', convert: 'padLeft10' },
      { target: 'AuthorizationGroup', default: '' },

      // ── Address data (20) ─────────────────────────────────
      { source: 'STRAS', target: 'StreetName' },
      { source: 'HAUSNR', target: 'HouseNumber' },
      { source: 'PFACH', target: 'POBox' },
      { source: 'ORT01', target: 'CityName' },
      { source: 'ORT02', target: 'District' },
      { source: 'REGIO', target: 'Region' },
      { source: 'PSTLZ', target: 'PostalCode' },
      { source: 'LAND1', target: 'Country', convert: 'toUpperCase' },
      { source: 'TELF1', target: 'PhoneNumber' },
      { source: 'TELF2', target: 'PhoneNumber2' },
      { source: 'TELFX', target: 'FaxNumber' },
      { source: 'SMTP_ADDR', target: 'EmailAddress' },
      { source: 'ADRNR', target: 'AddressID' },
      { source: 'PSTL2', target: 'POBoxPostalCode' },
      { source: 'PFORT', target: 'POBoxCity' },
      { source: 'LANDX', target: 'CountryName' },
      { source: 'TIME_ZONE', target: 'TimeZone' },
      { source: 'TXJCD', target: 'TaxJurisdiction' },
      { source: 'TRANSPZONE', target: 'TransportZone' },
      { source: 'LOCCO', target: 'LocationCoordinate' },

      // ── Bank data (10) ────────────────────────────────────
      { source: 'BANKS', target: 'BankCountry', convert: 'toUpperCase' },
      { source: 'BANKL', target: 'BankNumber' },
      { source: 'BANKN', target: 'BankAccount' },
      { source: 'BKONT', target: 'BankControlKey' },
      { source: 'BKREF', target: 'BankReference' },
      { source: 'KOINH', target: 'BankAccountHolder' },
      { source: 'SWIFT', target: 'SWIFTCode' },
      { source: 'IBAN', target: 'IBANNumber' },
      { source: 'BVTYP', target: 'CollectionAuthority' },
      { source: 'XEZER', target: 'PaymentDefault', convert: 'boolYN' },

      // ── Customer role fields (15) ──────────────────────────
      { source: 'KUKLA', target: 'CustomerClassification' },
      { source: 'AKONT', target: 'ReconciliationAccount' },
      { source: 'ZUAWA', target: 'SortKey' },
      { source: 'FDGRV', target: 'PlanningGroup' },
      { source: 'ZTERM', target: 'PaymentTerms' },
      { source: 'TOGRU', target: 'ToleranceGroup' },
      { source: 'VKORG', target: 'SalesOrganization' },
      { source: 'VTWEG', target: 'DistributionChannel' },
      { source: 'SPART', target: 'Division' },
      { source: 'VKBUR', target: 'SalesOffice' },
      { source: 'VKGRP', target: 'SalesGroup' },
      { source: 'KDGRP', target: 'CustomerGroup' },
      { source: 'KVGR1', target: 'CustomerGrouping1' },
      { source: 'WAERS', target: 'Currency' },
      { source: 'KALKS', target: 'PricingProcedure' },

      // ── Vendor role fields (10) ────────────────────────────
      { source: 'EKORG', target: 'PurchasingOrganization' },
      { source: 'EKGRP', target: 'PurchasingGroup' },
      { source: 'WEBRE', target: 'GoodsReceiptBased', convert: 'boolYN' },
      { source: 'LEBRE', target: 'ServiceBasedInvoice', convert: 'boolYN' },
      { source: 'MWSKZ', target: 'TaxCode' },
      { source: 'REPRF', target: 'CheckDoubleInvoice', convert: 'boolYN' },
      { source: 'MINBW', target: 'MinimumOrderValue', convert: 'toDecimal' },
      { source: 'VERKF', target: 'ContactPerson' },
      { source: 'TELF1_V', target: 'VendorPhone' },
      { source: 'INCO1', target: 'Incoterms' },

      // ── Migration metadata ─────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'BUSINESS_PARTNER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['BusinessPartner', 'BusinessPartnerFullName', 'Country'],
      exactDuplicate: { keys: ['TaxNumber1'] },
      fuzzyDuplicate: { keys: ['BusinessPartnerFullName', 'StreetName'], threshold: 0.85 },
    };
  }

  /**
   * Override transform to add role merge post-processing
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
   * Match on BusinessPartnerFullName + CityName (both uppercased).
   */
  _mergeRoles(records) {
    const map = new Map();
    const merged = [];

    const hasValue = (v) => v != null && v !== '' && v !== '0000000000';

    for (const rec of records) {
      const key = `${(rec.BusinessPartnerFullName || '').toUpperCase()}|${(rec.CityName || '').toUpperCase()}`;
      if (map.has(key)) {
        const existing = map.get(key);
        // Merge: keep existing, add non-empty fields from duplicate
        for (const [k, v] of Object.entries(rec)) {
          if (k === '_roles') continue;
          if ((existing[k] == null || existing[k] === '' || existing[k] === '0000000000') && hasValue(v)) {
            existing[k] = v;
          }
        }
        if (hasValue(rec.Customer) && !existing._roles.includes('FLCU01')) existing._roles.push('FLCU01');
        if (hasValue(rec.Supplier) && !existing._roles.includes('FLVN01')) existing._roles.push('FLVN01');
      } else {
        rec._roles = [];
        if (hasValue(rec.Customer)) rec._roles.push('FLCU01');
        if (hasValue(rec.Supplier)) rec._roles.push('FLVN01');
        map.set(key, rec);
        merged.push(rec);
      }
    }

    return merged;
  }

  _extractMock() {
    const records = [];
    const cities = ['New York', 'Chicago', 'Los Angeles', 'Houston', 'Phoenix'];
    const countries = ['US', 'US', 'US', 'US', 'US'];

    // 50 customers
    for (let i = 1; i <= 50; i++) {
      const ci = (i - 1) % 5;
      records.push({
        PARTNER: String(100000 + i),
        TYPE: 'ORG',
        NAME1: `Customer Corp ${i}`,
        NAME2: '',
        NAME3: '',
        NAME4: '',
        SORTL: `CUST${String(i).padStart(3, '0')}`,
        STCEG: `US${String(100000000 + i)}`,
        STCD1: String(200000000 + i),
        STCD2: '',
        STKZN: '',
        BRSCH: 'MANU',
        KTOKD: 'D',
        LOEVM: '',
        SPERR: '',
        SPRAS: 'EN',
        ERDAT: '20200115',
        ERNAM: 'ADMIN',
        AEDAT: '20240101',
        AENAM: 'MIGRATION',
        KONZS: '',
        KUNNR: String(100000 + i),
        LIFNR: '',
        STRAS: `${100 + i} Main Street`,
        HAUSNR: '',
        PFACH: '',
        ORT01: cities[ci],
        ORT02: '',
        REGIO: 'NY',
        PSTLZ: `1${String(i).padStart(4, '0')}`,
        LAND1: countries[ci],
        TELF1: `212-555-${String(i).padStart(4, '0')}`,
        TELF2: '',
        TELFX: '',
        SMTP_ADDR: `contact${i}@customer${i}.com`,
        ADRNR: String(300000 + i),
        PSTL2: '',
        PFORT: '',
        LANDX: 'United States',
        TIME_ZONE: 'EST',
        TXJCD: '',
        TRANSPZONE: 'TZ01',
        LOCCO: '',
        BANKS: 'US',
        BANKL: '021000021',
        BANKN: String(400000000 + i),
        BKONT: '01',
        BKREF: '',
        KOINH: `Customer Corp ${i}`,
        SWIFT: 'CHASUS33',
        IBAN: '',
        BVTYP: '',
        XEZER: '',
        KUKLA: 'A',
        AKONT: '0000140000',
        ZUAWA: '001',
        FDGRV: 'A1',
        ZTERM: '0030',
        TOGRU: '0001',
        VKORG: '1000',
        VTWEG: '10',
        SPART: '00',
        VKBUR: '',
        VKGRP: '',
        KDGRP: '01',
        KVGR1: '',
        WAERS: 'USD',
        KALKS: '1',
        EKORG: '',
        EKGRP: '',
        WEBRE: '',
        LEBRE: '',
        MWSKZ: '',
        REPRF: '',
        MINBW: '',
        VERKF: '',
        TELF1_V: '',
        INCO1: '',
      });
    }

    // 30 vendors
    for (let i = 1; i <= 30; i++) {
      const ci = (i - 1) % 5;
      records.push({
        PARTNER: String(200000 + i),
        TYPE: 'ORG',
        NAME1: `Vendor Supplies ${i}`,
        NAME2: '',
        NAME3: '',
        NAME4: '',
        SORTL: `VEND${String(i).padStart(3, '0')}`,
        STCEG: `US${String(500000000 + i)}`,
        STCD1: String(600000000 + i),
        STCD2: '',
        STKZN: '',
        BRSCH: 'RETL',
        KTOKD: 'K',
        LOEVM: '',
        SPERR: '',
        SPRAS: 'EN',
        ERDAT: '20190601',
        ERNAM: 'ADMIN',
        AEDAT: '20240101',
        AENAM: 'MIGRATION',
        KONZS: '',
        KUNNR: '',
        LIFNR: String(200000 + i),
        STRAS: `${200 + i} Supply Ave`,
        HAUSNR: '',
        PFACH: '',
        ORT01: cities[ci],
        ORT02: '',
        REGIO: 'CA',
        PSTLZ: `9${String(i).padStart(4, '0')}`,
        LAND1: countries[ci],
        TELF1: `310-555-${String(i).padStart(4, '0')}`,
        TELF2: '',
        TELFX: '',
        SMTP_ADDR: `ap${i}@vendor${i}.com`,
        ADRNR: String(700000 + i),
        PSTL2: '',
        PFORT: '',
        LANDX: 'United States',
        TIME_ZONE: 'PST',
        TXJCD: '',
        TRANSPZONE: 'TZ02',
        LOCCO: '',
        BANKS: 'US',
        BANKL: '021000089',
        BANKN: String(800000000 + i),
        BKONT: '01',
        BKREF: '',
        KOINH: `Vendor Supplies ${i}`,
        SWIFT: 'CITIUS33',
        IBAN: '',
        BVTYP: '',
        XEZER: '',
        KUKLA: '',
        AKONT: '',
        ZUAWA: '',
        FDGRV: '',
        ZTERM: '',
        TOGRU: '',
        VKORG: '',
        VTWEG: '',
        SPART: '',
        VKBUR: '',
        VKGRP: '',
        KDGRP: '',
        KVGR1: '',
        WAERS: '',
        KALKS: '',
        EKORG: '1000',
        EKGRP: '001',
        WEBRE: 'X',
        LEBRE: '',
        MWSKZ: 'V1',
        REPRF: 'X',
        MINBW: '100.00',
        VERKF: `Contact Person ${i}`,
        TELF1_V: `310-555-${String(100 + i).padStart(4, '0')}`,
        INCO1: 'FOB',
      });
    }

    // 5 overlapping entities (same NAME1+ORT01 as customers 1-5, but as vendors)
    for (let i = 1; i <= 5; i++) {
      const ci = (i - 1) % 5;
      records.push({
        PARTNER: String(300000 + i),
        TYPE: 'ORG',
        NAME1: `Customer Corp ${i}`, // Same name as customer
        NAME2: '',
        NAME3: '',
        NAME4: '',
        SORTL: `BOTH${String(i).padStart(3, '0')}`,
        STCEG: `US${String(100000000 + i)}`, // Same tax ID
        STCD1: '',
        STCD2: '',
        STKZN: '',
        BRSCH: 'MANU',
        KTOKD: 'K',
        LOEVM: '',
        SPERR: '',
        SPRAS: 'EN',
        ERDAT: '20210301',
        ERNAM: 'ADMIN',
        AEDAT: '20240101',
        AENAM: 'MIGRATION',
        KONZS: '',
        KUNNR: '',
        LIFNR: String(300000 + i),
        STRAS: `${100 + i} Main Street`,
        HAUSNR: '',
        PFACH: '',
        ORT01: cities[ci], // Same city as customer
        ORT02: '',
        REGIO: 'NY',
        PSTLZ: `1${String(i).padStart(4, '0')}`,
        LAND1: 'US',
        TELF1: `212-555-${String(i).padStart(4, '0')}`,
        TELF2: '',
        TELFX: '',
        SMTP_ADDR: '',
        ADRNR: String(900000 + i),
        PSTL2: '',
        PFORT: '',
        LANDX: 'United States',
        TIME_ZONE: 'EST',
        TXJCD: '',
        TRANSPZONE: 'TZ01',
        LOCCO: '',
        BANKS: '',
        BANKL: '',
        BANKN: '',
        BKONT: '',
        BKREF: '',
        KOINH: '',
        SWIFT: '',
        IBAN: '',
        BVTYP: '',
        XEZER: '',
        KUKLA: '',
        AKONT: '',
        ZUAWA: '',
        FDGRV: '',
        ZTERM: '',
        TOGRU: '',
        VKORG: '',
        VTWEG: '',
        SPART: '',
        VKBUR: '',
        VKGRP: '',
        KDGRP: '',
        KVGR1: '',
        WAERS: '',
        KALKS: '',
        EKORG: '1000',
        EKGRP: '002',
        WEBRE: 'X',
        LEBRE: 'X',
        MWSKZ: 'V2',
        REPRF: '',
        MINBW: '500.00',
        VERKF: `Dual Contact ${i}`,
        TELF1_V: `212-555-${String(200 + i).padStart(4, '0')}`,
        INCO1: 'CIF',
      });
    }

    return records;
  }
}

module.exports = BusinessPartnerMigrationObject;
