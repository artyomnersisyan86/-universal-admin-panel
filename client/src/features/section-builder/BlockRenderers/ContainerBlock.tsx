import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import type { ContainerBlock } from '@shared/types';
import { Block, type BlockHandlers } from '../Block';
import { containerLayoutVars } from '../blockStyle';
import './ContainerBlock.css';

/** Droppable id for the empty slot inside a container, e.g. `sb-droppable:<uuid>`. */
export const CONTAINER_DROPPABLE_PREFIX = 'sb-droppable:';

interface Props extends BlockHandlers {
  block: ContainerBlock;
}

export function ContainerBlockView({ block, selectedId, onSelect, onRemove }: Props) {
  const { t } = useTranslation('admin');
  const layout = block.props.layout ?? {};
  const isRow = layout.direction === 'row';

  const dropId = `${CONTAINER_DROPPABLE_PREFIX}${block.id}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
    data: { source: 'container', containerId: block.id },
  });

  const childIds = block.children.map((c) => c.id);

  return (
    <div
      className={['sb-container', isRow && 'sb-container--row'].filter(Boolean).join(' ')}
      style={containerLayoutVars(layout)}
    >
      <SortableContext
        items={childIds}
        strategy={isRow ? horizontalListSortingStrategy : verticalListSortingStrategy}
      >
        {block.children.map((child) => (
          <Block
            key={child.id}
            block={child}
            selectedId={selectedId}
            onSelect={onSelect}
            onRemove={onRemove}
          />
        ))}
      </SortableContext>

      <div
        ref={setNodeRef}
        className={[
          'sb-container__slot',
          isOver && 'sb-container__slot--over',
          block.children.length === 0 && 'sb-container__slot--empty',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Typography variant="caption">
          {block.children.length === 0
            ? t('sectionBuilder.container.empty')
            : t('sectionBuilder.container.dropHere')}
        </Typography>
      </div>
    </div>
  );
}
