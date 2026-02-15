'use client';

import { useState } from 'react';

interface RoleContent {
  label: string;
  heading: string;
  points: string[];
}

const roles: RoleContent[] = [
  {
    label: 'CFO',
    heading: 'Reduce cost and financial risk',
    points: [
      'Cut consultant spend by automating 70% of repetitive migration tasks, saving an average of 40% on total project cost.',
      'De-risk go-live with 4,910 automated tests and six-check reconciliation for every migration object.',
      'Accelerate time-to-value: projects that previously required 12-18 months complete in as few as 8-12 weeks.',
      'Avoid budget overruns with transparent, rule-based effort estimates instead of consultant guesswork.',
    ],
  },
  {
    label: 'CIO',
    heading: 'Enterprise-grade architecture and integration',
    points: [
      'Connect via RFC, OData V2/V4, or ADT REST APIs with automatic CSRF handling, connection pooling, and retry logic.',
      'Extend with 43 MCP tools that expose SAP operations to AI agents with built-in safety gates and audit trails.',
      'Operate in mock or live mode -- validate everything offline before touching production systems.',
      'Deploy on-premises, in SAP BTP, or any cloud provider. No vendor lock-in. Apache 2.0 licensed.',
    ],
  },
  {
    label: 'Program Lead',
    heading: 'Predictable timelines and full visibility',
    points: [
      '9-phase migration timeline from assessment through cutover, with automated milestones and go/no-go gates.',
      '874 custom code rules scan 21 modules in minutes, replacing weeks of manual code review.',
      '42 pre-built migration objects with 1,600+ field mappings eliminate template creation from scratch.',
      'Real-time dashboards surface extraction progress, data quality scores, and test pass rates across all workstreams.',
    ],
  },
];

export default function RoleTabs() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = roles[activeIndex];

  return (
    <div>
      {/* Tab buttons */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit mb-8"
        role="tablist"
        aria-label="Select audience"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {roles.map((role, i) => (
          <button
            key={role.label}
            role="tab"
            aria-selected={i === activeIndex}
            onClick={() => setActiveIndex(i)}
            className={`px-5 py-2.5 text-sm font-medium rounded-lg border-0 cursor-pointer transition-all ${
              i === activeIndex
                ? 'bg-[var(--color-brand)] text-white shadow-sm'
                : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel" aria-label={active.label}>
        <h3
          className="text-xl font-semibold mb-4"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {active.heading}
        </h3>
        <ul className="list-none m-0 p-0 flex flex-col gap-3">
          {active.points.map((point, i) => (
            <li key={i} className="flex gap-3 items-start">
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
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
