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
 * Module-Specific Transforms: FI, CO, SD, MM
 *
 * Comment/flag transforms for SAP module-specific compatibility rules.
 * Each transform inserts a TODO comment before matching ABAP code lines.
 */

function createCommentTransform(id, description, pattern, todoMessage) {
  return {
    id,
    description,
    apply(source, finding) {
      const changes = [];
      const srcLines = source.split('\n');
      const result = [];
      const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'gi');
      for (let i = 0; i < srcLines.length; i++) {
        const prevLine = i > 0 ? srcLines[i - 1] : '';
        if (regex.test(srcLines[i]) && !prevLine.includes('TODO(S/4)') && !srcLines[i].includes('TODO(S/4)')) {
          result.push('* TODO(S/4): ' + todoMessage);
          result.push(srcLines[i]);
          changes.push({ type: 'comment', note: todoMessage, line: i + 1 });
        } else {
          result.push(srcLines[i]);
        }
        regex.lastIndex = 0;
      }
      return { source: result.join('\n'), changes };
    },
  };
}

function createFlagTransform(id, description, pattern, flagMessage) {
  return {
    id,
    description,
    apply(source, finding) {
      const changes = [];
      const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'gi');
      const srcLines = source.split('\n');
      for (let i = 0; i < srcLines.length; i++) {
        if (regex.test(srcLines[i])) {
          changes.push({ type: 'flag', note: flagMessage, line: i + 1 });
        }
        regex.lastIndex = 0;
      }
      return { source, changes };
    },
  };
}

const transforms = {};

