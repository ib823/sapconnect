import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Pricing | SAP Connect',
  description:
    'SAP Connect is free and open source under the Apache 2.0 license. Enterprise support is available for organizations that need dedicated assistance.',
};

const openSourceFeatures = [
  'Full source code access',
  'All 11 capabilities included',
  'Mock and live mode',
  'Self-hosted deployment',
  'Community support via GitHub',
  'Apache 2.0 license',
  '4,591 automated tests',
  'No usage limits',
];

const enterpriseFeatures = [
  'Everything in Open Source',
  'Custom deployment assistance',
  'Dedicated support engineer',
  'SLA-backed response times',
  'Architecture review sessions',
  'Migration planning workshops',
  'Custom extractor development',
  'Priority bug fixes',
];

export default function PricingPage() {
  return (
    <section aria-labelledby="pricing-heading" className="py-20">
      <div className="container-site">
        <div className="mx-auto mb-12 max-w-[700px] text-center">
          <h1
            id="pricing-heading"
            className="mb-4 text-[var(--font-size-h1)] font-bold leading-[var(--leading-heading)] text-[var(--color-text-primary)]"
          >
            Free and open source
          </h1>
          <p className="text-[var(--font-size-body-l)] leading-relaxed text-[var(--color-text-secondary)]">
            SAP Connect is licensed under Apache 2.0. You can use it, modify
            it, and distribute it freely. The entire platform is available at
            no cost, with no feature gates, no usage limits, and no telemetry.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mx-auto grid max-w-[900px] grid-cols-1 gap-6 md:grid-cols-2">
          {/* Open Source */}
          <Card className="flex flex-col">
            <h2 className="mb-1 text-[var(--font-size-h3)] font-bold text-[var(--color-text-primary)]">
              Open Source
            </h2>
            <p className="mb-6 text-[var(--font-size-h1)] font-bold text-[var(--color-brand)]">
              Free
            </p>
            <p className="mb-6 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
              Self-hosted. Full platform. Community support.
            </p>
            <ul className="m-0 mb-8 flex flex-1 list-none flex-col gap-3 p-0">
              {openSourceFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="mt-0.5 shrink-0"
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
                  <span className="text-[var(--font-size-body-s)] text-[var(--color-text-secondary)]">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              href="https://github.com/ib823/sapconnect"
              variant="secondary"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              View on GitHub
            </Button>
          </Card>

          {/* Enterprise */}
          <Card
            className="flex flex-col"
            style={{
              borderColor: 'var(--color-brand)',
              borderWidth: '2px',
            }}
          >
            <h2 className="mb-1 text-[var(--font-size-h3)] font-bold text-[var(--color-text-primary)]">
              Enterprise
            </h2>
            <p className="mb-6 text-[var(--font-size-h1)] font-bold text-[var(--color-text-primary)]">
              Custom
            </p>
            <p className="mb-6 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
              Dedicated support. Custom development. SLA guarantees.
            </p>
            <ul className="m-0 mb-8 flex flex-1 list-none flex-col gap-3 p-0">
              {enterpriseFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="mt-0.5 shrink-0"
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
                  <span className="text-[var(--font-size-body-s)] text-[var(--color-text-secondary)]">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <Button href="/docs" variant="primary" className="w-full">
              Get started
            </Button>
          </Card>
        </div>

        {/* License explanation */}
        <div className="mx-auto mt-12 max-w-[700px]">
          <Card>
            <h3 className="mb-2 text-[var(--font-size-h4)] font-semibold text-[var(--color-text-primary)]">
              Apache 2.0 License
            </h3>
            <p className="m-0 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              The Apache 2.0 license allows you to use SAP Connect for any
              purpose, including commercial use, without paying license fees.
              You can modify the source code, create derivative works, and
              distribute them under your own terms. The license includes an
              express grant of patent rights from contributors. Your only
              obligation is to include the original copyright notice and
              license text.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
