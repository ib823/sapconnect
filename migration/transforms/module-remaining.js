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
 * Module-Remaining Transforms
 *
 * Auto-generated transforms for all remaining rule modules:
 * Data Model (DM), Removed (REM), Enhancement (ENH), Business Partner (BP 004-038),
 * HR, PP, PM, BW, EWM, TM, GTS, PLM, PS, QM, Config (CFG), Interface (INT).
 *
 * Each transform follows the standard signature:
 * { id, description, apply(source, finding) → { source, changes } }
 */

/**
 * Helper: create a comment-type transform that inserts a TODO before matched patterns.
 */
function createCommentTransform(id, description, pattern, todoMessage) {
  return {
    id,
    description,
    apply(source) {
      const changes = [];
      const lines = source.split('\n');
      const result = [];
      const regex = new RegExp(pattern.source || pattern, pattern.flags || 'gi');
      for (let i = 0; i < lines.length; i++) {
        const prevLine = i > 0 ? lines[i - 1] : '';
        if (regex.test(lines[i]) && !prevLine.includes('TODO(S/4)') && !lines[i].includes('TODO(S/4)')) {
          const ws = lines[i].match(/^(\s*)/)[1];
          result.push(`${ws}" TODO(S/4): ${todoMessage}`);
          result.push(lines[i]);
          changes.push({ type: 'comment', note: todoMessage });
        } else {
          result.push(lines[i]);
        }
        regex.lastIndex = 0;
      }
      return { source: result.join('\n'), changes };
    },
  };
}

/**
 * Helper: create a flag-type transform that records findings without modifying source.
 */
function createFlagTransform(id, description, pattern, flagMessage) {
  return {
    id,
    description,
    apply(source) {
      const changes = [];
      const flags = (pattern.flags || 'gi').includes('g')
        ? (pattern.flags || 'gi')
        : (pattern.flags || 'i') + 'g';
      const regex = new RegExp(pattern.source || pattern, flags);
      let match;
      let lastIndex = -1;
      while ((match = regex.exec(source)) !== null) {
        if (regex.lastIndex === lastIndex) {
          regex.lastIndex++;
          continue;
        }
        lastIndex = regex.lastIndex;
        changes.push({ type: 'flag', note: flagMessage });
      }
      return { source, changes };
    },
  };
}

const transforms = {};


// ── Business Partner Rules (BP-004 through BP-038) ────────────────────────

// SIMPL-BP-004: Contact person tables changed
transforms['SIMPL-BP-004'] = createCommentTransform(
  'SIMPL-BP-004',
  'Contact person tables changed',
  /(\s*)(\bKNVK\b)/ig,
  'Use BP contact person relationship category. Use BUT050/BUT051.'
);

// SIMPL-BP-005: Bank details migration to BP
transforms['SIMPL-BP-005'] = createCommentTransform(
  'SIMPL-BP-005',
  'Bank details migration to BP',
  /(\s*)(\b(KNBK|LFBK)\b)/ig,
  'Use BUT0BK for BP bank details.'
);

// SIMPL-BP-006: Customer/vendor number sync required
transforms['SIMPL-BP-006'] = createCommentTransform(
  'SIMPL-BP-006',
  'Customer/vendor number sync required',
  /(\s*)(\b(KUNNR|LIFNR).*(?:CONVERT|NUMBER_GET|ASSIGN)\b)/ig,
  'Use BP number ranges and synchronization. Configure CVI (Customer Vendor Integration).'
);

// SIMPL-BP-007: Partner function determination changed
transforms['SIMPL-BP-007'] = createCommentTransform(
  'SIMPL-BP-007',
  'Partner function determination changed',
  /(\s*)(\bVBPA\b)/ig,
  'Review partner function determination for BP integration.'
);

// SIMPL-BP-008: BP relationship categories
transforms['SIMPL-BP-008'] = createCommentTransform(
  'SIMPL-BP-008',
  'BP relationship categories',
  /(\s*)(\b(BUT050|BUT051|BUT0BK|BUT020)\b)/ig,
  'Review BP relationship category usage and ensure proper setup.'
);

// SIMPL-BP-009: CVI synchronization required
transforms['SIMPL-BP-009'] = createCommentTransform(
  'SIMPL-BP-009',
  'CVI synchronization required',
  /(\s*)(\bCVI_|SMT_|SY-SUBRC.*CUSTOMER_|VENDOR_)/ig,
  'Configure CVI for bidirectional synchronization between BP and customer/vendor.'
);

// SIMPL-BP-010: Customer/vendor creation transactions deprecated
transforms['SIMPL-BP-010'] = createCommentTransform(
  'SIMPL-BP-010',
  'Customer/vendor creation transactions deprecated',
  /(\s*)(\b(XD01|XD02|XD03|XK01|XK02|XK03|FD01|FD02|FK01|FK02)\b)/ig,
  'Use BP transaction or API_BUSINESS_PARTNER for master data maintenance.'
);

// SIMPL-BP-011: Customer hierarchy changes
transforms['SIMPL-BP-011'] = createCommentTransform(
  'SIMPL-BP-011',
  'Customer hierarchy changes',
  /(\s*)(\bKNVH\b)/ig,
  'Review customer hierarchy for BP-based hierarchy.'
);

// SIMPL-BP-012: Tax number handling changes
transforms['SIMPL-BP-012'] = createFlagTransform(
  'SIMPL-BP-012',
  'Tax number handling changes',
  /\b(DFKKBPTAXNUM|J_1BTAXNUMBE)\b/i,
  'Use BP tax number management.'
);

// SIMPL-BP-013: BUT000 central BP table usage
transforms['SIMPL-BP-013'] = createCommentTransform(
  'SIMPL-BP-013',
  'BUT000 central BP table usage',
  /(\s*)(\bBUT000\b)/ig,
  'Use CDS view I_BusinessPartner or API_BUSINESS_PARTNER OData service instead of direct table access.'
);

// SIMPL-BP-014: BP role assignment required
transforms['SIMPL-BP-014'] = createCommentTransform(
  'SIMPL-BP-014',
  'BP role assignment required',
  /(\s*)(\b(BUT100|BP_ROLE|FLCU00|FLVN00|FLCU01|FLVN01|BUP001|BUP002|BUP003)\b)/ig,
  'Ensure all Business Partners have correct BP roles assigned. Map legacy customer/vendor roles to appropriate BP role categories.'
);

// SIMPL-BP-015: BP grouping controls number ranges
transforms['SIMPL-BP-015'] = createCommentTransform(
  'SIMPL-BP-015',
  'BP grouping controls number ranges',
  /(\s*)(\b(BU_GROUP|BP_GROUP|TB003|TB004)\b)/ig,
  'Define BP grouping categories and assign appropriate number ranges and allowed BP roles per group.'
);

// SIMPL-BP-016: CVI mapping configuration tables
transforms['SIMPL-BP-016'] = createCommentTransform(
  'SIMPL-BP-016',
  'CVI mapping configuration tables',
  /(\s*)(\b(CVI_CUST_LINK|CVI_VEND_LINK|CVIS_|CVI_EI_)\w*)/ig,
  'Ensure CVI mapping tables are populated. Use transaction BUPA_PRE_DA for pre-conversion data alignment.'
);

// SIMPL-BP-017: Customer/vendor number range synchronization
transforms['SIMPL-BP-017'] = createCommentTransform(
  'SIMPL-BP-017',
  'Customer/vendor number range synchronization',
  /(\s*)(\b(SNRO|NUMBER_RANGE_|NROBJ)\b.*\b(BP|DEBITOR|KREDITOR|BU_PARTNER)\b)/ig,
  'Configure synchronized number ranges for BP, customer, and vendor. Use same-number approach where possible.'
);

// SIMPL-BP-018: Customer sales area data in BP context
transforms['SIMPL-BP-018'] = createCommentTransform(
  'SIMPL-BP-018',
  'Customer sales area data in BP context',
  /(\s*)(\bKNVV\b.*\b(SELECT|READ|LOOP)\b|\b(SELECT|READ|LOOP)\b.*\bKNVV\b)/ig,
  'Use I_CustomerSalesArea CDS view or API_BUSINESS_PARTNER with sales area extension.'
);

// SIMPL-BP-019: Vendor purchasing organization data in BP context
transforms['SIMPL-BP-019'] = createCommentTransform(
  'SIMPL-BP-019',
  'Vendor purchasing organization data in BP context',
  /(\s*)(\b(LFM1|LFM2)\b)/ig,
  'Use I_SupplierPurchasingOrg CDS view or API_BUSINESS_PARTNER with purchasing extension.'
);

// SIMPL-BP-020: BP address management (BUT020/ADRC)
transforms['SIMPL-BP-020'] = createCommentTransform(
  'SIMPL-BP-020',
  'BP address management (BUT020/ADRC)',
  /(\s*)(\b(BUT020|ADRC|ADDR\d_|ADR[0-9])\b)/ig,
  'Use BP address management APIs. Access address data through I_BPContactToAddress or I_Address CDS views.'
);

// SIMPL-BP-021: BP communication data (ADR2/ADR3/ADR6)
transforms['SIMPL-BP-021'] = createCommentTransform(
  'SIMPL-BP-021',
  'BP communication data (ADR2/ADR3/ADR6)',
  /(\s*)(\b(ADR2|ADR3|ADR6|ADR12|ADRP)\b)/ig,
  'Use BP communication data APIs. Access through I_AddressEmailAddress, I_AddressPhoneNumber CDS views.'
);

// SIMPL-BP-022: Customer/vendor tax number migration
transforms['SIMPL-BP-022'] = createCommentTransform(
  'SIMPL-BP-022',
  'Customer/vendor tax number migration',
  /(\s*)(\b(STCD1|STCD2|STCD3|STCD4|STCD5|FITYP)\b)/ig,
  'Use DFKKBPTAXNUM for BP tax numbers. Access via I_BusinessPartnerTaxNumber CDS view.'
);

// SIMPL-BP-023: BP industry sector classification
transforms['SIMPL-BP-023'] = createCommentTransform(
  'SIMPL-BP-023',
  'BP industry sector classification',
  /(\s*)(\b(BUT0IS|BU_ID_TYPE|BU_ID_NUMBER)\b)/ig,
  'Configure industry sector classification for BP. Map legacy industry codes to BP industry sectors.'
);

// SIMPL-BP-024: Contact person BP relationship
transforms['SIMPL-BP-024'] = createCommentTransform(
  'SIMPL-BP-024',
  'Contact person BP relationship',
  /(\s*)(\b(BUR001|BUR010|BUR011|CONTACT_PERSON|BUT051)\b)/ig,
  'Create BP records for contact persons and link via relationship. Use I_BPContactToFuncAndDept CDS view.'
);

// SIMPL-BP-025: Partner function table VBPA changes
transforms['SIMPL-BP-025'] = createCommentTransform(
  'SIMPL-BP-025',
  'Partner function table VBPA changes',
  /(\s*)(\b(VBPA|J_1BSDPARN|TPAR)\b)/ig,
  'Review partner function determination for BP. Verify VBPA-KUNNR is populated via CVI. Use I_SalesDocumentPartner CDS view.'
);

// SIMPL-BP-026: Purchase order partner function changes
transforms['SIMPL-BP-026'] = createCommentTransform(
  'SIMPL-BP-026',
  'Purchase order partner function changes',
  /(\s*)(\bEKPA\b)/ig,
  'Review EKPA partner functions for BP integration. Ensure vendor numbers are synced through CVI.'
);

// SIMPL-BP-027: Vendor hierarchy changes
transforms['SIMPL-BP-027'] = createCommentTransform(
  'SIMPL-BP-027',
  'Vendor hierarchy changes',
  /(\s*)(\b(WYT3|EINA|EINE)\b.*\b(LIFNR|VENDOR)\b|\bWYT3\b)/ig,
  'Review vendor hierarchy structures. Map vendor sub-ranges to BP hierarchy if applicable.'
);

// SIMPL-BP-028: Credit management data in BP
transforms['SIMPL-BP-028'] = createCommentTransform(
  'SIMPL-BP-028',
  'Credit management data in BP',
  /(\s*)(\b(KNKK|KNKA|UKM_BUSINESS_PARTNER|UKM_BP_CMS_SGM)\b)/ig,
  'Migrate credit management to FSCM. Link credit segments to BP. Use UKM_BUSINESS_PARTNER for credit data.'
);

// SIMPL-BP-029: Customer dunning data in BP context
transforms['SIMPL-BP-029'] = createCommentTransform(
  'SIMPL-BP-029',
  'Customer dunning data in BP context',
  /(\s*)(\bKNB5\b)/ig,
  'Access dunning data through I_CustomerDunning CDS view. Ensure BP synchronization for dunning.'
);

// SIMPL-BP-030: Withholding tax data in BP context
transforms['SIMPL-BP-030'] = createCommentTransform(
  'SIMPL-BP-030',
  'Withholding tax data in BP context',
  /(\s*)(\b(LFBW|KNBW|WITH_ITEM)\b)/ig,
  'Use BP withholding tax tables. Access via I_CustomerWithHoldingTax or I_SupplierWithHoldingTax CDS views.'
);

// SIMPL-BP-031: BP identification numbers
transforms['SIMPL-BP-031'] = createFlagTransform(
  'SIMPL-BP-031',
  'BP identification numbers',
  /\b(BUT0ID|BU_ID_TYPE|BU_ID_NUMBER)\b/i,
  'Use BUT0ID for identification numbers. Access through I_BPIdentificationNumber CDS view.'
);

// SIMPL-BP-032: Customer/vendor display transactions deprecated
transforms['SIMPL-BP-032'] = createCommentTransform(
  'SIMPL-BP-032',
  'Customer/vendor display transactions deprecated',
  /(\s*)(\b(VD01|VD02|VD03|MK01|MK02|MK03)\b)/ig,
  'Use BP transaction for master data display/change. Access through Fiori apps Manage Business Partner.'
);

// SIMPL-BP-033: Customer/vendor integration BAdIs
transforms['SIMPL-BP-033'] = createCommentTransform(
  'SIMPL-BP-033',
  'Customer/vendor integration BAdIs',
  /(\s*)(\b(CUSTOMER_ADD_DATA|VENDOR_ADD_DATA|BUPA_|CVI_CUSTOM_)\w*)/ig,
  'Implement CVI BAdIs for custom field mapping. Register custom segments in CVI configuration.'
);

// SIMPL-BP-034: BP pre-conversion data alignment tool
transforms['SIMPL-BP-034'] = createCommentTransform(
  'SIMPL-BP-034',
  'BP pre-conversion data alignment tool',
  /(\s*)(\b(BUPA_PRE_DA|MDS_LOAD_COCKPIT|MDS_BP_)\w*)/ig,
  'Run BUPA_PRE_DA to identify duplicate customers/vendors. Resolve all data inconsistencies before conversion.'
);

// SIMPL-BP-035: Customer company code data in BP context
transforms['SIMPL-BP-035'] = createCommentTransform(
  'SIMPL-BP-035',
  'Customer company code data in BP context',
  /(\s*)(\bKNB1\b.*\b(SELECT|UPDATE|INSERT)\b|\b(SELECT|UPDATE|INSERT)\b.*\bKNB1\b)/ig,
  'Use I_CustomerCompany CDS view or API_BUSINESS_PARTNER for company code level data.'
);

// SIMPL-BP-036: Vendor company code data in BP context
transforms['SIMPL-BP-036'] = createCommentTransform(
  'SIMPL-BP-036',
  'Vendor company code data in BP context',
  /(\s*)(\bLFB1\b.*\b(SELECT|UPDATE|INSERT)\b|\b(SELECT|UPDATE|INSERT)\b.*\bLFB1\b)/ig,
  'Use I_SupplierCompany CDS view or API_BUSINESS_PARTNER for company code level data.'
);

// SIMPL-BP-037: Dual maintenance of customer/vendor and BP
transforms['SIMPL-BP-037'] = createCommentTransform(
  'SIMPL-BP-037',
  'Dual maintenance of customer/vendor and BP',
  /(\s*)(\b(SD_CUSTOMER_MAINTAIN|VENDOR_MAINTAIN|IDOC_INPUT_CREMAS|IDOC_INPUT_DEBMAS)\b)/ig,
  'Use BP API or transaction for all master data changes. Remove any direct writes to KNA1/LFA1 tables.'
);

// SIMPL-BP-038: BP search help and matchcode changes
transforms['SIMPL-BP-038'] = createCommentTransform(
  'SIMPL-BP-038',
  'BP search help and matchcode changes',
  /(\s*)(\b(DEBIA|DEBIE|KREDA|KREDE|SEARCH_HELP_)\w*.*\b(KUNNR|LIFNR)\b)/ig,
  'Use BP search helps or build custom search helps on BUT000. Review collective search helps.'
);


// ── BW / Analytics Rules (BW-001 through BW-028) ──────────────────────────

// SIMPL-BW-001: FI Extractors Replaced
transforms['SIMPL-BW-001'] = createCommentTransform(
  'SIMPL-BW-001',
  'FI Extractors Replaced',
  /(\s*)((0FI_GL_|0FI_AR_|0FI_AP_|\bFAGLFLEXT\b|0FI_AA_))/ig,
  'Migrate to CDS-based extractors (e.g., I_GLAccountLineItem). Review BW data flow for ACDOCA sourcing.'
);

// SIMPL-BW-002: CO Extractors Changed
transforms['SIMPL-BW-002'] = createCommentTransform(
  'SIMPL-BW-002',
  'CO Extractors Changed',
  /(\s*)((0CO_OM_|0CO_PC_|0CO_PA_|\bCOSS\b|\bCOSP\b))/ig,
  'Replace CO extractors with ACDOCA/ACDOCP-based CDS extractors.'
);

// SIMPL-BW-003: MM/SD Extractors Updated
transforms['SIMPL-BW-003'] = createCommentTransform(
  'SIMPL-BW-003',
  'MM/SD Extractors Updated',
  /(\s*)((2LIS_0[1-9]|2LIS_1[1-3]|\bLBWE\b|\bMC_SETUP\b))/ig,
  'Review logistics extractor activation. Validate setup table fills and delta handling.'
);

// SIMPL-BW-004: Asset Extractors Changed
transforms['SIMPL-BW-004'] = createCommentTransform(
  'SIMPL-BW-004',
  'Asset Extractors Changed',
  /(\s*)((0FIAA_|0AM_|\bANLP\b|\bANLC\b))/ig,
  'Migrate to new asset analytics extractors sourcing from ANEK/ANEP via ACDOCA.'
);

// SIMPL-BW-005: Embedded Analytics via CDS Views
transforms['SIMPL-BW-005'] = createCommentTransform(
  'SIMPL-BW-005',
  'Embedded Analytics via CDS Views',
  /(\s*)(\b(CDS_VIEW|I_JOURNAL|C_GLLINE|ANALYTICAL_QUERY)\b)/ig,
  'Evaluate which BW reports can be replaced by embedded analytics CDS views.'
);

// SIMPL-BW-006: Query Migration to BW/4HANA
transforms['SIMPL-BW-006'] = createCommentTransform(
  'SIMPL-BW-006',
  'Query Migration to BW/4HANA',
  /(\s*)(\b(BEX_QUERY|RSZCOMPDIR|RSZELTDIR|MULTIPROVIDER)\b)/ig,
  'Assess BEx queries for BW/4HANA compatibility. Migrate to composite providers where applicable.'
);

// SIMPL-BW-007: Custom Extractors Validation
transforms['SIMPL-BW-007'] = createCommentTransform(
  'SIMPL-BW-007',
  'Custom Extractors Validation',
  /(\s*)(\b(RSA[1-3]|ROOSOURCE|EXTRACTION)\b|Z[A-Z0-9]+_DS)/ig,
  'Test all custom extractors. Replace references to removed tables (BSEG, BKPF, KONV, etc.).'
);

// SIMPL-BW-008: InfoObject Compatibility
transforms['SIMPL-BW-008'] = createCommentTransform(
  'SIMPL-BW-008',
  'InfoObject Compatibility',
  /(\s*)(\b(INFOOBJECT|RSDODSO|RSDIOBJ|ADSO)\b)/ig,
  'Review InfoObject definitions against S/4HANA data model. Reload master data where fields changed.'
);

// SIMPL-BW-009: HR/HCM Extractors Migration
transforms['SIMPL-BW-009'] = createCommentTransform(
  'SIMPL-BW-009',
  'HR/HCM Extractors Migration',
  /(\s*)((0HR_PA_|0HR_PT_|0HR_PY_|0HR_OM_|\bPA_INFOTYPE\b))/ig,
  'Evaluate HR extractor migration path. For cloud HCM, use SuccessFactors OData APIs. For on-premise, validate CDS extractors.'
);

// SIMPL-BW-010: PP/QM Extractors Restructured
transforms['SIMPL-BW-010'] = createCommentTransform(
  'SIMPL-BW-010',
  'PP/QM Extractors Restructured',
  /(\s*)((2LIS_04|2LIS_05|0QM_|0PP_|\bAFKO_EXT\b))/ig,
  'Validate PP/QM extractors. Test production order and inspection lot delta extraction after S/4HANA migration.'
);

// SIMPL-BW-011: PM/CS Extractors for Maintenance Analytics
transforms['SIMPL-BW-011'] = createCommentTransform(
  'SIMPL-BW-011',
  'PM/CS Extractors for Maintenance Analytics',
  /(\s*)((0PM_|0CS_|\bPM_ORDER_EXT\b|\bNOTIF_EXT\b))/ig,
  'Validate PM/CS extractors. Test maintenance order, notification, and equipment hierarchy extraction.'
);

// SIMPL-BW-012: Treasury and Cash Management Extractors
transforms['SIMPL-BW-012'] = createCommentTransform(
  'SIMPL-BW-012',
  'Treasury and Cash Management Extractors',
  /(\s*)((0FITV_|0FICM_|\bTREASURY_EXT\b|\bCASH_MGMT_EXT\b))/ig,
  'Validate treasury and cash management extractors. Test extraction from new cash management data model.'
);

// SIMPL-BW-013: Profitability Analysis (CO-PA) Extractors
transforms['SIMPL-BW-013'] = createCommentTransform(
  'SIMPL-BW-013',
  'Profitability Analysis (CO-PA) Extractors',
  /(\s*)((0CO_PA_|CO_PA_EXT|\bCE[1-9][A-Z0-9]+\b|\bACDOCP\b))/ig,
  'Migrate CO-PA extractors to account-based CO-PA via ACDOCP. Rebuild profitability reports on universal journal.'
);

// SIMPL-BW-014: InfoCube to Advanced DSO Migration
transforms['SIMPL-BW-014'] = createCommentTransform(
  'SIMPL-BW-014',
  'InfoCube to Advanced DSO Migration',
  /(\s*)(\b(INFOCUBE|RSDCUBE|RSKCUBE|CUBE_MIGRATE)\b)/ig,
  'Migrate all InfoCubes to ADSO using BW/4HANA transfer tool. Define inbound and reporting layer per ADSO.'
);

// SIMPL-BW-015: MultiProvider to Composite Provider Migration
transforms['SIMPL-BW-015'] = createCommentTransform(
  'SIMPL-BW-015',
  'MultiProvider to Composite Provider Migration',
  /(\s*)(\b(MULTIPROVIDER|RSDMULTIPROV|COMPOSITE_PROV|UNION_QUERY)\b)/ig,
  'Migrate MultiProviders to Composite Providers. Review union/join definitions and field mapping.'
);

// SIMPL-BW-016: Classic DSO to Advanced DSO Migration
transforms['SIMPL-BW-016'] = createCommentTransform(
  'SIMPL-BW-016',
  'Classic DSO to Advanced DSO Migration',
  /(\s*)(\b(CLASSIC_DSO|RSDODSO|WRITE_OPT_DSO|STD_DSO|DSO_MIGRATE)\b)/ig,
  'Migrate classic DSOs to Advanced DSOs. Configure activation type and change log settings per data flow requirements.'
);

// SIMPL-BW-017: BEx Query to BW/4HANA Query Migration
transforms['SIMPL-BW-017'] = createCommentTransform(
  'SIMPL-BW-017',
  'BEx Query to BW/4HANA Query Migration',
  /(\s*)(\b(BEX_MIGRATE|QUERY_CONVERT|BEX_EXCEPTION|BEX_CONDITION|CUSTOM_STRUCT)\b)/ig,
  'Evaluate BEx queries for BW/4HANA compatibility. Convert unsupported features to Analysis Office or SAC equivalents.'
);

// SIMPL-BW-018: SAP Analytics Cloud Live Connection
transforms['SIMPL-BW-018'] = createCommentTransform(
  'SIMPL-BW-018',
  'SAP Analytics Cloud Live Connection',
  /(\s*)(\b(SAC_LIVE|LIVE_CONNECT|SAC_S4|ANALYTICS_CLOUD)\b)/ig,
  'Evaluate SAC live connection for operational reports. Configure InA service for CDS query exposure to SAC.'
);

// SIMPL-BW-019: SAC Import Connection for BW Data
transforms['SIMPL-BW-019'] = createCommentTransform(
  'SIMPL-BW-019',
  'SAC Import Connection for BW Data',
  /(\s*)(\b(SAC_IMPORT|SAC_SCHED|SAC_PLANNING|SAC_PREDICT)\b)/ig,
  'Configure SAC import connections for BW/4HANA data sources. Set up scheduling for data replication.'
);

// SIMPL-BW-020: Analysis for Office (AfO) Migration to SAC
transforms['SIMPL-BW-020'] = createFlagTransform(
  'SIMPL-BW-020',
  'Analysis for Office (AfO) Migration to SAC',
  /\b(AFO_WORKBOOK|ANALYSIS_OFFICE|AFO_MIGRATE|AFO_FORMULA)\b/i,
  'Evaluate AfO workbooks for SAC story migration. Identify complex features requiring redesign in SAC.'
);

// SIMPL-BW-021: CDS Analytical Query Design
transforms['SIMPL-BW-021'] = createCommentTransform(
  'SIMPL-BW-021',
  'CDS Analytical Query Design',
  /(\s*)(\b(CDS_ANALYTIC|ANALYTIC_QUERY|VDM_VIEW|I_GLACCOUNTLINE)\b|@Analytics[.]query)/ig,
  'Identify BW queries replaceable by CDS analytical queries. Follow VDM naming conventions for custom CDS views.'
);

// SIMPL-BW-022: KPI Tile and Fiori Analytical Apps
transforms['SIMPL-BW-022'] = createCommentTransform(
  'SIMPL-BW-022',
  'KPI Tile and Fiori Analytical Apps',
  /(\s*)(\b(KPI_TILE|FIORI_ANALYTIC|SMART_BUSINESS|SSB_KPI)\b)/ig,
  'Configure Fiori KPI tiles consuming CDS views. Migrate dashboard content to Fiori analytical applications.'
);

