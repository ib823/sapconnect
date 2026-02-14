import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCapabilities, getCapabilityById } from '@/lib/capabilities';
import { CodeBlock } from '@/components/ui/CodeBlock';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getCapabilities().map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cap = getCapabilityById(slug);
  if (!cap) return { title: 'Not Found | SAP Connect' };
  return {
    title: `${cap.title} | SAP Connect`,
    description: cap.summary,
  };
}

function formatStatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

const DOMAIN_LABELS: Record<string, string> = {
  assessment: 'Assessment',
  data: 'Data',
  greenfield: 'Greenfield',
  testing: 'Testing',
  cloud: 'Cloud',
  ai: 'AI',
  execution: 'Execution',
};

export default async function CapabilityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const cap = getCapabilityById(slug);

  if (!cap) notFound();

  const statEntries = Object.entries(cap.stats);

  return (
    <section aria-labelledby="capability-heading" className="py-20">
      <div className="container-site">
        <div className="mx-auto max-w-[800px]">
          {/* Back link */}
          <a
            href="/capabilities"
            className="mb-8 inline-flex items-center gap-2 text-[var(--font-size-body-s)] font-medium text-[var(--color-brand)] no-underline hover:text-[var(--color-brand-hover)]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M13 8H3M3 8L7 4M3 8L7 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            All capabilities
          </a>

          {/* Header */}
          <div className="mb-10 flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{ backgroundColor: 'var(--color-brand-subtle)' }}
              aria-hidden="true"
            >
              {cap.icon}
            </div>
            <div>
              <h1
                id="capability-heading"
                className="mb-2 text-[var(--font-size-h1)] font-bold leading-[var(--leading-heading)] text-[var(--color-text-primary)]"
              >
                {cap.title}
              </h1>
              <p className="m-0 text-[var(--font-size-body-l)] leading-relaxed text-[var(--color-text-secondary)]">
                {cap.summary}
              </p>
            </div>
          </div>

          {/* Stats and domain tags */}
          <div className="mb-10 flex flex-wrap gap-3">
            {statEntries.map(([key, value]) => (
              <span
                key={key}
                className="rounded-[var(--radius-chip)] px-4 py-1.5 text-[var(--font-size-body-s)] font-medium"
                style={{
                  backgroundColor: 'var(--color-brand-subtle)',
                  color: 'var(--color-brand)',
                }}
              >
                {formatStatKey(key)}: {value}
              </span>
            ))}
            {cap.domainTags.map((tag) => (
              <span
                key={tag}
                className="rounded-[var(--radius-chip)] px-4 py-1.5 text-[var(--font-size-body-s)] font-medium"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {DOMAIN_LABELS[tag] || tag}
              </span>
            ))}
          </div>

          {/* Problem */}
          <section aria-labelledby="problem-heading" className="mb-10">
            <h2
              id="problem-heading"
              className="mb-3 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              Problem
            </h2>
            <p className="m-0 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              {cap.problem}
            </p>
          </section>

          {/* What it automates */}
          <section aria-labelledby="automates-heading" className="mb-10">
            <h2
              id="automates-heading"
              className="mb-3 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              What it automates
            </h2>
            <p className="m-0 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              {cap.whatItAutomates}
            </p>
          </section>

          {/* Inputs and outputs */}
          <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            <section aria-labelledby="inputs-heading">
              <h2
                id="inputs-heading"
                className="mb-3 text-[var(--font-size-h4)] font-semibold text-[var(--color-text-primary)]"
              >
                Inputs
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {cap.inputs.map((input, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="mt-1 shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 8H13M13 8L9 4M13 8L9 12"
                        stroke="var(--color-brand)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                      {input}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="outputs-heading">
              <h2
                id="outputs-heading"
                className="mb-3 text-[var(--font-size-h4)] font-semibold text-[var(--color-text-primary)]"
              >
                Outputs
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {cap.outputs.map((output, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="mt-1 shrink-0"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 8L7 11L12 5"
                        stroke="var(--color-success)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                      {output}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Validation logic */}
          <section aria-labelledby="validation-heading" className="mb-10">
            <h2
              id="validation-heading"
              className="mb-3 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              Validation logic
            </h2>
            <p className="m-0 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              {cap.validationLogic}
            </p>
          </section>

          {/* Evidence */}
          <section aria-labelledby="evidence-heading" className="mb-10">
            <h2
              id="evidence-heading"
              className="mb-3 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              Evidence
            </h2>
            <p className="m-0 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              {cap.evidence}
            </p>
          </section>

          {/* API Mapping */}
          <section aria-labelledby="api-heading" className="mb-10">
            <h2
              id="api-heading"
              className="mb-3 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              API mapping
            </h2>
            <p className="m-0 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              {cap.apiMapping}
            </p>
          </section>

          {/* Runbook snippet */}
          <section aria-labelledby="runbook-heading" className="mb-10">
            <h2
              id="runbook-heading"
              className="mb-3 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              Runbook
            </h2>
            <CodeBlock
              code={cap.runbookSnippet}
              language="javascript"
              title="Usage example"
            />
          </section>
        </div>
      </div>
    </section>
  );
}
