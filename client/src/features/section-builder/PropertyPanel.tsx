import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { FieldShell } from '@shared/ui/_FieldShell';
import type { BlockNode } from '@shared/types';
import { TypographyProps } from './propertyPanels/TypographyProps';
import { FieldProps } from './propertyPanels/FieldProps';
import { StyleProps } from './propertyPanels/StyleProps';
import { LayoutProps, WidthSelect } from './propertyPanels/LayoutProps';
import { SliderProps } from './propertyPanels/SliderProps';
import { useBreakpoint } from './useBreakpoint';
import { getScope, setScopeStyle, setScopeLayout, setScopeWidth } from './responsiveScope';
import './PropertyPanel.css';

interface PropertyPanelProps {
  block: BlockNode | null;
  onPatch: (id: string, patch: (b: BlockNode) => BlockNode) => void;
}

export function PropertyPanel({ block, onPatch }: PropertyPanelProps) {
  const { t } = useTranslation('admin');
  const { breakpoint } = useBreakpoint();

  return (
    <aside className="property-panel">
      <div className="property-panel__header">
        <Typography variant="h5">{t('sectionBuilder.properties')}</Typography>
        {block && (
          <span className={`property-panel__badge property-panel__badge--${breakpoint}`}>
            {t(`sectionBuilder.preview.${breakpoint}`)}
          </span>
        )}
      </div>
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
    case 'slider':
      body = (
        <SliderProps
          block={block}
          onPatch={(patch) => onPatch(block.id, (b) => patch(b as typeof block))}
        />
      );
      break;
    case 'container':
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
  const { breakpoint } = useBreakpoint();

  // Sliders are always full-width; no layout controls apply.
  if (block.type === 'slider') return null;

  const scope = getScope(block, breakpoint);

  return (
    <details className="property-panel__section" open>
      <summary className="property-panel__section-title">
        {t('sectionBuilder.section.layout')}
      </summary>
      {block.type === 'container' && (
        <LayoutProps
          layout={scope.layout}
          onChange={(layout) => onPatch(block.id, (b) => setScopeLayout(b, breakpoint, layout))}
        />
      )}
      <FieldShell label={t('sectionBuilder.layout.width')}>
        <WidthSelect
          value={scope.width}
          onChange={(width) => onPatch(block.id, (b) => setScopeWidth(b, breakpoint, width))}
        />
      </FieldShell>
    </details>
  );
}

function StyleSection({ block, onPatch }: PropertyPanelProps & { block: BlockNode }) {
  const { t } = useTranslation('admin');
  const { breakpoint } = useBreakpoint();
  const scope = getScope(block, breakpoint);

  return (
    <details className="property-panel__section" open>
      <summary className="property-panel__section-title">
        {t('sectionBuilder.section.style')}
      </summary>
      <StyleProps
        style={scope.style}
        onChange={(style) => onPatch(block.id, (b) => setScopeStyle(b, breakpoint, style))}
      />
    </details>
  );
}
