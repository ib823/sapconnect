import Link from 'next/link';

export interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

function SenMark({ size, showText }: { size: number; showText?: boolean }) {
  const c = 'var(--color-brand, #1d1d1f)';
  const t = 'var(--color-text-primary, #1d1d1f)';
  const font = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif";

  if (showText) {
    // Wordmark: S⋈N — hourglass (⋈ rotated 90°) replaces E, kerned as one word
    return (
      <svg
        width={size * 1.72}
        height={size}
        viewBox="0 0 43 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* S */}
        <text
          x="0"
          y="20"
          fill={t}
          fontFamily={font}
          fontSize="21"
          fontWeight="600"
        >
          S
        </text>
        {/* ⋈ rotated 90° — hourglass as E, optically centered (pinch slightly above middle) */}
        <path d="M14 5L20 12L26 5Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
        <path d="M14 20L20 12L26 20Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
        {/* N */}
        <text
          x="28"
          y="20"
          fill={t}
          fontFamily={font}
          fontSize="21"
          fontWeight="600"
        >
          N
        </text>
      </svg>
    );
  }

  // Icon only: ⋈ mark (horizontal)
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 4L16 16L3 28Z" stroke={c} strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
      <path d="M29 4L16 16L29 28Z" stroke={c} strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function Logo({ size = 28, showText = false, className }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex no-underline ${className ?? ''}`} aria-label="SEN home">
      <SenMark size={size} showText={showText} />
    </Link>
  );
}

export default Logo;
