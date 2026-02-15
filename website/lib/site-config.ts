export const SITE = {
  name: 'SEN',
  tagline: 'Enterprise SAP Migration Platform',
  description: 'Open-source platform replacing 6-month SAP migration timelines with automated, code-driven execution.',
  repo: 'https://github.com/ib823/sapconnect',
} as const;

export const NAV_ITEMS = [
  { label: 'Solution', href: '/solution' },
  { label: 'Platform', href: '/platform' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
] as const;

export const FOOTER_LINKS = {
  Product: [
    { label: 'Solution', href: '/solution' },
    { label: 'Platform', href: '/platform' },
    { label: 'Security', href: '/security' },
    { label: 'Pricing', href: '/pricing' },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'About', href: '/about' },
    { label: 'GitHub', href: 'https://github.com/ib823/sapconnect' },
  ],
} as const;

export const STATS = {
  rules: 874,
  migrationObjects: 42,
  fieldMappings: '1,600+',
  tests: '4,910',
  mcpTools: 43,
} as const;
