import { forwardRef, type ElementType, type ReactNode } from 'react';
import './Typography.css';

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body'
  | 'caption';

export interface TypographyProps {
  variant?: TypographyVariant;
  /** Override the rendered HTML element. Defaults to a sensible tag per variant. */
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

const TAG_FOR_VARIANT: Record<TypographyVariant, ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body: 'p',
  caption: 'span',
};

/**
 * Typography — variant-based text component using clamp() for fluid scaling.
 * Theme-aware via CSS custom properties. Copy-portable (no external deps).
 */
export const Typography = forwardRef<HTMLElement, TypographyProps>(function Typography(
  { variant = 'body', as, className = '', children, ...rest },
  ref,
) {
  const Tag = (as ?? TAG_FOR_VARIANT[variant]) as ElementType;
  const cls = `t-${variant}${className ? ` ${className}` : ''}`;
  return (
    <Tag ref={ref as never} className={cls} {...rest}>
      {children}
    </Tag>
  );
});
