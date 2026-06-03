import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { PALETTE, type PaletteItem } from './types';
import './Palette.css';

export function Palette() {
  const { t } = useTranslation('admin');
  return (
    <aside className="sb-palette">
      <Typography variant="h5">{t('sectionBuilder.palette')}</Typography>
      <div className="sb-palette__items">
        {PALETTE.map((p) => (
          <PaletteCard key={p.type} item={p} label={t(p.i18nKey)} />
        ))}
      </div>
      <Typography variant="caption" className="sb-palette__hint">
        {t('sectionBuilder.paletteHint')}
      </Typography>
    </aside>
  );
}

function PaletteCard({ item, label }: { item: PaletteItem; label: string }) {
  const cardId = item.preset ? `palette:${item.type}:${item.preset.direction}` : `palette:${item.type}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: cardId,
    data: { source: 'palette', blockType: item.type, preset: item.preset },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={['sb-palette__card', isDragging && 'sb-palette__card--dragging']
        .filter(Boolean)
        .join(' ')}
    >
      <span>{label}</span>
    </div>
  );
}
