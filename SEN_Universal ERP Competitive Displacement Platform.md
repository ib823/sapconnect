# SEN: Universal ERP Competitive Displacement Platform

**SEN is a technically feasible, AI-native platform that can autonomously assess, map, and migrate customers from Infor (and eventually all ERPs) to SAP S/4HANA using Claude Code as its orchestration brain.** No existing tool combines forensic-level assessment, autonomous data transformation, and custom application development in a single platform. The research below provides the exhaustive technical foundation — covering all 20+ Infor products, field-level data mappings, 10 industry verticals, MCP server architectures, and migration methodologies — required to build SEN into a production-grade displacement engine. The opportunity is significant: the global data migration software market is projected at **~$15B by 2033** (12% CAGR), and no competitor offers an AI-native, open-source, universal-source approach.

---

## Part 1: The complete Infor product portfolio

Infor's ecosystem spans **20+ products** across 4 core ERP platforms, a shared middleware layer (Infor OS), and numerous specialized solutions. Understanding each product's architecture is the prerequisite for building extraction adapters.

### Core ERP platforms

**Infor LN (formerly BaaN)** serves discrete manufacturing, aerospace & defense, automotive, and industrial machinery. It runs on Oracle DB, SQL Server, or DB2, with a distinctive table naming convention where module prefixes combine with 3-digit company suffixes (e.g., `tdpur041300` = purchase orders for company 300). Key tables include `tcibd001` (item master), `tccom100` (business partners), `tdsls400` (sales orders), `tdpur400` (purchase orders), `tfgld100` (GL transactions), and `twhwmd200` (warehouse data). Text fields are stored in binary in dedicated tables, and enumerated fields store meaningless integers requiring data dictionary lookup — both creating extraction complexity. LN exposes data through ION API Gateway (OAuth2), BODs (OAGIS-based XML), and the BaaN Object Layer (BOL/4GL) scripting language. Customizations live in BOL scripts, user exits, DEM (Dynamic Enterprise Modeler), and chart field extensions.

**Infor M3** targets process manufacturing — food & beverage, fashion, chemicals, and distribution. Built on AS/400 heritage, it runs on DB2, SQL Server, or Oracle with 6-character table names and 2-character field prefixes (e.g., `MMITNO` = item number in `MITMAS`). Critical tables: `MITMAS` (item master), `MITBAL` (item/warehouse balance), `CIDMAS` (customer master), `OOLINE` (order lines), `FSLEDG` (financial sub-ledger). M3 exposes API programs (MI programs) via REST endpoints at `/m3api-rest/execute/{program}/{transaction}`, discoverable through the MRS001 repository. Extension tables `CUGEX1`–`CUGEX3` store custom data per entity. Customizations use MAK (M3 Adaptation Kit) for Java modifications, **XtendM3** (Groovy-based extensions with DatabaseAPI for direct CRUD), and MEC triggers for event-driven integration.

**Infor CloudSuite Industrial (SyteLine/CSI)** serves mid-market discrete manufacturing, running exclusively on SQL Server. It uses IDOs (Infor Data Objects) as its primary data access layer, with tables like `item`, `co` (customer orders), `po` (purchase orders), and `matltran` (material transactions). APIs include IDO REST/SOAP services, .NET extension classes, and ION BOD connectors. Customizations are built in C#/.NET via the Mongoose development framework.

**Infor CloudSuite Financials & Supply Management (Lawson)** dominates healthcare and public sector. Running on Oracle, SQL Server, or DB2, it stores financial data in `GLMASTER` (chart of accounts), `APMASTER` (accounts payable), `ARMASTER` (accounts receivable), and `ICITEM` (inventory items). The Landmark technology platform underlies modern CloudSuite v11+, while legacy Lawson S3 uses Design Studio for customization and ProcessFlow Integrator (PFI) for workflow.

### Specialized solutions and the Infor OS platform

Beyond core ERPs, Infor's portfolio includes **EAM** (enterprise asset management — now divested to Hexagon as HxGN EAM, running on PostgreSQL/Oracle with REST/GraphQL APIs and IoT/MQTT ingestion), **WMS** (warehouse management with unified warehouse/transportation/labor/3PL in a single database), **PLM Optiva** (formula/recipe management for process industries with stage-gate project methodology), **CRM** (formerly SalesLogix, using SData REST API on SQL Server), **Nexus** (multi-enterprise supply chain network connecting 94,000+ brands, formerly GT Nexus), **HCM** (core HR, payroll, benefits), **WFM** (workforce scheduling with Workbrain engine), **CPQ** (visual product configuration with 2D/3D), **d/EPM** (budgeting, planning, consolidation), **Talent Science** (psychometric assessments), and **IDM** (document management).

