# What's Allowed: Public Cloud vs Private Cloud vs BTP-Only

## Comparison Table

| Capability | Public Cloud | Private Cloud | BTP-Only |
|-----------|:------------:|:-------------:|:--------:|
| **Released APIs (OData/REST)** | Yes | Yes | N/A |
| **Custom ABAP (ABAP Cloud)** | Yes (restricted) | Yes | No |
| **Classic ABAP** | No | Yes | No |
| **Key User Custom Fields** | Yes | Yes | No |
| **Key User Custom Logic (BAdI)** | Yes | Yes | No |
| **Custom CDS Views** | Released objects only | Any object | No |
| **Direct DB Table Access** | No | Yes (not recommended) | No |
| **SAP GUI Transactions** | Limited | Full | No |
| **Side-by-Side BTP Extensions** | Yes | Yes | Yes |
| **Event Mesh Integration** | Yes | With config | N/A |
| **CAP Applications** | Yes (on BTP) | Yes (on BTP) | Yes |
| **Fiori Elements Apps** | Yes | Yes | Yes |
| **SAP Build Apps** | Yes | Yes | Yes |
| **Custom Code Modifications** | No | Yes (not recommended) | No |
| **RFC/BAPI (unreleased)** | No | Yes | No |
| **API Discovery (this tool)** | Full | Full | Partial |

## Public Cloud

SAP S/4HANA Public Cloud is the most restrictive but most future-proof option.

**What you CAN do:**
- Use any released API via Communication Arrangements
- Build side-by-side extensions on BTP
- Use Key User tools for simple extensions
- Write ABAP Cloud (restricted ABAP with released APIs only)
- Subscribe to business events via Event Mesh

**What you CANNOT do:**
- Modify SAP standard code
- Access unreleased APIs or database tables
- Use classic ABAP (unrestricted)
- Create custom SAP GUI transactions

## Private Cloud

SAP S/4HANA Private Cloud gives more flexibility but with upgrade risks.

**Additional capabilities over Public Cloud:**
- Classic ABAP development
- Direct database table access
- Unreleased API/BAPI usage
- Full SAP GUI access
- Custom transactions

**Recommendation:** Even in Private Cloud, follow Clean Core principles to ease future migration to Public Cloud.

## BTP-Only

For scenarios where there's no S/4HANA system, only BTP services.

**What you CAN do:**
- Build full-stack CAP applications
- Use BTP services (HANA Cloud, Event Mesh, Integration Suite)
- Build Fiori/UI5 applications
- Integrate with non-SAP systems

**What's different:**
- No SAP business data to extend
- No Communication Scenarios
- No Key User extensibility
- Focus on custom business logic

## This Toolkit's Approach

SAP Connect follows **Public Cloud** restrictions by default:
- Uses only released API patterns
- Builds side-by-side on CAP/BTP
- Uses Fiori Elements (standard UI)
- API Discovery checks release status

This means solutions built here work across all three scenarios.
