# Threat Model

## System context

- Internet/client -> Express API -> migration/extraction engines -> SAP connectors -> tenant data stores.
- AI agent path: CLI/user prompt -> orchestrator -> LLM provider -> tool calls -> SAP side effects.

## Assets

1. Tenant ERP data (declared sensitive).
2. SAP credentials/tokens (env and service bindings).
3. Migration outputs/reports.
4. Audit logs and operational telemetry.

## Trust boundaries

1. External HTTP client to server boundary.
2. Server to SAP systems (RFC/OData/ADT) boundary.
3. Server/CLI to third-party LLM provider boundary.
4. Internal tool-call boundary between LLM outputs and executable actions.

## Key abuse cases

- Unauthorized API invocation.
- Prompt/tool abuse to trigger unsafe write operations.
- Data exfiltration through logs, exports, or model prompts.
- Misconfigured CORS enabling unwanted cross-origin interactions.
- Dependency compromise in npm supply chain.

## Existing mitigations (evidence level)

- Auth middleware (API key/XSUAA) on `/api/*`: **VERIFIED**.
- Rate limiter + audit logger middleware: **VERIFIED**.
- Max-iteration cap in orchestrator tool loop (`maxIterations` default 25): **VERIFIED**.
- XSUAA scope-based RBAC in `lib/security/xsuaa-auth.js` — Read/Write/Admin scopes with `requireScope()` middleware: **VERIFIED**.
- Tier-based operation classification in `lib/security/tier-manager.js` — 4 tiers with escalating approval requirements: **VERIFIED**.
- Multi-step approval gate in `lib/security/approval-gate.js` — prevents self-approval, enforces multi-approver thresholds for production operations: **VERIFIED**.
- Safety gates for LLM write tools (`write_abap_source`, `activate_object`) in orchestrator: **VERIFIED**.
- JSON schema validation on LLM tool inputs (fail-closed): **VERIFIED** (added 2026-02-23).
- Data redaction pipeline before LLM provider calls with per-call audit logging: **VERIFIED** (added 2026-02-23).
- CORS origin allowlist with wildcard+credentials guard: **VERIFIED** (fixed 2026-02-23).
- Production auth enforcement (fail-fast when API_KEY missing in production): **VERIFIED** (added 2026-02-23).

> **Correction (2026-02-23):** The original audit marked RBAC as "BLOCKED" — this was inaccurate. XSUAA scope-based RBAC, tier-manager, and approval-gate controls already existed. The redaction policy has now been implemented.

## Priority control improvements

1. ~~Enforce strict origin allowlist + credential policy.~~ **DONE** (2026-02-23).
2. ~~Remove query-string auth secret usage.~~ **DONE** (2026-02-23).
3. Add explicit route-level authorization matrix and tests.
4. ~~Build outbound data-loss guardrails for LLM provider calls.~~ **DONE** (2026-02-23).
5. Add signed SBOM + provenance attestations in CI.