**Infor OS** is the binding platform layer. **ION** (Intelligent Open Network) provides publish-subscribe middleware using OAGIS-standard BODs (SyncItemMaster, ProcessPurchaseOrder, etc.), with connection types including Application Connectors, Web Service Connectors, File Connectors (SFTP), and JMS. **ION API Gateway** handles REST/SOAP with OAuth 2.0 authentication. **ION MEC** enables database-trigger-based integration. **Ming.le** provides the portal/collaboration layer. **Infor Data Lake** centralizes data on AWS S3/Athena. **Birst** delivers networked BI with patented centralized/decentralized analytics. **Coleman AI** (built on AWS SageMaker) provides cognitive search, predictive analytics, and OCR. **Infor Federation Services (IFS)** handles SAML 2.0 SSO and OAuth 2.0 across the entire portfolio.

### Key technical notes for extraction

Infor's portfolio runs on **5+ RDBMS platforms** (Oracle, SQL Server, DB2, PostgreSQL, proprietary), creating extraction adapter complexity. All modern Infor-to-Infor integration flows through ION middleware with BODs. Both LN and M3 have non-intuitive data models requiring specialized expertise — LN embeds company numbers in table names with binary text storage, while M3 uses cryptic 6-character abbreviations. Each product has its own customization paradigm: BOL/4GL (LN), MAK/XtendM3 (M3), IDO Extensions/.NET (CSI), Design Studio (Lawson).

---

## Part 2: SAP S/4HANA target landscape

### The Universal Journal revolution

SAP S/4HANA's most fundamental architectural change is **ACDOCA — the Universal Journal**. This single table with 500+ fields consolidates data previously stored across 6+ tables: GL (GLT0/FAGLFLEXA), Controlling (COEP/COSS/COSP), Asset Accounting (ANEP/ANLP/ANLC), Material Ledger (MLIT), and CO-PA. It supports up to **999,999 line items** per document (vs. 999 in legacy BSEG) and **10 parallel currencies** (vs. 3 in ECC). Index tables BSIS, BSAS, BSID, BSAD, BSIK, BSAK are eliminated entirely. This means all Infor financial sub-ledger data converges into a single target structure.

Other critical S/4HANA data model changes include: **Business Partner (BP) unification** — `BUT000` replaces separate `KNA1` (customer) and `LFA1` (vendor) tables via CVI (Customer-Vendor Integration); **MATDOC** replaces `MKPF/MSEG` for material documents; **PRCD_ELEMENTS** replaces `KONV` for pricing conditions; and **VBUK/VBUP are eliminated** with status fields absorbed into `VBAK/VBAP`.

### Core modules and key tables

SAP S/4HANA organizes into Lines of Business: **Finance** (BKPF/ACDOCA), **Sourcing & Procurement** (EKKO/EKPO, MATDOC, EBAN), **Sales** (VBAK/VBAP, LIKP/LIPS, VBRK/VBRP), **Manufacturing** (AFKO/AFPO/AFVV, STKO/STPO, PLKO/PLPO), **Asset Management** (EQUI, IFLOT, AUFK, QMEL), **Extended Warehouse Management** (now embedded in S/4HANA), **Transportation Management** (also embedded), **EHS**, **RE-FX** (real estate), and **PLM**. The cloud solutions portfolio adds **SuccessFactors** (HR), **Sales/Service/Commerce Cloud** (CX), **Ariba** (procurement network), **SAP Analytics Cloud** (planning/BI), **IBP** (supply chain planning), **Signavio** (process mining/modeling), and **Joule/Business AI** (now going agentic with LLM-powered agents).

### SAP BTP and Clean Core

**SAP Business Technology Platform** is the extension and integration backbone — with Integration Suite (10,500+ pre-built integration flows, 160+ third-party connectors), SAP Build (low-code/pro-code), ABAP Cloud, Kyma runtime, HANA Cloud, Datasphere, and AI Core. The **Clean Core strategy** now uses a 4-level A-D rating system: Level A (only released APIs, fully upgrade-safe), Level B (classic APIs like BAPIs/RFCs), Level C (internal objects without stability contracts), Level D (modifications, direct table writes — must be eliminated). For competitive migrations, Clean Core is a **major advantage**: starting greenfield means zero technical debt, 100% Level A extensibility, and the fastest innovation adoption path.

---

## Part 3: Infor-to-SAP product and data mapping

### Master data mappings with field-level precision

