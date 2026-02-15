import type { Metadata } from 'next';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Security | SAP Connect',
  description:
    'Enterprise-grade security for SAP operations: input validation, audit logging, CSRF protection, transport safety, API key authentication, and XSUAA integration.',
};

const securityFeatures = [
  {
    title: 'Input Validation',
    description:
      'Every request is validated against strict JSON schemas with SAP-specific rules for client numbers, transport formats, and RFC function names.',
  },
  {
    title: 'Audit Logging',
    description:
      'Immutable audit trail with full request context and SHA-256 hash chain for tamper detection. Exportable to SIEM systems via JSON or syslog.',
  },
  {
    title: 'CSRF Protection',
    description:
      'Automatic token management with configurable rotation. Tokens are cached for 25 minutes and refresh transparently on 403 responses.',
  },
  {
    title: 'Transport Safety',
    description:
      'All artifacts follow the safety pipeline: Generate, Quality Check, Human Review, Transport Import. Rollback via transport reversal. No direct production writes.',
  },
  {
    title: 'API Key Authentication',
    description:
      'Keys hashed with bcrypt, configurable scopes (read, write, admin), rotatable without downtime. Failed attempts are rate-limited and logged.',
  },
  {
    title: 'XSUAA Authentication',
    description:
      'Native SAP Authorization and Trust Management integration with JWT validation, scope-based access control, and automatic token refresh.',
  },
];

export default function SecurityPage() {
  return (
    <section aria-labelledby="security-heading" className="py-32 lg:py-40">
      <div className="container-site">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h1
            id="security-heading"
            className="text-5xl lg:text-6xl font-semibold tracking-tighter m-0 mb-6"
            style={{
              lineHeight: 'var(--leading-heading)',
              color: 'var(--color-text-primary)',
            }}
          >
            Enterprise-grade security
          </h1>
          <p
            className="text-xl m-0"
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-body)',
            }}
          >
            Defense-in-depth controls protect every operation, whether
            triggered by a user, an API client, or an AI agent.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-8">
            {securityFeatures.map((feature) => (
              <Card key={feature.title}>
                <h2
                  className="mb-3 text-lg font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {feature.title}
                </h2>
                <p
                  className="m-0 text-base leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
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
