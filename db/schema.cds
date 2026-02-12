namespace sapconnect;

using { cuid, managed, sap.common.CodeList } from '@sap/cds/common';

// --- Code Lists ---

entity CustomerTiers : CodeList {
  key code : String(20);
}

entity ProjectStatuses : CodeList {
  key code : String(20);
}

// --- Main Entities ---

entity Customers : cuid, managed {
  name           : String(200)  @mandatory;
  sapId          : String(10)   @title: 'SAP Customer ID';
  tier           : Association to CustomerTiers;
  industry       : String(100);
  country        : String(3);
  city           : String(100);
  contactEmail   : String(200);
  contactPhone   : String(50);
  projects       : Composition of many Projects on projects.customer = $self;
  activeProjects : Integer default 0;
}

entity Projects : cuid, managed {
  title          : String(200)  @mandatory;
  description    : String(2000);
  customer       : Association to Customers;
  status         : Association to ProjectStatuses;
  scenario       : String(50)   @title: 'Integration Scenario';
  startDate      : Date;
  endDate        : Date;
  budget         : Decimal(15,2);
  currency       : String(3) default 'USD';
}
