/**
 * Tests for BDC Screen Sequence Definitions
 *
 * Validates all 55 screen sequences across 6 SAP modules:
 *   ES (7), FI (15), CO (8), MM (10), SD (10), S4 (5)
 */

const { SCREEN_SEQUENCES } = require('../../../lib/greenfield/bdc-sequences');

// ─────────────────────────────────────────────────────────────────────
// Helper: collect all field keys from a sequence
// ─────────────────────────────────────────────────────────────────────
function allFieldKeys(seq) {
  const keys = [];
  for (const screen of seq.screens) {
    keys.push(...Object.keys(screen.fields));
  }
  return keys;
}

// ═══════════════════════════════════════════════════════════════════
// Structure Validation
// ═══════════════════════════════════════════════════════════════════

describe('BDC Screen Sequences — Structure Validation', () => {
  const entries = Object.entries(SCREEN_SEQUENCES);

  it('should export SCREEN_SEQUENCES as a non-empty object', () => {
    expect(SCREEN_SEQUENCES).toBeDefined();
    expect(typeof SCREEN_SEQUENCES).toBe('object');
    expect(entries.length).toBeGreaterThan(0);
  });

  it('should contain exactly 55 sequences', () => {
    expect(entries.length).toBe(55);
  });

  it('should have a transaction code for every sequence', () => {
    for (const [key, seq] of entries) {
      expect(seq.transaction).toBeDefined();
      expect(typeof seq.transaction).toBe('string');
      expect(seq.transaction.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should have a description for every sequence', () => {
    for (const [key, seq] of entries) {
      expect(seq.description).toBeDefined();
      expect(typeof seq.description).toBe('string');
      expect(seq.description.length).toBeGreaterThan(0);
    }
  });

  it('should have a table property for every sequence', () => {
    for (const [key, seq] of entries) {
      expect(seq.table).toBeDefined();
      expect(typeof seq.table).toBe('string');
      expect(seq.table.length).toBeGreaterThan(0);
    }
  });

  it('should have a module property for every sequence', () => {
    const validModules = ['ES', 'FI', 'CO', 'MM', 'SD', 'S4'];
    for (const [key, seq] of entries) {
      expect(seq.module).toBeDefined();
      expect(validModules).toContain(seq.module);
    }
  });

  it('should have a non-empty screens array for every sequence', () => {
    for (const [key, seq] of entries) {
      expect(Array.isArray(seq.screens)).toBe(true);
      expect(seq.screens.length).toBeGreaterThan(0);
    }
  });

  it('should have program and dynpro for every screen', () => {
    for (const [key, seq] of entries) {
      for (const screen of seq.screens) {
        expect(screen.program).toBeDefined();
        expect(typeof screen.program).toBe('string');
        expect(screen.program.length).toBeGreaterThan(0);
        expect(screen.dynpro).toBeDefined();
        expect(typeof screen.dynpro).toBe('string');
        expect(screen.dynpro.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have fields object for every screen', () => {
    for (const [key, seq] of entries) {
      for (const screen of seq.screens) {
        expect(screen.fields).toBeDefined();
        expect(typeof screen.fields).toBe('object');
      }
    }
  });

  it('should have action with fnam and fval for every screen', () => {
    for (const [key, seq] of entries) {
      for (const screen of seq.screens) {
        expect(screen.action).toBeDefined();
        expect(screen.action.fnam).toBeDefined();
        expect(screen.action.fval).toBeDefined();
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// Coverage & Uniqueness
// ═══════════════════════════════════════════════════════════════════

describe('BDC Screen Sequences — Coverage & Uniqueness', () => {
  it('should have exactly 55 total sequences', () => {
    expect(Object.keys(SCREEN_SEQUENCES).length).toBe(55);
  });

  it('should have all unique sequence keys', () => {
    const keys = Object.keys(SCREEN_SEQUENCES);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('should have unique transaction codes for non-SM30 sequences', () => {
    const nonSm30Transactions = [];
    for (const [key, seq] of Object.entries(SCREEN_SEQUENCES)) {
      if (seq.transaction !== 'SM30') {
        nonSm30Transactions.push(seq.transaction);
      }
    }
    const unique = new Set(nonSm30Transactions);
    expect(unique.size).toBe(nonSm30Transactions.length);
  });

  it('should have all 6 modules represented', () => {
    const modules = new Set();
    for (const seq of Object.values(SCREEN_SEQUENCES)) {
      modules.add(seq.module);
    }
    expect(modules.has('ES')).toBe(true);
    expect(modules.has('FI')).toBe(true);
    expect(modules.has('CO')).toBe(true);
    expect(modules.has('MM')).toBe(true);
    expect(modules.has('SD')).toBe(true);
    expect(modules.has('S4')).toBe(true);
    expect(modules.size).toBe(6);
  });

  it('should have correct counts per module', () => {
    const counts = { ES: 0, FI: 0, CO: 0, MM: 0, SD: 0, S4: 0 };
    for (const seq of Object.values(SCREEN_SEQUENCES)) {
      counts[seq.module]++;
    }
    expect(counts.ES).toBe(7);
    expect(counts.FI).toBe(15);
    expect(counts.CO).toBe(8);
    expect(counts.MM).toBe(10);
    expect(counts.SD).toBe(10);
    expect(counts.S4).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Enterprise Structure (ES) — 7 sequences
// ═══════════════════════════════════════════════════════════════════

describe('BDC Screen Sequences — Enterprise Structure', () => {
  it('company_code should use OX02 and have BUKRS field', () => {
    const seq = SCREEN_SEQUENCES.company_code;
    expect(seq.transaction).toBe('OX02');
    expect(seq.table).toBe('T001');
    expect(seq.module).toBe('ES');
    expect(allFieldKeys(seq)).toContain('BUKRS');
    expect(allFieldKeys(seq)).toContain('BUTXT');
  });

  it('plant should use OX10 and have WERKS field', () => {
    const seq = SCREEN_SEQUENCES.plant;
    expect(seq.transaction).toBe('OX10');
    expect(seq.table).toBe('T001W');
    expect(seq.module).toBe('ES');
    expect(allFieldKeys(seq)).toContain('WERKS');
    expect(allFieldKeys(seq)).toContain('NAME1');
  });

  it('sales_org should use OVXD and have VKORG field', () => {
    const seq = SCREEN_SEQUENCES.sales_org;
    expect(seq.transaction).toBe('OVXD');
    expect(seq.table).toBe('TVKO');
    expect(seq.module).toBe('ES');
    expect(allFieldKeys(seq)).toContain('VKORG');
    expect(allFieldKeys(seq)).toContain('VTEXT');
  });

  it('purchasing_org should use OX08 and have EKORG field', () => {
    const seq = SCREEN_SEQUENCES.purchasing_org;
    expect(seq.transaction).toBe('OX08');
    expect(seq.table).toBe('T024E');
    expect(seq.module).toBe('ES');
    expect(allFieldKeys(seq)).toContain('EKORG');
    expect(allFieldKeys(seq)).toContain('EKOTX');
  });

  it('controlling_area should use OKKP and have KOKRS field', () => {
    const seq = SCREEN_SEQUENCES.controlling_area;
    expect(seq.transaction).toBe('OKKP');
    expect(seq.table).toBe('TKA01');
    expect(seq.module).toBe('ES');
    expect(allFieldKeys(seq)).toContain('KOKRS');
    expect(allFieldKeys(seq)).toContain('BEZEI');
  });

  it('storage_location should use OX09 and have LGORT field', () => {
    const seq = SCREEN_SEQUENCES.storage_location;
    expect(seq.transaction).toBe('OX09');
    expect(seq.table).toBe('T001L');
    expect(seq.module).toBe('ES');
    expect(allFieldKeys(seq)).toContain('WERKS');
    expect(allFieldKeys(seq)).toContain('LGORT');
    expect(allFieldKeys(seq)).toContain('LGOBE');
  });

  it('shipping_point should use OVXC and have VSTEL field', () => {
    const seq = SCREEN_SEQUENCES.shipping_point;
    expect(seq.transaction).toBe('OVXC');
    expect(seq.table).toBe('TVST');
    expect(seq.module).toBe('ES');
    expect(allFieldKeys(seq)).toContain('VSTEL');
    expect(allFieldKeys(seq)).toContain('VTEXT');
  });
});

// ═══════════════════════════════════════════════════════════════════
// FI — Financial Accounting — 15 sequences
// ═══════════════════════════════════════════════════════════════════

describe('BDC Screen Sequences — FI Financial Accounting', () => {
  it('fiscal_year_variant should use OB29 with PERIV field', () => {
    const seq = SCREEN_SEQUENCES.fiscal_year_variant;
    expect(seq.transaction).toBe('OB29');
    expect(seq.table).toBe('T009/T009B');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('PERIV');
    expect(allFieldKeys(seq)).toContain('XJMON');
  });

  it('posting_period should use OB52 with BUKRS and GJAHR fields', () => {
    const seq = SCREEN_SEQUENCES.posting_period;
    expect(seq.transaction).toBe('OB52');
    expect(seq.table).toBe('T001B');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('BUKRS');
    expect(allFieldKeys(seq)).toContain('GJAHR');
  });

  it('document_type_fi should use OBA7 with BLART and NUMKR fields', () => {
    const seq = SCREEN_SEQUENCES.document_type_fi;
    expect(seq.transaction).toBe('OBA7');
    expect(seq.table).toBe('T003');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('BLART');
    expect(allFieldKeys(seq)).toContain('NUMKR');
    expect(allFieldKeys(seq)).toContain('TXTLG');
  });

  it('number_range_fi should use FBN1 with NRFROM and NRTO fields', () => {
    const seq = SCREEN_SEQUENCES.number_range_fi;
    expect(seq.transaction).toBe('FBN1');
    expect(seq.table).toBe('NRIV');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('NRFROM');
    expect(allFieldKeys(seq)).toContain('NRTO');
    expect(allFieldKeys(seq)).toContain('EXTERNIND');
  });

  it('chart_of_accounts should use OB13 with KTOPL field', () => {
    const seq = SCREEN_SEQUENCES.chart_of_accounts;
    expect(seq.transaction).toBe('OB13');
    expect(seq.table).toBe('T004');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('KTOPL');
    expect(allFieldKeys(seq)).toContain('KTPLTEXT');
  });

  it('account_group should use OBD4 with KTOGR field', () => {
    const seq = SCREEN_SEQUENCES.account_group;
    expect(seq.transaction).toBe('OBD4');
    expect(seq.table).toBe('T077S');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('KTOGR');
    expect(allFieldKeys(seq)).toContain('VONKT');
    expect(allFieldKeys(seq)).toContain('BISKT');
  });

  it('field_status_group should use OBC4 with FAZLG field', () => {
    const seq = SCREEN_SEQUENCES.field_status_group;
    expect(seq.transaction).toBe('OBC4');
    expect(seq.table).toBe('T004F');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('FAZLG');
    expect(allFieldKeys(seq)).toContain('FAESSION');
  });

  it('tolerance_group_fi should use OBA4 with HTEFG field', () => {
    const seq = SCREEN_SEQUENCES.tolerance_group_fi;
    expect(seq.transaction).toBe('OBA4');
    expect(seq.table).toBe('T043T');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('HTEFG');
    expect(allFieldKeys(seq)).toContain('BEWTP');
  });

  it('payment_terms should use OBB8 with ZTERM and ZTAG fields', () => {
    const seq = SCREEN_SEQUENCES.payment_terms;
    expect(seq.transaction).toBe('OBB8');
    expect(seq.table).toBe('T052');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('ZTERM');
    expect(allFieldKeys(seq)).toContain('TEXT1');
    expect(allFieldKeys(seq)).toContain('ZTAG1');
    expect(allFieldKeys(seq)).toContain('ZPRZ1');
    expect(allFieldKeys(seq)).toContain('ZTAG3');
  });

  it('tax_code should use FTXP with KALSM and MWSKZ fields', () => {
    const seq = SCREEN_SEQUENCES.tax_code;
    expect(seq.transaction).toBe('FTXP');
    expect(seq.table).toBe('T007A');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('KALSM');
    expect(allFieldKeys(seq)).toContain('MWSKZ');
    expect(allFieldKeys(seq)).toContain('ZMWST');
  });

  it('house_bank should use FI12 with HBKID and BANKL fields', () => {
    const seq = SCREEN_SEQUENCES.house_bank;
    expect(seq.transaction).toBe('FI12');
    expect(seq.table).toBe('T012/T012K');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('BUKRS');
    expect(allFieldKeys(seq)).toContain('HBKID');
    expect(allFieldKeys(seq)).toContain('BANKL');
    expect(allFieldKeys(seq)).toContain('BANKS');
  });

  it('gl_account should use FS00 with SAESSION and BUKRS fields', () => {
    const seq = SCREEN_SEQUENCES.gl_account;
    expect(seq.transaction).toBe('FS00');
    expect(seq.table).toBe('SKA1/SKB1');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('SAESSION');
    expect(allFieldKeys(seq)).toContain('BUKRS');
    expect(allFieldKeys(seq)).toContain('TXTLG');
    expect(allFieldKeys(seq)).toContain('XBILK');
  });

  it('vendor_account_group should use OBD3 with KTOKK field', () => {
    const seq = SCREEN_SEQUENCES.vendor_account_group;
    expect(seq.transaction).toBe('OBD3');
    expect(seq.table).toBe('T077Y');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('KTOKK');
    expect(allFieldKeys(seq)).toContain('TXTLG');
  });

  it('customer_account_group should use OBD2 with KTOKD field', () => {
    const seq = SCREEN_SEQUENCES.customer_account_group;
    expect(seq.transaction).toBe('OBD2');
    expect(seq.table).toBe('T077D');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('KTOKD');
    expect(allFieldKeys(seq)).toContain('TXTLG');
  });

  it('exchange_rate_type should use OB07 with KURST field', () => {
    const seq = SCREEN_SEQUENCES.exchange_rate_type;
    expect(seq.transaction).toBe('OB07');
    expect(seq.table).toBe('TCURV');
    expect(seq.module).toBe('FI');
    expect(allFieldKeys(seq)).toContain('KURST');
    expect(allFieldKeys(seq)).toContain('XINVR');
  });
});

// ═══════════════════════════════════════════════════════════════════
// CO — Controlling — 8 sequences
// ═══════════════════════════════════════════════════════════════════

describe('BDC Screen Sequences — CO Controlling', () => {
  it('cost_element should use KA06 with KSTAR field', () => {
    const seq = SCREEN_SEQUENCES.cost_element;
    expect(seq.transaction).toBe('KA06');
    expect(seq.table).toBe('CSKA/CSKB');
    expect(seq.module).toBe('CO');
    expect(allFieldKeys(seq)).toContain('KSTAR');
    expect(allFieldKeys(seq)).toContain('KOKRS');
    expect(allFieldKeys(seq)).toContain('KAESSION');
  });

  it('cost_center should use KS01 with KOSTL and BUKRS fields', () => {
    const seq = SCREEN_SEQUENCES.cost_center;
    expect(seq.transaction).toBe('KS01');
    expect(seq.table).toBe('CSKS/CSKT');
    expect(seq.module).toBe('CO');
    expect(allFieldKeys(seq)).toContain('KOSTL');
    expect(allFieldKeys(seq)).toContain('BUKRS');
    expect(allFieldKeys(seq)).toContain('KTEXT');
    expect(allFieldKeys(seq)).toContain('KHINR');
  });

  it('cost_center_group should use KSH1 with SETNAME field', () => {
    const seq = SCREEN_SEQUENCES.cost_center_group;
    expect(seq.transaction).toBe('KSH1');
    expect(seq.table).toBe('SETHEADER/SETNODE');
    expect(seq.module).toBe('CO');
    expect(allFieldKeys(seq)).toContain('SETNAME');
    expect(allFieldKeys(seq)).toContain('TXLG');
  });

  it('activity_type should use KL01 with LSTAR field', () => {
    const seq = SCREEN_SEQUENCES.activity_type;
    expect(seq.transaction).toBe('KL01');
    expect(seq.table).toBe('CSLA/CSLT');
    expect(seq.module).toBe('CO');
    expect(allFieldKeys(seq)).toContain('LSTAR');
    expect(allFieldKeys(seq)).toContain('KOKRS');
    expect(allFieldKeys(seq)).toContain('LEIESSION');
  });

  it('statistical_key_figure should use KK01 with STAGR field', () => {
    const seq = SCREEN_SEQUENCES.statistical_key_figure;
    expect(seq.transaction).toBe('KK01');
    expect(seq.table).toBe('TKA09');
    expect(seq.module).toBe('CO');
    expect(allFieldKeys(seq)).toContain('STAGR');
    expect(allFieldKeys(seq)).toContain('KOKRS');
    expect(allFieldKeys(seq)).toContain('SIEGR');
  });

  it('internal_order_type should use SM30 with AUART field', () => {
    const seq = SCREEN_SEQUENCES.internal_order_type;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('T003O');
    expect(seq.module).toBe('CO');
    expect(allFieldKeys(seq)).toContain('AUART');
    expect(allFieldKeys(seq)).toContain('AUTYP');
  });

  it('profit_center should use KE51 with PRCTR field', () => {
    const seq = SCREEN_SEQUENCES.profit_center;
    expect(seq.transaction).toBe('KE51');
    expect(seq.table).toBe('CEPC/CEPCT');
    expect(seq.module).toBe('CO');
    expect(allFieldKeys(seq)).toContain('PRCTR');
    expect(allFieldKeys(seq)).toContain('KOKRS');
    expect(allFieldKeys(seq)).toContain('KTEXT');
  });

  it('assessment_cycle_co should use KSU5 with SETNAME field', () => {
    const seq = SCREEN_SEQUENCES.assessment_cycle_co;
    expect(seq.transaction).toBe('KSU5');
    expect(seq.table).toBe('COKP/COSP');
    expect(seq.module).toBe('CO');
    expect(allFieldKeys(seq)).toContain('SETNAME');
    expect(allFieldKeys(seq)).toContain('KOKRS');
    expect(allFieldKeys(seq)).toContain('TXTLG');
  });
});

// ═══════════════════════════════════════════════════════════════════
// MM — Materials Management — 10 sequences
// ═══════════════════════════════════════════════════════════════════

describe('BDC Screen Sequences — MM Materials Management', () => {
  it('material_type should use SM30 with MTART field', () => {
    const seq = SCREEN_SEQUENCES.material_type;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('T134');
    expect(seq.module).toBe('MM');
    expect(allFieldKeys(seq)).toContain('MTART');
    expect(allFieldKeys(seq)).toContain('MTREF');
    expect(allFieldKeys(seq)).toContain('MBESSION');
  });

  it('material_group should use SM30 with MATKL field', () => {
    const seq = SCREEN_SEQUENCES.material_group;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('T023');
    expect(seq.module).toBe('MM');
    expect(allFieldKeys(seq)).toContain('MATKL');
    expect(allFieldKeys(seq)).toContain('WGBEZ');
  });

  it('purchasing_group should use SM30 with EKGRP field', () => {
    const seq = SCREEN_SEQUENCES.purchasing_group;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('T024');
    expect(seq.module).toBe('MM');
    expect(allFieldKeys(seq)).toContain('EKGRP');
    expect(allFieldKeys(seq)).toContain('EKNAM');
    expect(allFieldKeys(seq)).toContain('EKTEL');
  });

  it('valuation_class should use SM30 with BKLAS field', () => {
    const seq = SCREEN_SEQUENCES.valuation_class;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('T025');
    expect(seq.module).toBe('MM');
    expect(allFieldKeys(seq)).toContain('BKLAS');
    expect(allFieldKeys(seq)).toContain('BKBEZ');
  });

  it('purchasing_doc_type should use SM30 with BSART field', () => {
    const seq = SCREEN_SEQUENCES.purchasing_doc_type;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('T161');
    expect(seq.module).toBe('MM');
    expect(allFieldKeys(seq)).toContain('BSART');
    expect(allFieldKeys(seq)).toContain('BATXT');
    expect(allFieldKeys(seq)).toContain('BSAKZ');
  });

  it('vendor_create should use XK01 with LIFNR and address fields', () => {
    const seq = SCREEN_SEQUENCES.vendor_create;
    expect(seq.transaction).toBe('XK01');
    expect(seq.table).toBe('LFA1/LFB1/LFM1');
    expect(seq.module).toBe('MM');
    expect(allFieldKeys(seq)).toContain('LIFNR');
    expect(allFieldKeys(seq)).toContain('NAME1');
    expect(allFieldKeys(seq)).toContain('STRAS');
    expect(allFieldKeys(seq)).toContain('AKONT');
    expect(allFieldKeys(seq)).toContain('WAERS');
  });

  it('info_record should use ME11 with LIFNR and MATNR fields', () => {
    const seq = SCREEN_SEQUENCES.info_record;
    expect(seq.transaction).toBe('ME11');
    expect(seq.table).toBe('EINA/EINE');
    expect(seq.module).toBe('MM');
    expect(allFieldKeys(seq)).toContain('LIFNR');
    expect(allFieldKeys(seq)).toContain('MATNR');
    expect(allFieldKeys(seq)).toContain('NETPR');
    expect(allFieldKeys(seq)).toContain('PEINH');
  });

  it('source_list should use ME01 with MATNR and WERKS fields', () => {
    const seq = SCREEN_SEQUENCES.source_list;
    expect(seq.transaction).toBe('ME01');
    expect(seq.table).toBe('EORD');
    expect(seq.module).toBe('MM');
    expect(allFieldKeys(seq)).toContain('MATNR');
    expect(allFieldKeys(seq)).toContain('WERKS');
    expect(allFieldKeys(seq)).toContain('LIFNR');
    expect(allFieldKeys(seq)).toContain('FESSION');
  });

  it('movement_type should use SM30 with BWART field', () => {
    const seq = SCREEN_SEQUENCES.movement_type;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('T156');
    expect(seq.module).toBe('MM');
    expect(allFieldKeys(seq)).toContain('BWART');
    expect(allFieldKeys(seq)).toContain('KZZUG');
  });

  it('purchasing_value_key should use SM30 with BWSCL field', () => {
    const seq = SCREEN_SEQUENCES.purchasing_value_key;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('T007V');
    expect(seq.module).toBe('MM');
    expect(allFieldKeys(seq)).toContain('EKORG');
    expect(allFieldKeys(seq)).toContain('BWSCL');
    expect(allFieldKeys(seq)).toContain('TXTLG');
  });
});

// ═══════════════════════════════════════════════════════════════════
// SD — Sales & Distribution — 10 sequences
// ═══════════════════════════════════════════════════════════════════

describe('BDC Screen Sequences — SD Sales & Distribution', () => {
  it('sales_doc_type should use SM30 with AUART field', () => {
    const seq = SCREEN_SEQUENCES.sales_doc_type;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('TVAK');
    expect(seq.module).toBe('SD');
    expect(allFieldKeys(seq)).toContain('AUART');
    expect(allFieldKeys(seq)).toContain('BEZEI');
    expect(allFieldKeys(seq)).toContain('VBTYP');
    expect(allFieldKeys(seq)).toContain('NUMKI');
  });

  it('item_category should use SM30 with PSTYV field', () => {
    const seq = SCREEN_SEQUENCES.item_category;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('TVAP');
    expect(seq.module).toBe('SD');
    expect(allFieldKeys(seq)).toContain('PSTYV');
    expect(allFieldKeys(seq)).toContain('BEZEI');
    expect(allFieldKeys(seq)).toContain('PSTYK');
  });

  it('delivery_type should use SM30 with LFART field', () => {
    const seq = SCREEN_SEQUENCES.delivery_type;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('TVLK');
    expect(seq.module).toBe('SD');
    expect(allFieldKeys(seq)).toContain('LFART');
    expect(allFieldKeys(seq)).toContain('TXTLG');
    expect(allFieldKeys(seq)).toContain('VBTYP');
  });

  it('billing_type should use SM30 with FKART field', () => {
    const seq = SCREEN_SEQUENCES.billing_type;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('TVFK');
    expect(seq.module).toBe('SD');
    expect(allFieldKeys(seq)).toContain('FKART');
    expect(allFieldKeys(seq)).toContain('TXTLG');
  });

  it('pricing_procedure should use SM30 with KALSM field', () => {
    const seq = SCREEN_SEQUENCES.pricing_procedure;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('T683S');
    expect(seq.module).toBe('SD');
    expect(allFieldKeys(seq)).toContain('KVEWE');
    expect(allFieldKeys(seq)).toContain('KAPPL');
    expect(allFieldKeys(seq)).toContain('KALSM');
    expect(allFieldKeys(seq)).toContain('TXTLG');
  });

  it('condition_type_sd should use SM30 with KSCHL field', () => {
    const seq = SCREEN_SEQUENCES.condition_type_sd;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('T685A');
    expect(seq.module).toBe('SD');
    expect(allFieldKeys(seq)).toContain('KSCHL');
    expect(allFieldKeys(seq)).toContain('KOESSION');
    expect(allFieldKeys(seq)).toContain('KRESSION');
  });

  it('output_type_sd should use SM30 with NAESSION field', () => {
    const seq = SCREEN_SEQUENCES.output_type_sd;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('TNAPR');
    expect(seq.module).toBe('SD');
    expect(allFieldKeys(seq)).toContain('NAESSION');
    expect(allFieldKeys(seq)).toContain('TXTLG');
    expect(allFieldKeys(seq)).toContain('VERSN');
  });

  it('credit_control_area should use OB45 with KKBER field', () => {
    const seq = SCREEN_SEQUENCES.credit_control_area;
    expect(seq.transaction).toBe('OB45');
    expect(seq.table).toBe('T014');
    expect(seq.module).toBe('SD');
    expect(allFieldKeys(seq)).toContain('KKBER');
    expect(allFieldKeys(seq)).toContain('TXTLG');
    expect(allFieldKeys(seq)).toContain('BUKRS');
  });

  it('shipping_condition should use SM30 with VSBED field', () => {
    const seq = SCREEN_SEQUENCES.shipping_condition;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('VSBED');
    expect(seq.module).toBe('SD');
    expect(allFieldKeys(seq)).toContain('VSBED');
    expect(allFieldKeys(seq)).toContain('TXTLG');
  });

  it('sales_district should use SM30 with BZIRK field', () => {
    const seq = SCREEN_SEQUENCES.sales_district;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('T171');
    expect(seq.module).toBe('SD');
    expect(allFieldKeys(seq)).toContain('BZIRK');
    expect(allFieldKeys(seq)).toContain('BZTXT');
  });
});

// ═══════════════════════════════════════════════════════════════════
// S4 — S/4HANA Mandatory — 5 sequences
// ═══════════════════════════════════════════════════════════════════

describe('BDC Screen Sequences — S/4HANA Mandatory', () => {
  it('bp_number_range should use BUCF with FROESSION and TOESSION fields', () => {
    const seq = SCREEN_SEQUENCES.bp_number_range;
    expect(seq.transaction).toBe('BUCF');
    expect(seq.table).toBe('NRIV');
    expect(seq.module).toBe('S4');
    expect(allFieldKeys(seq)).toContain('FROESSION');
    expect(allFieldKeys(seq)).toContain('TOESSION');
    expect(allFieldKeys(seq)).toContain('EXTERNIND');
  });

  it('bp_grouping should use SM30 with BU_GROUP field', () => {
    const seq = SCREEN_SEQUENCES.bp_grouping;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('TB003');
    expect(seq.module).toBe('S4');
    expect(allFieldKeys(seq)).toContain('BU_GROUP');
    expect(allFieldKeys(seq)).toContain('TXTLG');
    expect(allFieldKeys(seq)).toContain('NRCAT');
  });

  it('material_ledger_plant should use SM30 with BWKEY and MLACTIVE fields', () => {
    const seq = SCREEN_SEQUENCES.material_ledger_plant;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('T001K_ML');
    expect(seq.module).toBe('S4');
    expect(allFieldKeys(seq)).toContain('BWKEY');
    expect(allFieldKeys(seq)).toContain('MLACTIVE');
    expect(allFieldKeys(seq)).toContain('MLCURRENCY');
  });

  it('new_gl_activation should use SM30 with RLDNR and ACTIVE fields', () => {
    const seq = SCREEN_SEQUENCES.new_gl_activation;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('FAGL_ACTIVEC');
    expect(seq.module).toBe('S4');
    expect(allFieldKeys(seq)).toContain('RLDNR');
    expect(allFieldKeys(seq)).toContain('ACTIVE');
  });

  it('fiori_catalog_assign should use SM30 with CATALOG_ID and CHIP_ID fields', () => {
    const seq = SCREEN_SEQUENCES.fiori_catalog_assign;
    expect(seq.transaction).toBe('SM30');
    expect(seq.table).toBe('/UI2/CHIP_CATAL');
    expect(seq.module).toBe('S4');
    expect(allFieldKeys(seq)).toContain('CATALOG_ID');
    expect(allFieldKeys(seq)).toContain('CHIP_ID');
    expect(allFieldKeys(seq)).toContain('DESCRIPTION');
  });
});
