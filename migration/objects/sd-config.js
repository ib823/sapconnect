/**
 * Sales & Distribution Configuration Migration Object
 *
 * Migrates SD customizing from ECC to S/4HANA:
 * sales organizations (TVKO), distribution channels (TVTW),
 * divisions (TSPA), sales document types (TVAK),
 * delivery types (TVLK), billing types (TVFK),
 * pricing procedures (T683S), and output types.
 *
 * ~25 field mappings.
 */

const BaseMigrationObject = require('./base-migration-object');

class SDConfigMigrationObject extends BaseMigrationObject {
  get objectId() { return 'SD_CONFIG'; }
  get name() { return 'SD Configuration'; }

  getFieldMappings() {
    return [
      // ── Config item identification ─────────────────────────────
      { source: 'CONFIG_TYPE', target: 'ConfigCategory' },
      { source: 'CONFIG_KEY', target: 'ConfigKey' },
      { source: 'CONFIG_DESC', target: 'ConfigDescription' },

      // ── Sales organization (TVKO) ──────────────────────────────
      { source: 'VKORG', target: 'SalesOrganization' },
      { source: 'VKORG_DESC', target: 'SalesOrgDescription' },
      { source: 'BUKRS', target: 'CompanyCode' },

      // ── Distribution channel (TVTW) ────────────────────────────
      { source: 'VTWEG', target: 'DistributionChannel' },
      { source: 'VTWEG_DESC', target: 'DistChannelDescription' },

      // ── Division (TSPA) ────────────────────────────────────────
      { source: 'SPART', target: 'Division' },
      { source: 'SPART_DESC', target: 'DivisionDescription' },

      // ── Sales document type (TVAK) ─────────────────────────────
      { source: 'AUART', target: 'SalesDocumentType' },
      { source: 'AUART_DESC', target: 'SalesDocTypeDescription' },
      { source: 'NUMKI', target: 'InternalNumberRange' },
      { source: 'NUMKE', target: 'ExternalNumberRange' },

      // ── Delivery type (TVLK) ───────────────────────────────────
      { source: 'LFART', target: 'DeliveryType' },
      { source: 'LFART_DESC', target: 'DeliveryTypeDescription' },

      // ── Billing type (TVFK) ────────────────────────────────────
      { source: 'FKART', target: 'BillingType' },
      { source: 'FKART_DESC', target: 'BillingTypeDescription' },

      // ── Pricing procedure (T683S) ──────────────────────────────
      { source: 'KALSM', target: 'PricingProcedure' },
      { source: 'KALSM_DESC', target: 'PricingProcDescription' },
      { source: 'KSCHL', target: 'ConditionType' },
      { source: 'KSCHL_DESC', target: 'ConditionTypeDescription' },

      // ── Output type ────────────────────────────────────────────
      { source: 'NAESSION_PR', target: 'OutputType' },
      { source: 'NAESSION_PR_DESC', target: 'OutputTypeDescription' },

      // ── Metadata ───────────────────────────────────────────────
      { target: 'SourceSystem', default: 'ECC' },
      { target: 'MigrationObjectId', default: 'SD_CONFIG' },
    ];
  }

  getQualityChecks() {
    return {
      required: ['ConfigCategory', 'ConfigKey', 'ConfigDescription'],
      exactDuplicate: { keys: ['ConfigCategory', 'ConfigKey'] },
    };
  }

