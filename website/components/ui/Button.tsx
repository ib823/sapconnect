import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary';

type BaseProps = {
  variant?: Variant;
  className?: string;
};

type AsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type AsAnchor = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type ButtonProps = AsButton | AsAnchor;

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] border border-transparent',
  secondary:
    'bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]',
};

const baseStyles =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-[var(--radius-button)] transition-colors duration-150 cursor-pointer no-underline focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] focus-visible:outline-offset-2';

export default function Button(props: ButtonProps) {
  const { variant = 'primary', className = '', ...rest } = props;
  const classes = `${baseStyles} ${variantStyles[variant]} ${className}`;

  if ('href' in rest && rest.href !== undefined) {
    const { href, target, rel, ...anchorRest } = rest as AsAnchor;
    return (
      <a href={href} target={target} rel={rel} className={classes} {...anchorRest}>
        {props.children}
      </a>
    );
  }

  const buttonRest = rest as AsButton;
  return (
    <button className={classes} {...buttonRest}>
      {props.children}
    </button>
  );
}
