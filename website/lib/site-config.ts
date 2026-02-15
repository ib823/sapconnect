export const SITE = {
  name: 'SEN',
  tagline: 'Universal ERP Migration Platform',
  description: 'Open-source platform migrating any ERP to SAP S/4HANA through a canonical data model.',
  repo: 'https://github.com/ib823/sapconnect',
} as const;

export const NAV_ITEMS = [
  { label: 'Solution', href: '/solution' },
  { label: 'Platform', href: '/platform' },
  { label: 'Industries', href: '/solution#industries' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
] as const;

export const FOOTER_LINKS = {
  Product: [
    { label: 'Solution', href: '/solution' },
    { label: 'Platform', href: '/platform' },
    { label: 'Industries', href: '/solution#industries' },
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
  tests: '6,180',
  mcpTools: 58,
  canonicalEntities: 14,
  industries: 10,
  inforProducts: 4,
  securityTiers: 4,
} as const;
