import type { Metadata } from 'next';
import Button from '@/components/ui/Button';
import RoleTabs from '@/components/sections/RoleTabs';
import SourceERPFlow from '@/components/marketing/SourceERPFlow';
import IndustryGrid from '@/components/marketing/IndustryGrid';
import { SITE } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Any ERP. One platform. Zero guesswork.',
};

export default function HomePage() {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Hero                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="min-h-[calc(100svh-116px)] py-20 lg:py-24 flex items-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="container-site max-w-3xl text-center w-full">
          <h1
            className="text-5xl lg:text-6xl font-semibold tracking-tighter m-0 mb-6"
            style={{
              lineHeight: 'var(--leading-heading)',
              color: 'var(--color-text-primary)',
            }}
          >
            Any ERP. One platform.
            <br />
            Zero guesswork.
          </h1>
          <p
            className="text-xl m-0 mb-10 mx-auto max-w-xl"
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-body)',
            }}
          >
            SEN forensically extracts your source system, maps every field
            through a canonical model, and validates the migration — so
            nothing gets lost in translation.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button href="/solution" variant="primary">
              See how it works
            </Button>
            <a
              href={SITE.repo}
              className="text-sm font-medium no-underline hover:underline"
              style={{ color: 'var(--color-text-tertiary)' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: The Problem                                              */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site max-w-4xl">
          <h2
            className="text-3xl lg:text-4xl font-semibold m-0 mb-4 text-center"
            style={{ color: 'var(--color-text-primary)' }}
          >
            ERP migrations fail because they start blind.
          </h2>
          <p
            className="text-lg m-0 mb-16 text-center max-w-xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Three problems account for most migration failures.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
            {[
              {
                headline: 'Undiscovered customizations',
                description:
                  'Hidden modifications surface during cutover — when the cost to fix them is highest.',
              },
              {
                headline: 'Unmapped fields',
                description:
                  'Data falls through the cracks between systems. Fields exist in the source with no home in the target.',
              },
              {
                headline: 'Untested transforms',
                description:
                  'What looked right in dev breaks in production. Without automated validation, defects hide until go-live.',
              },
            ].map((item) => (
              <div
                key={item.headline}
                className="px-6 py-6 rounded-xl border"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <h3
                  className="text-base font-semibold m-0 mb-3"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {item.headline}
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Three Pillars                                            */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="container-site max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-20">
            {[
              {
                pillar: 'Understand',
                description:
                  '7-dimension forensic extraction. Every configuration, customization, interface, and data quality issue — discovered automatically.',
              },
              {
                pillar: 'Migrate',
                description:
                  'Field-level mapping through 14 canonical entities. Source-agnostic. Every field has a home.',
              },
              {
                pillar: 'Validate',
                description:
                  '6,180 automated tests. Extract-Transform-Load-Validate. Every record verified before it touches your target system.',
              },
            ].map((item) => (
              <div key={item.pillar} className="text-center">
                <p
                  className="text-sm font-semibold uppercase tracking-widest m-0 mb-4"
                  style={{ color: 'var(--color-brand)' }}
                >
                  {item.pillar}
                </p>
                <p
                  className="text-base m-0"
                  style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--leading-body)',
                  }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: Universal Architecture                                   */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <h2
            className="text-3xl lg:text-4xl font-semibold m-0 mb-4 text-center"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Add a source connector once. Unlock every migration object.
          </h2>
          <p
            className="text-lg m-0 mb-16 text-center max-w-2xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            N source systems + M migration objects = N+M effort, not N x M.
            The canonical data model is the universal translator.
          </p>
          <SourceERPFlow />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 5: Industry Intelligence                                    */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="industries"
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="container-site">
          <h2
            className="text-3xl lg:text-4xl font-semibold m-0 mb-4 text-center"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Your industry. Your compliance. Built in.
          </h2>
          <p
            className="text-lg m-0 mb-16 text-center max-w-xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            10 industry verticals with pre-built compliance mappings and
            regulatory requirements.
          </p>
          <IndustryGrid />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 6: Proof Points                                             */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site max-w-3xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-16">
            {[
              { number: '6,180', label: 'tests' },
              { number: '58', label: 'MCP tools' },
              { number: '14', label: 'canonical entities' },
              { number: '10', label: 'industries' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p
                  className="text-4xl lg:text-5xl font-semibold m-0 mb-2 tabular-nums"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {item.number}
                </p>
                <p
                  className="text-sm font-medium uppercase tracking-widest m-0"
                  style={{ color: 'var(--color-brand)' }}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 7: Role Tabs                                                */}
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
            Built for every stakeholder
          </h2>
          <p
            className="text-lg m-0 mb-12 text-center max-w-2xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Whether you own the budget, the architecture, or the delivery
            plan, SEN gives you the data you need.
          </p>
          <RoleTabs />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 8: CTA                                                      */}
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
            Start your migration assessment
          </h2>
          <p className="text-lg m-0 mb-10 text-white/80">
            Install SEN, connect your source system, and run your first
            forensic extraction in under 10 minutes. No license required.
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
