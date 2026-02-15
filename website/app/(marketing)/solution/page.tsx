import type { Metadata } from 'next';
import Button from '@/components/ui/Button';
import ROICalculator from '@/components/sections/ROICalculator';

export const metadata: Metadata = {
  title: 'Solution | SEN',
  description:
    'From assessment to cutover, automated. SEN covers every phase of the migration lifecycle in a single platform.',
};

const phases = [
  {
    step: 1,
    title: 'Discover',
    description: 'Automated deep-scan of your SAP landscape across all modules.',
    metric: '35 extractors',
  },
  {
    step: 2,
    title: 'Analyze',
    description: 'Apply compatibility rules to identify issues in custom code.',
    metric: '874 rules',
  },
  {
    step: 3,
    title: 'Profile',
    description: 'Data quality assessment with duplicate detection and integrity checks.',
    metric: '97% accuracy',
  },
  {
    step: 4,
    title: 'Configure',
    description: 'Generate configuration sequences from pre-built templates.',
    metric: '55 BDC sequences',
  },
  {
    step: 5,
    title: 'Migrate',
    description: 'Extract, transform, load, and validate business objects automatically.',
    metric: '42 objects',
  },
  {
    step: 6,
    title: 'Validate',
    description: 'Six-point reconciliation comparing source and target systems.',
    metric: '100% coverage',
  },
  {
    step: 7,
    title: 'Test',
    description: 'End-to-end test scenarios generated from process templates.',
    metric: '30+ templates',
  },
  {
    step: 8,
    title: 'Cutover',
    description: 'Dependency-aware runbooks with critical path analysis and rollback.',
    metric: '200+ tasks',
  },
];

export default function SolutionPage() {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Section A: Hero                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-32 lg:py-40" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="container-site max-w-3xl text-center">
          <h1
            className="text-5xl lg:text-6xl font-semibold tracking-tighter m-0 mb-6"
            style={{
              lineHeight: 'var(--leading-heading)',
              color: 'var(--color-text-primary)',
            }}
          >
            From assessment to cutover.
            <br />
            Automated.
          </h1>
          <p
            className="text-xl m-0 mb-10 mx-auto max-w-xl"
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-body)',
            }}
          >
            SEN covers every phase of the migration lifecycle in a
            single platform.
          </p>
          <Button href="/platform" variant="primary">
            Explore the platform
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section B: Journey (vertical timeline)                              */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site max-w-2xl">
          <h2
            className="text-3xl lg:text-4xl font-semibold m-0 mb-4 text-center"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Eight phases. One platform.
          </h2>
          <p
            className="text-lg m-0 mb-16 text-center"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Each phase produces auditable artifacts and feeds directly into the
            next.
          </p>

          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-5 top-0 bottom-0 w-[2px]"
              style={{ backgroundColor: 'var(--color-border)' }}
              aria-hidden="true"
            />

            <div className="flex flex-col gap-12">
              {phases.map((phase) => (
                <div key={phase.step} className="relative flex gap-8 items-start">
                  {/* Circle */}
                  <div
                    className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: 'var(--color-brand)' }}
                  >
                    {phase.step}
                  </div>

                  {/* Content */}
                  <div className="pt-1.5">
                    <h3
                      className="text-lg font-semibold m-0 mb-1"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {phase.title}
                    </h3>
                    <p
                      className="text-base m-0 mb-2"
                      style={{
                        color: 'var(--color-text-secondary)',
                        lineHeight: 'var(--leading-body)',
                      }}
                    >
                      {phase.description}
                    </p>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-brand-subtle)',
                        color: 'var(--color-brand)',
                      }}
                    >
                      {phase.metric}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section C: ROI Calculator                                           */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="container-site max-w-4xl">
          <h2
            className="text-3xl lg:text-4xl font-semibold m-0 mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Estimate your savings
          </h2>
          <p
            className="text-lg m-0 mb-12"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Adjust the parameters to see how automation reduces your migration
            timeline and cost.
          </p>
          <ROICalculator />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section D: Benefits (3 key outcomes)                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <h2
            className="text-3xl lg:text-4xl font-semibold m-0 mb-16 text-center"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Why organizations choose SEN
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-20">
            {[
              {
                headline: '60% faster timelines',
                description:
                  'Automation replaces weeks of manual work at every phase. What traditionally takes 12-18 months completes in weeks.',
              },
              {
                headline: '100% audit trail',
                description:
                  'Every operation is logged, every change tracked through transport requests, every AI artifact reviewed by humans.',
              },
              {
                headline: 'Zero vendor lock-in',
                description:
                  'Apache 2.0 licensed, self-hosted, deployable anywhere. Your data and migration logic stay under your control.',
              },
            ].map((benefit) => (
              <div key={benefit.headline} className="text-center">
                <h3
                  className="text-xl font-semibold m-0 mb-3"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {benefit.headline}
                </h3>
                <p
                  className="text-base m-0"
                  style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--leading-body)',
                  }}
                >
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section E: Connectivity                                             */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="container-site max-w-3xl">
          <h2
            className="text-3xl lg:text-4xl font-semibold m-0 mb-4 text-center"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Connect to any SAP system
          </h2>
          <p
            className="text-lg m-0 mb-16 text-center"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Three protocols cover on-premise, private cloud, and public cloud
            SAP environments.
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center">
            {[
              {
                name: 'RFC',
                description: 'Direct function calls with connection pooling and retry.',
              },
              {
                name: 'OData',
                description: 'V2/V4 with CSRF, batch operations, and pagination.',
              },
              {
                name: 'ADT',
                description: 'REST APIs for source code, testing, and transports.',
              },
            ].map((protocol) => (
              <div
                key={protocol.name}
                className="flex-1 text-center px-6 py-8 rounded-2xl border"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              >
                <p
                  className="text-lg font-semibold m-0 mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {protocol.name}
                </p>
                <p
                  className="text-sm m-0"
                  style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--leading-body)',
                  }}
                >
                  {protocol.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section F: CTA                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-32"
        style={{
          background: '#1d1d1f',
        }}
      >
        <div className="container-site max-w-2xl text-center">
          <h2
            className="text-3xl lg:text-4xl font-semibold m-0 mb-4 text-white"
            style={{ lineHeight: 'var(--leading-heading)' }}
          >
            Start your migration today
          </h2>
          <p className="text-lg m-0 mb-10 text-white/80">
            Install SEN, connect your system, and run your first
            assessment in under 10 minutes. No license required.
          </p>
          <Button
            href="/docs"
            className="bg-white text-[#1d1d1f] hover:bg-white/90 border-transparent"
          >
            Get started
          </Button>
        </div>
      </section>
    </>
  );
}
