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
 * Source List Migration Object
 *
 * Migrates Source List from ECC (EORD)
 * to S/4HANA Source of Supply management.
 *
 * ~25 field mappings covering material-plant-supplier assignments,
 * validity periods, purchasing organization, and agreement references.
 * Mock: 30 source list entries across 10 materials and 5 suppliers.
 */

const BaseMigrationObject = require('./base-migration-object');

class SourceListMigrationObject extends BaseMigrationObject {
  get objectId() { return 'SOURCE_LIST'; }
  get name() { return 'Source List'; }

  getFieldMappings() {
    return [
      // ── EORD - Source list fields (25) ────────────────────────
      { source: 'MATNR', target: 'Material', convert: 'padLeft40' },
      { source: 'WERKS', target: 'Plant' },
      { source: 'ZEESSION_ORD', target: 'SourceListRecord' },
      { source: 'VDATU', target: 'ValidFrom', convert: 'toDate' },
      { source: 'BDATU', target: 'ValidTo', convert: 'toDate' },
      { source: 'LIFNR', target: 'Supplier' },
      { source: 'EKORG', target: 'PurchasingOrganization' },
      { source: 'FESSION_LIFN', target: 'FixedSupplier', convert: 'boolYN' },
      { source: 'NOLIFN', target: 'BlockedSupplier', convert: 'boolYN' },
      { source: 'AUESSION_ART', target: 'SourceListUsage' },
      { source: 'EBELN', target: 'AgreementNumber' },
      { source: 'EBELP', target: 'AgreementItem' },
      { source: 'EKESSION_GRP', target: 'PurchasingGroup' },
      { source: 'WESSION_RKS', target: 'PlantLevel' },
      { source: 'MEINS', target: 'UnitOfMeasure' },
      { source: 'ESMNG', target: 'MRPRelevance' },
      { source: 'LOGSY', target: 'LogicalSystem' },
      { source: 'SOBSL', target: 'SpecialProcurementType' },
      { source: 'SESSION_BMOD', target: 'SourceListCategory' },
      { source: 'ERDAT', target: 'CreatedDate', convert: 'toDate' },
      { source: 'ERNAM', target: 'CreatedBy' },
      { source: 'AEDAT', target: 'ChangedDate', convert: 'toDate' },
      { source: 'AENAM', target: 'ChangedBy' },

      // ── Migration metadata ────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'SOURCE_LIST' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['Material', 'Plant', 'Supplier', 'ValidFrom'],
      exactDuplicate: { keys: ['Material', 'Plant', 'Supplier', 'ValidFrom'] },
    };
  }

  _extractMock() {
    const records = [];
    const materials = [
      'MAT00001', 'MAT00003', 'MAT00005', 'MAT00008', 'MAT00010',
      'MAT00012', 'MAT00015', 'MAT00018', 'MAT00020', 'MAT00025',
    ];
    const suppliers = ['0000200001', '0000200002', '0000200003', '0000200005', '0000200010'];
    const plants = ['1000', '2000'];
    const purchOrgs = ['1000', '2000'];
    const usages = ['1', '2', ''];
    const units = ['EA', 'KG', 'L', 'PC', 'M'];

    let recordNum = 0;

    for (let m = 0; m < materials.length; m++) {
      // Each material gets 3 source list entries (different suppliers/plants)
      const supplierCount = 3;
      for (let s = 0; s < supplierCount; s++) {
        recordNum++;
        const supplierIdx = (m + s) % suppliers.length;
        const plantIdx = s % plants.length;
        const startMonth = String(1 + (recordNum % 12)).padStart(2, '0');
        const hasAgreement = recordNum % 3 === 0;

        records.push({
          MATNR: materials[m],
          WERKS: plants[plantIdx],
          ZEESSION_ORD: String(recordNum).padStart(5, '0'),
          VDATU: `2024${startMonth}01`,
          BDATU: `2025${startMonth}01`,
          LIFNR: suppliers[supplierIdx],
          EKORG: purchOrgs[plantIdx],
          FESSION_LIFN: s === 0 ? 'X' : '',
          NOLIFN: '',
          AUESSION_ART: usages[recordNum % 3],
          EBELN: hasAgreement ? String(4600000000 + recordNum) : '',
          EBELP: hasAgreement ? String((s + 1) * 10).padStart(5, '0') : '',
          EKESSION_GRP: `00${1 + (m % 3)}`,
          WESSION_RKS: plants[plantIdx],
          MEINS: units[m % units.length],
          ESMNG: recordNum % 2 === 0 ? '1' : '2',
          LOGSY: '',
          SOBSL: '',
          SESSION_BMOD: '',
          ERDAT: `2023${String(1 + (m % 12)).padStart(2, '0')}15`,
          ERNAM: 'PURCHASER',
          AEDAT: `2024${startMonth}10`,
          AENAM: 'PURCHASER',
        });
      }
    }

    return records; // 10 materials × 3 entries = 30 records
  }
}

module.exports = SourceListMigrationObject;
