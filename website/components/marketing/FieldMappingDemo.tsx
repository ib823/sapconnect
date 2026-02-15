const mappings = [
  {
    source: 'Infor LN',
    sourceField: 'tcibd001.dsca',
    canonical: 'material.description',
    targetField: 'MAKT-MAKTX',
    transform: 'trim + uppercase',
  },
  {
    source: 'Infor LN',
    sourceField: 'tcibd001.item',
    canonical: 'material.id',
    targetField: 'MARA-MATNR',
    transform: 'padLeft(40)',
  },
  {
    source: 'Infor M3',
    sourceField: 'MITMAS.MMITNO',
    canonical: 'material.id',
    targetField: 'MARA-MATNR',
    transform: 'padLeft(40)',
  },
  {
    source: 'SAP ECC',
    sourceField: 'MARA-MATNR',
    canonical: 'material.id',
    targetField: 'MARA-MATNR',
    transform: 'direct',
  },
];

export default function FieldMappingDemo() {
  return (
    <div className="flex flex-col gap-4">
      {mappings.map((mapping, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 px-5 py-4 rounded-xl border"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {/* Source */}
          <div className="flex flex-col sm:min-w-[160px]">
            <span
              className="text-xs mb-0.5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {mapping.source}
            </span>
            <code
              className="text-sm font-mono font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {mapping.sourceField}
            </code>
          </div>

          {/* Arrow + canonical */}
          <div className="hidden sm:flex items-center gap-3 flex-1 justify-center">
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true">
              <path d="M0 6H14M14 6L10 2M14 6L10 10" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--color-brand-subtle)',
                color: 'var(--color-brand)',
              }}
            >
              {mapping.canonical}
            </span>
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true">
              <path d="M0 6H14M14 6L10 2M14 6L10 10" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Mobile: canonical badge */}
          <div className="sm:hidden flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>via</span>
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--color-brand-subtle)',
                color: 'var(--color-brand)',
              }}
            >
              {mapping.canonical}
            </span>
          </div>

          {/* Target */}
          <div className="flex flex-col sm:min-w-[140px] sm:text-right">
            <span
              className="text-xs mb-0.5"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              SAP S/4HANA
            </span>
            <code
              className="text-sm font-mono font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {mapping.targetField}
            </code>
          </div>
        </div>
      ))}
    </div>
  );
}
