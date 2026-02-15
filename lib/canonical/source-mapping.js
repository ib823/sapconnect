/**
 * Source-System-to-Canonical Field Mapping Definitions
 *
 * Maps fields from ERP source systems (SAP, Infor LN, Infor M3, Infor CSI,
 * Infor Lawson) into the OAGIS-aligned canonical data model.
 *
 * Each mapping entry is: { source, target, convert? }
 *   - source: field name in the source system record
 *   - target: field name in the canonical entity
 *   - convert: optional transformation function (sourceValue, fullRecord) => canonicalValue
 */

const { CanonicalMappingError } = require('../errors');

// ── SAP Mappings ──────────────────────────────────────────────────────

const SAP = {
  // MARA/MAKT → Item
  Item: [
    { source: 'MATNR', target: 'itemId' },
    { source: 'MAKTX', target: 'description' },
    { source: 'MEINS', target: 'baseUom' },
    { source: 'MTART', target: 'itemType' },
    { source: 'MATKL', target: 'itemGroup' },
    { source: 'BRGEW', target: 'grossWeight', convert: (v) => parseFloat(v) || 0 },
    { source: 'NTGEW', target: 'netWeight', convert: (v) => parseFloat(v) || 0 },
    { source: 'GEWEI', target: 'weightUnit' },
    { source: 'VOLUM', target: 'volume', convert: (v) => parseFloat(v) || 0 },
    { source: 'VOLEH', target: 'volumeUnit' },
    { source: 'WRKST', target: 'materialGroup' },
    { source: 'EKGRP', target: 'purchaseGroup' },
    { source: 'DISMM', target: 'mrpType' },
    { source: 'DISLS', target: 'lotSize' },
    { source: 'EISBE', target: 'safetyStock', convert: (v) => parseFloat(v) || 0 },
  ],

  // KNA1/KNVV → Customer
  Customer: [
    { source: 'KUNNR', target: 'customerId' },
    { source: 'NAME1', target: 'name' },
    { source: 'NAME2', target: 'name2' },
    { source: 'SORTL', target: 'searchTerm' },
    { source: 'STRAS', target: 'street' },
    { source: 'ORT01', target: 'city' },
    { source: 'PSTLZ', target: 'postalCode' },
    { source: 'LAND1', target: 'country' },
    { source: 'REGIO', target: 'region' },
    { source: 'TELF1', target: 'phone' },
    { source: 'SMTP_ADDR', target: 'email' },
    { source: 'STCEG', target: 'taxNumber' },
    { source: 'ZTERM', target: 'paymentTerms' },
    { source: 'WAERS', target: 'currency' },
    { source: 'KTOKD', target: 'accountGroup' },
    { source: 'VKORG', target: 'salesOrg' },
    { source: 'VTWEG', target: 'distributionChannel' },
  ],

  // LFA1/LFM1 → Vendor
  Vendor: [
    { source: 'LIFNR', target: 'vendorId' },
    { source: 'NAME1', target: 'name' },
    { source: 'NAME2', target: 'name2' },
    { source: 'SORTL', target: 'searchTerm' },
    { source: 'STRAS', target: 'street' },
    { source: 'ORT01', target: 'city' },
    { source: 'PSTLZ', target: 'postalCode' },
    { source: 'LAND1', target: 'country' },
    { source: 'REGIO', target: 'region' },
    { source: 'TELF1', target: 'phone' },
    { source: 'SMTP_ADDR', target: 'email' },
    { source: 'STCEG', target: 'taxNumber' },
    { source: 'ZTERM', target: 'paymentTerms' },
    { source: 'WAERS', target: 'currency' },
    { source: 'KTOKK', target: 'accountGroup' },
    { source: 'EKORG', target: 'purchaseOrg' },
  ],

  // SKA1/SKAT → ChartOfAccounts
  ChartOfAccounts: [
    { source: 'SAKNR', target: 'accountNumber' },
    { source: 'TXT50', target: 'description' },
    { source: 'GVTYP', target: 'accountType', convert: (v) => (v === 'X' ? 'BS' : 'PL') },
    { source: 'KTOKS', target: 'accountGroup' },
    { source: 'XBILK', target: 'balanceSheetIndicator' },
    { source: 'ERTYP', target: 'plStatementType' },
    { source: 'WAERS', target: 'currency' },
    { source: 'MWSKZ', target: 'taxCategory' },
    { source: 'MITKZ', target: 'reconciliationType' },
  ],

  // VBAK/VBAP → SalesOrder
  SalesOrder: [
    { source: 'VBELN', target: 'orderNumber' },
    { source: 'AUART', target: 'orderType' },
    { source: 'KUNNR', target: 'customerNumber' },
    { source: 'BSTNK', target: 'purchaseOrderNumber' },
    { source: 'AUDAT', target: 'orderDate' },
    { source: 'VDATU', target: 'requestedDeliveryDate' },
    { source: 'WAERK', target: 'currency' },
    { source: 'VKORG', target: 'salesOrg' },
    { source: 'VTWEG', target: 'distributionChannel' },
    { source: 'SPART', target: 'division' },
  ],

  // EKKO/EKPO → PurchaseOrder
  PurchaseOrder: [
    { source: 'EBELN', target: 'orderNumber' },
    { source: 'BSART', target: 'orderType' },
    { source: 'LIFNR', target: 'vendorNumber' },
    { source: 'BEDAT', target: 'orderDate' },
    { source: 'WAERS', target: 'currency' },
    { source: 'EKORG', target: 'purchaseOrg' },
    { source: 'EKGRP', target: 'purchaseGroup' },
    { source: 'BUKRS', target: 'companyCode' },
  ],

  // AUFK/AFKO → ProductionOrder
  ProductionOrder: [
    { source: 'AUFNR', target: 'orderNumber' },
    { source: 'AUART', target: 'orderType' },
    { source: 'MATNR', target: 'materialNumber' },
    { source: 'GAMNG', target: 'quantity', convert: (v) => parseFloat(v) || 0 },
    { source: 'GMEIN', target: 'unit' },
    { source: 'GSTRP', target: 'startDate' },
    { source: 'GLTRP', target: 'endDate' },
    { source: 'WERKS', target: 'plant' },
    { source: 'STAT', target: 'status' },
    { source: 'PLNNR', target: 'routingNumber' },
    { source: 'STLNR', target: 'bomNumber' },
  ],

  // MARD/MCHB → Inventory
  Inventory: [
    { source: 'MATNR', target: 'materialNumber' },
    { source: 'WERKS', target: 'plant' },
    { source: 'LGORT', target: 'storageLocation' },
    { source: 'CHARG', target: 'batch' },
    { source: 'LABST', target: 'quantity', convert: (v) => parseFloat(v) || 0 },
    { source: 'MEINS', target: 'unit' },
    { source: 'INSMK', target: 'qualityStatus' },
    { source: 'SOBKZ', target: 'specialStock' },
  ],

  // BKPF/BSEG → GlEntry
  GlEntry: [
    { source: 'BELNR', target: 'documentNumber' },
    { source: 'BUKRS', target: 'companyCode' },
    { source: 'GJAHR', target: 'fiscalYear' },
    { source: 'BUDAT', target: 'postingDate' },
    { source: 'BLDAT', target: 'documentDate' },
    { source: 'BLART', target: 'documentType' },
    { source: 'WAERS', target: 'currency' },
    { source: 'XBLNR', target: 'referenceNumber' },
    { source: 'BKTXT', target: 'headerText' },
  ],

  // PA0001/PA0002 → Employee
  Employee: [
    { source: 'PERNR', target: 'employeeId' },
    { source: 'VORNA', target: 'firstName' },
    { source: 'NACHN', target: 'lastName' },
    { source: 'ENAME', target: 'fullName' },
    { source: 'WERKS', target: 'personnelArea' },
    { source: 'BTRTL', target: 'personnelSubarea' },
    { source: 'PERSG', target: 'employeeGroup' },
    { source: 'PERSK', target: 'employeeSubgroup' },
    { source: 'PLANS', target: 'position' },
    { source: 'STELL', target: 'jobTitle' },
    { source: 'ORGEH', target: 'orgUnit' },
    { source: 'KOSTL', target: 'costCenter' },
    { source: 'BEGDA', target: 'startDate' },
    { source: 'USRID_LONG', target: 'email' },
  ],

  // STKO/STPO → Bom
  Bom: [
    { source: 'STLNR', target: 'bomNumber' },
    { source: 'MATNR', target: 'materialNumber' },
    { source: 'WERKS', target: 'plant' },
    { source: 'STLAN', target: 'bomUsage' },
    { source: 'BMENG', target: 'baseQuantity', convert: (v) => parseFloat(v) || 0 },
    { source: 'BMEIN', target: 'baseUnit' },
    { source: 'DATUV', target: 'validFrom' },
    { source: 'DATUB', target: 'validTo' },
  ],

  // PLKO/PLPO → Routing
  Routing: [
    { source: 'PLNNR', target: 'routingNumber' },
    { source: 'MATNR', target: 'materialNumber' },
    { source: 'WERKS', target: 'plant' },
    { source: 'VERWE', target: 'routingUsage' },
  ],

  // ANLA/ANLZ → FixedAsset
  FixedAsset: [
    { source: 'ANLN1', target: 'assetNumber' },
    { source: 'ANLN2', target: 'assetSubnumber' },
    { source: 'TXA50', target: 'description' },
    { source: 'ANLKL', target: 'assetClass' },
    { source: 'AKTIV', target: 'capitalizationDate' },
    { source: 'DEAKT', target: 'deactivationDate' },
    { source: 'BUKRS', target: 'companyCode' },
    { source: 'KOSTL', target: 'costCenter' },
    { source: 'MENGE', target: 'quantity', convert: (v) => parseFloat(v) || 0 },
    { source: 'SERNR', target: 'serialNumber' },
    { source: 'INVNR', target: 'inventoryNumber' },
  ],

  // CSKS/CSKT → CostCenter
  CostCenter: [
    { source: 'KOSTL', target: 'costCenterId' },
    { source: 'KTEXT', target: 'description' },
    { source: 'VERAK', target: 'responsiblePerson' },
    { source: 'KOSAR', target: 'costCenterCategory' },
    { source: 'BUKRS', target: 'companyCode' },
    { source: 'KOKRS', target: 'controllingArea' },
    { source: 'PRCTR', target: 'profitCenter' },
    { source: 'DATAB', target: 'validFrom' },
    { source: 'DATBI', target: 'validTo' },
    { source: 'WAERS', target: 'currency' },
  ],
};

