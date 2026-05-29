import type {
  BlockNode,
  BlockStyle,
  Breakpoint,
  BreakpointStyle,
  FieldWidth,
  FlexLayout,
} from '@shared/types';

/**
 * The slice of a block that the Layout/Style editors operate on for the
 * currently-selected breakpoint. For `desktop` it reads the base props; for
 * `tablet`/`mobile` it reads the matching responsive override.
 */
export interface EditScope {
  style: BlockStyle | undefined;
  layout: FlexLayout | undefined; // containers only
  width: FieldWidth | undefined; // not sliders
}

export function getScope(block: BlockNode, bp: Breakpoint): EditScope {
  if (bp === 'desktop') {
    return {
      style: block.props.style,
      layout: block.type === 'container' ? block.props.layout : undefined,
      width: 'width' in block.props ? block.props.width : undefined,
    };
  }
  const o = block.props.responsive?.[bp];
  return { style: o?.style, layout: o?.layout, width: o?.width };
}

function withResponsive(
  block: BlockNode,
  bp: Exclude<Breakpoint, 'desktop'>,
  patch: Partial<BreakpointStyle>,
): BlockNode {
  const responsive = {
    ...block.props.responsive,
    [bp]: { ...block.props.responsive?.[bp], ...patch },
  };
  return { ...block, props: { ...block.props, responsive } } as BlockNode;
}

export function setScopeStyle(block: BlockNode, bp: Breakpoint, style: BlockStyle): BlockNode {
  if (bp === 'desktop') return { ...block, props: { ...block.props, style } } as BlockNode;
  return withResponsive(block, bp, { style });
}

/** Layout only applies to containers; a no-op for other block types. */
export function setScopeLayout(block: BlockNode, bp: Breakpoint, layout: FlexLayout): BlockNode {
  if (block.type !== 'container') return block;
  if (bp === 'desktop') return { ...block, props: { ...block.props, layout } };
  return withResponsive(block, bp, { layout });
}

/** Sliders have no width; a no-op for them. */
export function setScopeWidth(block: BlockNode, bp: Breakpoint, width: FieldWidth): BlockNode {
  if (block.type === 'slider') return block;
  if (bp === 'desktop') return { ...block, props: { ...block.props, width } } as BlockNode;
  return withResponsive(block, bp, { width });
}
