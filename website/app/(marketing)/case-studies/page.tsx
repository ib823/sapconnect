import type { Metadata } from 'next';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Case Studies | SAP Connect',
  description:
    'Real-world SAP Connect implementation stories. See how organizations have automated their SAP migrations.',
};

export default function CaseStudiesPage() {
  return (
    <section aria-labelledby="case-studies-heading" className="py-20">
      <div className="container-site">
        <div className="mx-auto max-w-[600px] text-center">
          <div
            className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--color-brand-subtle)' }}
            aria-hidden="true"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>

          <h1
            id="case-studies-heading"
            className="mb-4 text-[var(--font-size-h1)] font-bold leading-[var(--leading-heading)] text-[var(--color-text-primary)]"
          >
            Case Studies
          </h1>
          <p className="mb-10 text-[var(--font-size-body-l)] leading-relaxed text-[var(--color-text-secondary)]">
            We are currently working with early adopters to document their SAP
            Connect implementation experiences. Detailed case studies covering
            assessment, migration, and go-live outcomes will be published here.
          </p>

          <div
            className="mb-10 rounded-[var(--radius-card)] border border-[var(--color-border)] p-8"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <p className="m-0 mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)]">
              Coming soon
            </p>
            <p className="m-0 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              Case studies are in development and will be published as
              implementations reach completion. Each study will include project
              scope, timeline, automation coverage, and measurable outcomes.
            </p>
          </div>

          <p className="mb-6 text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
            Interested in being featured? We would like to hear about your
            experience with SAP Connect.
          </p>

          <Button href="/contact" variant="primary">
            Get in touch
          </Button>
        </div>
      </div>
    </section>
  );
}
