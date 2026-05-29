import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import type { BlockNode } from '@shared/types';
import { Block } from './Block';
import './Canvas.css';

interface CanvasProps {
  blocks: BlockNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export const CANVAS_DROPPABLE_ID = 'sb-canvas';

export function Canvas({ blocks, selectedId, onSelect, onRemove }: CanvasProps) {
  const { t } = useTranslation('admin');
  const { setNodeRef, isOver } = useDroppable({
    id: CANVAS_DROPPABLE_ID,
    data: { source: 'canvas' },
  });

  return (
    <section className="sb-canvas">
      <Typography variant="h5">{t('sectionBuilder.canvas')}</Typography>
      <div
        ref={setNodeRef}
        className={[
          'sb-canvas__drop',
          isOver && 'sb-canvas__drop--over',
          blocks.length === 0 && 'sb-canvas__drop--empty',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {blocks.length === 0 ? (
          <Typography variant="caption">{t('sectionBuilder.emptyCanvas')}</Typography>
        ) : (
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {blocks.map((b) => (
              <Block
                key={b.id}
                block={b}
                selectedId={selectedId}
                onSelect={onSelect}
                onRemove={onRemove}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </section>
  );
}
