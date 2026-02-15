'use client';

import { useState } from 'react';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      className="relative flex items-center justify-center px-4 text-sm text-white"
      style={{
        height: '36px',
        background: '#1d1d1f',
      }}
    >
      <p className="m-0 text-center text-xs sm:text-sm">
        <span className="font-medium">4,591 tests passing</span>
        {' -- SEN is production-ready. '}
        <a
          href="https://github.com/ib823/sapconnect"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-white hover:text-white/90"
        >
          View on GitHub
        </a>
      </p>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-0 bg-transparent p-0"
        aria-label="Dismiss announcement"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M11 3L3 11M3 3L11 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
