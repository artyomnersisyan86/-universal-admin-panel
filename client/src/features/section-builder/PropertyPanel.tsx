import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import type { BlockNode } from '@shared/types';
import { TypographyProps } from './propertyPanels/TypographyProps';
import { FieldProps } from './propertyPanels/FieldProps';
import './PropertyPanel.css';

interface PropertyPanelProps {
  block: BlockNode | null;
  onPatch: (id: string, patch: (b: BlockNode) => BlockNode) => void;
}

export function PropertyPanel({ block, onPatch }: PropertyPanelProps) {
  const { t } = useTranslation('admin');

  return (
    <aside className="property-panel">
      <Typography variant="h5">{t('sectionBuilder.properties')}</Typography>
      {!block ? (
        <Typography variant="caption">{t('sectionBuilder.selectHint')}</Typography>
      ) : (
        <div className="property-panel__form">
          <PropertyFields block={block} onPatch={onPatch} />
        </div>
      )}
    </aside>
  );
}

function PropertyFields({ block, onPatch }: PropertyPanelProps & { block: BlockNode }) {
  switch (block.type) {
    case 'typography':
      return (
        <TypographyProps
          block={block}
          onPatch={(patch) => onPatch(block.id, (b) => patch(b as typeof block))}
        />
      );
    case 'field':
      return (
        <FieldProps
          block={block}
          onPatch={(patch) => onPatch(block.id, (b) => patch(b as typeof block))}
        />
      );
    case 'container':
    case 'slider':
      return (
        <Typography variant="caption">
          (Stage 3) — properties coming for {block.type}
        </Typography>
      );
  }
}
