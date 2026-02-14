import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import { CodeBlock } from '@/components/ui/CodeBlock';

export const metadata: Metadata = {
  title: 'Getting Started (Mock Mode) | SAP Connect',
  description:
    'Run SAP Connect locally with simulated data. No SAP system required. Explore extraction, migration, and process mining in minutes.',
};

export default function MockModePage() {
  return (
    <section aria-labelledby="mock-heading" className="py-20">
      <div className="container-site">
        <div className="mx-auto max-w-[800px]">
          {/* Back link */}
          <a
            href="/docs"
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
            Documentation
          </a>

          <h1
            id="mock-heading"
            className="mb-4 text-[var(--font-size-h1)] font-bold leading-[var(--leading-heading)] text-[var(--color-text-primary)]"
          >
            Getting started with Mock Mode
          </h1>
          <p className="mb-10 text-[var(--font-size-body-l)] leading-relaxed text-[var(--color-text-secondary)]">
            Mock mode lets you explore every SAP Connect capability using
            simulated data. No SAP system, no RFC SDK, no credentials required.
            This is the fastest way to evaluate the platform.
          </p>

          {/* Prerequisites */}
          <section aria-labelledby="prereqs-heading" className="mb-10">
            <h2
              id="prereqs-heading"
              className="mb-4 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              Prerequisites
            </h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              <li className="flex items-start gap-2 text-[var(--font-size-body-m)] text-[var(--color-text-secondary)]">
                <span className="mt-0.5 shrink-0 text-[var(--color-brand)]" aria-hidden="true">1.</span>
                <span><strong>Node.js 20+</strong> (LTS recommended)</span>
              </li>
              <li className="flex items-start gap-2 text-[var(--font-size-body-m)] text-[var(--color-text-secondary)]">
                <span className="mt-0.5 shrink-0 text-[var(--color-brand)]" aria-hidden="true">2.</span>
                <span><strong>npm</strong> (included with Node.js)</span>
              </li>
            </ul>
          </section>

          {/* Installation steps */}
          <section aria-labelledby="steps-heading" className="mb-10">
            <h2
              id="steps-heading"
              className="mb-4 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              Installation
            </h2>

            <div className="flex flex-col gap-6">
              <div>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-medium text-[var(--color-text-primary)]">
                  Step 1: Clone the repository
                </h3>
                <CodeBlock
                  code="git clone https://github.com/ib823/sapconnect.git\ncd sapconnect"
                  language="bash"
                />
              </div>

              <div>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-medium text-[var(--color-text-primary)]">
                  Step 2: Install dependencies
                </h3>
                <CodeBlock code="npm install" language="bash" />
              </div>

              <div>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-medium text-[var(--color-text-primary)]">
                  Step 3: Start the development server
                </h3>
                <CodeBlock code="npm run dev" language="bash" />
              </div>

              <div>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-medium text-[var(--color-text-primary)]">
                  Step 4: Open in your browser
                </h3>
                <CodeBlock
                  code="# CAP server (OData, Fiori, static files)\nhttp://localhost:4004\n\n# Express REST API (migration, forensic, process mining)\nhttp://localhost:4005"
                  language="bash"
                />
              </div>
            </div>
          </section>

          {/* What you get */}
          <section aria-labelledby="features-heading" className="mb-10">
            <h2
              id="features-heading"
              className="mb-4 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              What you get in mock mode
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  Forensic Extraction
                </h3>
                <p className="m-0 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  35+ extractors running against simulated SAP data. Custom code
                  analysis, configuration inventory, interface catalog, and
                  usage telemetry.
                </p>
              </Card>
              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  Data Migration
                </h3>
                <p className="m-0 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  42 migration objects with 1,600+ field mappings and 881
                  transformation rules. Full ETLV pipeline with synthetic data.
                </p>
              </Card>
              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  Process Mining
                </h3>
                <p className="m-0 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  Process flow reconstruction from simulated change documents.
                  Variant analysis, bottleneck detection, and conformance
                  checking.
                </p>
              </Card>
              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  REST APIs and Dashboard
                </h3>
                <p className="m-0 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  Full REST API on port 4005 with migration, forensic, process
                  mining, and export endpoints. Web dashboard on port 4004.
                </p>
              </Card>
            </div>
          </section>

          {/* No SAP system */}
          <Card>
            <p className="m-0 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text-primary)]">No SAP system required.</strong>{' '}
              Mock mode uses pre-built JSON datasets that simulate real SAP
              table structures, BAPI responses, and change documents. Every
              capability works identically to live mode but with deterministic,
              repeatable results.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