transforms['SIMPL-FI-001'] = createCommentTransform(
  'SIMPL-FI-001',
  'BSEG direct access removed',
  /\bBSEG\b/gi,
  'BSEG direct access removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-002'] = createCommentTransform(
  'SIMPL-FI-002',
  'Customer/Vendor line item tables removed',
  /\b(BSID|BSIK|BSAD|BSAK)\b/gi,
  'Customer/Vendor line item tables removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-003'] = createCommentTransform(
  'SIMPL-FI-003',
  'GL line item tables removed',
  /\b(BSIS|BSAS)\b/gi,
  'GL line item tables removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-004'] = createCommentTransform(
  'SIMPL-FI-004',
  'BKPF header table restructured',
  /\bSELECT\s+.*\bFROM\s+BKPF\b/gi,
  'BKPF header table restructured - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-008'] = createCommentTransform(
  'SIMPL-FI-008',
  'Special ledger tables (GLT*) removed',
  /\bGLT[1-9]\b/gi,
  'Special ledger tables (GLT*) removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-009'] = createCommentTransform(
  'SIMPL-FI-009',
  'Document splitting config changed',
  /\b(FAGL_SPLINFO|FAGL_SPLIT_|BSEG_ADD)\b/gi,
  'Document splitting config changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-012'] = createCommentTransform(
  'SIMPL-FI-012',
  'ANLB depreciation areas changed',
  /\bANLB\b/gi,
  'ANLB depreciation areas changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-013'] = createCommentTransform(
  'SIMPL-FI-013',
  'Asset BAPIs deprecated',
  /\bBAPI_ASSET_(POSTCAP|RETIREMENT|ACQUISITION|TRANSFER)\b/gi,
  'Asset BAPIs deprecated - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-014'] = createCommentTransform(
  'SIMPL-FI-014',
  'ANLA asset master changes',
  /\bANLA\b(?!.*CDS)/gi,
  'ANLA asset master changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-015'] = createCommentTransform(
  'SIMPL-FI-015',
  'Payment program RFFOUS_T changes',
  /\bRFFOUS_T\b/gi,
  'Payment program RFFOUS_T changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-017'] = createCommentTransform(
  'SIMPL-FI-017',
  'Vendor open items BSIK removed',
  /\bBSIK\b/gi,
  'Vendor open items BSIK removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-018'] = createCommentTransform(
  'SIMPL-FI-018',
  'Dispute management changes',
  /\b(UDM_DISPUTE|FDM_CUST)\b/gi,
  'Dispute management changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-019'] = createCommentTransform(
  'SIMPL-FI-019',
  'Customer open items BSID removed',
  /\bBSID\b/gi,
  'Customer open items BSID removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-020'] = createCommentTransform(
  'SIMPL-FI-020',
  'Electronic bank statement changes',
  /\b(FEBEP|FEBKO|FEBA)\b/gi,
  'Electronic bank statement changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-021'] = createCommentTransform(
  'SIMPL-FI-021',
  'Tax reporting changes',
  /\bBSET\b/gi,
  'Tax reporting changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-022'] = createCommentTransform(
  'SIMPL-FI-022',
  'Withholding tax table changes',
  /\bWITH_ITEM\b/gi,
  'Withholding tax table changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-023'] = createCommentTransform(
  'SIMPL-FI-023',
  'Foreign currency valuation changes',
  /\bSAPF100\b/gi,
  'Foreign currency valuation changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-024'] = createCommentTransform(
  'SIMPL-FI-024',
  'GR/IR clearing changes',
  /\bWRX\b/gi,
  'GR/IR clearing changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-025'] = createCommentTransform(
  'SIMPL-FI-025',
  'Classic FI reports deprecated',
  /\b(FBL1N|FBL3N|FBL5N|FAGLL03)\b/gi,
  'Classic FI reports deprecated - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-026'] = createCommentTransform(
  'SIMPL-FI-026',
  'Report Writer/Painter compatibility',
  /\b(GR55|GRR[1-9])\b/gi,
  'Report Writer/Painter compatibility - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-027'] = createCommentTransform(
  'SIMPL-FI-027',
  'Cost element tables CSKA/CSKB removed',
  /\b(CSKA|CSKB)\b/gi,
  'Cost element tables CSKA/CSKB removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-028'] = createCommentTransform(
  'SIMPL-FI-028',
  'Ledger group access changes',
  /\b(FINSC_LEDGER|FAGL_TLDGRP)\b/gi,
  'Ledger group access changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-029'] = createCommentTransform(
  'SIMPL-FI-029',
  'Classic consolidation (EC-CS) removed',
  /\b(ECMCA|ECMCT|EC_CS)\b/gi,
  'Classic consolidation (EC-CS) removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-030'] = createCommentTransform(
  'SIMPL-FI-030',
  'Classic cash management replaced',
  /\b(FDSR|FLQIT|FLQITEM)\b/gi,
  'Classic cash management replaced - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-032'] = createCommentTransform(
  'SIMPL-FI-032',
  'Parallel valuation mandatory in new Asset Accounting',
  /\b(ANKA|T093_).*\b(DELTA|AFABER)\b/gi,
  'Parallel valuation mandatory in new Asset Accounting - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-033'] = createCommentTransform(
  'SIMPL-FI-033',
  'Depreciation areas must post to ACDOCA ledger',
  /\bT093B\b/gi,
  'Depreciation areas must post to ACDOCA ledger - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-034'] = createCommentTransform(
  'SIMPL-FI-034',
  'Asset depreciation run AFAB changes for new AA',
  /\bAFAB\b/gi,
  'Asset depreciation run AFAB changes for new AA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-035'] = createCommentTransform(
  'SIMPL-FI-035',
  'ANKT asset text table restructured',
  /\b(ANKT|ANKA)\b/gi,
  'ANKT asset text table restructured - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-036'] = createCommentTransform(
  'SIMPL-FI-036',
  'Bank Communication Management replaces classic DMEE',
  /\b(DMEE|OBPM1|DMEE_TREE)\b/gi,
  'Bank Communication Management replaces classic DMEE - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-037'] = createCommentTransform(
  'SIMPL-FI-037',
  'Classic lockbox processing replaced',
  /\b(FLB2|FI_LOCKBOX_IMPORT|FLBP)\b/gi,
  'Classic lockbox processing replaced - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-038'] = createCommentTransform(
  'SIMPL-FI-038',
  'Payment Medium Workbench format changes',
  /\b(RFFO[A-Z]{2,4}|RFFOD__|RFFOE__|RFFOBR_U)\b/gi,
  'Payment Medium Workbench format changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-039'] = createCommentTransform(
  'SIMPL-FI-039',
  'Bank account master data BAM migration',
  /\b(T012K|T012\b|BNKA)\b/gi,
  'Bank account master data BAM migration - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-040'] = createCommentTransform(
  'SIMPL-FI-040',
  'Tax code determination via condition technique mandatory',
  /\b(TAXCODE_DETERMINE|FI_TAX_CODE_DETERMINE|J_1B_NFE_TAX)\b/gi,
  'Tax code determination via condition technique mandatory - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-041'] = createCommentTransform(
  'SIMPL-FI-041',
  'Extended withholding tax configuration changes',
  /\b(T059Z|T059P|WITHHOLDING_TAX_CALCULATE)\b/gi,
  'Extended withholding tax configuration changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-042'] = createCommentTransform(
  'SIMPL-FI-042',
  'VAT reporting moved to ACDOCA-based extraction',
  /\b(RFUMSV00|RFUMSV25|RFUMSV50)\b/gi,
  'VAT reporting moved to ACDOCA-based extraction - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-043'] = createCommentTransform(
  'SIMPL-FI-043',
  'Country-specific tax transaction changes (Brazil J1B)',
  /\b(J1BTAX|J1BNFE|J_1B_NFE_CREATE|J_1BNFDOC)\b/gi,
  'Country-specific tax transaction changes (Brazil J1B) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-044'] = createCommentTransform(
  'SIMPL-FI-044',
  'Tax jurisdiction code table T007A changes',
  /\b(T007A|T007V|TAX_JURISDICTION)\b/gi,
  'Tax jurisdiction code table T007A changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-045'] = createCommentTransform(
  'SIMPL-FI-045',
  'Fast Close cockpit replaces classic closing transactions',
  /\b(FCLM_CLC|CLCTMPL|F101\b|CLOCOS)\b/gi,
  'Fast Close cockpit replaces classic closing transactions - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-046'] = createCommentTransform(
  'SIMPL-FI-046',
  'Intercompany reconciliation changes',
  /\b(SAPF150|ICR_MATCH|F\.5F)\b/gi,
  'Intercompany reconciliation changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-047'] = createCommentTransform(
  'SIMPL-FI-047',
  'Reclassification program SAPF100V replaced',
  /\b(SAPF100V|SAPF101|FAGL_FC_TRANSLATION)\b/gi,
  'Reclassification program SAPF100V replaced - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-048'] = createCommentTransform(
  'SIMPL-FI-048',
  'Financial close automation task scheduling',
  /\b(CLCTMPL_DEF|FIN_CLOSE_|FCLM_TASK_PROCESS)\b/gi,
  'Financial close automation task scheduling - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-049'] = createCommentTransform(
  'SIMPL-FI-049',
  'Cash position tables FDSB/FDSA removed',
  /\b(FDSB|FDSA)\b/gi,
  'Cash position tables FDSB/FDSA removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-050'] = createCommentTransform(
  'SIMPL-FI-050',
  'Liquidity forecast FLQCFLOW replaces FLQITEM',
  /\b(FLQCFLOW|FLQC_FLOW_GET|FF_5)\b/gi,
  'Liquidity forecast FLQCFLOW replaces FLQITEM - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-051'] = createCommentTransform(
  'SIMPL-FI-051',
  'Bank Account Management replaces T012/T012K maintenance',
  /\b(FCHI|FCHI_BANK_STMT|FF63)\b/gi,
  'Bank Account Management replaces T012/T012K maintenance - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-052'] = createCommentTransform(
  'SIMPL-FI-052',
  'Cash concentration and pooling changes',
  /\b(FF72|FF73|FI_CASH_CONCENTRATION)\b/gi,
  'Cash concentration and pooling changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-053'] = createCommentTransform(
  'SIMPL-FI-053',
  'Classic FI-AR-CR credit management replaced by UKMBP_CMS',
  /\b(KNKK|FD32|FD33|FD24)\b/gi,
  'Classic FI-AR-CR credit management replaced by UKMBP_CMS - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-054'] = createCommentTransform(
  'SIMPL-FI-054',
  'Credit exposure tables KNKK/S066 replaced',
  /\b(S066|S067|KNKK_CREDIT)\b/gi,
  'Credit exposure tables KNKK/S066 replaced - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-055'] = createCommentTransform(
  'SIMPL-FI-055',
  'Credit management function modules deprecated',
  /\b(CREDIT_UPDATE|FI_CREDIT_MANAGEMENT_CHECK|SD_CREDIT_CHECK)\b/gi,
  'Credit management function modules deprecated - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-056'] = createCommentTransform(
  'SIMPL-FI-056',
  'FI document splitting mandatory in S/4HANA',
  /\b(FAGL_SPLIT_ACTIVE|FAGL_GET_SPLIT_ACTIVE|OB62)\b/gi,
  'FI document splitting mandatory in S/4HANA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-057'] = createCommentTransform(
  'SIMPL-FI-057',
  'Profit center derivation mandatory for all line items',
  /\b(FAGL_DERIVE_PROFIT_CENTER|CEPCT|CEPC\b)\b/gi,
  'Profit center derivation mandatory for all line items - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-058'] = createCommentTransform(
  'SIMPL-FI-058',
  'Segment reporting mandatory via document splitting',
  /\b(SEGMENT|FAGL_SEGM_DERIVE|SEGM_DERIVE)\b/gi,
  'Segment reporting mandatory via document splitting - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-059'] = createCommentTransform(
  'SIMPL-FI-059',
  'FI document change rules tightened',
  /\b(UPDATE\s+BKPF|UPDATE\s+BSEG|FB02)\b/gi,
  'FI document change rules tightened - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-060'] = createCommentTransform(
  'SIMPL-FI-060',
  'Travel Management (FI-TV) removed from S/4HANA',
  /\b(PR01|PR02|PR03|PR05|TRIP\b)\b/gi,
  'Travel Management (FI-TV) removed from S/4HANA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-061'] = createCommentTransform(
  'SIMPL-FI-061',
  'TRIP table and travel expense structures removed',
  /\b(PTRV_HEAD|PTRV_PERIO|PTRV_SCOS|PTRV_DOC)\b/gi,
  'TRIP table and travel expense structures removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-062'] = createCommentTransform(
  'SIMPL-FI-062',
  'Travel planning function modules deprecated',
  /\b(TRIP_CREATE|TRIP_SAVE|TRIP_DELETE|HR_TRIP_)\b/gi,
  'Travel planning function modules deprecated - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-063'] = createCommentTransform(
  'SIMPL-FI-063',
  'Special GL indicators restructured in S/4HANA',
  /\b(UMSKZ|T074|BSEG_SPECIAL)\b/gi,
  'Special GL indicators restructured in S/4HANA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-065'] = createCommentTransform(
  'SIMPL-FI-065',
  'Bills of exchange processing deprecated',
  /\b(FBW1|FBW2|FBW3|FBW4|BSEC)\b/gi,
  'Bills of exchange processing deprecated - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-067'] = createCommentTransform(
  'SIMPL-FI-067',
  'Automatic Payment Program (F110) configuration changes',
  /\b(F110|RFFOUS__|RFFOAVIS_FPAYM|SAPFPAYM)\b/gi,
  'Automatic Payment Program (F110) configuration changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-068'] = createCommentTransform(
  'SIMPL-FI-068',
  'Vendor master LFB1/LFA1 replaced by Business Partner',
  /\b(LFA1|LFB1|LFBK|LFB5)\b/gi,
  'Vendor master LFB1/LFA1 replaced by Business Partner - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-069'] = createCommentTransform(
  'SIMPL-FI-069',
  'Dunning program changes (F150/SAPF150)',
  /\b(F150\b|SAPF150|MHNK|MHND)\b/gi,
  'Dunning program changes (F150/SAPF150) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-070'] = createCommentTransform(
  'SIMPL-FI-070',
  'Dispute management FSCM integration mandatory',
  /\b(FDM_CUST008|FDM_CREATE|UDM_DISPUTE_CREATE)\b/gi,
  'Dispute management FSCM integration mandatory - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-071'] = createCommentTransform(
  'SIMPL-FI-071',
  'Payment terms table T052 changes',
  /\b(T052\b|T052S|PAYMENT_TERMS_READ)\b/gi,
  'Payment terms table T052 changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-072'] = createCommentTransform(
  'SIMPL-FI-072',
  'Customer master KNA1/KNB1 replaced by Business Partner',
  /\b(KNA1|KNB1|KNBK|KNB5)\b/gi,
  'Customer master KNA1/KNB1 replaced by Business Partner - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-073'] = createCommentTransform(
  'SIMPL-FI-073',
  'Financial statement versions (FSV) reporting changes',
  /\b(RFBILA00|F\.01\b|FAGL_ACCOUNT_BALANCE)\b/gi,
  'Financial statement versions (FSV) reporting changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-074'] = createCommentTransform(
  'SIMPL-FI-074',
  'Drilldown reports (FGI*/FGS*) replaced by CDS views',
  /\b(FGI0|FGI4|FGS0|FGI3|0FL_REPORT)\b/gi,
  'Drilldown reports (FGI*/FGS*) replaced by CDS views - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-075'] = createCommentTransform(
  'SIMPL-FI-075',
  'Classic balance audit trail S_ALR_87012172 deprecated',
  /\b(S_ALR_87012172|S_ALR_87012277|S_ALR_87012082)\b/gi,
  'Classic balance audit trail S_ALR_87012172 deprecated - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-076'] = createCommentTransform(
  'SIMPL-FI-076',
  'Multiple currencies in ACDOCA (up to 10)',
  /\b(CURRENCY_CONVERTING_FACTOR|READ_EXCHANGE_RATE|FC_VALUATION)\b/gi,
  'Multiple currencies in ACDOCA (up to 10) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-077'] = createCommentTransform(
  'SIMPL-FI-077',
  'TCURR/TCURX exchange rate table access changes',
  /\bSELECT\s+.*\bFROM\s+(TCURR|TCURX)\b/gi,
  'TCURR/TCURX exchange rate table access changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-078'] = createCommentTransform(
  'SIMPL-FI-078',
  'Group currency and additional currencies in ACDOCA',
  /\b(CONVERT_TO_LOCAL_CURRENCY|CONVERT_TO_FOREIGN_CURRENCY)\b/gi,
  'Group currency and additional currencies in ACDOCA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-079'] = createCommentTransform(
  'SIMPL-FI-079',
  'Currency type configuration for parallel accounting',
  /\b(FINSC_CURTYPE|T001_CURTYPE|CURRENCY_TYPE)\b/gi,
  'Currency type configuration for parallel accounting - review and update for S/4HANA compatibility'
);

