/**
 * Tests for OData $metadata XML Parser
 */
const MetadataParser = require('../../../lib/odata/metadata-parser');

const V2_METADATA = `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx"
           xmlns:sap="http://www.sap.com/Protocols/SAPData">
  <edmx:DataServices m:DataServiceVersion="2.0" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">
    <Schema Namespace="API_BUSINESS_PARTNER" xmlns="http://schemas.microsoft.com/ado/2008/09/edm">
      <EntityType Name="A_BusinessPartner" sap:content-version="1">
        <Key>
          <PropertyRef Name="BusinessPartner"/>
        </Key>
        <Property Name="BusinessPartner" Type="Edm.String" Nullable="false" MaxLength="10" sap:label="Business Partner"/>
        <Property Name="BusinessPartnerFullName" Type="Edm.String" MaxLength="81" sap:label="Full Name"/>
        <Property Name="BusinessPartnerCategory" Type="Edm.String" MaxLength="1" sap:label="Category"/>
        <Property Name="CreatedByUser" Type="Edm.String" MaxLength="12" sap:filterable="false"/>
        <NavigationProperty Name="to_BusinessPartnerAddress" Relationship="API_BUSINESS_PARTNER.Assoc_BPToAddress" FromRole="FromRole" ToRole="ToRole"/>
      </EntityType>
      <EntityType Name="A_BusinessPartnerAddress">
        <Key>
          <PropertyRef Name="BusinessPartner"/>
          <PropertyRef Name="AddressID"/>
        </Key>
        <Property Name="BusinessPartner" Type="Edm.String" Nullable="false" MaxLength="10"/>
        <Property Name="AddressID" Type="Edm.String" Nullable="false" MaxLength="10"/>
        <Property Name="CityName" Type="Edm.String" MaxLength="40"/>
        <Property Name="Country" Type="Edm.String" MaxLength="3"/>
        <Property Name="PostalCode" Type="Edm.String" MaxLength="10"/>
        <Property Name="StreetName" Type="Edm.String" MaxLength="60"/>
      </EntityType>
      <ComplexType Name="BPAddressData">
        <Property Name="Street" Type="Edm.String"/>
        <Property Name="City" Type="Edm.String"/>
      </ComplexType>
      <Association Name="Assoc_BPToAddress">
        <End Type="API_BUSINESS_PARTNER.A_BusinessPartner" Multiplicity="1" Role="FromRole"/>
        <End Type="API_BUSINESS_PARTNER.A_BusinessPartnerAddress" Multiplicity="*" Role="ToRole"/>
      </Association>
      <EntityContainer Name="API_BUSINESS_PARTNER_Entities" m:IsDefaultEntityContainer="true">
        <EntitySet Name="A_BusinessPartner" EntityType="API_BUSINESS_PARTNER.A_BusinessPartner" sap:creatable="true" sap:updatable="true" sap:deletable="false"/>
        <EntitySet Name="A_BusinessPartnerAddress" EntityType="API_BUSINESS_PARTNER.A_BusinessPartnerAddress" sap:creatable="true" sap:updatable="true" sap:deletable="true"/>
        <FunctionImport Name="GetBPByFilter" ReturnType="API_BUSINESS_PARTNER.A_BusinessPartner" m:HttpMethod="GET">
          <Parameter Name="filter" Type="Edm.String" Mode="In"/>
        </FunctionImport>
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;

const V4_METADATA = `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="com.sap.gateway.srvd_a2x.sap.api_glaccountinchartofaccounts" xmlns="http://docs.oasis-open.org/odata/ns/edm">
      <EntityType Name="GLAccountInChartOfAccounts">
        <Key>
          <PropertyRef Name="ChartOfAccounts"/>
          <PropertyRef Name="GLAccount"/>
        </Key>
        <Property Name="ChartOfAccounts" Type="Edm.String" Nullable="false" MaxLength="4"/>
        <Property Name="GLAccount" Type="Edm.String" Nullable="false" MaxLength="10"/>
        <Property Name="GLAccountName" Type="Edm.String" MaxLength="50"/>
        <Property Name="IsBalanceSheetAccount" Type="Edm.Boolean"/>
        <NavigationProperty Name="_CompanyCode" Type="Collection(com.sap.gateway.srvd_a2x.sap.api_glaccountinchartofaccounts.GLAccountInCompanyCode)"/>
      </EntityType>
      <Action Name="PostGLAccount" IsBound="false">
        <Parameter Name="ChartOfAccounts" Type="Edm.String"/>
        <Parameter Name="GLAccount" Type="Edm.String"/>
        <ReturnType Type="com.sap.gateway.srvd_a2x.sap.api_glaccountinchartofaccounts.GLAccountInChartOfAccounts"/>
      </Action>
      <EntityContainer Name="Container">
        <EntitySet Name="GLAccountInChartOfAccounts" EntityType="com.sap.gateway.srvd_a2x.sap.api_glaccountinchartofaccounts.GLAccountInChartOfAccounts"/>
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;