// ── Infor LN Mappings ─────────────────────────────────────────────────

const INFOR_LN = {
  // tcibd001 → Item
  Item: [
    { source: 'T$ITEM', target: 'itemId' },
    { source: 'T$DSCA', target: 'description' },
    { source: 'T$CUNI', target: 'baseUom' },
    { source: 'T$CTYP', target: 'itemType', convert: (v) => {
      const map = { 1: 'FERT', 2: 'HALB', 3: 'ROH', 4: 'HIBE' };
      return map[v] || v;
    }},
    { source: 'T$CITG', target: 'itemGroup' },
    { source: 'T$GRWE', target: 'grossWeight', convert: (v) => parseFloat(v) || 0 },
    { source: 'T$NEWE', target: 'netWeight', convert: (v) => parseFloat(v) || 0 },
    { source: 'T$WUNI', target: 'weightUnit' },
  ],

  // tccom100 → Customer
  Customer: [
    { source: 'T$BPID', target: 'customerId' },
    { source: 'T$NAMA', target: 'name' },
    { source: 'T$NAMB', target: 'name2' },
    { source: 'T$SEAK', target: 'searchTerm' },
    { source: 'T$LNAD', target: 'street' },
    { source: 'T$LNCI', target: 'city' },
    { source: 'T$LNPC', target: 'postalCode' },
    { source: 'T$LNCC', target: 'country' },
    { source: 'T$LNST', target: 'region' },
    { source: 'T$TELP', target: 'phone' },
    { source: 'T$EMAL', target: 'email' },
    { source: 'T$FOVN', target: 'taxNumber' },
    { source: 'T$CPAY', target: 'paymentTerms' },
    { source: 'T$CCUR', target: 'currency' },
  ],

  // tccom100 (supplier role) → Vendor
  Vendor: [
    { source: 'T$BPID', target: 'vendorId' },
    { source: 'T$NAMA', target: 'name' },
    { source: 'T$NAMB', target: 'name2' },
    { source: 'T$SEAK', target: 'searchTerm' },
    { source: 'T$LNAD', target: 'street' },
    { source: 'T$LNCI', target: 'city' },
    { source: 'T$LNPC', target: 'postalCode' },
    { source: 'T$LNCC', target: 'country' },
    { source: 'T$LNST', target: 'region' },
    { source: 'T$TELP', target: 'phone' },
    { source: 'T$EMAL', target: 'email' },
    { source: 'T$FOVN', target: 'taxNumber' },
    { source: 'T$CPAY', target: 'paymentTerms' },
    { source: 'T$CCUR', target: 'currency' },
  ],

  // tfgld010 → ChartOfAccounts
  ChartOfAccounts: [
    { source: 'T$LEAC', target: 'accountNumber' },
    { source: 'T$DESC', target: 'description' },
    { source: 'T$ACTP', target: 'accountType', convert: (v) => {
      const map = { 1: 'BS', 2: 'PL' };
      return map[v] || v;
    }},
    { source: 'T$AGRP', target: 'accountGroup' },
    { source: 'T$CCUR', target: 'currency' },
    { source: 'T$TAXC', target: 'taxCategory' },
  ],
};