**Item/Material Master (LN):** `tcibd001.item` → `MARA-MATNR` (up to 40-character alphanumeric in S/4HANA), `tcibd001.dsca` → `MAKT-MAKTX`, `tcibd001.cuni` → `MARA-MEINS` (requires ISO UoM conversion), `tcibd001.kitm` (purchased/manufactured flag) → `MARA-MTART` + `MARC-BESKZ`, `tcibd001.csig` (item group) → `MARA-MATKL` (requires value mapping table). Plant-level data from `tcibd001` maps to `MARC`, warehouse data from `whwmd210/whwmd400` maps to `MARD`, and valuation data from `tcibd002` maps to `MBEW`.

**Item/Material Master (M3):** `MITMAS.MMITNO` → `MARA-MATNR`, `MITMAS.MMITDS` → `MAKT-MAKTX`, `MITMAS.MMUNMS` → `MARA-MEINS`, `MITMAS.MMITGR` → `MARA-MATKL`, `MITMAS.MMITCL` → `MARA-MTART`. Facility-level data from `MITFAC` maps to `MARC`, warehouse balances from `MITBAL` map to `MARC/MARD`, and supplier relationships from `MITVEN` map to purchasing info records `EINA/EINE`.

**Business Partners:** LN's `tccom100` stores customers AND vendors with role assignments, mapping directly to SAP's BP model: `tccom100` → `BUT000` (general), `tccom110` → `BUT020/ADRC` (addresses), `tccom112` → `BUT021_FS` (contacts), `tccom120` → `BUT0BK` (bank details), `tccom130` (customer-specific) → `KNVV` (sales area data). The critical transformation: if an entity is both customer AND vendor in Infor, SAP creates ONE BP with dual roles (FLCU00/FLCU01 for customer, FLVN00/FLVN01 for vendor), linked via `CVI_CUST_LINK` and `CVI_VEND_LINK`. Number ranges must be aligned so BP# = Customer# = Vendor#.

**Financial Data:** LN's `tfgld100` (GL header) → `BKPF`, `tfgld101` (GL lines) → `ACDOCA`, `tfgld010` (chart of accounts) → `SKA1/SKAT`. M3's `FGLEDG` → `ACDOCA`, `FSLEDG` (AR sub-ledger) → `ACDOCA`, `FPLEDG` (AP sub-ledger) → `ACDOCA`, `FCHACC` → `SKA1/SKAT`. Lawson's `GLMASTER` → `SKA1/SKAT/SKB1`, `GLDETAIL` → `ACDOCA`, `APVENMAST` → `BUT000/LFA1` (BP vendor role), `ARMASTER` → `BUT000/KNA1` (BP customer role). The Lawson-specific challenge: its flat accounting string (Company-Account-SubAccount-Department) must be decomposed into SAP's multi-dimensional structure (Company Code, GL Account, Cost Center, Profit Center, etc.).

**Sales and Purchasing:** LN `tdsls400/401` → `VBAK/VBAP` (with `tdsls400.orno` → `VBAK-VBELN`, `tdsls400.ofbp` → `VBAK-KUNNR` via BP mapping), M3 `OOHEAD/OOLINE` → `VBAK/VBAP`, LN `tdpur400/401` → `EKKO/EKPO`, M3 `MPHEAD/MPLINE` → `EKKO/EKPO`. Manufacturing: LN `tibom001/tibom110` → `STKO/STPO` (BOMs), `tirou001/002` → `PLKO/PLPO` (routings), M3 `MPDHED/MPDMAT` → `STKO/STPO`, `MWOHED` → `AUFK/AFKO/AFPO` (production orders).

### Supporting solutions mapping

| Infor Solution | SAP Target | Key Mapping Notes |
|---|---|---|
| EAM | SAP PM/EAM (EQUI, IFLOT, AUFK) | Equipment records, functional locations, work orders, PM schedules |
| WMS | SAP EWM (embedded) | Warehouse structure, bin locations, storage types, picking strategies |
| HCM/WFM | SAP SuccessFactors | Employee data, org structures, payroll, time management |
| CRM | SAP Sales Cloud | Accounts, contacts, opportunities via SData → SAP CX APIs |
| PLM Optiva | SAP PLM / Engineering Control Center | Product structures, specifications, change management |
| SCM/Nexus | SAP IBP | Demand plans, supply plans, S&OP scenarios |
| Birst | SAP Analytics Cloud | Reports, dashboards, data models — rebuild required |
| d/EPM | SAP Analytics Cloud / BPC | Budget structures, planning models, consolidation rules |
| CPQ | SAP CPQ | Product configurations, pricing rules, quote templates |
| Coleman AI | SAP Business AI / Joule | AI models, predictive analytics — platform shift |
| IDM | SAP DMS / OpenText | Document types, archive structures, workflows |

### Interface architecture mapping

