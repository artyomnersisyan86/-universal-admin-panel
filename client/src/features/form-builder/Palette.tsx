import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { PALETTE, type PaletteItem } from './types';
import './Palette.css';

export function Palette() {
  const { t } = useTranslation('admin');
  return (
    <aside className="palette">
      <Typography variant="h5">{t('formBuilder.palette')}</Typography>
      <div className="palette__items">
        {PALETTE.map((p) => (
          <PaletteCard key={p.type} item={p} label={t(p.i18nKey)} />
        ))}
      </div>
    </aside>
  );
}

function PaletteCard({ item, label }: { item: PaletteItem; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${item.type}`,
    data: { source: 'palette', fieldType: item.type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`palette__card${isDragging ? ' palette__card--dragging' : ''}`}
    >
      {label}
    </div>
  );
}
