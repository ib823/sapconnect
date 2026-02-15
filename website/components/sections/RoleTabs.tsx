'use client';

import { useState } from 'react';

interface RoleContent {
  label: string;
  heading: string;
  points: string[];
}

const roles: RoleContent[] = [
  {
    label: 'CEO',
    heading: 'Accelerate your SAP transformation',
    points: [
      'Reduce migration timelines from 12-18 months to weeks, freeing capital for strategic initiatives.',
      'Eliminate vendor lock-in with an open-source platform you fully own and control.',
      'Present board-ready audit trails that demonstrate governance at every stage.',
    ],
  },
  {
    label: 'CFO',
    heading: 'Reduce cost and financial risk',
    points: [
      'Cut project costs by 40% through automation of repetitive migration tasks.',
      'De-risk go-live with 4,910 automated tests validating every operation.',
      'Accelerate time-to-value with projects completing in weeks, not months.',
    ],
  },
  {
    label: 'CIO',
    heading: 'Enterprise architecture, zero lock-in',
    points: [
      'Connect via RFC, OData, or ADT REST with automatic retry and pooling.',
      '43 MCP tools give AI agents safe, audited access to SAP operations.',
      'Deploy anywhere: on-premises, BTP, AWS, Azure, or GCP. Apache 2.0 licensed.',
    ],
  },
  {
    label: 'Program Lead',
    heading: 'Predictable timelines, full visibility',
    points: [
      '8-phase migration lifecycle with automated milestones and go/no-go gates.',
      '874 rules scan 21 modules in minutes, replacing weeks of manual review.',
      '42 pre-built migration objects with 1,600+ field mappings, ready to use.',
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
