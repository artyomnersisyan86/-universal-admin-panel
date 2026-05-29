import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@shared/ui/Button';
import type { BlockNode, BlockStyle } from '@shared/types';
import { TypographyBlockView } from './BlockRenderers/TypographyBlock';
import { FieldBlockView } from './BlockRenderers/FieldBlock';
import { ContainerBlockView } from './BlockRenderers/ContainerBlock';
import { SliderBlockView } from './BlockRenderers/SliderBlock';
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { source: 'block', blockId: block.id },
  });

  const blockStyle = block.props.style;
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(blockStyle?.margin ? { margin: blockStyle.margin } : {}),
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
        <span className="sb-block__type">{block.type}</span>
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
      <div className="sb-block__body" style={bodyStyleVars(blockStyle)}>
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

/**
 * Map a block's style to `--sb-*` custom properties consumed by Block.css.
 * Only defined values are emitted; CSS `var(..., fallback)` handles the rest,
 * which keeps unstyled blocks looking exactly as before. Stage 3.5 will layer
 * per-breakpoint vars on top of these.
 */
function bodyStyleVars(style: BlockStyle | undefined): CSSProperties {
  const vars: Record<string, string> = {};
  if (style?.backgroundColor) vars['--sb-bg'] = style.backgroundColor;
  if (style?.textColor) vars['--sb-fg'] = style.textColor;
  if (style?.padding) vars['--sb-pad'] = style.padding;
  if (style?.borderRadius) vars['--sb-radius'] = style.borderRadius;
  if (style?.borderColor) vars['--sb-border-color'] = style.borderColor;
  if (style?.borderWidth) vars['--sb-border-width'] = style.borderWidth;
  return vars as CSSProperties;
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
