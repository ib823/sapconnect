import type { Metadata } from 'next';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Security | SAP Connect',
  description:
    'Enterprise-grade security for SAP operations: input validation, rate limiting, audit logging, CSRF protection, CORS, security headers, and API key authentication.',
};

const securityFeatures = [
  {
    title: 'Input Validation',
    description:
      'Every request is validated against strict JSON schemas before reaching any SAP operation. SAP-specific validation rules check client numbers, transport request formats, and RFC function names. The validation layer uses composable schema definitions so custom rules can be added per endpoint without modifying core logic.',
  },
  {
    title: 'Rate Limiting',
    description:
      'Configurable per-endpoint rate limiting using a sliding window algorithm. Each client is tracked independently with separate limits for read operations (higher throughput) and write operations (stricter controls). Rate limit status is returned in X-RateLimit-Remaining and X-RateLimit-Reset headers.',
  },
  {
    title: 'Audit Logging',
    description:
      'Every SAP operation is logged to an immutable audit trail with full request context: user identity, timestamp, operation type, parameters, result status, and response time. Audit logs include a SHA-256 hash chain for tamper detection. Logs can be exported to SIEM systems via JSON or syslog format.',
  },
  {
    title: 'CSRF Protection',
    description:
      'Automatic CSRF token management with configurable rotation intervals. Tokens are fetched via HEAD requests with X-CSRF-Token: Fetch headers and cached for 25 minutes (matching SAP server-side token lifetime). Token refresh is handled transparently on 403 responses.',
  },
  {
    title: 'CORS Configuration',
    description:
      'Configurable CORS origins with strict defaults. In production mode, only explicitly whitelisted origins are allowed. Preflight responses include appropriate Access-Control-Allow-Headers for SAP-specific headers like X-CSRF-Token and sap-client.',
  },
  {
    title: 'Security Headers',
    description:
      'Helmet.js integration sets all recommended security headers: Content-Security-Policy, X-Content-Type-Options (nosniff), X-Frame-Options (DENY), Strict-Transport-Security, X-XSS-Protection, and Referrer-Policy. Headers are configurable per deployment environment.',
  },
  {
    title: 'API Key Authentication',
    description:
      'API key authentication for programmatic access. Keys are hashed with bcrypt before storage. Each key has configurable scopes (read, write, admin) and can be rotated without downtime. Failed authentication attempts are rate-limited and logged.',
  },
  {
    title: 'Transport Safety',
    description:
      'Transport management is never bypassed. All AI-generated and automated SAP artifacts pass through the full safety pipeline: Generate, Quality Check, Human Review, and Transport Import. Rollback is always available via transport reversal. No direct production writes are permitted.',
  },
  {
    title: 'XSUAA Authentication',
    description:
      'Native integration with SAP Authorization and Trust Management (XSUAA) for production deployments. JWT tokens are validated with scope-based access control (read, write, admin). Supports SAP BTP multi-tenant authentication with automatic token refresh and secure credential handling.',
  },
];

export default function SecurityPage() {
  return (
    <section aria-labelledby="security-heading" className="py-20">
      <div className="container-site">
        <div className="mx-auto mb-12 max-w-[700px] text-center">
          <h1
            id="security-heading"
            className="mb-4 text-[var(--font-size-h1)] font-bold leading-[var(--leading-heading)] text-[var(--color-text-primary)]"
          >
            Enterprise-grade security
          </h1>
          <p className="text-[var(--font-size-body-l)] leading-relaxed text-[var(--color-text-secondary)]">
            SAP systems contain business-critical data. SAP Connect applies
            defense-in-depth security controls to every operation, whether
            triggered by a human user, an API client, or an AI agent.
          </p>
        </div>

        <div className="mx-auto max-w-[900px]">
          <div className="flex flex-col gap-6">
            {securityFeatures.map((feature) => (
              <Card key={feature.title}>
                <h2 className="mb-3 text-[var(--font-size-h4)] font-semibold text-[var(--color-text-primary)]">
                  {feature.title}
                </h2>
                <p className="m-0 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
