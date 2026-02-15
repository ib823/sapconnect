import type { Metadata } from 'next';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { SITE, STATS } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Solution Overview | SAP Connect',
  description:
    'End-to-end SAP migration automation: from system discovery through production cutover. One platform replacing manual processes, spreadsheets, and consultant guesswork.',
};

/* ------------------------------------------------------------------ */
/* SVG icon helpers                                                    */
/* ------------------------------------------------------------------ */

const ScanIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);

const CodeIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </svg>
);

const DatabaseIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const SettingsIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const BoxIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const CheckCircleIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ClipboardIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const RocketIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const phases = [
  {
    step: 1,
    title: 'Discover',
    subtitle: 'System Assessment',
    description: 'Automated deep-scan of your existing SAP landscape. 35 specialized extractors catalog custom code, configurations, interfaces, usage patterns, and data volumes across all modules.',
    metric: '35 extractors, 8 modules',
    icon: ScanIcon,
  },
  {
    step: 2,
    title: 'Analyze',
    subtitle: 'Code and Process Review',
    description: 'Apply 874 compatibility rules to identify issues in custom code. Mine actual business processes from change documents to reveal bottlenecks and deviations from standard flows.',
    metric: '874 rules, 52 process variants',
    icon: CodeIcon,
  },
  {
    step: 3,
    title: 'Profile',
    subtitle: 'Data Quality Assessment',
    description: 'Run data profiling across master and transactional data. Fuzzy matching detects duplicates at 97% accuracy. Referential integrity checks catch gaps before they become migration blockers.',
    metric: '6 checks per object, 97% detection',
    icon: DatabaseIcon,
  },
  {
    step: 4,
    title: 'Configure',
    subtitle: 'System Setup',
    description: 'Generate and execute configuration sequences from pre-built templates covering 55 transactions across 12 modules. Every change is tracked through transport requests with full rollback support.',
    metric: '55 BDC sequences, 12 modules',
    icon: SettingsIcon,
  },
  {
    step: 5,
    title: 'Migrate',
    subtitle: 'Data Transfer',
    description: 'Extract, transform, load, and validate 42 business objects through a code-driven pipeline. 881 transformation rules handle value mappings, concatenations, lookups, and derivations automatically.',
    metric: '42 objects, 1,600+ field mappings',
    icon: BoxIcon,
  },
  {
    step: 6,
    title: 'Validate',
    subtitle: 'Reconciliation',
    description: 'Six-point automated validation compares source and target systems: record counts, key integrity, amount checksums, referential integrity, business rules, and duplicate detection.',
    metric: '100% defect detection rate',
    icon: CheckCircleIcon,
  },
  {
    step: 7,
    title: 'Test',
    subtitle: 'Process Verification',
    description: 'Execute end-to-end test scenarios generated from process templates. Covers order-to-cash, procure-to-pay, and record-to-report flows with a live test harness supporting dry-run mode.',
    metric: '30+ templates, 6 modules',
    icon: ClipboardIcon,
  },
  {
    step: 8,
    title: 'Cutover',
    subtitle: 'Go-Live Execution',
    description: 'Dependency-aware cutover runbooks with critical path analysis, parallel execution windows, real-time progress streaming, and automated rollback procedures at every stage.',
    metric: '200+ task templates',
    icon: RocketIcon,
  },
];

const connectivityMethods = [
  {
    name: 'RFC',
    description: 'Direct function calls to ABAP backends with connection pooling, automatic retry, and graceful degradation when unavailable.',
  },
  {
    name: 'OData',
    description: 'V2 and V4 client with automatic CSRF token management, batch operations, pagination handling, and multi-system support.',
  },
  {
    name: 'ADT REST',
    description: 'ABAP Development Tools REST APIs for source code access, test execution, and transport operations.',
  },
];

const ecosystemItems = [
  { label: 'SuccessFactors', description: 'Employee master data sync, organizational structure' },
  { label: 'Ariba', description: 'Procurement workflows, supplier management' },
  { label: 'Concur', description: 'Expense management, travel integration' },
  { label: 'Analytics Cloud', description: 'Reporting models, plan data import' },
  { label: 'Signavio', description: 'BPMN process models, config mapping' },
  { label: 'Cloud ALM', description: 'Project templates, lifecycle management' },
];

const benefits = [
  {
    title: 'Reduce project timelines by 60%',
    description: 'Automation replaces weeks of manual work at every phase. What traditionally takes 12-18 months can be completed in 8-12 weeks.',
  },
  {
    title: 'Eliminate manual data mapping',
    description: '1,600+ pre-built field mappings and 881 transformation rules replace spreadsheet-based mapping exercises that consume entire teams.',
  },
  {
    title: 'Catch issues early, not at go-live',
    description: 'Data quality profiling and code compatibility scanning run from day one, not during testing. Issues surface when they are cheapest to fix.',
  },
  {
    title: 'Full audit trail and compliance',
    description: 'Every operation is logged, every change is tracked through transport requests, and every AI-generated artifact passes through human review gates.',
  },
  {
    title: 'No vendor lock-in',
    description: 'Apache 2.0 licensed, self-hosted, and deployable on any infrastructure. Your data and your migration logic stay under your control.',
  },
  {
    title: 'AI-assisted operations',
    description: '43 MCP tools give AI agents safe, audited access to SAP operations with built-in safety gates that enforce transport management on every write.',
  },
];

