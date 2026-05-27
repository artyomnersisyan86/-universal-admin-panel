import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import type { FieldDef } from '@shared/types';
import './Canvas.css';

interface CanvasProps {
  fields: FieldDef[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function Canvas({ fields, selectedId, onSelect, onRemove }: CanvasProps) {
  const { t } = useTranslation('admin');
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas', data: { source: 'canvas' } });

  return (
    <section className="canvas">
      <Typography variant="h5">{t('formBuilder.canvas')}</Typography>
      <div
        ref={setNodeRef}
        className={`canvas__drop${isOver ? ' canvas__drop--over' : ''}${
          fields.length === 0 ? ' canvas__drop--empty' : ''
        }`}
      >
        {fields.length === 0 ? (
          <Typography variant="caption">Drag fields from the palette →</Typography>
        ) : (
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map((f) => (
              <CanvasItem
                key={f.id}
                field={f}
                selected={f.id === selectedId}
                onSelect={() => onSelect(f.id)}
                onRemove={() => onRemove(f.id)}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </section>
  );
}

function CanvasItem({
  field,
  selected,
  onSelect,
  onRemove,
}: {
  field: FieldDef;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { source: 'canvas-item' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'canvas__item',
        selected && 'canvas__item--selected',
        isDragging && 'canvas__item--dragging',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onSelect}
    >
      <span className="canvas__handle" {...attributes} {...listeners} aria-label="Drag">
        ⋮⋮
      </span>
      <div className="canvas__item-info">
        <strong>{field.label}</strong>
        <span className="canvas__item-meta">
          {field.type}
          {field.required ? ' · required' : ''}
          {field.multilingual ? ' · multilingual' : ''}
        </span>
      </div>
      <Button
        size="small"
        variant="text"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        ×
      </Button>
    </div>
  );
}
