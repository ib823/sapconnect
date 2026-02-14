import Logo from '@/components/brand/Logo';
import { FOOTER_LINKS } from '@/lib/site-config';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-[var(--color-border)] pt-16 pb-8"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <div className="container-site">
        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12">
          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <Logo showText />
            <p
              className="text-sm leading-relaxed m-0"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Open-source platform automating the SAP implementation lifecycle
              from assessment through cutover.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {title}
              </h3>
              <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
                {links.map((link: { label: string; href: string }) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm no-underline transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={
                        link.href.startsWith('http')
                          ? 'noopener noreferrer'
                          : undefined
                      }
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="border-t border-[var(--color-border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p
            className="text-xs m-0"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            &copy; {year} SAP Connect. Apache 2.0 Licensed.
          </p>
          <p
            className="text-xs m-0 text-center sm:text-right"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            SAP Connect is an independent project. Not affiliated with SAP SE.
          </p>
        </div>
      </div>
    </footer>
  );
}