// ── Infor M3 Mappings ─────────────────────────────────────────────────

const INFOR_M3 = {
  // MITMAS → Item
  Item: [
    { source: 'MMITNO', target: 'itemId' },
    { source: 'MMITDS', target: 'description' },
    { source: 'MMUNMS', target: 'baseUom' },
    { source: 'MMITTY', target: 'itemType', convert: (v) => {
      const map = { '10': 'FERT', '20': 'HALB', '30': 'ROH', '50': 'HIBE' };
      return map[v] || v;
    }},
    { source: 'MMITGR', target: 'itemGroup' },
    { source: 'MMGRWE', target: 'grossWeight', convert: (v) => parseFloat(v) || 0 },
    { source: 'MMNEWE', target: 'netWeight', convert: (v) => parseFloat(v) || 0 },
    { source: 'MMWUOM', target: 'weightUnit' },
    { source: 'MMVOL3', target: 'volume', convert: (v) => parseFloat(v) || 0 },
    { source: 'MMVUOM', target: 'volumeUnit' },
  ],

  // CIDMAS → Customer
  Customer: [
    { source: 'OKCUNO', target: 'customerId' },
    { source: 'OKCUNM', target: 'name' },
    { source: 'OKCUN2', target: 'name2' },
    { source: 'OKALCU', target: 'searchTerm' },
    { source: 'OKCUA1', target: 'street' },
    { source: 'OKTOWN', target: 'city' },
    { source: 'OKPONO', target: 'postalCode' },
    { source: 'OKCSCD', target: 'country' },
    { source: 'OKECAR', target: 'region' },
    { source: 'OKPHNO', target: 'phone' },
    { source: 'OKMAIL', target: 'email' },
    { source: 'OKTEPY', target: 'paymentTerms' },
    { source: 'OKCUCD', target: 'currency' },
  ],

  // CIDVEN → Vendor
  Vendor: [
    { source: 'IISUNO', target: 'vendorId' },
    { source: 'IISUNM', target: 'name' },
    { source: 'IISUN2', target: 'name2' },
    { source: 'IIALSU', target: 'searchTerm' },
    { source: 'IISUA1', target: 'street' },
    { source: 'IITOWN', target: 'city' },
    { source: 'IIPONO', target: 'postalCode' },
    { source: 'IICSCD', target: 'country' },
    { source: 'IIECAR', target: 'region' },
    { source: 'IIPHNO', target: 'phone' },
    { source: 'IIMAIL', target: 'email' },
    { source: 'IITEPY', target: 'paymentTerms' },
    { source: 'IICUCD', target: 'currency' },
  ],

  // FCHACC → ChartOfAccounts
  ChartOfAccounts: [
    { source: 'AIAITM', target: 'accountNumber' },
    { source: 'AIAITX', target: 'description' },
    { source: 'AIAITT', target: 'accountType', convert: (v) => {
      const map = { '1': 'BS', '2': 'PL' };
      return map[v] || v;
    }},
    { source: 'AIAIGR', target: 'accountGroup' },
    { source: 'AICUCD', target: 'currency' },
  ],
};

