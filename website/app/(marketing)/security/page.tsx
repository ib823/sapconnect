import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import SecurityTiers from '@/components/marketing/SecurityTiers';

export const metadata: Metadata = {
  title: 'Security',
  description:
    'Enterprise-grade security for ERP operations: 4-tier approval model, input validation, audit logging, CSRF protection, transport safety, and XSUAA integration.',
};

const tierExamples = [
  { operation: 'Forensic extraction (read-only)', tier: 'Tier 1', approval: 'Auto-approved' },
  { operation: 'Field mapping configuration', tier: 'Tier 2', approval: 'Logged, reversible' },
  { operation: 'Data load to staging', tier: 'Tier 3', approval: '1 approver' },
  { operation: 'Production cutover / transport import', tier: 'Tier 4', approval: '2 approvers + change window' },
];

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
    <>
      {/* Hero */}
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
        </div>
      </section>

      {/* 4-Tier Security Model */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <h2
            className="mb-4 text-center text-3xl lg:text-4xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            4-Tier Approval Model
          </h2>
          <p
            className="text-lg m-0 mb-16 text-center max-w-xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Every operation is classified by risk. Controls escalate from
            auto-approved reads to dual-approval production changes.
          </p>
          <div className="max-w-3xl mx-auto mb-16">
            <SecurityTiers />
          </div>

          {/* Tier examples table */}
          <div className="max-w-2xl mx-auto">
            <h3
              className="text-lg font-semibold m-0 mb-6 text-center"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Operation tier examples
            </h3>
            <div className="flex flex-col gap-3">
              {tierExamples.map((ex) => (
                <div
                  key={ex.operation}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 rounded-xl border"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {ex.operation}
                  </span>
                  <div className="flex items-center gap-3 mt-1 sm:mt-0">
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-brand-subtle)',
                        color: 'var(--color-brand)',
                      }}
                    >
                      {ex.tier}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {ex.approval}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-24 lg:py-28">
        <div className="container-site">
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
    </>
  );
}