Infor ION maps to SAP BTP: ION Connect → SAP Integration Suite (Cloud Integration), ION API Gateway → SAP API Management, ION Workflow → SAP Build Process Automation, ION Mapper → Integration Suite Message Mapping, ION Desk → Integration Suite Monitoring. Standard BODs map to SAP IDocs or OData APIs: SyncItemMaster → IDoc `MATMAS` / `API_PRODUCT_SRV`, SyncSalesOrder → IDoc `ORDERS` / `API_SALES_ORDER_SRV`, SyncPurchaseOrder → `API_PURCHASEORDER_PROCESS_SRV`, SyncSupplierPartyMaster → IDoc `CREMAS` / BP API.

### Organizational structure transformation

The organizational mapping is foundational: Infor LN Company → SAP Company Code (`BUKRS`), LN Logistic Company → SAP Plant (`WERKS`), LN Sales Office → SAP Sales Org (`VKORG`), LN Warehouse → SAP Storage Location (`LGORT`) or EWM Warehouse. For M3: Company (`CONO`) → Company Code, Division (`DIVI`) → Business Area / Profit Center, Facility (`FACI`) → Plant, Warehouse (`WHLO`) → Storage Location. For Lawson: Company → Company Code, Accounting Unit → Profit Center / Cost Center.

---

## Part 4: Industry-specific migration across 10 verticals

### Aerospace & defense has partner-dependent gaps

Infor CloudSuite A&D (based on LN) offers native MRO processing, ITAR/EAR export control, DFARS/FAR government contract accounting, and unit/revision/serial effectivity BOM management. SAP requires **CIS-GovCon** (Cognitus partner solution) for DCAA-compliant government contract accounting, **SAP GTS** as a separate deployment for ITAR/EAR handling, and **SAP NS2 GovCloud** for ITAR-classified data hosting. Infor's BOM effectivity model (per-sales-order-line configuration) is deeper natively than SAP's standard structures. Compliance requirements span ITAR, EAR, DFARS/FAR, CAS, DCAA, CMMC 2.0, NIST SP 800-171, AS9100, and FedRAMP.

### Automotive requires middleware for EDI parity

Infor CloudSuite Automotive has **200+ preconfigured EDI connectors** for OEM integration (VDA, Odette, AIAG, EDIFACT), native MMOG/LE compliance tracking, and Sales Release Management with business rule controls. SAP's JIT/JIS processing is capable but requires EDI middleware (Seeburger, OpenText) for equivalent OEM connector coverage. MMOG/LE compliance monitoring must be configured externally. Key migration objects include scheduling agreements/releases, EDI partner profiles, JIT call sequences, and kanban control cycles.

### Food & beverage presents unique data model challenges

Infor M3's food-specific data model includes native catch weight handling, grower accounting (no SAP equivalent exists), attribute-rich item management, and visual lot traceability with forward/backward genealogy. SAP covers catch weight natively in S/4HANA, uses PP-PI for recipe management, and provides batch management for lot tracing — but allergen management requires SAP Specification Management or partner solutions, and **grower accounting has no SAP standard equivalent**. The compliance landscape includes FDA FSMA, HACCP, GFSI (BRC, SQF, FSSC 22000), and country-specific labeling laws.

### Fashion faces architectural divergence

The **most architecturally challenging** vertical: Infor M3's native style-color-size matrix is fundamentally different from SAP's Generic Articles + Variants structure (evolved from the former IS-Retail/AFS architecture). SAP's J-tables from AFS must be migrated to S/4HANA Generic/Variant tables — SAP itself states brownfield migration from AFS to S/4HANA Fashion is "essentially impractical" and generally requires greenfield. Royalty Management is native in Infor but requires custom SAP development.

### Healthcare and public sector have significant functional gaps

Infor CloudSuite Healthcare (Lawson-based) provides physician preference cards, surgical case costing, 340B split billing, and clinical supply chain management — **none of which have SAP standard equivalents**. SAP IS-H focuses on clinical/patient management while Infor focuses on the financial/supply chain backbone. For public sector, Infor's Community Development module (permitting, inspections, code enforcement, GIS integration, citizen portals) has **no SAP equivalent** — organizations need separate solutions like Tyler Technologies when migrating.

### Where SAP exceeds Infor capabilities

SAP's EHS Management for **chemicals** is arguably more comprehensive than Infor's chemical compliance capabilities (REACH, GHS, SDS authoring). SAP PP-DS detailed scheduling and IBP planning exceed Infor's native APS in many manufacturing scenarios. SAP Analytics Cloud + Datasphere provides more powerful cross-enterprise analytics. SAP's supply allocation management (aATP) for fashion is sophisticated.

---

## Part 5: Forensic assessment engine architecture

### Seven automated extraction dimensions

