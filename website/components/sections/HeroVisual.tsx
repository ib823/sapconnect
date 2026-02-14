'use client';

import { useState } from 'react';

const mockOutput = `{
  "system": "S4H",
  "mode": "mock",
  "extraction": {
    "customCode": {
      "programs": 1284,
      "rulesApplied": 874,
      "findings": 312,
      "autoFixable": 208
    },
    "dataProfile": {
      "objects": 42,
      "records": "2.4M",
      "duplicateRate": "3.1%",
      "completeness": "94.7%"
    },
    "processFlows": {
      "variants": 186,
      "avgCycleTime": "4.2 days",
      "automationRate": "72%"
    }
  },
  "status": "complete",
  "tests": "4,591 passing"
}`;

const liveMessage = `// Connect your SAP system to see real data
//
// Supported connection types:
//   - RFC direct (ashost + sysnr)
//   - RFC load-balanced (mshost + group)
//   - OData V2/V4 (service URL)
//   - ADT REST (/sap/bc/adt)
//
// Run: npx sapconnect init --system <SID>`;

export default function HeroVisual() {
  const [activeTab, setActiveTab] = useState<'mock' | 'live'>('mock');

  return (
    <div
      className="rounded-xl overflow-hidden border border-[var(--color-border)] w-full max-w-xl"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center gap-0 border-b border-[var(--color-border)] px-1"
        role="tablist"
        aria-label="Output mode"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'mock'}
          className={`px-4 py-2.5 text-xs font-medium border-0 bg-transparent cursor-pointer transition-colors ${
            activeTab === 'mock'
              ? 'text-[var(--color-brand)] border-b-2 border-[var(--color-brand)]'
              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
          }`}
          style={
            activeTab === 'mock'
              ? { borderBottom: '2px solid var(--color-brand)' }
              : {}
          }
          onClick={() => setActiveTab('mock')}
        >
          Mock
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'live'}
          className={`px-4 py-2.5 text-xs font-medium border-0 bg-transparent cursor-pointer transition-colors ${
            activeTab === 'live'
              ? 'text-[var(--color-brand)] border-b-2 border-[var(--color-brand)]'
              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
          }`}
          style={
            activeTab === 'live'
              ? { borderBottom: '2px solid var(--color-brand)' }
              : {}
          }
          onClick={() => setActiveTab('live')}
        >
          Live
        </button>
      </div>

      {/* Code content */}
      <pre
        className="m-0 p-5 text-xs leading-relaxed overflow-x-auto"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-secondary)',
          maxHeight: '360px',
        }}
      >
        <code>{activeTab === 'mock' ? mockOutput : liveMessage}</code>
      </pre>
    </div>
  );
}
