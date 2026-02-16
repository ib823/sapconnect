import type { Metadata } from 'next';
import Button from '@/components/ui/Button';
import FieldMappingDemo from '@/components/marketing/FieldMappingDemo';
import IndustryGrid from '@/components/marketing/IndustryGrid';

export const metadata: Metadata = {
  title: 'Solution',
  description:
    'From forensic discovery to validated migration. Three phases, one platform, any source ERP.',
};

export default function SolutionPage() {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Hero                                                     */}
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
            From forensic discovery
            <br />
            to validated migration.
          </h1>
          <p
            className="text-xl m-0 mb-10 mx-auto max-w-xl"
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-body)',
            }}
          >
            Three phases. One platform. Any source ERP.
          </p>
          <Button href="/platform" variant="primary">
            Explore the platform
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Three-phase methodology                                  */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-20">
            {[
              {
                phase: 'Phase 1',
                title: 'Forensic Extraction',
                description:
                  '7-dimension deep scan across any source ERP. Configurations, customizations, interfaces, data volumes, process flows, organizational structures, and data quality — all discovered automatically.',
                metric: '35+ extractors',
              },
              {
                phase: 'Phase 2',
                title: 'Canonical Mapping',
                description:
                  'Every source field maps to one of 14 OAGIS-aligned canonical entities, then transforms to the SAP S/4HANA target. Source-agnostic by design — add a new ERP without rewriting migration objects.',
                metric: '14 canonical entities',
              },
              {
                phase: 'Phase 3',
                title: 'ETLV Validation',
                description:
                  'Extract-Transform-Load-Validate pipeline with six-point reconciliation. Record counts, field-level checksums, referential integrity, business rule validation, and regression testing.',
                metric: '6,180 tests',
              },
            ].map((item) => (
              <div key={item.title}>
                <p
                  className="text-xs font-semibold uppercase tracking-widest m-0 mb-2"
                  style={{ color: 'var(--color-brand)' }}
                >
                  {item.phase}
                </p>
                <h3
                  className="text-xl font-semibold m-0 mb-4"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm m-0 mb-4"
                  style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--leading-body)',
                  }}
                >
                  {item.description}
                </p>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: 'var(--color-brand-subtle)',
                    color: 'var(--color-brand)',
                  }}
                >
                  {item.metric}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Field-level mapping                                      */}
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
            Every field has a home.
          </h2>
          <p
            className="text-lg m-0 mb-16 text-center max-w-xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Real field mappings from real source systems, through the canonical
            model, to SAP S/4HANA.
          </p>
          <FieldMappingDemo />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: Complexity Scoring                                       */}
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
            Know your timeline before you start.
          </h2>
          <p
            className="text-lg m-0 mb-16 text-center max-w-xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            7-dimension complexity scoring gives you a data-driven estimate
            from day one.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { score: '1-3', level: 'Low', timeline: '6-12 months' },
              { score: '4-6', level: 'Medium', timeline: '12-24 months' },
              { score: '7-8', level: 'High', timeline: '18-36 months' },
              { score: '9-10', level: 'Very High', timeline: '24-48 months' },
            ].map((item) => (
              <div
                key={item.level}
                className="px-5 py-6 rounded-xl border text-center"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p
                  className="text-3xl font-semibold m-0 mb-1 tabular-nums"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {item.score}
                </p>
                <p
                  className="text-sm font-semibold m-0 mb-2"
                  style={{ color: 'var(--color-brand)' }}
                >
                  {item.level}
                </p>
                <p
                  className="text-xs m-0"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {item.timeline}
                </p>
              </div>
            ))}
          </div>
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
            Industry-specific intelligence
          </h2>
          <p
            className="text-lg m-0 mb-16 text-center max-w-xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Each vertical includes compliance requirements, known gaps, and
            SAP-specific advantages.
          </p>
          <IndustryGrid />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 6: Competitive Comparison                                   */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site max-w-4xl">
          <h2
            className="text-3xl lg:text-4xl font-semibold m-0 mb-16 text-center"
            style={{ color: 'var(--color-text-primary)' }}
          >
            How SEN compares
          </h2>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left border-collapse" style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th
                    className="py-3 pr-4 text-xs font-semibold uppercase tracking-widest border-b"
                    style={{ color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border)' }}
                  >
                    Dimension
                  </th>
                  <th
                    className="py-3 px-4 text-xs font-semibold uppercase tracking-widest border-b"
                    style={{ color: 'var(--color-brand)', borderColor: 'var(--color-border)' }}
                  >
                    SEN
                  </th>
                  <th
                    className="py-3 px-4 text-xs font-semibold uppercase tracking-widest border-b"
                    style={{ color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border)' }}
                  >
                    Manual Consulting
                  </th>
                  <th
                    className="py-3 pl-4 text-xs font-semibold uppercase tracking-widest border-b"
                    style={{ color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border)' }}
                  >
                    Generic ETL
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { dim: 'Forensic depth', sen: '7 dimensions, automated', manual: 'Manual interviews', etl: 'Not included' },
                  { dim: 'Field-level mapping', sen: 'Canonical model, 14 entities', manual: 'Spreadsheet-based', etl: 'Column mapping only' },
                  { dim: 'Industry compliance', sen: '10 verticals built-in', manual: 'Consultant knowledge', etl: 'Not included' },
                  { dim: 'Automated testing', sen: '6,180 tests', manual: 'Manual test scripts', etl: 'Row counts only' },
                  { dim: 'Multi-ERP support', sen: 'SAP, Infor (4 products)', manual: 'Varies by firm', etl: 'Any-to-any' },
                ].map((row) => (
                  <tr key={row.dim}>
                    <td
                      className="py-3 pr-4 text-sm font-medium border-b"
                      style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
                    >
                      {row.dim}
                    </td>
                    <td
                      className="py-3 px-4 text-sm border-b"
                      style={{ color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
                    >
                      {row.sen}
                    </td>
                    <td
                      className="py-3 px-4 text-sm border-b"
                      style={{ color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border)' }}
                    >
                      {row.manual}
                    </td>
                    <td
                      className="py-3 pl-4 text-sm border-b"
                      style={{ color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border)' }}
                    >
                      {row.etl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 7: CTA                                                      */}
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
