# Clean Core Guide

## What is Clean Core?

Clean Core is SAP's strategy for keeping SAP systems upgrade-safe. It means:

- **No modifications** to SAP standard code
- **Extensions run outside** the SAP core (on BTP or via released APIs)
- **Only use released APIs** and extension points
- **System stays updatable** without regression

## The Three Rules

### 1. Use Released APIs Only

SAP releases APIs through Communication Scenarios. Only these are guaranteed stable across upgrades.

| Allowed | Not Allowed |
|---------|-------------|
| `API_BUSINESS_PARTNER` (released) | Direct table access (`BUT000`) |
| OData V2/V4 services marked "released" | Custom RFC function modules |
| SOAP services with stability contract | BAPIs without release contract |
| REST APIs from SAP API Hub | Direct CDS view access (unreleased) |

### 2. Extend, Don't Modify

| Pattern | Clean Core? | Description |
|---------|-------------|-------------|
| Side-by-side extension on BTP | Yes | Build apps on BTP, call SAP via APIs |
| Key User extensibility | Yes | Custom fields, custom logic via BAdIs |
| Developer extensibility (ABAP Cloud) | Yes | Custom CDS views, released BAdIs |
| Classic ABAP modification | No | Modifying SAP standard code |
| Classic BAdI (unreleased) | No | Using non-released extension points |
| Direct database access | No | SELECT from SAP tables |

### 3. Events Over Polling

Use SAP Event Mesh for real-time integration instead of polling APIs:

```
SAP System --> Event Mesh --> BTP App
  (event)       (topic)      (subscriber)
```

## What This Toolkit Demonstrates

| Pattern | File | Description |
|---------|------|-------------|
| Released API import | `srv/external/API_BUSINESS_PARTNER.cds` | How to import and use a released SAP API |
| Side-by-side extension | `srv/customer-service.js` | BTP-based service calling SAP APIs |
| Fiori Elements UI | `app/customers/` | Standard UI technology (no custom controls) |
| API Discovery | `discovery/` | Find which released APIs are available |
| CAP framework | `package.json` | SAP's recommended development model |

## Checking Clean Core Compliance

Use the API Discovery tool to verify a client's system:

```bash
npm run discover -- --system https://tenant.s4hana.cloud.sap
```

The report shows:
- Which Communication Scenarios are available
- Which APIs are released and their stability status
- Available events for event-driven architecture
- Extension points for key-user and developer extensibility

## Common Pitfalls

1. **Using unreleased CDS views** - Check the release status on SAP API Business Hub
2. **Direct OData calls without destinations** - Always use BTP Destination service
3. **Skipping Communication Arrangements** - Required for all API access
4. **Custom UI controls** - Use Fiori Elements first, custom controls only when needed
5. **Synchronous integration only** - Consider events for loose coupling
