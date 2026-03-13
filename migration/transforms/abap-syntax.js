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
 * ABAP Syntax Modernization Transforms
 *
 * Covers SIMPL-ABAP-003 through 080 where deterministic transforms are feasible.
 * Each transform follows the standard signature:
 * { id, description, apply(source, finding) → { source, changes } }
 *
 * Transform types:
 * - replace: deterministic regex replacement (high confidence)
 * - comment: inserts TODO comment, preserves original code
 * - flag: records in changes array, no source modification
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
      let result = source;
      result = result.replace(pattern, (match, ws, stmt) => {
        changes.push({ type: 'comment', note: todoMessage });
        return `${ws}" TODO(S/4): ${todoMessage}\n${ws}${stmt}`;
      });
      return { source: result, changes };
    },
  };
}

const transforms = {};

// ── ABAP Language Rules (003–025) ──────────────────────────────────────────

// SIMPL-ABAP-003: Direct DB modification on standard tables
transforms['SIMPL-ABAP-003'] = createCommentTransform(
  'SIMPL-ABAP-003',
  'Flag direct DB modifications on standard tables',
  /(\s*)((?:INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM)\s+(?:BKPF|BSEG|EKKO|EKPO|VBAK|VBAP|LIKP|LIPS|MKPF|MSEG)\b)/gi,
  'Use BAPIs or APIs instead of direct DB modification on standard tables'
);

// SIMPL-ABAP-007: FIELD-SYMBOLS without typing
transforms['SIMPL-ABAP-007'] = createCommentTransform(
  'SIMPL-ABAP-007',
  'Flag FIELD-SYMBOLS without explicit typing',
  /(\s*)(FIELD-SYMBOLS\s*<\w+>\s*\.)/gi,
  'Add TYPE clause to FIELD-SYMBOLS declaration'
);

// SIMPL-ABAP-008: SELECT...ENDSELECT loop
transforms['SIMPL-ABAP-008'] = createCommentTransform(
  'SIMPL-ABAP-008',
  'Flag SELECT...ENDSELECT for bulk read conversion',
  /(\s*)(SELECT\b.*\bFROM\b)/gi,
  'Replace SELECT...ENDSELECT with SELECT INTO TABLE for bulk read'
);

// SIMPL-ABAP-009: Nested SELECT statements
transforms['SIMPL-ABAP-009'] = createCommentTransform(
  'SIMPL-ABAP-009',
  'Flag nested SELECT statements for JOIN optimization',
  /(\s*)(SELECT\s+.*FROM\s+\w+[\s\S]*?SELECT\s+.*FROM\s+\w+)/gi,
  'Replace nested SELECTs with JOIN, subquery, or FOR ALL ENTRIES IN'
);

// SIMPL-ABAP-010: CLIENT SPECIFIED
transforms['SIMPL-ABAP-010'] = createCommentTransform(
  'SIMPL-ABAP-010',
  'Flag CLIENT SPECIFIED for removal',
  /(\s*)(CLIENT\s+SPECIFIED)/gi,
  'Remove CLIENT SPECIFIED — use proper client handling in S/4HANA'
);

// SIMPL-ABAP-012: COMPUTE keyword obsolete
transforms['SIMPL-ABAP-012'] = {
  id: 'SIMPL-ABAP-012',
  description: 'Remove obsolete COMPUTE keyword',
  apply(source) {
    const changes = [];
    let result = source;
    result = result.replace(
      /\bCOMPUTE\s+(\w+\s*=)/gi,
      (match, assignment) => {
        changes.push({ type: 'replace', from: 'COMPUTE', to: '(removed)' });
        return assignment;
      }
    );
    return { source: result, changes };
  },
};

// SIMPL-ABAP-013: FORM/PERFORM obsolete
transforms['SIMPL-ABAP-013'] = createCommentTransform(
  'SIMPL-ABAP-013',
  'Flag FORM/PERFORM for method migration',
  /(\s*)(PERFORM\s+\w+\b)/gi,
  'Refactor FORM/PERFORM subroutines into class methods'
);

