/**
 * Source-to-Target Data Transformer
 *
 * Maps ECC field names to S/4HANA API field names.
 * Handles Business Partner conversion (customer/vendor -> BP).
 */
class Transformer {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
  }

  _log(msg) {
    if (this.verbose) {
      console.log(`  [transformer] ${msg}`);
    }
  }

  /**
   * Transform extracted data for S/4HANA target
   * @param {object} extractionResult - Output from Extractor.extract()
   * @returns {object} { transformations[], stats }
   */
  transform(extractionResult) {
    this._log('Starting data transformation...');

    const transformations = [];
    let totalInput = 0;
    let totalOutput = 0;
    let totalMerged = 0;

    for (const extraction of extractionResult.extractions) {
      const result = this._transformModule(extraction);
      transformations.push(result);
      totalInput += result.inputRecords;
      totalOutput += result.outputRecords;
      totalMerged += result.mergedRecords;
    }

    return {
      transformations,
      stats: {
        totalInputRecords: totalInput,
        totalOutputRecords: totalOutput,
        totalMergedRecords: totalMerged,
        transformationRate: totalInput > 0
          ? Math.round((totalOutput / totalInput) * 100)
          : 0,
      },
    };
  }

  _transformModule(extraction) {
    const module = extraction.module;
    this._log(`Transforming module: ${module}`);

    const mappings = MODULE_MAPPINGS[module];
    if (!mappings) {
      return {
        module,
        status: 'skipped',
        reason: 'No mapping defined',
        inputRecords: extraction.totalRecords,
        outputRecords: 0,
        mergedRecords: 0,
        tableMappings: [],
      };
    }

    const tableMappings = [];
    let inputRecords = 0;
    let outputRecords = 0;
    let mergedRecords = 0;

    for (const table of extraction.tables) {
      const mapping = mappings[table.table];
      if (mapping) {
        const output = Math.round(table.records * (mapping.ratio || 1));
        const merged = mapping.mergeInto ? Math.round(table.records * 0.02) : 0;

        tableMappings.push({
          sourceTable: table.table,
          targetTable: mapping.target,
          targetAPI: mapping.api || null,
          fieldMappings: mapping.fields.length,
          inputRecords: table.records,
          outputRecords: output,
          mergedRecords: merged,
          notes: mapping.notes || '',
        });
        inputRecords += table.records;
        outputRecords += output;
        mergedRecords += merged;
      }
    }

    return {
      module,
      status: 'completed',
      inputRecords,
      outputRecords,
      mergedRecords,
      tableMappings,
    };
  }
}

/**
 * Field mapping definitions: ECC table -> S/4HANA target
 */
