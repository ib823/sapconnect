export const SITE = {
  name: 'SAP Connect',
  tagline: 'Enterprise SAP Migration Platform',
  description: 'Open-source platform replacing 6-month SAP migration timelines with automated, code-driven execution.',
  repo: 'https://github.com/ib823/sapconnect',
} as const;

export const NAV_ITEMS = [
  { label: 'Solution', href: '/solution' },
  { label: 'Platform', href: '/platform' },
  { label: 'Capabilities', href: '/capabilities' },
  { label: 'Docs', href: '/docs' },
  { label: 'Pricing', href: '/pricing' },
] as const;

export const FOOTER_LINKS = {
  Product: [
    { label: 'Solution Overview', href: '/solution' },
    { label: 'Platform', href: '/platform' },
    { label: 'Capabilities', href: '/capabilities' },
    { label: 'Security', href: '/security' },
    { label: 'Pricing', href: '/pricing' },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'ROI Calculator', href: '/roi' },
    { label: 'Case Studies', href: '/case-studies' },
    { label: 'About', href: '/about' },
  ],
  Community: [
    { label: 'GitHub', href: 'https://github.com/ib823/sapconnect' },
    { label: 'Contact', href: '/contact' },
  ],
} as const;

export const STATS = {
  rules: 874,
  migrationObjects: 42,
  fieldMappings: '1,600+',
  tests: '4,910',
  mcpTools: 43,
} as const;
