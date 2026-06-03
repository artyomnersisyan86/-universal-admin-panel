import type { BlockType } from '@shared/types';

export interface PaletteItem {
  type: BlockType;
  i18nKey: string;
  /** Optional preset applied when the block is created from the palette. */
  preset?: { direction: 'row' };
}

export const PALETTE: PaletteItem[] = [
  { type: 'typography', i18nKey: 'sectionBuilder.block.typography' },
  { type: 'field', i18nKey: 'sectionBuilder.block.field' },
  { type: 'container', i18nKey: 'sectionBuilder.block.container' },
  {
    type: 'container',
    i18nKey: 'sectionBuilder.block.containerRow',
    preset: { direction: 'row' },
  },
  { type: 'slider', i18nKey: 'sectionBuilder.block.slider' },
];
