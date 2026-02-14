import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import ROICalculator from '@/components/sections/ROICalculator';

export const metadata: Metadata = {
  title: 'ROI Calculator | SAP Connect',
  description:
    'Calculate the return on investment for automating your SAP migration with SAP Connect. Estimate time and cost savings based on your project parameters.',
};

export default function ROIPage() {
  return (
    <section aria-labelledby="roi-heading" className="py-20">
      <div className="container-site">
        <div className="mx-auto mb-12 max-w-[700px] text-center">
          <h1
            id="roi-heading"
            className="mb-4 text-[var(--font-size-h1)] font-bold leading-[var(--leading-heading)] text-[var(--color-text-primary)]"
          >
            Calculate your migration ROI
          </h1>
          <p className="text-[var(--font-size-body-l)] leading-relaxed text-[var(--color-text-secondary)]">
            Adjust the parameters below to estimate how much time and cost SAP
            Connect automation can save on your migration project. Results
            update in real time.
          </p>
        </div>

        <div className="mx-auto max-w-[900px]">
          <Card className="mb-12">
            <ROICalculator />
          </Card>

          {/* Methodology */}
          <section aria-labelledby="methodology-heading">
            <h2
              id="methodology-heading"
              className="mb-6 text-[var(--font-size-h3)] font-semibold text-[var(--color-text-primary)]"
            >
              Methodology
            </h2>

            <div className="flex flex-col gap-6">
              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  Baseline duration
                </h3>
                <p className="m-0 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  The baseline assumes a starting duration of 8 months for a
                  single-entity migration. Duration scales with the number of
                  legal entities (each additional entity adds 15% to the base)
                  and migration waves (each additional wave adds 20%). These
                  scaling factors reflect industry-observed patterns where
                  complexity grows non-linearly with scope.
                </p>
              </Card>

              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  Automation impact
                </h3>
                <p className="m-0 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  Automation coverage represents the percentage of migration
                  tasks that SAP Connect handles automatically. At 70%
                  coverage, roughly two-thirds of extraction, transformation,
                  validation, and testing tasks are automated. The remaining
                  30% covers planning, stakeholder management, change
                  management, and cutover activities that require human
                  judgment. A minimum of 2 months is always required for
                  planning and cutover regardless of automation level.
                </p>
              </Card>

              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  Cost model
                </h3>
                <p className="m-0 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  Costs are calculated using a blended consultant rate of
                  $18,000 per month, which represents a weighted average of
                  onshore and offshore SAP consultants. Actual rates vary by
                  region, seniority, and engagement model. The savings figure
                  represents the difference in total consultant-months between
                  the baseline and automated timelines.
                </p>
              </Card>

              <Card>
                <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
                  Limitations
                </h3>
                <p className="m-0 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                  This calculator provides directional estimates, not precise
                  forecasts. Actual results depend on system complexity,
                  custom code volume, data quality, team experience, and
                  organizational readiness. Use these figures for initial
                  business case development and refine with a detailed
                  assessment of your specific landscape.
                </p>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
