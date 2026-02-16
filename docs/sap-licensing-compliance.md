# SAP Licensing Compliance Guide

## Overview

SEN is a third-party open-source tool that interacts with SAP systems via SAP's publicly documented APIs. This document details SEN's compliance posture and the licensing obligations of its users.

## User Licensing Requirements

### Mandatory: SAP Named User Licenses

Every individual who uses SEN to connect to an SAP system MUST hold a valid SAP Named User license for that system. SEN operates on behalf of the authenticated user — it does not create new access paths for unlicensed users.

SEN is a **tool** used by licensed SAP professionals, similar to:
- SAP GUI (SAP's own client application)
- Eclipse with ABAP Development Tools (SAP's own IDE)
- Postman or curl (generic API testing tools)
- MuleSoft, Boomi, or Informatica (integration middleware)
- SNP CrystalBridge (SAP-partnered migration tool)

### Indirect/Digital Access Considerations

SEN does NOT create indirect access scenarios because:

1. **All users are authenticated**: SEN requires SAP credentials for every connection. These credentials correspond to SAP Named Users.
2. **No unlicensed user access**: SEN does not expose SAP data to users who lack SAP licenses. There is no web portal, customer-facing UI, or third-party integration that allows unlicensed users to access SAP data through SEN.
3. **No document creation on behalf of others**: SEN does not create sales orders, purchase orders, invoices, or other Digital Access document types on behalf of unlicensed users. All operations are performed by the authenticated Named User.
4. **Tool, not platform**: SEN is a developer/consultant tool, not a SaaS platform that multiplies SAP access.

### SAP Digital Access Model

For organizations using SAP's Digital Access pricing model, SEN's operations do not generate billable documents beyond what the licensed user would create through standard SAP transactions. Migration data loads create master data and transaction data as part of the licensed migration activity.

## API Compliance

### Released APIs Only (Public Cloud)

For SAP S/4HANA Public Cloud connections, SEN exclusively uses SAP-released APIs. These APIs are:
- Published on SAP API Business Hub (api.sap.com)
- Documented in SAP Help Portal
- Accessed via Communication Arrangements
- Consistent with SAP's Clean Core strategy

### Standard Protocols (Private Cloud / On-Premise)

For Private Cloud and On-Premise connections, SEN uses:
- **OData V2/V4**: SAP's standard data protocol
- **RFC/BAPI**: SAP's published remote function call protocol (available since 1992)
- **ADT REST**: SAP's published development tools API (same as Eclipse IDE)

These are the same protocols used by every SAP integration tool, middleware platform, and SAP's own client applications.

### No Undocumented Access

SEN does NOT:
- Access SAP kernel-level functions
- Use undocumented or internal APIs
- Bypass SAP's authorization framework
- Modify SAP standard code
- Access SAP database tables directly (except via published RFC/BAPI)

## Assessment Rules — Intellectual Property

SEN contains 874 assessment rules for evaluating custom ABAP code and system configuration. These rules:

1. Were independently developed by SEN contributors
2. Reference publicly available SAP documentation:
   - SAP Simplification Items (public catalog at help.sap.com)
   - SAP Notes (available to all licensed SAP customers)
   - SAP API release information (api.sap.com)
   - SAP Community posts and blog articles
3. Implement pattern-matching logic (regular expressions, AST analysis)
4. Do not contain or derive from SAP proprietary source code
5. Are functional works that detect patterns in customer code — not copies of SAP materials

## Safety Architecture

SEN enforces multiple safety layers to protect customer SAP systems:

| Layer | Protection | Implementation |
|-------|-----------|----------------|
| Authentication | Every connection requires valid credentials | Environment variables / BTP Destinations |
| Authorization | Respects SAP authorization model | Uses authenticated user's permissions |
| Safety Gates | Write operations require human confirmation | `dryRun=true` by default, explicit opt-in for live |
| Audit Trail | Every operation is logged | Timestamped, user-attributed, operation-specific |
| Transport Safety | ABAP changes go through transport system | No direct production writes |
| Rollback Plans | Cutover operations include rollback | 8-step rollback procedure |
| Rate Limiting | API calls are throttled | Prevents system overload |

## Compliance Checklist for Organizations

Before deploying SEN in your organization, verify:

- [ ] All SEN users hold valid SAP Named User licenses for target systems
- [ ] SAP system credentials are stored securely (not in code repositories)
- [ ] Write operations are tested in sandbox/development before production
- [ ] Your organization's change management policy is followed
- [ ] Audit logging is enabled and retained per your data retention policy
- [ ] Your SAP license agreement does not contain unusual restrictions on API access tools
- [ ] If using SAP Digital Access model, migration data loads are accounted for

## Regulatory Compliance

SEN itself does not store or process personal data beyond what is present in SAP system responses during active operations. Organizations are responsible for:
- GDPR compliance for any personal data accessed through SEN
- Data residency requirements for cross-border SAP connections
- Industry-specific regulations (SOX, HIPAA, etc.) applicable to their SAP data
