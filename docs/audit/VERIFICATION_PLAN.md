# Clearance-Grade Verification Plan

## 1) Test strategy

### Unit
- Security middleware behavior tests (CORS/auth/header policies).
- Tool-input validation tests for each LLM tool.

### Integration
- API route contract tests for all public `/api/*` and health/metrics endpoints.
- SAP connector integration in mock/live-simulated modes.

### E2E
- Golden user journeys for migration assess/remediate/profile/provision/test/cutover.
- Agent workflow end-to-end with safe mock gateway.

## 2) Negative security tests

- Auth bypass attempts (missing/invalid keys/JWTs).
- CORS abuse with unapproved origins.
- Query-string credential rejection.
- Injection probes on route params and payload fields.
- SSRF checks on any user-controlled URLs.

## 3) Fuzzing targets

- API payload fuzzing for migration and extraction endpoints.
- Tool-call input fuzzing for all agent tools.
- Parser fuzzing for importers (CSV/BPMN/metadata parsers).

## 4) Static and supply-chain pipeline

- SAST: ESLint security rules + semgrep (if adopted).
- SCA: npm/OSV scanner with artifact retention.
- IaC: Dockerfile, compose, MTA scan.
- Secrets: repository + commit history scan.
- SBOM: CycloneDX (preferred default) or SPDX by policy.

## 5) DAST plan

- Authenticated API scanning against stage environment.
- Route discovery from OpenAPI + runtime endpoint enumeration.
- Include rate-limit and abuse-case scenarios.

## 6) LLM prompt-injection red-team suite

- Tool abuse attempts (write/activate without approvals).
- Data exfiltration prompts to extract secrets/tenant data.
- Jailbreak attempts to override system constraints.
- Multi-turn context poisoning and malicious tool outputs.

## 7) Pass/fail gates and artifacts

Required artifacts per release candidate:
1. Lint + unit + integration + e2e reports.
2. Security test report and negative-case pass evidence.
3. SAST/SCA/IaC/secrets scan reports.
4. SBOM and dependency exception register.
5. DAST report (if public API/web surface).
6. LLM red-team report (if LLM features enabled).

Release gate rule:
- Fail on unresolved High/Critical findings unless an explicit, time-bound risk acceptance is approved.

