import Link from 'next/link';

export interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

function DeltaMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 4L29 28H3L16 4Z" stroke="var(--color-brand, #0A66FF)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function Logo({ size = 28, showText = false, className }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 no-underline ${className ?? ''}`} aria-label="SAP Connect home">
      <DeltaMark size={size} />
      {showText && (
        <span className="text-[16px] font-semibold tracking-tight text-[var(--color-text-primary)]">
          SAP Connect
        </span>
      )}
    </Link>
  );
}

export default Logo;
