import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SourceERPFlow from '@/components/marketing/SourceERPFlow';
import SecurityTiers from '@/components/marketing/SecurityTiers';

export const metadata: Metadata = {
  title: 'Platform | SEN',
  description:
    'Open source. Self-hosted. Enterprise grade. Universal ERP connectivity with N+M canonical architecture.',
};

const canonicalEntities = [
  { name: 'Material', description: 'Items, products, SKUs across all source systems' },
  { name: 'Customer', description: 'Customer master with addresses, contacts, credit' },
  { name: 'Vendor', description: 'Supplier master with procurement data' },
  { name: 'BOM', description: 'Bills of material and product structures' },
  { name: 'Routing', description: 'Production operations and work center assignments' },
  { name: 'GL Account', description: 'Chart of accounts and financial structure' },
  { name: 'Cost Center', description: 'Organizational cost allocation units' },
  { name: 'Profit Center', description: 'Profitability analysis segments' },
  { name: 'Sales Order', description: 'Order-to-cash document structures' },
  { name: 'Purchase Order', description: 'Procure-to-pay document structures' },
  { name: 'Work Order', description: 'Production and maintenance orders' },
  { name: 'Inventory', description: 'Stock levels, movements, valuations' },
  { name: 'Price List', description: 'Pricing conditions, discounts, surcharges' },
  { name: 'Employee', description: 'HR master records and organizational assignments' },
];

const differentiators = [
  {
    title: 'Open source',
    description:
      'Apache 2.0 licensed. Inspect every line, fork freely, contribute back.',
  },
  {
    title: 'No vendor lock-in',
    description:
      'Deploy on any infrastructure. Your data stays under your control.',
  },
  {
    title: 'Self-hosted',
    description:
      'Install behind your firewall. ERP credentials never leave your network.',
  },
  {
    title: 'Full test coverage',
    description:
      '6,180 automated tests covering extraction, migration, security, and AI safety.',
  },
];

const securityFeatures = [
  {
    title: 'Input Validation',
    description:
      'JSON Schema-based validation with SAP-specific rules for every API request.',
  },
  {
    title: 'Audit Logging',
    description:
      'Immutable audit trail with SHA-256 hash chain for tamper detection.',
  },
  {
    title: 'Transport Safety',
    description:
      'All artifacts pass through Generate, Quality Check, Human Review, and Transport Import.',
  },
  {
    title: 'XSUAA Authentication',
    description:
      'JWT token validation with scope-based access control for production deployments.',
  },
];

const techStack = [
  {
    name: 'Node.js',
    description: 'Runtime for all core services, extraction engine, and migration framework.',
  },
  {
    name: 'SAP RFC (node-rfc)',
    description: 'Direct RFC calls with connection pooling, retry logic, and graceful degradation.',
  },
  {
    name: 'OData V2 and V4',
    description: 'Full OData client with CSRF handling, batch requests, and automatic pagination.',
  },
  {
    name: 'Infor ION API',
    description: 'OAuth2-based API gateway for CloudSuite, M3, and Lawson connectivity.',
  },
  {
    name: 'Infor MI Programs',
    description: 'M3-native API protocol for direct transaction and data access.',
  },
  {
    name: 'ADT REST',
    description: 'ABAP Development Tools REST APIs for source code access and transport operations.',
  },
  {
    name: 'SAP CAP',
    description: 'Cloud Application Programming model serving OData services and Fiori interfaces.',
  },
  {
    name: 'Express',
    description: 'REST API server handling migration, forensic, process mining, and export endpoints.',
  },
];

