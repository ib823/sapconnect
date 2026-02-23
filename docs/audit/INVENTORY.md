# Repository Inventory & Architecture Map

Status legend: **VERIFIED** (direct repo evidence), **EVIDENCE-PARTIAL** (some evidence, but context missing), **BLOCKED** (cannot verify from provided data).

## 1) Scope + context resolution

- Product intent: connect ERP data and allow AI LLM CLI to execute work. **VERIFIED** (user-provided scope).
- "Must not break": all interfaces are in scope. **EVIDENCE-PARTIAL** (no concrete interface contract list).
- Gold standard: best-practice code structure and engineering quality. **EVIDENCE-PARTIAL** (no numeric SLO/SLI).
- Deployment: cloud model. **EVIDENCE-PARTIAL** (no specific platform/runtime image baseline beyond repo files).
- Environment model: single environment only. **EVIDENCE-PARTIAL**.
- Sensitive assets: all connected tenant data. **VERIFIED** (user-provided).
- Compliance baseline: "best practice compliances" with no specific framework list. **BLOCKED** for formal compliance mapping.

## 2) Technology inventory

### Backend/runtime
- Node.js project root with engine >=20 and Express/CAP dependencies. **VERIFIED**.
  - Evidence: `package.json` defines `"node": ">=20.0.0"`, dependencies `@sap/cds`, `@sap/xssec`, `express`, `passport`.
- Server bootstrap in `server.js` wires security, monitoring, migration, forensic, process-mining, and cloud routers. **VERIFIED**.

### Frontend
- Separate Next.js website app in `website/` using Next 15 and React 19. **VERIFIED**.
  - Evidence: `website/package.json` dependency set.

### SAP/enterprise deployment
- Cloud Foundry MTA descriptor with XSUAA and HANA service resources. **VERIFIED**.
  - Evidence: `mta.yaml` modules/resources (`sapconnect-uaa`, `sapconnect-db`).

### Containers/orchestration
- Dockerfile multi-stage build and compose file are present. **VERIFIED**.

## 3) Entrypoints and module boundaries

- API server entrypoint: `node server.js` (`start:api`) and CAP `cds-serve` (`start`). **VERIFIED**.
- Agent CLI entrypoint: `agent/agent.js` (`npm run agent`) for multi-agent workflow commands. **VERIFIED**.
- MCP binary entrypoint: `bin/sen-mcp.js` (`npm run mcp`). **VERIFIED**.
- Major module groups detected: `lib/`, `migration/`, `extraction/`, `agent/`, `srv/`, `website/`. **VERIFIED**.

## 4) Trust boundaries and data-flow map

### External inputs
1. HTTP requests into Express REST server (`/api/*`, `/health`, `/metrics`, SSE). **VERIFIED**.
2. CLI requirements/flags passed to AI agent (`npm run agent -- ...`). **VERIFIED**.
3. Environment configuration (credentials, mode selection, auth strategy). **VERIFIED**.
4. Optional SAP/BTP service bindings (XSUAA credentials via `VCAP_SERVICES`). **VERIFIED**.

### Processing and control points
- Security middleware stack: headers, CORS, rate limiting, audit logging, auth strategy selection. **VERIFIED**.
- Routing to migration, forensic extraction, process mining, export, cloud APIs. **VERIFIED**.
- AI orchestration loop with role-based tool definitions and iterative tool calls. **VERIFIED**.

### Storage & state
- In-memory audit store by default (`AuditLogger({ store: 'memory' })`). **VERIFIED**.
- Persistence modes in docs mention SQLite/HANA; config defaults to sqlite in CAP. **EVIDENCE-PARTIAL** (production persistence usage path not fully validated in runtime).

### Outbound calls
- Potential outbound SAP calls via OData/RFC/ADT and cloud connectors. **VERIFIED** (code modules exist).
- LLM outbound provider calls for live mode (OpenAI/Anthropic/Azure abstraction). **VERIFIED**.

## 5) Inventory risks discovered during mapping

1. CORS defaults allow wildcard origin while also setting credentials, which is a high-risk configuration mismatch. **VERIFIED** (see SECURITY.md finding SEC-001).
2. API key may be supplied via query parameter (`req.query.apiKey`), increasing leak exposure in logs/URLs. **VERIFIED** (see SECURITY.md finding SEC-002).
3. Security header CSP allows `'unsafe-inline'` and `'unsafe-eval'`, reducing XSS hardening. **VERIFIED** (see SECURITY.md finding SEC-003).

## 6) Blockers from missing context

- Compliance mapping to SOC2/ISO/PCI controls is **BLOCKED** without explicit target framework + control catalog.
- Public API/CLI compatibility contract (versioning policy, deprecation policy) is **BLOCKED**.
- SLO/performance acceptance thresholds are **BLOCKED**.

