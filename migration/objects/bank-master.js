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
 * Bank Master Migration Object
 *
 * Migrates Bank Master Data from ECC (BNKA/TIBAN)
 * to S/4HANA Bank directory and IBAN registry.
 *
 * ~30 field mappings: 12 BNKA (bank directory) + 10 TIBAN (IBAN/account) + 6 house bank + 2 metadata.
 * Mock: 20 banks across 3 countries (US, DE, GB) with SWIFT codes and IBANs.
 */

const BaseMigrationObject = require('./base-migration-object');

class BankMasterMigrationObject extends BaseMigrationObject {
  get objectId() { return 'BANK_MASTER'; }
  get name() { return 'Bank Master'; }

  getFieldMappings() {
    return [
      // ── BNKA - Bank directory (12) ──────────────────────────
      { source: 'BANKS', target: 'BankCountry', convert: 'toUpperCase' },
      { source: 'BANKL', target: 'BankNumber' },
      { source: 'BANKA', target: 'BankName' },
      { source: 'PROVZ', target: 'BankBranch' },
      { source: 'STRAS', target: 'BankStreet' },
      { source: 'ORT01', target: 'BankCity' },
      { source: 'SWIFT', target: 'SWIFTCode' },
      { source: 'BNKLZ', target: 'BankSortCode' },
      { source: 'LOEVM', target: 'IsMarkedForDeletion', convert: 'boolYN' },
      { source: 'BRNCH', target: 'BankBranchName' },
      { source: 'BGESSION_LD', target: 'BankGroup' },
      { source: 'XPGRO', target: 'PostBankCurrentAccount', convert: 'boolYN' },

      // ── TIBAN - IBAN/account data (10) ──────────────────────
      { source: 'BANKN', target: 'BankAccountNumber' },
      { source: 'IBAN', target: 'IBANNumber' },
      { source: 'BKREF', target: 'BankReference' },
      { source: 'VALID_FROM', target: 'ValidFrom', convert: 'toDate' },
      { source: 'BKONT', target: 'BankControlKey' },
      { source: 'KOINH', target: 'AccountHolderName' },
      { source: 'KOVON', target: 'BankValidFrom', convert: 'toDate' },
      { source: 'KOBIS', target: 'BankValidTo', convert: 'toDate' },
      { source: 'XEZER', target: 'IsMainBankAccount', convert: 'boolYN' },
      { source: 'BKEXT', target: 'ExternalBankID' },

      // ── House bank assignment (6) ───────────────────────────
      { source: 'BUKRS', target: 'CompanyCode' },
      { source: 'HBKID', target: 'HouseBank' },
      { source: 'HKTID', target: 'HouseBankAccount' },
      { source: 'WAESSION_RS', target: 'BankAccountCurrency' },
      { source: 'ZLSCH', target: 'PaymentMethod' },
      { source: 'BANKN_HB', target: 'HouseBankAccountNumber' },

      // ── Migration metadata ──────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'BANK_MASTER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['BankCountry', 'BankNumber', 'BankName'],
      exactDuplicate: { keys: ['BankCountry', 'BankNumber'] },
    };
  }