A production forensic assessment engine requires product-specific adapters connecting via ION API Gateway (OAuth 2.0) for cloud or direct JDBC/ODBC for on-premises, executing predefined extraction queries across seven dimensions:

**Configuration Extraction** pulls organizational structures (LN: `tcemm030/tcemm040` entity hierarchies; M3: `CRS600MI` companies, `MMS200MI` warehouses; Lawson: Process Level → Company → Accounting Unit), module parameters (LN: `tfgld0100s000` GL parameters; M3: program-specific settings via MI programs), and chart of accounts structures (LN: `tfgld010`; M3: `FCHACC`; Lawson: `GLMASTER`).

**Customization Discovery** inventories all modifications by comparing customer VRC against standard Infor VRC. For LN: scan `ttadv` sessions for custom BOL scripts, query `ttadv2100` for customer-owned sessions, compare database schema against standard data dictionary. For M3: connect to MAK for modified programs (or XtendM3 for cloud), query MRS001 for custom MI transactions, inventory MEC maps and partner agreements. For CSI: scan IDO Runtime for custom .NET assemblies, query form metadata for modifications, catalog SQL Server stored procedures. For Lawson: export Design Studio projects, inventory PFI flows, catalog Landmark customizations.

**Data Quality Profiling** runs automated SQL-based profiling: record counts per entity, null/blank percentages per field, uniqueness metrics, min/max/average field lengths, date range distributions, referential integrity violations (orphan records without valid parents), and duplicate detection using fuzzy matching algorithms (Levenshtein distance, Jaro-Winkler). The output is a per-entity quality score (0-100) covering completeness, accuracy, consistency, uniqueness, and timeliness.

**Process Mining** extracts event logs from Infor audit trails (LN: `ttaud` tables; M3: Event Analytics/EventHub; Lawson: audit trail + PFI execution logs), constructs case-ID/activity/timestamp records for key processes (O2C, P2P, Plan-to-Produce, R2R), and feeds them through SAP Signavio or Celonis for conformance checking against SAP best practices. Budget **2-4 weeks** for event log ETL per major process, since pre-built process mining connectors primarily target SAP sources.

**Security Assessment** extracts role matrices: LN authorization ranges from `ttaad` tables, M3 function authorities from `CMNFCN` table (users assigned levels 0-9 per program), CSI permission groups, and Lawson security classes. An SOD rules engine cross-references user-role assignments against conflict matrices (e.g., "Create Vendor" + "Approve Payment" = violation), flagging all violations with severity levels.

**Interface Inventory** catalogs all ION connection points (Application, Web Service, File, JMS connectors), BOD definitions and routing rules, MEC maps, EDI connections, file-based interfaces, direct API integrations, and third-party system connections. Each interface is documented with direction, protocol, frequency, volume, and business criticality.

**Report, Batch Job, and Business Rules Extraction** inventories all custom reports (LN: `ttadv7500`; M3: Smart Office list views; Birst space definitions; Lawson LBI reports), batch job schedules (LN: `ttjmg`; M3: `SHS010`; Lawson: Process Scheduler), and business rules from ION Workflows, pricing algorithms, approval hierarchies, and alert conditions.

### Migration complexity scoring algorithm

The assessment output uses a composite scoring formula:

```
Score = (Customization_Count × Complexity_Weight × 0.25) +
        (Interface_Count × Interface_Complexity × 0.15) +
        (Data_Volume × (1 - Quality_Index/100) × 0.25) +
        (Process_Variant_Count × 0.15) +
        (SOD_Violation_Count × 0.05) +
        (Module_Count × Config_Complexity × 0.10) +
        (Batch_Job_Count × 0.05)
```

Normalized to a 1-10 scale: 1-3 = Low (6-12 months), 4-6 = Medium (12-24 months), 7-8 = High (18-36 months), 9-10 = Very High (24-48 months). The report includes module-by-module ratings, data quality scorecards, customization disposition recommendations (Retire/Replace/Rebuild/Rehost), interface migration priorities, and security role mapping matrices.

---

## Part 6: Claude Code as the AI orchestration brain

### Why Claude Code is architecturally suited for ERP migration

Claude Code is not merely a coding assistant — it operates as an **agentic runtime** with full terminal/shell access, file system operations, Git management, and native MCP tool integration. Key capabilities that make it uniquely suited for ERP migration:

