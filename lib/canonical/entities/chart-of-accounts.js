/**
 * Canonical Chart of Accounts Entity
 *
 * OAGIS-aligned representation of a general ledger account master record.
 * Source tables: SAP SKA1/SKAT, Infor LN tfgld010, Infor M3 FCHACC
 */

const BaseCanonicalEntity = require('../base-entity');

class ChartOfAccounts extends BaseCanonicalEntity {
  constructor() {
    super('ChartOfAccounts');
  }

  getRequiredFields() {
    return ['accountNumber', 'description', 'accountType'];
  }

  getFieldDefinitions() {
    return {
      accountNumber:       { type: 'string',  required: true,  maxLength: 10,  description: 'GL account number' },
      description:         { type: 'string',  required: true,  maxLength: 50,  description: 'Account short text' },
      accountType:         { type: 'string',  required: true,  maxLength: 2,   description: 'Account type (BS = balance sheet, PL = profit & loss)' },
      accountGroup:        { type: 'string',  required: false, maxLength: 4,   description: 'Account group for classification' },
      balanceSheetIndicator: { type: 'string', required: false, maxLength: 1,  description: 'Balance sheet account indicator (X = yes)' },
      plStatementType:     { type: 'string',  required: false, maxLength: 2,   description: 'P&L statement account type' },
      currency:            { type: 'string',  required: false, maxLength: 5,   description: 'Account currency (ISO 4217)' },
      taxCategory:         { type: 'string',  required: false, maxLength: 2,   description: 'Tax category key' },
      reconciliationType:  { type: 'string',  required: false, maxLength: 1,   description: 'Reconciliation account type (D=customer, K=vendor)' },
    };
  }
}

module.exports = ChartOfAccounts;
