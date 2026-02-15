import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import { CodeBlock } from '@/components/ui/CodeBlock';

export const metadata: Metadata = {
  title: 'Getting Started (Live Mode) | SAP Connect',
  description:
    'Connect SAP Connect to a real SAP system via RFC, OData, or ADT. Configure credentials, connection pooling, and run your first live extraction.',
};

export default function LiveModePage() {
  return (
    <section aria-labelledby="live-heading" className="py-20">
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
            id="live-heading"
            className="mb-4 text-[var(--font-size-h1)] font-bold leading-[var(--leading-heading)] text-[var(--color-text-primary)]"
          >
            Getting started with Live Mode
          </h1>
          <p className="mb-10 text-[var(--font-size-body-l)] leading-relaxed text-[var(--color-text-secondary)]">
            Live mode connects SAP Connect to a real SAP system. You can use
            RFC for on-premise ABAP systems, OData for any SAP system, or ADT
            REST for development operations.
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
                <span><strong>SAP system access</strong> with appropriate authorizations</span>
              </li>
              <li className="flex items-start gap-2 text-[var(--font-size-body-m)] text-[var(--color-text-secondary)]">
                <span className="mt-0.5 shrink-0 text-[var(--color-brand)]" aria-hidden="true">3.</span>
                <span><strong>SAP NW RFC SDK</strong> (optional, for RFC connectivity; graceful degradation when unavailable)</span>
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
                  Step 1: Clone and install
                </h3>
                <CodeBlock
                  code="git clone https://github.com/ib823/sapconnect.git\ncd sapconnect\nnpm install"
                  language="bash"
                />
              </div>

              <div>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-medium text-[var(--color-text-primary)]">
                  Step 2: Configure your SAP connection
                </h3>
                <CodeBlock
                  code={`// .sapconnect.json
{
  "connections": {
    "source": {
      "type": "rfc",
      "ashost": "10.0.1.50",
      "sysnr": "00",
      "client": "100",
      "lang": "EN"
    }
  }
}`}
                  language="json"
                  title=".sapconnect.json"
                />
              </div>

              <div>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-medium text-[var(--color-text-primary)]">
                  Step 3: Set environment variables
                </h3>
                <CodeBlock
                  code={`export SAP_USER="YOUR_SAP_USER"
export SAP_PASSWORD="YOUR_SAP_PASSWORD"
# Optional: SAP Router string for external access
# export SAP_ROUTER="/H/saprouter.example.com/S/3299/H/"`}
                  language="bash"
                />
              </div>

              <div>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-medium text-[var(--color-text-primary)]">
                  Step 4: Start the server
                </h3>
                <CodeBlock code="npm run dev" language="bash" />
              </div>
            </div>
          </section>

          {/* Connection types */}
          <section aria-labelledby="connections-heading" className="mb-10">
            <h2
              id="connections-heading"
              className="mb-4 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              Connection types
            </h2>
            <div className="flex flex-col gap-4">
              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  Direct connection (ashost)
                </h3>
                <p className="m-0 mb-3 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  Connect directly to a specific application server. Best for
                  development and testing environments.
                </p>
                <CodeBlock
                  code={`{
  "type": "rfc",
  "ashost": "sap-dev.example.com",
  "sysnr": "00",
  "client": "100"
}`}
                  language="json"
                />
              </Card>

              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  Load-balanced connection (mshost)
                </h3>
                <p className="m-0 mb-3 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  Connect through the SAP message server for automatic load
                  balancing. Recommended for production systems.
                </p>
                <CodeBlock
                  code={`{
  "type": "rfc",
  "mshost": "sapms.example.com",
  "msserv": "3600",
  "group": "PUBLIC",
  "r3name": "PRD",
  "client": "100"
}`}
                  language="json"
                />
              </Card>

              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  SAP Router connection
                </h3>
                <p className="m-0 mb-3 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  Route through SAP Router for access to systems behind
                  firewalls. Combine with either direct or load-balanced
                  connections.
                </p>
                <CodeBlock
                  code={`{
  "type": "rfc",
  "ashost": "10.0.1.50",
  "sysnr": "00",
  "client": "100",
  "saprouter": "/H/saprouter.example.com/S/3299/H/"
}`}
                  language="json"
                />
              </Card>
            </div>
          </section>

          {/* Required authorizations */}
          <section aria-labelledby="auth-heading" className="mb-10">
            <h2
              id="auth-heading"
              className="mb-4 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              Required SAP authorizations
            </h2>
            <Card>
              <p className="m-0 mb-3 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
                The SAP user needs the following authorization objects for full
                functionality:
              </p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[var(--font-size-body-s)] text-[var(--color-text-secondary)]">
                <li><strong>S_RFC</strong> -- RFC access to function modules (RFC_READ_TABLE, REPOSITORY_INFOSYSTEM, etc.)</li>
                <li><strong>S_TABU_DIS</strong> -- Table display authorization for configuration and master data tables</li>
                <li><strong>S_DEVELOP</strong> -- Development access for ADT source code retrieval (read-only sufficient)</li>
                <li><strong>S_CTS_ADMI</strong> -- Transport management (only if using write operations)</li>
                <li><strong>S_USER_GRP</strong> -- User management (only for authorization analysis)</li>
              </ul>
            </Card>
          </section>

          <Card>
            <p className="m-0 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text-primary)]">RFC SDK is optional.</strong>{' '}
              If node-rfc is not installed, SAP Connect automatically falls back
              to OData and ADT REST APIs. This is the recommended approach for
              SAP Cloud environments where RFC is not available.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
