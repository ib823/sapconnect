export default function SourceERPFlow() {
  const sources = [
    'SAP ECC',
    'Infor LN',
    'Infor M3',
    'CloudSuite',
    'Lawson',
    'Your ERP',
  ];

  const entities = [
    'Material',
    'Customer',
    'Vendor',
    'BOM',
    'Routing',
    'GL Account',
    'Cost Center',
    'Profit Center',
    'Sales Order',
    'Purchase Order',
    'Work Order',
    'Inventory',
    'Price List',
    'Employee',
  ];

  return (
    <div className="w-full">
      {/* Desktop: horizontal flow */}
      <div className="hidden lg:flex items-center gap-8">
        {/* Source ERPs */}
        <div className="flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4 text-center"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Source systems
          </p>
          <div className="flex flex-col gap-2">
            {sources.map((name) => (
              <div
                key={name}
                className="px-4 py-2.5 text-sm font-medium text-center rounded-lg border"
                style={{
                  borderColor: 'var(--color-border)',
                  color: name === 'Your ERP' ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                  fontStyle: name === 'Your ERP' ? 'italic' : 'normal',
                }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <svg width="48" height="24" viewBox="0 0 48 24" fill="none" aria-hidden="true">
            <path d="M0 12H40M40 12L32 4M40 12L32 20" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>extract</span>
        </div>

        {/* Canonical Model */}
        <div className="flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4 text-center"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Canonical model
          </p>
          <div
            className="rounded-2xl border-2 p-4"
            style={{ borderColor: 'var(--color-brand)' }}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {entities.map((entity) => (
                <div
                  key={entity}
                  className="px-2 py-1.5 text-xs font-medium text-center rounded"
                  style={{
                    backgroundColor: 'var(--color-brand-subtle)',
                    color: 'var(--color-brand)',
                  }}
                >
                  {entity}
                </div>
              ))}
            </div>
            <p
              className="text-xs text-center mt-3 mb-0 font-medium"
              style={{ color: 'var(--color-brand)' }}
            >
              14 OAGIS-aligned entities
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <svg width="48" height="24" viewBox="0 0 48 24" fill="none" aria-hidden="true">
            <path d="M0 12H40M40 12L32 4M40 12L32 20" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>transform</span>
        </div>

        {/* Target */}
        <div className="flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4 text-center"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Target
          </p>
          <div
            className="px-6 py-8 text-center rounded-2xl border-2"
            style={{ borderColor: 'var(--color-text-primary)', color: 'var(--color-text-primary)' }}
          >
            <p className="text-lg font-semibold m-0">SAP S/4HANA</p>
            <p className="text-xs mt-2 mb-0" style={{ color: 'var(--color-text-tertiary)' }}>
              On-premise or Cloud
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: vertical flow */}
      <div className="lg:hidden flex flex-col items-center gap-6">
        {/* Source ERPs */}
        <div className="w-full">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3 text-center"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Source systems
          </p>
          <div className="grid grid-cols-2 gap-2">
            {sources.map((name) => (
              <div
                key={name}
                className="px-3 py-2 text-sm font-medium text-center rounded-lg border"
                style={{
                  borderColor: 'var(--color-border)',
                  color: name === 'Your ERP' ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                  fontStyle: name === 'Your ERP' ? 'italic' : 'normal',
                }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* Down arrow */}
        <svg width="24" height="32" viewBox="0 0 24 32" fill="none" aria-hidden="true">
          <path d="M12 0V24M12 24L4 16M12 24L20 16" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Canonical Model */}
        <div className="w-full">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3 text-center"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Canonical model
          </p>
          <div
            className="rounded-2xl border-2 p-4"
            style={{ borderColor: 'var(--color-brand)' }}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {entities.map((entity) => (
                <div
                  key={entity}
                  className="px-2 py-1.5 text-xs font-medium text-center rounded"
                  style={{
                    backgroundColor: 'var(--color-brand-subtle)',
                    color: 'var(--color-brand)',
                  }}
                >
                  {entity}
                </div>
              ))}
            </div>
            <p
              className="text-xs text-center mt-3 mb-0 font-medium"
              style={{ color: 'var(--color-brand)' }}
            >
              14 OAGIS-aligned entities
            </p>
          </div>
        </div>

        {/* Down arrow */}
        <svg width="24" height="32" viewBox="0 0 24 32" fill="none" aria-hidden="true">
          <path d="M12 0V24M12 24L4 16M12 24L20 16" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Target */}
        <div
          className="w-full px-6 py-6 text-center rounded-2xl border-2"
          style={{ borderColor: 'var(--color-text-primary)', color: 'var(--color-text-primary)' }}
        >
          <p className="text-lg font-semibold m-0">SAP S/4HANA</p>
          <p className="text-xs mt-2 mb-0" style={{ color: 'var(--color-text-tertiary)' }}>
            On-premise or Cloud
          </p>
        </div>
      </div>
    </div>
  );
}
