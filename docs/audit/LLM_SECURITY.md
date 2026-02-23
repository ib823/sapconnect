# LLM / Agent Security Review

Relevance: **YES** (user confirmed LLM usage in product flows).

## Verified architecture points

- Multi-agent orchestrator with tool-use loop and role-based tool lists. **VERIFIED**.
- Write tools identified (`write_abap_source`, `activate_object`) with safety-gate hook. **VERIFIED**.
- Iteration guard present (`maxIterations`, default 25). **VERIFIED**.

## LLM-specific findings

### LLM-001 — Tool-call validation relies on runtime delegation; schema enforcement evidence incomplete
- Severity: **High**
- Status: **EVIDENCE-PARTIAL**
- Evidence:
  - Tool definitions include `input_schema` in `agent/tools.js`.
  - Execution path delegates raw `toolInput` to gateway methods.
- Risk:
  - If gateway-side strict validation is incomplete, prompt-injected tool arguments could cause unsafe actions or unexpected SAP operations.
- Mitigation:
  1. Enforce server-side JSON schema validation before every tool call.
  2. Require allowlisted enums and strict length/pattern checks.
  3. Add structured reject logging for invalid tool payloads.
- Verification:
  - Negative tests with malformed tool payloads must fail closed.

### LLM-002 — Data minimization/redaction boundary for model prompts not fully evidenced
- Severity: **High**
- Status: **BLOCKED**
- Evidence:
  - Repository inspected, but complete prompt-content redaction policy for sensitive tenant data was not located in this pass.
- Risk:
  - Sensitive data may be sent to external model providers beyond least-privilege necessity.
- Mitigation:
  1. Add explicit redaction pipeline (PII/secret detectors + policy tags).
  2. Segment prompts into minimum required context.
  3. Add per-call audit event including data-classification level.
- Verification:
  - Red-team tests asserting blocked exfiltration of synthetic secrets/PII.

### LLM-003 — Provider egress governance not centrally enforced (allowlist evidence missing)
- Severity: **Medium**
- Status: **EVIDENCE-PARTIAL**
- Evidence:
  - LLM provider abstraction supports multiple providers, but a repository-level egress policy file was not identified.
- Risk:
  - Potential uncontrolled outbound data transfer if environment variables are changed.
- Mitigation:
  - Enforce outbound domain allowlist + TLS pinning/proxy policy at infrastructure boundary.
- Verification:
  - Integration test in controlled network namespace proving only approved domains reachable.

## Recommended LLM security baseline

1. Strict tool allowlist by role and environment.
2. Server-side argument validation and canonicalization.
3. Deterministic policy checks before side-effecting tools.
4. Sensitive-data redaction before provider calls.
5. Prompt-injection red-team regression suite in CI.