// SIMPL-ABAP-016: DESCRIBE TABLE LINES → lines()
transforms['SIMPL-ABAP-016'] = {
  id: 'SIMPL-ABAP-016',
  description: 'Replace DESCRIBE TABLE LINES with lines() function',
  apply(source) {
    const changes = [];
    let result = source;
    result = result.replace(
      /DESCRIBE\s+TABLE\s+(\w+)\s+LINES\s+(\w+)/gi,
      (match, itab, linesVar) => {
        const replacement = `${linesVar} = lines( ${itab} )`;
        changes.push({ type: 'replace', from: match, to: replacement });
        return replacement;
      }
    );
    return { source: result, changes };
  },
};

// SIMPL-ABAP-018: CONDENSE NO-GAPS → condense()
transforms['SIMPL-ABAP-018'] = {
  id: 'SIMPL-ABAP-018',
  description: 'Replace CONDENSE NO-GAPS with condense() function',
  apply(source) {
    const changes = [];
    let result = source;
    result = result.replace(
      /CONDENSE\s+(\w+)\s+NO-GAPS/gi,
      (match, varName) => {
        const replacement = `${varName} = condense( val = ${varName} del = \` \` )`;
        changes.push({ type: 'replace', from: match, to: replacement });
        return replacement;
      }
    );
    return { source: result, changes };
  },
};

// SIMPL-ABAP-019: CONCATENATE → string template/&&
transforms['SIMPL-ABAP-019'] = createCommentTransform(
  'SIMPL-ABAP-019',
  'Flag CONCATENATE for string template conversion',
  /(\s*)(CONCATENATE\s+\w+)/gi,
  'Replace CONCATENATE with string templates |{ var1 }{ var2 }| or && operator'
);

// SIMPL-ABAP-022: SE11 views → CDS views
transforms['SIMPL-ABAP-022'] = createCommentTransform(
  'SIMPL-ABAP-022',
  'Flag SE11 dictionary views for CDS migration',
  /(\s*)(SELECT\s+.*\bFROM\s+(?:V_\w+|ZV_\w+|YV_\w+)\b)/gi,
  'Replace SE11 dictionary views with ABAP CDS views for HANA optimization'
);

// SIMPL-ABAP-023: WRITE statement
transforms['SIMPL-ABAP-023'] = createCommentTransform(
  'SIMPL-ABAP-023',
  'Flag WRITE statements for UI migration',
  /(\s*)(WRITE\s*[:/]\s+)/gi,
  'Replace WRITE-based lists with CL_SALV_TABLE, ALV Grid, or Fiori UI'
);

// SIMPL-ABAP-024: REFRESH → CLEAR
transforms['SIMPL-ABAP-024'] = {
  id: 'SIMPL-ABAP-024',
  description: 'Replace REFRESH with CLEAR',
  apply(source) {
    const changes = [];
    let result = source;
    result = result.replace(
      /\bREFRESH\s+(\w+)/gi,
      (match, itab) => {
        const replacement = `CLEAR ${itab}`;
        changes.push({ type: 'replace', from: match, to: replacement });
        return replacement;
      }
    );
    return { source: result, changes };
  },
};

// SIMPL-ABAP-025: FREE statement review
transforms['SIMPL-ABAP-025'] = createCommentTransform(
  'SIMPL-ABAP-025',
  'Flag FREE for review — CLEAR may suffice',
  /(\s*)(FREE\s+\w+)/gi,
  'Review FREE usage — use CLEAR unless explicit memory release is needed'
);

// ── Database Access (026–033) ──────────────────────────────────────────────

// SIMPL-ABAP-026: EXEC SQL
transforms['SIMPL-ABAP-026'] = createCommentTransform(
  'SIMPL-ABAP-026',
  'Flag EXEC SQL for Open SQL/CDS migration',
  /(\s*)(EXEC\s+SQL\b)/gi,
  'Replace EXEC SQL with Open SQL, ABAP CDS views, or ADBC (CL_SQL_STATEMENT)'
);

