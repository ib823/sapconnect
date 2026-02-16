// Copyright 2024-2026 SEN Contributors
// SPDX-License-Identifier: Apache-2.0
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

// --- Extraction Persistence ---

entity ExtractionRuns : cuid, managed {
  runId          : String(64)   @mandatory;
  status         : String(20)   default 'pending';  // pending, running, complete, error
  mode           : String(10)   default 'mock';     // mock, live
  startedAt      : Timestamp;
  completedAt    : Timestamp;
  extractorCount : Integer      default 0;
  errorCount     : Integer      default 0;
  confidence     : Decimal(5,2) default 0;
  grade          : String(2);
  metadata       : LargeString;                     // JSON blob for flexible data
}

entity ExtractionResults : cuid, managed {
  run            : Association to ExtractionRuns;
  extractorId    : String(64)   @mandatory;
  status         : String(20)   default 'pending';  // pending, running, complete, error, skipped
  startedAt      : Timestamp;
  completedAt    : Timestamp;
  recordCount    : Integer      default 0;
  errorMessage   : String(2000);
  data           : LargeString;                     // JSON blob of extraction result
}

entity Checkpoints : cuid, managed {
  run            : Association to ExtractionRuns;
  extractorId    : String(64)   @mandatory;
  checkpoint     : LargeString  @mandatory;         // JSON checkpoint state
  resumable      : Boolean      default true;
}

entity MigrationRuns : cuid, managed {
  runId          : String(64)   @mandatory;
  status         : String(20)   default 'pending';
  mode           : String(10)   default 'mock';
  startedAt      : Timestamp;
  completedAt    : Timestamp;
  objectCount    : Integer      default 0;
  successCount   : Integer      default 0;
  errorCount     : Integer      default 0;
  metadata       : LargeString;
}
