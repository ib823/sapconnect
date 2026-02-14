interface TimelineStep {
  number: number;
  title: string;
  description: string;
  metric: string;
}

const steps: TimelineStep[] = [
  {
    number: 1,
    title: 'Assess',
    description: 'Scan custom code for S/4HANA incompatibilities and generate a prioritized remediation backlog.',
    metric: '874 rules across 21 modules',
  },
  {
    number: 2,
    title: 'Remediate',
    description: 'Apply auto-fix suggestions for each finding with before/after diffs and confidence scoring.',
    metric: 'Auto-fix suggestions per rule',
  },
  {
    number: 3,
    title: 'Profile',
    description: 'Analyze master and transactional data quality with fuzzy duplicate detection and gap analysis.',
    metric: 'Fuzzy duplicate detection',
  },
  {
    number: 4,
    title: 'SDT',
    description: 'Execute end-to-end test scenarios covering order-to-cash, procure-to-pay, and record-to-report.',
    metric: '52 end-to-end test scenarios',
  },
  {
    number: 5,
    title: 'Configure',
    description: 'Generate template-driven configuration for FI, CO, MM, SD, and other modules.',
    metric: 'Template-driven FI/CO/MM/SD',
  },
  {
    number: 6,
    title: 'Provision',
    description: 'Load organizational data, master data, and open items via pre-built migration objects.',
    metric: '42 objects, 1,600+ mappings',
  },
  {
    number: 7,
    title: 'Reconcile',
    description: 'Validate every loaded object with a six-check verification covering counts, totals, and hashes.',
    metric: '6-check per object validation',
  },
  {
    number: 8,
    title: 'Test',
    description: 'Run automated regression suites to confirm business processes work on the target system.',
    metric: 'Automated regression suite',
  },
  {
    number: 9,
    title: 'Cutover',
    description: 'Schedule critical-path activities with dependency tracking, go/no-go gates, and rollback plans.',
    metric: 'Critical path with rollback',
  },
];

export default function Timeline() {
  return (
    <div className="relative">
      {/* Desktop horizontal timeline */}
      <div className="hidden lg:block">
        <div className="flex items-start justify-between gap-2">
          {steps.map((step) => (
            <div key={step.number} className="flex-1 flex flex-col items-center text-center px-1">
              {/* Step indicator */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white mb-3"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                {step.number}
              </div>
              <h3
                className="text-sm font-semibold mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {step.title}
              </h3>
              <p
                className="text-xs leading-relaxed mb-2 m-0"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {step.description}
              </p>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--color-brand-subtle)',
                  color: 'var(--color-brand)',
                }}
              >
                {step.metric}
              </span>
            </div>
          ))}
        </div>
        {/* Connector line */}
        <div
          className="absolute top-5 left-[5%] right-[5%] h-[2px] -z-10"
          style={{ backgroundColor: 'var(--color-border)' }}
        />
      </div>

      {/* Mobile horizontal scroll */}
      <div className="lg:hidden overflow-x-auto pb-4 -mx-6 px-6">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col items-center text-center border border-[var(--color-border)] rounded-xl p-4"
              style={{
                width: '200px',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mb-2"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                {step.number}
              </div>
              <h3
                className="text-sm font-semibold mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {step.title}
              </h3>
              <p
                className="text-xs leading-relaxed m-0 mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {step.description}
              </p>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--color-brand-subtle)',
                  color: 'var(--color-brand)',
                }}
              >
                {step.metric}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
