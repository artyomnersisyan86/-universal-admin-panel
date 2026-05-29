import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@shared/ui/Button';
import type { BlockNode } from '@shared/types';
import { TypographyBlockView } from './BlockRenderers/TypographyBlock';
import { FieldBlockView } from './BlockRenderers/FieldBlock';
import { ContainerBlockView } from './BlockRenderers/ContainerBlock';
import { SliderBlockView } from './BlockRenderers/SliderBlock';
import './Block.css';

interface BlockProps {
  block: BlockNode;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export function Block({ block, selected, onSelect, onRemove }: BlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { source: 'block', blockId: block.id },
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
        'sb-block',
        selected && 'sb-block--selected',
        isDragging && 'sb-block--dragging',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onSelect}
    >
      <div className="sb-block__head">
        <span
          className="sb-block__handle"
          {...attributes}
          {...listeners}
          aria-label="Drag"
          onClick={(e) => e.stopPropagation()}
        >
          ⋮⋮
        </span>
        <span className="sb-block__type">{block.type}</span>
        <Button
          size="small"
          variant="text"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="Remove block"
        >
          ×
        </Button>
      </div>
      <div className="sb-block__body">
        <BlockBody block={block} />
      </div>
    </div>
  );
}

function BlockBody({ block }: { block: BlockNode }) {
  switch (block.type) {
    case 'typography':
      return <TypographyBlockView block={block} />;
    case 'field':
      return <FieldBlockView block={block} />;
    case 'container':
      return <ContainerBlockView block={block} />;
    case 'slider':
      return <SliderBlockView />;
  }
}
