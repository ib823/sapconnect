import type { Metadata } from 'next';
import Button from '@/components/ui/Button';
import RoleTabs from '@/components/sections/RoleTabs';
import { SITE } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'SAP migrations. Weeks, not months.',
};

export default function HomePage() {
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
            SAP migrations.
            <br />
            Weeks, not months.
          </h1>
          <p
            className="text-xl m-0 mb-10 mx-auto max-w-xl"
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-body)',
            }}
          >
            Open-source platform that automates assessment, migration, and
            testing for SAP implementations.
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
      {/* Section B: Three proof points                                       */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-20">
            {[
              {
                number: '4,910',
                label: 'tests',
                sentence:
                  'Every operation is validated before it touches your system.',
              },
              {
                number: '42',
                label: 'objects',
                sentence:
                  'Pre-built migration paths for every major SAP business object.',
              },
              {
                number: '874',
                label: 'rules',
                sentence:
                  'Automated compatibility scanning across 21 SAP modules.',
              },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p
                  className="text-5xl lg:text-6xl font-semibold m-0 mb-2 tabular-nums"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {item.number}
                </p>
                <p
                  className="text-sm font-medium uppercase tracking-widest m-0 mb-4"
                  style={{ color: 'var(--color-brand)' }}
                >
                  {item.label}
                </p>
                <p
                  className="text-base m-0 max-w-xs mx-auto"
                  style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--leading-body)',
                  }}
                >
                  {item.sentence}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section C: Before / After                                           */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="container-site max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            {/* Without */}
            <div>
              <h2
                className="text-2xl font-semibold m-0 mb-8"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Without SEN
              </h2>
              <div className="flex flex-col gap-6">
                {[
                  '6-18 month timelines with constant schedule risk.',
                  'Manual spreadsheets and consultant guesswork.',
                  'Defects discovered late, at the highest cost to fix.',
                ].map((point) => (
                  <p
                    key={point}
                    className="text-base m-0 pl-5"
                    style={{
                      color: 'var(--color-text-secondary)',
                      lineHeight: 'var(--leading-body)',
                      borderLeft: '2px solid var(--color-border)',
                    }}
                  >
                    {point}
                  </p>
                ))}
              </div>
            </div>

            {/* With */}
            <div>
              <h2
                className="text-2xl font-semibold m-0 mb-8"
                style={{ color: 'var(--color-text-primary)' }}
              >
                With SEN
              </h2>
              <div className="flex flex-col gap-6">
                {[
                  'Weeks, not months. Automation at every phase.',
                  'Code-driven execution with full audit trail.',
                  'Continuous validation from day one through cutover.',
                ].map((point) => (
                  <p
                    key={point}
                    className="text-base m-0 pl-5"
                    style={{
                      color: 'var(--color-text-secondary)',
                      lineHeight: 'var(--leading-body)',
                      borderLeft: '2px solid var(--color-border)',
                    }}
                  >
                    {point}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section D: Role tabs                                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site max-w-3xl">
          <h2
            className="text-3xl lg:text-4xl font-semibold m-0 mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Built for every stakeholder
          </h2>
          <p
            className="text-lg m-0 mb-12"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Whether you own the budget, the architecture, or the delivery
            plan, SEN gives you the data you need.
          </p>
          <RoleTabs />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section E: CTA                                                      */}
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