  _extractMock() {
    const records = [];

    const bankData = {
      US: {
        banks: [
          { name: 'JPMorgan Chase Bank', swift: 'CHASUS33', sort: '021000021', city: 'New York', street: '383 Madison Ave', branch: 'Main Branch' },
          { name: 'Bank of America', swift: 'BOFAUS3N', sort: '026009593', city: 'Charlotte', street: '100 N Tryon St', branch: 'Corporate HQ' },
          { name: 'Wells Fargo Bank', swift: 'WFBIUS6S', sort: '121000248', city: 'San Francisco', street: '420 Montgomery St', branch: 'West Coast Main' },
          { name: 'Citibank', swift: 'CITIUS33', sort: '021000089', city: 'New York', street: '388 Greenwich St', branch: 'Manhattan Branch' },
          { name: 'US Bank', swift: 'USBKUS44', sort: '091000022', city: 'Minneapolis', street: '800 Nicollet Mall', branch: 'Midwest HQ' },
          { name: 'PNC Bank', swift: 'PNCCUS33', sort: '043000096', city: 'Pittsburgh', street: '300 Fifth Ave', branch: 'Main Office' },
          { name: 'Capital One', swift: 'HIBKUS33', sort: '051405515', city: 'McLean', street: '1680 Capital One Dr', branch: 'VA Branch' },
          { name: 'TD Bank', swift: 'TDOMUS33', sort: '031101266', city: 'Cherry Hill', street: '1701 Route 70 E', branch: 'NJ Branch' },
        ],
        ibanPrefix: 'US',
      },
      DE: {
        banks: [
          { name: 'Deutsche Bank', swift: 'DEUTDEFF', sort: '50070010', city: 'Frankfurt', street: 'Taunusanlage 12', branch: 'Hauptfiliale' },
          { name: 'Commerzbank', swift: 'COBADEFF', sort: '50040000', city: 'Frankfurt', street: 'Kaiserplatz 16', branch: 'Zentrale' },
          { name: 'DZ Bank', swift: 'GENODEFF', sort: '50060400', city: 'Frankfurt', street: 'Platz der Republik', branch: 'Hauptsitz' },
          { name: 'KfW Bankengruppe', swift: 'KFWIDEFF', sort: '50020400', city: 'Frankfurt', street: 'Palmengartenstr 5', branch: 'Foerderkredite' },
          { name: 'Sparkasse Frankfurt', swift: 'HELADEF1822', sort: '50050201', city: 'Frankfurt', street: 'Neue Mainzer Str 49', branch: 'Innenstadt' },
          { name: 'HypoVereinsbank', swift: 'HYVEDEMM', sort: '70020270', city: 'Munich', street: 'Kardinal-Faulhaber-Str 1', branch: 'Muenchen Filiale' },
        ],
        ibanPrefix: 'DE',
      },
      GB: {
        banks: [
          { name: 'HSBC UK', swift: 'HBUKGB4B', sort: '400515', city: 'London', street: '8 Canada Square', branch: 'Canary Wharf' },
          { name: 'Barclays Bank', swift: 'BARCGB22', sort: '203301', city: 'London', street: '1 Churchill Place', branch: 'City of London' },
          { name: 'Lloyds Banking Group', swift: 'LOYDGB2L', sort: '309634', city: 'London', street: '25 Gresham St', branch: 'Head Office' },
          { name: 'NatWest', swift: 'NWBKGB2L', sort: '600000', city: 'London', street: '250 Bishopsgate', branch: 'City Branch' },
          { name: 'Standard Chartered', swift: 'SCBLGB2L', sort: '609242', city: 'London', street: '1 Basinghall Ave', branch: 'EC2 Branch' },
          { name: 'Santander UK', swift: 'ABBYGB2L', sort: '090128', city: 'London', street: '2 Triton Square', branch: 'Regent Place' },
        ],
        ibanPrefix: 'GB',
      },
    };

    let idx = 0;
    const countries = ['US', 'DE', 'GB'];

    for (const country of countries) {
      const { banks, ibanPrefix } = bankData[country];
      for (let b = 0; b < banks.length; b++) {
        idx++;
        const bank = banks[b];
        const acctNum = String(1000000000 + idx * 1234567).slice(0, 10);
        const ibanSuffix = String(idx).padStart(18, '0');
        const isMainBank = b === 0 ? 'X' : '';
        const companyCode = country === 'US' ? '1000' : country === 'DE' ? '2000' : '3000';

        records.push({
          BANKS: country,
          BANKL: bank.sort,
          BANKA: bank.name,
          PROVZ: bank.branch,
          STRAS: bank.street,
          ORT01: bank.city,
          SWIFT: bank.swift,
          BNKLZ: bank.sort,
          LOEVM: '',
          BRNCH: bank.branch,
          BGESSION_LD: '',
          XPGRO: '',
          BANKN: acctNum,
          IBAN: `${ibanPrefix}${String(89 + idx).slice(0, 2)}${bank.sort}${acctNum}`.slice(0, country === 'DE' ? 22 : country === 'GB' ? 22 : 17),
          BKREF: `REF-${String(idx).padStart(6, '0')}`,
          VALID_FROM: '20200101',
          BKONT: country === 'DE' ? '00' : '01',
          KOINH: bank.name,
          KOVON: '20200101',
          KOBIS: '99991231',
          XEZER: isMainBank,
          BKEXT: '',
          BUKRS: companyCode,
          HBKID: `HB${String(idx).padStart(2, '0')}`,
          HKTID: `HA${String(idx).padStart(2, '0')}`,
          WAESSION_RS: country === 'US' ? 'USD' : country === 'DE' ? 'EUR' : 'GBP',
          ZLSCH: country === 'US' ? 'T' : country === 'DE' ? 'U' : 'B',
          BANKN_HB: acctNum,
        });
      }
    }

    return records; // 8 + 6 + 6 = 20 bank records
  }
}

module.exports = BankMasterMigrationObject;