  _extractMock() {
    const records = [];

    // Sales organizations (TVKO)
    const salesOrgs = [
      { code: '1000', desc: 'US Sales', cc: '1000' },
      { code: '2000', desc: 'EU Sales', cc: '2000' },
      { code: '3000', desc: 'APAC Sales', cc: '3000' },
    ];
    for (const so of salesOrgs) {
      records.push(this._configRecord('SALES_ORG', so.code, so.desc, {
        VKORG: so.code, VKORG_DESC: so.desc, BUKRS: so.cc,
      }));
    }

    // Distribution channels (TVTW)
    const distChannels = [
      { code: '10', desc: 'Direct Sales' },
      { code: '20', desc: 'Wholesale' },
      { code: '30', desc: 'Retail' },
      { code: '40', desc: 'E-Commerce' },
    ];
    for (const dc of distChannels) {
      records.push(this._configRecord('DIST_CHANNEL', dc.code, dc.desc, {
        VTWEG: dc.code, VTWEG_DESC: dc.desc,
      }));
    }

    // Divisions (TSPA)
    const divisions = [
      { code: '00', desc: 'Cross-Division' },
      { code: '01', desc: 'Industrial Products' },
      { code: '02', desc: 'Consumer Products' },
      { code: '03', desc: 'Services' },
    ];
    for (const dv of divisions) {
      records.push(this._configRecord('DIVISION', dv.code, dv.desc, {
        SPART: dv.code, SPART_DESC: dv.desc,
      }));
    }

    // Sales document types (TVAK)
    const salesDocTypes = [
      { code: 'OR', desc: 'Standard Order', intNR: '01', extNR: '02' },
      { code: 'RE', desc: 'Returns', intNR: '03', extNR: '' },
      { code: 'SO', desc: 'Rush Order', intNR: '01', extNR: '' },
      { code: 'CR', desc: 'Credit Memo Request', intNR: '05', extNR: '' },
      { code: 'DR', desc: 'Debit Memo Request', intNR: '05', extNR: '' },
      { code: 'QT', desc: 'Quotation', intNR: '10', extNR: '' },
      { code: 'IN', desc: 'Inquiry', intNR: '10', extNR: '' },
      { code: 'KE', desc: 'Consignment Fill-Up', intNR: '01', extNR: '' },
    ];
    for (const sdt of salesDocTypes) {
      records.push(this._configRecord('SALES_DOC_TYPE', sdt.code, sdt.desc, {
        AUART: sdt.code, AUART_DESC: sdt.desc, NUMKI: sdt.intNR, NUMKE: sdt.extNR,
      }));
    }

    // Delivery types (TVLK)
    const deliveryTypes = [
      { code: 'LF', desc: 'Outbound Delivery' },
      { code: 'NL', desc: 'Replenishment Delivery' },
      { code: 'EL', desc: 'Inbound Delivery' },
      { code: 'LR', desc: 'Return Delivery' },
    ];
    for (const dt of deliveryTypes) {
      records.push(this._configRecord('DELIVERY_TYPE', dt.code, dt.desc, {
        LFART: dt.code, LFART_DESC: dt.desc,
      }));
    }

    // Billing types (TVFK)
    const billingTypes = [
      { code: 'F2', desc: 'Invoice' },
      { code: 'G2', desc: 'Credit Memo' },
      { code: 'L2', desc: 'Debit Memo' },
      { code: 'S1', desc: 'Cancellation' },
      { code: 'F8', desc: 'Pro-forma Invoice' },
    ];
    for (const bt of billingTypes) {
      records.push(this._configRecord('BILLING_TYPE', bt.code, bt.desc, {
        FKART: bt.code, FKART_DESC: bt.desc,
      }));
    }

    // Pricing procedures (T683S)
    const pricingProcs = [
      { proc: 'RVAA01', desc: 'Standard Pricing' },
      { proc: 'RVAA02', desc: 'Export Pricing' },
    ];
    for (const pp of pricingProcs) {
      records.push(this._configRecord('PRICING_PROCEDURE', pp.proc, pp.desc, {
        KALSM: pp.proc, KALSM_DESC: pp.desc,
      }));
    }

    // Condition types
    const condTypes = [
      { code: 'PR00', desc: 'Base Price' },
      { code: 'K004', desc: 'Material Discount' },
      { code: 'K005', desc: 'Customer Discount' },
      { code: 'K007', desc: 'Customer/Material Discount' },
      { code: 'KF00', desc: 'Freight' },
      { code: 'MWST', desc: 'Tax (Output)' },
    ];
    for (const ct of condTypes) {
      records.push(this._configRecord('CONDITION_TYPE', ct.code, ct.desc, {
        KSCHL: ct.code, KSCHL_DESC: ct.desc,
      }));
    }

    return records; // 3 + 4 + 4 + 8 + 4 + 5 + 2 + 6 = 36 records
  }

  _configRecord(type, key, desc, extra) {
    return {
      CONFIG_TYPE: type,
      CONFIG_KEY: key,
      CONFIG_DESC: desc,
      VKORG: '', VKORG_DESC: '', BUKRS: '',
      VTWEG: '', VTWEG_DESC: '',
      SPART: '', SPART_DESC: '',
      AUART: '', AUART_DESC: '', NUMKI: '', NUMKE: '',
      LFART: '', LFART_DESC: '',
      FKART: '', FKART_DESC: '',
      KALSM: '', KALSM_DESC: '', KSCHL: '', KSCHL_DESC: '',
      NAESSION_PR: '', NAESSION_PR_DESC: '',
      ...extra,
    };
  }
}

module.exports = SDConfigMigrationObject;
