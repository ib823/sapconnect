import { type HTMLAttributes, type ElementType } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  className?: string;
}

export default function Card({
  as: Component = 'div',
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <Component
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[16px] px-6 py-6 md:px-8 md:py-8 transition-shadow duration-200 hover:shadow-lg ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
