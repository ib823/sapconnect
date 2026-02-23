# Security Audit (OWASP + System Risks)

Status legend: **VERIFIED / EVIDENCE-PARTIAL / BLOCKED**.

## Findings table

### SEC-001 — CORS wildcard with credentials enabled
- Severity: **High**
- Status: **VERIFIED**
- Evidence:
  - `lib/security/helmet.js` sets `Access-Control-Allow-Origin: *` when wildcard configured, and also always sets `Access-Control-Allow-Credentials: true`.
- Risk:
  - Misconfigured CORS can cause credentialed cross-origin behavior inconsistencies and unsafe browser/client assumptions.
- Mitigation:
  1. Disallow `*` when credentials are enabled.
  2. Enforce explicit allowlist for production origins.
  3. Add startup validation: fail boot if `origins=['*'] && credentials=true`.
- Verification:
  - Integration test asserting response headers by origin and credential mode.

### SEC-002 — API key accepted via query parameter
- Severity: **High**
- Status: **VERIFIED**
- Evidence:
  - `lib/security/api-key-auth.js` accepts `req.query.apiKey`.
- Risk:
  - Query strings leak in browser history, logs, reverse proxies, analytics, and referrer headers.
- Mitigation:
  1. Remove query-param auth path; allow header only (`X-API-Key` or `Authorization: Bearer`).
  2. Add migration deprecation window with warning logs.
- Verification:
  - Unit test: query param rejected with 401/403, header accepted.

### SEC-003 — CSP allows unsafe script execution modes
- Severity: **Medium**
- Status: **VERIFIED**
- Evidence:
  - `lib/security/helmet.js` CSP includes `'unsafe-inline'` and `'unsafe-eval'` for scripts.
- Risk:
  - Weakens XSS defenses and increases exploitability for injection bugs.
- Mitigation:
  1. Move to nonce/hash-based CSP for scripts.
  2. Remove `'unsafe-eval'` and `'unsafe-inline'` where feasible.
- Verification:
  - Security header tests + frontend CSP compatibility checks.

### SEC-004 — API auth defaults can run effectively open in dev mode
- Severity: **Medium**
- Status: **VERIFIED**
- Evidence:
  - `server.js` logs API key auth mode enabled/disabled based on config; `ApiKeyAuth` middleware bypasses checks when key is unset.
- Risk:
  - Risk of accidental deployment without auth if environment variable is omitted and no alternative auth enforced.
- Mitigation:
  1. In production mode, require explicit auth strategy + key/JWT setup; fail fast otherwise.
  2. Add readiness check for auth state.
- Verification:
  - Boot-time tests for production config with missing auth secrets should fail.

### SEC-005 — Security claims in docs exceed directly verified controls
- Severity: **Low**
- Status: **EVIDENCE-PARTIAL**
- Evidence:
  - Security docs assert broad guarantees (e.g., no credential storage, regular dependency audits), but audit evidence for operational enforcement pipeline was incomplete in-repo.
- Risk:
  - Documentation drift may create false confidence and compliance gaps.
- Mitigation:
  - Attach machine-verifiable evidence artifacts to claims (CI reports, scan outputs, controls mapping).
- Verification:
  - Evidence links in docs to generated artifacts.

## Additional checks

- Lint and test suites pass, which supports baseline code health but is not a substitute for security assurance. **VERIFIED**.
- `npm audit` vulnerability check is **BLOCKED** due endpoint response 403.

