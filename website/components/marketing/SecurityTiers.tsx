const tiers = [
  {
    tier: 1,
    name: 'Assessment',
    description: 'Auto-approved, read-only',
    examples: 'Extraction, discovery, analysis',
  },
  {
    tier: 2,
    name: 'Development',
    description: 'Logged, reversible',
    examples: 'Field mapping, transforms, config',
  },
  {
    tier: 3,
    name: 'Staging',
    description: '1 approver required',
    examples: 'Data load, integration test',
  },
  {
    tier: 4,
    name: 'Production',
    description: '2 approvers, change window',
    examples: 'Cutover, transport import',
  },
];

export default function SecurityTiers() {
  return (
    <div className="w-full">
      {/* Desktop: horizontal stepped */}
      <div className="hidden md:flex items-start gap-0">
        {tiers.map((tier, i) => (
          <div key={tier.tier} className="flex-1 flex flex-col items-center relative">
            {/* Connector line */}
            {i > 0 && (
              <div
                className="absolute left-0 top-6 w-1/2 h-[2px]"
                style={{ backgroundColor: 'var(--color-border)' }}
                aria-hidden="true"
              />
            )}
            {i < tiers.length - 1 && (
              <div
                className="absolute right-0 top-6 w-1/2 h-[2px]"
                style={{ backgroundColor: 'var(--color-border)' }}
                aria-hidden="true"
              />
            )}

            {/* Tier circle */}
            <div
              className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white mb-4"
              style={{
                backgroundColor: 'var(--color-brand)',
                opacity: 0.4 + (i * 0.2),
              }}
            >
              T{tier.tier}
            </div>

            {/* Content */}
            <p
              className="text-sm font-semibold m-0 mb-1 text-center"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {tier.name}
            </p>
            <p
              className="text-xs m-0 mb-2 text-center"
              style={{ color: 'var(--color-brand)' }}
            >
              {tier.description}
            </p>
            <p
              className="text-xs m-0 text-center"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {tier.examples}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden flex flex-col gap-0">
        {tiers.map((tier, i) => (
          <div key={tier.tier} className="flex gap-4 items-start">
            {/* Left column: circle + line */}
            <div className="flex flex-col items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{
                  backgroundColor: 'var(--color-brand)',
                  opacity: 0.4 + (i * 0.2),
                }}
              >
                T{tier.tier}
              </div>
              {i < tiers.length - 1 && (
                <div
                  className="w-[2px] h-12"
                  style={{ backgroundColor: 'var(--color-border)' }}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Right column: content */}
            <div className="pt-1 pb-6">
              <p
                className="text-sm font-semibold m-0"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {tier.name}
              </p>
              <p
                className="text-xs m-0"
                style={{ color: 'var(--color-brand)' }}
              >
                {tier.description}
              </p>
              <p
                className="text-xs m-0 mt-1"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {tier.examples}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
