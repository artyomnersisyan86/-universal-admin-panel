import type { BlockNode, FieldDef, LayoutTree, SliderBlock } from '@shared/types';
import { buildDefaultValues } from '@shared/ui/FormGroup';

/** Walk a layout tree and gather every field definition (the data inputs). */
export function collectFieldDefs(nodes: BlockNode[]): FieldDef[] {
  const out: FieldDef[] = [];
  for (const node of nodes) {
    if (node.type === 'field') out.push(node.props.field);
    else if (node.type === 'container') out.push(...collectFieldDefs(node.children));
  }
  return out;
}

/** Walk a layout tree and gather every slider block (per-entry content). */
export function collectSliderBlocks(nodes: BlockNode[]): SliderBlock[] {
  const out: SliderBlock[] = [];
  for (const node of nodes) {
    if (node.type === 'slider') out.push(node);
    else if (node.type === 'container') out.push(...collectSliderBlocks(node.children));
  }
  return out;
}

/**
 * Build react-hook-form default values for an entry:
 *   - field defaults keyed by `field.name`
 *   - slider defaults keyed by the slider block id (layout slides act as the
 *     starting template for a brand-new entry)
 *   - the saved entry `data` layered on top, so existing values win and missing
 *     fields stay empty (Decision #A: dropped fields keep their stored data).
 */
export function buildEntryDefaults(
  layout: LayoutTree,
  data?: Record<string, unknown>,
): Record<string, unknown> {
  const base = buildDefaultValues(collectFieldDefs(layout.root));
  for (const slider of collectSliderBlocks(layout.root)) {
    base[slider.id] = slider.props.slides ?? [];
  }
  return { ...base, ...(data ?? {}) };
}
