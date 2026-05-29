import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import type { BlockNode, BlockStyle } from '@shared/types';
import { TypographyProps } from './propertyPanels/TypographyProps';
import { FieldProps } from './propertyPanels/FieldProps';
import { StyleProps } from './propertyPanels/StyleProps';
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
          <ContentSection block={block} onPatch={onPatch} />
          <StyleSection block={block} onPatch={onPatch} />
        </div>
      )}
    </aside>
  );
}

/** Merge a style patch into any block type's `props.style`. */
function withStyle(block: BlockNode, style: BlockStyle): BlockNode {
  return { ...block, props: { ...block.props, style } } as BlockNode;
}

function ContentSection({ block, onPatch }: PropertyPanelProps & { block: BlockNode }) {
  const { t } = useTranslation('admin');

  let body: React.ReactNode;
  switch (block.type) {
    case 'typography':
      body = (
        <TypographyProps
          block={block}
          onPatch={(patch) => onPatch(block.id, (b) => patch(b as typeof block))}
        />
      );
      break;
    case 'field':
      body = (
        <FieldProps
          block={block}
          onPatch={(patch) => onPatch(block.id, (b) => patch(b as typeof block))}
        />
      );
      break;
    case 'container':
    case 'slider':
      body = null;
      break;
  }

  if (!body) return null;

  return (
    <section className="property-panel__section">
      <Typography variant="caption" className="property-panel__section-title">
        {t('sectionBuilder.section.content')}
      </Typography>
      {body}
    </section>
  );
}

function StyleSection({ block, onPatch }: PropertyPanelProps & { block: BlockNode }) {
  const { t } = useTranslation('admin');
  return (
    <details className="property-panel__section" open>
      <summary className="property-panel__section-title">
        {t('sectionBuilder.section.style')}
      </summary>
      <StyleProps
        style={block.props.style}
        onChange={(style) => onPatch(block.id, (b) => withStyle(b, style))}
      />
    </details>
  );
}
