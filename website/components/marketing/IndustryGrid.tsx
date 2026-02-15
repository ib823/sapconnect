const industries = [
  {
    name: 'Aerospace & Defense',
    compliance: ['ITAR', 'DFARS', 'AS9100'],
  },
  {
    name: 'Automotive',
    compliance: ['IATF 16949', 'VDA', 'IMDS'],
  },
  {
    name: 'Food & Beverage',
    compliance: ['FDA 21 CFR', 'FSMA', 'Lot tracing'],
  },
  {
    name: 'Fashion',
    compliance: ['PLM integration', 'Season mgmt', 'Size/color'],
  },
  {
    name: 'Healthcare',
    compliance: ['HIPAA', 'FDA UDI', 'GxP'],
  },
  {
    name: 'Public Sector',
    compliance: ['FedRAMP', 'FISMA', 'FAR/DFAR'],
  },
  {
    name: 'Chemicals',
    compliance: ['REACH', 'GHS/SDS', 'Batch tracking'],
  },
  {
    name: 'Distribution',
    compliance: ['EDI/ASN', 'WMS integration', '3PL'],
  },
  {
    name: 'Industrial Mfg',
    compliance: ['ISO 9001', 'MES integration', 'Engineer-to-order'],
  },
  {
    name: 'Equipment',
    compliance: ['Serialization', 'Service contracts', 'IoT readiness'],
  },
];

export default function IndustryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {industries.map((industry) => (
        <div
          key={industry.name}
          className="px-4 py-5 rounded-xl border transition-colors hover:border-[var(--color-text-primary)]"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <p
            className="text-sm font-semibold m-0 mb-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {industry.name}
          </p>
          <div className="flex flex-col gap-1">
            {industry.compliance.map((item) => (
              <span
                key={item}
                className="text-xs"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
