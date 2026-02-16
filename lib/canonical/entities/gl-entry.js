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
 * Canonical General Ledger Entry Entity
 *
 * OAGIS-aligned representation of an accounting document with line items.
 * Source tables: SAP BKPF/BSEG, Infor LN tfgld100/106, Infor M3 FSLEDG
 */

const BaseCanonicalEntity = require('../base-entity');

class GlEntry extends BaseCanonicalEntity {
  constructor() {
    super('GlEntry');
  }

  getRequiredFields() {
    return ['documentNumber', 'companyCode', 'fiscalYear', 'postingDate', 'currency'];
  }

  getFieldDefinitions() {
    return {
      documentNumber:  { type: 'string',  required: true,  maxLength: 10,  description: 'Accounting document number' },
      companyCode:     { type: 'string',  required: true,  maxLength: 4,   description: 'Company code' },
      fiscalYear:      { type: 'string',  required: true,  maxLength: 4,   description: 'Fiscal year' },
      postingDate:     { type: 'date',    required: true,                   description: 'Posting date in GL' },
      documentDate:    { type: 'date',    required: false,                  description: 'Document date' },
      documentType:    { type: 'string',  required: false, maxLength: 2,   description: 'Document type (SA, AB, KR, DR)' },
      currency:        { type: 'string',  required: true,  maxLength: 5,   description: 'Document currency (ISO 4217)' },
      referenceNumber: { type: 'string',  required: false, maxLength: 16,  description: 'Reference document number' },
      headerText:      { type: 'string',  required: false, maxLength: 25,  description: 'Document header text' },
      items:           { type: 'array',   required: false,                  description: 'Line items of the document' },
    };
  }
}

module.exports = GlEntry;
