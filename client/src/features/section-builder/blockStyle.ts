import type { CSSProperties } from 'react';
import type { BlockStyle, FieldWidth, FlexLayout } from '@shared/types';

/**
 * Map a block's visual style to `--sb-*` custom properties consumed by
 * Block.css. Only defined values are emitted; CSS `var(..., fallback)` handles
 * the rest, so unstyled blocks render exactly as before. Stage 3.5 layers
 * per-breakpoint vars on top of these.
 */
export function bodyStyleVars(style?: BlockStyle): CSSProperties {
  const vars: Record<string, string> = {};
  if (style?.backgroundColor) vars['--sb-bg'] = style.backgroundColor;
  if (style?.textColor) vars['--sb-fg'] = style.textColor;
  if (style?.padding) vars['--sb-pad'] = style.padding;
  if (style?.borderRadius) vars['--sb-radius'] = style.borderRadius;
  if (style?.borderColor) vars['--sb-border-color'] = style.borderColor;
  if (style?.borderWidth) vars['--sb-border-width'] = style.borderWidth;
  return vars as CSSProperties;
}

const WIDTH_PCT: Record<Exclude<FieldWidth, 'auto'>, string> = {
  '100%': '100%',
  '50%': '50%',
  '33%': '33.3333%',
};

/**
 * Width of a block as a flex child. `auto` (or unset) leaves the default
 * content-based sizing. A fixed width also allows shrinking so several blocks
 * still fit one gapped row instead of overflowing.
 */
export function widthToCss(width?: FieldWidth): CSSProperties {
  if (!width || width === 'auto') return {};
  return { width: WIDTH_PCT[width], flexShrink: 1 };
}

/**
 * Container flex settings as `--sb-*` custom properties. Direction is handled
 * by a class (`sb-container--row`) since it also drives wrap behaviour; gap,
 * justify and align flow through vars with CSS fallbacks.
 */
export function containerLayoutVars(layout?: FlexLayout): CSSProperties {
  const vars: Record<string, string> = {};
  if (layout?.gap) vars['--sb-gap'] = layout.gap;
  if (layout?.justifyContent) vars['--sb-justify'] = layout.justifyContent;
  if (layout?.alignItems) vars['--sb-align'] = layout.alignItems;
  return vars as CSSProperties;
}
