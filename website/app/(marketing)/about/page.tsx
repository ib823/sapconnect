import type { Metadata } from 'next';
import Card from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'About | SEN',
  description:
    'About SEN: why it exists, open source philosophy, and the Apache 2.0 license.',
};

export default function AboutPage() {
  return (
    <section aria-labelledby="about-heading" className="py-32 lg:py-40">
      <div className="container-site">
        <div className="mx-auto max-w-2xl">
          <h1
            id="about-heading"
            className="text-5xl lg:text-6xl font-semibold tracking-tighter m-0 mb-8"
            style={{
              lineHeight: 'var(--leading-heading)',
              color: 'var(--color-text-primary)',
            }}
          >
            About SEN
          </h1>

          {/* Origin story */}
          <section aria-labelledby="origin-heading" className="mb-16">
            <h2
              id="origin-heading"
              className="mb-4 text-2xl font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Why SEN exists
            </h2>
            <p
              className="mb-6 text-base leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              SAP migrations take 6 to 18 months, involve dozens of consultants,
              and cost millions of dollars. The majority of that time goes toward
              repetitive manual tasks: scanning custom code, profiling data,
              building templates, and testing processes.
            </p>
            <p
              className="mb-6 text-base leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              SEN automates these tasks. Instead of spreadsheets and
              consultant guesswork, it provides a programmatic framework that
              scans, maps, transforms, loads, validates, and tests -- all through
              code that can be version-controlled and reproduced.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              The goal is not to replace consultants. It is to eliminate the
              repetitive parts of their work so they can focus on business process
              design and the decisions that require human judgment.
            </p>
          </section>

          {/* Open source */}
          <section aria-labelledby="opensource-heading" className="mb-16">
            <h2
              id="opensource-heading"
              className="mb-4 text-2xl font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Open source philosophy
            </h2>
            <p
              className="mb-6 text-base leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Every line of code is visible. Every migration rule, every
              transformation, every validation check can be inspected and audited.
              There are no black boxes.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              SAP migration knowledge should not be locked behind proprietary
              tools. By building in the open, we enable the community to
              contribute extractors, fix rules, and share patterns that benefit
              everyone.
            </p>
          </section>

          {/* Technology */}
          <section aria-labelledby="tech-heading" className="mb-16">
            <h2
              id="tech-heading"
              className="mb-4 text-2xl font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Technology foundation
            </h2>
            <p
              className="mb-6 text-base leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Built on Node.js, SEN connects through three protocols:
              RFC for direct ABAP function calls, OData V2/V4 for service-based
              access, and ADT REST for development tool operations.
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              The platform runs as two servers: a CAP server on port 4004
              for OData services and Fiori interfaces, and an Express server on
              port 4005 for REST APIs.
            </p>
          </section>

          {/* License */}
          <section aria-labelledby="license-heading">
            <h2
              id="license-heading"
              className="mb-4 text-2xl font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              License
            </h2>
            <Card>
              <p
                className="m-0 text-base leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                SEN is released under the{' '}
                <a
                  href="https://www.apache.org/licenses/LICENSE-2.0"
                  className="font-medium underline underline-offset-4"
                  style={{ color: 'var(--color-brand)' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apache License 2.0
                </a>
                . Free to use, modify, and distribute for any purpose, including
                commercial use. SEN is an independent open source project
                and is not affiliated with SAP SE.
              </p>
            </Card>
          </section>
        </div>
      </div>
    </section>
  );
}
