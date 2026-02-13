/**
 * Code Transform Functions for S/4HANA Custom Code Remediation
 *
 * Each transform is keyed by rule ID and accepts (source, finding) -> { source, changes[] }.
 * Pattern-based regex transforms that work without AI.
 */

const TRANSFORMS = {
  // ── Finance: BSEG -> ACDOCA ──────────────────────────────────────
  'SIMPL-FIN-001': {
    id: 'SIMPL-FIN-001',
    description: 'Replace BSEG access with ACDOCA / CDS views',
    apply(source, finding) {
      const changes = [];
      let result = source;

      // Replace SELECT * FROM bseg with ACDOCA CDS view
      result = result.replace(
        /SELECT\s+\*\s+FROM\s+bseg\b/gi,
        (match) => {
          changes.push({ type: 'replace', from: match, to: 'SELECT * FROM acdoca' });
          return 'SELECT * FROM acdoca';
        }
      );

      // Replace TYPE TABLE OF bseg
      result = result.replace(
        /TYPE\s+TABLE\s+OF\s+bseg\b/gi,
        (match) => {
          changes.push({ type: 'replace', from: match, to: 'TYPE TABLE OF acdoca' });
          return 'TYPE TABLE OF acdoca';
        }
      );

      // Replace TYPE bseg
      result = result.replace(
        /TYPE\s+bseg\b(?!\s+OCCURS)/gi,
        (match) => {
          changes.push({ type: 'replace', from: match, to: 'TYPE acdoca' });
          return 'TYPE acdoca';
        }
      );

      // Replace TABLES: bseg declarations
      result = result.replace(
        /\bTABLES:\s*(.*?)bseg\b/gi,
        (match, prefix) => {
          const replacement = `TABLES: ${prefix}acdoca`;
          changes.push({ type: 'replace', from: match, to: replacement });
          return replacement;
        }
      );

      return { source: result, changes };
    },
  },

  // ── Finance: BSID/BSIK/BSAD/BSAK -> ACDOCA ────────────────────
  'SIMPL-FIN-002': {
    id: 'SIMPL-FIN-002',
    description: 'Replace customer/vendor line item tables with ACDOCA',
    apply(source, finding) {
      const changes = [];
      let result = source;
      const mapping = {
        bsid: { table: 'acdoca', comment: '\" S/4: was BSID (customer open items)' },
        bsik: { table: 'acdoca', comment: '\" S/4: was BSIK (vendor open items)' },
        bsad: { table: 'acdoca', comment: '\" S/4: was BSAD (customer cleared items)' },
        bsak: { table: 'acdoca', comment: '\" S/4: was BSAK (vendor cleared items)' },
      };

      for (const [old, { table }] of Object.entries(mapping)) {
        const pattern = new RegExp(`\\bSELECT\\s+(.*?)\\s+FROM\\s+${old}\\b`, 'gi');
        result = result.replace(pattern, (match, fields) => {
          const replacement = `SELECT ${fields} FROM ${table}`;
          changes.push({ type: 'replace', from: match, to: replacement });
          return replacement;
        });

        const typePattern = new RegExp(`TYPE\\s+TABLE\\s+OF\\s+${old}\\b`, 'gi');
        result = result.replace(typePattern, (match) => {
          const replacement = `TYPE TABLE OF ${table}`;
          changes.push({ type: 'replace', from: match, to: replacement });
          return replacement;
        });
      }

      return { source: result, changes };
    },
  },

  // ── Finance: BSIS/BSAS -> ACDOCA ────────────────────────────────
  'SIMPL-FIN-003': {
    id: 'SIMPL-FIN-003',
    description: 'Replace GL line item tables with ACDOCA',
    apply(source, finding) {
      const changes = [];
      let result = source;

      for (const old of ['bsis', 'bsas']) {
        const pattern = new RegExp(`\\b${old}\\b`, 'gi');
        result = result.replace(pattern, (match) => {
          changes.push({ type: 'replace', from: match, to: 'acdoca' });
          return 'acdoca';
        });
      }

      return { source: result, changes };
    },
  },

  // ── Finance: CSKA/CSKB -> SKA1 ──────────────────────────────────
  'SIMPL-FIN-004': {
    id: 'SIMPL-FIN-004',
    description: 'Replace cost element tables with GL account master',
    apply(source, finding) {
      const changes = [];
      let result = source;

      result = result.replace(/\bCSKA\b/gi, (match) => {
        changes.push({ type: 'replace', from: match, to: 'SKA1' });
        return 'SKA1';
      });
      result = result.replace(/\bCSKB\b/gi, (match) => {
        changes.push({ type: 'replace', from: match, to: 'SKB1' });
        return 'SKB1';
      });

      return { source: result, changes };
    },
  },

  // ── Business Partner: KNA1 -> BUT000 ─────────────────────────────
  'SIMPL-BP-001': {
    id: 'SIMPL-BP-001',
    description: 'Replace customer master tables with Business Partner',
    apply(source, finding) {
      const changes = [];
      let result = source;
      const mapping = { kna1: 'but000', knb1: 'but020', knvv: 'but050' };

      for (const [old, replacement] of Object.entries(mapping)) {
        const pattern = new RegExp(`\\b${old}\\b`, 'gi');
        result = result.replace(pattern, (match) => {
          changes.push({ type: 'replace', from: match, to: replacement });
          return replacement;
        });
      }

      return { source: result, changes };
    },
  },

  // ── Business Partner: LFA1 -> BUT000 ─────────────────────────────
  'SIMPL-BP-002': {
    id: 'SIMPL-BP-002',
    description: 'Replace vendor master tables with Business Partner',
    apply(source, finding) {
      const changes = [];
      let result = source;
      const mapping = { lfa1: 'but000', lfb1: 'but020', lfbk: 'but100' };

      for (const [old, replacement] of Object.entries(mapping)) {
        const pattern = new RegExp(`\\b${old}\\b`, 'gi');
        result = result.replace(pattern, (match) => {
          changes.push({ type: 'replace', from: match, to: replacement });
          return replacement;
        });
      }

      return { source: result, changes };
    },
  },

  // ── Business Partner BAPIs -> OData ───────────────────────────────
  'SIMPL-BP-003': {
    id: 'SIMPL-BP-003',
    description: 'Flag deprecated customer/vendor BAPIs for manual review',
    apply(source, finding) {
      const changes = [];
      let result = source;

      // Add comment before BAPI calls — these need manual review
      result = result.replace(
        /(\s*)(CALL FUNCTION\s+'(BAPI_CUSTOMER_|BAPI_VENDOR_)\w+')/gi,
        (match, ws, call) => {
          const comment = `${ws}\" TODO(S/4): Replace with API_BUSINESS_PARTNER OData service\n`;
          changes.push({ type: 'comment', before: call, note: 'Needs manual migration to OData' });
          return `${comment}${ws}${call}`;
        }
      );

      return { source: result, changes };
    },
  },

  // ── ABAP: OCCURS -> TABLE OF ──────────────────────────────────────
  'SIMPL-ABAP-001': {
    id: 'SIMPL-ABAP-001',
    description: 'Replace OCCURS with TYPE TABLE OF',
    apply(source, finding) {
      const changes = [];
      let result = source;

      result = result.replace(
        /(\w+)\s+OCCURS\s+\d+/gi,
        (match, typeName) => {
          const replacement = `TABLE OF ${typeName}`;
          changes.push({ type: 'replace', from: match, to: replacement });
          return replacement;
        }
      );

      return { source: result, changes };
    },
  },

  // ── ABAP: BDC / CALL TRANSACTION -> BAPI ──────────────────────────
  'SIMPL-ABAP-002': {
    id: 'SIMPL-ABAP-002',
    description: 'Flag BDC CALL TRANSACTION for manual BAPI replacement',
    apply(source, finding) {
      const changes = [];
      let result = source;

      result = result.replace(
        /(\s*)(CALL TRANSACTION\s+'(\w+)'\s+USING\s+\w+\s+MODE\s+'[A-Z]')/gi,
        (match, ws, call, tcode) => {
          const comment = `${ws}\" TODO(S/4): Replace CALL TRANSACTION '${tcode}' with BAPI/API\n`;
          changes.push({ type: 'comment', tcode, note: 'BDC needs BAPI replacement' });
          return `${comment}${ws}${call}`;
        }
      );

      return { source: result, changes };
    },
  },

  // ── Removed: NAST -> BRF+ ────────────────────────────────────────
  'SIMPL-FUNC-002': {
    id: 'SIMPL-FUNC-002',
    description: 'Flag NAST-based output management for BRF+ migration',
    apply(source, finding) {
      const changes = [];
      let result = source;

      for (const table of ['nast', 'tnapr', 'nach']) {
        const pattern = new RegExp(`\\b${table}\\b`, 'gi');
        result = result.replace(pattern, (match) => {
          changes.push({ type: 'flag', table: match, note: 'Migrate to BRF+ output management' });
          return match; // Don't auto-replace, just flag
        });
      }

      return { source: result, changes };
    },
  },

  // ── Removed: WM -> EWM (LAGP/LQUA) ───────────────────────────────
  'SIMPL-FUNC-003': {
    id: 'SIMPL-FUNC-003',
    description: 'Flag WM tables for EWM migration',
    apply(source, finding) {
      const changes = [];
      let result = source;

      for (const table of ['lagp', 'lqua', 'ltap', 'ltbp']) {
        const pattern = new RegExp(`\\b${table}\\b`, 'gi');
        result = result.replace(pattern, (match) => {
          changes.push({ type: 'flag', table: match, note: 'Migrate to EWM tables/APIs' });
          return match;
        });
      }

      // Flag L_TO_CREATE function modules
      result = result.replace(
        /(\s*)(CALL FUNCTION\s+'L_TO_CREATE\w*')/gi,
        (match, ws, call) => {
          const comment = `${ws}\" TODO(S/4): Replace WM function module with EWM API\n`;
          changes.push({ type: 'comment', note: 'WM FM needs EWM replacement' });
          return `${comment}${ws}${call}`;
        }
      );

      return { source: result, changes };
    },
  },

  // ── Removed: Credit Management (UKMBP_CMS -> FSCM) ───────────────
  'SIMPL-FUNC-001': {
    id: 'SIMPL-FUNC-001',
    description: 'Flag classic credit management for FSCM migration',
    apply(source, finding) {
      const changes = [];
      let result = source;

      result = result.replace(/\bUKMBP_CMS\b/gi, (match) => {
        changes.push({ type: 'flag', table: match, note: 'Migrate to FSCM credit management' });
        return match;
      });

      return { source: result, changes };
    },
  },

  // ── Material: MATNR length ────────────────────────────────────────
  'SIMPL-MM-001': {
    id: 'SIMPL-MM-001',
    description: 'Replace hardcoded MATNR length 18 with TYPE matnr',
    apply(source, finding) {
      const changes = [];
      let result = source;

      result = result.replace(
        /TYPE\s+C\s+LENGTH\s+18/gi,
        (match) => {
          changes.push({ type: 'replace', from: match, to: 'TYPE matnr' });
          return 'TYPE matnr';
        }
      );

      return { source: result, changes };
    },
  },
};

/**
 * Get transform for a given rule ID
 * @param {string} ruleId
 * @returns {object|null} Transform object with .apply(source, finding)
 */
function getTransform(ruleId) {
  return TRANSFORMS[ruleId] || null;
}

/**
 * Get all available transforms
 * @returns {object}
 */
function getAllTransforms() {
  return TRANSFORMS;
}

/**
 * Check if a rule has an auto-transform
 * @param {string} ruleId
 * @returns {boolean}
 */
function hasTransform(ruleId) {
  return ruleId in TRANSFORMS;
}

module.exports = { getTransform, getAllTransforms, hasTransform };
