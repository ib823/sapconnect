import type { Metadata } from 'next';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Platform | SAP Connect',
  description:
    'One platform for the entire SAP migration lifecycle. Open source, self-hosted, no vendor lock-in.',
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
      'Apache 2.0 licensed. Inspect every line, fork freely, contribute back. No hidden logic, no black boxes.',
  },
  {
    title: 'No vendor lock-in',
    description:
      'Deploy on any infrastructure. Run on-premises, in SAP BTP, AWS, Azure, or GCP. Your data stays under your control.',
  },
  {
    title: 'Self-hosted',
    description:
      'Install on your own servers behind your firewall. SAP credentials never leave your network.',
  },
  {
    title: 'Full test coverage',
    description:
      '4,591 automated tests covering extraction, migration, process mining, security, and AI safety gates.',
  },
];

const techStack = [
  {
    name: 'Node.js',
    description: 'Runtime for all core services, extraction engine, and migration framework.',
  },
  {
    name: 'SAP RFC (node-rfc)',
    description: 'Direct RFC calls to ABAP function modules with connection pooling and retry logic.',
  },
  {
    name: 'OData V2 and V4',
    description: 'Full OData client with CSRF handling, batch requests, and automatic pagination.',
  },
  {
    name: 'ADT REST',
    description: 'ABAP Development Tools REST APIs for source code access, ATC checks, and transport operations.',
  },
  {
    name: 'SAP CAP',
    description: 'Cloud Application Programming model serving OData services and Fiori interfaces on port 4004.',
  },
  {
    name: 'Express',
    description: 'REST API server on port 4005 handling migration, forensic, process mining, and export endpoints.',
  },
];

export default function PlatformPage() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="platform-heading" className="py-20">
        <div className="container-site">
          <div className="mx-auto max-w-[800px] text-center">
            <h1
              id="platform-heading"
              className="mb-6 text-[var(--font-size-h1)] font-bold leading-[var(--leading-heading)] text-[var(--color-text-primary)]"
            >
              One platform for the entire SAP migration lifecycle
            </h1>
            <p className="text-[var(--font-size-body-l)] leading-relaxed text-[var(--color-text-secondary)]">
              SAP Connect covers every phase from initial assessment through
              production cutover. A single codebase replaces dozens of
              disconnected tools, spreadsheets, and manual processes.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture diagram */}
      <section aria-labelledby="architecture-heading" className="pb-20">
        <div className="container-site">
          <h2
            id="architecture-heading"
            className="mb-8 text-center text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
          >
            Migration lifecycle
          </h2>

          {/* Desktop flow */}
          <div className="hidden md:block">
            <div className="relative flex items-center justify-between">
              {phases.map((phase, i) => (
                <div key={phase.label} className="relative z-10 flex flex-col items-center">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: phase.color }}
                  >
                    {phase.step}
                  </div>
                  <span className="mt-2 text-[var(--font-size-body-s)] font-medium text-[var(--color-text-primary)]">
                    {phase.label}
                  </span>
                  {i < phases.length - 1 && (
                    <div
                      className="absolute left-full top-6 h-[2px] w-[calc(100%-48px)]"
                      style={{ backgroundColor: 'var(--color-border)' }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
              {/* Connector line behind circles */}
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
                    <span className="mt-1 text-[var(--font-size-caption)] font-medium text-[var(--color-text-primary)]">
                      {phase.label}
                    </span>
                  </div>
                  {i < phases.length - 1 && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      className="mb-4"
                    >
                      <path
                        d="M7 4L13 10L7 16"
                        stroke="var(--color-border)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key differentiators */}
      <section
        aria-labelledby="differentiators-heading"
        className="py-20"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <h2
            id="differentiators-heading"
            className="mb-10 text-center text-[var(--font-size-h2)] font-bold text-[var(--color-text-primary)]"
          >
            Key differentiators
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {differentiators.map((d) => (
              <Card key={d.title}>
                <h3 className="mb-2 text-[var(--font-size-h4)] font-semibold text-[var(--color-text-primary)]">
                  {d.title}
                </h3>
                <p className="m-0 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
                  {d.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section aria-labelledby="tech-heading" className="py-20">
        <div className="container-site">
          <h2
            id="tech-heading"
            className="mb-10 text-center text-[var(--font-size-h2)] font-bold text-[var(--color-text-primary)]"
          >
            Technology stack
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((tech) => (
              <Card key={tech.name}>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  {tech.name}
                </h3>
                <p className="m-0 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  {tech.description}
                </p>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <a
              href="/docs"
              className="inline-flex items-center gap-2 text-[var(--font-size-body-m)] font-medium text-[var(--color-brand)] underline underline-offset-4 hover:text-[var(--color-brand-hover)]"
            >
              Read the documentation
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8H13M13 8L9 4M13 8L9 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
