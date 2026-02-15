import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Platform | SAP Connect',
  description:
    'Open source. Self-hosted. Enterprise grade. Apache 2.0 licensed, deploy anywhere, full test coverage.',
};

const phases = [
  { step: 1, label: 'Assess', color: 'var(--color-brand)' },
  { step: 2, label: 'Remediate', color: 'var(--color-brand)' },
  { step: 3, label: 'Profile', color: 'var(--color-brand)' },
  { step: 4, label: 'Configure', color: 'var(--color-brand)' },
  { step: 5, label: 'Provision', color: 'var(--color-brand)' },
  { step: 6, label: 'Test', color: 'var(--color-brand)' },
  { step: 7, label: 'Cutover', color: 'var(--color-brand)' },
];

const differentiators = [
  {
    title: 'Open source',
    description:
      'Apache 2.0 licensed. Inspect every line, fork freely, contribute back.',
  },
  {
    title: 'No vendor lock-in',
    description:
      'Deploy on any infrastructure. Your data stays under your control.',
  },
  {
    title: 'Self-hosted',
    description:
      'Install behind your firewall. SAP credentials never leave your network.',
  },
  {
    title: 'Full test coverage',
    description:
      '4,910 automated tests covering extraction, migration, security, and AI safety.',
  },
];

const securityFeatures = [
  {
    title: 'Input Validation',
    description:
      'JSON Schema-based validation with SAP-specific rules for every API request.',
  },
  {
    title: 'Audit Logging',
    description:
      'Immutable audit trail with SHA-256 hash chain for tamper detection.',
  },
  {
    title: 'Transport Safety',
    description:
      'All artifacts pass through Generate, Quality Check, Human Review, and Transport Import.',
  },
  {
    title: 'XSUAA Authentication',
    description:
      'JWT token validation with scope-based access control for production deployments.',
  },
];

const techStack = [
  {
    name: 'Node.js',
    description: 'Runtime for all core services, extraction engine, and migration framework.',
  },
  {
    name: 'SAP RFC (node-rfc)',
    description: 'Direct RFC calls with connection pooling, retry logic, and graceful degradation.',
  },
  {
    name: 'OData V2 and V4',
    description: 'Full OData client with CSRF handling, batch requests, and automatic pagination.',
  },
  {
    name: 'ADT REST',
    description: 'ABAP Development Tools REST APIs for source code access and transport operations.',
  },
  {
    name: 'SAP CAP',
    description: 'Cloud Application Programming model serving OData services and Fiori interfaces.',
  },
  {
    name: 'Express',
    description: 'REST API server handling migration, forensic, process mining, and export endpoints.',
  },
];

export default function PlatformPage() {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Section A: Hero                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="platform-heading" className="py-32 lg:py-40">
        <div className="container-site max-w-3xl text-center">
          <h1
            id="platform-heading"
            className="text-5xl lg:text-6xl font-semibold tracking-tighter m-0 mb-6"
            style={{
              lineHeight: 'var(--leading-heading)',
              color: 'var(--color-text-primary)',
            }}
          >
            Open source. Self-hosted.
            <br />
            Enterprise grade.
          </h1>
          <p
            className="text-xl m-0 mx-auto max-w-xl"
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-body)',
            }}
          >
            Apache 2.0 licensed. Deploy anywhere. Full test coverage.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section B: Architecture lifecycle                                   */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="architecture-heading" className="pb-24 lg:pb-28">
        <div className="container-site">
          <h2
            id="architecture-heading"
            className="mb-12 text-center text-2xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Migration lifecycle
          </h2>

          {/* Desktop flow */}
          <div className="hidden md:block">
            <div className="relative flex items-center justify-between">
              {phases.map((phase) => (
                <div key={phase.label} className="relative z-10 flex flex-col items-center">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: phase.color }}
                  >
                    {phase.step}
                  </div>
                  <span
                    className="mt-3 text-sm font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {phase.label}
                  </span>
                </div>
              ))}
              <div
                className="absolute left-6 right-6 top-6 h-[2px] -z-0"
                style={{ backgroundColor: 'var(--color-border)' }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Mobile flow */}
          <div className="md:hidden overflow-x-auto pb-4 -mx-6 px-6">
            <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
              {phases.map((phase, i) => (
                <div key={phase.label} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: phase.color }}
                    >
                      {phase.step}
                    </div>
                    <span
                      className="mt-1 text-xs font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {phase.label}
                    </span>
                  </div>
                  {i < phases.length - 1 && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mb-4">
                      <path d="M7 4L13 10L7 16" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section C: Differentiators                                          */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-labelledby="differentiators-heading"
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <h2
            id="differentiators-heading"
            className="mb-12 text-center text-3xl lg:text-4xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Key differentiators
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {differentiators.map((d) => (
              <Card key={d.title}>
                <h3
                  className="mb-3 text-lg font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {d.title}
                </h3>
                <p
                  className="m-0 text-base leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {d.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section D: Security overview                                        */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-labelledby="security-heading"
        className="py-24 lg:py-28"
      >
        <div className="container-site">
          <h2
            id="security-heading"
            className="mb-4 text-center text-3xl lg:text-4xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Defense in depth
          </h2>
          <p
            className="text-lg m-0 mb-12 text-center max-w-xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Multi-layer security controls protect every operation before it
            reaches your SAP system.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {securityFeatures.map((feature) => (
              <div key={feature.title}>
                <h3
                  className="text-base font-semibold m-0 mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm m-0"
                  style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--leading-body)',
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button href="/security" variant="secondary">
              See all security details
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section E: Tech stack                                               */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-labelledby="tech-heading"
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <h2
            id="tech-heading"
            className="mb-12 text-center text-3xl lg:text-4xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Technology stack
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((tech) => (
              <Card key={tech.name}>
                <h3
                  className="mb-2 text-base font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {tech.name}
                </h3>
                <p
                  className="m-0 text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {tech.description}
                </p>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <a
              href="/docs"
              className="inline-flex items-center gap-2 text-base font-medium underline underline-offset-4"
              style={{ color: 'var(--color-brand)' }}
            >
              Read the documentation
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