const MODULE_MAPPINGS = {
  FI: {
    BKPF: {
      target: 'ACDOCA',
      api: 'API_JOURNALENTRYITEMBASIC_SRV',
      ratio: 1.0,
      fields: ['BUKRS->RCOMP', 'BELNR->BELNR', 'GJAHR->RYEAR', 'BLART->BLART', 'BUDAT->BUDAT', 'BLDAT->BLDAT', 'MONAT->POPER'],
      notes: 'Header fields merge into Universal Journal',
    },
    BSEG: {
      target: 'ACDOCA',
      api: 'API_JOURNALENTRYITEMBASIC_SRV',
      ratio: 1.0,
      fields: ['BUKRS->RCOMP', 'BELNR->BELNR', 'BUZEI->DOCLN', 'KOART->KOART', 'KONTO->RACCT', 'WRBTR->TSL', 'DMBTR->HSL', 'SHKZG->DRCRK'],
      notes: 'Line items become ACDOCA entries',
    },
    KNA1: {
      target: 'BUT000',
      api: 'API_BUSINESS_PARTNER',
      ratio: 1.0,
      mergeInto: true,
      fields: ['KUNNR->PARTNER', 'NAME1->NAME_ORG1', 'LAND1->COUNTRY', 'ORT01->CITY1', 'PSTLZ->POST_CODE1', 'STRAS->STREET'],
      notes: 'Customer master -> Business Partner (merge duplicates)',
    },
    LFA1: {
      target: 'BUT000',
      api: 'API_BUSINESS_PARTNER',
      ratio: 1.0,
      mergeInto: true,
      fields: ['LIFNR->PARTNER', 'NAME1->NAME_ORG1', 'LAND1->COUNTRY', 'ORT01->CITY1', 'PSTLZ->POST_CODE1', 'STRAS->STREET'],
      notes: 'Vendor master -> Business Partner (merge duplicates)',
    },
    SKA1: {
      target: 'SKA1',
      api: 'API_GLACCOUNTINCHARTOFACCOUNTS_SRV',
      ratio: 1.0,
      fields: ['KTOPL->KTOPL', 'SAKNR->SAKNR', 'BILKT->BILKT', 'GVTYP->GVTYP', 'KTOKS->KTOKS'],
      notes: 'GL accounts carry over (cost elements merge into GL)',
    },
  },
  MM: {
    EKKO: {
      target: 'EKKO',
      api: 'API_PURCHASEORDER_PROCESS_SRV',
      ratio: 1.0,
      fields: ['EBELN->EBELN', 'BUKRS->BUKRS', 'BSTYP->BSTYP', 'LIFNR->LIFNR', 'EKORG->EKORG', 'EKGRP->EKGRP'],
      notes: 'PO structure largely unchanged',
    },
    EKPO: {
      target: 'EKPO',
      api: 'API_PURCHASEORDER_PROCESS_SRV',
      ratio: 1.0,
      fields: ['EBELN->EBELN', 'EBELP->EBELP', 'MATNR->MATNR', 'MENGE->MENGE', 'MEINS->MEINS', 'NETPR->NETPR'],
      notes: 'MATNR field length extended to 40 chars',
    },
    MARA: {
      target: 'MARA',
      api: 'API_PRODUCT_SRV',
      ratio: 1.0,
      fields: ['MATNR->MATNR', 'MAKTX->MAKTX', 'MTART->MTART', 'MATKL->MATKL', 'MEINS->MEINS', 'BISMT->BISMT'],
      notes: 'Material master -> Product Master',
    },
    MARC: {
      target: 'MARC',
      api: 'API_PRODUCT_SRV',
      ratio: 1.0,
      fields: ['MATNR->MATNR', 'WERKS->WERKS', 'EKGRP->EKGRP', 'DISMM->DISMM', 'DISPO->DISPO'],
      notes: 'Plant-level data carries over',
    },
  },
  SD: {
    VBAK: {
      target: 'VBAK',
      api: 'API_SALES_ORDER_SRV',
      ratio: 1.0,
      fields: ['VBELN->VBELN', 'AUART->AUART', 'VKORG->VKORG', 'VTWEG->VTWEG', 'KUNNR->KUNNR', 'NETWR->NETWR'],
      notes: 'Sales order structure largely unchanged',
    },
    VBAP: {
      target: 'VBAP',
      api: 'API_SALES_ORDER_SRV',
      ratio: 1.0,
      fields: ['VBELN->VBELN', 'POSNR->POSNR', 'MATNR->MATNR', 'KWMENG->KWMENG', 'NETWR->NETWR'],
      notes: 'MATNR field length extended',
    },
    LIKP: {
      target: 'LIKP',
      api: 'API_OUTBOUND_DELIVERY_SRV',
      ratio: 1.0,
      fields: ['VBELN->VBELN', 'VSTEL->VSTEL', 'KUNNR->KUNNR', 'WADAT->WADAT', 'LDDAT->LDDAT'],
      notes: 'Delivery structure largely unchanged',
    },
    LIPS: {
      target: 'LIPS',
      api: 'API_OUTBOUND_DELIVERY_SRV',
      ratio: 1.0,
      fields: ['VBELN->VBELN', 'POSNR->POSNR', 'MATNR->MATNR', 'LFIMG->LFIMG', 'MEINS->MEINS'],
      notes: 'Delivery items carry over',
    },
  },
  HR: {
    PA0001: {
      target: 'PA0001',
      api: 'API_HRIS_WORKFORCE',
      ratio: 1.0,
      fields: ['PERNR->PERNR', 'BEGDA->BEGDA', 'ENDDA->ENDDA', 'BUKRS->BUKRS', 'WERKS->WERKS', 'PLANS->PLANS'],
      notes: 'HR infotype records carry over to HCM or SuccessFactors',
    },
    PA0002: {
      target: 'PA0002',
      api: 'API_HRIS_WORKFORCE',
      ratio: 1.0,
      fields: ['PERNR->PERNR', 'BEGDA->BEGDA', 'ENDDA->ENDDA', 'NACHN->NACHN', 'VORNA->VORNA', 'GBDAT->GBDAT'],
      notes: 'Personal data infotype',
    },
    PA0008: {
      target: 'PA0008',
      api: 'API_HRIS_COMPENSATION',
      ratio: 1.0,
      fields: ['PERNR->PERNR', 'BEGDA->BEGDA', 'ENDDA->ENDDA', 'TRFAR->TRFAR', 'TRFGB->TRFGB', 'TRFST->TRFST'],
      notes: 'Basic pay infotype',
    },
  },
};

module.exports = Transformer;
