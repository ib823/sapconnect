// Copyright 2024-2026 SEN Contributors
// SPDX-License-Identifier: Apache-2.0
// Stubbed SAP S/4HANA Business Partner API
// In production, this would be imported via `cds import` from the SAP API Business Hub
// This stub shows the integration pattern and key entities

@cds.external
@cds.persistence.skip
service API_BUSINESS_PARTNER {

  entity A_BusinessPartner {
    key BusinessPartner          : String(10);
        BusinessPartnerFullName  : String(81);
        BusinessPartnerCategory  : String(1);
        BusinessPartnerGrouping  : String(4);
        FirstName                : String(40);
        LastName                 : String(40);
        OrganizationBPName1      : String(40);
        Industry                 : String(10);
        LegalForm                : String(2);
        SearchTerm1              : String(20);
        CreationDate             : Date;
        LastChangeDate           : Date;
  };

  entity A_BusinessPartnerAddress {
    key BusinessPartner : String(10);
    key AddressID       : String(10);
        Country         : String(3);
        Region          : String(3);
        CityName        : String(40);
        StreetName      : String(60);
        PostalCode      : String(10);
  };
}
