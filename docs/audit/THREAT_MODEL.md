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
- Fine-grained authorization policy (RBAC/ABAC) across all routes: **BLOCKED**.
- Data-classification-driven redaction policy: **BLOCKED**.

## Priority control improvements

1. Enforce strict origin allowlist + credential policy.
2. Remove query-string auth secret usage.
3. Add explicit route-level authorization matrix and tests.
4. Build outbound data-loss guardrails for LLM provider calls.
5. Add signed SBOM + provenance attestations in CI.