// ── Infor CSI (SyteLine IDO) Mappings ─────────────────────────────────

const INFOR_CSI = {
  // SLItems → Item
  Item: [
    { source: 'Item', target: 'itemId' },
    { source: 'Description', target: 'description' },
    { source: 'UM', target: 'baseUom' },
    { source: 'ProductCode', target: 'itemType' },
    { source: 'ItemGroup', target: 'itemGroup' },
    { source: 'UnitWeight', target: 'grossWeight', convert: (v) => parseFloat(v) || 0 },
    { source: 'NetWeight', target: 'netWeight', convert: (v) => parseFloat(v) || 0 },
    { source: 'WeightUnits', target: 'weightUnit' },
  ],

  // SLCustomers → Customer
  Customer: [
    { source: 'CustNum', target: 'customerId' },
    { source: 'Name', target: 'name' },
    { source: 'Addr1', target: 'street' },
    { source: 'City', target: 'city' },
    { source: 'Zip', target: 'postalCode' },
    { source: 'Country', target: 'country' },
    { source: 'State', target: 'region' },
    { source: 'Phone', target: 'phone' },
    { source: 'Email', target: 'email' },
    { source: 'TermsCode', target: 'paymentTerms' },
    { source: 'CurrCode', target: 'currency' },
  ],

  // SLVendors → Vendor
  Vendor: [
    { source: 'VendNum', target: 'vendorId' },
    { source: 'Name', target: 'name' },
    { source: 'Addr1', target: 'street' },
    { source: 'City', target: 'city' },
    { source: 'Zip', target: 'postalCode' },
    { source: 'Country', target: 'country' },
    { source: 'State', target: 'region' },
    { source: 'Phone', target: 'phone' },
    { source: 'Email', target: 'email' },
    { source: 'TermsCode', target: 'paymentTerms' },
    { source: 'CurrCode', target: 'currency' },
  ],

  // SLChartOfAccounts → ChartOfAccounts
  ChartOfAccounts: [
    { source: 'Acct', target: 'accountNumber' },
    { source: 'Description', target: 'description' },
    { source: 'Type', target: 'accountType', convert: (v) => {
      const map = { 'B': 'BS', 'P': 'PL' };
      return map[v] || v;
    }},
    { source: 'AcctGroup', target: 'accountGroup' },
    { source: 'CurrCode', target: 'currency' },
  ],
};

