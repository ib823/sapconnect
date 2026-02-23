# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | Yes |

## Reporting a Vulnerability

If you discover a security vulnerability in SEN, please report it responsibly:

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email security findings to the project maintainers
3. Include a detailed description and steps to reproduce
4. Allow 90 days for remediation before public disclosure

## Security Architecture

SEN implements defense-in-depth security:

- **Authentication**: All SAP connections require explicit credentials (Basic Auth, OAuth 2.0, XSUAA JWT). No credentials are stored in code or logs.
- **Authorization**: Operations respect SAP's own authorization model. SEN does not bypass SAP authorization checks.
- **Safety Gates**: All write operations (transport creation, ABAP writes, BDC execution, BAPI calls, SDT loads) require explicit human confirmation before execution.
- **Audit Trail**: Every operation is logged with timestamp, user, operation type, target system, and result.
- **Input Validation**: All user inputs and AI agent tool-call payloads are validated against JSON schemas and sanitized before use in API calls. Invalid tool inputs are rejected before execution (fail-closed).
- **Rate Limiting**: API calls to SAP systems are rate-limited to prevent abuse.
- **LLM Data Redaction**: A pattern-based redaction pipeline removes credentials, tokens, and PII from prompts before they are sent to external LLM providers. Every redaction event is audit-logged per call.
- **LLM Tool Validation**: All AI agent tool inputs are validated against JSON Schema definitions. Invalid inputs are rejected before execution (fail-closed).
- **Production Auth Guard**: The API server fails fast on startup if no authentication mechanism is configured in production mode.
- **CORS Origin Allowlist**: CORS is enforced via a strict origin allowlist. Requests from unlisted origins are rejected.
- **Content Security Policy**: CSP headers are hardened with no unsafe-inline or unsafe-eval directives.
- **No Credential Storage**: SEN does not persist SAP credentials. Credentials are provided per-session via environment variables or secure credential stores.
- **Transport Safety**: All ABAP modifications are routed through SAP's transport management system.

## Credential Handling

- SAP system credentials MUST be provided via environment variables or BTP Destination Service
- Credentials are NEVER logged, cached to disk, or included in error messages
- OAuth tokens are held in memory only and expire per SAP's token lifetime
- RFC connections use SAP's own secure network communication (SNC) when configured

## Dependencies

We regularly audit dependencies for known vulnerabilities using `npm audit` and automated CI/CD security scanning.
