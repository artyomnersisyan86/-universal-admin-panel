import type { BlockType } from '@shared/types';

export interface PaletteItem {
  type: BlockType;
  i18nKey: string;
  stub?: boolean;
}

/**
 * Container and Slider are exposed in Stage 2 as stubs — they drag into the
 * canvas and render a placeholder until Stage 3 fills them in.
 */
export const PALETTE: PaletteItem[] = [
  { type: 'typography', i18nKey: 'sectionBuilder.block.typography' },
  { type: 'field', i18nKey: 'sectionBuilder.block.field' },
  { type: 'container', i18nKey: 'sectionBuilder.block.container', stub: true },
  { type: 'slider', i18nKey: 'sectionBuilder.block.slider', stub: true },
];
