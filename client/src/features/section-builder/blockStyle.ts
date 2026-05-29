import type { CSSProperties } from 'react';
import type { BlockNode, Breakpoint, BlockStyle, FieldWidth, FlexLayout } from '@shared/types';

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

/**
 * Resolve block style cascade (desktop -> tablet -> mobile).
 */
export function getResolvedStyle(block: BlockNode, bp: Breakpoint): BlockStyle {
  const base = block.props.style ?? {};
  if (bp === 'desktop') return base;

  const tablet = block.props.responsive?.tablet?.style ?? {};
  if (bp === 'tablet') {
    return { ...base, ...tablet };
  }

  const mobile = block.props.responsive?.mobile?.style ?? {};
  return { ...base, ...tablet, ...mobile };
}

/**
 * Resolve container layout cascade (desktop -> tablet -> mobile).
 */
export function getResolvedLayout(block: BlockNode, bp: Breakpoint): FlexLayout | undefined {
  if (block.type !== 'container') return undefined;
  const base = block.props.layout ?? {};
  if (bp === 'desktop') return base;

  const tablet = block.props.responsive?.tablet?.layout ?? {};
  if (bp === 'tablet') {
    return { ...base, ...tablet };
  }

  const mobile = block.props.responsive?.mobile?.layout ?? {};
  return { ...base, ...tablet, ...mobile };
}

/**
 * Resolve block width cascade (desktop -> tablet -> mobile).
 */
export function getResolvedWidth(block: BlockNode, bp: Breakpoint): FieldWidth | undefined {
  if (block.type === 'slider') return undefined;
  const base = ('width' in block.props ? block.props.width : undefined) || 'auto';
  if (bp === 'desktop') return base;

  const tablet = block.props.responsive?.tablet?.width;
  if (bp === 'tablet') {
    return tablet ?? base;
  }

  const mobile = block.props.responsive?.mobile?.width;
  return mobile ?? tablet ?? base;
}