// SIMPL-ABAP-027: FOR ALL ENTRIES without empty check
transforms['SIMPL-ABAP-027'] = createCommentTransform(
  'SIMPL-ABAP-027',
  'Flag FOR ALL ENTRIES without empty check',
  /(\s*)(FOR\s+ALL\s+ENTRIES\s+IN\b)/gi,
  'Always check IF itab IS NOT INITIAL before FOR ALL ENTRIES IN itab'
);

// SIMPL-ABAP-028: BYPASSING BUFFER
transforms['SIMPL-ABAP-028'] = createCommentTransform(
  'SIMPL-ABAP-028',
  'Flag BYPASSING BUFFER for removal review',
  /(\s*)(BYPASSING\s+BUFFER\b)/gi,
  'Remove BYPASSING BUFFER unless absolutely required — HANA handles buffering differently'
);

// SIMPL-ABAP-029: ORDER BY PRIMARY KEY
transforms['SIMPL-ABAP-029'] = createCommentTransform(
  'SIMPL-ABAP-029',
  'Flag ORDER BY PRIMARY KEY for explicit field list',
  /(\s*)(ORDER\s+BY\s+PRIMARY\s+KEY\b)/gi,
  'Replace ORDER BY PRIMARY KEY with explicit field list for HANA optimization'
);

// SIMPL-ABAP-030: Cluster/pool table access
transforms['SIMPL-ABAP-030'] = createCommentTransform(
  'SIMPL-ABAP-030',
  'Flag cluster/pool table access patterns',
  /(\s*)(SELECT\s+.*\bFROM\s+(?:BSEG|KONV|CDPOS|RFBLG|BSET|CDCLS)\b)/gi,
  'Review access to former cluster/pool tables — indexes and access patterns may differ on HANA'
);

// SIMPL-ABAP-031: ADBC usage
transforms['SIMPL-ABAP-031'] = createCommentTransform(
  'SIMPL-ABAP-031',
  'Flag ADBC usage for S/4HANA review',
  /(\s*)(CL_SQL_CONNECTION\b)/gi,
  'Ensure ADBC usage follows S/4HANA best practices — prefer CDS views when possible'
);

// SIMPL-ABAP-032: Missing UP TO n ROWS
transforms['SIMPL-ABAP-032'] = createCommentTransform(
  'SIMPL-ABAP-032',
  'Flag missing UP TO n ROWS on large tables',
  /(\s*)(SELECT\s+.*\bFROM\s+(?:ACDOCA|MATDOC|BKPF|MSEG|VBFA)\b)/gi,
  'Add UP TO n ROWS or WHERE clauses to limit data on large S/4HANA tables'
);

// SIMPL-ABAP-033: INTO CORRESPONDING FIELDS performance
transforms['SIMPL-ABAP-033'] = createCommentTransform(
  'SIMPL-ABAP-033',
  'Flag INTO CORRESPONDING FIELDS for performance review',
  /(\s*)(INTO\s+CORRESPONDING\s+FIELDS\s+OF\s+TABLE\b)/gi,
  'Consider explicit field mapping or matching structure for better performance'
);

// ── ALV/UI Changes (034–039) ───────────────────────────────────────────────

// SIMPL-ABAP-034: Classic ALV deprecated
transforms['SIMPL-ABAP-034'] = createCommentTransform(
  'SIMPL-ABAP-034',
  'Flag classic ALV for CL_SALV_TABLE migration',
  /(\s*)(REUSE_ALV_(?:GRID|LIST)_DISPLAY\b)/gi,
  'Migrate to CL_SALV_TABLE or CL_GUI_ALV_GRID for ALV output'
);

// SIMPL-ABAP-035: CL_GUI_ALV_GRID
transforms['SIMPL-ABAP-035'] = createCommentTransform(
  'SIMPL-ABAP-035',
  'Flag CL_GUI_ALV_GRID for Fiori evaluation',
  /(\s*)(CL_GUI_ALV_GRID\b)/gi,
  'Evaluate migration to CL_SALV_TABLE with IDA or Fiori Elements list report'
);

// SIMPL-ABAP-036: CALL SCREEN
transforms['SIMPL-ABAP-036'] = createCommentTransform(
  'SIMPL-ABAP-036',
  'Flag CALL SCREEN for Fiori migration',
  /(\s*)(CALL\s+SCREEN\s+\d+)/gi,
  'Plan migration to SAP Fiori / SAPUI5 apps — use Fiori Elements where possible'
);