- **Subagent architecture**: Spawns specialized subagents (7+ simultaneously) for parallel task execution, each with independent context, tools, and permissions. Built-in types include general-purpose (full tool access), Explore (read-only codebase search), and Plan (architecture planning).
- **Checkpoints and rollback**: Automatic state saving before each change with instant rewind — critical for migration safety.
- **Hooks system**: Triggers actions at specific points (validation after data load, approval gates before production writes).
- **Agent Skills**: Filesystem-based knowledge packages encoding ERP migration patterns, SAP best practices, and Infor domain knowledge — reusable across engagements.
- **MCP Tool Search**: Dynamically loads tools on-demand when tool count exceeds 10% of context window.
- **Long-horizon execution**: Tasks running 30+ hours with Sonnet 4.5, with memory files for persistent state across sessions.

Performance benchmarks show **82% on SWE-bench Verified** (Sonnet 4.5 with parallel compute) and 0% code editing error rate on internal benchmarks, confirming production-grade code generation capability.

### MCP server architecture for ERP connectivity

The Model Context Protocol (MCP), introduced by Anthropic in November 2024 and now adopted by OpenAI and Google DeepMind, standardizes AI agent connections to external tools via JSON-RPC 2.0. It uses OAuth 2.1 with mandatory PKCE, RFC 9728 Protected Resource Metadata, and Dynamic Client Registration for enterprise-grade security.

**Infor MCP Server** (Python): Connects to ION API Gateway via OAuth 2.0 service account flow, exposing tools for BOD queries (`infor_query_bod`), M3 API execution (`infor_execute_m3api`), Data Lake queries (`infor_query_datalake`), workflow reading (`infor_get_workflow`), and direct JDBC profiling (`infor_profile_db`). Resources expose BOD schemas, ION Mapper configurations, and data dictionaries.

**SAP MCP Server**: An existing open-source SAP OData MCP Server (by Wouter Lemaire) **dynamically discovers all OData services** from SAP's catalog service (`/sap/opu/odata/IWFND/CATALOGSERVICE;v=2`) and auto-generates MCP tools for CRUD operations. A hierarchical mode uses just 4 unified tools regardless of service count. RFC connectivity via PyRFC exposes BAPI calls for functions not available via OData. Authentication flows through XSUAA + Destination Service on BTP.

**Database MCP Server**: Generic SQL connector for Oracle, SQL Server, DB2 with connection pooling, read-only profiling mode, schema discovery, and data quality statistics. Security uses vault integration (HashiCorp Vault or AWS Secrets Manager) with read-only connections for assessment and separate write-enabled connections for execution phases.

### Five autonomous agent workflows

**Forensic Assessment**: Claude Code lead agent spawns parallel subagents — Org Discovery (queries BODs for company/site/user structures), Data Profiler (profiles all tables via JDBC), and Customization Auditor (inventories modifications via API/filesystem scanning). A Report Generator subagent synthesizes findings into a migration-readiness report with complexity scores. Human checkpoint required before proceeding.

**Migration Planning**: Analyzes assessment output, generates source-to-target field mappings (Infor BOD fields → SAP entity fields), creates phased migration plans (Foundation → Master Data → Open Items → Transactional → Cutover), identifies functional gaps requiring development, and produces migration runbooks as code (YAML/JSON).

**Data Transformation**: Claude Code generates and executes ETL pipelines in Python/SQL. The key differentiator: it generates transformation code **on the fly** based on specific mapping requirements. When encountering novel patterns (e.g., Infor's 3-segment cost centers vs. SAP's 4-segment), Claude reasons about the business logic and generates appropriate transformation code rather than forcing data through pre-built templates.

**Custom Application Development**: Claude Code builds full-stack applications autonomously — vendor portals (React/Next.js + Python/Node + SAP OData), procurement suites, migration dashboards — using parallel subagents for frontend, backend, testing, and DevOps simultaneously.

**Process Mining**: Extracts transaction logs from Infor databases, generates process discovery code using Python + pm4py, discovers actual vs. documented process flows, and compares against SAP best practices embedded in Agent Skills.

### Four-tier security architecture

| Tier | Access Level | Approval |
|---|---|---|
| **1: Assessment** | Read-only: query BODs, read config, profile DB, query SAP metadata | Auto-approved |
| **2: Development** | Workspace write: generate code, create files, run tests, write staging DBs | Auto-approved with logging |
| **3: Staging** | Controlled write: create/update in SAP sandbox/QA, DML to staging tables | Phase-level approval required |
| **4: Production** | Gated write: production SAP writes, with real-time reconciliation | Explicit human approval per batch |

Each tier maps to separate MCP server instances with different connection strings and OAuth scopes. All tool calls are logged with timestamp, agent ID, tool name, parameters, result summary, duration, and checkpoint ID — ensuring SOX/audit compliance. Claude Code's Hook system blocks production writes pending approval:

```bash
if [[ "$MCP_TOOL" == "sap_create_entity" && "$ENVIRONMENT" == "production" ]]; then
  echo "⚠️ PRODUCTION WRITE - Requires approval"
  exit 1  # Blocks until human approval
fi
```