// SIMPL-BW-023: SLT-Based Real-Time Replication
transforms['SIMPL-BW-023'] = createCommentTransform(
  'SIMPL-BW-023',
  'SLT-Based Real-Time Replication',
  /(\s*)(\b(SLT_REPL|REAL_TIME_REPL|DMIS_REPL|TRIGGER_REPL)\b)/ig,
  'Reconfigure SLT replication for S/4HANA table changes. Replace replication on removed tables with ACDOCA-based sourcing.'
);

// SIMPL-BW-024: ODP-Based Delta Extraction Framework
transforms['SIMPL-BW-024'] = createCommentTransform(
  'SIMPL-BW-024',
  'ODP-Based Delta Extraction Framework',
  /(\s*)(\b(ODP_EXTRACT|ODP_SOURCE|ODP_DELTA|RODPS_REPL)\b)/ig,
  'Migrate classic extraction to ODP framework. Configure ODP data sources for CDS-based and ABAP extractor-based extraction.'
);

// SIMPL-BW-025: SAP Datasphere (Data Warehouse Cloud) Integration
transforms['SIMPL-BW-025'] = createCommentTransform(
  'SIMPL-BW-025',
  'SAP Datasphere (Data Warehouse Cloud) Integration',
  /(\s*)(\b(DWC_INT|DATASPHERE|DATA_WAREHOUSE_CLOUD|DWC_FEDERATE)\b)/ig,
  'Evaluate SAP Datasphere for cloud analytics. Configure federation or replication connections from S/4HANA.'
);

// SIMPL-BW-026: BW Bridge for Datasphere
transforms['SIMPL-BW-026'] = createFlagTransform(
  'SIMPL-BW-026',
  'BW Bridge for Datasphere',
  /\b(BW_BRIDGE|DWC_BRIDGE|BRIDGE_SPACE|BW_CLOUD)\b/i,
  'Evaluate BW Bridge for cloud migration of BW data models. Assess object compatibility for transfer to Datasphere.'
);

// SIMPL-BW-027: Open SQL and HANA Calculation View Migration
transforms['SIMPL-BW-027'] = createCommentTransform(
  'SIMPL-BW-027',
  'Open SQL and HANA Calculation View Migration',
  /(\s*)(\b(CALC_VIEW|HANA_VIEW|NATIVE_SQL|CV_REPORT|HANA_ANALYTIC)\b)/ig,
  'Validate HANA calculation views against S/4HANA table changes. Migrate to CDS views where possible for upgrade stability.'
);

// SIMPL-BW-028: Process Chain and Data Flow Automation
transforms['SIMPL-BW-028'] = createCommentTransform(
  'SIMPL-BW-028',
  'Process Chain and Data Flow Automation',
  /(\s*)(\b(PROCESS_CHAIN|RSPC|DATA_FLOW|ETL_CHAIN|CHAIN_MONITOR)\b)/ig,
  'Validate process chains end-to-end. Update references to migrated InfoProviders and extractors in all chain steps.'
);


// ── Configuration Rules (CFG-001 through CFG-020) ─────────────────────────

// SIMPL-CFG-001: IMG activity path changes in S/4HANA
transforms['SIMPL-CFG-001'] = createCommentTransform(
  'SIMPL-CFG-001',
  'IMG activity path changes in S/4HANA',
  /(\s*)(\b(SPRO|SCC4|SALE|OB52|OBYA)\b)/ig,
  'Use S/4HANA SPRO or Fiori Manage Your Solution app to locate equivalent activities.'
);

// SIMPL-CFG-002: BC Set transport for configuration
transforms['SIMPL-CFG-002'] = createCommentTransform(
  'SIMPL-CFG-002',
  'BC Set transport for configuration',
  /(\s*)(\b(SCPR3|SCPR20|BC_SET)\b)/ig,
  'Use BC Sets (SCPR3/SCPR20) to package and transport customizing settings.'
);

// SIMPL-CFG-003: Chart of Accounts restructuring
transforms['SIMPL-CFG-003'] = createCommentTransform(
  'SIMPL-CFG-003',
  'Chart of Accounts restructuring',
  /(\s*)(\b(OB13|OB53|SKA1|SKB1|T004)\b)/ig,
  'Review chart of accounts for S/4HANA account type mapping (customer/vendor reconciliation accounts).'
);

// SIMPL-CFG-004: Fiscal year variant configuration
transforms['SIMPL-CFG-004'] = createCommentTransform(
  'SIMPL-CFG-004',
  'Fiscal year variant configuration',
  /(\s*)(\b(OB29|T009B?)\b)/ig,
  'Review fiscal year variants for multi-ledger support. Ensure posting periods align.'
);

// SIMPL-CFG-005: Document type changes for universal journal
transforms['SIMPL-CFG-005'] = createCommentTransform(
  'SIMPL-CFG-005',
  'Document type changes for universal journal',
  /(\s*)(\b(OBA7|T003)\b)/ig,
  'Review document types and number ranges for ACDOCA universal journal posting.'
);

// SIMPL-CFG-006: Posting key simplification
transforms['SIMPL-CFG-006'] = createCommentTransform(
  'SIMPL-CFG-006',
  'Posting key simplification',
  /(\s*)(\b(OB41|T004)\b)/ig,
  'Verify posting key assignments for business partner reconciliation accounts.'
);

// SIMPL-CFG-007: Tax code configuration for S/4HANA
transforms['SIMPL-CFG-007'] = createCommentTransform(
  'SIMPL-CFG-007',
  'Tax code configuration for S/4HANA',
  /(\s*)(\b(FTXP|OB40|T007A)\b)/ig,
  'Review tax codes and tax calculation procedures for S/4HANA.'
);

// SIMPL-CFG-008: Payment terms migration
transforms['SIMPL-CFG-008'] = createFlagTransform(
  'SIMPL-CFG-008',
  'Payment terms migration',
  /\b(OBB8|T052)\b/i,
  'Verify payment terms and baseline date calculation for S/4HANA.'
);

// SIMPL-CFG-009: Controlling area to company code assignment
transforms['SIMPL-CFG-009'] = createCommentTransform(
  'SIMPL-CFG-009',
  'Controlling area to company code assignment',
  /(\s*)(\b(OKKP|OX06|TKA01|TKA02)\b)/ig,
  'Ensure controlling area is assigned 1:1 to company codes. Cross-company code cost allocation may need redesign.'
);

// SIMPL-CFG-010: Cost element category changes
transforms['SIMPL-CFG-010'] = createCommentTransform(
  'SIMPL-CFG-010',
  'Cost element category changes',
  /(\s*)(\b(KA01|KA06|CSKA|CSKB)\b)/ig,
  'Cost elements are auto-created from GL accounts. Review GL account master for CO relevance flag.'
);

// SIMPL-CFG-011: Activity type and price configuration
transforms['SIMPL-CFG-011'] = createCommentTransform(
  'SIMPL-CFG-011',
  'Activity type and price configuration',
  /(\s*)(\b(KP26|KP27|CSLA)\b)/ig,
  'Review activity type configuration and plan price calculation for ACDOCA.'
);

// SIMPL-CFG-012: Material type configuration for 40-char MATNR
transforms['SIMPL-CFG-012'] = createCommentTransform(
  'SIMPL-CFG-012',
  'Material type configuration for 40-char MATNR',
  /(\s*)(\b(OMS2|T134)\b)/ig,
  'Review material type configuration and number range assignments for 40-char material numbers.'
);

// SIMPL-CFG-013: Plant and storage location configuration
transforms['SIMPL-CFG-013'] = createCommentTransform(
  'SIMPL-CFG-013',
  'Plant and storage location configuration',
  /(\s*)(\b(OX10|OX09|T001W|T001L)\b)/ig,
  'Review plant/storage location settings for embedded EWM migration.'
);

// SIMPL-CFG-014: Purchasing organization configuration
transforms['SIMPL-CFG-014'] = createCommentTransform(
  'SIMPL-CFG-014',
  'Purchasing organization configuration',
  /(\s*)(\b(OX08|T024E?)\b)/ig,
  'Review purchasing organization for central procurement and Ariba integration.'
);

// SIMPL-CFG-015: Sales organization and distribution channel
transforms['SIMPL-CFG-015'] = createCommentTransform(
  'SIMPL-CFG-015',
  'Sales organization and distribution channel',
  /(\s*)(\b(OVX5|TVKO|TVTW|TSPA)\b)/ig,
  'Review sales org structure for S/4HANA credit management and advanced ATP.'
);

// SIMPL-CFG-016: Sales document type configuration
transforms['SIMPL-CFG-016'] = createCommentTransform(
  'SIMPL-CFG-016',
  'Sales document type configuration',
  /(\s*)(\b(VOV8|TVAK|TVLK|TVFK)\b)/ig,
  'Review sales doc types, delivery types, and billing types for S/4HANA changes.'
);

// SIMPL-CFG-017: Pricing procedure configuration
transforms['SIMPL-CFG-017'] = createCommentTransform(
  'SIMPL-CFG-017',
  'Pricing procedure configuration',
  /(\s*)(\b(V\/08|T683S|T685)\b)/ig,
  'Review pricing procedures and condition types for S/4HANA compatibility.'
);

// SIMPL-CFG-018: Number range configuration for S/4HANA
transforms['SIMPL-CFG-018'] = createCommentTransform(
  'SIMPL-CFG-018',
  'Number range configuration for S/4HANA',
  /(\s*)(\b(SNRO|FBN1|NRIV)\b)/ig,
  'Review and extend number ranges for ACDOCA documents, BP numbers, and material numbers.'
);

// SIMPL-CFG-019: Output management configuration
transforms['SIMPL-CFG-019'] = createCommentTransform(
  'SIMPL-CFG-019',
  'Output management configuration',
  /(\s*)(\b(NACE|NACH|NACD)\b)/ig,
  'Migrate output types to S/4HANA Output Management with BRF+ rules.'
);

// SIMPL-CFG-020: Credit management configuration migration
transforms['SIMPL-CFG-020'] = createCommentTransform(
  'SIMPL-CFG-020',
  'Credit management configuration migration',
  /(\s*)(\b(FD32|OVA8|T014|UKM_)\b)/ig,
  'Migrate to SAP Credit Management (UKM). Configure credit segments and rules.'
);


// ── Data Model Rules (DM-001 through DM-045) ──────────────────────────────

// SIMPL-DM-001: BKPF header table restructured
transforms['SIMPL-DM-001'] = createCommentTransform(
  'SIMPL-DM-001',
  'BKPF header table restructured',
  /(\s*)(\bBKPF\b)/ig,
  'Use CDS view I_JournalEntry for document headers. Review field-level changes.'
);

// SIMPL-DM-002: EKKO purchase order header changes
transforms['SIMPL-DM-002'] = createCommentTransform(
  'SIMPL-DM-002',
  'EKKO purchase order header changes',
  /(\s*)(\bEKKO\b)/ig,
  'Review EKKO field usage against S/4HANA data model.'
);

// SIMPL-DM-003: EKPO purchase order item changes
transforms['SIMPL-DM-003'] = createCommentTransform(
  'SIMPL-DM-003',
  'EKPO purchase order item changes',
  /(\s*)(\bEKPO\b)/ig,
  'Review EKPO field usage. Note MATNR length change to 40.'
);

// SIMPL-DM-004: VBAK sales order header changes
transforms['SIMPL-DM-004'] = createCommentTransform(
  'SIMPL-DM-004',
  'VBAK sales order header changes',
  /(\s*)(\bVBAK\b)/ig,
  'Review VBAK field usage. Use API_SALES_ORDER_SRV for new developments.'
);

// SIMPL-DM-005: VBAP sales order item changes
transforms['SIMPL-DM-005'] = createCommentTransform(
  'SIMPL-DM-005',
  'VBAP sales order item changes',
  /(\s*)(\bVBAP\b)/ig,
  'Review VBAP field usage. Note MATNR length change to 40.'
);

// SIMPL-DM-006: MKPF material document header changes
transforms['SIMPL-DM-006'] = createCommentTransform(
  'SIMPL-DM-006',
  'MKPF material document header changes',
  /(\s*)(\bMKPF\b)/ig,
  'Review MKPF field usage. Use CDS views I_MaterialDocumentHeader.'
);

// SIMPL-DM-007: MSEG material document item changes
transforms['SIMPL-DM-007'] = createCommentTransform(
  'SIMPL-DM-007',
  'MSEG material document item changes',
  /(\s*)(\bMSEG\b)/ig,
  'Review MSEG field usage. Use CDS views I_MaterialDocumentItem.'
);

// SIMPL-DM-008: CO-PA operating concern restructured
transforms['SIMPL-DM-008'] = createCommentTransform(
  'SIMPL-DM-008',
  'CO-PA operating concern restructured',
  /(\s*)(\b(CE1\w+|CE2\w+|CE3\w+|CE4\w+)\b)/g,
  'Use ACDOCA-based margin analysis or CDS views for profitability.'
);

// SIMPL-DM-009: Material Ledger tables restructured
transforms['SIMPL-DM-009'] = createCommentTransform(
  'SIMPL-DM-009',
  'Material Ledger tables restructured',
  /(\s*)(\b(CKMLHD|CKMLCT|CKMLPP)\b)/ig,
  'Review actual costing data model. Use CDS views I_ActualCostRate*.'
);

// SIMPL-DM-010: COEP CO line items replaced
transforms['SIMPL-DM-010'] = createCommentTransform(
  'SIMPL-DM-010',
  'COEP CO line items replaced',
  /(\s*)(\bCOEP\b)/ig,
  'Use ACDOCA for CO line items or CDS views I_CostCenterActualData.'
);

// SIMPL-DM-011: LIKP delivery header changes
transforms['SIMPL-DM-011'] = createCommentTransform(
  'SIMPL-DM-011',
  'LIKP delivery header changes',
  /(\s*)(\bLIKP\b)/ig,
  'Review LIKP field usage. Use API_OUTBOUND_DELIVERY_SRV.'
);

// SIMPL-DM-012: LIPS delivery item changes
transforms['SIMPL-DM-012'] = createCommentTransform(
  'SIMPL-DM-012',
  'LIPS delivery item changes',
  /(\s*)(\bLIPS\b)/ig,
  'Review LIPS field usage. Note MATNR length change.'
);

// SIMPL-DM-013: COBK CO document header removed
transforms['SIMPL-DM-013'] = createCommentTransform(
  'SIMPL-DM-013',
  'COBK CO document header removed',
  /(\s*)(\bCOBK\b)/ig,
  'Use ACDOCA for CO document data.'
);

// SIMPL-DM-014: BSEG accounting document line items replaced
transforms['SIMPL-DM-014'] = createCommentTransform(
  'SIMPL-DM-014',
  'BSEG accounting document line items replaced',
  /(\s*)(\bBSEG\b)/ig,
  'Replace BSEG access with ACDOCA or CDS view I_JournalEntryItem. For line item reports use I_GLAccountLineItem.'
);

// SIMPL-DM-015: BSID customer open items replaced
transforms['SIMPL-DM-015'] = createCommentTransform(
  'SIMPL-DM-015',
  'BSID customer open items replaced',
  /(\s*)(\bBSID\b)/ig,
  'Use CDS view I_JournalEntryItem with customer filter or I_OperationalAcctgDocItem. For open items use clearing status in ACDOCA.'
);

// SIMPL-DM-016: BSIK vendor open items replaced
transforms['SIMPL-DM-016'] = createCommentTransform(
  'SIMPL-DM-016',
  'BSIK vendor open items replaced',
  /(\s*)(\bBSIK\b)/ig,
  'Use CDS view I_JournalEntryItem with vendor filter or I_OperationalAcctgDocItem. For open items use clearing status in ACDOCA.'
);

// SIMPL-DM-017: BSAD customer cleared items replaced
transforms['SIMPL-DM-017'] = createCommentTransform(
  'SIMPL-DM-017',
  'BSAD customer cleared items replaced',
  /(\s*)(\bBSAD\b)/ig,
  'Use CDS view I_JournalEntryItem with customer and clearing filters. Query ACDOCA with AUGDT (clearing date) populated.'
);

// SIMPL-DM-018: BSAK vendor cleared items replaced
transforms['SIMPL-DM-018'] = createCommentTransform(
  'SIMPL-DM-018',
  'BSAK vendor cleared items replaced',
  /(\s*)(\bBSAK\b)/ig,
  'Use CDS view I_JournalEntryItem with vendor and clearing filters. Query ACDOCA with AUGDT (clearing date) populated.'
);

// SIMPL-DM-019: BSIS GL open items replaced
transforms['SIMPL-DM-019'] = createCommentTransform(
  'SIMPL-DM-019',
  'BSIS GL open items replaced',
  /(\s*)(\bBSIS\b)/ig,
  'Use CDS view I_GLAccountLineItem or I_JournalEntryItem for GL line items from ACDOCA.'
);

// SIMPL-DM-020: BSAS GL cleared items replaced
transforms['SIMPL-DM-020'] = createCommentTransform(
  'SIMPL-DM-020',
  'BSAS GL cleared items replaced',
  /(\s*)(\bBSAS\b)/ig,
  'Use CDS view I_GLAccountLineItem with clearing status filter on ACDOCA.'
);

// SIMPL-DM-021: GLT0 GL totals table replaced
transforms['SIMPL-DM-021'] = createCommentTransform(
  'SIMPL-DM-021',
  'GLT0 GL totals table replaced',
  /(\s*)(\bGLT0\b)/ig,
  'Use CDS view I_GLAccountBalance or aggregate from ACDOCA. FAGLFLEXT is also a compatibility view.'
);

// SIMPL-DM-022: FAGLFLEXT new GL totals table replaced
transforms['SIMPL-DM-022'] = createCommentTransform(
  'SIMPL-DM-022',
  'FAGLFLEXT new GL totals table replaced',
  /(\s*)(\bFAGLFLEXT\b)/ig,
  'Use CDS view I_GLAccountBalance for GL totals. Aggregate directly from ACDOCA for custom reports.'
);

// SIMPL-DM-023: KONV condition record table replaced
transforms['SIMPL-DM-023'] = createCommentTransform(
  'SIMPL-DM-023',
  'KONV condition record table replaced',
  /(\s*)(\bKONV\b)/ig,
  'Use PRCD_ELEMENTS for pricing conditions. Use CDS view I_SlsDocPricingElement or I_BillingDocPricingElement.'
);

// SIMPL-DM-024: KONP condition item table replaced
transforms['SIMPL-DM-024'] = createCommentTransform(
  'SIMPL-DM-024',
  'KONP condition item table replaced',
  /(\s*)(\bKONP\b)/ig,
  'Use PRCD_ELEMENTS for condition details. Access via I_SlsDocPricingElement CDS view.'
);

// SIMPL-DM-025: KONH condition header table replaced
transforms['SIMPL-DM-025'] = createCommentTransform(
  'SIMPL-DM-025',
  'KONH condition header table replaced',
  /(\s*)(\bKONH\b)/ig,
  'Use PRCD_ELEMENTS for condition header data. Use CDS views for pricing element access.'
);

// SIMPL-DM-026: VBFA document flow table changes
transforms['SIMPL-DM-026'] = createCommentTransform(
  'SIMPL-DM-026',
  'VBFA document flow table changes',
  /(\s*)(\bVBFA\b)/ig,
  'Review VBFA field usage. Use CDS view I_SalesDocumentFlow or API_SALES_ORDER_SRV for document flow.'
);

// SIMPL-DM-027: ACDOCA universal journal table
transforms['SIMPL-DM-027'] = createCommentTransform(
  'SIMPL-DM-027',
  'ACDOCA universal journal table',
  /(\s*)(\bACDOCA\b)/ig,
  'ACDOCA is the target table. Use CDS views I_JournalEntry, I_JournalEntryItem for access. Design custom reports on ACDOCA.'
);

// SIMPL-DM-028: ACDOCP plan data table
transforms['SIMPL-DM-028'] = createCommentTransform(
  'SIMPL-DM-028',
  'ACDOCP plan data table',
  /(\s*)(\bACDOCP\b)/ig,
  'Use ACDOCP for plan data access. Use CDS view I_JournalEntryItemPlan for plan reporting.'
);

// SIMPL-DM-029: COSP CO plan totals replaced
transforms['SIMPL-DM-029'] = createCommentTransform(
  'SIMPL-DM-029',
  'COSP CO plan totals replaced',
  /(\s*)(\bCOSP\b)/ig,
  'Use ACDOCP for CO plan data. Use CDS view I_CostCenterPlanData for plan reporting.'
);

// SIMPL-DM-030: COSS CO actual totals replaced
transforms['SIMPL-DM-030'] = createCommentTransform(
  'SIMPL-DM-030',
  'COSS CO actual totals replaced',
  /(\s*)(\bCOSS\b)/ig,
  'Use ACDOCA for CO actual data. Use CDS view I_CostCenterActualData for actual reporting.'
);

// SIMPL-DM-031: Compatibility views have performance limitations
transforms['SIMPL-DM-031'] = createCommentTransform(
  'SIMPL-DM-031',
  'Compatibility views have performance limitations',
  /(\s*)(\b(SELECT\s+(?:SUM|COUNT|AVG|MAX|MIN)\s*\(.*\)\s+FROM\s+(?:BSEG|BSID|BSIK|BSAD|BSAK|BSIS|BSAS|GLT0|FAGLFLEXT))\b)/ig,
  'Replace aggregate queries on compatibility views with ACDOCA-based CDS views. Performance degradation can be 10-100x on compatibility views.'
);

// SIMPL-DM-032: ANLA/ANLP asset tables restructured
transforms['SIMPL-DM-032'] = createCommentTransform(
  'SIMPL-DM-032',
  'ANLA/ANLP asset tables restructured',
  /(\s*)(\b(ANLA|ANLP|ANLC|ANLZ|ANEK)\b)/ig,
  'Use CDS views I_FixedAsset, I_AssetDepreciationArea. Asset values are also in ACDOCA (BSTAT = A).'
);

// SIMPL-DM-033: RBKP invoice document header changes
transforms['SIMPL-DM-033'] = createCommentTransform(
  'SIMPL-DM-033',
  'RBKP invoice document header changes',
  /(\s*)(\bRBKP\b)/ig,
  'Review RBKP field usage. Use API_SUPPLIERINVOICE_PROCESS_SRV for new invoice processing.'
);

// SIMPL-DM-034: RSEG invoice document item changes
transforms['SIMPL-DM-034'] = createCommentTransform(
  'SIMPL-DM-034',
  'RSEG invoice document item changes',
  /(\s*)(\bRSEG\b)/ig,
  'Review RSEG field usage. Note MATNR length change to 40. Use I_SupplierInvoiceItem CDS view.'
);

// SIMPL-DM-035: VBRK billing document header changes
transforms['SIMPL-DM-035'] = createCommentTransform(
  'SIMPL-DM-035',
  'VBRK billing document header changes',
  /(\s*)(\bVBRK\b)/ig,
  'Review VBRK field usage. Use I_BillingDocument CDS view. Access pricing via I_BillingDocPricingElement.'
);

// SIMPL-DM-036: VBRP billing document item changes
transforms['SIMPL-DM-036'] = createCommentTransform(
  'SIMPL-DM-036',
  'VBRP billing document item changes',
  /(\s*)(\bVBRP\b)/ig,
  'Review VBRP field usage. Use I_BillingDocumentItem CDS view. Note MATNR length change.'
);

// SIMPL-DM-037: PRCD_ELEMENTS pricing condition table
transforms['SIMPL-DM-037'] = createCommentTransform(
  'SIMPL-DM-037',
  'PRCD_ELEMENTS pricing condition table',
  /(\s*)(\bPRCD_ELEMENTS\b)/ig,
  'PRCD_ELEMENTS is the target table. Use appropriate CDS views (I_SlsDocPricingElement, I_PurgDocPricingElement) for access.'
);

// SIMPL-DM-038: NAST output management table replaced
transforms['SIMPL-DM-038'] = createCommentTransform(
  'SIMPL-DM-038',
  'NAST output management table replaced',
  /(\s*)(\bNAST\b)/ig,
  'Migrate output determination to BRF+ framework. Use PPF (Post Processing Framework) actions for output.'
);

// SIMPL-DM-039: TNAPR output type configuration replaced
transforms['SIMPL-DM-039'] = createCommentTransform(
  'SIMPL-DM-039',
  'TNAPR output type configuration replaced',
  /(\s*)(\bTNAPR\b)/ig,
  'Configure output types in BRF+ based output management. Migrate form assignments to new framework.'
);

// SIMPL-DM-040: EBAN purchase requisition changes
transforms['SIMPL-DM-040'] = createCommentTransform(
  'SIMPL-DM-040',
  'EBAN purchase requisition changes',
  /(\s*)(\bEBAN\b)/ig,
  'Review EBAN field usage. Use I_PurchaseRequisitionItem CDS view. Note MATNR length change.'
);

// SIMPL-DM-041: MATNR field length change to 40 characters
transforms['SIMPL-DM-041'] = createCommentTransform(
  'SIMPL-DM-041',
  'MATNR field length change to 40 characters',
  /(\s*)(\bMATNR\b.*\b(CHAR18|C\(18\)|TYPE\s+MATNR)\b|\bTYPE\s+MATNR\b)/ig,
  'Review all MATNR declarations. Use TYPE reference to data element (MATNR) rather than fixed length. Update all interfaces and file layouts.'
);

// SIMPL-DM-042: Condition contract tables changed
transforms['SIMPL-DM-042'] = createCommentTransform(
  'SIMPL-DM-042',
  'Condition contract tables changed',
  /(\s*)(\b(WCOCO|WCOCOD|WCOC_|WB2_)\w*)/ig,
  'Use new condition contract management APIs. Review condition contract data model changes.'
);

// SIMPL-DM-043: MARC plant data for material changes
transforms['SIMPL-DM-043'] = createCommentTransform(
  'SIMPL-DM-043',
  'MARC plant data for material changes',
  /(\s*)(\bMARC\b)/ig,
  'Review MARC field usage against S/4HANA data model. Use I_ProductPlant CDS view for new developments.'
);

// SIMPL-DM-044: MARA material master changes
transforms['SIMPL-DM-044'] = createCommentTransform(
  'SIMPL-DM-044',
  'MARA material master changes',
  /(\s*)(\bMARA\b)/ig,
  'Review MARA field usage. Use I_Product CDS view or API_PRODUCT_SRV for new developments.'
);

// SIMPL-DM-045: AUFK order master data changes
transforms['SIMPL-DM-045'] = createCommentTransform(
  'SIMPL-DM-045',
  'AUFK order master data changes',
  /(\s*)(\bAUFK\b)/ig,
  'Review AUFK field usage. Use I_InternalOrder CDS view. CO order postings are in ACDOCA.'
);


