// Copyright 2024-2026 SEN Contributors
// SPDX-License-Identifier: Apache-2.0

import type { Metadata } from 'next';
import Button from '@/components/ui/Button';
import { SITE } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Quick Start | SEN',
  description:
    'Get SEN running in 60 seconds. No SAP system required. One-click Codespace, local install, or Docker.',
};

/* ────────────────────────────────────────────────────────────────────────── */
/* SVG Icons — single-stroke, geometric, Apple SF Symbols inspired           */
/* ────────────────────────────────────────────────────────────────────────── */

function IconCloud({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 24a6 6 0 0 1-.84-11.94A8 8 0 0 1 23 14h1a5 5 0 0 1 1 9.9" />
      <path d="M16 16v10M12 22l4 4 4-4" />
    </svg>
  );
}

function IconTerminal({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="24" height="20" rx="3" />
      <path d="M10 14l4 3-4 3M18 20h4" />
    </svg>
  );
}

function IconContainer({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4L4 10v12l12 6 12-6V10L16 4z" />
      <path d="M4 10l12 6M16 16v12M28 10l-12 6" />
    </svg>
  );
}

function IconSearch({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M18 18l6 6" />
    </svg>
  );
}

function IconLayers({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 14l12 7 12-7" />
      <path d="M2 10l12 7 12-7" />
      <path d="M2 6l12 7 12-7L14 2 2 6z" />
    </svg>
  );
}

function IconRoute({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="21" r="3" />
      <circle cx="21" cy="7" r="3" />
      <path d="M10 19C12 17 16 11 18 9" />
    </svg>
  );
}

function IconShield({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3L4 7v6c0 7 4.5 11 10 13 5.5-2 10-6 10-13V7L14 3z" />
      <path d="M10 14l3 3 5-6" />
    </svg>
  );
}

function IconPlug({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 4v6M10 4v6M6 10h16v3a8 8 0 0 1-16 0V10zM14 21v4" />
    </svg>
  );
}