---

## Part 7: Migration methodology and compliance

### SAP Activate drives the process

SAP Activate's 6 phases structure the migration: **Discover** (map source processes to SAP standard using Signavio Process Insights), **Prepare** (establish data mapping strategy), **Explore** (Fit-to-Standard workshops replacing traditional blueprinting — validate SAP Best Practices against current Infor processes, document gaps as RICEFW backlog), **Realize** (agile sprint-based configuration, ETL development, iterative data validation), **Deploy** (cutover execution, final data load, user training), **Run** (hypercare, continuous improvement).

**SAP Migration Cockpit** (transaction `LTMC`, Fiori app "Migrate Your Data") is the primary loading tool. For competitive migrations, the **file-based approach** is primary: extract from Infor → transform to SAP XML/CSV template → upload. It provides **200+ pre-defined migration objects** covering Business Partners, Materials, GL Accounts, Cost Centers, Open Items, Sales/Purchase Orders, BOMs, Production Orders, Fixed Assets, and more. The recommended greenfield migration sequence: Organizational Structure → Chart of Accounts → Business Partners → Material Masters → BOMs/Routings → Pricing Conditions → Open Balances → Open Transactions → Fixed Assets → Historical Data (selective).

### Compliance must be embedded from day one

**SOX**: Maintain ICFR throughout migration with S/4HANA's Auditor Direct Access SOX Compliance Dashboard, enforce SoD via SAP GRC Access Control, ensure audit trails for all master data changes, and run multi-layered testing (technical validation with 1,000+ rules, business process, integration, UAT, performance). **GDPR**: Apply data minimization during migration (only necessary data), identify and protect PII across all extraction/transformation/load phases, leverage S/4HANA's ILM (Information Lifecycle Management) for right-to-be-forgotten. **GxP/21 CFR Part 11**: Implement computer system validation, electronic signatures, and audit trails for life sciences. **ISO 20022**: S/4HANA supports ISO 20022 payment formats for financial data migration. Execute at least **2 full dress rehearsals** before production cutover.

---

## Part 8: Competitive landscape and differentiation

### Existing tools leave gaps that SEN fills

**SNP CrystalBridge** (now Kyano Platform) pioneered the Bluefield™ approach — selective data transition combining greenfield and brownfield. It excels at SAP-to-SAP transformations (14,000+ successful projects, PwC-certified), but is primarily SAP-centric, proprietary, high-cost, and requires specialized consultants. Its newer AI-driven data model discovery for third-party sources is nascent.

**Syniti** (SAP Platinum Partner, resold by SAP as "SAP ADMM") provides the strongest data migration/quality platform with 150+ source system reference models, pre-built SAP BP harmonization packs, and AI/ML for tracking migration patterns. Performance metrics include **46% increased project efficiency** and **95% reduction in data quality errors** (per IDC). However, it focuses on data migration/quality rather than full assessment, requires significant human configuration, and has no custom application development capability.

**Informatica** offers the broadest horizontal data integration but lacks ERP-specific assessment, process analysis, or transformation intelligence. **Precisely** (Assure, Automate for SAP) focuses on data integrity and compliance. **OpenText** handles content/document management and testing. **KTern.AI** provides SaaS-based S/4HANA digital transformation assessment but operates only at the business application layer with no database connectivity. **Panaya** offers AI-powered conversion analysis (48-hour assessment, 98% code remediation reduction) but is SAP-to-SAP only.

### SEN's seven-axis differentiation

| Dimension | Traditional Tools | SEN |
|---|---|---|
| Architecture | Proprietary commercial | AI-native (Claude Code autonomous agent), open-source |
| Assessment | Surface-level or single-dimension | Exhaustive forensic across all 7 dimensions simultaneously |
| Coverage | Point solutions (data OR testing OR content) | End-to-end: assessment → migration → custom app development |
| Source Systems | SAP-centric or general-purpose | Universal: all ERPs → SAP (starting Infor, expanding) |
| Intelligence | Rule-based automation, static templates | AI reasons about business logic, generates bespoke transformation code |
| Learning | Static accelerators | Continuous pattern accumulation via Agent Skills across engagements |
| Cost | High license fees + consulting | Open-source with services model |

---

## Part 9: Future expansion to all ERP systems

### Universal data model enables N+M scaling

A canonical data model — aligned with **OAGIS/connectSpec** (the 27-year-old OAGi standard defining Business Object Documents with Noun+Verb structure, now at version 10.12) — serves as an intermediary between any source ERP and SAP. This prevents combinatorial explosion: instead of N×M point-to-point translators, only N source adapters + M target adapters are needed. Core entities present across ALL ERPs: Items/Products, Customers, Vendors, Chart of Accounts, Sales Orders, Purchase Orders, Production Orders, Inventory, GL Entries, Employees, BOMs, Routings, Fixed Assets, Cost Centers.