transforms['SIMPL-FI-080'] = createCommentTransform(
  'SIMPL-FI-080',
  'Hard-coded currency decimal handling for TCURX',
  /\b(TCURX|BAPI_CURRENCY_CONV_TO_INTERNAL|BAPI_CURRENCY_CONV_TO_EXTERNAL)\b/gi,
  'Hard-coded currency decimal handling for TCURX - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-001'] = createCommentTransform(
  'SIMPL-CO-001',
  'CO-PA operating concern tables restructured',
  /\b(CE1\w+|CE2\w+|CE3\w+|CE4\w+)\b/gi,
  'CO-PA operating concern tables restructured - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-002'] = createCommentTransform(
  'SIMPL-CO-002',
  'Costing-based CO-PA removed',
  /\b(COPA_|KE24|KE27|KE28|KE29|KE30)\b/gi,
  'Costing-based CO-PA removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-003'] = createCommentTransform(
  'SIMPL-CO-003',
  'CO-PA planning functions changed',
  /\bKEPM\b/gi,
  'CO-PA planning functions changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-004'] = createCommentTransform(
  'SIMPL-CO-004',
  'Cost element category concept removed',
  /\b(CSKB|CSKA|CSKE|KA01|KA02|KA03)\b/gi,
  'Cost element category concept removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-005'] = createCommentTransform(
  'SIMPL-CO-005',
  'Cost element group changes',
  /\b(KAH1|KAH2|KAH3|SETNODE.*KSTAR)\b/gi,
  'Cost element group changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-008'] = createCommentTransform(
  'SIMPL-CO-008',
  'Internal order settlement changes',
  /\b(KO88|BAPI_INTERNALORDER_|AUFK)\b/gi,
  'Internal order settlement changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-009'] = createCommentTransform(
  'SIMPL-CO-009',
  'Statistical order posting changes',
  /\bSTAT.*ORDER|ORDER.*STAT\b/gi,
  'Statistical order posting changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-010'] = createCommentTransform(
  'SIMPL-CO-010',
  'Overhead calculation changes',
  /\b(COKP|CON2|CK40N)\b/gi,
  'Overhead calculation changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-013'] = createCommentTransform(
  'SIMPL-CO-013',
  'Cost component structure changes',
  /\b(TCKH1|TCKH2|TCKH3|TCKH4)\b/gi,
  'Cost component structure changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-014'] = createCommentTransform(
  'SIMPL-CO-014',
  'Activity type planning changes',
  /\b(KP06|KP26|CSLA)\b/gi,
  'Activity type planning changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-015'] = createCommentTransform(
  'SIMPL-CO-015',
  'CO line item reports changed',
  /\b(KSB1|KOB1|S_ALR_87013611)\b/gi,
  'CO line item reports changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-016'] = createCommentTransform(
  'SIMPL-CO-016',
  'Profit center totals tables removed',
  /\b(GLPCA|GLPCO|GLPCP)\b/gi,
  'Profit center totals tables removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-017'] = createCommentTransform(
  'SIMPL-CO-017',
  'Transfer pricing in ACDOCA',
  /\bACDOCP\b/gi,
  'Transfer pricing in ACDOCA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-018'] = createCommentTransform(
  'SIMPL-CO-018',
  'Overhead order BAPI changes',
  /\bBAPI_INTERNALORDER_CREATE\b/gi,
  'Overhead order BAPI changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-019'] = createCommentTransform(
  'SIMPL-CO-019',
  'Primary cost elements derived from GL accounts',
  /\b(KA01|KA06|BAPI_COSTELEM_CREATEMULTIPLE|COST_ELEMENT_CREATE)\b/gi,
  'Primary cost elements derived from GL accounts - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-020'] = createCommentTransform(
  'SIMPL-CO-020',
  'Secondary cost elements merged into GL chart of accounts',
  /\b(CSKA|CSKB)[-.]?\w*/gi,
  'Secondary cost elements merged into GL chart of accounts - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-021'] = createCommentTransform(
  'SIMPL-CO-021',
  'Automatic cost element creation on GL account save',
  /\b(KA01|KA02|BAPI_COSTELEM_|FM.*COST_ELEMENT)\b/gi,
  'Automatic cost element creation on GL account save - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-022'] = createCommentTransform(
  'SIMPL-CO-022',
  'CSKB table replaced by SKA1/SKB1 attributes',
  /\bCSKB\b/gi,
  'CSKB table replaced by SKA1/SKB1 attributes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-024'] = createCommentTransform(
  'SIMPL-CO-024',
  'Statistical key figure posting changes',
  /\b(KB31N|KB33N|COSR|BAPI_STATISTICAL_KF)\b/gi,
  'Statistical key figure posting changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-026'] = createCommentTransform(
  'SIMPL-CO-026',
  'Order settlement to ACDOCA-based receivers',
  /\b(KO88|COBRB|CO88)\b/gi,
  'Order settlement to ACDOCA-based receivers - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-027'] = createCommentTransform(
  'SIMPL-CO-027',
  'Order type configuration for S/4HANA',
  /\b(T003O|KOT2|BAPI_INTERNALORDER_GETLIST)\b/gi,
  'Order type configuration for S/4HANA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-028'] = createCommentTransform(
  'SIMPL-CO-028',
  'Budget management for internal orders restructured',
  /\b(KOBS|KOBP|KОБР|BAPI_INTERNALORDER_BUDGET)\b/gi,
  'Budget management for internal orders restructured - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-029'] = createCommentTransform(
  'SIMPL-CO-029',
  'Material Ledger activation mandatory for all valuation areas',
  /\b(OMX1|CKMLRUNPERIOD|CKM_RCKM_ACTIVATE)\b/gi,
  'Material Ledger activation mandatory for all valuation areas - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-030'] = createCommentTransform(
  'SIMPL-CO-030',
  'Actual costing single-level and multi-level price determination',
  /\b(CKMLCP|CKM3N|CKML_MGV|MR22)\b/gi,
  'Actual costing single-level and multi-level price determination - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-031'] = createCommentTransform(
  'SIMPL-CO-031',
  'Cost component split stored in ACDOCA',
  /\b(CKMLTRANSACTION|CKMLPRKOPH|KALNR)\b/gi,
  'Cost component split stored in ACDOCA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-032'] = createCommentTransform(
  'SIMPL-CO-032',
  'CO-PA segment-level reporting via margin analysis',
  /\b(CE4\w+|COPA_SEGMENT|KEQ3|KEDR)\b/gi,
  'CO-PA segment-level reporting via margin analysis - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-033'] = createCommentTransform(
  'SIMPL-CO-033',
  'PA transfer structure obsolete in account-based CO-PA',
  /\b(KEI1|KEI2|KEI3|PA_TRANSFER_STRUCTURE)\b/gi,
  'PA transfer structure obsolete in account-based CO-PA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-034'] = createCommentTransform(
  'SIMPL-CO-034',
  'Margin analysis replaces CO-PA value fields',
  /\b(KE21N|KE23N|KE4.*|VV\d{3}|WW\d{3})\b/gi,
  'Margin analysis replaces CO-PA value fields - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-035'] = createCommentTransform(
  'SIMPL-CO-035',
  'Cost driver analysis with ACDOCA integration',
  /\b(CP05|CPCA|CPD1|CPMB)\b/gi,
  'Cost driver analysis with ACDOCA integration - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-036'] = createCommentTransform(
  'SIMPL-CO-036',
  'Template allocation in S/4HANA',
  /\b(CPT1|CPTA|CPT2|TEMPLATE_ALLOC)\b/gi,
  'Template allocation in S/4HANA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-037'] = createCommentTransform(
  'SIMPL-CO-037',
  'Assessment cycle ACDOCA posting',
  /\b(KSU1|KSU2|KSU5|KSU7|AUAK|AUAB)\b/gi,
  'Assessment cycle ACDOCA posting - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-038'] = createCommentTransform(
  'SIMPL-CO-038',
  'Distribution cycle changes for ACDOCA',
  /\b(KSV1|KSV2|KSV5|KSV7)\b/gi,
  'Distribution cycle changes for ACDOCA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-039'] = createCommentTransform(
  'SIMPL-CO-039',
  'Overhead calculation costing sheet references GL accounts',
  /\b(KZS2|KGI2|KISR|KZA2|KZO2)\b/gi,
  'Overhead calculation costing sheet references GL accounts - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-040'] = createCommentTransform(
  'SIMPL-CO-040',
  'Profit Center Accounting embedded in universal journal',
  /\b(1KE1|1KE4|1KE5|1KEF|GLPCA|GLPCO|GLPCP|EC_PCA_)\b/gi,
  'Profit Center Accounting embedded in universal journal - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-041'] = createCommentTransform(
  'SIMPL-CO-041',
  'Document type 8A/9A elimination entries replaced',
  /\b(1KE8|1KE9|DOC_TYPE.*[89]A|ELIM_PCA)\b/gi,
  'Document type 8A/9A elimination entries replaced - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-042'] = createCommentTransform(
  'SIMPL-CO-042',
  'Profit center balance carryforward in ACDOCA',
  /\b(2KES|SAPF011|PCA_BALANCE_CARRY)\b/gi,
  'Profit center balance carryforward in ACDOCA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-043'] = createCommentTransform(
  'SIMPL-CO-043',
  'Intercompany transfer pricing via extension ledger',
  /\b(1KEK|1KEL|1KEF|TPC_VARIANT|OKKP.*TP)\b/gi,
  'Intercompany transfer pricing via extension ledger - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-044'] = createCommentTransform(
  'SIMPL-CO-044',
  'Profit center valuation via parallel currency types',
  /\b(1KEI|1KEJ|1KEM|PCA_VALUATION)\b/gi,
  'Profit center valuation via parallel currency types - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-045'] = createCommentTransform(
  'SIMPL-CO-045',
  'Cost center planning via ACDOCP',
  /\b(KP06|KP07|KPF6|KPF7|PLAUT_COSTCENTER)\b/gi,
  'Cost center planning via ACDOCP - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-046'] = createCommentTransform(
  'SIMPL-CO-046',
  'Profit center planning in universal journal',
  /\b(7KE1|7KE2|GP12N|GP42N|PCA_PLAN)\b/gi,
  'Profit center planning in universal journal - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-047'] = createCommentTransform(
  'SIMPL-CO-047',
  'Integrated planning across CO objects',
  /\b(KEPM|KP97|KP98|KPF5|PLAN_COPY_CO)\b/gi,
  'Integrated planning across CO objects - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-048'] = createCommentTransform(
  'SIMPL-CO-048',
  'CO period close ACDOCA integration',
  /\b(COGI|CO43|CO44|CLOCO|COFC)\b/gi,
  'CO period close ACDOCA integration - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-049'] = createCommentTransform(
  'SIMPL-CO-049',
  'WIP calculation posts to ACDOCA',
  /\b(KKAO|KKAX|KKAG|AUFW|BAPI_ACC_WIP_)\b/gi,
  'WIP calculation posts to ACDOCA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-050'] = createCommentTransform(
  'SIMPL-CO-050',
  'Variance calculation in product costing via ACDOCA',
  /\b(KKS1|KKS2|KKS6|COKP|VARIANCE_CALC_PP)\b/gi,
  'Variance calculation in product costing via ACDOCA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-051'] = createCommentTransform(
  'SIMPL-CO-051',
  'Consolidation postings in ACDOCA',
  /\b(ECMCA|ECMCT|CX01|CX1R|CX2R|UC_CONSOLIDATION)\b/gi,
  'Consolidation postings in ACDOCA - review and update for S/4HANA compatibility'
);