// ── Enhancement/Extensibility Rules (ENH-001 through ENH-035) ─────────────

// SIMPL-ENH-001: User Exit usage (SMOD/CMOD)
transforms['SIMPL-ENH-001'] = createCommentTransform(
  'SIMPL-ENH-001',
  'User Exit usage (SMOD/CMOD)',
  /(\s*)(\bUSEREXIT_|CUSTOMER-FUNCTION\b)/ig,
  'Migrate to equivalent BAdI implementations.'
);

// SIMPL-ENH-002: Modification of standard SAP objects
transforms['SIMPL-ENH-002'] = createCommentTransform(
  'SIMPL-ENH-002',
  'Modification of standard SAP objects',
  /(\s*)(^Y\d{3}|^ZXXX)/ig,
  'Replace modifications with BAdI or Enhancement Spot implementations.'
);

// SIMPL-ENH-003: SMOD enhancement usage
transforms['SIMPL-ENH-003'] = createCommentTransform(
  'SIMPL-ENH-003',
  'SMOD enhancement usage',
  /(\s*)(\bSMOD\b)/ig,
  'Replace SMOD enhancements with Enhancement Spots or BAdIs.'
);

// SIMPL-ENH-004: CMOD project enhancements
transforms['SIMPL-ENH-004'] = createCommentTransform(
  'SIMPL-ENH-004',
  'CMOD project enhancements',
  /(\s*)(\bCMOD\b)/ig,
  'Migrate CMOD enhancement projects to BAdI implementations.'
);

// SIMPL-ENH-005: Modification flag in standard code
transforms['SIMPL-ENH-005'] = createCommentTransform(
  'SIMPL-ENH-005',
  'Modification flag in standard code',
  /(\s*)(\bmodification\s+flag|BEGIN\s+OF\s+INSERT\b)/ig,
  'Remove modifications. Use Enhancement Spots or Key User Extensibility.'
);

// SIMPL-ENH-006: Enhancement Spot pattern detected
transforms['SIMPL-ENH-006'] = createCommentTransform(
  'SIMPL-ENH-006',
  'Enhancement Spot pattern detected',
  /(\s*)(\bENHANCEMENT\s+\d+\b)/ig,
  'Review Enhancement Spot implementations for S/4HANA compatibility.'
);

// SIMPL-ENH-007: Implicit enhancement usage
transforms['SIMPL-ENH-007'] = createFlagTransform(
  'SIMPL-ENH-007',
  'Implicit enhancement usage',
  /\bENHANCEMENT-POINT\b/i,
  'Review implicit enhancements for conflicts with S/4HANA code.'
);

// SIMPL-ENH-008: BTE (Business Transaction Events) usage
transforms['SIMPL-ENH-008'] = createCommentTransform(
  'SIMPL-ENH-008',
  'BTE (Business Transaction Events) usage',
  /(\s*)(\b(OPEN_FI_|BAPI_BTE_)\w+)/ig,
  'Review BTE implementations for S/4HANA parameter changes.'
);

// SIMPL-ENH-009: Classic BAdI (GET BADI) usage
transforms['SIMPL-ENH-009'] = createCommentTransform(
  'SIMPL-ENH-009',
  'Classic BAdI (GET BADI) usage',
  /(\s*)(\b(GET\s+BADI|CALL\s+BADI)\b)/ig,
  'Review BAdI implementations for changed filter values or interfaces.'
);

// SIMPL-ENH-010: USEREXIT_* function module pattern
transforms['SIMPL-ENH-010'] = createCommentTransform(
  'SIMPL-ENH-010',
  'USEREXIT_* function module pattern',
  /(\s*)(\bUSEREXIT_\w+)/ig,
  'Identify the replacement BAdI for each USEREXIT. Use transaction SE18 to find equivalent new BAdI definitions.'
);

// SIMPL-ENH-011: Customer exit function modules (EXIT_*)
transforms['SIMPL-ENH-011'] = createCommentTransform(
  'SIMPL-ENH-011',
  'Customer exit function modules (EXIT_*)',
  /(\s*)(\bEXIT_\w+_\d{3}\b)/ig,
  'Replace EXIT_ function module implementations with equivalent BAdI. Map each exit to the corresponding BAdI definition.'
);

// SIMPL-ENH-012: Enhancement Section (ENHANCEMENT-SECTION)
transforms['SIMPL-ENH-012'] = createCommentTransform(
  'SIMPL-ENH-012',
  'Enhancement Section (ENHANCEMENT-SECTION)',
  /(\s*)(\bENHANCEMENT-SECTION\b)/ig,
  'Review enhancement section implementations. The replaced standard code may have changed in S/4HANA.'
);

// SIMPL-ENH-013: END-ENHANCEMENT-SECTION pattern
transforms['SIMPL-ENH-013'] = createCommentTransform(
  'SIMPL-ENH-013',
  'END-ENHANCEMENT-SECTION pattern',
  /(\s*)(\bEND-ENHANCEMENT-SECTION\b)/ig,
  'Verify the original standard code that was replaced still exists and has not been restructured in S/4HANA.'
);

// SIMPL-ENH-014: Modification browser (SE95) adjustments needed
transforms['SIMPL-ENH-014'] = createCommentTransform(
  'SIMPL-ENH-014',
  'Modification browser (SE95) adjustments needed',
  /(\s*)(\bSE95\b|MODIFICATION_BROWSER)/ig,
  'Run SE95 modification browser. Catalog all modifications and plan migration to BAdI or enhancement spots.'
);