// ── Infor Lawson (Landmark) Mappings ──────────────────────────────────

const INFOR_LAWSON = {
  // IC11 → Item
  Item: [
    { source: 'ITEM-NUMBER', target: 'itemId' },
    { source: 'DESCRIPTION', target: 'description' },
    { source: 'UM', target: 'baseUom' },
    { source: 'ITEM-TYPE', target: 'itemType' },
    { source: 'ITEM-GROUP', target: 'itemGroup' },
    { source: 'WEIGHT', target: 'grossWeight', convert: (v) => parseFloat(v) || 0 },
    { source: 'WEIGHT-UM', target: 'weightUnit' },
  ],

  // AR01 → Customer
  Customer: [
    { source: 'CUSTOMER', target: 'customerId' },
    { source: 'NAME', target: 'name' },
    { source: 'ADDRESS-1', target: 'street' },
    { source: 'CITY', target: 'city' },
    { source: 'POSTAL-CODE', target: 'postalCode' },
    { source: 'COUNTRY', target: 'country' },
    { source: 'STATE', target: 'region' },
    { source: 'PHONE-NUMBER', target: 'phone' },
    { source: 'EMAIL-ADDRESS', target: 'email' },
    { source: 'PAY-TERMS', target: 'paymentTerms' },
    { source: 'CURRENCY', target: 'currency' },
  ],

  // AP01 → Vendor
  Vendor: [
    { source: 'VENDOR', target: 'vendorId' },
    { source: 'NAME', target: 'name' },
    { source: 'ADDRESS-1', target: 'street' },
    { source: 'CITY', target: 'city' },
    { source: 'POSTAL-CODE', target: 'postalCode' },
    { source: 'COUNTRY', target: 'country' },
    { source: 'STATE', target: 'region' },
    { source: 'PHONE-NUMBER', target: 'phone' },
    { source: 'EMAIL-ADDRESS', target: 'email' },
    { source: 'PAY-TERMS', target: 'paymentTerms' },
    { source: 'CURRENCY', target: 'currency' },
  ],

  // GL01 → ChartOfAccounts
  ChartOfAccounts: [
    { source: 'ACCOUNT', target: 'accountNumber' },
    { source: 'DESCRIPTION', target: 'description' },
    { source: 'ACCOUNT-TYPE', target: 'accountType', convert: (v) => {
      const map = { 'B': 'BS', 'P': 'PL', 'R': 'PL' };
      return map[v] || v;
    }},
    { source: 'ACCOUNT-GROUP', target: 'accountGroup' },
    { source: 'CURRENCY', target: 'currency' },
  ],
};

// ── Mapping Registry ──────────────────────────────────────────────────

const MAPPINGS = {
  SAP,
  INFOR_LN,
  INFOR_M3,
  INFOR_CSI,
  INFOR_LAWSON,
};

/**
 * Get field mappings for a given source system and entity type.
 * @param {string} sourceSystem — e.g. 'SAP', 'INFOR_LN', 'INFOR_M3', 'INFOR_CSI', 'INFOR_LAWSON'
 * @param {string} entityType — canonical entity type name (e.g. 'Item', 'Customer')
 * @returns {{ source: string, target: string, convert?: Function }[]}
 */
function getMappings(sourceSystem, entityType) {
  const systemMappings = MAPPINGS[sourceSystem];
  if (!systemMappings) {
    throw new CanonicalMappingError(
      `Unsupported source system: ${sourceSystem}`,
      { sourceSystem, supported: getSourceSystems() }
    );
  }

  const entityMappings = systemMappings[entityType];
  if (!entityMappings) {
    return null;
  }

  return entityMappings;
}

/**
 * List all supported source systems.
 * @returns {string[]}
 */
function getSourceSystems() {
  return Object.keys(MAPPINGS);
}

module.exports = {
  getMappings,
  getSourceSystems,
};
