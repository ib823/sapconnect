// Copyright 2024-2026 SEN Contributors
// SPDX-License-Identifier: Apache-2.0
using CustomerService as service from '../../srv/customer-service';

// --- Customers List Report ---

annotate service.Customers with @(
  UI: {
    // Header info
    HeaderInfo: {
      TypeName: 'Customer',
      TypeNamePlural: 'Customers',
      Title: { Value: name },
      Description: { Value: industry }
    },

    // Selection fields (filter bar)
    SelectionFields: [ name, tier_code, industry, country ],

    // List Report columns
    LineItem: [
      { Value: name, Label: 'Customer Name' },
      { Value: sapId, Label: 'SAP ID' },
      { Value: tier.name, Label: 'Tier' },
      { Value: industry },
      { Value: country },
      { Value: activeProjects, Label: 'Active Projects' }
    ],

    // Object Page facets
    Facets: [
      {
        $Type: 'UI.ReferenceFacet',
        ID: 'GeneralInfo',
        Label: 'General Information',
        Target: '@UI.FieldGroup#General'
      },
      {
        $Type: 'UI.ReferenceFacet',
        ID: 'ContactInfo',
        Label: 'Contact',
        Target: '@UI.FieldGroup#Contact'
      },
      {
        $Type: 'UI.ReferenceFacet',
        ID: 'ProjectsList',
        Label: 'Projects',
        Target: 'projects/@UI.LineItem'
      }
    ],

    FieldGroup#General: {
      Data: [
        { Value: name },
        { Value: sapId },
        { Value: tier_code, Label: 'Tier' },
        { Value: industry },
        { Value: country },
        { Value: city }
      ]
    },

    FieldGroup#Contact: {
      Data: [
        { Value: contactEmail, Label: 'Email' },
        { Value: contactPhone, Label: 'Phone' }
      ]
    }
  }
);

// --- Projects sub-table on Object Page ---

annotate service.Projects with @(
  UI: {
    HeaderInfo: {
      TypeName: 'Project',
      TypeNamePlural: 'Projects',
      Title: { Value: title },
      Description: { Value: scenario }
    },
    LineItem: [
      { Value: title },
      { Value: status.name, Label: 'Status' },
      { Value: scenario },
      { Value: startDate, Label: 'Start' },
      { Value: endDate, Label: 'End' },
      { Value: budget },
      { Value: currency }
    ]
  }
);
