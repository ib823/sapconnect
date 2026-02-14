/**
 * Table Intelligence System
 *
 * Provides deep SAP data dictionary intelligence by combining RFC function module
 * calls and table reads. Discovers field metadata, foreign key relationships,
 * text tables, domain values, and data element information.
 *
 * Builds on lib/rfc/table-reader.js and lib/rfc/function-caller.js.
 */

const Logger = require('../logger');

/**
 * Comprehensive mock data for common SAP tables.
 * Contains realistic DFIES structures, foreign keys, and relationships.
 */
const MOCK_FIELD_INFO = {
  BKPF: [
    { FIELDNAME: 'MANDT', ROLLNAME: 'MANDT', DOMNAME: 'MANDT', DATATYPE: 'CLNT', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T000', FIELDTEXT: 'Client', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BUKRS', ROLLNAME: 'BUKRS', DOMNAME: 'BUKRS', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'T001', FIELDTEXT: 'Company Code', CONVEXIT: 'ALPHA', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BELNR', ROLLNAME: 'BELNR_D', DOMNAME: 'BELNR', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Accounting Document Number', CONVEXIT: 'ALPHA', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'GJAHR', ROLLNAME: 'GJAHR', DOMNAME: 'GJAHR', DATATYPE: 'NUMC', LENG: '000004', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Fiscal Year', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'N', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BLART', ROLLNAME: 'BLART', DOMNAME: 'BLART', DATATYPE: 'CHAR', LENG: '000002', DECIMALS: '000000', CHECKTABLE: 'T003', FIELDTEXT: 'Document Type', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BLDAT', ROLLNAME: 'BLDAT', DOMNAME: 'BLDAT', DATATYPE: 'DATS', LENG: '000008', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Document Date in Document', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'D', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BUDAT', ROLLNAME: 'BUDAT', DOMNAME: 'BUDAT', DATATYPE: 'DATS', LENG: '000008', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Posting Date in the Document', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'D', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'MONAT', ROLLNAME: 'MONAT', DOMNAME: 'MONAT', DATATYPE: 'NUMC', LENG: '000002', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Fiscal Period', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'N', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'CPUDT', ROLLNAME: 'CPUDT', DOMNAME: 'CPUDT', DATATYPE: 'DATS', LENG: '000008', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Day On Which Accounting Document Was Entered', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'D', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'USNAM', ROLLNAME: 'USNAM', DOMNAME: 'USNAM', DATATYPE: 'CHAR', LENG: '000012', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'User Name', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'WAERS', ROLLNAME: 'WAERS', DOMNAME: 'WAERS', DATATYPE: 'CUKY', LENG: '000005', DECIMALS: '000000', CHECKTABLE: 'TCURC', FIELDTEXT: 'Currency Key', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'KURSF', ROLLNAME: 'KURSF', DOMNAME: 'KURSF', DATATYPE: 'DEC', LENG: '000009', DECIMALS: '000005', CHECKTABLE: '', FIELDTEXT: 'Exchange Rate', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'P', REFTABLE: '', REFFIELD: '' },
  ],
  BSEG: [
    { FIELDNAME: 'MANDT', ROLLNAME: 'MANDT', DOMNAME: 'MANDT', DATATYPE: 'CLNT', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T000', FIELDTEXT: 'Client', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BUKRS', ROLLNAME: 'BUKRS', DOMNAME: 'BUKRS', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'T001', FIELDTEXT: 'Company Code', CONVEXIT: 'ALPHA', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BELNR', ROLLNAME: 'BELNR_D', DOMNAME: 'BELNR', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Accounting Document Number', CONVEXIT: 'ALPHA', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'GJAHR', ROLLNAME: 'GJAHR', DOMNAME: 'GJAHR', DATATYPE: 'NUMC', LENG: '000004', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Fiscal Year', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'N', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BUZEI', ROLLNAME: 'BUZEI', DOMNAME: 'BUZEI', DATATYPE: 'NUMC', LENG: '000003', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Number of Line Item Within Accounting Document', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'N', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'KOART', ROLLNAME: 'KOART', DOMNAME: 'KOART', DATATYPE: 'CHAR', LENG: '000001', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Account Type', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'HKONT', ROLLNAME: 'HKONT', DOMNAME: 'HKONT', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: 'SKA1', FIELDTEXT: 'General Ledger Account', CONVEXIT: 'ALPHA', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'DMBTR', ROLLNAME: 'DMBTR', DOMNAME: 'DMBTR', DATATYPE: 'CURR', LENG: '000013', DECIMALS: '000002', CHECKTABLE: '', FIELDTEXT: 'Amount in Local Currency', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'P', REFTABLE: 'BSEG', REFFIELD: 'PSWSL' },
    { FIELDNAME: 'WRBTR', ROLLNAME: 'WRBTR', DOMNAME: 'WRBTR', DATATYPE: 'CURR', LENG: '000013', DECIMALS: '000002', CHECKTABLE: '', FIELDTEXT: 'Amount in Document Currency', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'P', REFTABLE: 'BKPF', REFFIELD: 'WAERS' },
    { FIELDNAME: 'SHKZG', ROLLNAME: 'SHKZG', DOMNAME: 'SHKZG', DATATYPE: 'CHAR', LENG: '000001', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Debit/Credit Indicator', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'KOSTL', ROLLNAME: 'KOSTL', DOMNAME: 'KOSTL', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: 'CSKS', FIELDTEXT: 'Cost Center', CONVEXIT: 'ALPHA', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
  ],
  KNA1: [
    { FIELDNAME: 'MANDT', ROLLNAME: 'MANDT', DOMNAME: 'MANDT', DATATYPE: 'CLNT', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T000', FIELDTEXT: 'Client', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'KUNNR', ROLLNAME: 'KUNNR', DOMNAME: 'KUNNR', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Customer Number', CONVEXIT: 'ALPHA', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'LAND1', ROLLNAME: 'LAND1_GP', DOMNAME: 'LAND1', DATATYPE: 'CHAR', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T005', FIELDTEXT: 'Country Key', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'NAME1', ROLLNAME: 'NAME1_GP', DOMNAME: 'NAME1', DATATYPE: 'CHAR', LENG: '000035', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Name 1', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'NAME2', ROLLNAME: 'NAME2_GP', DOMNAME: 'NAME2', DATATYPE: 'CHAR', LENG: '000035', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Name 2', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'ORT01', ROLLNAME: 'ORT01_GP', DOMNAME: 'ORT01', DATATYPE: 'CHAR', LENG: '000035', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'City', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'PSTLZ', ROLLNAME: 'PSTLZ', DOMNAME: 'PSTLZ', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Postal Code', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'STRAS', ROLLNAME: 'STRAS_GP', DOMNAME: 'STRAS', DATATYPE: 'CHAR', LENG: '000035', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'House number and street', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'KTOKD', ROLLNAME: 'KTOKD', DOMNAME: 'KTOKD', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'T077D', FIELDTEXT: 'Customer Account Group', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'SPRAS', ROLLNAME: 'SPRAS', DOMNAME: 'SPRAS', DATATYPE: 'LANG', LENG: '000001', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Language Key', CONVEXIT: 'ISOLA', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
  ],
  KNB1: [
    { FIELDNAME: 'MANDT', ROLLNAME: 'MANDT', DOMNAME: 'MANDT', DATATYPE: 'CLNT', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T000', FIELDTEXT: 'Client', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'KUNNR', ROLLNAME: 'KUNNR', DOMNAME: 'KUNNR', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: 'KNA1', FIELDTEXT: 'Customer Number', CONVEXIT: 'ALPHA', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BUKRS', ROLLNAME: 'BUKRS', DOMNAME: 'BUKRS', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'T001', FIELDTEXT: 'Company Code', CONVEXIT: 'ALPHA', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'AKONT', ROLLNAME: 'AKONT', DOMNAME: 'AKONT', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: 'SKA1', FIELDTEXT: 'Reconciliation Account', CONVEXIT: 'ALPHA', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'ZTERM', ROLLNAME: 'DZTERM', DOMNAME: 'DZTERM', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'T052', FIELDTEXT: 'Payment Terms', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'ZWELS', ROLLNAME: 'DZWELS', DOMNAME: 'DZWELS', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Payment Methods', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
  ],
  LFA1: [
    { FIELDNAME: 'MANDT', ROLLNAME: 'MANDT', DOMNAME: 'MANDT', DATATYPE: 'CLNT', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T000', FIELDTEXT: 'Client', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'LIFNR', ROLLNAME: 'LIFNR', DOMNAME: 'LIFNR', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Vendor Account Number', CONVEXIT: 'ALPHA', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'LAND1', ROLLNAME: 'LAND1_GP', DOMNAME: 'LAND1', DATATYPE: 'CHAR', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T005', FIELDTEXT: 'Country Key', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'NAME1', ROLLNAME: 'NAME1_GP', DOMNAME: 'NAME1', DATATYPE: 'CHAR', LENG: '000035', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Name 1', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'NAME2', ROLLNAME: 'NAME2_GP', DOMNAME: 'NAME2', DATATYPE: 'CHAR', LENG: '000035', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Name 2', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'ORT01', ROLLNAME: 'ORT01_GP', DOMNAME: 'ORT01', DATATYPE: 'CHAR', LENG: '000035', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'City', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'PSTLZ', ROLLNAME: 'PSTLZ', DOMNAME: 'PSTLZ', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Postal Code', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'KTOKK', ROLLNAME: 'KTOKK', DOMNAME: 'KTOKK', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'T077K', FIELDTEXT: 'Vendor Account Group', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'SPRAS', ROLLNAME: 'SPRAS', DOMNAME: 'SPRAS', DATATYPE: 'LANG', LENG: '000001', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Language Key', CONVEXIT: 'ISOLA', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
  ],
  LFB1: [
    { FIELDNAME: 'MANDT', ROLLNAME: 'MANDT', DOMNAME: 'MANDT', DATATYPE: 'CLNT', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T000', FIELDTEXT: 'Client', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'LIFNR', ROLLNAME: 'LIFNR', DOMNAME: 'LIFNR', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: 'LFA1', FIELDTEXT: 'Vendor Account Number', CONVEXIT: 'ALPHA', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BUKRS', ROLLNAME: 'BUKRS', DOMNAME: 'BUKRS', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'T001', FIELDTEXT: 'Company Code', CONVEXIT: 'ALPHA', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'AKONT', ROLLNAME: 'AKONT', DOMNAME: 'AKONT', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: 'SKA1', FIELDTEXT: 'Reconciliation Account', CONVEXIT: 'ALPHA', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'ZTERM', ROLLNAME: 'DZTERM', DOMNAME: 'DZTERM', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'T052', FIELDTEXT: 'Payment Terms', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'ZWELS', ROLLNAME: 'DZWELS', DOMNAME: 'DZWELS', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Payment Methods', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
  ],
  MARA: [
    { FIELDNAME: 'MANDT', ROLLNAME: 'MANDT', DOMNAME: 'MANDT', DATATYPE: 'CLNT', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T000', FIELDTEXT: 'Client', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'MATNR', ROLLNAME: 'MATNR', DOMNAME: 'MATNR', DATATYPE: 'CHAR', LENG: '000018', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Material Number', CONVEXIT: 'MATN1', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'ERSDA', ROLLNAME: 'ERSDA', DOMNAME: 'ERSDA', DATATYPE: 'DATS', LENG: '000008', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Created On', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'D', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'ERNAM', ROLLNAME: 'ERNAM', DOMNAME: 'ERNAM', DATATYPE: 'CHAR', LENG: '000012', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Name of Person Who Created the Object', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'MTART', ROLLNAME: 'MTART', DOMNAME: 'MTART', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'T134', FIELDTEXT: 'Material Type', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'MBRSH', ROLLNAME: 'MBRSH', DOMNAME: 'MBRSH', DATATYPE: 'CHAR', LENG: '000001', DECIMALS: '000000', CHECKTABLE: 'T137', FIELDTEXT: 'Industry Sector', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'MATKL', ROLLNAME: 'MATKL', DOMNAME: 'MATKL', DATATYPE: 'CHAR', LENG: '000009', DECIMALS: '000000', CHECKTABLE: 'T023', FIELDTEXT: 'Material Group', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'MEINS', ROLLNAME: 'MEINS', DOMNAME: 'MEINS', DATATYPE: 'UNIT', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T006', FIELDTEXT: 'Base Unit of Measure', CONVEXIT: 'CUNIT', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BRGEW', ROLLNAME: 'BRGEW', DOMNAME: 'BRGEW', DATATYPE: 'QUAN', LENG: '000013', DECIMALS: '000003', CHECKTABLE: '', FIELDTEXT: 'Gross Weight', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'P', REFTABLE: 'MARA', REFFIELD: 'GEWEI' },
    { FIELDNAME: 'NTGEW', ROLLNAME: 'NTGEW', DOMNAME: 'NTGEW', DATATYPE: 'QUAN', LENG: '000013', DECIMALS: '000003', CHECKTABLE: '', FIELDTEXT: 'Net Weight', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'P', REFTABLE: 'MARA', REFFIELD: 'GEWEI' },
  ],
  MARC: [
    { FIELDNAME: 'MANDT', ROLLNAME: 'MANDT', DOMNAME: 'MANDT', DATATYPE: 'CLNT', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T000', FIELDTEXT: 'Client', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'MATNR', ROLLNAME: 'MATNR', DOMNAME: 'MATNR', DATATYPE: 'CHAR', LENG: '000018', DECIMALS: '000000', CHECKTABLE: 'MARA', FIELDTEXT: 'Material Number', CONVEXIT: 'MATN1', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'WERKS', ROLLNAME: 'WERKS_D', DOMNAME: 'WERKS', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'T001W', FIELDTEXT: 'Plant', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'EKGRP', ROLLNAME: 'EKGRP', DOMNAME: 'EKGRP', DATATYPE: 'CHAR', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T024', FIELDTEXT: 'Purchasing Group', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'DISMM', ROLLNAME: 'DISMM', DOMNAME: 'DISMM', DATATYPE: 'CHAR', LENG: '000002', DECIMALS: '000000', CHECKTABLE: 'T438A', FIELDTEXT: 'MRP Type', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'DISPO', ROLLNAME: 'DISPO', DOMNAME: 'DISPO', DATATYPE: 'CHAR', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T024D', FIELDTEXT: 'MRP Controller', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BESKZ', ROLLNAME: 'BESKZ', DOMNAME: 'BESKZ', DATATYPE: 'CHAR', LENG: '000001', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Procurement Type', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'SOBSL', ROLLNAME: 'SOBSL', DOMNAME: 'SOBSL', DATATYPE: 'CHAR', LENG: '000002', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Special Procurement Type', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
  ],
  EKKO: [
    { FIELDNAME: 'MANDT', ROLLNAME: 'MANDT', DOMNAME: 'MANDT', DATATYPE: 'CLNT', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T000', FIELDTEXT: 'Client', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'EBELN', ROLLNAME: 'EBELN', DOMNAME: 'EBELN', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Purchasing Document Number', CONVEXIT: 'ALPHA', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BUKRS', ROLLNAME: 'BUKRS', DOMNAME: 'BUKRS', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'T001', FIELDTEXT: 'Company Code', CONVEXIT: 'ALPHA', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BSART', ROLLNAME: 'BSART', DOMNAME: 'BSART', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'T161', FIELDTEXT: 'Purchasing Document Type', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BSTYP', ROLLNAME: 'BSTYP', DOMNAME: 'BSTYP', DATATYPE: 'CHAR', LENG: '000001', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Purchasing Document Category', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'LIFNR', ROLLNAME: 'LIFNR', DOMNAME: 'LIFNR', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: 'LFA1', FIELDTEXT: 'Vendor Account Number', CONVEXIT: 'ALPHA', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'EKORG', ROLLNAME: 'EKORG', DOMNAME: 'EKORG', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'T024E', FIELDTEXT: 'Purchasing Organization', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'EKGRP', ROLLNAME: 'EKGRP', DOMNAME: 'EKGRP', DATATYPE: 'CHAR', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T024', FIELDTEXT: 'Purchasing Group', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'WAERS', ROLLNAME: 'WAERS', DOMNAME: 'WAERS', DATATYPE: 'CUKY', LENG: '000005', DECIMALS: '000000', CHECKTABLE: 'TCURC', FIELDTEXT: 'Currency Key', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'BEDAT', ROLLNAME: 'BEDAT', DOMNAME: 'BEDAT', DATATYPE: 'DATS', LENG: '000008', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Purchasing Document Date', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'D', REFTABLE: '', REFFIELD: '' },
  ],
  VBAK: [
    { FIELDNAME: 'MANDT', ROLLNAME: 'MANDT', DOMNAME: 'MANDT', DATATYPE: 'CLNT', LENG: '000003', DECIMALS: '000000', CHECKTABLE: 'T000', FIELDTEXT: 'Client', CONVEXIT: '', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'VBELN', ROLLNAME: 'VBELN_VA', DOMNAME: 'VBELN', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Sales Document', CONVEXIT: 'ALPHA', KEYFLAG: 'X', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'ERDAT', ROLLNAME: 'ERDAT', DOMNAME: 'ERDAT', DATATYPE: 'DATS', LENG: '000008', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Date on Which Record Was Created', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'D', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'ERZET', ROLLNAME: 'ERZET', DOMNAME: 'ERZET', DATATYPE: 'TIMS', LENG: '000006', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Entry Time', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'T', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'ERNAM', ROLLNAME: 'ERNAM', DOMNAME: 'ERNAM', DATATYPE: 'CHAR', LENG: '000012', DECIMALS: '000000', CHECKTABLE: '', FIELDTEXT: 'Name of Person Who Created the Object', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'AUART', ROLLNAME: 'AUART', DOMNAME: 'AUART', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'TVAK', FIELDTEXT: 'Sales Document Type', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'VKORG', ROLLNAME: 'VKORG', DOMNAME: 'VKORG', DATATYPE: 'CHAR', LENG: '000004', DECIMALS: '000000', CHECKTABLE: 'TVKO', FIELDTEXT: 'Sales Organization', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'VTWEG', ROLLNAME: 'VTWEG', DOMNAME: 'VTWEG', DATATYPE: 'CHAR', LENG: '000002', DECIMALS: '000000', CHECKTABLE: 'TVTW', FIELDTEXT: 'Distribution Channel', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'SPART', ROLLNAME: 'SPART', DOMNAME: 'SPART', DATATYPE: 'CHAR', LENG: '000002', DECIMALS: '000000', CHECKTABLE: 'TSPA', FIELDTEXT: 'Division', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'KUNNR', ROLLNAME: 'KUNAG', DOMNAME: 'KUNNR', DATATYPE: 'CHAR', LENG: '000010', DECIMALS: '000000', CHECKTABLE: 'KNA1', FIELDTEXT: 'Sold-to Party', CONVEXIT: 'ALPHA', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'WAERK', ROLLNAME: 'WAERK', DOMNAME: 'WAERS', DATATYPE: 'CUKY', LENG: '000005', DECIMALS: '000000', CHECKTABLE: 'TCURC', FIELDTEXT: 'SD Document Currency', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'C', REFTABLE: '', REFFIELD: '' },
    { FIELDNAME: 'NETWR', ROLLNAME: 'NETWR_AK', DOMNAME: 'NETWR', DATATYPE: 'CURR', LENG: '000015', DECIMALS: '000002', CHECKTABLE: '', FIELDTEXT: 'Net Value of the Sales Order', CONVEXIT: '', KEYFLAG: '', INTTYPE: 'P', REFTABLE: 'VBAK', REFFIELD: 'WAERK' },
  ],
};

/**
 * Mock table definitions (DD02V header info).
 */
const MOCK_TABLE_DEFINITIONS = {
  BKPF: {
    DD02V_WA: { TABNAME: 'BKPF', DDTEXT: 'Accounting Document Header', TABCLASS: 'TRANSP', CLIDEP: 'X', CONTFLAG: 'A', MATEFLAG: '', BUFFERED: '' },
    DD09L_WA: { TABNAME: 'BKPF', TABART: 'APPL0', SCHFELDANZ: 0, PUFFERUNG: '', PROTOKOLL: 'X' },
  },
  BSEG: {
    DD02V_WA: { TABNAME: 'BSEG', DDTEXT: 'Accounting Document Segment', TABCLASS: 'CLUSTER', CLIDEP: 'X', CONTFLAG: 'A', MATEFLAG: '', BUFFERED: '' },
    DD09L_WA: { TABNAME: 'BSEG', TABART: 'APPL0', SCHFELDANZ: 0, PUFFERUNG: '', PROTOKOLL: 'X' },
  },
  KNA1: {
    DD02V_WA: { TABNAME: 'KNA1', DDTEXT: 'General Data in Customer Master', TABCLASS: 'TRANSP', CLIDEP: 'X', CONTFLAG: 'A', MATEFLAG: '', BUFFERED: '' },
    DD09L_WA: { TABNAME: 'KNA1', TABART: 'APPL0', SCHFELDANZ: 0, PUFFERUNG: '', PROTOKOLL: '' },
  },
  KNB1: {
    DD02V_WA: { TABNAME: 'KNB1', DDTEXT: 'Customer Master (Company Code)', TABCLASS: 'TRANSP', CLIDEP: 'X', CONTFLAG: 'A', MATEFLAG: '', BUFFERED: '' },
    DD09L_WA: { TABNAME: 'KNB1', TABART: 'APPL0', SCHFELDANZ: 0, PUFFERUNG: '', PROTOKOLL: '' },
  },
  LFA1: {
    DD02V_WA: { TABNAME: 'LFA1', DDTEXT: 'Vendor Master (General Section)', TABCLASS: 'TRANSP', CLIDEP: 'X', CONTFLAG: 'A', MATEFLAG: '', BUFFERED: '' },
    DD09L_WA: { TABNAME: 'LFA1', TABART: 'APPL0', SCHFELDANZ: 0, PUFFERUNG: '', PROTOKOLL: '' },
  },
  LFB1: {
    DD02V_WA: { TABNAME: 'LFB1', DDTEXT: 'Vendor Master (Company Code)', TABCLASS: 'TRANSP', CLIDEP: 'X', CONTFLAG: 'A', MATEFLAG: '', BUFFERED: '' },
    DD09L_WA: { TABNAME: 'LFB1', TABART: 'APPL0', SCHFELDANZ: 0, PUFFERUNG: '', PROTOKOLL: '' },
  },
  MARA: {
    DD02V_WA: { TABNAME: 'MARA', DDTEXT: 'General Material Data', TABCLASS: 'TRANSP', CLIDEP: 'X', CONTFLAG: 'A', MATEFLAG: '', BUFFERED: '' },
    DD09L_WA: { TABNAME: 'MARA', TABART: 'APPL0', SCHFELDANZ: 0, PUFFERUNG: '', PROTOKOLL: '' },
  },
  MARC: {
    DD02V_WA: { TABNAME: 'MARC', DDTEXT: 'Plant Data for Material', TABCLASS: 'TRANSP', CLIDEP: 'X', CONTFLAG: 'A', MATEFLAG: '', BUFFERED: '' },
    DD09L_WA: { TABNAME: 'MARC', TABART: 'APPL0', SCHFELDANZ: 0, PUFFERUNG: '', PROTOKOLL: '' },
  },
  EKKO: {
    DD02V_WA: { TABNAME: 'EKKO', DDTEXT: 'Purchasing Document Header', TABCLASS: 'TRANSP', CLIDEP: 'X', CONTFLAG: 'A', MATEFLAG: '', BUFFERED: '' },
    DD09L_WA: { TABNAME: 'EKKO', TABART: 'APPL0', SCHFELDANZ: 0, PUFFERUNG: '', PROTOKOLL: '' },
  },
  VBAK: {
    DD02V_WA: { TABNAME: 'VBAK', DDTEXT: 'Sales Document: Header Data', TABCLASS: 'TRANSP', CLIDEP: 'X', CONTFLAG: 'A', MATEFLAG: '', BUFFERED: '' },
    DD09L_WA: { TABNAME: 'VBAK', TABART: 'APPL0', SCHFELDANZ: 0, PUFFERUNG: '', PROTOKOLL: '' },
  },
};

/**
 * Mock foreign key relationships.
 */
const MOCK_FOREIGN_KEYS = {
  BKPF: {
    foreignKeys: [
      { from: 'BKPF', to: 'T001', fields: [{ from: 'BUKRS', to: 'BUKRS' }], type: 'CHECK' },
      { from: 'BKPF', to: 'T003', fields: [{ from: 'BLART', to: 'BLART' }], type: 'CHECK' },
      { from: 'BKPF', to: 'TCURC', fields: [{ from: 'WAERS', to: 'WAERS' }], type: 'CHECK' },
    ],
    textTables: [],
  },
  BSEG: {
    foreignKeys: [
      { from: 'BSEG', to: 'T001', fields: [{ from: 'BUKRS', to: 'BUKRS' }], type: 'CHECK' },
      { from: 'BSEG', to: 'SKA1', fields: [{ from: 'HKONT', to: 'KTOPL' }, { from: 'HKONT', to: 'SAKNR' }], type: 'CHECK' },
      { from: 'BSEG', to: 'CSKS', fields: [{ from: 'KOSTL', to: 'KOSTL' }], type: 'CHECK' },
    ],
    textTables: [],
  },
  KNA1: {
    foreignKeys: [
      { from: 'KNA1', to: 'T005', fields: [{ from: 'LAND1', to: 'LAND1' }], type: 'CHECK' },
      { from: 'KNA1', to: 'T077D', fields: [{ from: 'KTOKD', to: 'KTOKD' }], type: 'CHECK' },
    ],
    textTables: [{ table: 'T077Y', langField: 'SPRAS' }],
  },
  KNB1: {
    foreignKeys: [
      { from: 'KNB1', to: 'KNA1', fields: [{ from: 'KUNNR', to: 'KUNNR' }], type: 'CHECK' },
      { from: 'KNB1', to: 'T001', fields: [{ from: 'BUKRS', to: 'BUKRS' }], type: 'CHECK' },
      { from: 'KNB1', to: 'SKA1', fields: [{ from: 'AKONT', to: 'SAKNR' }], type: 'CHECK' },
      { from: 'KNB1', to: 'T052', fields: [{ from: 'ZTERM', to: 'ZTERM' }], type: 'CHECK' },
    ],
    textTables: [],
  },
  LFA1: {
    foreignKeys: [
      { from: 'LFA1', to: 'T005', fields: [{ from: 'LAND1', to: 'LAND1' }], type: 'CHECK' },
      { from: 'LFA1', to: 'T077K', fields: [{ from: 'KTOKK', to: 'KTOKK' }], type: 'CHECK' },
    ],
    textTables: [{ table: 'T077Z', langField: 'SPRAS' }],
  },
  LFB1: {
    foreignKeys: [
      { from: 'LFB1', to: 'LFA1', fields: [{ from: 'LIFNR', to: 'LIFNR' }], type: 'CHECK' },
      { from: 'LFB1', to: 'T001', fields: [{ from: 'BUKRS', to: 'BUKRS' }], type: 'CHECK' },
      { from: 'LFB1', to: 'SKA1', fields: [{ from: 'AKONT', to: 'SAKNR' }], type: 'CHECK' },
      { from: 'LFB1', to: 'T052', fields: [{ from: 'ZTERM', to: 'ZTERM' }], type: 'CHECK' },
    ],
    textTables: [],
  },
  MARA: {
    foreignKeys: [
      { from: 'MARA', to: 'T134', fields: [{ from: 'MTART', to: 'MTART' }], type: 'CHECK' },
      { from: 'MARA', to: 'T137', fields: [{ from: 'MBRSH', to: 'MBRSH' }], type: 'CHECK' },
      { from: 'MARA', to: 'T023', fields: [{ from: 'MATKL', to: 'MATKL' }], type: 'CHECK' },
      { from: 'MARA', to: 'T006', fields: [{ from: 'MEINS', to: 'MSEHI' }], type: 'CHECK' },
    ],
    textTables: [{ table: 'MAKT', langField: 'SPRAS' }],
  },
  MARC: {
    foreignKeys: [
      { from: 'MARC', to: 'MARA', fields: [{ from: 'MATNR', to: 'MATNR' }], type: 'CHECK' },
      { from: 'MARC', to: 'T001W', fields: [{ from: 'WERKS', to: 'WERKS' }], type: 'CHECK' },
      { from: 'MARC', to: 'T024', fields: [{ from: 'EKGRP', to: 'EKGRP' }], type: 'CHECK' },
      { from: 'MARC', to: 'T024D', fields: [{ from: 'DISPO', to: 'DTEFM' }], type: 'CHECK' },
    ],
    textTables: [],
  },
  EKKO: {
    foreignKeys: [
      { from: 'EKKO', to: 'T001', fields: [{ from: 'BUKRS', to: 'BUKRS' }], type: 'CHECK' },
      { from: 'EKKO', to: 'LFA1', fields: [{ from: 'LIFNR', to: 'LIFNR' }], type: 'CHECK' },
      { from: 'EKKO', to: 'T024E', fields: [{ from: 'EKORG', to: 'EKORG' }], type: 'CHECK' },
      { from: 'EKKO', to: 'T024', fields: [{ from: 'EKGRP', to: 'EKGRP' }], type: 'CHECK' },
      { from: 'EKKO', to: 'T161', fields: [{ from: 'BSART', to: 'BSART' }], type: 'CHECK' },
      { from: 'EKKO', to: 'TCURC', fields: [{ from: 'WAERS', to: 'WAERS' }], type: 'CHECK' },
    ],
    textTables: [],
  },
  VBAK: {
    foreignKeys: [
      { from: 'VBAK', to: 'KNA1', fields: [{ from: 'KUNNR', to: 'KUNNR' }], type: 'CHECK' },
      { from: 'VBAK', to: 'TVAK', fields: [{ from: 'AUART', to: 'AUART' }], type: 'CHECK' },
      { from: 'VBAK', to: 'TVKO', fields: [{ from: 'VKORG', to: 'VKORG' }], type: 'CHECK' },
      { from: 'VBAK', to: 'TVTW', fields: [{ from: 'VTWEG', to: 'VTWEG' }], type: 'CHECK' },
      { from: 'VBAK', to: 'TSPA', fields: [{ from: 'SPART', to: 'SPART' }], type: 'CHECK' },
      { from: 'VBAK', to: 'TCURC', fields: [{ from: 'WAERK', to: 'WAERS' }], type: 'CHECK' },
    ],
    textTables: [],
  },
};

/**
 * Mock domain values for common SAP domains.
 */
const MOCK_DOMAIN_VALUES = {
  BLART: [
    { DOMVALUE_L: 'AB', DDTEXT: 'Accounting document' },
    { DOMVALUE_L: 'AF', DDTEXT: 'Dep. posting' },
    { DOMVALUE_L: 'DA', DDTEXT: 'Customer document' },
    { DOMVALUE_L: 'DG', DDTEXT: 'Customer credit memo' },
    { DOMVALUE_L: 'DZ', DDTEXT: 'Customer payment' },
    { DOMVALUE_L: 'KA', DDTEXT: 'Vendor document' },
    { DOMVALUE_L: 'KG', DDTEXT: 'Vendor credit memo' },
    { DOMVALUE_L: 'KZ', DDTEXT: 'Vendor payment' },
    { DOMVALUE_L: 'RE', DDTEXT: 'Invoice - Loss' },
    { DOMVALUE_L: 'SA', DDTEXT: 'G/L account document' },
    { DOMVALUE_L: 'WE', DDTEXT: 'Goods receipt' },
    { DOMVALUE_L: 'WL', DDTEXT: 'Goods issue' },
  ],
  KOART: [
    { DOMVALUE_L: 'A', DDTEXT: 'Assets' },
    { DOMVALUE_L: 'D', DDTEXT: 'Customer' },
    { DOMVALUE_L: 'K', DDTEXT: 'Vendor' },
    { DOMVALUE_L: 'M', DDTEXT: 'Material' },
    { DOMVALUE_L: 'S', DDTEXT: 'G/L Account' },
  ],
  BSTYP: [
    { DOMVALUE_L: 'A', DDTEXT: 'Request for Quotation' },
    { DOMVALUE_L: 'F', DDTEXT: 'Purchase Order' },
    { DOMVALUE_L: 'K', DDTEXT: 'Contract' },
    { DOMVALUE_L: 'L', DDTEXT: 'Scheduling Agreement' },
  ],
  MTART: [
    { DOMVALUE_L: 'FERT', DDTEXT: 'Finished Product' },
    { DOMVALUE_L: 'HALB', DDTEXT: 'Semifinished Product' },
    { DOMVALUE_L: 'ROH', DDTEXT: 'Raw Material' },
    { DOMVALUE_L: 'HIBE', DDTEXT: 'Operating Supplies' },
    { DOMVALUE_L: 'ERSA', DDTEXT: 'Spare Parts' },
    { DOMVALUE_L: 'DIEN', DDTEXT: 'Service' },
    { DOMVALUE_L: 'NLAG', DDTEXT: 'Non-Stock Material' },
    { DOMVALUE_L: 'VERP', DDTEXT: 'Packaging Material' },
  ],
  SHKZG: [
    { DOMVALUE_L: 'H', DDTEXT: 'Credit' },
    { DOMVALUE_L: 'S', DDTEXT: 'Debit' },
  ],
  WAERS: [
    { DOMVALUE_L: 'EUR', DDTEXT: 'European Euro' },
    { DOMVALUE_L: 'USD', DDTEXT: 'US Dollar' },
    { DOMVALUE_L: 'GBP', DDTEXT: 'British Pound' },
    { DOMVALUE_L: 'JPY', DDTEXT: 'Japanese Yen' },
    { DOMVALUE_L: 'CHF', DDTEXT: 'Swiss Franc' },
    { DOMVALUE_L: 'CAD', DDTEXT: 'Canadian Dollar' },
  ],
};

/**
 * Mock data element information.
 */
const MOCK_DATA_ELEMENTS = {
  BUKRS: { ROLLNAME: 'BUKRS', DOMNAME: 'BUKRS', DATATYPE: 'CHAR', LENG: 4, DECIMALS: 0, DDTEXT: 'Company Code', REPTEXT: 'CoCd', SCRTEXT_S: 'CoCd', SCRTEXT_M: 'Company Code', SCRTEXT_L: 'Company Code' },
  BELNR_D: { ROLLNAME: 'BELNR_D', DOMNAME: 'BELNR', DATATYPE: 'CHAR', LENG: 10, DECIMALS: 0, DDTEXT: 'Accounting Document Number', REPTEXT: 'Doc.No.', SCRTEXT_S: 'Doc.No.', SCRTEXT_M: 'Document Number', SCRTEXT_L: 'Accounting Document Number' },
  GJAHR: { ROLLNAME: 'GJAHR', DOMNAME: 'GJAHR', DATATYPE: 'NUMC', LENG: 4, DECIMALS: 0, DDTEXT: 'Fiscal Year', REPTEXT: 'Year', SCRTEXT_S: 'Year', SCRTEXT_M: 'Fiscal Year', SCRTEXT_L: 'Fiscal Year' },
  KUNNR: { ROLLNAME: 'KUNNR', DOMNAME: 'KUNNR', DATATYPE: 'CHAR', LENG: 10, DECIMALS: 0, DDTEXT: 'Customer Number', REPTEXT: 'Cust.', SCRTEXT_S: 'Cust.', SCRTEXT_M: 'Customer', SCRTEXT_L: 'Customer Number' },
  LIFNR: { ROLLNAME: 'LIFNR', DOMNAME: 'LIFNR', DATATYPE: 'CHAR', LENG: 10, DECIMALS: 0, DDTEXT: 'Account Number of Vendor or Creditor', REPTEXT: 'Vendor', SCRTEXT_S: 'Vendor', SCRTEXT_M: 'Vendor', SCRTEXT_L: 'Vendor Account Number' },
  MATNR: { ROLLNAME: 'MATNR', DOMNAME: 'MATNR', DATATYPE: 'CHAR', LENG: 18, DECIMALS: 0, DDTEXT: 'Material Number', REPTEXT: 'Material', SCRTEXT_S: 'Material', SCRTEXT_M: 'Material', SCRTEXT_L: 'Material Number' },
  EBELN: { ROLLNAME: 'EBELN', DOMNAME: 'EBELN', DATATYPE: 'CHAR', LENG: 10, DECIMALS: 0, DDTEXT: 'Purchasing Document Number', REPTEXT: 'Pur.Doc.', SCRTEXT_S: 'PDoc', SCRTEXT_M: 'Purch. Doc.', SCRTEXT_L: 'Purchasing Document Number' },
  VBELN_VA: { ROLLNAME: 'VBELN_VA', DOMNAME: 'VBELN', DATATYPE: 'CHAR', LENG: 10, DECIMALS: 0, DDTEXT: 'Sales Document', REPTEXT: 'SalesDoc', SCRTEXT_S: 'SDoc', SCRTEXT_M: 'Sales Document', SCRTEXT_L: 'Sales Document' },
  WAERS: { ROLLNAME: 'WAERS', DOMNAME: 'WAERS', DATATYPE: 'CUKY', LENG: 5, DECIMALS: 0, DDTEXT: 'Currency Key', REPTEXT: 'Crcy', SCRTEXT_S: 'Crcy', SCRTEXT_M: 'Currency', SCRTEXT_L: 'Currency Key' },
  DMBTR: { ROLLNAME: 'DMBTR', DOMNAME: 'DMBTR', DATATYPE: 'CURR', LENG: 13, DECIMALS: 2, DDTEXT: 'Amount in Local Currency', REPTEXT: 'LC Amt', SCRTEXT_S: 'LC Amt', SCRTEXT_M: 'Loc.Curr. Amt', SCRTEXT_L: 'Amount in Local Currency' },
};

class TableIntelligence {
  /**
   * @param {object} rfcPoolOrMock - RFC pool for live calls, or null/mock for mock mode
   * @param {object} [options]
   * @param {string} [options.mode='mock'] - 'mock' or 'live'
   * @param {object} [options.logger] - Logger instance
   */
  constructor(rfcPoolOrMock, options = {}) {
    this.pool = rfcPoolOrMock;
    this.mode = options.mode || 'mock';
    this.log = options.logger || new Logger('table-intelligence', { level: 'warn' });
    this._cache = new Map();
  }

  // ── Field Info (DFIES) ──────────────────────────────────────────────

  /**
   * Get detailed field information for a table via DDIF_FIELDINFO_GET.
   * Returns DFIES_TAB with full metadata for each field.
   * @param {string} tableName - SAP table name
   * @returns {Array<{fieldName: string, dataElement: string, domain: string, dataType: string, length: number, decimals: number, checkTable: string, fieldText: string, conversionRoutine: string, isKey: boolean, internalType: string, refTable: string, refField: string}>}
   */
  async getFieldInfo(tableName) {
    if (this.mode === 'mock') {
      return this._mockGetFieldInfo(tableName);
    }

    const client = await this.pool.acquire();
    try {
      const result = await client.call('DDIF_FIELDINFO_GET', {
        TABNAME: tableName,
        LANGU: 'E',
        ALLTYPES: 'X',
      });

      const dfiesTab = result.DFIES_TAB || [];
      return dfiesTab.map(field => ({
        fieldName: (field.FIELDNAME || '').trim(),
        dataElement: (field.ROLLNAME || '').trim(),
        domain: (field.DOMNAME || '').trim(),
        dataType: (field.DATATYPE || '').trim(),
        length: parseInt(field.LENG || '0', 10),
        decimals: parseInt(field.DECIMALS || '0', 10),
        checkTable: (field.CHECKTABLE || '').trim(),
        fieldText: (field.FIELDTEXT || '').trim(),
        conversionRoutine: (field.CONVEXIT || '').trim(),
        isKey: field.KEYFLAG === 'X',
        internalType: (field.INTTYPE || '').trim(),
        refTable: (field.REFTABLE || '').trim(),
        refField: (field.REFFIELD || '').trim(),
      }));
    } finally {
      await this.pool.release(client);
    }
  }

  // ── Table Definition (DD02V, DD03P, DD05M, DD08V, DD35V, DD09L) ───

  /**
   * Get complete table definition via DDIF_TABL_GET.
   * Returns header, fields, foreign keys, relationships, search helps, and tech settings.
   * @param {string} tableName - SAP table name
   * @returns {{DD02V_WA: object, DD03P_TAB: Array, DD05M_TAB: Array, DD08V_TAB: Array, DD35V_TAB: Array, DD09L_WA: object}}
   */
  async getTableDefinition(tableName) {
    if (this.mode === 'mock') {
      return this._mockGetTableDefinition(tableName);
    }

    const client = await this.pool.acquire();
    try {
      const result = await client.call('DDIF_TABL_GET', {
        NAME: tableName,
        LANGU: 'E',
      });

      return {
        DD02V_WA: result.DD02V_WA || {},
        DD03P_TAB: (result.DD03P_TAB || []).map(field => ({
          FIELDNAME: (field.FIELDNAME || '').trim(),
          ROLLNAME: (field.ROLLNAME || '').trim(),
          DOMNAME: (field.DOMNAME || '').trim(),
          DATATYPE: (field.DATATYPE || '').trim(),
          LENG: parseInt(field.LENG || '0', 10),
          DECIMALS: parseInt(field.DECIMALS || '0', 10),
          KEYFLAG: (field.KEYFLAG || '').trim(),
          CHECKTABLE: (field.CHECKTABLE || '').trim(),
          DDTEXT: (field.DDTEXT || '').trim(),
        })),
        DD05M_TAB: result.DD05M_TAB || [],
        DD08V_TAB: result.DD08V_TAB || [],
        DD35V_TAB: result.DD35V_TAB || [],
        DD09L_WA: result.DD09L_WA || {},
      };
    } finally {
      await this.pool.release(client);
    }
  }

  // ── Foreign Key Discovery ───────────────────────────────────────────

  /**
   * Discover foreign key relationships for a table.
   * 4-step process:
   * 1. Read DD03L CHECKTABLE for the table
   * 2. Read DD08L for foreign key definitions
   * 3. Read DD05S for field mappings
   * 4. Identify text tables (FRKART='TEXT')
   * @param {string} tableName - SAP table name
   * @returns {{foreignKeys: Array<{from: string, to: string, fields: Array<{from: string, to: string}>, type: string}>, textTables: Array<{table: string, langField: string}>}}
   */
  async discoverForeignKeys(tableName) {
    if (this.mode === 'mock') {
      return this._mockDiscoverForeignKeys(tableName);
    }

    const client = await this.pool.acquire();
    try {
      // Step 1: Read DD03L to find fields with check tables
      const dd03lResult = await client.call('RFC_READ_TABLE', {
        QUERY_TABLE: 'DD03L',
        DELIMITER: '|',
        FIELDS: [
          { FIELDNAME: 'FIELDNAME' },
          { FIELDNAME: 'CHECKTABLE' },
        ],
        OPTIONS: [{ TEXT: `TABNAME = '${tableName}'` }],
      });

      const checkTableFields = this._parseRfcTableResult(dd03lResult)
        .filter(row => row.CHECKTABLE && row.CHECKTABLE.trim() !== '' && row.CHECKTABLE.trim() !== '*');

      // Step 2: Read DD08L for foreign key definitions
      const dd08lResult = await client.call('RFC_READ_TABLE', {
        QUERY_TABLE: 'DD08L',
        DELIMITER: '|',
        FIELDS: [
          { FIELDNAME: 'TABNAME' },
          { FIELDNAME: 'CHECKTABLE' },
          { FIELDNAME: 'FRKART' },
          { FIELDNAME: 'FIELDNAME' },
        ],
        OPTIONS: [{ TEXT: `TABNAME = '${tableName}'` }],
      });

      const fkDefinitions = this._parseRfcTableResult(dd08lResult);

      // Step 3: Read DD05S for field mappings
      const dd05sResult = await client.call('RFC_READ_TABLE', {
        QUERY_TABLE: 'DD05S',
        DELIMITER: '|',
        FIELDS: [
          { FIELDNAME: 'TABNAME' },
          { FIELDNAME: 'FIELDNAME' },
          { FIELDNAME: 'FORTABLE' },
          { FIELDNAME: 'FORKEY' },
          { FIELDNAME: 'CHECKTABLE' },
        ],
        OPTIONS: [{ TEXT: `TABNAME = '${tableName}'` }],
      });

      const fieldMappings = this._parseRfcTableResult(dd05sResult);

      // Step 4: Build foreign key list and identify text tables
      const fkMap = new Map();
      const textTables = [];

      for (const fk of fkDefinitions) {
        const checkTable = (fk.CHECKTABLE || '').trim();
        const frkart = (fk.FRKART || '').trim();

        if (frkart === 'TEXT') {
          // Identify language field for text table
          const langField = this._findLanguageField(fieldMappings, checkTable);
          textTables.push({ table: checkTable, langField });
          continue;
        }

        if (!fkMap.has(checkTable)) {
          fkMap.set(checkTable, { from: tableName, to: checkTable, fields: [], type: frkart || 'CHECK' });
        }
      }

      // Map fields to their foreign key targets
      for (const mapping of fieldMappings) {
        const checkTable = (mapping.CHECKTABLE || mapping.FORTABLE || '').trim();
        if (fkMap.has(checkTable)) {
          const fk = fkMap.get(checkTable);
          fk.fields.push({
            from: (mapping.FIELDNAME || '').trim(),
            to: (mapping.FORKEY || '').trim(),
          });
        }
      }

      // Add foreign keys from check table fields that might not be in DD08L
      for (const ctf of checkTableFields) {
        const ct = ctf.CHECKTABLE.trim();
        if (!fkMap.has(ct)) {
          fkMap.set(ct, {
            from: tableName,
            to: ct,
            fields: [{ from: (ctf.FIELDNAME || '').trim(), to: (ctf.FIELDNAME || '').trim() }],
            type: 'CHECK',
          });
        }
      }

      return {
        foreignKeys: Array.from(fkMap.values()),
        textTables,
      };
    } finally {
      await this.pool.release(client);
    }
  }

  // ── Relationship Graph ──────────────────────────────────────────────

  /**
   * Recursively discover related tables up to a specified depth.
   * Returns an adjacency list representation of the relationship graph.
   * @param {string} tableName - Starting table
   * @param {number} [depth=1] - Max recursion depth (1-5)
   * @returns {Object<string, Array<{table: string, type: string, fields: Array}>>}
   */
  async getRelationshipGraph(tableName, depth = 1) {
    depth = Math.min(Math.max(depth, 1), 5);
    const graph = {};
    const visited = new Set();

    await this._buildGraph(tableName, depth, graph, visited);

    return graph;
  }

  // ── Domain Values ───────────────────────────────────────────────────

  /**
   * Get fixed values for a domain from DD07L.
   * @param {string} domainName - SAP domain name
   * @returns {Array<{value: string, description: string}>}
   */
  async getDomainValues(domainName) {
    if (this.mode === 'mock') {
      return this._mockGetDomainValues(domainName);
    }

    const client = await this.pool.acquire();
    try {
      const result = await client.call('RFC_READ_TABLE', {
        QUERY_TABLE: 'DD07L',
        DELIMITER: '|',
        FIELDS: [
          { FIELDNAME: 'DOMVALUE_L' },
          { FIELDNAME: 'DDTEXT' },
        ],
        OPTIONS: [
          { TEXT: `DOMNAME = '${domainName}' AND DDLANGUAGE = 'E'` },
        ],
      });

      const rows = this._parseRfcTableResult(result);
      return rows.map(row => ({
        value: (row.DOMVALUE_L || '').trim(),
        description: (row.DDTEXT || '').trim(),
      }));
    } finally {
      await this.pool.release(client);
    }
  }

  // ── Data Element Info ───────────────────────────────────────────────

  /**
   * Get detailed data element information from DD04L/DD04T.
   * @param {string} dataElement - Data element name (ROLLNAME)
   * @returns {{rollName: string, domainName: string, dataType: string, length: number, decimals: number, description: string, repText: string, shortText: string, mediumText: string, longText: string}}
   */
  async getDataElementInfo(dataElement) {
    if (this.mode === 'mock') {
      return this._mockGetDataElementInfo(dataElement);
    }

    const client = await this.pool.acquire();
    try {
      // Read DD04L for technical attributes
      const dd04lResult = await client.call('RFC_READ_TABLE', {
        QUERY_TABLE: 'DD04L',
        DELIMITER: '|',
        FIELDS: [
          { FIELDNAME: 'ROLLNAME' },
          { FIELDNAME: 'DOMNAME' },
          { FIELDNAME: 'DATATYPE' },
          { FIELDNAME: 'LENG' },
          { FIELDNAME: 'DECIMALS' },
        ],
        OPTIONS: [{ TEXT: `ROLLNAME = '${dataElement}'` }],
      });

      const dd04lRows = this._parseRfcTableResult(dd04lResult);
      if (dd04lRows.length === 0) {
        return null;
      }

      const tech = dd04lRows[0];

      // Read DD04T for text descriptions
      const dd04tResult = await client.call('RFC_READ_TABLE', {
        QUERY_TABLE: 'DD04T',
        DELIMITER: '|',
        FIELDS: [
          { FIELDNAME: 'DDTEXT' },
          { FIELDNAME: 'REPTEXT' },
          { FIELDNAME: 'SCRTEXT_S' },
          { FIELDNAME: 'SCRTEXT_M' },
          { FIELDNAME: 'SCRTEXT_L' },
        ],
        OPTIONS: [
          { TEXT: `ROLLNAME = '${dataElement}' AND DDLANGUAGE = 'E'` },
        ],
      });

      const dd04tRows = this._parseRfcTableResult(dd04tResult);
      const texts = dd04tRows.length > 0 ? dd04tRows[0] : {};

      return {
        rollName: (tech.ROLLNAME || '').trim(),
        domainName: (tech.DOMNAME || '').trim(),
        dataType: (tech.DATATYPE || '').trim(),
        length: parseInt(tech.LENG || '0', 10),
        decimals: parseInt(tech.DECIMALS || '0', 10),
        description: (texts.DDTEXT || '').trim(),
        repText: (texts.REPTEXT || '').trim(),
        shortText: (texts.SCRTEXT_S || '').trim(),
        mediumText: (texts.SCRTEXT_M || '').trim(),
        longText: (texts.SCRTEXT_L || '').trim(),
      };
    } finally {
      await this.pool.release(client);
    }
  }

  // ── Private: Graph Builder ──────────────────────────────────────────

  async _buildGraph(tableName, remainingDepth, graph, visited) {
    if (visited.has(tableName) || remainingDepth < 0) return;
    visited.add(tableName);

    const fkData = await this.discoverForeignKeys(tableName);
    const neighbors = [];

    for (const fk of fkData.foreignKeys) {
      neighbors.push({
        table: fk.to,
        type: fk.type,
        fields: fk.fields,
      });
    }

    for (const tt of fkData.textTables) {
      neighbors.push({
        table: tt.table,
        type: 'TEXT',
        fields: [{ from: 'SPRAS', to: tt.langField }],
      });
    }

    graph[tableName] = neighbors;

    if (remainingDepth > 0) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.table)) {
          await this._buildGraph(neighbor.table, remainingDepth - 1, graph, visited);
        }
      }
    }
  }

  // ── Private: RFC Table Result Parser ────────────────────────────────

  _parseRfcTableResult(result) {
    const fieldInfo = (result.FIELDS || []).map(f => ({
      name: (f.FIELDNAME || '').trim(),
      offset: parseInt(f.OFFSET || '0', 10),
      length: parseInt(f.LENGTH || '0', 10),
    }));

    return (result.DATA || []).map(row => {
      const wa = row.WA || '';
      const record = {};
      for (const fi of fieldInfo) {
        record[fi.name] = wa.substring(fi.offset, fi.offset + fi.length).trim();
      }
      return record;
    });
  }

  _findLanguageField(fieldMappings, checkTable) {
    for (const mapping of fieldMappings) {
      const targetTable = (mapping.FORTABLE || mapping.CHECKTABLE || '').trim();
      if (targetTable === checkTable) {
        const forKey = (mapping.FORKEY || '').trim();
        if (forKey === 'SPRAS' || forKey === 'LANGU' || forKey === 'SPRACHE' || forKey === 'DDLANGUAGE') {
          return forKey;
        }
      }
    }
    return 'SPRAS'; // Default language field
  }

  // ── Mock Implementations ────────────────────────────────────────────

  _mockGetFieldInfo(tableName) {
    const mockFields = MOCK_FIELD_INFO[tableName];
    if (!mockFields) {
      return [];
    }

    return mockFields.map(field => ({
      fieldName: (field.FIELDNAME || '').trim(),
      dataElement: (field.ROLLNAME || '').trim(),
      domain: (field.DOMNAME || '').trim(),
      dataType: (field.DATATYPE || '').trim(),
      length: parseInt(field.LENG || '0', 10),
      decimals: parseInt(field.DECIMALS || '0', 10),
      checkTable: (field.CHECKTABLE || '').trim(),
      fieldText: (field.FIELDTEXT || '').trim(),
      conversionRoutine: (field.CONVEXIT || '').trim(),
      isKey: field.KEYFLAG === 'X',
      internalType: (field.INTTYPE || '').trim(),
      refTable: (field.REFTABLE || '').trim(),
      refField: (field.REFFIELD || '').trim(),
    }));
  }

  _mockGetTableDefinition(tableName) {
    const tableDef = MOCK_TABLE_DEFINITIONS[tableName];
    const fieldInfo = MOCK_FIELD_INFO[tableName];

    if (!tableDef || !fieldInfo) {
      return {
        DD02V_WA: { TABNAME: tableName, DDTEXT: `Table ${tableName}`, TABCLASS: 'TRANSP', CLIDEP: 'X', CONTFLAG: 'A', MATEFLAG: '', BUFFERED: '' },
        DD03P_TAB: [],
        DD05M_TAB: [],
        DD08V_TAB: [],
        DD35V_TAB: [],
        DD09L_WA: { TABNAME: tableName, TABART: 'APPL0', SCHFELDANZ: 0, PUFFERUNG: '', PROTOKOLL: '' },
      };
    }

    const dd03pTab = fieldInfo.map(f => ({
      FIELDNAME: f.FIELDNAME,
      ROLLNAME: f.ROLLNAME,
      DOMNAME: f.DOMNAME,
      DATATYPE: f.DATATYPE,
      LENG: parseInt(f.LENG || '0', 10),
      DECIMALS: parseInt(f.DECIMALS || '0', 10),
      KEYFLAG: f.KEYFLAG,
      CHECKTABLE: f.CHECKTABLE,
      DDTEXT: f.FIELDTEXT,
    }));

    const fkData = MOCK_FOREIGN_KEYS[tableName] || { foreignKeys: [], textTables: [] };
    const dd05mTab = fkData.foreignKeys.map(fk => ({
      TABNAME: tableName,
      FORTABLE: fk.to,
      FIELDNAME: fk.fields.length > 0 ? fk.fields[0].from : '',
      FORKEY: fk.fields.length > 0 ? fk.fields[0].to : '',
    }));

    const dd08vTab = fkData.foreignKeys.map(fk => ({
      TABNAME: tableName,
      CHECKTABLE: fk.to,
      FRKART: fk.type === 'TEXT' ? 'TEXT' : '',
    }));

    const dd35vTab = [];

    return {
      DD02V_WA: tableDef.DD02V_WA,
      DD03P_TAB: dd03pTab,
      DD05M_TAB: dd05mTab,
      DD08V_TAB: dd08vTab,
      DD35V_TAB: dd35vTab,
      DD09L_WA: tableDef.DD09L_WA,
    };
  }

  _mockDiscoverForeignKeys(tableName) {
    const fkData = MOCK_FOREIGN_KEYS[tableName];
    if (!fkData) {
      return { foreignKeys: [], textTables: [] };
    }
    return {
      foreignKeys: [...fkData.foreignKeys],
      textTables: [...fkData.textTables],
    };
  }

  _mockGetDomainValues(domainName) {
    const values = MOCK_DOMAIN_VALUES[domainName];
    if (!values) {
      return [];
    }
    return values.map(v => ({
      value: v.DOMVALUE_L,
      description: v.DDTEXT,
    }));
  }

  _mockGetDataElementInfo(dataElement) {
    const dtel = MOCK_DATA_ELEMENTS[dataElement];
    if (!dtel) {
      return null;
    }
    return {
      rollName: dtel.ROLLNAME,
      domainName: dtel.DOMNAME,
      dataType: dtel.DATATYPE,
      length: dtel.LENG,
      decimals: dtel.DECIMALS,
      description: dtel.DDTEXT,
      repText: dtel.REPTEXT,
      shortText: dtel.SCRTEXT_S,
      mediumText: dtel.SCRTEXT_M,
      longText: dtel.SCRTEXT_L,
    };
  }
}

module.exports = TableIntelligence;