/* ------------------------------------------------------------------ */
/* Page component                                                      */
/* ------------------------------------------------------------------ */

export default function SolutionPage() {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 lg:py-28" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="container-site">
          <div className="mx-auto max-w-[800px] text-center">
            <h1
              className="text-4xl lg:text-5xl font-bold tracking-tight m-0 mb-6"
              style={{
                lineHeight: 'var(--leading-heading)',
                color: 'var(--color-text-primary)',
              }}
            >
              One platform for the entire SAP migration lifecycle
            </h1>
            <p
              className="text-lg m-0 mb-8 mx-auto max-w-2xl"
              style={{
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-body)',
              }}
            >
              SAP Connect automates every phase from initial system discovery
              through production cutover. Replace manual processes,
              spreadsheets, and consultant guesswork with a code-driven
              framework backed by {STATS.tests} automated tests.
            </p>
            <div className="flex justify-center flex-wrap gap-3">
              <Button href="/docs" variant="primary">
                Get started
              </Button>
              <Button href="/platform" variant="secondary">
                View platform details
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Proof strip                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-8 border-y border-[var(--color-border)]"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
            {[
              { value: String(STATS.rules), label: 'Compatibility Rules' },
              { value: String(STATS.migrationObjects), label: 'Migration Objects' },
              { value: STATS.fieldMappings, label: 'Field Mappings' },
              { value: STATS.tests, label: 'Automated Tests' },
              { value: String(STATS.mcpTools), label: 'AI Tools' },
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
      {/* 8-Phase Journey                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-20 lg:py-24"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="container-site">
          <div className="text-center mb-14">
            <h2
              className="text-3xl lg:text-4xl font-bold m-0 mb-3"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Eight phases. Fully automated.
            </h2>
            <p
              className="text-lg m-0 max-w-2xl mx-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Each phase produces auditable artifacts, validates its own output,
              and feeds directly into the next. No manual handoffs between
              phases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {phases.map((phase) => (
              <Card key={phase.step} className="flex gap-5">
                <div className="shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: 'var(--color-brand)' }}
                  >
                    {phase.step}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div>
                    <h3
                      className="text-base font-semibold m-0"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {phase.title}
                    </h3>
                    <span
                      className="text-xs font-medium"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {phase.subtitle}
                    </span>
                  </div>
                  <p
                    className="text-sm m-0"
                    style={{
                      color: 'var(--color-text-secondary)',
                      lineHeight: 'var(--leading-body)',
                    }}
                  >
                    {phase.description}
                  </p>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full w-fit"
                    style={{
                      backgroundColor: 'var(--color-brand-subtle)',
                      color: 'var(--color-brand)',
                    }}
                  >
                    {phase.metric}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Connectivity                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-20 lg:py-24"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <h2
                className="text-3xl lg:text-4xl font-bold m-0 mb-4"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Connect to any SAP system
              </h2>
              <p
                className="text-lg m-0 mb-8"
                style={{
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-body)',
                }}
              >
                Three complementary connectivity protocols ensure SAP Connect
                works with on-premise, private cloud, and public cloud SAP
                environments. Multi-source connection management coordinates
                across complex system landscapes.
              </p>
              <div className="flex flex-col gap-4">
                {connectivityMethods.map((method) => (
                  <div key={method.name} className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{
                        backgroundColor: 'var(--color-brand-subtle)',
                        color: 'var(--color-brand)',
                      }}
                    >
                      {method.name.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h3
                        className="text-sm font-semibold m-0 mb-1"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {method.name}
                      </h3>
                      <p
                        className="text-sm m-0"
                        style={{
                          color: 'var(--color-text-secondary)',
                          lineHeight: 'var(--leading-body)',
                        }}
                      >
                        {method.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture diagram (text-based) */}
            <Card className="font-mono text-xs leading-relaxed overflow-x-auto">
              <pre
                className="m-0 whitespace-pre"
                style={{ color: 'var(--color-text-secondary)' }}
              >
{`  SAP Connect Platform
  +---------------------------------------------+
  |                                             |
  |   +-----------+  +-----------+  +---------+ |
  |   | Extraction|  | Migration |  |   AI    | |
  |   |  Engine   |  | Framework |  | Agents  | |
  |   +-----------+  +-----------+  +---------+ |
  |        |              |              |       |
  |   +----+--------------+--------------+----+ |
  |   |        Connection Manager             | |
  |   +----+--------------+--------------+----+ |
  |        |              |              |       |
  +--------|--------------|--------------|-------+
           |              |              |
     +-----+----+  +------+-----+  +----+------+
     |   RFC    |  |   OData    |  | ADT REST  |
     | Pool +   |  | V2/V4 +   |  | Source +   |
     | Table Rd |  | CSRF +    |  | ATC +     |
     |          |  | Batch     |  | Transport |
     +-----+----+  +------+-----+  +----+------+
           |              |              |
     +-----+--------------+--------------+------+
     |          SAP System Landscape            |
     |  On-Premise | Private Cloud | Public     |
     +----------------------------------------------+`}
              </pre>
            </Card>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Cloud Ecosystem                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-20 lg:py-24"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="container-site">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold m-0 mb-3"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Integrated ecosystem
            </h2>
            <p
              className="text-lg m-0 max-w-2xl mx-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Pre-built connectors for SAP cloud products and third-party
              tools. Each integration handles authentication, field mapping,
              error recovery, and monitoring out of the box.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ecosystemItems.map((item) => (
              <Card key={item.label} className="flex flex-col gap-2">
                <h3
                  className="text-base font-semibold m-0"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {item.label}
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
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Real-Time Dashboard                                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-20 lg:py-24"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className="text-3xl lg:text-4xl font-bold m-0 mb-4"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Real-time progress visibility
              </h2>
              <p
                className="text-lg m-0 mb-6"
                style={{
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-body)',
                }}
              >
                Server-sent events stream live progress updates during
                extraction, migration, and testing phases. Monitor every
                operation as it happens with full history replay.
              </p>
              <ul className="m-0 p-0 list-none flex flex-col gap-3">
                {[
                  'Live extraction progress with per-extractor status',
                  'Migration wave tracking with record-level detail',
                  'Test execution monitoring with pass/fail streaming',
                  'Event history with full replay capability',
                ].map((item) => (
                  <li key={item} className="flex gap-3 items-start">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="mt-0.5 shrink-0"
                      aria-hidden="true"
                    >
                      <circle cx="10" cy="10" r="10" fill="var(--color-brand-subtle)" />
                      <path
                        d="M6.5 10L9 12.5L13.5 7.5"
                        stroke="var(--color-brand)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="font-mono text-xs leading-relaxed">
              <div className="flex flex-col gap-1.5">
                <div style={{ color: 'var(--color-text-tertiary)' }}>// Live SSE stream</div>
                <div style={{ color: 'var(--color-brand)' }}>event: extraction:progress</div>
                <div style={{ color: 'var(--color-text-secondary)' }}>
                  {'{'} extractor: &quot;custom-code&quot;, progress: 0.85 {'}'}
                </div>
                <div style={{ color: 'var(--color-brand)' }}>event: extraction:complete</div>
                <div style={{ color: 'var(--color-text-secondary)' }}>
                  {'{'} extractor: &quot;custom-code&quot;, records: 12847 {'}'}
                </div>
                <div style={{ color: 'var(--color-brand)' }}>event: migration:progress</div>
                <div style={{ color: 'var(--color-text-secondary)' }}>
                  {'{'} object: &quot;customer-master&quot;, loaded: 4200 {'}'}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Benefits                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-20 lg:py-24"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="container-site">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold m-0 mb-3"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Why organizations choose SAP Connect
            </h2>
            <p
              className="text-lg m-0 max-w-2xl mx-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Measurable outcomes across cost, timeline, quality, and risk
              reduction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="flex flex-col gap-3">
                <h3
                  className="text-base font-semibold m-0"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {benefit.title}
                </h3>
                <p
                  className="text-sm m-0"
                  style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--leading-body)',
                  }}
                >
                  {benefit.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Stats band                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="py-16"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div className="text-center">
              <p
                className="text-3xl font-bold m-0 tabular-nums"
                style={{ color: 'var(--color-brand)' }}
              >
                {STATS.tests}
              </p>
              <p
                className="text-sm m-0"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Automated tests
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-3xl font-bold m-0 tabular-nums"
                style={{ color: 'var(--color-brand)' }}
              >
                251
              </p>
              <p
                className="text-sm m-0"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Test files
              </p>
            </div>
            <div className="text-center">
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
            <div className="text-center">
              <p
                className="text-3xl font-bold m-0 tabular-nums"
                style={{ color: 'var(--color-brand)' }}
              >
                {STATS.mcpTools}
              </p>
              <p
                className="text-sm m-0"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                AI tools (MCP)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                */}
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
            Ready to automate your SAP migration?
          </h2>
          <p className="text-lg m-0 mb-8 text-white/80">
            Install SAP Connect in your environment, connect to your SAP system,
            and run your first automated assessment in under 10 minutes.
          </p>
          <div className="flex justify-center flex-wrap gap-3">
            <Button
              href="/docs"
              className="bg-white text-[var(--color-brand)] hover:bg-white/90 border-transparent"
            >
              Get started
            </Button>
            <Button
              href={SITE.repo}
              className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white/50"
              variant="secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
