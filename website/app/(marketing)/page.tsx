import type { Metadata } from 'next';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import HeroVisual from '@/components/sections/HeroVisual';
import Timeline from '@/components/sections/Timeline';
import RoleTabs from '@/components/sections/RoleTabs';
import ROICalculator from '@/components/sections/ROICalculator';
import { SITE, STATS } from '@/lib/site-config';
import { getCapabilities } from '@/lib/capabilities';

export const metadata: Metadata = {
  title: 'Replace 6-month SAP timelines with code-driven execution',
};

const SHIELD_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const securityItems = [
  {
    title: 'Input Validation',
    description: 'JSON Schema-based validation with SAP-specific rules for every API request.',
  },
  {
    title: 'Rate Limiting',
    description: 'Sliding-window rate limiting per client and endpoint with configurable thresholds.',
  },
  {
    title: 'Audit Logging',
    description: 'Immutable audit trail with request hashing for tamper detection across all operations.',
  },
  {
    title: 'CSRF Protection',
    description: 'Automatic CSRF token fetch, caching, and rotation for all write operations.',
  },
];

export default function HomePage() {
  const capabilities = getCapabilities();

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Section A: Hero                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 lg:py-28" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="flex flex-col gap-6">
              <h1
                className="text-4xl lg:text-5xl font-bold tracking-tight m-0"
                style={{
                  lineHeight: 'var(--leading-heading)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Replace 6-month SAP timelines with code-driven execution
              </h1>
              <p
                className="text-lg m-0"
                style={{
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-body)',
                }}
              >
                Open-source platform that automates migration assessment, data
                profiling, configuration, and testing. 874 rules. 42 migration
                objects. 4,591 tests.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button href="/docs" variant="primary">
                  Get started
                </Button>
                <Button
                  href={SITE.repo}
                  variant="secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </Button>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="flex justify-center lg:justify-end">
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section B: Proof strip                                              */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-8 border-y border-[var(--color-border)]"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
            {[
              { value: String(STATS.rules), label: 'Rules' },
              { value: String(STATS.migrationObjects), label: 'Objects' },
              { value: STATS.fieldMappings, label: 'Mappings' },
              { value: STATS.tests, label: 'Tests' },
              { value: String(STATS.mcpTools), label: 'MCP Tools' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 text-center">
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: 'var(--color-brand)' }}
                >
                  {stat.value}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section C: Problem / Outcome                                        */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-20 lg:py-24"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="container-site">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            {/* The Problem */}
            <Card className="flex flex-col gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-danger) 12%, transparent)',
                  color: 'var(--color-danger)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" /><line x1="10" y1="6" x2="10" y2="10" /><line x1="10" y1="14" x2="10.01" y2="14" />
                </svg>
              </div>
              <h2
                className="text-2xl font-bold m-0"
                style={{ color: 'var(--color-text-primary)' }}
              >
                The problem
              </h2>
              <ul
                className="m-0 pl-5 flex flex-col gap-2 text-sm"
                style={{
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-body)',
                }}
              >
                <li>SAP migrations take 6 to 18 months on average, with significant schedule risk at every phase.</li>
                <li>Over 60% of projects exceed their original budget due to manual effort and rework.</li>
                <li>Custom code analysis is performed by hand, missing edge cases and producing inconsistent results.</li>
                <li>Data quality issues surface only during testing, forcing costly remediation late in the project.</li>
                <li>No standardized approach to configuration, leading to inconsistencies across system landscapes.</li>
              </ul>
            </Card>

            {/* The Outcome */}
            <Card className="flex flex-col gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
                  color: 'var(--color-success)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M16 5L7.5 14L4 10" />
                </svg>
              </div>
              <h2
                className="text-2xl font-bold m-0"
                style={{ color: 'var(--color-text-primary)' }}
              >
                The outcome
              </h2>
              <ul
                className="m-0 pl-5 flex flex-col gap-2 text-sm"
                style={{
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-body)',
                }}
              >
                <li>Automated extraction scans your entire ABAP codebase in minutes, not weeks.</li>
                <li>Rule-based remediation provides fix suggestions with confidence scores for every finding.</li>
                <li>Data profiling runs early, catching duplicates and gaps before they become blockers.</li>
                <li>Pre-built migration objects with 1,600+ field mappings eliminate template creation from scratch.</li>
                <li>4,591 automated tests validate every step, delivering weeks-not-months project timelines.</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section D: Capability matrix                                        */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-20 lg:py-24"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold m-0 mb-3"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Everything you need for SAP migration
            </h2>
            <p
              className="text-lg m-0 max-w-2xl mx-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              A complete toolkit covering assessment, data, greenfield
              configuration, testing, and AI-assisted operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((cap) => {
              const primaryStat = Object.entries(cap.stats)[0];
              return (
                <a
                  key={cap.id}
                  href={`/capabilities/${cap.id}`}
                  className="no-underline group"
                >
                  <Card className="h-full flex flex-col gap-3 group-hover:border-[var(--color-brand)] transition-colors">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{
                        backgroundColor: 'var(--color-brand-subtle)',
                      }}
                      aria-hidden="true"
                    >
                      {cap.icon}
                    </div>
                    <h3
                      className="text-base font-semibold m-0"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {cap.title}
                    </h3>
                    <p
                      className="text-sm m-0 flex-1"
                      style={{
                        color: 'var(--color-text-secondary)',
                        lineHeight: 'var(--leading-body)',
                      }}
                    >
                      {cap.summary}
                    </p>
                    {primaryStat && (
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full w-fit"
                        style={{
                          backgroundColor: 'var(--color-brand-subtle)',
                          color: 'var(--color-brand)',
                        }}
                      >
                        {primaryStat[1]}
                      </span>
                    )}
                  </Card>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section E: Timeline                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-20 lg:py-24 overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="container-site">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold m-0 mb-3"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Nine phases. One platform.
            </h2>
            <p
              className="text-lg m-0 max-w-2xl mx-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              From initial assessment through production cutover, every phase is
              automated, tested, and auditable.
            </p>
          </div>
          <Timeline />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section F: Role-based tabs                                          */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-20 lg:py-24"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site max-w-3xl">
          <h2
            className="text-3xl lg:text-4xl font-bold m-0 mb-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Built for every stakeholder
          </h2>
          <p
            className="text-lg m-0 mb-10"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Whether you own the budget, the architecture, or the delivery plan,
            SAP Connect gives you the data you need.
          </p>
          <RoleTabs />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section G: Security callout                                         */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-20 lg:py-24"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="container-site max-w-4xl">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold m-0 mb-3"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Enterprise-grade security
            </h2>
            <p
              className="text-lg m-0"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Every operation passes through a multi-layer security pipeline
              before reaching your SAP system.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {securityItems.map((item) => (
              <Card key={item.title} className="flex flex-col gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-brand-subtle)',
                    color: 'var(--color-brand)',
                  }}
                >
                  {SHIELD_ICON}
                </div>
                <h3
                  className="text-base font-semibold m-0"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm m-0"
                  style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--leading-body)',
                  }}
                >
                  {item.description}
                </p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button href="/security" variant="secondary">
              Learn more about security
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section H: ROI Calculator                                           */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-20 lg:py-24"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site max-w-4xl">
          <div className="mb-10">
            <h2
              className="text-3xl lg:text-4xl font-bold m-0 mb-3"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Estimate your savings
            </h2>
            <p
              className="text-lg m-0"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Adjust the parameters below to see how automation reduces your
              migration timeline and cost.
            </p>
          </div>
          <ROICalculator />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section I: Open source / Social proof                               */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-20 lg:py-24"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="container-site max-w-3xl text-center">
          <h2
            className="text-3xl lg:text-4xl font-bold m-0 mb-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Open source. Enterprise grade.
          </h2>
          <p
            className="text-lg m-0 mb-10"
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-body)',
            }}
          >
            SAP Connect is Apache 2.0 licensed and developed in the open on
            GitHub. Every line of code is auditable. Every test is public.
            Community contributions are welcome.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
            <div>
              <p
                className="text-3xl font-bold m-0 tabular-nums"
                style={{ color: 'var(--color-brand)' }}
              >
                4,591
              </p>
              <p
                className="text-sm m-0"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Tests passing
              </p>
            </div>
            <div>
              <p
                className="text-3xl font-bold m-0 tabular-nums"
                style={{ color: 'var(--color-brand)' }}
              >
                11
              </p>
              <p
                className="text-sm m-0"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Core modules
              </p>
            </div>
            <div>
              <p
                className="text-3xl font-bold m-0 tabular-nums"
                style={{ color: 'var(--color-brand)' }}
              >
                881
              </p>
              <p
                className="text-sm m-0"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Transform rules
              </p>
            </div>
            <div>
              <p
                className="text-3xl font-bold m-0 tabular-nums"
                style={{ color: 'var(--color-brand)' }}
              >
                43
              </p>
              <p
                className="text-sm m-0"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                MCP tools
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              href={SITE.repo}
              variant="secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Star on GitHub
            </Button>
            <Button
              href={`${SITE.repo}/blob/main/CONTRIBUTING.md`}
              variant="secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contribute
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section J: Final CTA                                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-20 lg:py-28"
        style={{
          background:
            'linear-gradient(135deg, var(--color-brand), var(--color-brand-hover))',
        }}
      >
        <div className="container-site max-w-2xl text-center">
          <h2
            className="text-3xl lg:text-4xl font-bold m-0 mb-4 text-white"
            style={{ lineHeight: 'var(--leading-heading)' }}
          >
            Start your migration today
          </h2>
          <p className="text-lg m-0 mb-8 text-white/80">
            Install SAP Connect, connect your system, and run your first
            assessment in under 10 minutes. No license required.
          </p>
          <div className="flex justify-center flex-wrap gap-3">
            <Button
              href="/docs"
              className="bg-white text-[var(--color-brand)] hover:bg-white/90 border-transparent"
            >
              Get started
            </Button>
            <Button
              href="/contact"
              className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white/50"
              variant="secondary"
            >
              Contact us
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
