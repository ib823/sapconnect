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
 * Infor LN Item Master Migration Object
 *
 * Migrates LN Item Master (tcibd001) to SAP Material Master
 * (MARA/MAKT/MARC/MARD/MBEW).
 *
 * Key transforms:
 * - Item type (kitm) determines MTART + BESKZ via value mapping
 * - UoM converted from LN ISO codes to SAP internal codes
 * - Signal code (csig) maps to material group (MATKL)
 * - Standard price (stwi) maps to valuation standard price (STPRS)
 *
 * ~20 field mappings. Mock: 15 LN item records.
 */

const BaseMigrationObject = require('../../objects/base-migration-object');

class InforLNItemMasterMigrationObject extends BaseMigrationObject {
  get objectId() { return 'INFOR_LN_ITEM_MASTER'; }
  get name() { return 'LN Item Master to SAP Material Master'; }

  getFieldMappings() {
    return [
      // ── General data (MARA) ──────────────────────────────────
      { source: 'item', target: 'MARA-MATNR', convert: 'toUpperCase' },
      { source: 'dsca', target: 'MAKT-MAKTX' },
      { source: 'cuni', target: 'MARA-MEINS', valueMap: {
        'ea': 'EA', 'EA': 'EA',
        'kg': 'KG', 'KG': 'KG',
        'l': 'L', 'L': 'L',
        'm': 'M', 'M': 'M',
        'pcs': 'ST', 'PCS': 'ST',
        'ft': 'FT', 'FT': 'FT',
        'lb': 'LB', 'LB': 'LB',
        'gal': 'GAL', 'GAL': 'GAL',
        'box': 'BOX', 'BOX': 'BOX',
        'set': 'SET', 'SET': 'SET',
      }, default: 'EA' },
      { source: 'kitm', target: 'MARA-MTART', valueMap: {
        '1': 'ROH', '2': 'HALB', '3': 'HAWA', '6': 'NLAG',
      }, default: 'ROH' },
      { source: 'kitm', target: 'MARC-BESKZ', valueMap: {
        '1': 'F', '2': 'E', '3': 'F', '6': 'X',
      }, default: 'F' },
      { source: 'csig', target: 'MARA-MATKL' },
      { source: 'stwi', target: 'MBEW-STPRS', convert: 'toDecimal' },

      // ── Additional item attributes ───────────────────────────
      { source: 'citg', target: 'MARA-MBRSH', default: 'M' },
      { source: 'cwar', target: 'MARC-WERKS' },
      { source: 'lwar', target: 'MARD-LGORT', default: '0001' },
      { source: 'brgw', target: 'MARA-BRGEW', convert: 'toDecimal' },
      { source: 'ntgw', target: 'MARA-NTGEW', convert: 'toDecimal' },
      { source: 'weig', target: 'MARA-GEWEI', default: 'KG' },
      { source: 'plds', target: 'MARA-NORMT' },
      { source: 'cmnf', target: 'MARC-DISPO' },
      { source: 'sfty', target: 'MARC-EISBE', convert: 'toDecimal' },
      { source: 'reop', target: 'MARC-MINBE', convert: 'toDecimal' },
      { source: 'pldt', target: 'MARC-PLIFZ', convert: 'toInteger' },
      { source: 'erpn', target: 'MARA-EAN11' },

      // ── Metadata ─────────────────────────────────────────────
      { target: 'SourceSystem', default: 'INFOR_LN' },
      { target: 'MigrationObjectId', default: 'INFOR_LN_ITEM_MASTER' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['MARA-MATNR', 'MAKT-MAKTX', 'MARA-MEINS', 'MARA-MTART'],
      exactDuplicate: { keys: ['MARA-MATNR', 'MARC-WERKS'] },
    };
  }

  _extractMock() {
    const items = [
      { item: 'RM-10001', dsca: 'Steel Sheet 2mm', kitm: '1', csig: 'RAW01', cuni: 'kg', stwi: '4.50', cwar: '1000', brgw: '1.000', ntgw: '1.000', sfty: '500', reop: '1000', pldt: '7', erpn: '4012345000011' },
      { item: 'RM-10002', dsca: 'Aluminum Rod 10mm', kitm: '1', csig: 'RAW01', cuni: 'kg', stwi: '8.75', cwar: '1000', brgw: '1.000', ntgw: '1.000', sfty: '200', reop: '500', pldt: '10', erpn: '4012345000028' },
      { item: 'RM-10003', dsca: 'Copper Wire 0.5mm', kitm: '1', csig: 'RAW02', cuni: 'm', stwi: '0.35', cwar: '1000', brgw: '0.005', ntgw: '0.005', sfty: '10000', reop: '25000', pldt: '14', erpn: '4012345000035' },
      { item: 'RM-10004', dsca: 'Plastic Granulate ABS', kitm: '1', csig: 'RAW03', cuni: 'kg', stwi: '2.10', cwar: '2000', brgw: '1.000', ntgw: '1.000', sfty: '300', reop: '800', pldt: '5', erpn: '4012345000042' },
      { item: 'RM-10005', dsca: 'Rubber Seal Compound', kitm: '1', csig: 'RAW03', cuni: 'kg', stwi: '6.25', cwar: '2000', brgw: '1.000', ntgw: '1.000', sfty: '100', reop: '250', pldt: '21', erpn: '' },
      { item: 'SF-20001', dsca: 'Motor Housing Assembly', kitm: '2', csig: 'SFG01', cuni: 'ea', stwi: '85.00', cwar: '1000', brgw: '3.500', ntgw: '3.200', sfty: '50', reop: '100', pldt: '3', erpn: '' },
      { item: 'SF-20002', dsca: 'PCB Control Board v3', kitm: '2', csig: 'SFG02', cuni: 'ea', stwi: '42.50', cwar: '1000', brgw: '0.150', ntgw: '0.120', sfty: '100', reop: '200', pldt: '5', erpn: '' },
      { item: 'SF-20003', dsca: 'Gearbox Sub-Assembly', kitm: '2', csig: 'SFG01', cuni: 'ea', stwi: '125.00', cwar: '2000', brgw: '5.800', ntgw: '5.500', sfty: '30', reop: '60', pldt: '4', erpn: '' },
      { item: 'FG-30001', dsca: 'Industrial Motor 5HP', kitm: '3', csig: 'FIN01', cuni: 'ea', stwi: '450.00', cwar: '1000', brgw: '25.000', ntgw: '22.500', sfty: '20', reop: '40', pldt: '0', erpn: '4012345000059' },
      { item: 'FG-30002', dsca: 'Control Panel Standard', kitm: '3', csig: 'FIN02', cuni: 'ea', stwi: '320.00', cwar: '1000', brgw: '8.000', ntgw: '7.200', sfty: '15', reop: '30', pldt: '0', erpn: '4012345000066' },
      { item: 'FG-30003', dsca: 'Pump Assembly Heavy Duty', kitm: '3', csig: 'FIN01', cuni: 'ea', stwi: '680.00', cwar: '2000', brgw: '35.000', ntgw: '32.000', sfty: '10', reop: '20', pldt: '0', erpn: '4012345000073' },
      { item: 'FG-30004', dsca: 'Conveyor Drive Unit', kitm: '3', csig: 'FIN03', cuni: 'ea', stwi: '1250.00', cwar: '1000', brgw: '45.000', ntgw: '42.000', sfty: '5', reop: '10', pldt: '0', erpn: '' },
      { item: 'NS-60001', dsca: 'Lubricant Oil Industrial', kitm: '6', csig: 'CON01', cuni: 'l', stwi: '3.80', cwar: '1000', brgw: '0.900', ntgw: '0.900', sfty: '200', reop: '500', pldt: '3', erpn: '' },
      { item: 'NS-60002', dsca: 'Cleaning Solvent', kitm: '6', csig: 'CON01', cuni: 'l', stwi: '5.20', cwar: '2000', brgw: '0.800', ntgw: '0.800', sfty: '100', reop: '300', pldt: '5', erpn: '' },
      { item: 'NS-60003', dsca: 'Safety Gloves Pack 12', kitm: '6', csig: 'CON02', cuni: 'box', stwi: '18.50', cwar: '1000', brgw: '0.600', ntgw: '0.500', sfty: '50', reop: '100', pldt: '7', erpn: '' },
    ];

    return items.map(i => ({
      item: i.item,
      dsca: i.dsca,
      kitm: i.kitm,
      csig: i.csig,
      cuni: i.cuni,
      stwi: i.stwi,
      citg: 'M',
      cwar: i.cwar,
      lwar: '0001',
      brgw: i.brgw,
      ntgw: i.ntgw,
      weig: 'kg',
      plds: '',
      cmnf: `MRP${i.cwar.slice(-2)}`,
      sfty: i.sfty,
      reop: i.reop,
      pldt: i.pldt,
      erpn: i.erpn || '',
    }));
  }
}

module.exports = InforLNItemMasterMigrationObject;
