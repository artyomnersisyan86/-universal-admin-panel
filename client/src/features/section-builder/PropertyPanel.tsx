import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { FieldShell } from '@shared/ui/_FieldShell';
import type { BlockNode, BlockStyle, FieldWidth, FlexLayout } from '@shared/types';
import { TypographyProps } from './propertyPanels/TypographyProps';
import { FieldProps } from './propertyPanels/FieldProps';
import { StyleProps } from './propertyPanels/StyleProps';
import { LayoutProps, WidthSelect } from './propertyPanels/LayoutProps';
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
          <LayoutSection block={block} onPatch={onPatch} />
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

/** Set the flex layout of a container block (no-op for other types). */
function withLayout(block: BlockNode, layout: FlexLayout): BlockNode {
  if (block.type !== 'container') return block;
  return { ...block, props: { ...block.props, layout } };
}

/** Set the width of a block. Sliders have no width control. */
function withWidth(block: BlockNode, width: FieldWidth): BlockNode {
  if (block.type === 'slider') return block;
  return { ...block, props: { ...block.props, width } } as BlockNode;
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

function LayoutSection({ block, onPatch }: PropertyPanelProps & { block: BlockNode }) {
  const { t } = useTranslation('admin');
  // Sliders are always full-width; no layout controls apply.
  if (block.type === 'slider') return null;

  return (
    <details className="property-panel__section" open>
      <summary className="property-panel__section-title">
        {t('sectionBuilder.section.layout')}
      </summary>
      {block.type === 'container' && (
        <LayoutProps
          layout={block.props.layout}
          onChange={(layout) => onPatch(block.id, (b) => withLayout(b, layout))}
        />
      )}
      <FieldShell label={t('sectionBuilder.layout.width')}>
        <WidthSelect
          value={block.props.width}
          onChange={(width) => onPatch(block.id, (b) => withWidth(b, width))}
        />
      </FieldShell>
    </details>
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