// SIMPL-ABAP-037: SELECTION-SCREEN
transforms['SIMPL-ABAP-037'] = createCommentTransform(
  'SIMPL-ABAP-037',
  'Flag complex SELECTION-SCREEN for Fiori',
  /(\s*)(SELECTION-SCREEN\s+BEGIN\s+OF\s+BLOCK\b)/gi,
  'Simplify selection screens — consider Fiori app with filter bar'
);

// SIMPL-ABAP-038: Web Dynpro ABAP
transforms['SIMPL-ABAP-038'] = createCommentTransform(
  'SIMPL-ABAP-038',
  'Flag Web Dynpro for UI5 migration',
  /(\s*)(CL_WD_\w+|IF_WD_\w+)/gi,
  'Migrate Web Dynpro ABAP apps to SAPUI5/Fiori — use Fiori Elements for standard patterns'
);

// SIMPL-ABAP-039: ALV IDA (informational — good practice)
transforms['SIMPL-ABAP-039'] = {
  id: 'SIMPL-ABAP-039',
  description: 'Flag ALV IDA for CDS view data source check',
  apply(source) {
    const changes = [];
    let result = source;
    result = result.replace(
      /(\s*)(CL_SALV_GUI_TABLE_IDA\b)/gi,
      (match, ws, stmt) => {
        changes.push({ type: 'flag', note: 'ALV IDA detected — ensure CDS view is used as data source' });
        return match; // No modification, just flag
      }
    );
    return { source: result, changes };
  },
};

// ── Enhancement Framework (040–045) ────────────────────────────────────────

// SIMPL-ABAP-040: Customer exits (CMOD/SMOD)
transforms['SIMPL-ABAP-040'] = createCommentTransform(
  'SIMPL-ABAP-040',
  'Flag customer exits for BAdI migration',
  /(\s*)(CALL\s+CUSTOMER-FUNCTION\s+'\d+')/gi,
  'Migrate customer exits to new BAdI implementations (Enhancement Spot/BAdI)'
);

// SIMPL-ABAP-041: Classic BAdI
transforms['SIMPL-ABAP-041'] = createCommentTransform(
  'SIMPL-ABAP-041',
  'Flag classic BAdI for verification',
  /(\s*)((?:GET|CALL)\s+BADI\b)/gi,
  'Verify BAdI still exists in S/4HANA — migrate to new BAdI framework if needed'
);

// SIMPL-ABAP-042: User exit USEREXIT_
transforms['SIMPL-ABAP-042'] = createCommentTransform(
  'SIMPL-ABAP-042',
  'Flag USEREXIT_ for BAdI migration',
  /(\s*)(USEREXIT_\w+)/gi,
  'Check if user exit is still active — migrate logic to corresponding BAdI'
);

// SIMPL-ABAP-043: Business Transaction Events
transforms['SIMPL-ABAP-043'] = createCommentTransform(
  'SIMPL-ABAP-043',
  'Flag BTEs for ACDOCA compatibility review',
  /(\s*)(FIBF\b|OPEN_FI_PERFORM_\w+)/gi,
  'Review BTEs for compatibility with new general ledger and ACDOCA architecture'
);

// SIMPL-ABAP-044: Enhancement points
transforms['SIMPL-ABAP-044'] = createCommentTransform(
  'SIMPL-ABAP-044',
  'Flag enhancement points for verification',
  /(\s*)(ENHANCEMENT-POINT\b|ENHANCEMENT\s+\d+)/gi,
  'Verify enhancement points still exist in target S/4HANA release'
);

// SIMPL-ABAP-045: Modification assistant
transforms['SIMPL-ABAP-045'] = createCommentTransform(
  'SIMPL-ABAP-045',
  'Flag modification adjustments for BAdI conversion',
  /(\s*)(MODIFICATION\s+ADJUSTMENT\b|SPAU\b|SPDD\b)/gi,
  'Reduce modifications — convert to BAdI or Enhancement implementations'
);