describe('MetadataParser', () => {
  let parser;

  beforeEach(() => {
    parser = new MetadataParser();
  });

  describe('parse()', () => {
    it('should detect V2 version', () => {
      const model = parser.parse(V2_METADATA);
      expect(model.version).toBe('v2');
    });

    it('should detect V4 version', () => {
      const model = parser.parse(V4_METADATA);
      expect(model.version).toBe('v4');
    });

    it('should throw on empty input', () => {
      expect(() => parser.parse('')).toThrow();
      expect(() => parser.parse(null)).toThrow();
    });
  });

  describe('V2 metadata parsing', () => {
    let model;

    beforeEach(() => {
      model = parser.parse(V2_METADATA);
    });

    it('should parse schema namespace', () => {
      expect(model.schemas).toHaveLength(1);
      expect(model.schemas[0].namespace).toBe('API_BUSINESS_PARTNER');
    });

    it('should parse entity types', () => {
      expect(model.entityTypes).toHaveLength(2);
      expect(model.entityTypes[0].name).toBe('A_BusinessPartner');
      expect(model.entityTypes[1].name).toBe('A_BusinessPartnerAddress');
    });

    it('should parse key fields', () => {
      expect(model.entityTypes[0].keys).toEqual(['BusinessPartner']);
      expect(model.entityTypes[1].keys).toEqual(['BusinessPartner', 'AddressID']);
    });

    it('should parse properties with attributes', () => {
      const bp = model.entityTypes[0];
      expect(bp.properties.length).toBeGreaterThanOrEqual(4);

      const bpField = bp.properties.find(p => p.name === 'BusinessPartner');
      expect(bpField.type).toBe('Edm.String');
      expect(bpField.nullable).toBe(false);
      expect(bpField.maxLength).toBe(10);
      expect(bpField.sapLabel).toBe('Business Partner');
    });

    it('should parse sap:filterable attribute', () => {
      const bp = model.entityTypes[0];
      const created = bp.properties.find(p => p.name === 'CreatedByUser');
      expect(created.sapFilterable).toBe(false);
    });

    it('should parse navigation properties', () => {
      const bp = model.entityTypes[0];
      expect(bp.navigationProperties).toHaveLength(1);
      expect(bp.navigationProperties[0].name).toBe('to_BusinessPartnerAddress');
      expect(bp.navigationProperties[0].relationship).toBe('API_BUSINESS_PARTNER.Assoc_BPToAddress');
    });

    it('should parse entity sets', () => {
      expect(model.entitySets).toHaveLength(2);
      const bpSet = model.entitySets.find(es => es.name === 'A_BusinessPartner');
      expect(bpSet.entityType).toBe('API_BUSINESS_PARTNER.A_BusinessPartner');
      expect(bpSet.creatable).toBe(true);
      expect(bpSet.deletable).toBe(false);
    });

    it('should parse complex types', () => {
      expect(model.complexTypes).toHaveLength(1);
      expect(model.complexTypes[0].name).toBe('BPAddressData');
      expect(model.complexTypes[0].properties).toHaveLength(2);
    });

    it('should parse associations', () => {
      expect(model.associations).toHaveLength(1);
      expect(model.associations[0].name).toBe('Assoc_BPToAddress');
      expect(model.associations[0].ends).toHaveLength(2);
      expect(model.associations[0].ends[0].multiplicity).toBe('1');
      expect(model.associations[0].ends[1].multiplicity).toBe('*');
    });

    it('should parse function imports', () => {
      expect(model.functionImports).toHaveLength(1);
      expect(model.functionImports[0].name).toBe('GetBPByFilter');
      expect(model.functionImports[0].httpMethod).toBe('GET');
      expect(model.functionImports[0].parameters).toHaveLength(1);
    });

    it('should provide qualified names', () => {
      expect(model.entityTypes[0].qualifiedName).toBe('API_BUSINESS_PARTNER.A_BusinessPartner');
    });
  });

  describe('V4 metadata parsing', () => {
    let model;

    beforeEach(() => {
      model = parser.parse(V4_METADATA);
    });

    it('should parse V4 entity types', () => {
      expect(model.entityTypes).toHaveLength(1);
      expect(model.entityTypes[0].name).toBe('GLAccountInChartOfAccounts');
    });

    it('should parse V4 composite keys', () => {
      expect(model.entityTypes[0].keys).toEqual(['ChartOfAccounts', 'GLAccount']);
    });

    it('should parse V4 Boolean properties', () => {
      const prop = model.entityTypes[0].properties.find(p => p.name === 'IsBalanceSheetAccount');
      expect(prop.type).toBe('Edm.Boolean');
    });

    it('should parse V4 navigation properties', () => {
      const navs = model.entityTypes[0].navigationProperties;
      expect(navs).toHaveLength(1);
      expect(navs[0].name).toBe('_CompanyCode');
    });

    it('should parse V4 actions', () => {
      expect(model.actions).toHaveLength(1);
      expect(model.actions[0].name).toBe('PostGLAccount');
      expect(model.actions[0].parameters).toHaveLength(2);
      expect(model.actions[0].returnType).toContain('GLAccountInChartOfAccounts');
    });

    it('should parse V4 entity sets', () => {
      expect(model.entitySets).toHaveLength(1);
      expect(model.entitySets[0].name).toBe('GLAccountInChartOfAccounts');
    });
  });

  describe('helper methods', () => {
    it('should find entity type by name', () => {
      const model = parser.parse(V2_METADATA);
      const et = parser.findEntityType(model, 'A_BusinessPartner');
      expect(et).not.toBeNull();
      expect(et.name).toBe('A_BusinessPartner');
    });

    it('should find entity type by qualified name', () => {
      const model = parser.parse(V2_METADATA);
      const et = parser.findEntityType(model, 'API_BUSINESS_PARTNER.A_BusinessPartner');
      expect(et).not.toBeNull();
    });

    it('should return null for unknown entity type', () => {
      const model = parser.parse(V2_METADATA);
      expect(parser.findEntityType(model, 'NonExistent')).toBeNull();
    });

    it('should get navigation properties for entity type', () => {
      const model = parser.parse(V2_METADATA);
      const navs = parser.getNavigations(model, 'A_BusinessPartner');
      expect(navs).toHaveLength(1);
      expect(navs[0].name).toBe('to_BusinessPartnerAddress');
    });

    it('should return empty for entity type with no navigations', () => {
      const model = parser.parse(V2_METADATA);
      const navs = parser.getNavigations(model, 'A_BusinessPartnerAddress');
      expect(navs).toHaveLength(0);
    });

    it('should return empty for unknown entity type', () => {
      const model = parser.parse(V2_METADATA);
      expect(parser.getNavigations(model, 'Unknown')).toHaveLength(0);
    });
  });

  describe('getEntityTypes shortcut', () => {
    it('should return entity types directly from XML', () => {
      const types = parser.getEntityTypes(V2_METADATA);
      expect(types).toHaveLength(2);
      expect(types[0].name).toBe('A_BusinessPartner');
    });
  });
});