transforms['SIMPL-CO-052'] = createCommentTransform(
  'SIMPL-CO-052',
  'Intercompany elimination in ACDOCA for group costing',
  /\b(ECMCA|ECMCC|GCGR|IC_ELIM|RCUFI|RGUFI)\b/gi,
  'Intercompany elimination in ACDOCA for group costing - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-002'] = createCommentTransform(
  'SIMPL-MM-002',
  'Material type configuration changes',
  /\bT134\b/gi,
  'Material type configuration changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-003'] = createCommentTransform(
  'SIMPL-MM-003',
  'MARA/MARC field changes',
  /\b(MARA-MFRNR|MARA-MFRPN|MARC-MMSTA)\b/gi,
  'MARA/MARC field changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-004'] = createCommentTransform(
  'SIMPL-MM-004',
  'Classic MRP replaced by MRP Live',
  /\b(MD01|MD02|MDTB|MDKP|MDTC)\b/gi,
  'Classic MRP replaced by MRP Live - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-005'] = createCommentTransform(
  'SIMPL-MM-005',
  'Demand-driven MRP (DDMRP) available',
  /\bMD04\b/gi,
  'Demand-driven MRP (DDMRP) available - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-006'] = createCommentTransform(
  'SIMPL-MM-006',
  'Planned order changes',
  /\bPLAF\b/gi,
  'Planned order changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-007'] = createCommentTransform(
  'SIMPL-MM-007',
  'Batch management classification changes',
  /\b(MCH1|MCHA|MCHB)\b/gi,
  'Batch management classification changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-008'] = createCommentTransform(
  'SIMPL-MM-008',
  'Material Ledger mandatory for valuation',
  /\b(MBEW|CKMLRUNPERIOD|CKMLPRKEPH)\b/gi,
  'Material Ledger mandatory for valuation - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-009'] = createCommentTransform(
  'SIMPL-MM-009',
  'Split valuation changes',
  /\bMBEW.*BWTAR|BWTAR.*MBEW\b/gi,
  'Split valuation changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-011'] = createCommentTransform(
  'SIMPL-MM-011',
  'MKPF/MSEG table changes',
  /\b(MKPF|MSEG)\b/gi,
  'MKPF/MSEG table changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-012'] = createCommentTransform(
  'SIMPL-MM-012',
  'Movement type customization changes',
  /\b(T156|T156B|T156M)\b/gi,
  'Movement type customization changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-013'] = createCommentTransform(
  'SIMPL-MM-013',
  'Invoice verification changes',
  /\b(RBKP|RSEG)\b/gi,
  'Invoice verification changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-014'] = createCommentTransform(
  'SIMPL-MM-014',
  'MR8M reversal changes',
  /\bMR8M\b/gi,
  'MR8M reversal changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-016'] = createCommentTransform(
  'SIMPL-MM-016',
  'EKKO/EKPO structural changes',
  /\b(EKKO|EKPO)\b/gi,
  'EKKO/EKPO structural changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-018'] = createCommentTransform(
  'SIMPL-MM-018',
  'Physical inventory document changes',
  /\b(IKPF|ISEG)\b/gi,
  'Physical inventory document changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-019'] = createCommentTransform(
  'SIMPL-MM-019',
  'Reservation management changes',
  /\b(RKPF|RESB)\b/gi,
  'Reservation management changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-020'] = createCommentTransform(
  'SIMPL-MM-020',
  'Hardcoded 18-char MATNR in CONCATENATE/string operations',
  /(?:CONCATENATE|WRITE\s+TO|&&).*MATNR.*(?:18|\(18\))/gi,
  'Hardcoded 18-char MATNR in CONCATENATE/string operations - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-021'] = createCommentTransform(
  'SIMPL-MM-021',
  '40-char MATNR impact on ALV and screen layouts',
  /(?:OUTPUTLEN|LENG|scrtext).*18.*MATNR|MATNR.*(?:OUTPUTLEN|LENG|scrtext).*18/gi,
  '40-char MATNR impact on ALV and screen layouts - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-022'] = createCommentTransform(
  'SIMPL-MM-022',
  '40-char MATNR in flat-file interfaces and IDocs',
  /(?:MATNR|MATERIAL).*(?:LENGTH\s+18|CHAR\(18\)|C\(18\)|18\s+TYPE\s+C)/gi,
  '40-char MATNR in flat-file interfaces and IDocs - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-023'] = createCommentTransform(
  'SIMPL-MM-023',
  'Industry sector assignment changes',
  /\b(MARA-MBRSH|MBRSH|T137)\b/gi,
  'Industry sector assignment changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-024'] = createCommentTransform(
  'SIMPL-MM-024',
  'Material master transaction code changes (MM01/MM02/MM03)',
  /\b(?:CALL\s+TRANSACTION\s+')?(MM01|MM02|MM03)(?:'|\b)/gi,
  'Material master transaction code changes (MM01/MM02/MM03) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-025'] = createCommentTransform(
  'SIMPL-MM-025',
  'Material type MTART validation changes',
  /\b(MTART|T134|T134T)\b.*(?:SELECT|UPDATE|INSERT|MODIFY)/gi,
  'Material type MTART validation changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-026'] = createCommentTransform(
  'SIMPL-MM-026',
  'RFQ processing changes (ME41/ME42/ME43)',
  /\b(ME41|ME42|ME43)\b/gi,
  'RFQ processing changes (ME41/ME42/ME43) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-027'] = createCommentTransform(
  'SIMPL-MM-027',
  'Outline agreement / contract changes (ME31K/ME32K)',
  /\b(ME31K|ME32K|ME33K|BAPI_CONTRACT_CREATE|BAPI_CONTRACT_CHANGE)\b/gi,
  'Outline agreement / contract changes (ME31K/ME32K) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-028'] = createCommentTransform(
  'SIMPL-MM-028',
  'Scheduling agreement changes (ME31L/ME32L)',
  /\b(ME31L|ME32L|ME33L|EKET|BAPI_SAG_CREATE|BAPI_SAG_CHANGE)\b/gi,
  'Scheduling agreement changes (ME31L/ME32L) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-029'] = createCommentTransform(
  'SIMPL-MM-029',
  'Purchase info record BAPI and table changes',
  /\b(BAPI_INFORECORD_CREATE|BAPI_INFORECORD_CHANGE)\b/gi,
  'Purchase info record BAPI and table changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-030'] = createCommentTransform(
  'SIMPL-MM-030',
  'Purchase requisition Fiori app migration',
  /\b(ME51N|ME52N|ME53N|BAPI_PR_CREATE|BAPI_PR_CHANGE)\b/gi,
  'Purchase requisition Fiori app migration - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-032'] = createCommentTransform(
  'SIMPL-MM-032',
  'Goods issue posting changes (MB1A)',
  /\b(MB1A|MB1B|MB1C)\b/gi,
  'Goods issue posting changes (MB1A) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-033'] = createCommentTransform(
  'SIMPL-MM-033',
  'Stock type simplification (quality, blocked, unrestricted)',
  /\b(MARD|MARD-LABST|MARD-INSME|MARD-SPEME|MSKA|MSKU|MKOL)\b/gi,
  'Stock type simplification (quality, blocked, unrestricted) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-034'] = createCommentTransform(
  'SIMPL-MM-034',
  'Batch management determination and derivation',
  /\b(VB01|VB02|VB03|BATCH_DERIVATION|BAPI_BATCH_CREATE)\b/gi,
  'Batch management determination and derivation - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-035'] = createCommentTransform(
  'SIMPL-MM-035',
  'Physical inventory count procedures (MI01/MI04/MI07)',
  /\b(MI01|MI04|MI07|MI20|MI31|MI32|MI33)\b/gi,
  'Physical inventory count procedures (MI01/MI04/MI07) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-036'] = createCommentTransform(
  'SIMPL-MM-036',
  'Evaluated Receipt Settlement (ERS) changes',
  /\b(MRRL|ERS|EVALUATED_RECEIPT)\b/gi,
  'Evaluated Receipt Settlement (ERS) changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-037'] = createCommentTransform(
  'SIMPL-MM-037',
  'Invoice parking (MIR7) and workflow changes',
  /\b(MIR7|MIRA|MIR4)\b/gi,
  'Invoice parking (MIR7) and workflow changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-038'] = createCommentTransform(
  'SIMPL-MM-038',
  'MIRO transaction and invoice posting changes',
  /\bMIRO\b/gi,
  'MIRO transaction and invoice posting changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-039'] = createCommentTransform(
  'SIMPL-MM-039',
  'Subsequent debit/credit (MR01/MR02) changes',
  /\b(MR01|MR02|MR03)\b/gi,
  'Subsequent debit/credit (MR01/MR02) changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-040'] = createCommentTransform(
  'SIMPL-MM-040',
  'Actual costing / material ledger actual cost component split',
  /\b(CKMLCP|CKM3N|CKM3|CKML_SETTLEMENT)\b/gi,
  'Actual costing / material ledger actual cost component split - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-042'] = createCommentTransform(
  'SIMPL-MM-042',
  'Transfer pricing and profit center valuation in ML',
  /\b(CKML_MGV|T_CKML_MGV|TRANSFER_PRICE|ML_PRICE_DET)\b/gi,
  'Transfer pricing and profit center valuation in ML - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-043'] = createCommentTransform(
  'SIMPL-MM-043',
  'Source list maintenance changes (ME01/ME03)',
  /\b(ME01|ME03|EORD)\b/gi,
  'Source list maintenance changes (ME01/ME03) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-044'] = createCommentTransform(
  'SIMPL-MM-044',
  'Quota arrangement changes (MEQ1/MEQ3)',
  /\b(MEQ1|MEQ3|EQUK|EQUP)\b/gi,
  'Quota arrangement changes (MEQ1/MEQ3) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-045'] = createCommentTransform(
  'SIMPL-MM-045',
  'Approved vendor list / supplier qualification',
  /\b(LFM1|LFM2|BAPI_VENDOR_FIND|APPROVED_VENDOR)\b/gi,
  'Approved vendor list / supplier qualification - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-046'] = createCommentTransform(
  'SIMPL-MM-046',
  'MRP area configuration changes',
  /\b(T460A|T460B|MDLV|MDLL)\b/gi,
  'MRP area configuration changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-047'] = createCommentTransform(
  'SIMPL-MM-047',
  'MRP type and lot-sizing procedure changes',
  /\b(MDFD|MARC-DISMM|MARC-DISPO|T438M)\b/gi,
  'MRP type and lot-sizing procedure changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-048'] = createCommentTransform(
  'SIMPL-MM-048',
  'Planning file entry reset and rebuild',
  /\b(MDRE|RMDATFRE|MDFD)\b/gi,
  'Planning file entry reset and rebuild - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-049'] = createCommentTransform(
  'SIMPL-MM-049',
  'Supplier evaluation with Business Partner model',
  /\b(ME61|ME62|ME63|LFA1|LFB1)\b/gi,
  'Supplier evaluation with Business Partner model - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-050'] = createCommentTransform(
  'SIMPL-MM-050',
  'Vendor evaluation scoring and weighting changes',
  /\b(ME6A|ME6B|ME6C|T160V|T160E)\b/gi,
  'Vendor evaluation scoring and weighting changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-051'] = createCommentTransform(
  'SIMPL-MM-051',
  'Reorder point planning (MRP type VB) in MRP Live',
  /\b(MVER|MARC-MINBE|MARC-MABST|REORDER_POINT)\b/gi,
  'Reorder point planning (MRP type VB) in MRP Live - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-052'] = createCommentTransform(
  'SIMPL-MM-052',
  'Forecast-based planning (MRP type VV) changes',
  /\b(MP38|MP39|MARC-PROGR|MARC-PRMOD|PBED)\b/gi,
  'Forecast-based planning (MRP type VV) changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-053'] = createCommentTransform(
  'SIMPL-MM-053',
  'Time-phased planning (MRP type R1) adjustments',
  /\b(T4C1|MARC-BESSION|MARC-LFRHY)\b/gi,
  'Time-phased planning (MRP type R1) adjustments - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-054'] = createCommentTransform(
  'SIMPL-MM-054',
  'Material classification changes (CL01/CL02)',
  /\b(CL01|CL02|CL03|INOB|KSSK|AUSP)\b/gi,
  'Material classification changes (CL01/CL02) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-055'] = createCommentTransform(
  'SIMPL-MM-055',
  'Batch classification (class type 023) restructuring',
  /\b(?:CLASS_TYPE|KLART).*023|023.*(?:CLASS_TYPE|KLART)/gi,
  'Batch classification (class type 023) restructuring - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-056'] = createCommentTransform(
  'SIMPL-MM-056',
  'Dangerous goods master data in material master',
  /\b(DGTMD|DGTM2|DG_PROFILE|MARC-PROFL)\b/gi,
  'Dangerous goods master data in material master - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-057'] = createCommentTransform(
  'SIMPL-MM-057',
  'Dangerous goods regulation and classification updates',
  /\b(DGP_PROFILES|DG_REGULATION|UN_NUMBER)\b/gi,
  'Dangerous goods regulation and classification updates - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-058'] = createCommentTransform(
  'SIMPL-MM-058',
  'Service entry sheet processing changes (ML81N)',
  /\b(ML81N|ESSR|ESLH|ESLL)\b/gi,
  'Service entry sheet processing changes (ML81N) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-059'] = createCommentTransform(
  'SIMPL-MM-059',
  'Service master and limit items changes',
  /\b(AC01|AC02|AC03|ASMD|ASMDT|LIMIT_ITEM)\b/gi,
  'Service master and limit items changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-060'] = createCommentTransform(
  'SIMPL-MM-060',
  'Service procurement integration with Fieldglass/SAP BN',
  /\b(BAPI_ENTRYSHEET_CREATE|BAPI_ENTRYSHEET_APPROVE)\b/gi,
  'Service procurement integration with Fieldglass/SAP BN - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-061'] = createCommentTransform(
  'SIMPL-MM-061',
  'Subcontractor stock management changes',
  /\b(MSSL|MSLB|SPEC_STOCK.*O|541)\b/gi,
  'Subcontractor stock management changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-062'] = createCommentTransform(
  'SIMPL-MM-062',
  'Subcontracting BOM component provision (SC BOM)',
  /\b(ME2O|ME20|SC_BOM|SUBCONTRACTING|SUBCONT)\b/gi,
  'Subcontracting BOM component provision (SC BOM) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-063'] = createCommentTransform(
  'SIMPL-MM-063',
  'Inter-company stock transport order changes',
  /\b(STOCK_TRANSPORT|STO_ORDER|UB.*ME21N|ME21N.*UB)\b/gi,
  'Inter-company stock transport order changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-064'] = createCommentTransform(
  'SIMPL-MM-064',
  'Cross-plant stock transfer posting changes',
  /\b(BWART\s*=\s*'30[1-6]'|MVT_TYPE.*30[1-6]|301|302|303|304|305|306)\b/gi,
  'Cross-plant stock transfer posting changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-065'] = createCommentTransform(
  'SIMPL-MM-065',
  'MM-WM integration replaced by MM-EWM',
  /\b(LQUA|LAGP|LEIN|LTAP|LTBP|LTAK|LTBK|LS01|LS02|LS03|LT01|LT02|LT03|LT0[4-9]|LT10|LT11|LT12)\b/gi,
  'MM-WM integration replaced by MM-EWM - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-066'] = createCommentTransform(
  'SIMPL-MM-066',
  'WM transaction and function module removal',
  /\b(L_TO_CREATE_SINGLE|L_TO_CREATE_MOVE_ORDER|L_TO_CONFIRM|BAPI_WHSE_TO_CREATE|BAPI_WHSE_TO_GET_DETAIL)\b/gi,
  'WM transaction and function module removal - review and update for S/4HANA compatibility'
);

