import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@shared/ui/Button';
import type { BlockNode } from '@shared/types';
import { TypographyBlockView } from './BlockRenderers/TypographyBlock';
import { FieldBlockView } from './BlockRenderers/FieldBlock';
import { ContainerBlockView } from './BlockRenderers/ContainerBlock';
import { SliderBlockView } from './BlockRenderers/SliderBlock';
import { bodyStyleVars, widthToCss, getResolvedStyle, getResolvedWidth, getResolvedLayout } from './blockStyle';
import { useBreakpoint } from './useBreakpoint';
import './Block.css';

export interface BlockHandlers {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

interface BlockProps extends BlockHandlers {
  block: BlockNode;
}

export function Block({ block, selectedId, onSelect, onRemove }: BlockProps) {
  const selected = block.id === selectedId;
  const { breakpoint } = useBreakpoint();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { source: 'block', blockId: block.id },
  });

  const resolvedStyle = getResolvedStyle(block, breakpoint);
  const width = getResolvedWidth(block, breakpoint);
  const isRowContainer =
    block.type === 'container' && getResolvedLayout(block, breakpoint)?.direction === 'row';
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(resolvedStyle?.margin ? { margin: resolvedStyle.margin } : {}),
    ...widthToCss(width),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'sb-block',
        `sb-block--${block.type}`,
        selected && 'sb-block--selected',
        isDragging && 'sb-block--dragging',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
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
        <span className="sb-block__type">
          {block.type}
          {isRowContainer && <span className="sb-block__direction-badge">row</span>}
        </span>
        <Button
          size="small"
          variant="text"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(block.id);
          }}
          aria-label="Remove block"
        >
          ×
        </Button>
      </div>
      <div className="sb-block__body" style={bodyStyleVars(resolvedStyle)}>
        <BlockBody
          block={block}
          selectedId={selectedId}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}

function BlockBody({ block, selectedId, onSelect, onRemove }: BlockProps) {
  switch (block.type) {
    case 'typography':
      return <TypographyBlockView block={block} />;
    case 'field':
      return <FieldBlockView block={block} />;
    case 'container':
      return (
        <ContainerBlockView
          block={block}
          selectedId={selectedId}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      );
    case 'slider':
      return <SliderBlockView block={block} />;
  }
}