// ── Workflow (046–049) ─────────────────────────────────────────────────────

// SIMPL-ABAP-046: Classic workflow
transforms['SIMPL-ABAP-046'] = createCommentTransform(
  'SIMPL-ABAP-046',
  'Flag classic workflow for S/4HANA review',
  /(\s*)((?:SWO1|SWDD|SWW_WI)\b|SWE_EVENT_CREATE)/gi,
  'Review workflow definitions — ensure business object events still trigger correctly'
);

// SIMPL-ABAP-047: Flexible Workflow
transforms['SIMPL-ABAP-047'] = {
  id: 'SIMPL-ABAP-047',
  description: 'Flag Flexible Workflow for evaluation',
  apply(source) {
    const changes = [];
    let result = source;
    result = result.replace(
      /(\s*)(SWFLEX_|FLEXIBLE_WORKFLOW\b)/gi,
      (match, ws, stmt) => {
        changes.push({ type: 'flag', note: 'Evaluate SAP Flexible Workflow for standard approval scenarios' });
        return match;
      }
    );
    return { source: result, changes };
  },
};

// SIMPL-ABAP-048: Workflow business object types
transforms['SIMPL-ABAP-048'] = createCommentTransform(
  'SIMPL-ABAP-048',
  'Flag workflow BO types for S/4HANA verification',
  /(\s*)(BUS20[0-9]{2}\b)/gi,
  'Verify business object types and their methods/events in S/4HANA SWO1'
);

// SIMPL-ABAP-049: Workflow inbox
transforms['SIMPL-ABAP-049'] = createCommentTransform(
  'SIMPL-ABAP-049',
  'Flag workflow inbox for Fiori integration',
  /(\s*)(SBWP\b|SAP_WAPI_\w+)/gi,
  'Ensure custom workflow tasks are visible in Fiori My Inbox app'
);

// ── Batch Processing (050–053) ─────────────────────────────────────────────

// SIMPL-ABAP-050: Classic batch jobs
transforms['SIMPL-ABAP-050'] = createCommentTransform(
  'SIMPL-ABAP-050',
  'Flag classic batch jobs for Application Jobs evaluation',
  /(\s*)(JOB_OPEN\b|JOB_CLOSE\b|JOB_SUBMIT\b)/gi,
  'Evaluate migration to S/4HANA Application Jobs framework'
);

// SIMPL-ABAP-051: Application Jobs framework (informational)
transforms['SIMPL-ABAP-051'] = {
  id: 'SIMPL-ABAP-051',
  description: 'Flag Application Jobs framework usage',
  apply(source) {
    const changes = [];
    let result = source;
    result = result.replace(
      /(\s*)(CL_APJ_\w+)/gi,
      (match, ws, stmt) => {
        changes.push({ type: 'flag', note: 'Application Jobs framework detected — ensure job catalog entry is registered' });
        return match;
      }
    );
    return { source: result, changes };
  },
};

// SIMPL-ABAP-052: tRFC/qRFC → bgRFC
transforms['SIMPL-ABAP-052'] = createCommentTransform(
  'SIMPL-ABAP-052',
  'Flag tRFC/qRFC for bgRFC migration',
  /(\s*)(CALL\s+FUNCTION\s+.*IN\s+BACKGROUND\s+TASK\b)/gi,
  'Migrate from tRFC/qRFC to bgRFC for asynchronous processing'
);

// SIMPL-ABAP-053: SUBMIT VIA JOB
transforms['SIMPL-ABAP-053'] = createCommentTransform(
  'SIMPL-ABAP-053',
  'Flag SUBMIT VIA JOB for Application Jobs review',
  /(\s*)(SUBMIT\s+\w+\s+.*VIA\s+JOB\b)/gi,
  'Review SUBMIT VIA JOB — consider Application Jobs for Fiori-integrated scheduling'
);

// ── RFC/Communication (054–059) ────────────────────────────────────────────

// SIMPL-ABAP-054: RFC DESTINATION
transforms['SIMPL-ABAP-054'] = createCommentTransform(
  'SIMPL-ABAP-054',
  'Flag RFC DESTINATION usage for review',
  /(\s*)(CALL\s+FUNCTION\s+.*\bDESTINATION\b)/gi,
  'Review RFC destinations — consider web services, OData, or ABAP channels instead'
);

