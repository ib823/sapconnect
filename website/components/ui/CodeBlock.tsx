interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language, title }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
      {title && (
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2">
          <span className="text-[var(--font-size-body-s)] font-medium text-[var(--color-text-secondary)]">
            {title}
          </span>
        </div>
      )}
      <pre className="m-0 overflow-x-auto bg-[#0D1117] p-4 text-[var(--font-size-body-s)] leading-relaxed text-[#E6EDF3]">
        <code data-language={language} style={{ fontFamily: 'var(--font-mono)' }}>
          {code}
        </code>
      </pre>
    </div>
  );
}

export default CodeBlock;