### Architecture snapshots for 11 future source systems

**Oracle EBS**: Exclusively Oracle DB, PL/SQL APIs, OA Framework, key tables `HR_ALL_ORGANIZATION_UNITS`, `PO_HEADERS_ALL`, `GL_JE_HEADERS`, `AP_INVOICES_ALL`, `MTL_SYSTEM_ITEMS_B`, `HZ_PARTIES` (TCA model). **Oracle Cloud ERP**: REST APIs (primary), FBDI for bulk import, OTBI for analytics; managed Oracle DB (no customer access). **JD Edwards**: Database-agnostic via CNC architecture, Business Functions (BSFNs), key tables F0101 (Address Book), F4211 (Sales Detail), F0911 (Account Ledger), F4101 (Item Master). **PeopleSoft**: PeopleTools framework, Component Interface, Integration Broker, tables PS_JOB, PS_PERSONAL_DATA, PS_VOUCHER.

**Dynamics 365 F&O**: Azure SQL, OData REST APIs via Data Entities (1000s pre-built), DMF for bulk operations, X++ customization. **Business Central**: AL extensions, REST/OData APIs v2.0, Azure AD OAuth 2.0. **Dynamics GP**: SQL Server, eConnect (XML), Dexterity customization.

**Epicor Kinetic**: SQL Server, RESTful OData APIs, BPMs for custom logic triggers, BAQs for queries, C# for deep customization. **IFS Cloud**: Oracle DB, REST/IFS Connect, PL/SQL-based, IFS Aurena UI. **QAD**: Progress OpenEdge (native) or Oracle/SQL Server, Progress 4GL (ABL), REST APIs. **NetSuite**: Managed Oracle DB (no direct access), SuiteTalk SOAP API (most mature), REST API (OAuth 2.0), SuiteScript 2.x (JavaScript), SuiteQL for queries. **Workday**: Proprietary in-memory object database, SOAP WWS API (primary for complex ops), REST API (growing coverage), EIBs for integration, calculated fields for customization.

**Sage X3**: SQL Server/Oracle, Syracuse (Node.js) technology, GraphQL Web API + 4GL scripting. **Sage Intacct**: Managed SQL Server SaaS, REST/XML APIs, Platform Services custom objects. **Acumatica**: SQL Server, Contract-Based REST API, .NET/C# customization framework, consumption-based pricing. **Plex**: Cloud-native SQL Server, REST APIs, Plex Connect integration platform, manufacturing-focused MES+ERP. **Unit4**: SQL Server, ERPx microservices, REST APIs, OAuth 2.0/SAML 2.0.

---

## Conclusion: A platform whose time has come

Three converging forces make SEN viable now in ways it wasn't before. **First**, Claude Code's agentic capabilities — terminal access, MCP integration, multi-agent parallelism, long-horizon execution, and production-grade code generation at 82% SWE-bench — provide the autonomous intelligence layer that no traditional migration tool offers. **Second**, the MCP protocol (now adopted by Anthropic, OpenAI, and Google DeepMind) standardizes AI-to-system connectivity, enabling a single platform to connect to any ERP via purpose-built MCP servers rather than proprietary adapters. **Third**, SAP's Clean Core strategy and the greenfield migration opportunity mean competitive displacements start with zero technical debt — the ideal foundation for an AI-native platform to operate against.

The research reveals clear architectural priorities for building SEN. Start with **Infor LN and M3** as the primary source systems — they represent the largest competitive displacement opportunity with the most complex data models (binary text storage, company-suffixed table names, cryptic field abbreviations). Build MCP servers for ION API Gateway, direct database access (JDBC), and SAP OData/RFC. Implement the canonical data model aligned with OAGIS for future source system expansion. The forensic assessment engine should automate all seven extraction dimensions simultaneously using Claude Code's subagent parallelism. Industry-specific migration packages should prioritize the verticals with the fewest SAP gaps — chemicals, distribution, and industrial manufacturing — while building partner solution integrations for verticals with significant gaps (healthcare, public sector, equipment rental, A&D government contracting).

The competitive landscape validates the opportunity: no existing tool provides AI-native autonomy, open-source accessibility, and end-to-end coverage. SNP and Syniti are strong but SAP-centric, proprietary, and human-dependent. SEN fills a definable market gap — and with each migration, its Agent Skills accumulate patterns that make subsequent migrations faster, creating a compounding advantage that traditional template-based tools cannot replicate.