// SIMPL-ABAP-055: Legacy HTTP client
transforms['SIMPL-ABAP-055'] = createCommentTransform(
  'SIMPL-ABAP-055',
  'Flag CL_HTTP_CLIENT for modernization',
  /(\s*)(CL_HTTP_CLIENT\b)/gi,
  'Use CL_WEB_HTTP_CLIENT_MANAGER for HTTP communication in ABAP Cloud'
);

// SIMPL-ABAP-056: ABAP Messaging Channels (informational)
transforms['SIMPL-ABAP-056'] = {
  id: 'SIMPL-ABAP-056',
  description: 'Flag ABAP Messaging Channels usage',
  apply(source) {
    const changes = [];
    result = source;
    const pattern = /(\s*)(AMC_\w+|CL_AMC_\w+)/gi;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      changes.push({ type: 'flag', note: 'ABAP Messaging Channels detected — ensure compatibility' });
    }
    return { source, changes };
  },
};

// SIMPL-ABAP-057: ABAP Push Channels (informational)
transforms['SIMPL-ABAP-057'] = {
  id: 'SIMPL-ABAP-057',
  description: 'Flag ABAP Push Channels usage',
  apply(source) {
    const changes = [];
    const pattern = /(\s*)(APC_\w+|CL_APC_\w+)/gi;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      changes.push({ type: 'flag', note: 'ABAP Push Channels detected — ensure S/4HANA landscape compatibility' });
    }
    return { source, changes };
  },
};

// SIMPL-ABAP-058: SOTR texts
transforms['SIMPL-ABAP-058'] = createCommentTransform(
  'SIMPL-ABAP-058',
  'Flag SOTR for Fiori text handling review',
  /(\s*)(SOTR_\w+)/gi,
  'Review SOTR text handling for Fiori app internationalization requirements'
);

// SIMPL-ABAP-059: ABAP Cloud restricted APIs
transforms['SIMPL-ABAP-059'] = {
  id: 'SIMPL-ABAP-059',
  description: 'Flag ABAP Cloud API usage for compatibility check',
  apply(source) {
    const changes = [];
    const pattern = /(IF_RAP_\w+|CL_RAP_\w+)/gi;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      changes.push({ type: 'flag', note: 'Ensure only released APIs are used in ABAP Cloud' });
    }
    return { source, changes };
  },
};

// ── Security (060–064) ─────────────────────────────────────────────────────

// SIMPL-ABAP-060: AUTHORITY-CHECK review
transforms['SIMPL-ABAP-060'] = createCommentTransform(
  'SIMPL-ABAP-060',
  'Flag AUTHORITY-CHECK for S/4HANA auth object review',
  /(\s*)(AUTHORITY-CHECK\s+OBJECT\b)/gi,
  'Review authorization objects — new S/4HANA apps may require new auth objects'
);

// SIMPL-ABAP-061: SUIM role analysis
transforms['SIMPL-ABAP-061'] = createCommentTransform(
  'SIMPL-ABAP-061',
  'Flag SUIM role analysis requirement',
  /(\s*)(SUIM\b|AGR_1251|AGR_DEFINE)/gi,
  'Run SUIM analysis — map existing roles to S/4HANA Fiori catalog/group requirements'
);

// SIMPL-ABAP-062: SAP_ALL check
transforms['SIMPL-ABAP-062'] = createCommentTransform(
  'SIMPL-ABAP-062',
  'Flag SAP_ALL for proper role assignment',
  /(\s*)(SAP_ALL\b|SAP_NEW\b)/gi,
  'Replace SAP_ALL with specific role assignments — use SAP_NEW only during upgrade'
);

// SIMPL-ABAP-063: CDS access control (informational)
transforms['SIMPL-ABAP-063'] = {
  id: 'SIMPL-ABAP-063',
  description: 'Flag CDS access control for DCL implementation',
  apply(source) {
    const changes = [];
    const pattern = /(@AccessControl\b|DEFINE\s+ROLE\b)/gi;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      changes.push({ type: 'flag', note: 'Implement DCL access control annotations on custom CDS views' });
    }
    return { source, changes };
  },
};