// SIMPL-ENH-015: Custom transactions referencing removed tables
transforms['SIMPL-ENH-015'] = createCommentTransform(
  'SIMPL-ENH-015',
  'Custom transactions referencing removed tables',
  /(\s*)(\b(CALL\s+TRANSACTION|LEAVE\s+TO\s+TRANSACTION)\s+['"]Z\w+['"])/ig,
  'Identify all custom transactions and review their underlying reports for removed table access. Migrate to CDS-based data access.'
);

// SIMPL-ENH-016: Custom reports using deprecated FI APIs
transforms['SIMPL-ENH-016'] = createCommentTransform(
  'SIMPL-ENH-016',
  'Custom reports using deprecated FI APIs',
  /(\s*)(\b(FAGL_GET_LINE_ITEMS|FI_ITEMS_SELECT|FI_DOCUMENT_READ|BAPI_GL_GETGLACCBALANCE)\b)/ig,
  'Replace deprecated FI APIs with CDS views (I_JournalEntryItem, I_GLAccountLineItem) or ACDOCA direct access.'
);

// SIMPL-ENH-017: Custom reports using deprecated MM APIs
transforms['SIMPL-ENH-017'] = createCommentTransform(
  'SIMPL-ENH-017',
  'Custom reports using deprecated MM APIs',
  /(\s*)(\b(ME_READ_PO_FOR_PRINTING|BAPI_PO_GETDETAIL|BAPI_PO_GETITEMS|MM_READ_MATERIAL_DOC)\b)/ig,
  'Replace with API_PURCHASEORDER_PROCESS_SRV or CDS views I_PurchaseOrder, I_PurchaseOrderItem.'
);

// SIMPL-ENH-018: Custom reports using deprecated SD APIs
transforms['SIMPL-ENH-018'] = createCommentTransform(
  'SIMPL-ENH-018',
  'Custom reports using deprecated SD APIs',
  /(\s*)(\b(SD_SALESDOCUMENT_READ|BAPI_SALESORDER_GETLIST|RV_ORDER_FLOW_INFORMATION)\b)/ig,
  'Replace with API_SALES_ORDER_SRV or CDS views I_SalesOrder, I_SalesOrderItem.'
);

// SIMPL-ENH-019: New BAdI (class-based) implementation
transforms['SIMPL-ENH-019'] = createCommentTransform(
  'SIMPL-ENH-019',
  'New BAdI (class-based) implementation',
  /(\s*)(\bCL_EXITHANDLER\s*=>\s*GET_INSTANCE\b)/ig,
  'Review new BAdI implementations via SE19. Verify filter values and interface signatures against S/4HANA definitions.'
);

// SIMPL-ENH-020: Classic BAdI definition (SE18 old style)
transforms['SIMPL-ENH-020'] = createCommentTransform(
  'SIMPL-ENH-020',
  'Classic BAdI definition (SE18 old style)',
  /(\s*)(\bCL_BADI_|IF_EX_\w+)/ig,
  'Check if classic BAdI has been migrated to new BAdI in S/4HANA. Update implementation class references accordingly.'
);

// SIMPL-ENH-021: Key User Extensibility (custom fields)
transforms['SIMPL-ENH-021'] = createCommentTransform(
  'SIMPL-ENH-021',
  'Key User Extensibility (custom fields)',
  /(\s*)(\bCUSTOM_FIELD|CF_FIELD_|INCL_EEW_\w+)/ig,
  'Evaluate Key User Extensibility for simple field extensions. Use Custom Fields and Logic app in Fiori Launchpad.'
);

// SIMPL-ENH-022: Custom CDS view extensibility
transforms['SIMPL-ENH-022'] = createCommentTransform(
  'SIMPL-ENH-022',
  'Custom CDS view extensibility',
  /(\s*)(\b(EXTEND\s+VIEW|@AbapCatalog\.sqlViewAppendName)\b)/ig,
  'Use CDS view extensions (EXTEND VIEW) instead of custom copies. Ensure annotations are compatible with S/4HANA.'
);

// SIMPL-ENH-023: Custom CDS views on removed tables
transforms['SIMPL-ENH-023'] = createCommentTransform(
  'SIMPL-ENH-023',
  'Custom CDS views on removed tables',
  /(\s*)(\bdefine\s+view\b.*\b(BSEG|BSID|BSIK|BSAD|BSAK|KONV|KONP|GLT0|FAGLFLEXT|COBK|COEP)\b)/ig,
  'Rewrite custom CDS views to use ACDOCA, PRCD_ELEMENTS, or standard S/4HANA CDS views as data sources.'
);

// SIMPL-ENH-024: Enhancement point (ENHANCEMENT-POINT) usage
transforms['SIMPL-ENH-024'] = createCommentTransform(
  'SIMPL-ENH-024',
  'Enhancement point (ENHANCEMENT-POINT) usage',
  /(\s*)(\bENHANCEMENT-POINT\s+\w+\b)/ig,
  'Review all enhancement point implementations. Verify the surrounding standard code context has not changed in S/4HANA.'
);

// SIMPL-ENH-025: ABAP append structures on changed tables
transforms['SIMPL-ENH-025'] = createCommentTransform(
  'SIMPL-ENH-025',
  'ABAP append structures on changed tables',
  /(\s*)(\b(CI_BSEG|CI_KONV|CI_COEP|CI_COBK|CI_BSID|CI_BSIK)\b)/ig,
  'Migrate append structures to the replacement tables. For BSEG use ACDOCA extension. For KONV use PRCD_ELEMENTS extension.'
);

// SIMPL-ENH-026: Custom includes in standard structures
transforms['SIMPL-ENH-026'] = createCommentTransform(
  'SIMPL-ENH-026',
  'Custom includes in standard structures',
  /(\s*)(\bINCLUDE\s+(ZZ|YY)\w+)/ig,
  'Review all custom includes in standard structures. Ensure no field name conflicts with new S/4HANA fields.'
);

// SIMPL-ENH-027: Screen exits and subscreens
transforms['SIMPL-ENH-027'] = createCommentTransform(
  'SIMPL-ENH-027',
  'Screen exits and subscreens',
  /(\s*)(\bCALL\s+SUBSCREEN\b.*\bZ\w+|CALL\s+SUBSCREEN\b.*\bY\w+)/ig,
  'Review screen exits for compatibility. Consider migrating custom screen logic to Fiori UI extensions.'
);

// SIMPL-ENH-028: Menu exits usage
transforms['SIMPL-ENH-028'] = createCommentTransform(
  'SIMPL-ENH-028',
  'Menu exits usage',
  /(\s*)(\bCALL\s+CUSTOMER-FUNCTION\b)/ig,
  'Review menu exits. If the base transaction is removed, migrate to Fiori app extension or custom Fiori tile.'
);

// SIMPL-ENH-029: Substitution and validation rules (GGB1/GGB4)
transforms['SIMPL-ENH-029'] = createCommentTransform(
  'SIMPL-ENH-029',
  'Substitution and validation rules (GGB1/GGB4)',
  /(\s*)(\b(GGB1|GGB4|OBBH|OB28|GCX2)\b)/ig,
  'Review all substitution and validation rules. Verify field references against S/4HANA ACDOCA structure.'
);

// SIMPL-ENH-030: Custom workflow tasks referencing removed objects
transforms['SIMPL-ENH-030'] = createCommentTransform(
  'SIMPL-ENH-030',
  'Custom workflow tasks referencing removed objects',
  /(\s*)(\b(SWO1|PFTC|TS\d{8})\b)/ig,
  'Review custom workflow tasks and object types. Migrate references to S/4HANA compatible APIs and transactions.'
);

// SIMPL-ENH-031: Custom RFC function modules using removed tables
transforms['SIMPL-ENH-031'] = createCommentTransform(
  'SIMPL-ENH-031',
  'Custom RFC function modules using removed tables',
  /(\s*)(\bFUNCTION\s+['"]?(Z_RFC_|Y_RFC_)\w+)/ig,
  'Review all custom RFC function modules for removed table access. Migrate to CDS-based OData services where possible.'
);

// SIMPL-ENH-032: Custom IDocs using deprecated segments
transforms['SIMPL-ENH-032'] = createCommentTransform(
  'SIMPL-ENH-032',
  'Custom IDocs using deprecated segments',
  /(\s*)(\b(IDOC_INPUT_|IDOC_OUTPUT_|SEGMENTS\s+Z\w+|SEGMENT\s+TYPE\s+Z\w+)\b)/ig,
  'Review custom IDoc segments for deprecated field references. Update segment definitions for S/4HANA data model.'
);

// SIMPL-ENH-033: In-App Extensibility (S/4HANA Cloud model)
transforms['SIMPL-ENH-033'] = createCommentTransform(
  'SIMPL-ENH-033',
  'In-App Extensibility (S/4HANA Cloud model)',
  /(\s*)(\b(EXTENSIBILITY|IN_APP_FEATURES|CUSTOM_ENTITY)\b)/ig,
  'Evaluate In-App Extensibility for cloud-ready enhancements. Use Custom Fields, Custom Logic, and Custom CDS views.'
);

// SIMPL-ENH-034: Side-by-side extensibility via SAP BTP
transforms['SIMPL-ENH-034'] = createFlagTransform(
  'SIMPL-ENH-034',
  'Side-by-side extensibility via SAP BTP',
  /\b(BTP_|SIDE_BY_SIDE|CAP_APPLICATION|RAP_)\w*/i,
  'Consider side-by-side extensibility on SAP BTP for complex custom applications. Use RAP (ABAP RESTful Application Programming) for on-stack extensions.'
);

// SIMPL-ENH-035: Custom programs using obsolete ABAP statements
transforms['SIMPL-ENH-035'] = createCommentTransform(
  'SIMPL-ENH-035',
  'Custom programs using obsolete ABAP statements',
  /(\s*)(\b(OCCURS\s+\d+|TABLES\s+\w+\s+STRUCTURE|FIELD-GROUPS|EXTRACT\s+|HEADER\s+LINE)\b)/ig,
  'Replace obsolete ABAP statements with modern equivalents. Use ABAP cleaner tool for automated refactoring.'
);


// ── Extended Warehouse Management Rules (EWM-001 through EWM-028) ─────────

// SIMPL-EWM-001: Legacy WM (LE-WM) Removed
transforms['SIMPL-EWM-001'] = createCommentTransform(
  'SIMPL-EWM-001',
  'Legacy WM (LE-WM) Removed',
  /(\s*)(\b(LT0[1-9]|LT1[0-9]|LT2[1-5]|LS0[1-9]|LS2[0-6])\b)/ig,
  'Replace LE-WM transaction codes with EWM equivalents (e.g., /SCWM/ADGI, /SCWM/MON).'
);

// SIMPL-EWM-002: Warehouse Number Configuration Change
transforms['SIMPL-EWM-002'] = createCommentTransform(
  'SIMPL-EWM-002',
  'Warehouse Number Configuration Change',
  /(\s*)(\b(LAGP|T300|T301|T30[2-9])\b)/ig,
  'Map legacy warehouse numbers to EWM warehouse numbers via /SCWM/T300.'
);

// SIMPL-EWM-003: Storage Bin Structure Changed
transforms['SIMPL-EWM-003'] = createCommentTransform(
  'SIMPL-EWM-003',
  'Storage Bin Structure Changed',
  /(\s*)(\b(LQUA|LAGP-LGPLA|NQUA|MDVM)\b)/ig,
  'Migrate storage bin data using /SCWM/LAGP. Review quant model in /SCWM/AQUA.'
);

// SIMPL-EWM-004: Transfer Orders Replaced by Warehouse Tasks
transforms['SIMPL-EWM-004'] = createCommentTransform(
  'SIMPL-EWM-004',
  'Transfer Orders Replaced by Warehouse Tasks',
  /(\s*)(\b(LTAP|LTAK|LTBK|L_TO_|BAPI_WHSE_TO)\b)/ig,
  'Replace transfer order logic with warehouse task APIs (/SCWM/API_WT_CREATE).'
);

// SIMPL-EWM-005: Goods Movement Integration Changed
transforms['SIMPL-EWM-005'] = createCommentTransform(
  'SIMPL-EWM-005',
  'Goods Movement Integration Changed',
  /(\s*)(\b(BAPI_GOODSMVT_CREATE.*WM|MB_CREATE_GOODS_MOVEMENT.*WM|L_WM_)\b)/ig,
  'Review WM-triggered goods movements. EWM uses delivery-based or posting change-based processing.'
);

// SIMPL-EWM-006: RF Framework Replaced
transforms['SIMPL-EWM-006'] = createCommentTransform(
  'SIMPL-EWM-006',
  'RF Framework Replaced',
  /(\s*)(\b(LM[0-9]{2}|SAPLLMOB)\b)/ig,
  'Migrate RF customizations to EWM RF framework. Review /SCWM/RFUI configuration.'
);

// SIMPL-EWM-007: Physical Inventory in EWM
transforms['SIMPL-EWM-007'] = createCommentTransform(
  'SIMPL-EWM-007',
  'Physical Inventory in EWM',
  /(\s*)(\b(LI0[1-9]|LI1[0-9]|LI2[01]|LX[0-9]{2})\b)/ig,
  'Migrate physical inventory procedures to EWM. Use /SCWM/PI* transactions.'
);

// SIMPL-EWM-008: Handling Unit Management in EWM
transforms['SIMPL-EWM-008'] = createCommentTransform(
  'SIMPL-EWM-008',
  'Handling Unit Management in EWM',
  /(\s*)(\b(HUMO|HU_CREATE|BAPI_HU_CREATE|L_HU_)\b)/ig,
  'Review HU processes for EWM compatibility. Use /SCWM/PACK for HU operations.'
);

// SIMPL-EWM-009: Yard Management Activation
transforms['SIMPL-EWM-009'] = createFlagTransform(
  'SIMPL-EWM-009',
  'Yard Management Activation',
  /\b(YARD_MANAGEMENT|DOCK_APPOINTMENT)\b/i,
  'Evaluate yard management features in embedded EWM for optimization.'
);

// SIMPL-EWM-010: Wave Management Activation
transforms['SIMPL-EWM-010'] = createCommentTransform(
  'SIMPL-EWM-010',
  'Wave Management Activation',
  /(\s*)(\b(WAVE_MANAGEMENT|GROUP_PROCESSING|LT41)\b)/ig,
  'Configure wave management in EWM to replace group-based processing.'
);

// SIMPL-EWM-011: Putaway Strategy Migration
transforms['SIMPL-EWM-011'] = createCommentTransform(
  'SIMPL-EWM-011',
  'Putaway Strategy Migration',
  /(\s*)(\b(PUTAWAY_STRAT|LP21|LS21|L_PUTAWAY|WM_PUTAWAY)\b)/ig,
  'Configure EWM putaway rules via /SCWM/PRULE. Map legacy putaway strategies to EWM determination logic.'
);

// SIMPL-EWM-012: Storage Type Determination in EWM
transforms['SIMPL-EWM-012'] = createCommentTransform(
  'SIMPL-EWM-012',
  'Storage Type Determination in EWM',
  /(\s*)(\b(T334T|T334P|STORAGE_TYPE_DET|LS01|LS02)\b)/ig,
  'Configure storage process types in EWM. Use /SCWM/SPT for storage process assignment.'
);

// SIMPL-EWM-013: Picking Strategy Replacement
transforms['SIMPL-EWM-013'] = createCommentTransform(
  'SIMPL-EWM-013',
  'Picking Strategy Replacement',
  /(\s*)(\b(PICK_STRATEGY|LP10|LP11|L_PICK|WM_PICKING)\b)/ig,
  'Configure EWM stock removal strategies via /SCWM/SRULE. Define pick point determination and consolidation groups.'
);

// SIMPL-EWM-014: Pick-by-Voice and Pick-by-Light Integration
transforms['SIMPL-EWM-014'] = createCommentTransform(
  'SIMPL-EWM-014',
  'Pick-by-Voice and Pick-by-Light Integration',
  /(\s*)(\b(PICK_BY_VOICE|PICK_BY_LIGHT|RF_PICK_CUSTOM|PTL_PICK)\b)/ig,
  'Migrate custom picking device integrations to EWM native pick-by-voice or pick-by-light framework.'
);

// SIMPL-EWM-015: Packing Station Process Migration
transforms['SIMPL-EWM-015'] = createCommentTransform(
  'SIMPL-EWM-015',
  'Packing Station Process Migration',
  /(\s*)(\b(COWB|VL02N.*PACK|WM_PACKING|PACK_STATION)\b)/ig,
  'Configure EWM packing workstation (/SCWM/PACK). Define packing profiles, ship-HU determination, and printing.'
);

// SIMPL-EWM-016: Staging Area Management
transforms['SIMPL-EWM-016'] = createCommentTransform(
  'SIMPL-EWM-016',
  'Staging Area Management',
  /(\s*)(\b(STAGING_AREA|GI_STAGING|LOADING_POINT|WM_STAGING)\b)/ig,
  'Define EWM staging areas and assign to doors. Configure warehouse order steps for staging and loading.'
);

// SIMPL-EWM-017: EWM Product Master Data Alignment
transforms['SIMPL-EWM-017'] = createCommentTransform(
  'SIMPL-EWM-017',
  'EWM Product Master Data Alignment',
  /(\s*)(\b(EWM_PRODUCT|MARD.*EWM|SCWM_PRODUCT|PRODUCT_WHSE)\b|\/SCWM\/MARA)/ig,
  'Maintain EWM product master data. Configure /SCWM/MAT1 for warehouse product assignment and storage parameters.'
);

// SIMPL-EWM-018: Packaging Specification Management
transforms['SIMPL-EWM-018'] = createCommentTransform(
  'SIMPL-EWM-018',
  'Packaging Specification Management',
  /(\s*)(\b(PACK_SPEC|PACKAGING_SPEC|PACK_INSTRUCTION|HU_TEMPLATE)\b|\/SCWM\/PACKSPEC)/ig,
  'Define packaging specifications in /SCWM/PACKSPEC. Map legacy packing instructions to EWM packaging hierarchies.'
);

// SIMPL-EWM-019: Activity Area Configuration
transforms['SIMPL-EWM-019'] = createCommentTransform(
  'SIMPL-EWM-019',
  'Activity Area Configuration',
  /(\s*)(\b(ACTIVITY_AREA|STORAGE_SECTION|PICKING_AREA|T301.*SECTION)\b)/ig,
  'Configure EWM activity areas. Map legacy storage sections to activity areas for process control and reporting.'
);

// SIMPL-EWM-020: Labor Management Activation
transforms['SIMPL-EWM-020'] = createCommentTransform(
  'SIMPL-EWM-020',
  'Labor Management Activation',
  /(\s*)(\b(LABOR_MGMT|EWM_LM|WORKER_PROD|ENGINEERED_STANDARD)\b|\/SCWM\/LM)/ig,
  'Evaluate EWM labor management module. Configure engineered standards and indirect labor tracking if applicable.'
);

// SIMPL-EWM-021: Resource Management for MHE
transforms['SIMPL-EWM-021'] = createCommentTransform(
  'SIMPL-EWM-021',
  'Resource Management for MHE',
  /(\s*)(\b(MHE_RESOURCE|RESOURCE_MGMT|FORKLIFT_ASSIGN|CONVEYOR_CTRL)\b|\/SCWM\/RSRC)/ig,
  'Configure EWM resources via /SCWM/RSRC. Define resource types and assign to queues for warehouse order processing.'
);

// SIMPL-EWM-022: Slotting and Rearrangement
transforms['SIMPL-EWM-022'] = createFlagTransform(
  'SIMPL-EWM-022',
  'Slotting and Rearrangement',
  /\b(SLOTTING|REARRANGEMENT|BIN_OPTIMIZATION|SLOT_PLAN)\b|\/SCWM\/SLOT/i,
  'Evaluate EWM slotting functionality. Configure slotting parameters and rearrangement runs for bin optimization.'
);

// SIMPL-EWM-023: Quality Inspection in Warehouse
transforms['SIMPL-EWM-023'] = createCommentTransform(
  'SIMPL-EWM-023',
  'Quality Inspection in Warehouse',
  /(\s*)(\b(EWM_QI|QA_INSPECTION.*WH|WH_QUALITY|INSPECT_RULE)\b|\/SCWM\/QI)/ig,
  'Configure EWM quality inspection rules. Integrate with S/4HANA QM for inspection lot creation and usage decisions.'
);

// SIMPL-EWM-024: Cross-Docking Processing
transforms['SIMPL-EWM-024'] = createCommentTransform(
  'SIMPL-EWM-024',
  'Cross-Docking Processing',
  /(\s*)(\b(CROSS_DOCK|X_DOCK|CD_PLANNING|PUSH_DEPLOYMENT)\b|\/SCWM\/CD)/ig,
  'Configure EWM cross-docking rules. Define cross-docking criteria and relevance determination.'
);

// SIMPL-EWM-025: Value-Added Services (VAS)
transforms['SIMPL-EWM-025'] = createFlagTransform(
  'SIMPL-EWM-025',
  'Value-Added Services (VAS)',
  /\b(VAS_ORDER|VALUE_ADDED|KITTING|VAS_ACTIVITY)\b|\/SCWM\/VAS/i,
  'Evaluate EWM VAS capabilities. Configure VAS order types and integrate with production or outbound processing.'
);

// SIMPL-EWM-026: EWM-TM Integration for Freight Processing
transforms['SIMPL-EWM-026'] = createCommentTransform(
  'SIMPL-EWM-026',
  'EWM-TM Integration for Freight Processing',
  /(\s*)(\b(EWM_TM_INT|FREIGHT_WH|DOCK_SCHEDULE|TM_LOADING)\b|\/SCWM\/TM)/ig,
  'Configure EWM-TM integration scenarios. Set up dock appointment scheduling and freight order-based warehouse processing.'
);

// SIMPL-EWM-027: Production Supply via EWM (PP-EWM Integration)
transforms['SIMPL-EWM-027'] = createCommentTransform(
  'SIMPL-EWM-027',
  'Production Supply via EWM (PP-EWM Integration)',
  /(\s*)(\b(PROD_SUPPLY|PMR_REQUEST|STAGING_METHOD|PP_EWM_INT)\b|\/SCWM\/PMR)/ig,
  'Configure production supply scenarios in EWM. Define staging methods and production material request processing.'
);

// SIMPL-EWM-028: Replenishment Control in EWM
transforms['SIMPL-EWM-028'] = createCommentTransform(
  'SIMPL-EWM-028',
  'Replenishment Control in EWM',
  /(\s*)(\b(REPLENISHMENT|REPL_CONTROL|MIN_MAX_STOCK|LP22)\b|\/SCWM\/REPL)/ig,
  'Configure EWM replenishment rules. Define replenishment triggers, minimum/maximum stock levels, and priority logic.'
);


// ── Global Trade Services Rules (GTS-001 through GTS-024) ─────────────────

// SIMPL-GTS-001: Sanctions Screening Integration
transforms['SIMPL-GTS-001'] = createCommentTransform(
  'SIMPL-GTS-001',
  'Sanctions Screening Integration',
  /(\s*)(\b(SPL_CHECK|SANCTIONED_PARTY|GTS_SPL)\b|\/SAPSLL\/)/ig,
  'Configure embedded compliance screening or maintain side-car GTS with updated RFC integration.'
);

// SIMPL-GTS-002: Export Control Classification
transforms['SIMPL-GTS-002'] = createCommentTransform(
  'SIMPL-GTS-002',
  'Export Control Classification',
  /(\s*)(\b(ECCN|EXPORT_LICENSE|LICENSE_DET)\b|\/SAPSLL\/CL_)/ig,
  'Review export control master data. Ensure ECCN classification aligns with BP-based partner model.'
);

// SIMPL-GTS-003: Customs Declaration Processing
transforms['SIMPL-GTS-003'] = createCommentTransform(
  'SIMPL-GTS-003',
  'Customs Declaration Processing',
  /(\s*)(\b(CUSTOMS_DECL|CUSDEC)\b|\/SAPSLL\/CD_)/ig,
  'Test customs declaration triggers from S/4HANA deliveries and billing documents.'
);

// SIMPL-GTS-004: Tariff Code / HS Code Maintenance
transforms['SIMPL-GTS-004'] = createCommentTransform(
  'SIMPL-GTS-004',
  'Tariff Code / HS Code Maintenance',
  /(\s*)(\b(TARIFF_CODE|HS_CODE|COMMODITY_CODE|STAWN)\b)/ig,
  'Validate HS code assignments in product master. Check GTS commodity code derivation.'
);

// SIMPL-GTS-005: Intrastat / Extrastat Reporting
transforms['SIMPL-GTS-005'] = createCommentTransform(
  'SIMPL-GTS-005',
  'Intrastat / Extrastat Reporting',
  /(\s*)(\b(INTRASTAT|EXTRASTAT|EU_REPORTING|MIRS)\b)/ig,
  'Test Intrastat/Extrastat report generation with S/4HANA data. Verify country-specific reporting.'
);

// SIMPL-GTS-006: Preference Determination Changed
transforms['SIMPL-GTS-006'] = createCommentTransform(
  'SIMPL-GTS-006',
  'Preference Determination Changed',
  /(\s*)(\b(PREFERENCE_DET|ORIGIN_DET|VENDOR_DEC)\b|\/SAPSLL\/PD_)/ig,
  'Review preference determination with new product and vendor (BP) data models.'
);

// SIMPL-GTS-007: Free Trade Agreement Management
transforms['SIMPL-GTS-007'] = createFlagTransform(
  'SIMPL-GTS-007',
  'Free Trade Agreement Management',
  /\b(FREE_TRADE|FTA_MGMT|CERT_ORIGIN)\b/i,
  'Verify FTA configurations and certificate of origin generation in GTS side-car.'
);

// SIMPL-GTS-008: License Management Integration
transforms['SIMPL-GTS-008'] = createCommentTransform(
  'SIMPL-GTS-008',
  'License Management Integration',
  /(\s*)(\b(TRADE_LICENSE|LICENSE_MGMT)\b|\/SAPSLL\/LM_)/ig,
  'Reconfigure license determination to work with S/4HANA sales and purchasing documents.'
);

// SIMPL-GTS-009: Import Declaration Procedure Migration
transforms['SIMPL-GTS-009'] = createCommentTransform(
  'SIMPL-GTS-009',
  'Import Declaration Procedure Migration',
  /(\s*)(\b(IMPORT_DECL|IMPORT_CUSTOMS|INWARD_PROCESS|IMPORT_PROC)\b|\/SAPSLL\/IM_)/ig,
  'Test import declaration generation from S/4HANA purchase orders and inbound deliveries. Validate customs procedure codes.'
);

// SIMPL-GTS-010: Import Duty Calculation and Posting
transforms['SIMPL-GTS-010'] = createCommentTransform(
  'SIMPL-GTS-010',
  'Import Duty Calculation and Posting',
  /(\s*)(\b(IMPORT_DUTY|DUTY_CALC|ANTI_DUMP|COUNTERVAIL)\b|\/SAPSLL\/DC_)/ig,
  'Validate import duty calculation rules. Test FI posting of duties against ACDOCA journal entries.'
);

// SIMPL-GTS-011: Export Declaration and AES Filing
transforms['SIMPL-GTS-011'] = createCommentTransform(
  'SIMPL-GTS-011',
  'Export Declaration and AES Filing',
  /(\s*)(\b(EXPORT_DECL|AES_FILING|ECS_FILING|ATLAS_EXPORT)\b|\/SAPSLL\/EX_)/ig,
  'Test export declaration triggers from S/4HANA deliveries. Validate AES/ATLAS message generation and EDI transmission.'
);

// SIMPL-GTS-012: Export Control and Denied Party Screening
transforms['SIMPL-GTS-012'] = createCommentTransform(
  'SIMPL-GTS-012',
  'Export Control and Denied Party Screening',
  /(\s*)(\b(DENIED_PARTY|END_USE_CHECK|CATCH_ALL|EXPORT_CTRL)\b)/ig,
  'Reconfigure export control screening for BP model. Validate denied party list sources and screening logic.'
);

// SIMPL-GTS-013: Embargo Country Screening Configuration
transforms['SIMPL-GTS-013'] = createCommentTransform(
  'SIMPL-GTS-013',
  'Embargo Country Screening Configuration',
  /(\s*)(\b(EMBARGO_CHECK|COUNTRY_SANCTION|SANCTION_SCREEN|EMBARGO_LIST)\b)/ig,
  'Update embargo screening to use BP address and role data. Validate comprehensive and targeted sanctions processing.'
);

// SIMPL-GTS-014: Sanctioned Party List (SPL) Update Automation
transforms['SIMPL-GTS-014'] = createCommentTransform(
  'SIMPL-GTS-014',
  'Sanctioned Party List (SPL) Update Automation',
  /(\s*)(\b(SPL_UPDATE|OFAC_SDN|EU_SANCTION|UN_SANCTION|SPL_MASS)\b)/ig,
  'Validate SPL update automation. Test mass re-screening after list updates for all active business partners.'
);

// SIMPL-GTS-015: Product Classification for Trade Compliance
transforms['SIMPL-GTS-015'] = createCommentTransform(
  'SIMPL-GTS-015',
  'Product Classification for Trade Compliance',
  /(\s*)(\b(GTS_CLASSIF|PROD_CLASSIF|LEGAL_REG|NATL_TARIFF)\b|\/SAPSLL\/PR_)/ig,
  'Review product classification assignments. Validate legal regulation linkage with 40-char material numbers.'
);

// SIMPL-GTS-016: Classification Change Management and Audit
transforms['SIMPL-GTS-016'] = createCommentTransform(
  'SIMPL-GTS-016',
  'Classification Change Management and Audit',
  /(\s*)(\b(CLASSIF_CHANGE|RECLASS|HS_UPDATE|ECCN_CHANGE|CLASSIF_AUDIT)\b)/ig,
  'Validate classification change history migration. Ensure audit trail completeness for regulatory compliance.'
);

// SIMPL-GTS-017: Bonded Warehouse Management
transforms['SIMPL-GTS-017'] = createCommentTransform(
  'SIMPL-GTS-017',
  'Bonded Warehouse Management',
  /(\s*)(\b(BONDED_WH|DUTY_SUSPEND|CUSTOMS_BOND|BONDED_STOCK)\b|\/SAPSLL\/BW_)/ig,
  'Test bonded warehouse admission and release workflows. Validate inventory reconciliation with customs authorities.'
);

// SIMPL-GTS-018: Foreign Trade Zone (FTZ) Processing
transforms['SIMPL-GTS-018'] = createCommentTransform(
  'SIMPL-GTS-018',
  'Foreign Trade Zone (FTZ) Processing',
  /(\s*)(\b(FREE_ZONE|FTZ_PROC|ZONE_ADMIT|ZONE_TRANSFER)\b)/ig,
  'Validate FTZ processing scenarios. Test zone admission from inbound delivery and zone release for domestic consumption.'
);

// SIMPL-GTS-019: Electronic Customs Message Configuration
transforms['SIMPL-GTS-019'] = createCommentTransform(
  'SIMPL-GTS-019',
  'Electronic Customs Message Configuration',
  /(\s*)(\b(ECUSTOMS|CUSTOMS_EDI|CUSTOMS_XML|ICS_MSG|NCTS_MSG)\b)/ig,
  'Reconfigure electronic customs messaging. Validate EDI/XML connectivity and message formats for each customs authority.'
);

// SIMPL-GTS-020: Customs Authority Response Handling
transforms['SIMPL-GTS-020'] = createCommentTransform(
  'SIMPL-GTS-020',
  'Customs Authority Response Handling',
  /(\s*)(\b(CUSTOMS_RESP|RELEASE_CONFIRM|DUTY_ASSESS|CUSTOMS_ERROR)\b)/ig,
  'Test customs response processing end-to-end. Validate status update propagation from GTS to S/4HANA documents.'
);

// SIMPL-GTS-021: US Customs (CBP) Specific Requirements
transforms['SIMPL-GTS-021'] = createCommentTransform(
  'SIMPL-GTS-021',
  'US Customs (CBP) Specific Requirements',
  /(\s*)(\b(ACE_FILING|HTS_CLASS|ISF_FILING|CBP_CUSTOMS|SEC_301)\b)/ig,
  'Validate US customs-specific configurations. Test ACE filing, HTS classification, and ISF generation.'
);

// SIMPL-GTS-022: EU Customs (UCC) Specific Requirements
transforms['SIMPL-GTS-022'] = createCommentTransform(
  'SIMPL-GTS-022',
  'EU Customs (UCC) Specific Requirements',
  /(\s*)(\b(UCC_CUSTOMS|ATLAS_DE|CHIEF_UK|CDS_UK|DELTA_G|NCTS_EU)\b)/ig,
  'Test EU country-specific customs messaging. Validate ATLAS, CHIEF/CDS, and NCTS configurations per country.'
);

// SIMPL-GTS-023: China Customs and Cross-Border E-Commerce
transforms['SIMPL-GTS-023'] = createCommentTransform(
  'SIMPL-GTS-023',
  'China Customs and Cross-Border E-Commerce',
  /(\s*)(\b(CHINA_CUSTOMS|CIQ_INSPECT|CROSS_BORDER_EC|SPECIAL_ZONE_CN)\b)/ig,
  'Validate China customs integration. Test CIQ inspection triggers and cross-border e-commerce declaration flows.'
);

// SIMPL-GTS-024: Letter of Credit and Trade Finance Integration
transforms['SIMPL-GTS-024'] = createCommentTransform(
  'SIMPL-GTS-024',
  'Letter of Credit and Trade Finance Integration',
  /(\s*)(\b(LETTER_CREDIT|LC_MGMT|TRADE_FINANCE|LC_COMPLIANCE)\b)/ig,
  'Validate letter of credit processing with BP model. Test trade finance document compliance checks.'
);


// ── Human Resources Rules (HR-001 through HR-053) ─────────────────────────

// SIMPL-HR-001: PA infotype tables restructured
transforms['SIMPL-HR-001'] = createCommentTransform(
  'SIMPL-HR-001',
  'PA infotype tables restructured',
  /(\s*)(\bPA00[0-9]{2}\b)/ig,
  'Review infotype usage. Consider SuccessFactors Employee Central for cloud HCM.'
);

// SIMPL-HR-002: OM object tables changed
transforms['SIMPL-HR-002'] = createCommentTransform(
  'SIMPL-HR-002',
  'OM object tables changed',
  /(\s*)(\b(HRP1000|HRP1001|HRP1002)\b)/ig,
  'Review OM data model. Consider SuccessFactors for org management.'
);

// SIMPL-HR-003: Payroll cluster tables
transforms['SIMPL-HR-003'] = createCommentTransform(
  'SIMPL-HR-003',
  'Payroll cluster tables',
  /(\s*)(\b(PCL1|PCL2|PC_PAYRESULT)\b)/ig,
  'Plan payroll data migration carefully. Consider parallel payroll runs.'
);

// SIMPL-HR-004: Payroll function modules changes
transforms['SIMPL-HR-004'] = createCommentTransform(
  'SIMPL-HR-004',
  'Payroll function modules changes',
  /(\s*)(\b(RPCLST|HR_PAYROLL_|HRCM_)\w+)/ig,
  'Review custom payroll schemas and calculations for compatibility.'
);

// SIMPL-HR-005: Time evaluation changes
transforms['SIMPL-HR-005'] = createCommentTransform(
  'SIMPL-HR-005',
  'Time evaluation changes',
  /(\s*)(\b(TEVEN|CATSDB|TM04)\b)/ig,
  'Review time management. Consider SuccessFactors Time Tracking.'
);

// SIMPL-HR-006: Attendance/absence types changed
transforms['SIMPL-HR-006'] = createCommentTransform(
  'SIMPL-HR-006',
  'Attendance/absence types changed',
  /(\s*)(\b(PA2001|PA2002)\b)/ig,
  'Review absence/attendance type configuration.'
);

// SIMPL-HR-007: Benefits administration changes
transforms['SIMPL-HR-007'] = createCommentTransform(
  'SIMPL-HR-007',
  'Benefits administration changes',
  /(\s*)(\b(PA0167|PA0168|HRBEN_)\w*)/ig,
  'Review benefits setup. Consider SuccessFactors Benefits for cloud.'
);

// SIMPL-HR-008: Classic recruitment replaced
transforms['SIMPL-HR-008'] = createCommentTransform(
  'SIMPL-HR-008',
  'Classic recruitment replaced',
  /(\s*)(\b(HRERC_|PB[0-9]{4})\b)/ig,
  'Migrate to SuccessFactors Recruiting.'
);

// SIMPL-HR-009: Talent management to SuccessFactors
transforms['SIMPL-HR-009'] = createCommentTransform(
  'SIMPL-HR-009',
  'Talent management to SuccessFactors',
  /(\s*)(\b(HRTMC_|LSO_)\w+)/ig,
  'Migrate to SuccessFactors Learning/Performance/Succession.'
);

// SIMPL-HR-010: HR master data BAPIs changed
transforms['SIMPL-HR-010'] = createCommentTransform(
  'SIMPL-HR-010',
  'HR master data BAPIs changed',
  /(\s*)(\b(BAPI_EMPLOYEE_|HR_INFOTYPE_OPERATION)\b)/ig,
  'Review HR BAPIs. Consider SuccessFactors APIs for cloud integration.'
);

// SIMPL-HR-011: ESS/MSS Web Dynpro replaced
transforms['SIMPL-HR-011'] = createCommentTransform(
  'SIMPL-HR-011',
  'ESS/MSS Web Dynpro replaced',
  /(\s*)(\b(HRESS_|HRMSS_)\w+)/ig,
  'Migrate to Fiori ESS/MSS apps or SuccessFactors.'
);

// SIMPL-HR-012: Travel Management replaced by Concur
transforms['SIMPL-HR-012'] = createCommentTransform(
  'SIMPL-HR-012',
  'Travel Management replaced by Concur',
  /(\s*)(\b(PRAP|PRTE|TRIP)\b)/ig,
  'Migrate to SAP Concur for travel and expense management.'
);

// SIMPL-HR-013: Personnel actions (PA40) changes
transforms['SIMPL-HR-013'] = createCommentTransform(
  'SIMPL-HR-013',
  'Personnel actions (PA40) changes',
  /(\s*)(\b(PA40|PA42)\b|PERSONNEL_ACTION)/ig,
  'Review personnel action configuration. Use Fiori app Maintain Employee Master Data.'
);

// SIMPL-HR-014: Custom infotype handling
transforms['SIMPL-HR-014'] = createCommentTransform(
  'SIMPL-HR-014',
  'Custom infotype handling',
  /(\s*)(\bPA9[0-9]{3}\b)/ig,
  'Review custom infotype structures. Validate screen enhancements for Fiori compatibility.'
);

// SIMPL-HR-015: Personnel number range assignment
transforms['SIMPL-HR-015'] = createCommentTransform(
  'SIMPL-HR-015',
  'Personnel number range assignment',
  /(\s*)(\bRP_PROVIDE_FROM_LAST\b|PERNR_RANGE)/ig,
  'Review personnel number range configuration and external number assignment.'
);

// SIMPL-HR-016: PA infotype screen enhancements
transforms['SIMPL-HR-016'] = createFlagTransform(
  'SIMPL-HR-016',
  'PA infotype screen enhancements',
  /\bPM01\b|INFOTYPE_SCREEN/i,
  'Review infotype screen enhancements. Fiori apps may bypass classic dynpro screens.'
);

// SIMPL-HR-017: PA data replication to Employee Central
transforms['SIMPL-HR-017'] = createCommentTransform(
  'SIMPL-HR-017',
  'PA data replication to Employee Central',
  /(\s*)(\bEC_\w+|EMPLOYEE_CENTRAL\b|SF_EC)/ig,
  'Plan Employee Central data mapping. Use SAP Integration Suite for replication.'
);

// SIMPL-HR-018: Feature-based configuration (PE03)
transforms['SIMPL-HR-018'] = createFlagTransform(
  'SIMPL-HR-018',
  'Feature-based configuration (PE03)',
  /\b(PE03|PE04)\b|FEATURE_\w+/i,
  'Review HR features. Ensure decision trees are compatible with S/4HANA data model.'
);

// SIMPL-HR-019: Concurrent employment handling
transforms['SIMPL-HR-019'] = createCommentTransform(
  'SIMPL-HR-019',
  'Concurrent employment handling',
  /(\s*)(\bCONCURRENT_EMPL\b|MULTIPLE_ASSIGNMENT)/ig,
  'Review concurrent employment setup. Validate personnel assignment handling.'
);

// SIMPL-HR-020: Organizational structure BAPIs
transforms['SIMPL-HR-020'] = createCommentTransform(
  'SIMPL-HR-020',
  'Organizational structure BAPIs',
  /(\s*)(\b(BAPI_ORGUNIT_\w+|RH_READ_\w+|RH_GET_\w+))/ig,
  'Review OM BAPIs. Consider SuccessFactors APIs for organizational management.'
);

// SIMPL-HR-021: Position management changes (PPOME)
transforms['SIMPL-HR-021'] = createCommentTransform(
  'SIMPL-HR-021',
  'Position management changes (PPOME)',
  /(\s*)(\b(PPOME|PPOM_OLD|PO13)\b)/ig,
  'Review position management. Use Fiori app Maintain Positions or SuccessFactors.'
);

// SIMPL-HR-022: OM evaluation paths
transforms['SIMPL-HR-022'] = createCommentTransform(
  'SIMPL-HR-022',
  'OM evaluation paths',
  /(\s*)(\b(PPST|T778A)\b|EVAL_PATH)/ig,
  'Review evaluation paths. Ensure custom paths work with S/4HANA OM structure.'
);

// SIMPL-HR-023: Integration model OM to PA (RHINTE)
transforms['SIMPL-HR-023'] = createCommentTransform(
  'SIMPL-HR-023',
  'Integration model OM to PA (RHINTE)',
  /(\s*)(\bRHINTE\w+)/ig,
  'Review OM-PA integration configuration. Validate position-person assignment.'
);

// SIMPL-HR-024: OM infotype enhancements (HRP1000+)
transforms['SIMPL-HR-024'] = createFlagTransform(
  'SIMPL-HR-024',
  'OM infotype enhancements (HRP1000+)',
  /\bHRP[0-9]{4}\b/i,
  'Review custom OM infotypes and object type definitions for S/4HANA.'
);

// SIMPL-HR-025: Payroll schema customizations (PE01)
transforms['SIMPL-HR-025'] = createCommentTransform(
  'SIMPL-HR-025',
  'Payroll schema customizations (PE01)',
  /(\s*)(\b(PE01|PE02)\b|PAYROLL_SCHEMA)/ig,
  'Test all custom payroll schemas in S/4HANA. Validate calculation results with parallel run.'
);

// SIMPL-HR-026: Wage type configuration changes
transforms['SIMPL-HR-026'] = createCommentTransform(
  'SIMPL-HR-026',
  'Wage type configuration changes',
  /(\s*)(\bV_512W_D\b|WAGE_TYPE\b|T512W\b)/ig,
  'Review wage type configuration. Validate processing classes and cumulation rules.'
);

// SIMPL-HR-027: Payroll driver country-specific changes
transforms['SIMPL-HR-027'] = createCommentTransform(
  'SIMPL-HR-027',
  'Payroll driver country-specific changes',
  /(\s*)(\bRPCALC\w+)/ig,
  'Review country-specific payroll changes. Apply latest SAP notes for payroll drivers.'
);

// SIMPL-HR-028: Payroll cluster data conversion
transforms['SIMPL-HR-028'] = createCommentTransform(
  'SIMPL-HR-028',
  'Payroll cluster data conversion',
  /(\s*)(\bPCL2\b|PAYROLL_RESULT)/ig,
  'Plan PCL2 data conversion. Ensure payroll results are readable after migration.'
);

// SIMPL-HR-029: Payroll posting to Finance (RPCIPE)
transforms['SIMPL-HR-029'] = createCommentTransform(
  'SIMPL-HR-029',
  'Payroll posting to Finance (RPCIPE)',
  /(\s*)(\bRPCIPE\w+|PC00_M\w+_CIPE)/ig,
  'Review payroll posting configuration. Posting now targets ACDOCA Universal Journal.'
);

// SIMPL-HR-030: Retroactive payroll accounting
transforms['SIMPL-HR-030'] = createCommentTransform(
  'SIMPL-HR-030',
  'Retroactive payroll accounting',
  /(\s*)(\bRETRO_PAYROLL\b|EARLIEST_RETRO|RPCLSTR)/ig,
  'Review retroactive payroll configuration. Validate retro calculation accuracy.'
);

// SIMPL-HR-031: Third-party remittance changes
transforms['SIMPL-HR-031'] = createCommentTransform(
  'SIMPL-HR-031',
  'Third-party remittance changes',
  /(\s*)(\bRPCEDT\w+|GARNISHMENT\b|THIRD_PARTY_REMIT)/ig,
  'Review third-party remittance configuration and payment processing.'
);

// SIMPL-HR-032: Time recording integration (CATS)
transforms['SIMPL-HR-032'] = createCommentTransform(
  'SIMPL-HR-032',
  'Time recording integration (CATS)',
  /(\s*)(\b(CATS|CAT2|CAT6)\b)/ig,
  'Use Fiori app My Timesheet or Manage Working Times. Review CATS configuration.'
);

// SIMPL-HR-033: Absence quota management
transforms['SIMPL-HR-033'] = createCommentTransform(
  'SIMPL-HR-033',
  'Absence quota management',
  /(\s*)(\bRPTQTA\w+|ABSENCE_QUOTA\b|PA2006\b)/ig,
  'Review absence quota configuration. Use Fiori Leave Request apps.'
);

// SIMPL-HR-034: Substitution type handling
transforms['SIMPL-HR-034'] = createCommentTransform(
  'SIMPL-HR-034',
  'Substitution type handling',
  /(\s*)(\bPA2003\b|SUBSTITUTION_TYPE)/ig,
  'Review substitution configuration. Ensure compatibility with Fiori approval workflows.'
);

// SIMPL-HR-035: Time evaluation schema changes
transforms['SIMPL-HR-035'] = createCommentTransform(
  'SIMPL-HR-035',
  'Time evaluation schema changes',
  /(\s*)(\b(TM00|TM01|TM04)\b|TIME_EVAL_SCHEMA)/ig,
  'Test time evaluation schemas thoroughly. Validate results with parallel run.'
);

// SIMPL-HR-036: Shift planning changes
transforms['SIMPL-HR-036'] = createCommentTransform(
  'SIMPL-HR-036',
  'Shift planning changes',
  /(\s*)(\b(PP61|PP62|PP63)\b|SHIFT_PLAN)/ig,
  'Review shift planning. Consider SuccessFactors Time Tracking for advanced scheduling.'
);

// SIMPL-HR-037: Work schedule rule configuration
transforms['SIMPL-HR-037'] = createFlagTransform(
  'SIMPL-HR-037',
  'Work schedule rule configuration',
  /\b(PT01|PT02|PT03)\b|WORK_SCHEDULE/i,
  'Review work schedule rules and holiday calendar configuration.'
);

// SIMPL-HR-038: Employee Central integration (EC)
transforms['SIMPL-HR-038'] = createCommentTransform(
  'SIMPL-HR-038',
  'Employee Central integration (EC)',
  /(\s*)(\bEMPLOYEE_CENTRAL\b|SF_EC_\w+|SFSF_EC)/ig,
  'Plan Employee Central integration. Use SAP Integration Suite for data replication.'
);

// SIMPL-HR-039: SuccessFactors Recruiting integration
transforms['SIMPL-HR-039'] = createCommentTransform(
  'SIMPL-HR-039',
  'SuccessFactors Recruiting integration',
  /(\s*)(\bSF_RECRUITING\b|RCM_\w+)/ig,
  'Migrate to SuccessFactors Recruiting. Map requisition and candidate data.'
);

// SIMPL-HR-040: SuccessFactors Learning (LMS) migration
transforms['SIMPL-HR-040'] = createCommentTransform(
  'SIMPL-HR-040',
  'SuccessFactors Learning (LMS) migration',
  /(\s*)(\bLSO_\w+|LEARNING_SOLUTION\b|SF_LMS)/ig,
  'Migrate training catalogs and history to SuccessFactors Learning.'
);

// SIMPL-HR-041: SuccessFactors Performance & Goals
transforms['SIMPL-HR-041'] = createCommentTransform(
  'SIMPL-HR-041',
  'SuccessFactors Performance & Goals',
  /(\s*)(\bHAP_\w+|APPRAISAL_\w+|SF_PERFORMANCE)/ig,
  'Migrate appraisal templates and history to SuccessFactors Performance & Goals.'
);

// SIMPL-HR-042: SuccessFactors Compensation integration
transforms['SIMPL-HR-042'] = createCommentTransform(
  'SIMPL-HR-042',
  'SuccessFactors Compensation integration',
  /(\s*)(\bSF_COMPENSATION\b|COMPENSATION_MGMT)/ig,
  'Migrate compensation plans and budgets to SuccessFactors Compensation.'
);

// SIMPL-HR-043: SuccessFactors Succession & Development
transforms['SIMPL-HR-043'] = createCommentTransform(
  'SIMPL-HR-043',
  'SuccessFactors Succession & Development',
  /(\s*)(\bSF_SUCCESSION\b|SUCCESSION_PLAN\b|TALENT_POOL)/ig,
  'Migrate succession plans and talent pools to SuccessFactors Succession & Development.'
);

// SIMPL-HR-044: Benefits enrollment processing
transforms['SIMPL-HR-044'] = createCommentTransform(
  'SIMPL-HR-044',
  'Benefits enrollment processing',
  /(\s*)(\bHRBEN00\w+)/ig,
  'Review benefits enrollment programs. Consider SuccessFactors Benefits.'
);

// SIMPL-HR-045: Benefits plan configuration
transforms['SIMPL-HR-045'] = createCommentTransform(
  'SIMPL-HR-045',
  'Benefits plan configuration',
  /(\s*)(\bBENEFIT_PLAN\b|T74F\w+)/ig,
  'Review benefits plan configuration. Validate eligibility and coverage rules.'
);

// SIMPL-HR-046: Health plan and insurance integration
transforms['SIMPL-HR-046'] = createFlagTransform(
  'SIMPL-HR-046',
  'Health plan and insurance integration',
  /\bHEALTH_PLAN\b|INSURANCE_CARRIER\b|COBRA_\w+/i,
  'Review health plan and COBRA administration configuration.'
);

// SIMPL-HR-047: Retirement and savings plan changes
transforms['SIMPL-HR-047'] = createCommentTransform(
  'SIMPL-HR-047',
  'Retirement and savings plan changes',
  /(\s*)(\bRETIREMENT_PLAN\b|SAVINGS_PLAN\b|401K\b|PENSION_\w+)/ig,
  'Review retirement and savings plan configuration for S/4HANA compatibility.'
);

// SIMPL-HR-048: Compensation management infotypes
transforms['SIMPL-HR-048'] = createCommentTransform(
  'SIMPL-HR-048',
  'Compensation management infotypes',
  /(\s*)(\b(PA0008|PA0014|PA0015)\b)/ig,
  'Review compensation infotype configuration. Validate pay scale and wage type mapping.'
);

// SIMPL-HR-049: Pay scale restructuring
transforms['SIMPL-HR-049'] = createCommentTransform(
  'SIMPL-HR-049',
  'Pay scale restructuring',
  /(\s*)(\b(T510|T510A|T510N)\b|PAY_SCALE)/ig,
  'Review pay scale configuration. Validate pay grade assignments after migration.'
);

// SIMPL-HR-050: Compensation budget planning
transforms['SIMPL-HR-050'] = createCommentTransform(
  'SIMPL-HR-050',
  'Compensation budget planning',
  /(\s*)(\bCOMP_BUDGET\b|COMPENSATION_REVIEW\b|ECM_\w+)/ig,
  'Review compensation budget process. Consider SuccessFactors Compensation for planning.'
);

// SIMPL-HR-051: HR logical database (PNP/PNPCE) changes
transforms['SIMPL-HR-051'] = createCommentTransform(
  'SIMPL-HR-051',
  'HR logical database (PNP/PNPCE) changes',
  /(\s*)(\b(PNP|PNPCE)\b|LOGICAL_DATABASE.*HR)/ig,
  'Review HR reports using PNP/PNPCE. Consider CDS analytical views.'
);

// SIMPL-HR-052: HR InfoSet queries (SQ01/SQ02)
transforms['SIMPL-HR-052'] = createCommentTransform(
  'SIMPL-HR-052',
  'HR InfoSet queries (SQ01/SQ02)',
  /(\s*)(\b(SQ01|SQ02)\b.*HR|S_PH0_\w+)/ig,
  'Review HR queries. Consider SAP Analytics Cloud or Fiori analytical apps.'
);

// SIMPL-HR-053: Headcount and FTE analytics
transforms['SIMPL-HR-053'] = createFlagTransform(
  'SIMPL-HR-053',
  'Headcount and FTE analytics',
  /\bHEADCOUNT\b|FTE_\w+|HR_ANALYTICS/i,
  'Use S/4HANA Fiori analytical apps for headcount and workforce analytics.'
);


// ── Interface Rules (INT-001 through INT-025) ─────────────────────────────

// SIMPL-INT-001: RFC destination type T (TCP/IP) migration
transforms['SIMPL-INT-001'] = createCommentTransform(
  'SIMPL-INT-001',
  'RFC destination type T (TCP/IP) migration',
  /(\s*)(\bRFCDES.*TYPE.*['"]T['"])/ig,
  'Replace TCP/IP RFC destinations with CPI SFTP or cloud storage adapters.'
);

// SIMPL-INT-002: RFC calls to removed satellite systems
transforms['SIMPL-INT-002'] = createCommentTransform(
  'SIMPL-INT-002',
  'RFC calls to removed satellite systems',
  /(\s*)(\b(ERP_TO_APO|ERP_TO_CRM|ERP_TO_SRM|CALL\s+FUNCTION\s+.*DESTINATION\s+['"](?:APO|CRM|SRM)))/ig,
  'Use embedded S/4HANA functionality (embedded PP/DS, Customer Management, central procurement).'
);

// SIMPL-INT-003: RFC destination to BW system
transforms['SIMPL-INT-003'] = createCommentTransform(
  'SIMPL-INT-003',
  'RFC destination to BW system',
  /(\s*)(\b(ERP_TO_BW|BW_RFC|RSA7|SBIW)\b)/ig,
  'Review BW extractors; consider CDS-based extraction or embedded BW/4HANA.'
);

// SIMPL-INT-004: RFC destination to Solution Manager
transforms['SIMPL-INT-004'] = createCommentTransform(
  'SIMPL-INT-004',
  'RFC destination to Solution Manager',
  /(\s*)(\b(ERP_TO_SOLMAN|SOLMAN_RFC|SM_RFC)\b)/ig,
  'Migrate Solution Manager integration to SAP Cloud ALM.'
);

// SIMPL-INT-005: RFC destination security hardening
transforms['SIMPL-INT-005'] = createFlagTransform(
  'SIMPL-INT-005',
  'RFC destination security hardening',
  /\bRFCDES.*RFCSNC\b/i,
  'Enable SNC encryption for all RFC destinations.'
);

// SIMPL-INT-006: IDoc segment structure changes
transforms['SIMPL-INT-006'] = createCommentTransform(
  'SIMPL-INT-006',
  'IDoc segment structure changes',
  /(\s*)(\b(ORDERS05|INVOIC02|DESADV01|DELVRY03)\b)/ig,
  'Review IDoc segment mappings for S/4HANA field changes. Test with WE19.'
);

// SIMPL-INT-007: Material master IDoc changes (MATMAS)
transforms['SIMPL-INT-007'] = createCommentTransform(
  'SIMPL-INT-007',
  'Material master IDoc changes (MATMAS)',
  /(\s*)(\bMATMAS\d{2}\b)/ig,
  'Update MATMAS mappings for 40-character material numbers and new segments.'
);

// SIMPL-INT-008: Business partner IDoc replaces customer/vendor IDocs
transforms['SIMPL-INT-008'] = createCommentTransform(
  'SIMPL-INT-008',
  'Business partner IDoc replaces customer/vendor IDocs',
  /(\s*)(\b(DEBMAS\d{2}|CREMAS\d{2})\b)/ig,
  'Migrate to BUMAS IDoc type for business partner distribution.'
);

// SIMPL-INT-009: WM IDocs replaced by EWM integration
transforms['SIMPL-INT-009'] = createCommentTransform(
  'SIMPL-INT-009',
  'WM IDocs replaced by EWM integration',
  /(\s*)(\b(WMMBID|WMTOCO)\d{2}\b)/ig,
  'Migrate WM IDoc flows to embedded EWM or decentralized EWM APIs.'
);

// SIMPL-INT-010: IDoc partner profiles need review
transforms['SIMPL-INT-010'] = createCommentTransform(
  'SIMPL-INT-010',
  'IDoc partner profiles need review',
  /(\s*)(\b(WE20|WE21|WE41|WE42|WE46|BD64)\b)/ig,
  'Review partner profiles and IDoc ports for S/4HANA compatibility.'
);

// SIMPL-INT-011: SOAP web services to REST/OData migration
transforms['SIMPL-INT-011'] = createCommentTransform(
  'SIMPL-INT-011',
  'SOAP web services to REST/OData migration',
  /(\s*)(\b(SOAMANAGER|LPCONFIG|CL_PROXY_|IF_PROXY_)\b)/ig,
  'Replace SOAP proxies with OData services or RAP-based APIs.'
);

// SIMPL-INT-012: Enterprise Services deprecated
transforms['SIMPL-INT-012'] = createCommentTransform(
  'SIMPL-INT-012',
  'Enterprise Services deprecated',
  /(\s*)(\b(SOAPENV|WSDL_GENERATE|CL_WS_RUNTIME)\b)/ig,
  'Use SAP API Business Hub for replacement S/4HANA APIs.'
);

// SIMPL-INT-013: Custom OData services need RAP review
transforms['SIMPL-INT-013'] = createCommentTransform(
  'SIMPL-INT-013',
  'Custom OData services need RAP review',
  /(\s*)(\b(SEGW|\/IWBEP\/|CL_SADL_)\b)/ig,
  'Consider migrating custom OData services to RAP (ABAP RESTful Application Programming).'
);

// SIMPL-INT-014: PI/PO middleware migration to CPI
transforms['SIMPL-INT-014'] = createCommentTransform(
  'SIMPL-INT-014',
  'PI/PO middleware migration to CPI',
  /(\s*)(\b(ERP_TO_PI|PI_RFC|SXMB_MONI|SXI_MONITOR|SXMB_ADM)\b)/ig,
  'Migrate PI/PO iFlows to SAP Integration Suite using Migration Assessment tool.'
);

// SIMPL-INT-015: XI protocol usage
transforms['SIMPL-INT-015'] = createCommentTransform(
  'SIMPL-INT-015',
  'XI protocol usage',
  /(\s*)(\b(CL_XMS_|IF_XMS_|SXMS_|XI_ADAPTER)\b)/ig,
  'Replace XI protocol with REST/OData through CPI or direct API calls.'
);

// SIMPL-INT-016: EDI subsystem integration changes
transforms['SIMPL-INT-016'] = createCommentTransform(
  'SIMPL-INT-016',
  'EDI subsystem integration changes',
  /(\s*)(\b(EDI_PROVIDER|EDPAR|EDP13|NAST.*EDI)\b)/ig,
  'Route EDI flows through CPI with B2B Trading Partner Management.'
);

// SIMPL-INT-017: Output management modernization
transforms['SIMPL-INT-017'] = createFlagTransform(
  'SIMPL-INT-017',
  'Output management modernization',
  /\b(NACE|NAST|RSNAST00)\b/i,
  'Migrate to S/4HANA Output Management with BRF+ rules.'
);

// SIMPL-INT-018: Bank file format migration (MT940 → camt.053)
transforms['SIMPL-INT-018'] = createCommentTransform(
  'SIMPL-INT-018',
  'Bank file format migration (MT940 → camt.053)',
  /(\s*)(\b(MT940|FEBKO|FEBEP|FF_5|FF\.5)\b)/ig,
  'Configure Advanced Payment Management with ISO 20022 camt.053 format.'
);

// SIMPL-INT-019: Payment file format migration (MT101 → pain.001)
transforms['SIMPL-INT-019'] = createCommentTransform(
  'SIMPL-INT-019',
  'Payment file format migration (MT101 → pain.001)',
  /(\s*)(\b(MT101|DMEE|OBPM4|PAIN_001)\b)/ig,
  'Use SAP Payment Engine or Advanced Payment Management with pain.001.'
);

// SIMPL-INT-020: Custom batch programs need review
transforms['SIMPL-INT-020'] = createCommentTransform(
  'SIMPL-INT-020',
  'Custom batch programs need review',
  /(\s*)(\b(SM36|SM37|BTCTRNS|JOB_OPEN|JOB_CLOSE|JOB_SUBMIT)\b)/ig,
  'Review batch job programs for S/4HANA compatibility; consider Application Jobs.'
);

// SIMPL-INT-021: Application Jobs replace classic batch
transforms['SIMPL-INT-021'] = createFlagTransform(
  'SIMPL-INT-021',
  'Application Jobs replace classic batch',
  /\bCL_APJ_|IF_APJ_/i,
  'Consider migrating custom batch jobs to Application Job framework.'
);

// SIMPL-INT-022: SuccessFactors integration changes
transforms['SIMPL-INT-022'] = createCommentTransform(
  'SIMPL-INT-022',
  'SuccessFactors integration changes',
  /(\s*)(\b(SF_EC|SUCCESSFACTORS|HRMD_A\d{2})\b)/ig,
  'Use CPI standard integration packages for SuccessFactors Employee Central.'
);

// SIMPL-INT-023: Ariba Network integration update
transforms['SIMPL-INT-023'] = createCommentTransform(
  'SIMPL-INT-023',
  'Ariba Network integration update',
  /(\s*)(\b(ARIBA_NETWORK|ARIBA_RFC|PORDCR\d{2})\b)/ig,
  'Use SAP Business Network integration via CPI with standard adapters.'
);

// SIMPL-INT-024: Concur integration modernization
transforms['SIMPL-INT-024'] = createCommentTransform(
  'SIMPL-INT-024',
  'Concur integration modernization',
  /(\s*)(\b(CONCUR_API|CONCUR_RFC|TRVREQ\d{2})\b)/ig,
  'Use CPI standard integration for Concur Travel & Expense.'
);

// SIMPL-INT-025: Third-party API integration via CPI
transforms['SIMPL-INT-025'] = createFlagTransform(
  'SIMPL-INT-025',
  'Third-party API integration via CPI',
  /\b(SALESFORCE_API|PAYMENT_GW|TAX_ENGINE)\b/i,
  'Route third-party integrations through CPI for monitoring and governance.'
);


// ── Product Lifecycle Management Rules (PLM-001 through PLM-028) ──────────

// SIMPL-PLM-001: Engineering Change Management (ECM) Updated
transforms['SIMPL-PLM-001'] = createCommentTransform(
  'SIMPL-PLM-001',
  'Engineering Change Management (ECM) Updated',
  /(\s*)(\b(CC0[1-3]|AENR|CHANGE_NUMBER|ECMPROCESS)\b)/ig,
  'Review engineering change records referencing material numbers. Validate BOM effectivity after migration.'
);

// SIMPL-PLM-002: BOM Extended Material Number
transforms['SIMPL-PLM-002'] = createCommentTransform(
  'SIMPL-PLM-002',
  'BOM Extended Material Number',
  /(\s*)(\b(CS0[1-3]|STKO|STPO|MAST|BOM_ITEM|CSAP_MAT_BOM)\b)/ig,
  'Validate all BOM structures after material number extension. Check STPO-IDNRK field (40 chars).'
);

// SIMPL-PLM-003: Routing Extended Material Number
transforms['SIMPL-PLM-003'] = createCommentTransform(
  'SIMPL-PLM-003',
  'Routing Extended Material Number',
  /(\s*)(\b(CA0[1-3]|PLKO|PLPO|MAPL|ROUTING|WORK_PLAN)\b)/ig,
  'Validate routing component assignments. Check production version consistency.'
);

// SIMPL-PLM-004: Document Management System (DMS)
transforms['SIMPL-PLM-004'] = createCommentTransform(
  'SIMPL-PLM-004',
  'Document Management System (DMS)',
  /(\s*)(\b(CV0[1-4]N?|DRAW|DRAS|DRAT|DMS_DOC)\b)/ig,
  'Validate DMS document links to materials, equipment, and BOM items.'
);

// SIMPL-PLM-005: Classification System Impact
transforms['SIMPL-PLM-005'] = createCommentTransform(
  'SIMPL-PLM-005',
  'Classification System Impact',
  /(\s*)(\b(CL0[1-4]|CT0[1-4]|CABN|CAWN|CLASSIFICATION)\b)/ig,
  'Review classification hierarchies. Validate class assignments for migrated materials.'
);

// SIMPL-PLM-006: Recipe Management for Process Industries
transforms['SIMPL-PLM-006'] = createCommentTransform(
  'SIMPL-PLM-006',
  'Recipe Management for Process Industries',
  /(\s*)(\b(C20[1-3]|MASTER_RECIPE|PLKO.*RECIPE)\b)/ig,
  'Validate master recipes after BOM and routing migration. Check phase/operation assignments.'
);

// SIMPL-PLM-007: Product Structure Browser Changed
transforms['SIMPL-PLM-007'] = createFlagTransform(
  'SIMPL-PLM-007',
  'Product Structure Browser Changed',
  /\b(CS80|CC05|PRODUCT_STRUCTURE|PSB_)\b/i,
  'Review custom enhancements to product structure browser. Test navigation after migration.'
);

// SIMPL-PLM-008: Variant Configuration Integration
transforms['SIMPL-PLM-008'] = createCommentTransform(
  'SIMPL-PLM-008',
  'Variant Configuration Integration',
  /(\s*)(\b(CU4[1-4]|VARIANT_CONFIG|VC_|CUOBJ|DEPENDENCY)\b)/ig,
  'Validate variant configuration models and dependencies. Test configuration profiles end-to-end.'
);

// SIMPL-PLM-009: Multi-Level BOM Explosion Validation
transforms['SIMPL-PLM-009'] = createCommentTransform(
  'SIMPL-PLM-009',
  'Multi-Level BOM Explosion Validation',
  /(\s*)(\b(CS1[1-3]|MULTI_LEVEL_BOM|BOM_EXPLOSION|BOM_RECURSIVE)\b)/ig,
  'Test multi-level BOM explosion reports. Validate all levels resolve correctly with 40-char material numbers.'
);

// SIMPL-PLM-010: Alternative BOM and BOM Usage Migration
transforms['SIMPL-PLM-010'] = createCommentTransform(
  'SIMPL-PLM-010',
  'Alternative BOM and BOM Usage Migration',
  /(\s*)(\b(ALT_BOM|BOM_USAGE|STKO_STLAN|BOM_SELECT|USAGE_TYPE)\b)/ig,
  'Validate alternative BOM assignments and usage types. Test BOM selection logic in production orders and costing runs.'
);

// SIMPL-PLM-011: Phantom Assembly BOM Processing
transforms['SIMPL-PLM-011'] = createCommentTransform(
  'SIMPL-PLM-011',
  'Phantom Assembly BOM Processing',
  /(\s*)(\b(PHANTOM_BOM|PHANTOM_ASSY|BOM_ITEM_CAT|SOBSL.*PHANTOM)\b)/ig,
  'Validate phantom assembly BOM items. Test explosion behavior in production orders and MRP planning runs.'
);

// SIMPL-PLM-012: BOM Change History and Effectivity
transforms['SIMPL-PLM-012'] = createCommentTransform(
  'SIMPL-PLM-012',
  'BOM Change History and Effectivity',
  /(\s*)(\b(BOM_HISTORY|BOM_EFFECTIV|ECN_EFFECTIV|PARAM_EFFECT)\b)/ig,
  'Validate BOM change history migration. Test date and parameter effectivity resolution for historical and future changes.'
);

// SIMPL-PLM-013: Reference Operation Sets Migration
transforms['SIMPL-PLM-013'] = createCommentTransform(
  'SIMPL-PLM-013',
  'Reference Operation Sets Migration',
  /(\s*)(\b(CA1[1-3]|REF_OPER|REFERENCE_OPR|PLKO.*REF)\b)/ig,
  'Validate reference operation sets. Ensure referenced operations resolve correctly in dependent routings.'
);

// SIMPL-PLM-014: Rate Routing and Repetitive Manufacturing
transforms['SIMPL-PLM-014'] = createCommentTransform(
  'SIMPL-PLM-014',
  'Rate Routing and Repetitive Manufacturing',
  /(\s*)(\b(RATE_ROUTING|REPETITIVE_MFG|PROD_LINE|CYCLE_TIME)\b)/ig,
  'Validate rate routing configurations. Test repetitive manufacturing run schedule headers and backflush processing.'
);

// SIMPL-PLM-015: Routing Production Version Assignment
transforms['SIMPL-PLM-015'] = createCommentTransform(
  'SIMPL-PLM-015',
  'Routing Production Version Assignment',
  /(\s*)(\b(PROD_VERSION|MKAL|C223|VERSION_SELECT|ROUTING_GROUP)\b)/ig,
  'Validate production version assignments. Test version selection in production order creation and MRP planning.'
);

// SIMPL-PLM-016: Work Center and Capacity Validation
transforms['SIMPL-PLM-016'] = createCommentTransform(
  'SIMPL-PLM-016',
  'Work Center and Capacity Validation',
  /(\s*)(\b(CR0[1-3]|WORK_CENTER|CRHD|CAPACITY_PLAN|WC_HIERARCHY)\b)/ig,
  'Validate work center master data and capacity formulas. Test capacity evaluation and scheduling after migration.'
);

// SIMPL-PLM-017: Configuration Profile Validation
transforms['SIMPL-PLM-017'] = createCommentTransform(
  'SIMPL-PLM-017',
  'Configuration Profile Validation',
  /(\s*)(\b(CONFIG_PROFILE|CU41|CU42|PROFILE_ASSIGN|CHAR_VALUE)\b)/ig,
  'Validate configuration profiles. Test characteristic value assignment and dependency resolution end-to-end.'
);

// SIMPL-PLM-018: Dependency Rules and Constraints
transforms['SIMPL-PLM-018'] = createCommentTransform(
  'SIMPL-PLM-018',
  'Dependency Rules and Constraints',
  /(\s*)(\b(DEPEND_RULE|PRECONDITION|SEL_CONDITION|CONSTRAINT_NET)\b)/ig,
  'Test all dependency rules. Validate preconditions, selection conditions, and constraint nets for configurable products.'
);

// SIMPL-PLM-019: Super BOM and Super Routing for Configurable Products
transforms['SIMPL-PLM-019'] = createCommentTransform(
  'SIMPL-PLM-019',
  'Super BOM and Super Routing for Configurable Products',
  /(\s*)(\b(SUPER_BOM|SUPER_ROUTING|MAX_BOM|VARIANT_COMP|OBJ_DEPEND)\b)/ig,
  'Validate super BOM and super routing structures. Test object dependency-driven component and operation selection.'
);

// SIMPL-PLM-020: Product Compliance Assessment
transforms['SIMPL-PLM-020'] = createCommentTransform(
  'SIMPL-PLM-020',
  'Product Compliance Assessment',
  /(\s*)(\b(PROD_COMPLIANCE|REACH_REG|ROHS_CHECK|PROP_65|TSCA_LIST)\b)/ig,
  'Validate product compliance assessments. Ensure regulatory list screening works with 40-char material numbers.'
);

// SIMPL-PLM-021: Substance Volume Tracking and SVHC
transforms['SIMPL-PLM-021'] = createCommentTransform(
  'SIMPL-PLM-021',
  'Substance Volume Tracking and SVHC',
  /(\s*)(\b(SUBSTANCE_VOL|SVHC|SVT_TRACK|REACH_REGISTER|SUBSTANCE_MGMT)\b)/ig,
  'Validate substance volume tracking calculations. Test SVHC identification through BOM-based substance content analysis.'
);

// SIMPL-PLM-022: Safety Data Sheet (SDS) Generation
transforms['SIMPL-PLM-022'] = createCommentTransform(
  'SIMPL-PLM-022',
  'Safety Data Sheet (SDS) Generation',
  /(\s*)(\b(SAFETY_DATA|SDS_GEN|MSDS|HAZARD_CLASS|SDS_DISTRIB)\b)/ig,
  'Validate SDS generation. Test hazard classification data and SDS template rendering after material migration.'
);

// SIMPL-PLM-023: Engineering Record Management
transforms['SIMPL-PLM-023'] = createCommentTransform(
  'SIMPL-PLM-023',
  'Engineering Record Management',
  /(\s*)(\b(CC3[1-3]|ENG_RECORD|CHANGE_RECORD|AENR_RECORD)\b)/ig,
  'Validate engineering record object references. Test change record navigation to affected BOMs, routings, and materials.'
);

// SIMPL-PLM-024: ECM Workflow and Approval Process
transforms['SIMPL-PLM-024'] = createCommentTransform(
  'SIMPL-PLM-024',
  'ECM Workflow and Approval Process',
  /(\s*)(\b(ECM_WORKFLOW|ECM_APPROVAL|ECM_RELEASE|CHANGE_WORKFLOW|DIGITAL_SIGN)\b)/ig,
  'Validate ECM workflow configurations. Test approval chains and release strategies for engineering change orders.'
);

// SIMPL-PLM-025: Revision Level Management
transforms['SIMPL-PLM-025'] = createCommentTransform(
  'SIMPL-PLM-025',
  'Revision Level Management',
  /(\s*)(\b(REVISION_LEVEL|REV_LEVEL|MARA_REVLV|DESIGN_ITER)\b)/ig,
  'Validate revision level assignments. Test revision-based BOM and routing selection logic.'
);

// SIMPL-PLM-026: PLM-PP Integration for Production Master Data
transforms['SIMPL-PLM-026'] = createCommentTransform(
  'SIMPL-PLM-026',
  'PLM-PP Integration for Production Master Data',
  /(\s*)(\b(PLM_PP_INT|ENG_TO_PROD|BOM_TRANSFER|USAGE_MAP)\b)/ig,
  'Validate PLM-to-PP data flow. Test engineering-to-production BOM transfer and production version activation.'
);

// SIMPL-PLM-027: PLM-QM Integration for Inspection Planning
transforms['SIMPL-PLM-027'] = createCommentTransform(
  'SIMPL-PLM-027',
  'PLM-QM Integration for Inspection Planning',
  /(\s*)(\b(PLM_QM_INT|INSPECT_PLAN|QM_ROUTING|INSP_CHAR)\b)/ig,
  'Validate PLM-QM integration. Test inspection plan generation from routing operations and characteristic assignment.'
);

// SIMPL-PLM-028: Where-Used List Validation
transforms['SIMPL-PLM-028'] = createCommentTransform(
  'SIMPL-PLM-028',
  'Where-Used List Validation',
  /(\s*)(\b(CS15|WHERE_USED|IMPACT_ANAL|USAGE_LIST|CS_WHERE)\b)/ig,
  'Validate where-used list reports. Test impact analysis accuracy for materials referenced across multi-level BOMs.'
);


// ── Plant Maintenance Rules (PM-001 through PM-040) ───────────────────────

// SIMPL-PM-001: Maintenance order table changes
transforms['SIMPL-PM-001'] = createCommentTransform(
  'SIMPL-PM-001',
  'Maintenance order table changes',
  /(\s*)(\b(AUFK|AFIH|ILOA)\b)/ig,
  'Review maintenance order field usage. Use CDS views or OData APIs.'
);

// SIMPL-PM-002: Maintenance order BAPIs changed
transforms['SIMPL-PM-002'] = createCommentTransform(
  'SIMPL-PM-002',
  'Maintenance order BAPIs changed',
  /(\s*)(\bBAPI_ALM_ORDER_\w+)/ig,
  'Review ALM BAPIs. Consider Maintenance Order OData APIs.'
);

// SIMPL-PM-003: Notification type changes
transforms['SIMPL-PM-003'] = createCommentTransform(
  'SIMPL-PM-003',
  'Notification type changes',
  /(\s*)(\b(QMEL|QMIH|QMFE|QMSM)\b)/ig,
  'Review notification handling. Use CDS views for notification data.'
);

// SIMPL-PM-004: Equipment master changes
transforms['SIMPL-PM-004'] = createFlagTransform(
  'SIMPL-PM-004',
  'Equipment master changes',
  /\b(EQUI|EQKT)\b/i,
  'Review equipment master field usage.'
);

// SIMPL-PM-005: Functional location changes
transforms['SIMPL-PM-005'] = createFlagTransform(
  'SIMPL-PM-005',
  'Functional location changes',
  /\b(IFLOS|IFLOT)\b/i,
  'Review functional location structure.'
);

// SIMPL-PM-006: Predictive Maintenance integration
transforms['SIMPL-PM-006'] = createFlagTransform(
  'SIMPL-PM-006',
  'Predictive Maintenance integration',
  /\bPDMS_|PREDICTIVE\b/i,
  'Evaluate SAP Predictive Maintenance and Service integration.'
);

// SIMPL-PM-007: Maintenance plan changes
transforms['SIMPL-PM-007'] = createCommentTransform(
  'SIMPL-PM-007',
  'Maintenance plan changes',
  /(\s*)(\b(MPLA|MPOS|MHIS)\b)/ig,
  'Review maintenance planning configuration.'
);

// SIMPL-PM-008: Task list integration changes
transforms['SIMPL-PM-008'] = createFlagTransform(
  'SIMPL-PM-008',
  'Task list integration changes',
  /\b(IA01|IA02|IA03)\b/i,
  'Review maintenance task list configuration.'
);

// SIMPL-PM-009: Equipment BAPIs changed
transforms['SIMPL-PM-009'] = createCommentTransform(
  'SIMPL-PM-009',
  'Equipment BAPIs changed',
  /(\s*)(\bBAPI_EQUI_\w+)/ig,
  'Review equipment BAPIs. Consider API_EQUIPMENT_SRV OData service.'
);

// SIMPL-PM-010: Equipment hierarchy changes (IE01/IE02)
transforms['SIMPL-PM-010'] = createCommentTransform(
  'SIMPL-PM-010',
  'Equipment hierarchy changes (IE01/IE02)',
  /(\s*)(\b(IE01|IE02|IE03)\b)/ig,
  'Use Fiori app Manage Equipment or Technical Object OData API.'
);

// SIMPL-PM-011: Equipment classification data
transforms['SIMPL-PM-011'] = createFlagTransform(
  'SIMPL-PM-011',
  'Equipment classification data',
  /\b(CL20N|CL02|AUSP|CABN)\b.*EQU/i,
  'Review classification access for equipment. Use classification CDS views.'
);

// SIMPL-PM-012: Functional location BAPIs changed
transforms['SIMPL-PM-012'] = createCommentTransform(
  'SIMPL-PM-012',
  'Functional location BAPIs changed',
  /(\s*)(\bBAPI_FUNCLOC_\w+)/ig,
  'Review functional location BAPIs. Consider API_FUNCTIONALLOCATION_SRV.'
);

// SIMPL-PM-013: Functional location hierarchy (IL01/IL02)
transforms['SIMPL-PM-013'] = createCommentTransform(
  'SIMPL-PM-013',
  'Functional location hierarchy (IL01/IL02)',
  /(\s*)(\b(IL01|IL02|IL03)\b)/ig,
  'Use Fiori app Manage Functional Locations for hierarchy management.'
);

// SIMPL-PM-014: Linear asset management
transforms['SIMPL-PM-014'] = createFlagTransform(
  'SIMPL-PM-014',
  'Linear asset management',
  /\bILINEAR\b|LINEAR_ASSET/i,
  'Evaluate linear asset management features in S/4HANA for infrastructure assets.'
);

// SIMPL-PM-015: Maintenance plan scheduling (IP10/IP30)
transforms['SIMPL-PM-015'] = createCommentTransform(
  'SIMPL-PM-015',
  'Maintenance plan scheduling (IP10/IP30)',
  /(\s*)(\b(IP10|IP30|IP19)\b)/ig,
  'Review scheduling parameters. IP30 supports parallel processing in S/4HANA.'
);

// SIMPL-PM-016: Maintenance strategy changes
transforms['SIMPL-PM-016'] = createCommentTransform(
  'SIMPL-PM-016',
  'Maintenance strategy changes',
  /(\s*)(\b(IP11|IP12)\b|STRATEGY_PLAN)/ig,
  'Review maintenance strategies. Ensure scheduling indicators are correctly configured.'
);

// SIMPL-PM-017: Multiple counter plan support
transforms['SIMPL-PM-017'] = createFlagTransform(
  'SIMPL-PM-017',
  'Multiple counter plan support',
  /\bMULTI_COUNTER\b|MULTI.*COUNTER.*PLAN/i,
  'Evaluate multiple counter plan feature for condition-based maintenance.'
);

// SIMPL-PM-018: Maintenance plan call objects
transforms['SIMPL-PM-018'] = createCommentTransform(
  'SIMPL-PM-018',
  'Maintenance plan call objects',
  /(\s*)(\bMPOS\b.*\bCALL_OBJ\b|MAINTENANCE_CALL)/ig,
  'Review maintenance plan call object generation and assignment.'
);

// SIMPL-PM-019: Maintenance plan Fiori apps
transforms['SIMPL-PM-019'] = createCommentTransform(
  'SIMPL-PM-019',
  'Maintenance plan Fiori apps',
  /(\s*)(\b(IP01|IP02|IP03)\b)/ig,
  'Use Fiori app Manage Maintenance Plans for plan creation and management.'
);

// SIMPL-PM-020: Maintenance order operations (IW32/IW33)
transforms['SIMPL-PM-020'] = createCommentTransform(
  'SIMPL-PM-020',
  'Maintenance order operations (IW32/IW33)',
  /(\s*)(\b(IW32|IW33|IW31)\b)/ig,
  'Use Fiori app Maintain Maintenance Order for order processing.'
);

// SIMPL-PM-021: Maintenance order confirmation (IW42/IW45)
transforms['SIMPL-PM-021'] = createCommentTransform(
  'SIMPL-PM-021',
  'Maintenance order confirmation (IW42/IW45)',
  /(\s*)(\b(IW42|IW45|IW41)\b)/ig,
  'Review confirmation process. Use Fiori app Confirm Maintenance Order.'
);

// SIMPL-PM-022: Maintenance order settlement (KO88)
transforms['SIMPL-PM-022'] = createCommentTransform(
  'SIMPL-PM-022',
  'Maintenance order settlement (KO88)',
  /(\s*)(\bKO88\b.*PM|IW88\b)/ig,
  'Review settlement rules. Costs post to ACDOCA in S/4HANA.'
);

// SIMPL-PM-023: Maintenance order spare parts
transforms['SIMPL-PM-023'] = createFlagTransform(
  'SIMPL-PM-023',
  'Maintenance order spare parts',
  /\bSPARE_PART\b|RESB\b.*PM/i,
  'Review spare parts integration. Material reservations link to new material doc tables.'
);

// SIMPL-PM-024: Maintenance order list (IW38/IW39)
transforms['SIMPL-PM-024'] = createCommentTransform(
  'SIMPL-PM-024',
  'Maintenance order list (IW38/IW39)',
  /(\s*)(\b(IW38|IW39|IW29)\b)/ig,
  'Use Fiori app Monitor Maintenance Orders for order list and analytics.'
);

// SIMPL-PM-025: Notification creation BAPIs
transforms['SIMPL-PM-025'] = createCommentTransform(
  'SIMPL-PM-025',
  'Notification creation BAPIs',
  /(\s*)(\bBAPI_ALM_NOTIF_\w+)/ig,
  'Review notification BAPIs. Consider API_MAINTNOTIFICATION OData service.'
);

// SIMPL-PM-026: Notification catalog management
transforms['SIMPL-PM-026'] = createCommentTransform(
  'SIMPL-PM-026',
  'Notification catalog management',
  /(\s*)(\b(QS41|QPCT|QPCD|QPGR)\b)/ig,
  'Review notification catalogs. Ensure code groups and codes are S/4HANA compatible.'
);

// SIMPL-PM-027: Notification processing Fiori apps (IW21/IW22)
transforms['SIMPL-PM-027'] = createCommentTransform(
  'SIMPL-PM-027',
  'Notification processing Fiori apps (IW21/IW22)',
  /(\s*)(\b(IW21|IW22|IW23)\b)/ig,
  'Use Fiori app Create Maintenance Notification or My Maintenance Notifications.'
);

// SIMPL-PM-028: Notification list and reporting (IW28/IW29)
transforms['SIMPL-PM-028'] = createFlagTransform(
  'SIMPL-PM-028',
  'Notification list and reporting (IW28/IW29)',
  /\b(IW28|IW29)\b/i,
  'Use Fiori app Monitor Maintenance Notifications for listing and analytics.'
);

// SIMPL-PM-029: Task list operation changes
transforms['SIMPL-PM-029'] = createCommentTransform(
  'SIMPL-PM-029',
  'Task list operation changes',
  /(\s*)(\b(IA05|IA06|IA07|PLPO)\b.*PM)/ig,
  'Review maintenance task list operations. Validate operation detail assignments.'
);

// SIMPL-PM-030: Measuring point and counter management
transforms['SIMPL-PM-030'] = createCommentTransform(
  'SIMPL-PM-030',
  'Measuring point and counter management',
  /(\s*)(\b(IK01|IK11|IK07|IMPTT|IMRG)\b)/ig,
  'Review measuring point configuration. Use Fiori app for measurement documents.'
);

// SIMPL-PM-031: Measurement document BAPIs
transforms['SIMPL-PM-031'] = createCommentTransform(
  'SIMPL-PM-031',
  'Measurement document BAPIs',
  /(\s*)(\bBAPI_MEASUREDOC_\w+)/ig,
  'Review measurement BAPIs. Consider measurement OData APIs for Fiori integration.'
);

// SIMPL-PM-032: Counter-based maintenance triggers
transforms['SIMPL-PM-032'] = createFlagTransform(
  'SIMPL-PM-032',
  'Counter-based maintenance triggers',
  /\bCOUNTER_BASED\b|COUNTER.*MAINTENANCE/i,
  'Review counter-based maintenance plan integration with measuring points.'
);

// SIMPL-PM-033: Enterprise Asset Management (EAM) integration
transforms['SIMPL-PM-033'] = createCommentTransform(
  'SIMPL-PM-033',
  'Enterprise Asset Management (EAM) integration',
  /(\s*)(\bEAM_\w+|ASSET_HEALTH\b)/ig,
  'Evaluate S/4HANA EAM capabilities: asset health monitoring, risk-based maintenance.'
);

// SIMPL-PM-034: Warranty management in EAM
transforms['SIMPL-PM-034'] = createCommentTransform(
  'SIMPL-PM-034',
  'Warranty management in EAM',
  /(\s*)(\bWARRANTY\b|BGMK\b|WARRANTY_CLAIM)/ig,
  'Review warranty claim processing. S/4HANA provides integrated warranty management.'
);

// SIMPL-PM-035: Permit and safety integration
transforms['SIMPL-PM-035'] = createCommentTransform(
  'SIMPL-PM-035',
  'Permit and safety integration',
  /(\s*)(\bWORK_PERMIT\b|SAFETY_CERT\b|LOCK_TAG)/ig,
  'Evaluate work permit integration for maintenance order safety management.'
);

// SIMPL-PM-036: Mobile maintenance apps (SAP Asset Manager)
transforms['SIMPL-PM-036'] = createCommentTransform(
  'SIMPL-PM-036',
  'Mobile maintenance apps (SAP Asset Manager)',
  /(\s*)(\bWORK_MANAGER\b|SAP_ASSET_MANAGER\b|MOBILE_PM)/ig,
  'Migrate from SAP Work Manager to SAP Asset Manager for mobile maintenance.'
);

// SIMPL-PM-037: Fiori mobile maintenance apps
transforms['SIMPL-PM-037'] = createFlagTransform(
  'SIMPL-PM-037',
  'Fiori mobile maintenance apps',
  /\bFIORI\b.*\b(MAINTENANCE|PM)\b|MY_MAINTENANCE/i,
  'Deploy Fiori apps: My Maintenance Notifications, My Maintenance Orders for mobile use.'
);

// SIMPL-PM-038: Barcode/RFID integration for equipment
transforms['SIMPL-PM-038'] = createFlagTransform(
  'SIMPL-PM-038',
  'Barcode/RFID integration for equipment',
  /\bBARCODE\b.*EQUI|RFID.*EQUI/i,
  'Leverage barcode/RFID scanning in SAP Asset Manager for equipment identification.'
);

// SIMPL-PM-039: IoT sensor data integration
transforms['SIMPL-PM-039'] = createCommentTransform(
  'SIMPL-PM-039',
  'IoT sensor data integration',
  /(\s*)(\bIOT_\w+|SENSOR_DATA\b|SAP_IOT)/ig,
  'Evaluate SAP IoT services for condition-based and predictive maintenance scenarios.'
);

// SIMPL-PM-040: Machine learning anomaly detection
transforms['SIMPL-PM-040'] = createCommentTransform(
  'SIMPL-PM-040',
  'Machine learning anomaly detection',
  /(\s*)(\bANOMALY_DETECT\b|ML_MAINTENANCE\b|PREDICTIVE_SCORE)/ig,
  'Evaluate SAP AI/ML capabilities for predictive maintenance scoring and alerting.'
);


// ── Production Planning Rules (PP-001 through PP-047) ─────────────────────

// SIMPL-PP-001: Production order table changes
transforms['SIMPL-PP-001'] = createCommentTransform(
  'SIMPL-PP-001',
  'Production order table changes',
  /(\s*)(\b(AFKO|AFPO|AFVC|AFFL)\b)/ig,
  'Review production order field usage. Use CDS views or OData APIs.'
);

// SIMPL-PP-002: Production order BAPI changes
transforms['SIMPL-PP-002'] = createCommentTransform(
  'SIMPL-PP-002',
  'Production order BAPI changes',
  /(\s*)(\bBAPI_PRODORD_\w+)/ig,
  'Review production order BAPIs. Consider API_PRODUCTION_ORDER_2_SRV.'
);

// SIMPL-PP-003: MRP Live replaces classic MRP
transforms['SIMPL-PP-003'] = createCommentTransform(
  'SIMPL-PP-003',
  'MRP Live replaces classic MRP',
  /(\s*)(\b(MD01|MD02)\b(?!N))/ig,
  'Migrate to MRP Live (MD01N). Review MRP exits and enhancements.'
);

// SIMPL-PP-004: Demand-driven MRP available
transforms['SIMPL-PP-004'] = createCommentTransform(
  'SIMPL-PP-004',
  'Demand-driven MRP available',
  /(\s*)(\bMD04|MDPSX\b)/ig,
  'Evaluate DDMRP for eligible materials with high demand variability.'
);

// SIMPL-PP-005: Capacity planning changes
transforms['SIMPL-PP-005'] = createCommentTransform(
  'SIMPL-PP-005',
  'Capacity planning changes',
  /(\s*)(\b(CM01|CM21|CM25|CRHD|KAKO)\b)/ig,
  'Review capacity planning. Consider Production Planning and Detailed Scheduling (PP/DS).'
);

// SIMPL-PP-006: Bill of Material changes
transforms['SIMPL-PP-006'] = createCommentTransform(
  'SIMPL-PP-006',
  'Bill of Material changes',
  /(\s*)(\b(STKO|STPO|STAS)\b)/ig,
  'Review BOM access patterns. Use CDS views or API_BILL_OF_MATERIAL_SRV.'
);

// SIMPL-PP-007: Routing/recipe changes
transforms['SIMPL-PP-007'] = createCommentTransform(
  'SIMPL-PP-007',
  'Routing/recipe changes',
  /(\s*)(\b(PLKO|PLPO|PLAS)\b)/ig,
  'Review routing access. Use CDS views for production routing data.'
);

// SIMPL-PP-008: Confirmation changes
transforms['SIMPL-PP-008'] = createCommentTransform(
  'SIMPL-PP-008',
  'Confirmation changes',
  /(\s*)(\b(CO11N|AFRU)\b)/ig,
  'Review confirmation processes and integration points.'
);

// SIMPL-PP-009: Process order changes
transforms['SIMPL-PP-009'] = createCommentTransform(
  'SIMPL-PP-009',
  'Process order changes',
  /(\s*)(\b(COR1|COR2|COR3)\b)/ig,
  'Review process order handling for S/4HANA compatibility.'
);

// SIMPL-PP-010: MRP tables restructured (MDTB/MDKP/MDIP)
transforms['SIMPL-PP-010'] = createCommentTransform(
  'SIMPL-PP-010',
  'MRP tables restructured (MDTB/MDKP/MDIP)',
  /(\s*)(\b(MDTB|MDKP|MDIP|MDFD)\b)/ig,
  'Review MRP data access. Use MRP CDS views (I_MRPElement, I_PlannedOrder) instead.'
);

// SIMPL-PP-011: Planned order conversion changes
transforms['SIMPL-PP-011'] = createCommentTransform(
  'SIMPL-PP-011',
  'Planned order conversion changes',
  /(\s*)(\bBAPI_PLANNEDORDER_\w+|MD_PLANNED_ORDER_\w+)/ig,
  'Use API_PLANNED_ORDER_SRV or BAPI_PLANNEDORDER_CREATE/CHANGE with updated parameters.'
);

// SIMPL-PP-012: MRP area configuration changes
transforms['SIMPL-PP-012'] = createCommentTransform(
  'SIMPL-PP-012',
  'MRP area configuration changes',
  /(\s*)(\b(T460A|MDLV|MDLL)\b)/ig,
  'Review MRP area setup. Ensure storage location MRP is configured correctly.'
);

// SIMPL-PP-013: MRP Live BAdI replaces MRP user exits
transforms['SIMPL-PP-013'] = createCommentTransform(
  'SIMPL-PP-013',
  'MRP Live BAdI replaces MRP user exits',
  /(\s*)(\bEXIT_SAPLM61X\b|EXIT_SAPM61R\b)/ig,
  'Migrate MRP user exits to MRP Live BAdIs (BADI_MRP_LIVE_*).'
);

// SIMPL-PP-014: MRP controller assignment review
transforms['SIMPL-PP-014'] = createCommentTransform(
  'SIMPL-PP-014',
  'MRP controller assignment review',
  /(\s*)(\b(MDPS|MD05|MD06)\b)/ig,
  'Review MRP controller settings. MD05/MD06 exception analysis uses new Fiori apps.'
);

// SIMPL-PP-015: Stock/requirements list changes (MD04)
transforms['SIMPL-PP-015'] = createCommentTransform(
  'SIMPL-PP-015',
  'Stock/requirements list changes (MD04)',
  /(\s*)(\bMD04\b|MDPSX\b)/ig,
  'Plan transition from MD04 to Fiori app F2672 (Manage Material Coverage).'
);

// SIMPL-PP-016: Production order status management
transforms['SIMPL-PP-016'] = createCommentTransform(
  'SIMPL-PP-016',
  'Production order status management',
  /(\s*)(\b(JEST|JSTO|BSVX)\b)/ig,
  'Review custom status profiles. New S/4HANA statuses may affect status logic.'
);

// SIMPL-PP-017: Production order goods receipt (MIGO integration)
transforms['SIMPL-PP-017'] = createCommentTransform(
  'SIMPL-PP-017',
  'Production order goods receipt (MIGO integration)',
  /(\s*)(\bMIGO\b.*\b(101|102)\b|\bMB31\b)/ig,
  'Use Fiori app Post Goods Receipt for Production Order (F1817).'
);

// SIMPL-PP-018: Production order settlement changes
transforms['SIMPL-PP-018'] = createCommentTransform(
  'SIMPL-PP-018',
  'Production order settlement changes',
  /(\s*)(\b(CO88|KO88)\b)/ig,
  'Review settlement rules. Settlement now posts to ACDOCA in S/4HANA.'
);

// SIMPL-PP-019: Production order OData API
transforms['SIMPL-PP-019'] = createCommentTransform(
  'SIMPL-PP-019',
  'Production order OData API',
  /(\s*)(\bAPI_PRODUCTION_ORDER\b)/ig,
  'Use API_PRODUCTION_ORDER_2_SRV for programmatic access to production orders.'
);

// SIMPL-PP-020: Production order print/output changes
transforms['SIMPL-PP-020'] = createCommentTransform(
  'SIMPL-PP-020',
  'Production order print/output changes',
  /(\s*)(\b(NACE|TNAPR)\b.*PP|CO04N)/ig,
  'Migrate to S/4HANA Output Management or Adobe Forms for shop floor documents.'
);

// SIMPL-PP-021: Goods movement for production (261/262)
transforms['SIMPL-PP-021'] = createCommentTransform(
  'SIMPL-PP-021',
  'Goods movement for production (261/262)',
  /(\s*)(\b(MB1A|MIGO)\b.*\b(261|262)\b)/ig,
  'Use Fiori app Post Goods Issue for Production Order for material staging.'
);

// SIMPL-PP-022: Backflushing configuration changes
transforms['SIMPL-PP-022'] = createCommentTransform(
  'SIMPL-PP-022',
  'Backflushing configuration changes',
  /(\s*)(\bBACKFLUSH\b|BACKFL\b|CO11N.*BACKFL)/ig,
  'Review backflushing setup. MATDOC replaces MKPF/MSEG for material documents.'
);

// SIMPL-PP-023: Production confirmation BAPI changes
transforms['SIMPL-PP-023'] = createCommentTransform(
  'SIMPL-PP-023',
  'Production confirmation BAPI changes',
  /(\s*)(\bBAPI_PRODORDCONF_\w+)/ig,
  'Review confirmation BAPIs. Consider API_PRODORDCONF_2_SRV OData service.'
);

// SIMPL-PP-024: Shop floor control with MES integration
transforms['SIMPL-PP-024'] = createCommentTransform(
  'SIMPL-PP-024',
  'Shop floor control with MES integration',
  /(\s*)(\bME_\w+|MII_\w+|PP_PDC_\w+)/ig,
  'Review MES integration. SAP Digital Manufacturing Cloud replaces legacy MES.'
);

// SIMPL-PP-025: Kanban control cycle changes
transforms['SIMPL-PP-025'] = createFlagTransform(
  'SIMPL-PP-025',
  'Kanban control cycle changes',
  /\b(PK01|PK13N|PKMC)\b/i,
  'Use Fiori app Manage Kanban for control cycle management and signal processing.'
);

// SIMPL-PP-026: Material document table changes (MATDOC)
transforms['SIMPL-PP-026'] = createCommentTransform(
  'SIMPL-PP-026',
  'Material document table changes (MATDOC)',
  /(\s*)(\b(MKPF|MSEG)\b)/ig,
  'Access material documents via MATDOC or CDS view I_MaterialDocumentItem.'
);

// SIMPL-PP-027: Cost estimate changes (CK11N/CK40N)
transforms['SIMPL-PP-027'] = createCommentTransform(
  'SIMPL-PP-027',
  'Cost estimate changes (CK11N/CK40N)',
  /(\s*)(\b(CK11N|CK40N|CK24)\b)/ig,
  'Review cost estimate configuration. ACDOCA integration changes costing document flow.'
);

// SIMPL-PP-028: WIP calculation changes (KKAO/KKA2)
transforms['SIMPL-PP-028'] = createCommentTransform(
  'SIMPL-PP-028',
  'WIP calculation changes (KKAO/KKA2)',
  /(\s*)(\b(KKAO|KKA2|KKAX)\b)/ig,
  'Review WIP calculation. Results post to Universal Journal instead of COEP/COBK.'
);

// SIMPL-PP-029: Variance calculation changes (KKS1/KKS2)
transforms['SIMPL-PP-029'] = createCommentTransform(
  'SIMPL-PP-029',
  'Variance calculation changes (KKS1/KKS2)',
  /(\s*)(\b(KKS1|KKS2|KKS5)\b)/ig,
  'Review variance categories and settlement. Use Fiori analytical apps for variance analysis.'
);

// SIMPL-PP-030: Activity price calculation changes
transforms['SIMPL-PP-030'] = createCommentTransform(
  'SIMPL-PP-030',
  'Activity price calculation changes',
  /(\s*)(\b(KP26|KSPI|KSS2)\b)/ig,
  'Review activity type and price calculation in context of Universal Journal.'
);

// SIMPL-PP-031: Material ledger / actual costing mandatory
transforms['SIMPL-PP-031'] = createCommentTransform(
  'SIMPL-PP-031',
  'Material ledger / actual costing mandatory',
  /(\s*)(\b(CKM3|CKMLCP|CKMLRUNPERIOD)\b)/ig,
  'Ensure Material Ledger is activated. Plan actual costing configuration.'
);

// SIMPL-PP-032: Planned Independent Requirements (PIR) changes
transforms['SIMPL-PP-032'] = createCommentTransform(
  'SIMPL-PP-032',
  'Planned Independent Requirements (PIR) changes',
  /(\s*)(\b(MD61|MD62|MD63|PBIM|PBED)\b)/ig,
  'Use Fiori app Manage Planned Independent Requirements or CDS views for PIR data.'
);

// SIMPL-PP-033: SOP replaced by IBP
transforms['SIMPL-PP-033'] = createCommentTransform(
  'SIMPL-PP-033',
  'SOP replaced by IBP',
  /(\s*)(\b(MC87|MC88|MC8A|MC75)\b)/ig,
  'Migrate from classic SOP to SAP Integrated Business Planning (IBP).'
);

// SIMPL-PP-034: Demand planning integration changes
transforms['SIMPL-PP-034'] = createCommentTransform(
  'SIMPL-PP-034',
  'Demand planning integration changes',
  /(\s*)(\b(APO_DP|DP_\w+|\/SAPAPO\/)\b)/ig,
  'Migrate from APO DP to SAP IBP for Demand for advanced demand planning.'
);

// SIMPL-PP-035: Forecast-based planning changes
transforms['SIMPL-PP-035'] = createCommentTransform(
  'SIMPL-PP-035',
  'Forecast-based planning changes',
  /(\s*)(\b(MP30|MP38|MP39)\b)/ig,
  'Review forecast parameters. S/4HANA provides enhanced forecasting with ML capabilities.'
);

// SIMPL-PP-036: Capacity leveling changes (CM21/CM22)
transforms['SIMPL-PP-036'] = createCommentTransform(
  'SIMPL-PP-036',
  'Capacity leveling changes (CM21/CM22)',
  /(\s*)(\b(CM21|CM22|CM50)\b)/ig,
  'Evaluate Fiori scheduling board for capacity leveling and dispatching.'
);

// SIMPL-PP-037: Work center table changes (CRHD/CRCO)
transforms['SIMPL-PP-037'] = createCommentTransform(
  'SIMPL-PP-037',
  'Work center table changes (CRHD/CRCO)',
  /(\s*)(\b(CRHD|CRCO|KAKO|CR01|CR02)\b)/ig,
  'Review work center data access. Use CDS views for work center information.'
);

// SIMPL-PP-038: PP/DS in Embedded APO
transforms['SIMPL-PP-038'] = createCommentTransform(
  'SIMPL-PP-038',
  'PP/DS in Embedded APO',
  /(\s*)(\b(\/SAPAPO\/CDPS\w+|PP_DS_|PPDS)\b)/ig,
  'Evaluate embedded PP/DS for detailed scheduling. Replaces standalone APO PP/DS.'
);

// SIMPL-PP-039: Repetitive manufacturing planning table
transforms['SIMPL-PP-039'] = createCommentTransform(
  'SIMPL-PP-039',
  'Repetitive manufacturing planning table',
  /(\s*)(\b(MF50|MF42|MF47|SAFK)\b)/ig,
  'Review repetitive manufacturing setup. Use Fiori apps for planning table.'
);

// SIMPL-PP-040: Backflush in repetitive manufacturing
transforms['SIMPL-PP-040'] = createCommentTransform(
  'SIMPL-PP-040',
  'Backflush in repetitive manufacturing',
  /(\s*)(\bMFBF\b|MF60\b)/ig,
  'Review backflushing for repetitive manufacturing. MATDOC replaces MKPF/MSEG.'
);

// SIMPL-PP-041: Line design and takt-based planning
transforms['SIMPL-PP-041'] = createFlagTransform(
  'SIMPL-PP-041',
  'Line design and takt-based planning',
  /\bTAKT\b|LINE_DESIGN\b|PROD_LINE/i,
  'Evaluate takt-based production planning for high-volume repetitive lines.'
);

// SIMPL-PP-042: Master recipe changes (C201/C202)
transforms['SIMPL-PP-042'] = createCommentTransform(
  'SIMPL-PP-042',
  'Master recipe changes (C201/C202)',
  /(\s*)(\b(C201|C202|C203)\b)/ig,
  'Review master recipe configuration. Validate process instructions for compatibility.'
);

// SIMPL-PP-043: Batch management changes
transforms['SIMPL-PP-043'] = createCommentTransform(
  'SIMPL-PP-043',
  'Batch management changes',
  /(\s*)(\b(MSC1N|MSC2N|MSC3N|MCH1|MCHA)\b)/ig,
  'Review batch management. Use CDS views and Fiori apps for batch operations.'
);

// SIMPL-PP-044: Process message handling changes
transforms['SIMPL-PP-044'] = createCommentTransform(
  'SIMPL-PP-044',
  'Process message handling changes',
  /(\s*)(\bPROCESS_MESSAGE\b|CONTROL_RECIPE)/ig,
  'Review process message categories and control recipe configuration.'
);

// SIMPL-PP-045: Production version management
transforms['SIMPL-PP-045'] = createCommentTransform(
  'SIMPL-PP-045',
  'Production version management',
  /(\s*)(\b(C223|C201)\b|MKAL\b)/ig,
  'Review production version setup. Validate BOM/routing assignments.'
);

// SIMPL-PP-046: Engineering change management integration
transforms['SIMPL-PP-046'] = createFlagTransform(
  'SIMPL-PP-046',
  'Engineering change management integration',
  /\b(CC01|CC02|CC03|AENR)\b/i,
  'Review engineering change management integration with PP orders and BOMs.'
);

// SIMPL-PP-047: Make-to-order production changes
transforms['SIMPL-PP-047'] = createCommentTransform(
  'SIMPL-PP-047',
  'Make-to-order production changes',
  /(\s*)(\bMTO\b|MAKE.TO.ORDER|INDIVIDUAL_PO\b)/ig,
  'Review MTO scenarios. Sales order stock management simplified in S/4HANA.'
);


// ── Project System Rules (PS-001 through PS-030) ──────────────────────────

// SIMPL-PS-001: WBS element master tables changed
transforms['SIMPL-PS-001'] = createCommentTransform(
  'SIMPL-PS-001',
  'WBS element master tables changed',
  /(\s*)(\b(PRPS|PROJ)\b)/ig,
  'Use CDS views I_Project / I_WorkBreakdownStructureElement or API_PROJECT_V2.'
);

// SIMPL-PS-002: WBS BAPI changes
transforms['SIMPL-PS-002'] = createCommentTransform(
  'SIMPL-PS-002',
  'WBS BAPI changes',
  /(\s*)(\b(BAPI_PS_PRECOMMIT|BAPI_BUS2054_\w+)\b)/ig,
  'Review BAPI parameters or use API_PROJECT_V2 OData service.'
);

// SIMPL-PS-003: Project definition BAPI changes
transforms['SIMPL-PS-003'] = createCommentTransform(
  'SIMPL-PS-003',
  'Project definition BAPI changes',
  /(\s*)(\bBAPI_BUS2001_\w+)/ig,
  'Use API_PROJECT_V2 or review BAPI parameter changes.'
);

// SIMPL-PS-004: Project Builder (CJ20N) UI changes
transforms['SIMPL-PS-004'] = createFlagTransform(
  'SIMPL-PS-004',
  'Project Builder (CJ20N) UI changes',
  /\bCJ20N\b/i,
  'Consider Fiori apps Manage Projects (F2678) or Monitor Projects.'
);

// SIMPL-PS-005: Network activity tables changed
transforms['SIMPL-PS-005'] = createCommentTransform(
  'SIMPL-PS-005',
  'Network activity tables changed',
  /(\s*)(\b(AFVC|AFVV|AFVU|AFFL)\b)/ig,
  'Use CDS views or API_NETWORK for network activities.'
);

// SIMPL-PS-006: Network BAPI changes
transforms['SIMPL-PS-006'] = createCommentTransform(
  'SIMPL-PS-006',
  'Network BAPI changes',
  /(\s*)(\b(BAPI_NETWORK_\w+|BAPI_ALM_ORDER_\w+)\b)/ig,
  'Review BAPI parameters for S/4HANA compatibility.'
);

// SIMPL-PS-007: Network scheduling changes
transforms['SIMPL-PS-007'] = createCommentTransform(
  'SIMPL-PS-007',
  'Network scheduling changes',
  /(\s*)(\b(CN24|CN25|SAPLCNSC)\b)/ig,
  'Review scheduling parameters for S/4HANA MRP Live integration.'
);

// SIMPL-PS-008: Milestone usage changes
transforms['SIMPL-PS-008'] = createFlagTransform(
  'SIMPL-PS-008',
  'Milestone usage changes',
  /\bMSPT\b/i,
  'Review milestone billing and progress analysis configuration.'
);

// SIMPL-PS-009: PS info system reports removed
transforms['SIMPL-PS-009'] = createCommentTransform(
  'SIMPL-PS-009',
  'PS info system reports removed',
  /(\s*)(\b(CN41N|CN42N|CN43N|CNS40|CNS41|CNS42)\b)/ig,
  'Use Fiori analytical apps for project reporting.'
);

// SIMPL-PS-010: PS summarization objects removed
transforms['SIMPL-PS-010'] = createCommentTransform(
  'SIMPL-PS-010',
  'PS summarization objects removed',
  /(\s*)(\b(RPSCO|RPSQT)\b)/ig,
  'Use ACDOCA for project cost data or CDS analytical views.'
);

// SIMPL-PS-011: Earned value calculation changes
transforms['SIMPL-PS-011'] = createCommentTransform(
  'SIMPL-PS-011',
  'Earned value calculation changes',
  /(\s*)(\b(CJ9E|CJ9K|CJ9BS)\b)/ig,
  'Review earned value configuration for ACDOCA-based calculations.'
);

// SIMPL-PS-012: Progress analysis changes
transforms['SIMPL-PS-012'] = createFlagTransform(
  'SIMPL-PS-012',
  'Progress analysis changes',
  /\bCNE1\b/i,
  'Review progress analysis configuration.'
);

// SIMPL-PS-013: Project settlement to CO-PA changed
transforms['SIMPL-PS-013'] = createCommentTransform(
  'SIMPL-PS-013',
  'Project settlement to CO-PA changed',
  /(\s*)(\b(CJ88|KO88.*PRJ|BAPI_PS_.*SETTLEMENT)\b)/ig,
  'Review settlement rules for ACDOCA-based profitability analysis.'
);

// SIMPL-PS-014: Results analysis changes
transforms['SIMPL-PS-014'] = createCommentTransform(
  'SIMPL-PS-014',
  'Results analysis changes',
  /(\s*)(\bCJ9C\b)/ig,
  'Review results analysis rules for S/4HANA.'
);

// SIMPL-PS-015: Budget management changes
transforms['SIMPL-PS-015'] = createCommentTransform(
  'SIMPL-PS-015',
  'Budget management changes',
  /(\s*)(\b(CJ30|CJ40|BPGE|BPJA)\b)/ig,
  'Review budget profiles and availability control settings.'
);

// SIMPL-PS-016: Budget distribution changes
transforms['SIMPL-PS-016'] = createFlagTransform(
  'SIMPL-PS-016',
  'Budget distribution changes',
  /\b(CJ31|CJ32|CJ36)\b/i,
  'Review budget distribution configuration.'
);

// SIMPL-PS-017: PS billing integration changes
transforms['SIMPL-PS-017'] = createCommentTransform(
  'SIMPL-PS-017',
  'PS billing integration changes',
  /(\s*)(\b(DP90|DP91|BAPI_PS_.*BILLING)\b)/ig,
  'Review project billing configuration for S/4HANA SD changes.'
);

// SIMPL-PS-018: Claims management changes
transforms['SIMPL-PS-018'] = createFlagTransform(
  'SIMPL-PS-018',
  'Claims management changes',
  /\bCLM_\w+/i,
  'Review claims management configuration.'
);

// SIMPL-PS-019: PS text storage changes
transforms['SIMPL-PS-019'] = createFlagTransform(
  'SIMPL-PS-019',
  'PS text storage changes',
  /\bSTXH.*PROJ|STXL.*PROJ\b/i,
  'Use standard text APIs for S/4HANA.'
);

// SIMPL-PS-020: Material component assignment changes
transforms['SIMPL-PS-020'] = createCommentTransform(
  'SIMPL-PS-020',
  'Material component assignment changes',
  /(\s*)(\bRESB\b)/ig,
  'Review material component handling in network activities.'
);

// SIMPL-PS-021: Capacity planning integration with PP/DS
transforms['SIMPL-PS-021'] = createCommentTransform(
  'SIMPL-PS-021',
  'Capacity planning integration with PP/DS',
  /(\s*)(\b(CM01|CM04|CM07|CM25)\b)/ig,
  'Review capacity planning for embedded PP/DS integration.'
);

// SIMPL-PS-022: Project version management
transforms['SIMPL-PS-022'] = createFlagTransform(
  'SIMPL-PS-022',
  'Project version management',
  /\bCJ91\b/i,
  'Review project version management setup.'
);

// SIMPL-PS-023: System/user status changes
transforms['SIMPL-PS-023'] = createCommentTransform(
  'SIMPL-PS-023',
  'System/user status changes',
  /(\s*)(\b(JEST|JSTO).*PROJ\b)/ig,
  'Review status management and status profiles.'
);

// SIMPL-PS-024: Network confirmation changes
transforms['SIMPL-PS-024'] = createCommentTransform(
  'SIMPL-PS-024',
  'Network confirmation changes',
  /(\s*)(\b(AFRU|CN25)\b)/ig,
  'Review confirmation processing for S/4HANA.'
);

// SIMPL-PS-025: PS-CO integration changes
transforms['SIMPL-PS-025'] = createCommentTransform(
  'SIMPL-PS-025',
  'PS-CO integration changes',
  /(\s*)(\b(COEP|COBK).*PRJ\b)/ig,
  'Use ACDOCA CDS views for project cost analysis.'
);

// SIMPL-PS-026: PS-MM purchase requisition changes
transforms['SIMPL-PS-026'] = createCommentTransform(
  'SIMPL-PS-026',
  'PS-MM purchase requisition changes',
  /(\s*)(\bEBAN.*PROJ|PROJ.*EBAN\b)/ig,
  'Review PR generation from network activities.'
);

// SIMPL-PS-027: cProject/RPM replaced by Enterprise Project Management
transforms['SIMPL-PS-027'] = createCommentTransform(
  'SIMPL-PS-027',
  'cProject/RPM replaced by Enterprise Project Management',
  /(\s*)(\b(CPROJECT|RPM_|DPR_)\b)/ig,
  'Migrate to S/4HANA Enterprise Project Management (EPM).'
);

// SIMPL-PS-028: Investment program integration
transforms['SIMPL-PS-028'] = createCommentTransform(
  'SIMPL-PS-028',
  'Investment program integration',
  /(\s*)(\b(IM01|IM27|IM52|IMPR)\b)/ig,
  'Review investment management integration with PS.'
);

// SIMPL-PS-029: Collective confirmation changes
transforms['SIMPL-PS-029'] = createFlagTransform(
  'SIMPL-PS-029',
  'Collective confirmation changes',
  /\b(CN28|CN29)\b/i,
  'Review collective confirmation processing.'
);

// SIMPL-PS-030: Project currency handling
transforms['SIMPL-PS-030'] = createCommentTransform(
  'SIMPL-PS-030',
  'Project currency handling',
  /(\s*)(\bTCURR.*PROJ|PROJ.*TCURR\b)/ig,
  'Review project currency configuration for ACDOCA alignment.'
);


// ── Quality Management Rules (QM-001 through QM-020) ──────────────────────

// SIMPL-QM-001: Inspection lot table changes
transforms['SIMPL-QM-001'] = createCommentTransform(
  'SIMPL-QM-001',
  'Inspection lot table changes',
  /(\s*)(\b(QALS|QASR|QASE)\b)/ig,
  'Use CDS views I_InspectionLot or API_INSPECTIONLOT_SRV.'
);

// SIMPL-QM-002: Inspection lot BAPI changes
transforms['SIMPL-QM-002'] = createCommentTransform(
  'SIMPL-QM-002',
  'Inspection lot BAPI changes',
  /(\s*)(\bBAPI_INSPLOT_\w+)/ig,
  'Review BAPI parameters or use OData API_INSPECTIONLOT_SRV.'
);

// SIMPL-QM-003: Usage decision changes
transforms['SIMPL-QM-003'] = createFlagTransform(
  'SIMPL-QM-003',
  'Usage decision changes',
  /\b(QA11|QA12|QA13)\b/i,
  'Consider Fiori app Record Usage Decisions (F5424).'
);

// SIMPL-QM-004: Quality notification table changes
transforms['SIMPL-QM-004'] = createCommentTransform(
  'SIMPL-QM-004',
  'Quality notification table changes',
  /(\s*)(\b(QMEL|QMFE|QMUR|QMSM)\b)/ig,
  'Use CDS views or API_QUALITYNOTIFICATION for notifications.'
);

// SIMPL-QM-005: Notification BAPI changes
transforms['SIMPL-QM-005'] = createCommentTransform(
  'SIMPL-QM-005',
  'Notification BAPI changes',
  /(\s*)(\bBAPI_QUALNOT_\w+)/ig,
  'Use API_QUALITYNOTIFICATION OData service.'
);

// SIMPL-QM-006: QM notification type changes
transforms['SIMPL-QM-006'] = createFlagTransform(
  'SIMPL-QM-006',
  'QM notification type changes',
  /\b(QM01|QM02|QM03)\b/i,
  'Review notification type configuration.'
);

// SIMPL-QM-007: Inspection plan table structure changes
transforms['SIMPL-QM-007'] = createCommentTransform(
  'SIMPL-QM-007',
  'Inspection plan table structure changes',
  /(\s*)(\b(PLKO|PLPO|PLMK|PLMZ)\b)/ig,
  'Review inspection plan data model for S/4HANA changes.'
);

// SIMPL-QM-008: Master inspection characteristics changes
transforms['SIMPL-QM-008'] = createCommentTransform(
  'SIMPL-QM-008',
  'Master inspection characteristics changes',
  /(\s*)(\b(QPMK|QPMT|QPMV)\b)/ig,
  'Review master inspection characteristics configuration.'
);

// SIMPL-QM-009: Results recording table changes
transforms['SIMPL-QM-009'] = createCommentTransform(
  'SIMPL-QM-009',
  'Results recording table changes',
  /(\s*)(\b(QAVE|QAKL)\b)/ig,
  'Review results recording data model.'
);

// SIMPL-QM-010: SPC (Statistical Process Control) changes
transforms['SIMPL-QM-010'] = createFlagTransform(
  'SIMPL-QM-010',
  'SPC (Statistical Process Control) changes',
  /\b(QCC0|QCC1|QCC2|QCC3)\b/i,
  'Review SPC control chart configuration.'
);

// SIMPL-QM-011: Quality certificate changes
transforms['SIMPL-QM-011'] = createCommentTransform(
  'SIMPL-QM-011',
  'Quality certificate changes',
  /(\s*)(\b(QC21|QC22|QC51|QCPR)\b)/ig,
  'Review certificate profile configuration and output management.'
);

// SIMPL-QM-012: QM-MM integration changes
transforms['SIMPL-QM-012'] = createCommentTransform(
  'SIMPL-QM-012',
  'QM-MM integration changes',
  /(\s*)(\b(QINF|QI01|QI02|QI03)\b)/ig,
  'Review QM-MM integration settings for S/4HANA.'
);

// SIMPL-QM-013: Vendor quality scoring changes
transforms['SIMPL-QM-013'] = createFlagTransform(
  'SIMPL-QM-013',
  'Vendor quality scoring changes',
  /\bQINF.*LIFNR|LIFNR.*QINF\b/i,
  'Review vendor quality scoring configuration.'
);

// SIMPL-QM-014: In-process inspection changes
transforms['SIMPL-QM-014'] = createCommentTransform(
  'SIMPL-QM-014',
  'In-process inspection changes',
  /(\s*)(\bQPR5\b)/ig,
  'Review in-process inspection trigger points.'
);

// SIMPL-QM-015: Quality view in routing
transforms['SIMPL-QM-015'] = createFlagTransform(
  'SIMPL-QM-015',
  'Quality view in routing',
  /\b(CA01|CA02).*QUAL\b/i,
  'Review routing quality view configuration.'
);

// SIMPL-QM-016: Delivery inspection changes
transforms['SIMPL-QM-016'] = createCommentTransform(
  'SIMPL-QM-016',
  'Delivery inspection changes',
  /(\s*)(\bQEVENT.*VL\b)/ig,
  'Review outbound delivery QM integration.'
);

// SIMPL-QM-017: Stability study changes
transforms['SIMPL-QM-017'] = createFlagTransform(
  'SIMPL-QM-017',
  'Stability study changes',
  /\b(QST01|QST02)\b/i,
  'Review stability study configuration.'
);

// SIMPL-QM-018: Digital manufacturing integration
transforms['SIMPL-QM-018'] = createCommentTransform(
  'SIMPL-QM-018',
  'Digital manufacturing integration',
  /(\s*)(\bDMC_QM|QM_DMC\b)/ig,
  'Consider SAP Digital Manufacturing Cloud integration for QM.'
);

// SIMPL-QM-019: Batch determination with quality
transforms['SIMPL-QM-019'] = createCommentTransform(
  'SIMPL-QM-019',
  'Batch determination with quality',
  /(\s*)(\bMCH1.*QALS|QALS.*MCH1\b)/ig,
  'Review batch-QM integration settings.'
);

// SIMPL-QM-020: Quality audit changes
transforms['SIMPL-QM-020'] = createFlagTransform(
  'SIMPL-QM-020',
  'Quality audit changes',
  /\bPLMD_AUDIT\b/i,
  'Review audit management configuration.'
);


// ── Removed/Replaced Functionality Rules (REM-001 through REM-045) ────────

// SIMPL-REM-001: Warehouse Management (WM) replaced by EWM
transforms['SIMPL-REM-001'] = createCommentTransform(
  'SIMPL-REM-001',
  'Warehouse Management (WM) replaced by EWM',
  /(\s*)(\b(LAGP|LQUA|LTAP|LTBP|L_TO_CREATE)\b)/ig,
  'Migrate to Embedded EWM or Decentralized EWM.'
);

// SIMPL-REM-002: Classic credit management removed
transforms['SIMPL-REM-002'] = createCommentTransform(
  'SIMPL-REM-002',
  'Classic credit management removed',
  /(\s*)(\b(UKM_|FD32|UKMBP_CMS)\b)/ig,
  'Migrate to SAP Credit Management (FSCM).'
);

// SIMPL-REM-003: NAST output management replaced by BRF+
transforms['SIMPL-REM-003'] = createCommentTransform(
  'SIMPL-REM-003',
  'NAST output management replaced by BRF+',
  /(\s*)(\b(NAST|TNAPR|NACH)\b)/ig,
  'Migrate to BRF+ based output management.'
);

// SIMPL-REM-004: SAPscript forms deprecated
transforms['SIMPL-REM-004'] = createCommentTransform(
  'SIMPL-REM-004',
  'SAPscript forms deprecated',
  /(\s*)(\b(OPEN_FORM|CLOSE_FORM|WRITE_FORM)\b)/ig,
  'Migrate to Adobe Forms or SAP Forms Service.'
);

// SIMPL-REM-005: Classic MRP replaced by MRP Live
transforms['SIMPL-REM-005'] = createCommentTransform(
  'SIMPL-REM-005',
  'Classic MRP replaced by MRP Live',
  /(\s*)(\b(MD01|MD02)\b(?!N))/ig,
  'Migrate to MRP Live (MD01N). Review custom MRP exits.'
);

// SIMPL-REM-006: Classic ATP replaced by aATP
transforms['SIMPL-REM-006'] = createCommentTransform(
  'SIMPL-REM-006',
  'Classic ATP replaced by aATP',
  /(\s*)(\bBADI_ATP_|BAPI_MATERIAL_AVAILABILITY\b)/ig,
  'Evaluate advanced ATP (aATP) for availability checks.'
);

// SIMPL-REM-007: Classic GL removed (FAGL)
transforms['SIMPL-REM-007'] = createCommentTransform(
  'SIMPL-REM-007',
  'Classic GL removed (FAGL)',
  /(\s*)(\bFAGL_[A-Z]{2,})/ig,
  'All GL operations now go through ACDOCA. Review all GL access patterns.'
);

// SIMPL-REM-008: Travel Management replaced by Concur
transforms['SIMPL-REM-008'] = createCommentTransform(
  'SIMPL-REM-008',
  'Travel Management replaced by Concur',
  /(\s*)(\b(PTRV_|PR05|TRIP)\b)/ig,
  'Migrate to SAP Concur for travel and expense management.'
);

// SIMPL-REM-009: Web Dynpro ABAP applications
transforms['SIMPL-REM-009'] = createCommentTransform(
  'SIMPL-REM-009',
  'Web Dynpro ABAP applications',
  /(\s*)(\bWDR_|IF_WD_|CL_WD_\w+)/ig,
  'Migrate Web Dynpro applications to Fiori/SAPUI5.'
);

// SIMPL-REM-010: BSP applications deprecated
transforms['SIMPL-REM-010'] = createCommentTransform(
  'SIMPL-REM-010',
  'BSP applications deprecated',
  /(\s*)(\bCL_BSP_|BSP_|IF_BSP_\w+)/ig,
  'Migrate BSP applications to Fiori/SAPUI5.'
);

// SIMPL-REM-011: Classic BW extractors deprecated
transforms['SIMPL-REM-011'] = createCommentTransform(
  'SIMPL-REM-011',
  'Classic BW extractors deprecated',
  /(\s*)(\b(RSA[0-9]|ROOSOURCE|MC_)\w+)/ig,
  'Migrate BW extractors to CDS-based extraction (analytical annotations).'
);

// SIMPL-REM-012: ITS (Internet Transaction Server) removed
transforms['SIMPL-REM-012'] = createCommentTransform(
  'SIMPL-REM-012',
  'ITS (Internet Transaction Server) removed',
  /(\s*)(\bITS_|SAPMSSY0|~WEBGUI\b)/ig,
  'Migrate ITS applications to Fiori or API-based solutions.'
);

// SIMPL-REM-013: FI customer transactions removed (FD01/FD02/FD03)
transforms['SIMPL-REM-013'] = createCommentTransform(
  'SIMPL-REM-013',
  'FI customer transactions removed (FD01/FD02/FD03)',
  /(\s*)(\b(FD01|FD02|FD03|FD04|FD05|FD06|FD08|FD09)\b)/ig,
  'Use BP transaction or Fiori app "Manage Business Partner" (F0850). Use API_BUSINESS_PARTNER for programmatic access.'
);

// SIMPL-REM-014: FI vendor transactions removed (FK01/FK02/FK03)
transforms['SIMPL-REM-014'] = createCommentTransform(
  'SIMPL-REM-014',
  'FI vendor transactions removed (FK01/FK02/FK03)',
  /(\s*)(\b(FK01|FK02|FK03|FK04|FK05|FK06|FK08|FK09)\b)/ig,
  'Use BP transaction or Fiori app "Manage Business Partner" (F0850). Use API_BUSINESS_PARTNER for programmatic access.'
);

// SIMPL-REM-015: SD customer transactions removed (VD01/VD02/VD03)
transforms['SIMPL-REM-015'] = createCommentTransform(
  'SIMPL-REM-015',
  'SD customer transactions removed (VD01/VD02/VD03)',
  /(\s*)(\b(VD01|VD02|VD03|VD04|VD05|VD06|XD01|XD02|XD03|XD04|XD05|XD06|XD07)\b)/ig,
  'Use BP transaction. Customer data is maintained through BP roles. Use Fiori app "Manage Business Partner".'
);

// SIMPL-REM-016: MM vendor transactions removed (MK01/MK02/MK03)
transforms['SIMPL-REM-016'] = createCommentTransform(
  'SIMPL-REM-016',
  'MM vendor transactions removed (MK01/MK02/MK03)',
  /(\s*)(\b(MK01|MK02|MK03|MK04|MK05|MK06|XK01|XK02|XK03|XK04|XK05|XK06|XK07)\b)/ig,
  'Use BP transaction. Vendor/supplier data is maintained through BP roles. Use Fiori app "Manage Business Partner".'
);

// SIMPL-REM-017: Classic credit management transactions removed
transforms['SIMPL-REM-017'] = createCommentTransform(
  'SIMPL-REM-017',
  'Classic credit management transactions removed',
  /(\s*)(\b(FD32|FD33|FD31|S_ALR_87012218|F\.28|F\.31)\b)/ig,
  'Use UKM_MP (Manage Credit Segments) and FSCM credit management Fiori apps. Use transaction UDM_BP for credit master.'
);

// SIMPL-REM-018: Classic WM transactions removed
transforms['SIMPL-REM-018'] = createCommentTransform(
  'SIMPL-REM-018',
  'Classic WM transactions removed',
  /(\s*)(\b(LT0[1-9A]|LS[0-2][0-9]|LI[0-2][0-9]|LB[0-1][0-9]|LX[0-3][0-9])\b)/ig,
  'Migrate to Embedded EWM transactions (/SCWM/*) or EWM Fiori apps.'
);

// SIMPL-REM-019: Classic asset accounting transactions changed
transforms['SIMPL-REM-019'] = createCommentTransform(
  'SIMPL-REM-019',
  'Classic asset accounting transactions changed',
  /(\s*)(\b(OAOA|AO90|OAYR|OAYO|ABLDT)\b)/ig,
  'Review asset accounting customizing. Depreciation areas are now posted in real-time to ACDOCA. Use Fiori apps for asset management.'
);

// SIMPL-REM-020: CO-PA customizing transactions changed
transforms['SIMPL-REM-020'] = createCommentTransform(
  'SIMPL-REM-020',
  'CO-PA customizing transactions changed',
  /(\s*)(\b(KE4I|KE1A|KE21|KE21N|KE23|KE24|KE27|KE28|KEPM)\b)/ig,
  'Use account-based CO-PA (default in S/4HANA). Costing-based CO-PA is optional. Review all CO-PA reports and planning layouts.'
);

// SIMPL-REM-021: Removed FI function modules
transforms['SIMPL-REM-021'] = createCommentTransform(
  'SIMPL-REM-021',
  'Removed FI function modules',
  /(\s*)(\b(BAPI_ACC_GL_POSTING_POST|BAPI_ACC_ACT_POSTING_POST|AC_DOCUMENT_RECORD|FI_DOCUMENT_CHANGE|POSTING_INTERFACE_START)\b)/ig,
  'Use BAPI_ACC_DOCUMENT_POST (still available but with parameter changes) or new Fiori-based posting APIs.'
);

// SIMPL-REM-022: Removed SD function modules
transforms['SIMPL-REM-022'] = createCommentTransform(
  'SIMPL-REM-022',
  'Removed SD function modules',
  /(\s*)(\b(SD_SALESDOCUMENT_CREATE|SD_CUSTOMER_MAINTAIN_ALL|BAPI_SALESORDER_CREATEFROMDAT1|SD_SALESDOCUMENT_CHANGE|RV_INVOICE_CREATE)\b)/ig,
  'Use API_SALES_ORDER_SRV, API_BILLING_DOCUMENT_SRV, or BAPI_SALESORDER_CREATEFROMDAT2.'
);

// SIMPL-REM-023: Removed MM function modules
transforms['SIMPL-REM-023'] = createCommentTransform(
  'SIMPL-REM-023',
  'Removed MM function modules',
  /(\s*)(\b(BAPI_PO_CREATE[^1]|ME_DIRECT_INPUT_\w+|BAPI_REQUISITION_CREATE|MB_CREATE_GOODS_MOVEMENT)\b)/ig,
  'Use BAPI_PO_CREATE1, API_PURCHASEORDER_PROCESS_SRV, BAPI_GOODSMVT_CREATE (with updated parameters).'
);

// SIMPL-REM-024: Report Painter/Writer reports on removed tables
transforms['SIMPL-REM-024'] = createCommentTransform(
  'SIMPL-REM-024',
  'Report Painter/Writer reports on removed tables',
  /(\s*)(\b(GR55|GRR[1-3]|GR3[1-3]|GR5[5-8]|REPORT_PAINTER|REPORT_WRITER)\b)/ig,
  'Rebuild Report Painter reports using ACDOCA-based libraries or migrate to CDS analytical queries and Fiori analytical apps.'
);

// SIMPL-REM-025: Report Painter library 1VK (cost centers) changed
transforms['SIMPL-REM-025'] = createCommentTransform(
  'SIMPL-REM-025',
  'Report Painter library 1VK (cost centers) changed',
  /(\s*)(\b(1VK|6O1|8A2)\b)/ig,
  'Migrate Report Painter cost center reports to CDS analytical views or Fiori app "Cost Centers - Plan/Actual" (F0842A).'
);

// SIMPL-REM-026: Removed classic GL programs
transforms['SIMPL-REM-026'] = createCommentTransform(
  'SIMPL-REM-026',
  'Removed classic GL programs',
  /(\s*)(\b(RFBILA00|RFSALDO|RFSKPL00|RFUMSV00|RFSEPA01|RFDOPR10)\b)/ig,
  'Use new financial reports based on ACDOCA. Use Fiori analytical apps for trial balance, balance sheet, P&L.'
);

// SIMPL-REM-027: Removed classic AP/AR programs
transforms['SIMPL-REM-027'] = createCommentTransform(
  'SIMPL-REM-027',
  'Removed classic AP/AR programs',
  /(\s*)(\b(RFDOPR10|RFHABU00|RFDEBI01|RFKREDI01|RFDABL00|RFKORD10|RFDUZI00)\b)/ig,
  'Use new S/4HANA AP/AR programs and Fiori apps. Use CDS views I_JournalEntryItem for custom reports.'
);

// SIMPL-REM-028: Removed CO reporting transactions
transforms['SIMPL-REM-028'] = createCommentTransform(
  'SIMPL-REM-028',
  'Removed CO reporting transactions',
  /(\s*)(\b(S_ALR_8701361[0-9]|S_ALR_8701362[0-9]|KSB1|KOB1|KOB2|KOB3)\b)/ig,
  'Use Fiori apps for CO reporting. Use CDS views I_CostCenterActualData, I_InternalOrderActualData.'
);

// SIMPL-REM-029: Removed/replaced customer BAPIs
transforms['SIMPL-REM-029'] = createCommentTransform(
  'SIMPL-REM-029',
  'Removed/replaced customer BAPIs',
  /(\s*)(\b(BAPI_CUSTOMER_CREATEFROMDATA[12]?|BAPI_CUSTOMER_CHANGEFROMDATA[12]?|BAPI_CUSTOMER_GETDETAIL[12]?|BAPI_CUSTOMER_GETLIST)\b)/ig,
  'Use API_BUSINESS_PARTNER OData service. For batch processing use BP IDoc (BUMAS) or staging tables.'
);

// SIMPL-REM-030: Removed/replaced vendor BAPIs
transforms['SIMPL-REM-030'] = createCommentTransform(
  'SIMPL-REM-030',
  'Removed/replaced vendor BAPIs',
  /(\s*)(\b(BAPI_VENDOR_CREATE|BAPI_VENDOR_CHANGE|BAPI_VENDOR_GETDETAIL|BAPI_VENDOR_GETLIST|BAPI_VENDOR_EXISTENCECHECK)\b)/ig,
  'Use API_BUSINESS_PARTNER OData service. For batch processing use BP IDoc (BUMAS) or staging tables.'
);

// SIMPL-REM-031: Removed/replaced GL accounting BAPIs
transforms['SIMPL-REM-031'] = createCommentTransform(
  'SIMPL-REM-031',
  'Removed/replaced GL accounting BAPIs',
  /(\s*)(\b(BAPI_ACC_GL_POSTING_POST|BAPI_GL_GETGLACCBALANCE|BAPI_GL_GETGLACCCURRENTBALANCE|BAPI_GL_GETGLACCPERIODBALANCE)\b)/ig,
  'Use BAPI_ACC_DOCUMENT_POST for GL postings. Use CDS views I_GLAccountBalance for balance queries.'
);

// SIMPL-REM-032: Obsolete FI customizing transactions
transforms['SIMPL-REM-032'] = createCommentTransform(
  'SIMPL-REM-032',
  'Obsolete FI customizing transactions',
  /(\s*)(\b(GCAC|GCBA|GCL2|GCL3|GCAA|GCAT)\b)/ig,
  'Use new FI customizing for universal journal. Special purpose ledger is replaced by extension ledgers in ACDOCA.'
);

// SIMPL-REM-033: SmartForms deprecated in favor of Adobe Forms
transforms['SIMPL-REM-033'] = createCommentTransform(
  'SIMPL-REM-033',
  'SmartForms deprecated in favor of Adobe Forms',
  /(\s*)(\b(SMARTFORMS|SSF_FUNCTION_MODULE_NAME|SSF_OPEN|SSF_CLOSE)\b)/ig,
  'Migrate SmartForms to Adobe Forms (SFP transaction). For cloud scenarios use SAP Forms Service by Adobe.'
);

// SIMPL-REM-034: Classic batch management changes
transforms['SIMPL-REM-034'] = createCommentTransform(
  'SIMPL-REM-034',
  'Classic batch management changes',
  /(\s*)(\b(MSC1N|MSC2N|MSC3N|VCH1|VCH2|VCH3|BATCH_INPUT_)\w*)/ig,
  'Review batch management customizing. Use API_BATCH_SRV for programmatic batch management.'
);

// SIMPL-REM-035: Classic profit center accounting removed
transforms['SIMPL-REM-035'] = createCommentTransform(
  'SIMPL-REM-035',
  'Classic profit center accounting removed',
  /(\s*)(\b(GLPCA|GLPCC|GLPCP|KE5[A-Z]|1KE[A-Z]|3KE[A-Z])\b)/ig,
  'Profit center data is in ACDOCA. Use CDS views I_ProfitCenterActualData. Migrate EC-PCA reports to ACDOCA-based reports.'
);

// SIMPL-REM-036: Classic special purpose ledger removed
transforms['SIMPL-REM-036'] = createCommentTransform(
  'SIMPL-REM-036',
  'Classic special purpose ledger removed',
  /(\s*)(\b(FI_SL_|GRPT|GLFUNCT|GCL[0-9]|GCAC)\b)/ig,
  'Use extension ledgers in ACDOCA (RLDNR field). Configure additional ledgers via FINSC_LEDGER.'
);

// SIMPL-REM-037: Classic dunning program replaced
transforms['SIMPL-REM-037'] = createCommentTransform(
  'SIMPL-REM-037',
  'Classic dunning program replaced',
  /(\s*)(\b(RFMAHN00|F150|RFMAHN_F150)\b)/ig,
  'Review dunning program configuration. Use Fiori app "Schedule Dunning Runs" and new dunning APIs.'
);

// SIMPL-REM-038: Classic payment program changes
transforms['SIMPL-REM-038'] = createCommentTransform(
  'SIMPL-REM-038',
  'Classic payment program changes',
  /(\s*)(\b(RFFOUS_T|RFFOD_T|RFFOEDI1|RFFOBR_U|F110)\b)/ig,
  'Review payment program configuration. Consider migration to Payment Factory or Advanced Payment Management.'
);

// SIMPL-REM-039: Removed WM function modules
transforms['SIMPL-REM-039'] = createCommentTransform(
  'SIMPL-REM-039',
  'Removed WM function modules',
  /(\s*)(\b(L_TO_CREATE_SINGLE|L_TO_CREATE_MOVE_SU|L_TO_CONFIRM|L_TO_CREATE_DN|L_TO_CREATE_TR)\b)/ig,
  'Migrate to EWM APIs (/SCWM/ function modules and services). Use API_WAREHOUSE_TASK for warehouse operations.'
);

// SIMPL-REM-040: Removed inventory management transactions
transforms['SIMPL-REM-040'] = createCommentTransform(
  'SIMPL-REM-040',
  'Removed inventory management transactions',
  /(\s*)(\b(MB01|MB02|MB03|MB11|MB1A|MB1B|MB1C|MB31|MB51|MB52)\b)/ig,
  'Use MIGO for goods movements. Use Fiori apps "Post Goods Receipt" (F0842), "Post Goods Issue" (F1654). Some MB* tcodes redirect to MIGO.'
);

// SIMPL-REM-041: Classic costing run transactions changed
transforms['SIMPL-REM-041'] = createCommentTransform(
  'SIMPL-REM-041',
  'Classic costing run transactions changed',
  /(\s*)(\b(CK40N|CK11N|CK24|CK44|CKMLRUNPERIOD)\b)/ig,
  'Material Ledger is mandatory. Review actual costing configuration. Use Fiori apps for material price analysis.'
);

// SIMPL-REM-042: Removed/replaced scheduling agreement BAPIs
transforms['SIMPL-REM-042'] = createCommentTransform(
  'SIMPL-REM-042',
  'Removed/replaced scheduling agreement BAPIs',
  /(\s*)(\b(BAPI_SAG_CREATE|BAPI_SAG_CHANGE|BAPI_SAG_GETDETAIL|BAPI_CONTRACT_CREATE|BAPI_CONTRACT_CHANGE)\b)/ig,
  'Use API_SALES_SCHEDULING_AGREEMENT or API_SALES_CONTRACT_SRV for scheduling agreements and contracts.'
);

// SIMPL-REM-043: Classic material master BAPIs deprecated
transforms['SIMPL-REM-043'] = createCommentTransform(
  'SIMPL-REM-043',
  'Classic material master BAPIs deprecated',
  /(\s*)(\b(BAPI_MATERIAL_SAVEDATA|BAPI_MATERIAL_GET_ALL|BAPI_MATERIAL_GETLIST|BAPI_MATERIAL_GETDETAIL)\b)/ig,
  'Use API_PRODUCT_SRV OData service or CDS views I_Product, I_ProductPlant for material master access.'
);

// SIMPL-REM-044: Removed HR/HCM integration points
transforms['SIMPL-REM-044'] = createCommentTransform(
  'SIMPL-REM-044',
  'Removed HR/HCM integration points',
  /(\s*)(\b(HR_INFOTYPE_OPERATION|HR_READ_INFOTYPE|RP_READ_INFOTYPE|BAPI_EMPLOYEE_)\w*)/ig,
  'Review HR integration points. For cloud scenarios migrate to SuccessFactors APIs. On-premise HR FMs still available but review parameter changes.'
);

// SIMPL-REM-045: Removed ALV report variants using deprecated tables
transforms['SIMPL-REM-045'] = createCommentTransform(
  'SIMPL-REM-045',
  'Removed ALV report variants using deprecated tables',
  /(\s*)(\b(FBL1N|FBL3N|FBL5N|FAGLL03|FAGLL03H)\b)/ig,
  'Use new FI line item browsers based on ACDOCA. Use Fiori apps "Display Line Items in General Ledger" and equivalents.'
);


// ── Transportation Management Rules (TM-001 through TM-024) ───────────────

// SIMPL-TM-001: Legacy Shipment Processing (VT01-VT03)
transforms['SIMPL-TM-001'] = createCommentTransform(
  'SIMPL-TM-001',
  'Legacy Shipment Processing (VT01-VT03)',
  /(\s*)(\b(VT0[1-3]N?|VTTK|VTTP|VTTS)\b)/ig,
  'Replace VT01-VT03 with TM freight order management (/SCMTMS/FO_CREATE).'
);

// SIMPL-TM-002: Shipment Cost Settlement Changed
transforms['SIMPL-TM-002'] = createCommentTransform(
  'SIMPL-TM-002',
  'Shipment Cost Settlement Changed',
  /(\s*)(\b(VI0[1-3]|VFSI|SHIPMENT_COST)\b)/ig,
  'Migrate shipment cost settlement to TM freight settlement. Configure charge calculation schemas.'
);

// SIMPL-TM-003: Transportation Planning Point Replaced
transforms['SIMPL-TM-003'] = createCommentTransform(
  'SIMPL-TM-003',
  'Transportation Planning Point Replaced',
  /(\s*)(\b(VSTEL|TRANS_PLAN_POINT|T000V)\b)/ig,
  'Map transportation planning points to TM organizational model.'
);

// SIMPL-TM-004: Route Determination Changed
transforms['SIMPL-TM-004'] = createCommentTransform(
  'SIMPL-TM-004',
  'Route Determination Changed',
  /(\s*)(\b(OVTC|TVRO|ROUTE_DET|T_ROUTE)\b)/ig,
  'Configure transportation lanes in TM to replace legacy route determination.'
);

// SIMPL-TM-005: Carrier Selection Replaced
transforms['SIMPL-TM-005'] = createCommentTransform(
  'SIMPL-TM-005',
  'Carrier Selection Replaced',
  /(\s*)(\b(CARRIER_SELECTION|TDLNR|FORWARDING_AGENT)\b)/ig,
  'Set up TM carrier profiles and integrate with SAP Business Network for freight collaboration.'
);

// SIMPL-TM-006: Delivery-to-Shipment Integration
transforms['SIMPL-TM-006'] = createCommentTransform(
  'SIMPL-TM-006',
  'Delivery-to-Shipment Integration',
  /(\s*)(\b(VLSP|DELIVERY_SHIPMENT|VL32N)\b)/ig,
  'Configure freight unit builder in TM for automatic delivery-to-freight unit assignment.'
);

// SIMPL-TM-007: Dangerous Goods Processing Changed
transforms['SIMPL-TM-007'] = createCommentTransform(
  'SIMPL-TM-007',
  'Dangerous Goods Processing Changed',
  /(\s*)(\b(DG_CHECK|DANGEROUS_GOODS|VGK[1-3])\b)/ig,
  'Configure dangerous goods processing in TM. Review DG master data migration.'
);

// SIMPL-TM-008: Freight Cost Calculation Schema
transforms['SIMPL-TM-008'] = createCommentTransform(
  'SIMPL-TM-008',
  'Freight Cost Calculation Schema',
  /(\s*)(\b(FREIGHT_COST|KOFL|SHIPMENT_CONDITION)\b)/ig,
  'Migrate freight cost conditions to TM charge calculation schemas.'
);

// SIMPL-TM-009: Freight Order Planning and Optimization
transforms['SIMPL-TM-009'] = createCommentTransform(
  'SIMPL-TM-009',
  'Freight Order Planning and Optimization',
  /(\s*)(\b(FO_PLANNING|FO_OPTIM|LOAD_BUILD|VT04)\b|\/SCMTMS\/FO_PLAN)/ig,
  'Configure TM freight order planning profiles. Set up optimization strategies for consolidation and routing.'
);

// SIMPL-TM-010: Freight Order Execution Monitoring
transforms['SIMPL-TM-010'] = createCommentTransform(
  'SIMPL-TM-010',
  'Freight Order Execution Monitoring',
  /(\s*)(\b(FO_EXECUTION|FO_STATUS|SHIPMENT_STATUS|FO_STAGE)\b|\/SCMTMS\/FO_EXEC)/ig,
  'Configure TM freight order execution profiles. Define execution stages and event-based status management.'
);

// SIMPL-TM-011: Freight Order Settlement and Invoicing
transforms['SIMPL-TM-011'] = createCommentTransform(
  'SIMPL-TM-011',
  'Freight Order Settlement and Invoicing',
  /(\s*)(\b(FO_SETTLE|FREIGHT_SETTLE|FREIGHT_INVOICE|ACCRUAL_POST)\b|\/SCMTMS\/SETTLE)/ig,
  'Configure TM settlement profiles and charge calculation schemas. Set up freight invoice verification workflow.'
);

// SIMPL-TM-012: Carrier Agreement and Rate Management
transforms['SIMPL-TM-012'] = createCommentTransform(
  'SIMPL-TM-012',
  'Carrier Agreement and Rate Management',
  /(\s*)(\b(CARRIER_AGREE|FREIGHT_RATE|RATE_TABLE|TARIFF_MGMT)\b|\/SCMTMS\/CA_)/ig,
  'Maintain carrier agreements in TM. Define rate tables, surcharge schemas, and validity dates for carrier contracts.'
);

// SIMPL-TM-013: Freight Tendering and Bid Management
transforms['SIMPL-TM-013'] = createCommentTransform(
  'SIMPL-TM-013',
  'Freight Tendering and Bid Management',
  /(\s*)(\b(FREIGHT_TENDER|SPOT_BID|CARRIER_BID|WATERFALL_TENDER)\b|\/SCMTMS\/TEND)/ig,
  'Configure TM tendering profiles. Set up carrier collaboration via SAP Business Network for freight.'
);

// SIMPL-TM-014: Freight Unit Building Rules
transforms['SIMPL-TM-014'] = createCommentTransform(
  'SIMPL-TM-014',
  'Freight Unit Building Rules',
  /(\s*)(\b(FREIGHT_UNIT|FU_BUILD|FU_RULE|DELIVERY_GROUP)\b|\/SCMTMS\/FU_)/ig,
  'Configure freight unit building rules in TM. Define compatibility groups and capacity constraints for unit aggregation.'
);

// SIMPL-TM-015: Freight Unit Packaging and Loading
transforms['SIMPL-TM-015'] = createCommentTransform(
  'SIMPL-TM-015',
  'Freight Unit Packaging and Loading',
  /(\s*)(\b(FU_PACKAGE|FU_LOADING|LOAD_INSTRUCT|PACKAGE_BUILD)\b)/ig,
  'Configure freight unit packaging profiles. Integrate with EWM for ship-HU and loading optimization.'
);

// SIMPL-TM-016: Shipment Tracking and Visibility
transforms['SIMPL-TM-016'] = createCommentTransform(
  'SIMPL-TM-016',
  'Shipment Tracking and Visibility',
  /(\s*)(\b(TRACK_TRACE|SHIPMENT_TRACK|GPS_TRACK|MILESTONE_MON)\b|\/SCMTMS\/TRACK)/ig,
  'Configure TM event management for shipment tracking. Integrate with SAP Business Network for Global Track and Trace.'
);

// SIMPL-TM-017: ETA Calculation and Exception Management
transforms['SIMPL-TM-017'] = createCommentTransform(
  'SIMPL-TM-017',
  'ETA Calculation and Exception Management',
  /(\s*)(\b(ETA_CALC|DELAY_ALERT|EXCEPT_MGMT|DISRUPT_MON)\b)/ig,
  'Configure ETA calculation rules and exception thresholds. Set up alert profiles for shipment monitoring.'
);

// SIMPL-TM-018: Transportation Subcontracting
transforms['SIMPL-TM-018'] = createCommentTransform(
  'SIMPL-TM-018',
  'Transportation Subcontracting',
  /(\s*)(\b(TM_SUBCONTRACT|CARRIER_SUBCON|MULTI_LEG|HANDOFF)\b)/ig,
  'Configure subcontracting profiles in TM. Define multi-leg planning rules and inter-carrier settlement.'
);

// SIMPL-TM-019: Intermodal Transport Planning
transforms['SIMPL-TM-019'] = createCommentTransform(
  'SIMPL-TM-019',
  'Intermodal Transport Planning',
  /(\s*)(\b(INTERMODAL|MULTIMODAL|MODE_CHANGE|RAIL_OCEAN|AIR_FREIGHT)\b)/ig,
  'Configure intermodal planning rules. Define transportation modes, transfer points, and mode-specific constraints.'
);

// SIMPL-TM-020: Charge Calculation Schema Configuration
transforms['SIMPL-TM-020'] = createCommentTransform(
  'SIMPL-TM-020',
  'Charge Calculation Schema Configuration',
  /(\s*)(\b(CHARGE_CALC|RATE_SCHEMA|WEIGHT_BREAK|DIST_TABLE)\b|\/SCMTMS\/CALC)/ig,
  'Configure charge calculation schemas in TM. Map legacy freight pricing conditions to TM rate structures.'
);

// SIMPL-TM-021: Freight Cost Distribution to Sales Orders
transforms['SIMPL-TM-021'] = createCommentTransform(
  'SIMPL-TM-021',
  'Freight Cost Distribution to Sales Orders',
  /(\s*)(\b(COST_DISTRIB|FREIGHT_ALLOC|FREIGHT_BILL|COST_APPORTION)\b)/ig,
  'Configure cost distribution rules in TM. Define allocation methods for freight cost posting to source documents.'
);

// SIMPL-TM-022: TM-EWM Integration for Loading and Shipping
transforms['SIMPL-TM-022'] = createCommentTransform(
  'SIMPL-TM-022',
  'TM-EWM Integration for Loading and Shipping',
  /(\s*)(\b(TM_EWM_INT|DOCK_APPT|LOAD_EXEC|SHIP_CONFIRM)\b)/ig,
  'Configure TM-EWM integration. Set up dock scheduling, loading step determination, and shipping confirmation flow.'
);

// SIMPL-TM-023: TM-SD Integration for Order Fulfillment
transforms['SIMPL-TM-023'] = createCommentTransform(
  'SIMPL-TM-023',
  'TM-SD Integration for Order Fulfillment',
  /(\s*)(\b(TM_SD_INT|TRANSIT_TIME|SD_FREIGHT|ORDER_FULFILL)\b)/ig,
  'Configure TM-SD integration for transit time determination and freight cost transfer to billing.'
);

// SIMPL-TM-024: TM-MM Integration for Inbound Logistics
transforms['SIMPL-TM-024'] = createCommentTransform(
  'SIMPL-TM-024',
  'TM-MM Integration for Inbound Logistics',
  /(\s*)(\b(TM_MM_INT|INBOUND_FREIGHT|PO_FREIGHT|SUPPLIER_FREIGHT)\b)/ig,
  'Configure TM-MM integration for inbound logistics. Define purchase order freight relevance and supplier freight settlement.'
);

module.exports = transforms;
