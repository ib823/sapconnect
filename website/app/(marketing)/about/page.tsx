import type { Metadata } from 'next';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'About | SAP Connect',
  description:
    'About SAP Connect: origin story, open source philosophy, technology foundation, and the Apache 2.0 license.',
};

export default function AboutPage() {
  return (
    <section aria-labelledby="about-heading" className="py-20">
      <div className="container-site">
        <div className="mx-auto max-w-[800px]">
          <h1
            id="about-heading"
            className="mb-6 text-[var(--font-size-h1)] font-bold leading-[var(--leading-heading)] text-[var(--color-text-primary)]"
          >
            About SAP Connect
          </h1>

          {/* Origin story */}
          <section aria-labelledby="origin-heading" className="mb-10">
            <h2
              id="origin-heading"
              className="mb-3 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              Why SAP Connect exists
            </h2>
            <p className="mb-4 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              SAP migrations are among the most complex and expensive IT
              projects an organization undertakes. A typical SAP migration
              takes 6 to 18 months, involves dozens of consultants, and costs
              millions of dollars. The majority of that time and cost goes
              toward repetitive, manual tasks: scanning custom code,
              profiling data quality, building migration templates, configuring
              target systems, and testing business processes.
            </p>
            <p className="mb-4 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              SAP Connect was built to automate these tasks. Instead of relying
              on spreadsheets, manual code reviews, and consultant guesswork,
              SAP Connect provides a programmatic framework that scans, maps,
              transforms, loads, validates, and tests -- all through code that
              can be version-controlled, tested, and reproduced.
            </p>
            <p className="text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              The goal is not to replace SAP consultants. It is to eliminate
              the repetitive parts of their work so they can focus on business
              process design, change management, and the decisions that require
              human judgment.
            </p>
          </section>

          {/* Open source philosophy */}
          <section aria-labelledby="opensource-heading" className="mb-10">
            <h2
              id="opensource-heading"
              className="mb-3 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              Open source philosophy
            </h2>
            <div className="flex flex-col gap-4">
              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  Transparency
                </h3>
                <p className="m-0 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  Every line of code is visible. Every migration rule, every
                  transformation, every validation check can be inspected,
                  understood, and audited. There are no black boxes in SAP
                  Connect.
                </p>
              </Card>
              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  Community
                </h3>
                <p className="m-0 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  SAP migration knowledge should not be locked behind
                  proprietary tools and consultant IP. By building in the open,
                  we enable the SAP community to contribute extractors, fix
                  rules, add migration objects, and share patterns that benefit
                  everyone.
                </p>
              </Card>
              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  No vendor lock-in
                </h3>
                <p className="m-0 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  SAP Connect runs on your infrastructure, connects to your
                  SAP systems, and stores data in your environment. There is no
                  SaaS dependency, no cloud requirement, and no risk of a
                  vendor discontinuing the product. If the project ever stops
                  being maintained, you still have the full source code.
                </p>
              </Card>
            </div>
          </section>

          {/* Technology foundation */}
          <section aria-labelledby="tech-heading" className="mb-10">
            <h2
              id="tech-heading"
              className="mb-3 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              Technology foundation
            </h2>
            <p className="mb-4 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              SAP Connect is built on Node.js and connects to SAP systems
              through three complementary protocols:
            </p>
            <ul className="m-0 mb-4 flex list-none flex-col gap-3 p-0">
              <li className="flex items-start gap-3 text-[var(--font-size-body-m)] text-[var(--color-text-secondary)]">
                <strong className="shrink-0 text-[var(--color-text-primary)]">RFC</strong>
                <span>
                  Direct function calls to ABAP backends via the SAP NetWeaver
                  RFC SDK (node-rfc). Supports connection pooling, automatic
                  retry, and graceful degradation when the SDK is unavailable.
                </span>
              </li>
              <li className="flex items-start gap-3 text-[var(--font-size-body-m)] text-[var(--color-text-secondary)]">
                <strong className="shrink-0 text-[var(--color-text-primary)]">OData</strong>
                <span>
                  V2 and V4 client with automatic CSRF token management, batch
                  request support, pagination handling, and multi-client
                  (sap-client) support. Works with any SAP system that exposes
                  OData services.
                </span>
              </li>
              <li className="flex items-start gap-3 text-[var(--font-size-body-m)] text-[var(--color-text-secondary)]">
                <strong className="shrink-0 text-[var(--color-text-primary)]">ADT REST</strong>
                <span>
                  ABAP Development Tools REST APIs for source code access, ATC
                  (ABAP Test Cockpit) execution, and transport operations. Used
                  primarily for custom code analysis and development object
                  management.
                </span>
              </li>
            </ul>
            <p className="text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              The platform runs as two servers: a CAP (Cloud Application
              Programming) server on port 4004 serving OData services and
              Fiori-style interfaces, and an Express server on port 4005
              providing REST APIs for migration, forensic extraction, process
              mining, and data export.
            </p>
          </section>

          {/* License */}
          <section aria-labelledby="license-heading">
            <h2
              id="license-heading"
              className="mb-3 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              License
            </h2>
            <Card>
              <p className="m-0 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
                SAP Connect is released under the{' '}
                <a
                  href="https://www.apache.org/licenses/LICENSE-2.0"
                  className="font-medium text-[var(--color-brand)] underline underline-offset-4 hover:text-[var(--color-brand-hover)]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apache License 2.0
                </a>
                . You are free to use, modify, and distribute the software for
                any purpose, including commercial use. The license includes an
                express grant of patent rights from contributors. SAP Connect
                is an independent open source project and is not affiliated
                with SAP SE.
              </p>
            </Card>
          </section>
        </div>
      </div>
    </section>
  );
}