// SIMPL-ABAP-064: ICF service security
transforms['SIMPL-ABAP-064'] = createCommentTransform(
  'SIMPL-ABAP-064',
  'Flag ICF services for security review',
  /(\s*)(SICF\b|ICF_\w+)/gi,
  'Review ICF services — deactivate unused nodes, secure active OData/HTTP endpoints'
);

// ── Testing (065–070) ──────────────────────────────────────────────────────

// SIMPL-ABAP-065: ABAP Unit test (informational)
transforms['SIMPL-ABAP-065'] = {
  id: 'SIMPL-ABAP-065',
  description: 'Flag ABAP Unit test presence',
  apply(source) {
    const changes = [];
    const pattern = /(FOR\s+TESTING\b|CL_ABAP_UNIT_ASSERT\b)/gi;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      changes.push({ type: 'flag', note: 'ABAP Unit tests found — ensure coverage for all custom classes/FMs' });
    }
    return { source, changes };
  },
};

// SIMPL-ABAP-066: ATC checks (informational)
transforms['SIMPL-ABAP-066'] = {
  id: 'SIMPL-ABAP-066',
  description: 'Flag ATC usage for priority review',
  apply(source) {
    const changes = [];
    const pattern = /(ATC_\w+|CL_CI_\w+)/gi;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      changes.push({ type: 'flag', note: 'Run ATC checks on all custom code — fix priority 1 and 2 findings' });
    }
    return { source, changes };
  },
};

// SIMPL-ABAP-067: Code Inspector (informational)
transforms['SIMPL-ABAP-067'] = {
  id: 'SIMPL-ABAP-067',
  description: 'Flag Code Inspector for S/4HANA readiness',
  apply(source) {
    const changes = [];
    const pattern = /(SCI_\w+|CODE_INSPECTOR\b)/gi;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      changes.push({ type: 'flag', note: 'Run Code Inspector with S/4HANA readiness check variant' });
    }
    return { source, changes };
  },
};

// SIMPL-ABAP-068: Test double framework (informational)
transforms['SIMPL-ABAP-068'] = {
  id: 'SIMPL-ABAP-068',
  description: 'Flag test double framework usage',
  apply(source) {
    const changes = [];
    if (/CL_ABAP_TESTDOUBLE\b/i.test(source)) {
      changes.push({ type: 'flag', note: 'Test double framework detected — good practice for unit testing' });
    }
    return { source, changes };
  },
};

// SIMPL-ABAP-069: CDS test environment (informational)
transforms['SIMPL-ABAP-069'] = {
  id: 'SIMPL-ABAP-069',
  description: 'Flag CDS test environment usage',
  apply(source) {
    const changes = [];
    if (/CL_CDS_TEST_ENVIRONMENT\b/i.test(source)) {
      changes.push({ type: 'flag', note: 'CDS test environment detected — good practice for CDS view testing' });
    }
    return { source, changes };
  },
};

// SIMPL-ABAP-070: ABAP Unit risk level (informational)
transforms['SIMPL-ABAP-070'] = {
  id: 'SIMPL-ABAP-070',
  description: 'Flag ABAP Unit risk level declarations',
  apply(source) {
    const changes = [];
    if (/RISK\s+LEVEL\s+(?:HARMLESS|DANGEROUS|CRITICAL)\b/i.test(source)) {
      changes.push({ type: 'flag', note: 'Set appropriate RISK LEVEL and DURATION on all test classes' });
    }
    return { source, changes };
  },
};

// ── Performance / HANA Optimization (071–080) ──────────────────────────────

// SIMPL-ABAP-071: Code pushdown opportunity
transforms['SIMPL-ABAP-071'] = createCommentTransform(
  'SIMPL-ABAP-071',
  'Flag LOOP aggregation for HANA code pushdown',
  /(\s*)(LOOP\s+AT\b)/gi,
  'Push aggregation logic to CDS views or AMDP procedures for HANA optimization'
);