export default function PlatformPage() {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Section A: Hero                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="platform-heading" className="py-32 lg:py-40">
        <div className="container-site max-w-3xl text-center">
          <h1
            id="platform-heading"
            className="text-5xl lg:text-6xl font-semibold tracking-tighter m-0 mb-6"
            style={{
              lineHeight: 'var(--leading-heading)',
              color: 'var(--color-text-primary)',
            }}
          >
            Open source. Self-hosted.
            <br />
            Enterprise grade.
          </h1>
          <p
            className="text-xl m-0 mx-auto max-w-xl"
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-body)',
            }}
          >
            Apache 2.0 licensed. Deploy anywhere. Universal ERP connectivity.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section B: N+M Architecture                                         */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-labelledby="architecture-heading"
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <h2
            id="architecture-heading"
            className="mb-4 text-center text-3xl lg:text-4xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            N+M Architecture
          </h2>
          <p
            className="text-lg m-0 mb-16 text-center max-w-2xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            N source systems and M migration objects scale as N+M, not N x M.
            Add a source connector once; every migration object works automatically.
          </p>
          <SourceERPFlow />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section C: Canonical Data Model                                     */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-labelledby="canonical-heading"
        className="py-24 lg:py-28"
      >
        <div className="container-site">
          <h2
            id="canonical-heading"
            className="mb-4 text-center text-3xl lg:text-4xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            14 Canonical Entities
          </h2>
          <p
            className="text-lg m-0 mb-16 text-center max-w-2xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            OAGIS-aligned entities that serve as the universal translator between
            any source ERP and SAP S/4HANA.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {canonicalEntities.map((entity) => (
              <div
                key={entity.name}
                className="px-4 py-4 rounded-xl border"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p
                  className="text-sm font-semibold m-0 mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {entity.name}
                </p>
                <p
                  className="text-xs m-0"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {entity.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section D: Infor Protocols                                          */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-labelledby="infor-heading"
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <h2
            id="infor-heading"
            className="mb-4 text-center text-3xl lg:text-4xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Infor Connectivity
          </h2>
          <p
            className="text-lg m-0 mb-16 text-center max-w-xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Four protocols cover the full Infor product family.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { name: 'ION API Gateway', description: 'OAuth2 REST for CloudSuite Industrial and Lawson.' },
              { name: 'M3 MI Programs', description: 'Native M3 API protocol for transactions and data.' },
              { name: 'IDO REST', description: 'SyteLine/CSI object model via RESTful interface.' },
              { name: 'Landmark REST', description: 'Lawson-native API for HR, finance, and supply chain.' },
            ].map((protocol) => (
              <div
                key={protocol.name}
                className="text-center px-5 py-6 rounded-2xl border"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p
                  className="text-base font-semibold m-0 mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {protocol.name}
                </p>
                <p
                  className="text-sm m-0"
                  style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--leading-body)',
                  }}
                >
                  {protocol.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section E: Differentiators                                          */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-labelledby="differentiators-heading"
        className="py-24 lg:py-28"
      >
        <div className="container-site">
          <h2
            id="differentiators-heading"
            className="mb-12 text-center text-3xl lg:text-4xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Key differentiators
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {differentiators.map((d) => (
              <Card key={d.title}>
                <h3
                  className="mb-3 text-lg font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {d.title}
                </h3>
                <p
                  className="m-0 text-base leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {d.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section F: 4-Tier Security                                          */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-labelledby="security-heading"
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <h2
            id="security-heading"
            className="mb-4 text-center text-3xl lg:text-4xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            4-Tier Security Model
          </h2>
          <p
            className="text-lg m-0 mb-16 text-center max-w-xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Every operation is classified by risk level. Controls escalate
            from auto-approved reads to dual-approval production changes.
          </p>
          <div className="max-w-3xl mx-auto">
            <SecurityTiers />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section G: Defense in depth                                         */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-labelledby="defense-heading"
        className="py-24 lg:py-28"
      >
        <div className="container-site">
          <h2
            id="defense-heading"
            className="mb-4 text-center text-3xl lg:text-4xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Defense in depth
          </h2>
          <p
            className="text-lg m-0 mb-12 text-center max-w-xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Multi-layer security controls protect every operation before it
            reaches your ERP system.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {securityFeatures.map((feature) => (
              <div key={feature.title}>
                <h3
                  className="text-base font-semibold m-0 mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm m-0"
                  style={{
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--leading-body)',
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button href="/security" variant="secondary">
              See all security details
            </Button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section H: Tech stack                                               */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-labelledby="tech-heading"
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <h2
            id="tech-heading"
            className="mb-12 text-center text-3xl lg:text-4xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Technology stack
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {techStack.map((tech) => (
              <Card key={tech.name}>
                <h3
                  className="mb-2 text-base font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {tech.name}
                </h3>
                <p
                  className="m-0 text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {tech.description}
                </p>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <a
              href="/docs"
              className="inline-flex items-center gap-2 text-base font-medium underline underline-offset-4"
              style={{ color: 'var(--color-brand)' }}
            >
              Read the documentation
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
