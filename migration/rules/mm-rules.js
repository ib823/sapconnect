/**
 * Materials Management (MM) Simplification Rules
 *
 * Covers: MATNR 40 chars, MRP changes, batch management,
 * inventory valuation, goods movement, invoice verification,
 * purchasing, source determination, physical inventory,
 * service procurement, subcontracting, stock transport orders,
 * warehouse integration, dangerous goods, vendor evaluation,
 * consumption-based planning, classification, and more.
 *
 * Rules SIMPL-MM-001 through SIMPL-MM-019: original baseline.
 * Rules SIMPL-MM-020 through SIMPL-MM-065: expanded coverage
 * for S/4HANA simplification areas across all MM sub-modules.
 */

module.exports = [
  // ══════════════════════════════════════════════════════════════
  // ── Material Master ──────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  {
    id: 'SIMPL-MM-001',
    category: 'Material Management - Material Master',
    severity: 'medium',
    title: 'Material number length changed to 40',
    description: 'MATNR extended from 18 to 40 characters. Hardcoded length assumptions break.',
    pattern: /MATNR.*(?:TYPE C LENGTH 18|CHAR18|\(18\))/i,
    patternType: 'source',
    remediation: 'Use TYPE matnr (dictionary type) instead of hardcoded lengths.',
    simplificationId: 'S4TWL-MM-001',
  },
  {
    id: 'SIMPL-MM-002',
    category: 'Material Management - Material Master',
    severity: 'medium',
    title: 'Material type configuration changes',
    description: 'Material types have new industry sector handling and product type concept.',
    pattern: /\bT134\b/i,
    patternType: 'source',
    remediation: 'Review material type configuration for product master changes.',
    simplificationId: 'S4TWL-MM-002',
  },
  {
    id: 'SIMPL-MM-003',
    category: 'Material Management - Material Master',
    severity: 'low',
    title: 'MARA/MARC field changes',
    description: 'Several MARA/MARC fields removed or restructured in S/4HANA.',
    pattern: /\b(MARA-MFRNR|MARA-MFRPN|MARC-MMSTA)\b/i,
    patternType: 'source',
    remediation: 'Review material master field usage against S/4HANA data model.',
    simplificationId: 'S4TWL-MM-003',
  },

  // ══════════════════════════════════════════════════════════════
  // ── MRP ──────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  {
    id: 'SIMPL-MM-004',
    category: 'Material Management - MRP',
    severity: 'high',
    title: 'Classic MRP replaced by MRP Live',
    description: 'Classic MRP (MD01/MD02) replaced by MRP Live (MD01N). MDTB/MDKP tables changed.',
    pattern: /\b(MD01|MD02|MDTB|MDKP|MDTC)\b/i,
    patternType: 'source',
    remediation: 'Migrate to MRP Live. Review MRP exit usage (EXIT_SAPLMD01*).',
    simplificationId: 'S4TWL-MM-MRP-001',
  },
  {
    id: 'SIMPL-MM-005',
    category: 'Material Management - MRP',
    severity: 'medium',
    title: 'Demand-driven MRP (DDMRP) available',
    description: 'S/4HANA supports DDMRP for buffer-based planning. Consider migration.',
    pattern: /\bMD04\b/i,
    patternType: 'source',
    remediation: 'Evaluate DDMRP for eligible materials with variable demand.',
    simplificationId: 'S4TWL-MM-MRP-002',
  },
  {
    id: 'SIMPL-MM-006',
    category: 'Material Management - MRP',
    severity: 'medium',
    title: 'Planned order changes',
    description: 'Planned orders (PLAF) table structure changed in MRP Live.',
    pattern: /\bPLAF\b/i,
    patternType: 'source',
    remediation: 'Review planned order access for MRP Live compatibility.',
    simplificationId: 'S4TWL-MM-MRP-003',
  },

  // ══════════════════════════════════════════════════════════════
  // ── Batch Management ─────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  {
    id: 'SIMPL-MM-007',
    category: 'Material Management - Batch',
    severity: 'medium',
    title: 'Batch management classification changes',
    description: 'Batch classification (MCH1, MCHA) has new batch derivation features.',
    pattern: /\b(MCH1|MCHA|MCHB)\b/i,
    patternType: 'source',
    remediation: 'Review batch management for new classification and derivation.',
    simplificationId: 'S4TWL-MM-BATCH-001',
  },

  // ══════════════════════════════════════════════════════════════
  // ── Inventory Valuation ──────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  {
    id: 'SIMPL-MM-008',
    category: 'Material Management - Valuation',
    severity: 'high',
    title: 'Material Ledger mandatory for valuation',
    description: 'Material Ledger is mandatory in S/4HANA. All valuation goes through ML.',
    pattern: /\b(MBEW|CKMLRUNPERIOD|CKMLPRKEPH)\b/i,
    patternType: 'source',
    remediation: 'Activate Material Ledger. Review valuation procedures.',
    simplificationId: 'S4TWL-MM-VAL-001',
  },
  {
    id: 'SIMPL-MM-009',
    category: 'Material Management - Valuation',
    severity: 'medium',
    title: 'Split valuation changes',
    description: 'Split valuation (MBEW with BWTAR) changed with mandatory ML.',
    pattern: /\bMBEW.*BWTAR|BWTAR.*MBEW\b/i,
    patternType: 'source',
    remediation: 'Review split valuation configuration with Material Ledger.',
    simplificationId: 'S4TWL-MM-VAL-002',
  },

  // ══════════════════════════════════════════════════════════════
  // ── Goods Movement ───────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  {
    id: 'SIMPL-MM-010',
    category: 'Material Management - Goods Movement',
    severity: 'high',
    title: 'BAPI_GOODSMVT_CREATE changes',
    description: 'BAPI_GOODSMVT_CREATE has new parameters and changed behavior in S/4HANA.',
    pattern: /\bBAPI_GOODSMVT_CREATE\b/i,
    patternType: 'source',
    remediation: 'Review BAPI parameters. Consider API_MATERIAL_DOCUMENT_SRV OData service.',
    simplificationId: 'S4TWL-MM-GM-001',
  },
  {
    id: 'SIMPL-MM-011',
    category: 'Material Management - Goods Movement',
    severity: 'medium',
    title: 'MKPF/MSEG table changes',
    description: 'Material document tables MKPF (header) and MSEG (items) have structural changes.',
    pattern: /\b(MKPF|MSEG)\b/i,
    patternType: 'source',
    remediation: 'Review material document field usage. Use CDS views I_MaterialDocumentHeader.',
    simplificationId: 'S4TWL-MM-GM-002',
  },
  {
    id: 'SIMPL-MM-012',
    category: 'Material Management - Goods Movement',
    severity: 'medium',
    title: 'Movement type customization changes',
    description: 'Movement type configuration (T156, T156B) has new fields for ML integration.',
    pattern: /\b(T156|T156B|T156M)\b/i,
    patternType: 'source',
    remediation: 'Review movement type configuration for ML and ACDOCA.',
    simplificationId: 'S4TWL-MM-GM-003',
  },

  // ══════════════════════════════════════════════════════════════
  // ── Invoice Verification ─────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  {
    id: 'SIMPL-MM-013',
    category: 'Material Management - Invoice',
    severity: 'medium',
    title: 'Invoice verification changes',
    description: 'RBKP/RSEG (logistics invoice tables) have structural changes.',
    pattern: /\b(RBKP|RSEG)\b/i,
    patternType: 'source',
    remediation: 'Review invoice verification. Consider migration to central invoice management.',
    simplificationId: 'S4TWL-MM-IV-001',
  },
  {
    id: 'SIMPL-MM-014',
    category: 'Material Management - Invoice',
    severity: 'low',
    title: 'MR8M reversal changes',
    description: 'Invoice reversal (MR8M) behavior changed in S/4HANA.',
    pattern: /\bMR8M\b/i,
    patternType: 'source',
    remediation: 'Review invoice reversal processes.',
    simplificationId: 'S4TWL-MM-IV-002',
  },

  // ══════════════════════════════════════════════════════════════
  // ── Purchasing ───────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  {
    id: 'SIMPL-MM-015',
    category: 'Material Management - Purchasing',
    severity: 'medium',
    title: 'Purchase order BAPI changes',
    description: 'BAPI_PO_CREATE1 and BAPI_PO_CHANGE have new parameters in S/4HANA.',
    pattern: /\b(BAPI_PO_CREATE1|BAPI_PO_CHANGE)\b/i,
    patternType: 'source',
    remediation: 'Review BAPI parameters. Consider API_PURCHASEORDER_PROCESS_SRV.',
    simplificationId: 'S4TWL-MM-PO-001',
  },
  {
    id: 'SIMPL-MM-016',
    category: 'Material Management - Purchasing',
    severity: 'medium',
    title: 'EKKO/EKPO structural changes',
    description: 'Purchase document tables EKKO/EKPO have new fields and changed structures.',
    pattern: /\b(EKKO|EKPO)\b/i,
    patternType: 'source',
    remediation: 'Review PO document field usage against S/4HANA data model.',
    simplificationId: 'S4TWL-MM-PO-002',
  },

  // ══════════════════════════════════════════════════════════════
  // ── Source Determination ─────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  {
    id: 'SIMPL-MM-017',
    category: 'Material Management - Sourcing',
    severity: 'low',
    title: 'Source list/info record changes',
    description: 'EINA/EINE (purchasing info records) have structural changes.',
    pattern: /\b(EINA|EINE)\b/i,
    patternType: 'source',
    remediation: 'Review purchasing info records for S/4HANA compatibility.',
    simplificationId: 'S4TWL-MM-SRC-001',
  },

  // ══════════════════════════════════════════════════════════════
  // ── Physical Inventory ───────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  {
    id: 'SIMPL-MM-018',
    category: 'Material Management - Inventory',
    severity: 'low',
    title: 'Physical inventory document changes',
    description: 'IKPF (PI document header) has new fields for S/4HANA.',
    pattern: /\b(IKPF|ISEG)\b/i,
    patternType: 'source',
    remediation: 'Review physical inventory processes.',
    simplificationId: 'S4TWL-MM-PI-001',
  },

  // ══════════════════════════════════════════════════════════════
  // ── Reservation ──────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  {
    id: 'SIMPL-MM-019',
    category: 'Material Management - Reservation',
    severity: 'low',
    title: 'Reservation management changes',
    description: 'RKPF/RESB (reservation tables) have structural changes.',
    pattern: /\b(RKPF|RESB)\b/i,
    patternType: 'source',
    remediation: 'Review reservation management processes.',
    simplificationId: 'S4TWL-MM-RES-001',
  },

  // ══════════════════════════════════════════════════════════════
  // ══  EXPANDED RULES (SIMPL-MM-020 onwards)  ══════════════════
  // ══════════════════════════════════════════════════════════════

  // ── Material Master (extended) ───────────────────────────────
  {
    id: 'SIMPL-MM-020',
    category: 'Material Management - Material Master',
    severity: 'high',
    title: 'Hardcoded 18-char MATNR in CONCATENATE/string operations',
    description:
      'CONCATENATE, string templates, or WRITE TO that assume MATNR is 18 characters will truncate material numbers in S/4HANA where MATNR is 40 characters.',
    pattern: /(?:CONCATENATE|WRITE\s+TO|&&).*MATNR.*(?:18|\(18\))/i,
    patternType: 'source',
    remediation:
      'Remove hardcoded length references. Use TYPE matnr or dynamic string operations that respect the full 40-character field.',
  },
  {
    id: 'SIMPL-MM-021',
    category: 'Material Management - Material Master',
    severity: 'medium',
    title: '40-char MATNR impact on ALV and screen layouts',
    description:
      'ALV field catalogs, selection screens, and Dynpro fields that define MATNR with a fixed output length of 18 will clip material numbers.',
    pattern: /(?:OUTPUTLEN|LENG|scrtext).*18.*MATNR|MATNR.*(?:OUTPUTLEN|LENG|scrtext).*18/i,
    patternType: 'source',
    remediation:
      'Update ALV field catalogs and screen painter layouts to accommodate 40-character MATNR. Use DDIC reference instead of hardcoded lengths.',
  },
  {
    id: 'SIMPL-MM-022',
    category: 'Material Management - Material Master',
    severity: 'medium',
    title: '40-char MATNR in flat-file interfaces and IDocs',
    description:
      'Flat-file interfaces, EDI mappings, and IDoc segments that reserve only 18 characters for MATNR will fail for extended material numbers.',
    pattern: /(?:MATNR|MATERIAL).*(?:LENGTH\s+18|CHAR\(18\)|C\(18\)|18\s+TYPE\s+C)/i,
    patternType: 'source',
    remediation:
      'Extend all interface record layouts, IDoc segment definitions, and file-mapping programs to handle 40-character MATNR.',
  },
  {
    id: 'SIMPL-MM-023',
    category: 'Material Management - Material Master',
    severity: 'medium',
    title: 'Industry sector assignment changes',
    description:
      'Industry sector (MARA-MBRSH) assignment rules have changed. Certain industry-specific views are restructured under the product master concept in S/4HANA.',
    pattern: /\b(MARA-MBRSH|MBRSH|T137)\b/i,
    patternType: 'source',
    remediation:
      'Review industry sector assignments. Validate that material master views are still generated correctly for each sector after migration.',
  },
  {
    id: 'SIMPL-MM-024',
    category: 'Material Management - Material Master',
    severity: 'low',
    title: 'Material master transaction code changes (MM01/MM02/MM03)',
    description:
      'Classic material master transactions MM01/MM02/MM03 still function but the recommended approach in S/4HANA is the Manage Product Master Data Fiori app.',
    pattern: /\b(?:CALL\s+TRANSACTION\s+')?(MM01|MM02|MM03)(?:'|\b)/i,
    patternType: 'source',
    remediation:
      'Evaluate migration to Fiori Manage Product Master Data app (F1603). Review BDC/CALL TRANSACTION usage for compatibility.',
  },
  {
    id: 'SIMPL-MM-025',
    category: 'Material Management - Material Master',
    severity: 'medium',
    title: 'Material type MTART validation changes',
    description:
      'Material type (MTART) validation and allowed transaction logic changed. Some custom material types may require reconfiguration under the product type concept.',
    pattern: /\b(MTART|T134|T134T)\b.*(?:SELECT|UPDATE|INSERT|MODIFY)/i,
    patternType: 'source',
    remediation:
      'Validate custom material types against S/4HANA product type framework. Review T134 customizing entries for deprecated fields.',
  },

  // ── Purchasing (extended) ────────────────────────────────────
  {
    id: 'SIMPL-MM-026',
    category: 'Material Management - Purchasing',
    severity: 'medium',
    title: 'RFQ processing changes (ME41/ME42/ME43)',
    description:
      'Request for Quotation transactions ME41/ME42/ME43 and underlying tables (EKKO with doc type AN) have changed field-level behavior in S/4HANA.',
    pattern: /\b(ME41|ME42|ME43)\b/i,
    patternType: 'source',
    remediation:
      'Review RFQ processing. Consider Ariba or SAP Business Network integration for sourcing. Validate BAPI_QUOTATION_* usage.',
  },
  {
    id: 'SIMPL-MM-027',
    category: 'Material Management - Purchasing',
    severity: 'medium',
    title: 'Outline agreement / contract changes (ME31K/ME32K)',
    description:
      'Contract creation and maintenance (ME31K/ME32K) and underlying EKKO/EKPO with doc category K have structural changes including new release strategy fields.',
    pattern: /\b(ME31K|ME32K|ME33K|BAPI_CONTRACT_CREATE|BAPI_CONTRACT_CHANGE)\b/i,
    patternType: 'source',
    remediation:
      'Review contract management processes. Consider Central Purchasing Contract Fiori app. Validate BAPI_CONTRACT_* parameter changes.',
  },
  {
    id: 'SIMPL-MM-028',
    category: 'Material Management - Purchasing',
    severity: 'medium',
    title: 'Scheduling agreement changes (ME31L/ME32L)',
    description:
      'Scheduling agreements (ME31L/ME32L) and their schedule lines (EKET table) have new fields for advanced shipping notification integration.',
    pattern: /\b(ME31L|ME32L|ME33L|EKET|BAPI_SAG_CREATE|BAPI_SAG_CHANGE)\b/i,
    patternType: 'source',
    remediation:
      'Review scheduling agreement processes and EKET field usage. Validate JIT call and ASN integration scenarios.',
  },
  {
    id: 'SIMPL-MM-029',
    category: 'Material Management - Purchasing',
    severity: 'medium',
    title: 'Purchase info record BAPI and table changes',
    description:
      'BAPI_INFORECORD_CREATE and BAPI_INFORECORD_CHANGE have modified parameter structures. EINA/EINE tables have new fields for supplier integration.',
    pattern: /\b(BAPI_INFORECORD_CREATE|BAPI_INFORECORD_CHANGE)\b/i,
    patternType: 'source',
    remediation:
      'Review info record BAPI parameters. Consider API_INFORECORD_PROCESS_SRV OData service for new integrations.',
  },
  {
    id: 'SIMPL-MM-030',
    category: 'Material Management - Purchasing',
    severity: 'low',
    title: 'Purchase requisition Fiori app migration',
    description:
      'ME51N/ME52N/ME53N still available but the strategic direction is the Manage Purchase Requisitions Fiori app. Custom enhancements to SRM shopping cart are deprecated.',
    pattern: /\b(ME51N|ME52N|ME53N|BAPI_PR_CREATE|BAPI_PR_CHANGE)\b/i,
    patternType: 'source',
    remediation:
      'Evaluate migration to Fiori My Purchase Requisitions / Manage Purchase Requisitions apps. Review BAPI_PR_* usage for parameter changes.',
  },

  // ── Inventory Management (extended) ──────────────────────────
  {
    id: 'SIMPL-MM-031',
    category: 'Material Management - Inventory',
    severity: 'high',
    title: 'Goods receipt with reference to PO (MIGO) changes',
    description:
      'MIGO and underlying MB_* function modules for goods receipt against purchase orders have modified posting logic due to mandatory Material Ledger and ACDOCA integration.',
    pattern: /\b(MIGO|MB_CREATE_GOODS_MOVEMENT|MB01)\b/i,
    patternType: 'source',
    remediation:
      'Review goods receipt logic. Validate that ML and FI postings via ACDOCA are handled correctly. Consider Post Goods Receipt Fiori app.',
  },
  {
    id: 'SIMPL-MM-032',
    category: 'Material Management - Inventory',
    severity: 'medium',
    title: 'Goods issue posting changes (MB1A)',
    description:
      'Goods issue posting logic (MB1A and movement types 2xx) changed with real-time ML valuation. Cost center and order account assignments post directly to ACDOCA.',
    pattern: /\b(MB1A|MB1B|MB1C)\b/i,
    patternType: 'source',
    remediation:
      'Review goods issue transaction usage and movement type configuration. Validate account determination with ACDOCA journal entries.',
  },
  {
    id: 'SIMPL-MM-033',
    category: 'Material Management - Inventory',
    severity: 'medium',
    title: 'Stock type simplification (quality, blocked, unrestricted)',
    description:
      'Stock type management simplified in S/4HANA. MARD (storage location data) restructured. Special stock indicators have new handling for consignment and project stock.',
    pattern: /\b(MARD|MARD-LABST|MARD-INSME|MARD-SPEME|MSKA|MSKU|MKOL)\b/i,
    patternType: 'source',
    remediation:
      'Review stock type queries. Use MARD or CDS view I_MaterialStockTimeSeries. Validate special stock indicator logic.',
  },
  {
    id: 'SIMPL-MM-034',
    category: 'Material Management - Inventory',
    severity: 'medium',
    title: 'Batch management determination and derivation',
    description:
      'Batch determination (VB01/VB02) and batch derivation have new features in S/4HANA. Transaction MIGO batch split behavior changed.',
    pattern: /\b(VB01|VB02|VB03|BATCH_DERIVATION|BAPI_BATCH_CREATE)\b/i,
    patternType: 'source',
    remediation:
      'Review batch determination strategies and condition tables. Validate batch derivation rules in S/4HANA environment.',
  },
  {
    id: 'SIMPL-MM-035',
    category: 'Material Management - Inventory',
    severity: 'low',
    title: 'Physical inventory count procedures (MI01/MI04/MI07)',
    description:
      'Physical inventory transactions MI01/MI04/MI07 retain core function but PI document handling integrates with new inventory management capabilities.',
    pattern: /\b(MI01|MI04|MI07|MI20|MI31|MI32|MI33)\b/i,
    patternType: 'source',
    remediation:
      'Review physical inventory procedures. Consider Physical Inventory Document Fiori app. Validate integration with EWM if warehouse-managed.',
  },

  // ── Invoice Verification (extended) ──────────────────────────
  {
    id: 'SIMPL-MM-036',
    category: 'Material Management - Invoice',
    severity: 'high',
    title: 'Evaluated Receipt Settlement (ERS) changes',
    description:
      'ERS processing (MRRL) has changed posting logic in S/4HANA. Automatic settlement now posts through the universal journal (ACDOCA) with ML integration.',
    pattern: /\b(MRRL|ERS|EVALUATED_RECEIPT)\b/i,
    patternType: 'source',
    remediation:
      'Review ERS configuration and auto-settlement programs. Validate vendor master ERS flags and purchasing info record settings for S/4HANA.',
  },
  {
    id: 'SIMPL-MM-037',
    category: 'Material Management - Invoice',
    severity: 'medium',
    title: 'Invoice parking (MIR7) and workflow changes',
    description:
      'Invoice parking (MIR7) and parked document handling have changed. Workflow integration for invoice approval uses new event linkage in S/4HANA.',
    pattern: /\b(MIR7|MIRA|MIR4)\b/i,
    patternType: 'source',
    remediation:
      'Review invoice parking and approval workflows. Consider migration to central invoice management or SAP Business Network for invoicing.',
  },
  {
    id: 'SIMPL-MM-038',
    category: 'Material Management - Invoice',
    severity: 'medium',
    title: 'MIRO transaction and invoice posting changes',
    description:
      'MIRO posting logic routes through ACDOCA. GR/IR clearing (WRX) and invoice-price-variance postings reflect mandatory ML valuation.',
    pattern: /\bMIRO\b/i,
    patternType: 'source',
    remediation:
      'Review MIRO customizing (tolerance groups, tax handling). Validate GR/IR clearing and price variance accounts under ML.',
  },
  {
    id: 'SIMPL-MM-039',
    category: 'Material Management - Invoice',
    severity: 'low',
    title: 'Subsequent debit/credit (MR01/MR02) changes',
    description:
      'Subsequent debit (MR01) and credit (MR02) transactions have changed posting behavior due to ACDOCA and ML integration.',
    pattern: /\b(MR01|MR02|MR03)\b/i,
    patternType: 'source',
    remediation:
      'Review subsequent debit/credit usage. Validate account determination for price differences under mandatory Material Ledger.',
  },

  // ── Valuation (extended) ─────────────────────────────────────
  {
    id: 'SIMPL-MM-040',
    category: 'Material Management - Valuation',
    severity: 'high',
    title: 'Actual costing / material ledger actual cost component split',
    description:
      'Actual costing (CKMLCP/CKM3N) is natively integrated in S/4HANA. The actual cost component split is available without separate activation.',
    pattern: /\b(CKMLCP|CKM3N|CKM3|CKML_SETTLEMENT)\b/i,
    patternType: 'source',
    remediation:
      'Review actual costing cockpit usage. Leverage actual cost component split for margin analysis. Migrate CKM3 to CKM3N.',
  },
  {
    id: 'SIMPL-MM-041',
    category: 'Material Management - Valuation',
    severity: 'medium',
    title: 'MBEW replaced by CKMLCR for ML reporting',
    description:
      'While MBEW still holds standard/moving average price, ML reporting tables CKMLCR and CKMLCT are the authoritative source for multi-currency valuation.',
    pattern: /\b(CKMLCR|CKMLCT|CKMLHD)\b/i,
    patternType: 'source',
    remediation:
      'Review reports reading valuation data. Supplement MBEW queries with CKMLCR/CKMLCT for actual cost and parallel currency views.',
  },
  {
    id: 'SIMPL-MM-042',
    category: 'Material Management - Valuation',
    severity: 'medium',
    title: 'Transfer pricing and profit center valuation in ML',
    description:
      'Material Ledger in S/4HANA supports transfer pricing and profit center valuation natively. Group valuation view (legal vs. group vs. profit center) is standard.',
    pattern: /\b(CKML_MGV|T_CKML_MGV|TRANSFER_PRICE|ML_PRICE_DET)\b/i,
    patternType: 'source',
    remediation:
      'Review transfer pricing configuration. Enable group valuation view if parallel valuation is required.',
  },

  // ── Source Determination (extended) ──────────────────────────
  {
    id: 'SIMPL-MM-043',
    category: 'Material Management - Sourcing',
    severity: 'medium',
    title: 'Source list maintenance changes (ME01/ME03)',
    description:
      'Source list (EORD table) maintenance via ME01 has new validity and MRP-relevance handling in S/4HANA.',
    pattern: /\b(ME01|ME03|EORD)\b/i,
    patternType: 'source',
    remediation:
      'Review source list entries. Validate MRP source determination flags (EORD-NOTKZ, EORD-FESKZ) for planning run compatibility.',
  },
  {
    id: 'SIMPL-MM-044',
    category: 'Material Management - Sourcing',
    severity: 'medium',
    title: 'Quota arrangement changes (MEQ1/MEQ3)',
    description:
      'Quota arrangements (EQUK/EQUP tables) have modified splitting logic. MRP Live reads quota differently than classic MRP.',
    pattern: /\b(MEQ1|MEQ3|EQUK|EQUP)\b/i,
    patternType: 'source',
    remediation:
      'Review quota arrangement setup. Validate that MRP Live honors quota split percentages. Test with MD04 stock/requirements list.',
  },
  {
    id: 'SIMPL-MM-045',
    category: 'Material Management - Sourcing',
    severity: 'medium',
    title: 'Approved vendor list / supplier qualification',
    description:
      'Approved vendor list functionality now integrates with Business Partner (BP) model. LFM1/LFM2 tables are redirected through CVI.',
    pattern: /\b(LFM1|LFM2|BAPI_VENDOR_FIND|APPROVED_VENDOR)\b/i,
    patternType: 'source',
    remediation:
      'Migrate vendor master to BP model via CVI. Review approved vendor list entries for BP compatibility. Use Manage Supplier Fiori app.',
  },

  // ── Material Requirements Planning (extended) ────────────────
  {
    id: 'SIMPL-MM-046',
    category: 'Material Management - MRP',
    severity: 'high',
    title: 'MRP area configuration changes',
    description:
      'MRP areas (T460A/T460B) are fully supported in MRP Live but configuration must be validated. Plant-level MRP areas are mandatory.',
    pattern: /\b(T460A|T460B|MDLV|MDLL)\b/i,
    patternType: 'source',
    remediation:
      'Review MRP area definitions. Ensure plant-level MRP area exists. Validate storage-location and subcontractor MRP areas for MRP Live.',
  },
  {
    id: 'SIMPL-MM-047',
    category: 'Material Management - MRP',
    severity: 'medium',
    title: 'MRP type and lot-sizing procedure changes',
    description:
      'MRP types (PD, VB, V1, V2, etc.) and lot-sizing keys interact differently with MRP Live. Planning file entry (MDFD) handling is optimized.',
    pattern: /\b(MDFD|MARC-DISMM|MARC-DISPO|T438M)\b/i,
    patternType: 'source',
    remediation:
      'Review MRP type assignments (MARC-DISMM). Validate lot-sizing procedures. Check planning file entry regeneration after migration.',
  },
  {
    id: 'SIMPL-MM-048',
    category: 'Material Management - MRP',
    severity: 'medium',
    title: 'Planning file entry reset and rebuild',
    description:
      'Planning file entry table (MDFD) may need complete rebuild after S/4HANA migration. MDRE transaction / program RMDATFRE must be executed.',
    pattern: /\b(MDRE|RMDATFRE|MDFD)\b/i,
    patternType: 'source',
    remediation:
      'Execute MDRE to rebuild planning file entries after migration. Schedule as part of post-migration cutover activities.',
  },

  // ── Vendor Evaluation ────────────────────────────────────────
  {
    id: 'SIMPL-MM-049',
    category: 'Material Management - Vendor Evaluation',
    severity: 'medium',
    title: 'Supplier evaluation with Business Partner model',
    description:
      'Vendor evaluation (ME61/ME62/ME63) now references the Business Partner model. LFA1/LFB1 vendor master tables are compatibility views over BP tables.',
    pattern: /\b(ME61|ME62|ME63|LFA1|LFB1)\b/i,
    patternType: 'source',
    remediation:
      'Migrate vendor master data to BP via CVI synchronization. Review vendor evaluation criteria (T160V) for BP-based supplier references.',
  },
  {
    id: 'SIMPL-MM-050',
    category: 'Material Management - Vendor Evaluation',
    severity: 'low',
    title: 'Vendor evaluation scoring and weighting changes',
    description:
      'Vendor evaluation scores (table ESSR) and automatic evaluation programs (ME6A/ME6B) retain function but reference BP-based supplier IDs.',
    pattern: /\b(ME6A|ME6B|ME6C|T160V|T160E)\b/i,
    patternType: 'source',
    remediation:
      'Validate automatic evaluation programs. Review scoring criteria configuration (T160V/T160E) for deprecated vendor-specific fields.',
  },

  // ── Consumption-Based Planning ───────────────────────────────
  {
    id: 'SIMPL-MM-051',
    category: 'Material Management - Consumption-Based Planning',
    severity: 'medium',
    title: 'Reorder point planning (MRP type VB) in MRP Live',
    description:
      'Reorder point planning (VB) runs in MRP Live but consumption data aggregation from MVER table has changed. Automatic reorder point calculation updated.',
    pattern: /\b(MVER|MARC-MINBE|MARC-MABST|REORDER_POINT)\b/i,
    patternType: 'source',
    remediation:
      'Review reorder point parameters (MARC-MINBE, MARC-MABST). Validate consumption history in MVER after migration. Run forecast to recalculate.',
  },
  {
    id: 'SIMPL-MM-052',
    category: 'Material Management - Consumption-Based Planning',
    severity: 'medium',
    title: 'Forecast-based planning (MRP type VV) changes',
    description:
      'Forecast-based planning (VV) uses consumption forecasts from MP38/MP39. Forecast models and parameters integrate with MRP Live differently.',
    pattern: /\b(MP38|MP39|MARC-PROGR|MARC-PRMOD|PBED)\b/i,
    patternType: 'source',
    remediation:
      'Review forecast profiles and model selection. Validate forecast results feed into MRP Live correctly. Check PBED (independent requirements) handling.',
  },
  {
    id: 'SIMPL-MM-053',
    category: 'Material Management - Consumption-Based Planning',
    severity: 'low',
    title: 'Time-phased planning (MRP type R1) adjustments',
    description:
      'Time-phased planning (R1) cycle and planning calendar interaction changed in MRP Live. Planning calendar (T4C1) resolution differs.',
    pattern: /\b(T4C1|MARC-BESSION|MARC-LFRHY)\b/i,
    patternType: 'source',
    remediation:
      'Review planning calendar assignments and cycle definitions. Validate that time-phased materials run correctly in MRP Live.',
  },

  // ── Classification ───────────────────────────────────────────
  {
    id: 'SIMPL-MM-054',
    category: 'Material Management - Classification',
    severity: 'medium',
    title: 'Material classification changes (CL01/CL02)',
    description:
      'Material classification (class type 001) and its integration with material master views has structural changes. INOB/KSSK/AUSP tables have new indexes.',
    pattern: /\b(CL01|CL02|CL03|INOB|KSSK|AUSP)\b/i,
    patternType: 'source',
    remediation:
      'Review classification hierarchies and characteristics. Validate class assignments after migration. Consider Product Classification Fiori apps.',
  },
  {
    id: 'SIMPL-MM-055',
    category: 'Material Management - Classification',
    severity: 'medium',
    title: 'Batch classification (class type 023) restructuring',
    description:
      'Batch classification (class type 023) used in batch determination has changed. Characteristics and class assignments must be revalidated for S/4HANA.',
    pattern: /\b(?:CLASS_TYPE|KLART).*023|023.*(?:CLASS_TYPE|KLART)/i,
    patternType: 'source',
    remediation:
      'Review batch classes and characteristics (class type 023). Validate batch determination condition tables reference correct class types.',
  },

  // ── Dangerous Goods ──────────────────────────────────────────
  {
    id: 'SIMPL-MM-056',
    category: 'Material Management - Dangerous Goods',
    severity: 'medium',
    title: 'Dangerous goods master data in material master',
    description:
      'DG indicator profiles and regulation data in the material master are restructured. Tables DGTMD/DGTM2 have S/4HANA-specific field changes.',
    pattern: /\b(DGTMD|DGTM2|DG_PROFILE|MARC-PROFL)\b/i,
    patternType: 'source',
    remediation:
      'Review DG profile assignments on material master. Validate DG check routines in delivery and shipment processing.',
  },
  {
    id: 'SIMPL-MM-057',
    category: 'Material Management - Dangerous Goods',
    severity: 'low',
    title: 'Dangerous goods regulation and classification updates',
    description:
      'DG regulation sets (ADR, IATA, IMDG, DOT) and UN number classification have updated master data tables in S/4HANA.',
    pattern: /\b(DGP_PROFILES|DG_REGULATION|UN_NUMBER)\b/i,
    patternType: 'source',
    remediation:
      'Review DG regulation configuration. Validate DG classification and labeling data. Test DG document printing after migration.',
  },

  // ── Service Procurement ──────────────────────────────────────
  {
    id: 'SIMPL-MM-058',
    category: 'Material Management - Service Procurement',
    severity: 'medium',
    title: 'Service entry sheet processing changes (ML81N)',
    description:
      'Service entry sheet (ML81N) and underlying ESSR/ESLH/ESLL tables have structural changes. Approval workflow integration updated for S/4HANA.',
    pattern: /\b(ML81N|ESSR|ESLH|ESLL)\b/i,
    patternType: 'source',
    remediation:
      'Review service entry sheet processing. Validate approval workflows. Consider Manage Service Entry Sheets Fiori app.',
  },
  {
    id: 'SIMPL-MM-059',
    category: 'Material Management - Service Procurement',
    severity: 'medium',
    title: 'Service master and limit items changes',
    description:
      'Service master (AC01/AC02/AC03) and limit items in service POs have changed. ASMD (service master) table has restructured fields.',
    pattern: /\b(AC01|AC02|AC03|ASMD|ASMDT|LIMIT_ITEM)\b/i,
    patternType: 'source',
    remediation:
      'Review service master records. Validate limit item handling in service purchase orders. Check unplanned service line items.',
  },
  {
    id: 'SIMPL-MM-060',
    category: 'Material Management - Service Procurement',
    severity: 'low',
    title: 'Service procurement integration with Fieldglass/SAP BN',
    description:
      'External workforce and service procurement increasingly routes through SAP Fieldglass or SAP Business Network rather than classic MM-SRV.',
    pattern: /\b(BAPI_ENTRYSHEET_CREATE|BAPI_ENTRYSHEET_APPROVE)\b/i,
    patternType: 'source',
    remediation:
      'Evaluate SAP Fieldglass / Business Network for external services. Review BAPI_ENTRYSHEET_* for S/4HANA parameter changes.',
  },

  // ── Subcontracting ───────────────────────────────────────────
  {
    id: 'SIMPL-MM-061',
    category: 'Material Management - Subcontracting',
    severity: 'high',
    title: 'Subcontractor stock management changes',
    description:
      'Subcontractor stock (special stock type O) and provision to subcontractor (movement type 541) have changed with ML-based valuation in S/4HANA.',
    pattern: /\b(MSSL|MSLB|SPEC_STOCK.*O|541)\b/i,
    patternType: 'source',
    remediation:
      'Review subcontractor stock tables (MSSL/MSLB). Validate provision and consumption movement types. Check BOM component provision logic.',
  },
  {
    id: 'SIMPL-MM-062',
    category: 'Material Management - Subcontracting',
    severity: 'medium',
    title: 'Subcontracting BOM component provision (SC BOM)',
    description:
      'BOM component provision for subcontracting POs (SC_BOM, ME2O) changed. Component determination and provision quantities validated against BOM explosion.',
    pattern: /\b(ME2O|ME20|SC_BOM|SUBCONTRACTING|SUBCONT)\b/i,
    patternType: 'source',
    remediation:
      'Review subcontracting order component lists. Validate BOM explosion for subcontracting. Check goods receipt (101 O) posting with ML.',
  },

  // ── Stock Transport Orders ───────────────────────────────────
  {
    id: 'SIMPL-MM-063',
    category: 'Material Management - Stock Transport Orders',
    severity: 'medium',
    title: 'Inter-company stock transport order changes',
    description:
      'Inter-company STOs (ME21N with doc type UB/NB, supplying plant scenario) have changed billing and intercompany pricing integration in S/4HANA.',
    pattern: /\b(STOCK_TRANSPORT|STO_ORDER|UB.*ME21N|ME21N.*UB)\b/i,
    patternType: 'source',
    remediation:
      'Review inter-company STO pricing conditions and billing configuration. Validate automatic PO creation from delivery in receiving plant.',
  },
  {
    id: 'SIMPL-MM-064',
    category: 'Material Management - Stock Transport Orders',
    severity: 'medium',
    title: 'Cross-plant stock transfer posting changes',
    description:
      'Cross-plant transfers (movement types 301/302, 303/304, 305/306) have ML-based valuation at both sending and receiving plant in S/4HANA.',
    pattern: /\b(BWART\s*=\s*'30[1-6]'|MVT_TYPE.*30[1-6]|301|302|303|304|305|306)\b/i,
    patternType: 'source',
    remediation:
      'Review stock transfer movement type configuration. Validate that ML valuates at both plants correctly. Check transit stock (stock in transfer) handling.',
  },

  // ── Warehouse Integration ────────────────────────────────────
  {
    id: 'SIMPL-MM-065',
    category: 'Material Management - Warehouse Integration',
    severity: 'high',
    title: 'MM-WM integration replaced by MM-EWM',
    description:
      'Classic Warehouse Management (WM/LE-WM) is not available in S/4HANA. All WM functionality must migrate to Embedded Extended Warehouse Management (EWM).',
    pattern: /\b(LQUA|LAGP|LEIN|LTAP|LTBP|LTAK|LTBK|LS01|LS02|LS03|LT01|LT02|LT03|LT0[4-9]|LT10|LT11|LT12)\b/i,
    patternType: 'source',
    remediation:
      'Plan migration from WM to embedded EWM. Map warehouse structures (LAGP to /SCWM/LAGP). Convert transfer orders to warehouse tasks. Review all LS/LT transactions.',
  },
  {
    id: 'SIMPL-MM-066',
    category: 'Material Management - Warehouse Integration',
    severity: 'high',
    title: 'WM transaction and function module removal',
    description:
      'WM function modules (L_TO_CREATE_*, L_TO_CONFIRM_*) and WM BAPIs are not available in S/4HANA. Embedded EWM uses /SCWM/ APIs.',
    pattern: /\b(L_TO_CREATE_SINGLE|L_TO_CREATE_MOVE_ORDER|L_TO_CONFIRM|BAPI_WHSE_TO_CREATE|BAPI_WHSE_TO_GET_DETAIL)\b/i,
    patternType: 'source',
    remediation:
      'Replace all WM function modules with /SCWM/ equivalents. Migrate transfer order logic to warehouse task and warehouse order APIs in EWM.',
  },
  {
    id: 'SIMPL-MM-067',
    category: 'Material Management - Warehouse Integration',
    severity: 'medium',
    title: 'Storage location to EWM mapping',
    description:
      'Storage location (MARD) to warehouse number mapping changes from WM (T320) to EWM (/SCWM/T_WHSE). Goods movement posting triggers EWM warehouse tasks instead of WM transfer orders.',
    pattern: /\b(T320|T301|T331|T300W)\b/i,
    patternType: 'source',
    remediation:
      'Reconfigure storage location to warehouse assignments for EWM. Map T320 entries to EWM warehouse structure. Review goods movement integration.',
  },
];
