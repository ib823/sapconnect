// Copyright 2024-2026 SEN Contributors
// SPDX-License-Identifier: Apache-2.0
using { sapconnect as db } from '../db/schema';

service CustomerService @(path: '/api/customers') {

  @odata.draft.enabled
  entity Customers as projection on db.Customers;

  @readonly
  entity Projects as projection on db.Projects;

  // Code list value helps
  @readonly entity CustomerTiers as projection on db.CustomerTiers;
  @readonly entity ProjectStatuses as projection on db.ProjectStatuses;

  // Unbound function: project statistics
  function getProjectStats() returns {
    total: Integer;
    byStatus: array of {
      status: String;
      count: Integer;
    };
  };

  // Bound action: simulate SAP Business Partner lookup
  action lookupBusinessPartner(sapId: String) returns {
    sapId: String;
    name: String;
    country: String;
    found: Boolean;
    source: String;
  };
}