// SIMPL-ABAP-072: AMDP (informational)
transforms['SIMPL-ABAP-072'] = {
  id: 'SIMPL-ABAP-072',
  description: 'Flag AMDP usage',
  apply(source) {
    const changes = [];
    if (/BY\s+DATABASE\s+PROCEDURE\b|AMDP\b/i.test(source)) {
      changes.push({ type: 'flag', note: 'Use AMDP for complex calculations benefiting from HANA in-memory' });
    }
    return { source, changes };
  },
};

// SIMPL-ABAP-073: SORT after SELECT
transforms['SIMPL-ABAP-073'] = createCommentTransform(
  'SIMPL-ABAP-073',
  'Flag SORT after SELECT for ORDER BY optimization',
  /(\s*)(SORT\s+\w+\b)/gi,
  'Use ORDER BY in SELECT statement instead of SORT on internal table'
);

// SIMPL-ABAP-074: DELETE ADJACENT DUPLICATES
transforms['SIMPL-ABAP-074'] = createCommentTransform(
  'SIMPL-ABAP-074',
  'Flag DELETE ADJACENT DUPLICATES for SELECT DISTINCT',
  /(\s*)(DELETE\s+ADJACENT\s+DUPLICATES\b)/gi,
  'Use SELECT DISTINCT or GROUP BY in SQL to eliminate duplicates at DB level'
);

// SIMPL-ABAP-075: LOOP AT WHERE (informational)
transforms['SIMPL-ABAP-075'] = createCommentTransform(
  'SIMPL-ABAP-075',
  'Flag LOOP AT WHERE for DB-level filtering',
  /(\s*)(LOOP\s+AT\s+\w+\s+(?:INTO|ASSIGNING)\s+.*\bWHERE\b)/gi,
  'Move filtering to SELECT WHERE clause to leverage HANA query optimization'
);

// SIMPL-ABAP-076: CDS views (informational — good practice)
transforms['SIMPL-ABAP-076'] = {
  id: 'SIMPL-ABAP-076',
  description: 'Flag CDS view definitions for best practices',
  apply(source) {
    const changes = [];
    if (/DEFINE\s+VIEW\b.*AS\s+SELECT\b/i.test(source)) {
      changes.push({ type: 'flag', note: 'Leverage CDS views — use associations instead of JOINs where possible' });
    }
    return { source, changes };
  },
};

// SIMPL-ABAP-077: Secondary indexes on HANA
transforms['SIMPL-ABAP-077'] = createCommentTransform(
  'SIMPL-ABAP-077',
  'Flag secondary indexes for HANA review',
  /(\s*)(CREATE\s+INDEX\b)/gi,
  'Review secondary indexes — HANA columnar storage may not need traditional indexes'
);

// SIMPL-ABAP-078: SPTA framework (informational)
transforms['SIMPL-ABAP-078'] = {
  id: 'SIMPL-ABAP-078',
  description: 'Flag SPTA parallel processing for HANA review',
  apply(source) {
    const changes = [];
    if (/SPTA_PARA_PROCESS_M\b/i.test(source)) {
      changes.push({ type: 'flag', note: 'Review parallel processing setup for HANA work package sizing' });
    }
    return { source, changes };
  },
};

// SIMPL-ABAP-079: SQL hints (informational)
transforms['SIMPL-ABAP-079'] = {
  id: 'SIMPL-ABAP-079',
  description: 'Flag ABAP SQL hints usage',
  apply(source) {
    const changes = [];
    if (/%_HINTS\b|DB_HINT\b/i.test(source)) {
      changes.push({ type: 'flag', note: 'Use ABAP SQL hints sparingly — prefer CDS annotations and HANA auto-optimization' });
    }
    return { source, changes };
  },
};

// SIMPL-ABAP-080: COLLECT statement
transforms['SIMPL-ABAP-080'] = createCommentTransform(
  'SIMPL-ABAP-080',
  'Flag COLLECT for CDS aggregation',
  /(\s*)(COLLECT\s+\w+\s+INTO\b)/gi,
  'Replace COLLECT with CDS view aggregation or GROUP BY in ABAP SQL'
);

module.exports = transforms;