transforms['SIMPL-MM-067'] = createCommentTransform(
  'SIMPL-MM-067',
  'Storage location to EWM mapping',
  /\b(T320|T301|T331|T300W)\b/gi,
  'Storage location to EWM mapping - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-001'] = createCommentTransform(
  'SIMPL-SD-001',
  'NAST-based output management deprecated',
  /\b(NAST|TNAPR|NACH)\b/gi,
  'NAST-based output management deprecated - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-002'] = createCommentTransform(
  'SIMPL-SD-002',
  'SAPscript forms deprecated',
  /\b(OPEN_FORM|CLOSE_FORM|WRITE_FORM|START_FORM)\b/gi,
  'SAPscript forms deprecated - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-003'] = createCommentTransform(
  'SIMPL-SD-003',
  'SmartForms migration needed',
  /\bSSF_FUNCTION_MODULE_NAME\b/gi,
  'SmartForms migration needed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-004'] = createCommentTransform(
  'SIMPL-SD-004',
  'Classic credit management (FD32) removed',
  /\b(UKM_|FD32|UKMBP_CMS|UKM_DATA_READ)\b/gi,
  'Classic credit management (FD32) removed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-005'] = createCommentTransform(
  'SIMPL-SD-005',
  'Credit exposure calculation changed',
  /\b(S066|S067|KNKK)\b/gi,
  'Credit exposure calculation changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-007'] = createCommentTransform(
  'SIMPL-SD-007',
  'Condition record BAPI changes',
  /\bBAPI_PRICES_CONDITIONS\b/gi,
  'Condition record BAPI changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-008'] = createCommentTransform(
  'SIMPL-SD-008',
  'Classic ATP replaced by aATP',
  /\b(CO06|CO09|BAPI_MATERIAL_AVAILABILITY|ATPCS)\b/gi,
  'Classic ATP replaced by aATP - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-009'] = createCommentTransform(
  'SIMPL-SD-009',
  'Backorder processing changes',
  /\bV_RA\b/gi,
  'Backorder processing changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-010'] = createCommentTransform(
  'SIMPL-SD-010',
  'Billing document structure changes',
  /\b(VBRK|VBRP)\b/gi,
  'Billing document structure changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-011'] = createCommentTransform(
  'SIMPL-SD-011',
  'Invoice list changes',
  /\bVF21\b/gi,
  'Invoice list changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-012'] = createCommentTransform(
  'SIMPL-SD-012',
  'LIKP/LIPS delivery table changes',
  /\b(LIKP|LIPS)\b/gi,
  'LIKP/LIPS delivery table changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-013'] = createCommentTransform(
  'SIMPL-SD-013',
  'Delivery BAPI changes',
  /\bBAPI_OUTB_DELIVERY_\w+/gi,
  'Delivery BAPI changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-014'] = createCommentTransform(
  'SIMPL-SD-014',
  'VBAK/VBAP sales document changes',
  /\b(VBAK|VBAP|VBEP)\b/gi,
  'VBAK/VBAP sales document changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-015'] = createCommentTransform(
  'SIMPL-SD-015',
  'Sales order BAPI changes',
  /\bBAPI_SALESORDER_\w+/gi,
  'Sales order BAPI changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-016'] = createCommentTransform(
  'SIMPL-SD-016',
  'Transportation integration changes',
  /\bVT01N|VTTK|VTTP\b/gi,
  'Transportation integration changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-017'] = createCommentTransform(
  'SIMPL-SD-017',
  'Partner determination with BP',
  /\b(KUAGV|KUWEV|PARVW)\b/gi,
  'Partner determination with BP - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-018'] = createCommentTransform(
  'SIMPL-SD-018',
  'Rebate processing changes',
  /\b(VBO1|VBO2|VBO3|KONA)\b/gi,
  'Rebate processing changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-019'] = createCommentTransform(
  'SIMPL-SD-019',
  'Revenue recognition changes',
  /\b(VF44|VBREVE)\b/gi,
  'Revenue recognition changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-020'] = createCommentTransform(
  'SIMPL-SD-020',
  'Advanced Returns Management available',
  /\bVRMA\b/gi,
  'Advanced Returns Management available - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-021'] = createCommentTransform(
  'SIMPL-SD-021',
  'Sales document type configuration changes',
  /\b(VOV8|TVAK|TVAP|AUART)\b/gi,
  'Sales document type configuration changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-022'] = createCommentTransform(
  'SIMPL-SD-022',
  'Incompletion procedure changes',
  /\b(OVA2|V45A|INCOMP_LOG|V45S_COMPLETE)\b/gi,
  'Incompletion procedure changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-023'] = createCommentTransform(
  'SIMPL-SD-023',
  'Sales document copy control changes',
  /\b(VTAA|VTLA|VTFA|VTFL)\b/gi,
  'Sales document copy control changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-024'] = createCommentTransform(
  'SIMPL-SD-024',
  'Sales order status management simplified',
  /\b(VBUK|VBUP)\b/gi,
  'Sales order status management simplified - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-026'] = createCommentTransform(
  'SIMPL-SD-026',
  'Condition technique access sequence changes',
  /\b(V\/0[0-9]|T685[A-Z]?|T681[A-Z]?)\b/gi,
  'Condition technique access sequence changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-027'] = createCommentTransform(
  'SIMPL-SD-027',
  'Pricing scale basis and calculation type changes',
  /\b(KSCHL|KOAID|KRECH|KSTBS)\b/gi,
  'Pricing scale basis and calculation type changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-028'] = createCommentTransform(
  'SIMPL-SD-028',
  'Pricing condition maintenance via Fiori',
  /\b(VK11|VK12|VK13|VK31|VK32|VK33)\b/gi,
  'Pricing condition maintenance via Fiori - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-029'] = createCommentTransform(
  'SIMPL-SD-029',
  'Inter-company billing process changes',
  /\b(IV01|IV02|VBRK_IC|INTERCOMPANY)\b/gi,
  'Inter-company billing process changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-030'] = createCommentTransform(
  'SIMPL-SD-030',
  'Milestone billing configuration changes',
  /\b(FPLA|FPLNR|MILESTONE_BILLING|BAPI_BILLINGPLAN)\b/gi,
  'Milestone billing configuration changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-031'] = createCommentTransform(
  'SIMPL-SD-031',
  'Resource-related billing integration changed',
  /\b(DP91|DP90|DPR_|DPRB)\b/gi,
  'Resource-related billing integration changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-032'] = createCommentTransform(
  'SIMPL-SD-032',
  'Billing due list processing changed',
  /\b(VF04|BILLING_DUE_LIST|SD_BILLING_DUE)\b/gi,
  'Billing due list processing changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-033'] = createCommentTransform(
  'SIMPL-SD-033',
  'Delivery split and grouping changes',
  /\b(VEKP|VEPO|HU_PACKING|HANDLING_UNIT)\b/gi,
  'Delivery split and grouping changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-034'] = createCommentTransform(
  'SIMPL-SD-034',
  'Picking and warehouse integration changes',
  /\b(VL06P|VL06O|LTAK|LTAP|WM_TO_CREATE)\b/gi,
  'Picking and warehouse integration changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-035'] = createCommentTransform(
  'SIMPL-SD-035',
  'Goods issue posting changes',
  /\b(VL02N.*PGI|WS_DELIVERY_UPDATE_2|BAPI_INB_DELIVERY_SAVERPL)\b/gi,
  'Goods issue posting changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-036'] = createCommentTransform(
  'SIMPL-SD-036',
  'Shipping point determination logic changed',
  /\b(OVL2|TVST|T001W_VSTEL|SHIPPING_POINT_DET)\b/gi,
  'Shipping point determination logic changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-037'] = createCommentTransform(
  'SIMPL-SD-037',
  'Route determination and scheduling changes',
  /\b(TVRO|TROUTE|VA00|T_ROUTE_DET)\b/gi,
  'Route determination and scheduling changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-038'] = createCommentTransform(
  'SIMPL-SD-038',
  'Credit limit check integration with SAP Credit Management',
  /\b(OVA8|CRED_CHECK|SD_CREDIT_CHECK|T691F)\b/gi,
  'Credit limit check integration with SAP Credit Management - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-039'] = createCommentTransform(
  'SIMPL-SD-039',
  'Credit master data migration to BP',
  /\b(FD33|KNB1.*CRDT|KNKK_READ|FD32_CALL)\b/gi,
  'Credit master data migration to BP - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-040'] = createCommentTransform(
  'SIMPL-SD-040',
  'NACE output configuration deprecated',
  /\b(NACE|V_TNAPR|OUTPUT_TYPE_DET)\b/gi,
  'NACE output configuration deprecated - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-041'] = createCommentTransform(
  'SIMPL-SD-041',
  'Adobe Forms integration for SD output',
  /\b(SFP|FP_JOB_OPEN|FP_FUNCTION_MODULE_NAME|ADS_SR)\b/gi,
  'Adobe Forms integration for SD output - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-042'] = createCommentTransform(
  'SIMPL-SD-042',
  'BRF+ rules for output channel determination',
  /\b(BRF_|FDT_|BRF_PLUS|CL_FDT_FUNCTION)\b/gi,
  'BRF+ rules for output channel determination - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-043'] = createCommentTransform(
  'SIMPL-SD-043',
  'ATP rescheduling and delivery proposal changes',
  /\b(V_V2|RESCHEDULING|SD_SCHEDULE_LINE|VBEP_CONFIRM)\b/gi,
  'ATP rescheduling and delivery proposal changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-044'] = createCommentTransform(
  'SIMPL-SD-044',
  'Product allocation removed from classic ATP',
  /\b(PRODUCT_ALLOC|MT61|CM01|ATPCHECK_ALLOC)\b/gi,
  'Product allocation removed from classic ATP - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-045'] = createCommentTransform(
  'SIMPL-SD-045',
  'Foreign trade data in sales documents changed',
  /\b(STAWN|HESSION|LANDEX|GTS_|SGTMP)\b/gi,
  'Foreign trade data in sales documents changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-046'] = createCommentTransform(
  'SIMPL-SD-046',
  'Intrastat reporting changes',
  /\b(VGM1|VGM2|INTRASTAT|EU_SALES_LIST)\b/gi,
  'Intrastat reporting changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-048'] = createCommentTransform(
  'SIMPL-SD-048',
  'Value contract processing changes',
  /\b(WK1|WK2|CONTRACT_VALUE|VBKD_CNTRL)\b/gi,
  'Value contract processing changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-049'] = createCommentTransform(
  'SIMPL-SD-049',
  'Quantity contract release order changes',
  /\b(MK_CONTRACT|QTY_CONTRACT|CONTRACT_DET|VEDA)\b/gi,
  'Quantity contract release order changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-050'] = createCommentTransform(
  'SIMPL-SD-050',
  'Scheduling agreement processing changes',
  /\b(VA31|VA32|VBEP_SCHED|SCHEDULE_AGREEMENT)\b/gi,
  'Scheduling agreement processing changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-051'] = createCommentTransform(
  'SIMPL-SD-051',
  'Returns order refund processing changed',
  /\b(RE_RETURN|RETURN_ORDER|VA01.*RE|SD_RETURN)\b/gi,
  'Returns order refund processing changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-052'] = createCommentTransform(
  'SIMPL-SD-052',
  'Credit and debit memo request changes',
  /\b(CREDIT_MEMO_REQ|DEBIT_MEMO_REQ|VA01.*(CR|DR)|VBTYP.*[GH])\b/gi,
  'Credit and debit memo request changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-053'] = createCommentTransform(
  'SIMPL-SD-053',
  'Complaint processing with quality notifications',
  /\b(VIQMEL|QM_NOTIFICATION|COMPLAINT_|Q[NM]01)\b/gi,
  'Complaint processing with quality notifications - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-054'] = createCommentTransform(
  'SIMPL-SD-054',
  'RAR integration mandatory for event-based revenue recognition',
  /\b(VBREVE|VBREVK|EVENT_BASED_REV|FARR_|RAR_LEGACY)\b/gi,
  'RAR integration mandatory for event-based revenue recognition - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-055'] = createCommentTransform(
  'SIMPL-SD-055',
  'Revenue recognition account determination changed',
  /\b(VKOA|REV_REC_ACCT|ACCT_DET_REV)\b/gi,
  'Revenue recognition account determination changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-056'] = createCommentTransform(
  'SIMPL-SD-056',
  'Variant configuration in sales orders changed',
  /\b(CU41|CU42|LOVC_|CUOBJ|BAPI_CONFIG)\b/gi,
  'Variant configuration in sales orders changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-057'] = createCommentTransform(
  'SIMPL-SD-057',
  'Make-to-order (MTO) integration changed',
  /\b(MTO_|MAKE_TO_ORDER|E_SOBKZ|ABLAD_MTO)\b/gi,
  'Make-to-order (MTO) integration changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-058'] = createCommentTransform(
  'SIMPL-SD-058',
  'Engineer-to-order (ETO) process changes',
  /\b(ETO_|ENGINEER_TO_ORDER|PS_SD_|WBS_ELEMENT_SD)\b/gi,
  'Engineer-to-order (ETO) process changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-059'] = createCommentTransform(
  'SIMPL-SD-059',
  'SD-FI integration changes (account determination)',
  /\b(VKOA|OV[0-9]{2}|OVK[0-9]|SD_FI_ACCT|ACDOCA_SD)\b/gi,
  'SD-FI integration changes (account determination) - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-060'] = createCommentTransform(
  'SIMPL-SD-060',
  'SD-MM integration for procurement-triggered scenarios',
  /\b(THIRD_PARTY|SD_MM_PROC|BANF_SD|ME21N_SD|PSTYV.*TAB)\b/gi,
  'SD-MM integration for procurement-triggered scenarios - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-061'] = createCommentTransform(
  'SIMPL-SD-061',
  'SD-PP integration for production order triggers',
  /\b(SD_PP_|MRP_SD|STRATEGY_GROUP|REQUIREMENT_TRANSFER)\b/gi,
  'SD-PP integration for production order triggers - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-062'] = createCommentTransform(
  'SIMPL-SD-062',
  'Sales document text determination procedure changes',
  /\b(VOTXN|STXH|STXL|READ_TEXT.*VBBK|READ_TEXT.*VBBP)\b/gi,
  'Sales document text determination procedure changes - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-063'] = createCommentTransform(
  'SIMPL-SD-063',
  'Output text and form text references changed',
  /\b(TEXT_MODULE|INCLUDE_TEXT|SO10.*SD|FORM_TEXT_REF)\b/gi,
  'Output text and form text references changed - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-064'] = createCommentTransform(
  'SIMPL-SD-064',
  'BP-based partner functions replace customer-based partners',
  /\b(TPAR[T]?|KNA1.*PARTNER|PARTNER_ROLE_MAP|PAI_PARTNER)\b/gi,
  'BP-based partner functions replace customer-based partners - review and update for S/4HANA compatibility'
);

transforms['SIMPL-SD-065'] = createCommentTransform(
  'SIMPL-SD-065',
  'Contact person management via BP relationships',
  /\b(KNVK|CONTACT_PERSON|CP_SD|ADDR_CONTACT)\b/gi,
  'Contact person management via BP relationships - review and update for S/4HANA compatibility'
);

module.exports = transforms;
