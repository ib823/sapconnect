import type { Metadata } from 'next';
import { getCapabilities } from '@/lib/capabilities';
import CapabilityFilter from '@/components/sections/CapabilityFilter';

export const metadata: Metadata = {
  title: 'Capabilities | SAP Connect',
  description:
    'Explore all 11 SAP Connect capabilities: custom code analysis, data profiling, process mining, migration objects, BDC engine, MCP server, and more.',
};

export default function CapabilitiesPage() {
  const capabilities = getCapabilities();

  return (
    <section aria-labelledby="capabilities-heading" className="py-20">
      <div className="container-site">
        <div className="mx-auto mb-12 max-w-[700px] text-center">
          <h1
            id="capabilities-heading"
            className="mb-4 text-[var(--font-size-h1)] font-bold leading-[var(--leading-heading)] text-[var(--color-text-primary)]"
          >
            Capabilities
          </h1>
          <p className="text-[var(--font-size-body-l)] leading-relaxed text-[var(--color-text-secondary)]">
            11 integrated capabilities covering the full SAP implementation
            lifecycle. Each one is production-tested, fully documented, and works
            in both mock and live modes.
          </p>
        </div>
        <CapabilityFilter capabilities={capabilities} />
      </div>
    </section>
  );
}
