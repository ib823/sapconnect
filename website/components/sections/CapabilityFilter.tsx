'use client';

import { useState, useMemo } from 'react';
import type { Capability } from '@/lib/capabilities';

const ALL_DOMAINS = [
  'assessment',
  'data',
  'greenfield',
  'testing',
  'cloud',
  'ai',
  'execution',
] as const;

const DOMAIN_LABELS: Record<string, string> = {
  assessment: 'Assessment',
  data: 'Data',
  greenfield: 'Greenfield',
  testing: 'Testing',
  cloud: 'Cloud',
  ai: 'AI',
  execution: 'Execution',
};

interface CapabilityFilterProps {
  capabilities: Capability[];
}

function formatStatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export default function CapabilityFilter({ capabilities }: CapabilityFilterProps) {
  const [activeDomain, setActiveDomain] = useState<string>('all');

  const availableDomains = useMemo(() => {
    const domains = new Set<string>();
    for (const cap of capabilities) {
      for (const tag of cap.domainTags) {
        domains.add(tag);
      }
    }
    return ALL_DOMAINS.filter((d) => domains.has(d));
  }, [capabilities]);

  const filtered = useMemo(() => {
    if (activeDomain === 'all') return capabilities;
    return capabilities.filter((c) => c.domainTags.includes(activeDomain));
  }, [capabilities, activeDomain]);

  return (
    <div>
      {/* Domain tabs */}
      <div
        className="mb-8 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter by domain"
      >
        <button
          role="tab"
          aria-selected={activeDomain === 'all'}
          onClick={() => setActiveDomain('all')}
          className={`rounded-[var(--radius-chip)] border px-4 py-2 text-[var(--font-size-body-s)] font-medium transition-colors cursor-pointer ${
            activeDomain === 'all'
              ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white'
              : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'
          }`}
        >
          All
        </button>
        {availableDomains.map((domain) => (
          <button
            key={domain}
            role="tab"
            aria-selected={activeDomain === domain}
            onClick={() => setActiveDomain(domain)}
            className={`rounded-[var(--radius-chip)] border px-4 py-2 text-[var(--font-size-body-s)] font-medium transition-colors cursor-pointer ${
              activeDomain === domain
                ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white'
                : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'
            }`}
          >
            {DOMAIN_LABELS[domain] || domain}
          </button>
        ))}
      </div>

      {/* Capability cards */}
      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        role="tabpanel"
        aria-label={`${activeDomain === 'all' ? 'All' : DOMAIN_LABELS[activeDomain] || activeDomain} capabilities`}
      >
        {filtered.map((cap) => {
          const firstStatKey = Object.keys(cap.stats)[0];
          const firstStatValue = firstStatKey ? cap.stats[firstStatKey] : '';
          const firstStatLabel = firstStatKey ? formatStatKey(firstStatKey) : '';
          const primaryDomain = cap.domainTags[0] || '';

          return (
            <a
              key={cap.id}
              href={`/capabilities/${cap.id}`}
              className="group flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 no-underline transition-shadow duration-200 hover:shadow-lg"
            >
              {/* Icon */}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg text-xl" aria-hidden="true">
                {cap.icon}
              </div>

              {/* Title */}
              <h3 className="mb-2 text-[var(--font-size-body-l)] font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand)] transition-colors">
                {cap.title}
              </h3>

              {/* Summary */}
              <p className="m-0 mb-4 flex-1 text-[var(--font-size-body-s)] leading-relaxed text-[var(--color-text-secondary)]">
                {cap.summary}
              </p>

              {/* Stat badge and domain */}
              <div className="flex items-center justify-between">
                {firstStatKey && (
                  <span
                    className="rounded-[var(--radius-chip)] px-3 py-1 text-[var(--font-size-caption)] font-medium"
                    style={{
                      backgroundColor: 'var(--color-brand-subtle)',
                      color: 'var(--color-brand)',
                    }}
                  >
                    {firstStatLabel}: {firstStatValue}
                  </span>
                )}
                <span className="text-[var(--font-size-caption)] text-[var(--color-text-tertiary)]">
                  {DOMAIN_LABELS[primaryDomain] || primaryDomain}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