function IconRocket({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 24S6 18 6 11a8 8 0 0 1 16 0c0 7-8 13-8 13z" />
      <circle cx="14" cy="11" r="2.5" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Page                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export default function QuickStartPage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="py-32 lg:py-40" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="container-site max-w-3xl text-center">
          <p
            className="text-sm font-medium uppercase tracking-widest m-0 mb-5"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Quick Start
          </p>
          <h1
            className="text-5xl lg:text-6xl font-semibold tracking-tighter m-0 mb-6"
            style={{
              lineHeight: 'var(--leading-heading)',
              color: 'var(--color-text-primary)',
            }}
          >
            From zero to migration
            <br />
            in sixty seconds.
          </h1>
          <p
            className="text-xl m-0 mb-4 mx-auto max-w-lg"
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-body)',
            }}
          >
            No SAP system required. Everything runs in mock mode with
            built-in test data — so you can explore every capability
            before connecting live.
          </p>
        </div>
      </section>

      {/* ── Choose your path ────────────────────────────────────────────── */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-semibold m-0 mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Choose how to start.
            </h2>
            <p
              className="text-lg m-0 max-w-md mx-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Three ways to get SEN running. Pick the one that fits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Codespace */}
            <div
              className="relative rounded-[16px] border-2 px-6 py-8 md:px-8 md:py-10 text-center transition-shadow duration-200 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                borderColor: 'var(--color-brand)',
              }}
            >
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                Recommended
              </span>
              <div className="flex justify-center mb-5" style={{ color: 'var(--color-text-primary)' }}>
                <IconCloud />
              </div>
              <h3 className="text-lg font-semibold m-0 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                GitHub Codespace
              </h3>
              <p className="text-sm m-0 mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                One click. Zero setup. Pre-configured
                environment with all dependencies.
              </p>
              <div
                className="rounded-[var(--radius-button)] px-4 py-3 font-mono text-sm"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Code → Codespaces → New
              </div>
            </div>

            {/* Local */}
            <div
              className="rounded-[16px] border px-6 py-8 md:px-8 md:py-10 text-center transition-shadow duration-200 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex justify-center mb-5" style={{ color: 'var(--color-text-primary)' }}>
                <IconTerminal />
              </div>
              <h3 className="text-lg font-semibold m-0 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Local Install
              </h3>
              <p className="text-sm m-0 mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Clone, install, run. Requires Node.js 20+
                and npm.
              </p>
              <div
                className="rounded-[var(--radius-button)] px-4 py-3 font-mono text-xs leading-relaxed text-left"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                }}
              >
                git clone &amp;&amp; npm install
                <br />
                npm run watch
              </div>
            </div>

            {/* Docker */}
            <div
              className="rounded-[16px] border px-6 py-8 md:px-8 md:py-10 text-center transition-shadow duration-200 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--color-surface-raised)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex justify-center mb-5" style={{ color: 'var(--color-text-primary)' }}>
                <IconContainer />
              </div>
              <h3 className="text-lg font-semibold m-0 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Docker
              </h3>
              <p className="text-sm m-0 mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Containerized. Isolated. Runs anywhere
                Docker is installed.
              </p>
              <div
                className="rounded-[var(--radius-button)] px-4 py-3 font-mono text-xs leading-relaxed text-left"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                }}
              >
                docker compose up
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Commands ─────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-28" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="container-site max-w-3xl">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-semibold m-0 mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Five commands. Full platform.
            </h2>
            <p
              className="text-lg m-0 max-w-md mx-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Everything works in mock mode out of the box.
              No configuration needed.
            </p>
          </div>

          {/* Terminal block */}
          <div
            className="rounded-[16px] overflow-hidden"
            style={{ border: '1px solid var(--color-border)' }}
          >
            {/* Title bar */}
            <div
              className="flex items-center gap-2 px-5 py-3"
              style={{
                backgroundColor: '#1d1d1f',
                borderBottom: '1px solid #333',
              }}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#febc2e' }} />
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28c840' }} />
              <span className="ml-3 text-xs font-mono" style={{ color: '#86868b' }}>
                terminal
              </span>
            </div>

            {/* Commands */}
            <div
              className="px-6 py-6 md:px-8 md:py-8 font-mono text-sm leading-[2.2]"
              style={{ backgroundColor: '#1d1d1f', color: '#F5F5F7' }}
            >
              <div className="flex flex-col gap-5">
                <TerminalLine
                  comment="Start the platform"
                  command="npm run watch"
                  hint="CAP server on :4004 with live reload"
                />
                <TerminalLine
                  comment="Run migration assessment"
                  command="npm run assess"
                  hint="874 rules across 21 SAP modules"
                />
                <TerminalLine
                  comment="Forensic extraction"
                  command="npm run forensic-extract"
                  hint="35+ extractors discover your system"
                />
                <TerminalLine
                  comment="Execute full migration"
                  command="npm test"
                  hint="6,300+ tests validate everything"
                />
                <TerminalLine
                  comment="Start MCP server for AI"
                  command="npm run mcp"
                  hint="58 SAP tools for Claude, GPT, etc."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Journey ──────────────────────────────────────────────────── */}
      <section
        className="py-24 lg:py-28"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site">
          <div className="text-center mb-20">
            <h2
              className="text-3xl lg:text-4xl font-semibold m-0 mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              What happens next.
            </h2>
            <p
              className="text-lg m-0 max-w-lg mx-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Start in mock mode. Explore every capability. Connect live
              when you&apos;re ready.
            </p>
          </div>

          {/* Journey steps — vertical on mobile, clean grid on desktop */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <JourneyStep
                number={1}
                icon={<IconSearch />}
                title="Explore"
                description="Run assessments, browse 874 rules, profile data quality, and inspect process mining — all with built-in mock data."
                detail="npm run assess"
              />
              <JourneyStep
                number={2}
                icon={<IconLayers />}
                title="Extract"
                description="Forensic extraction discovers everything: custom code, interfaces, batch jobs, data volumes, enhancement points."
                detail="npm run forensic-extract"
              />
              <JourneyStep
                number={3}
                icon={<IconRoute />}
                title="Migrate"
                description="42 migration objects with 1,600+ field mappings. Extract, transform, load, validate — in dependency order."
                detail="42 objects × ETLV lifecycle"
              />
              <JourneyStep
                number={4}
                icon={<IconShield />}
                title="Validate"
                description="Six-check reconciliation per object. Count verification, key coverage, aggregate matching, duplicate detection."
                detail="6 checks per object"
              />
              <JourneyStep
                number={5}
                icon={<IconPlug />}
                title="Connect"
                description="When ready, point SEN at a real SAP system via OData, RFC, or ADT. Same code, live data. Safety gates protect every write."
                detail="OData · RFC · ADT REST"
              />
              <JourneyStep
                number={6}
                icon={<IconRocket />}
                title="Go live"
                description="Critical-path cutover planning with dependency tracking, go/no-go checklist, and full rollback procedures."
                detail="npm run cutover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Requirements ─────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-28" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="container-site max-w-3xl">
          <div className="text-center mb-14">
            <h2
              className="text-3xl lg:text-4xl font-semibold m-0 mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              What you need.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <RequirementCard
              title="Mock mode"
              subtitle="No SAP system required"
              items={['Node.js 20+', 'npm', 'That\u2019s it']}
            />
            <RequirementCard
              title="Live mode"
              subtitle="Connecting to SAP"
              items={[
                'Valid SAP Named User license',
                'SAP system credentials',
                'Network access to SAP',
                'node-rfc (optional, for RFC)',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── Dark CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-28" style={{ backgroundColor: '#1d1d1f' }}>
        <div className="container-site max-w-2xl text-center">
          <h2 className="text-3xl lg:text-4xl font-semibold text-white m-0 mb-5">
            Ready to start?
          </h2>
          <p className="text-lg text-white/70 m-0 mb-10 max-w-md mx-auto">
            Open a Codespace and run your first assessment in under a minute.
            No credit card. No signup. Just code.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              href={SITE.repo}
              className="bg-white text-[#1d1d1f] hover:bg-white/90 border-transparent"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in GitHub
            </Button>
            <Button
              href="/docs"
              variant="secondary"
              className="border-white/30 text-white hover:border-white hover:text-white"
            >
              Read the docs
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Sub-components                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function TerminalLine({
  comment,
  command,
  hint,
}: {
  comment: string;
  command: string;
  hint: string;
}) {
  return (
    <div>
      <div style={{ color: '#6e6e73' }}>
        <span style={{ color: '#86868b' }}># </span>
        {comment}
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span style={{ color: '#28c840' }}>$</span>{' '}
        <span className="font-semibold">{command}</span>
        <span className="text-xs" style={{ color: '#6e6e73' }}>
          — {hint}
        </span>
      </div>
    </div>
  );
}

function JourneyStep({
  number,
  icon,
  title,
  description,
  detail,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  detail: string;
}) {
  return (
    <div
      className="flex gap-5 rounded-[16px] border px-6 py-6 md:px-7 md:py-7 transition-shadow duration-200 hover:shadow-lg"
      style={{
        backgroundColor: 'var(--color-surface-raised)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="shrink-0 flex flex-col items-center gap-2">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'var(--color-brand-subtle)',
            color: 'var(--color-brand)',
          }}
        >
          {icon}
        </div>
        <span
          className="text-xs font-bold tabular-nums"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {String(number).padStart(2, '0')}
        </span>
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-semibold m-0 mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h3>
        <p className="text-sm m-0 mb-3" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
          {description}
        </p>
        <span
          className="inline-block text-xs font-medium font-mono px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: 'var(--color-brand-subtle)',
            color: 'var(--color-brand)',
          }}
        >
          {detail}
        </span>
      </div>
    </div>
  );
}

function RequirementCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: string[];
}) {
  return (
    <div
      className="rounded-[16px] border px-6 py-6 md:px-8 md:py-8 transition-shadow duration-200 hover:shadow-lg"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h3 className="text-lg font-semibold m-0 mb-1" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h3>
      <p className="text-sm m-0 mb-5" style={{ color: 'var(--color-text-tertiary)' }}>
        {subtitle}
      </p>
      <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M4 8.5l3 3 5-6"
                stroke="var(--color-success)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
