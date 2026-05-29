import type { BlockType } from '@shared/types';

export interface PaletteItem {
  type: BlockType;
  i18nKey: string;
}

export const PALETTE: PaletteItem[] = [
  { type: 'typography', i18nKey: 'sectionBuilder.block.typography' },
  { type: 'field', i18nKey: 'sectionBuilder.block.field' },
  { type: 'container', i18nKey: 'sectionBuilder.block.container' },
  { type: 'slider', i18nKey: 'sectionBuilder.block.slider' },
];
