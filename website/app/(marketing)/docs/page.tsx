import type { Metadata } from 'next';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'SEN documentation: getting started guides, architecture overview, integration patterns, Clean Core guide, API reference, and demo scripts.',
};

const docSections = [
  {
    title: 'Getting Started (Mock Mode)',
    description:
      'Run SEN locally with simulated data. No SAP system required. Explore all extraction, migration, and process mining capabilities in minutes.',
    href: '/docs/getting-started/mock-mode',
  },
  {
    title: 'Getting Started (Live Mode)',
    description:
      'Connect SEN to a real SAP system via RFC, OData, or ADT. Configure credentials, set up connection pooling, and run your first live extraction.',
    href: '/docs/getting-started/live-mode',
  },
  {
    title: 'Architecture Overview',
    description:
      'Understand the dual-server architecture (CAP on port 4004, Express on port 4005), the extraction engine, migration framework, and AI safety pipeline.',
    href: 'https://github.com/ib823/sapconnect/blob/main/README.md',
    external: true,
  },
  {
    title: 'Integration Patterns',
    description:
      'Learn how SEN integrates via RFC (direct, load-balanced, SAP Router), OData (V2 and V4 with CSRF), and ADT REST APIs.',
    href: 'https://github.com/ib823/sapconnect/blob/main/README.md#connectivity',
    external: true,
  },
  {
    title: 'Clean Core Guide',
    description:
      'Assess your custom code against SAP Clean Core principles. Understand released API checks, modification analysis, and extensibility pattern recommendations.',
    href: '/solution',
  },
  {
    title: 'API Reference (OpenAPI)',
    description:
      'Full OpenAPI 3.0 specification for the Express REST API covering migration, forensic, process mining, and export endpoints.',
    href: 'https://github.com/ib823/sapconnect/blob/main/docs/openapi.yaml',
    external: true,
  },
  {
    title: 'Demo Script',
    description:
      'Step-by-step demo script walking through assessment, data profiling, process mining, migration execution, and ROI reporting.',
    href: 'https://github.com/ib823/sapconnect/blob/main/README.md#demo',
    external: true,
  },
];

export default function DocsPage() {
  return (
    <section aria-labelledby="docs-heading" className="py-20">
      <div className="container-site">
        <div className="mx-auto mb-12 max-w-[700px] text-center">
          <h1
            id="docs-heading"
            className="mb-4 text-[var(--font-size-h1)] font-bold leading-[var(--leading-heading)] text-[var(--color-text-primary)]"
          >
            Documentation
          </h1>
          <p className="text-[var(--font-size-body-l)] leading-relaxed text-[var(--color-text-secondary)]">
            Everything you need to evaluate, install, and operate SEN.
            Start with mock mode to explore without an SAP system, then connect
            live when you are ready.
          </p>
        </div>

        <div className="mx-auto max-w-[900px] grid grid-cols-1 gap-6 sm:grid-cols-2">
          {docSections.map((section) => {
            const isExternal = 'external' in section && section.external;
            return (
              <a
                key={section.title}
                href={section.href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="group no-underline"
              >
                <Card className="h-full transition-shadow duration-200 group-hover:shadow-lg">
                  <h2 className="mb-2 flex items-center gap-2 text-[var(--font-size-h4)] font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand)] transition-colors">
                    {section.title}
                    {isExternal && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        aria-label="External link"
                        className="shrink-0"
                      >
                        <path
                          d="M10.5 7.58V11.08C10.5 11.39 10.38 11.68 10.16 11.91C9.93 12.13 9.64 12.25 9.33 12.25H2.92C2.61 12.25 2.32 12.13 2.09 11.91C1.87 11.68 1.75 11.39 1.75 11.08V4.67C1.75 4.36 1.87 4.07 2.09 3.84C2.32 3.62 2.61 3.5 2.92 3.5H6.42M8.75 1.75H12.25M12.25 1.75V5.25M12.25 1.75L5.25 8.75"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </h2>
                  <p className="m-0 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                    {section.description}
                  </p>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
