import { useEffect, useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { useBuilderSensors } from '@shared/lib/useBuilderSensors';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import type { BlockType, Section } from '@shared/types';
import { useUpdateSection } from '@features/sections/useSections';
import { Palette } from './Palette';
import { Canvas, CANVAS_DROPPABLE_ID } from './Canvas';
import { CONTAINER_DROPPABLE_PREFIX } from './BlockRenderers/ContainerBlock';
import { PropertyPanel } from './PropertyPanel';
import { useBlockTree } from './useBlockTree';
import { makeBlock, normalizeLayout, resolveDropTarget } from './blockTree';
import { BreakpointProvider } from './useBreakpoint';
import { PreviewToggle } from './PreviewToggle';
import './SectionBuilder.css';

interface SectionBuilderProps {
  section: Section;
}

interface PaletteDragData {
  source: 'palette';
  blockType: BlockType;
}

interface BlockDragData {
  source: 'block';
  blockId: string;
}

type ActiveData = PaletteDragData | BlockDragData;

function isPaletteData(data: unknown): data is PaletteDragData {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as ActiveData).source === 'palette'
  );
}

export function SectionBuilder({ section }: SectionBuilderProps) {
  const { t } = useTranslation(['admin', 'common']);
  const tree = useBlockTree(normalizeLayout(section.layout));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateMutation = useUpdateSection(section.id);

  const sensors = useBuilderSensors();

  // Re-sync local state when the server payload changes (e.g. navigating
  // between sections without unmounting).
  useEffect(() => {
    tree.reset(normalizeLayout(section.layout));
    setSelectedId(null);
    setSavedAt(null);
    // We intentionally only react to section.id — the layout reference
    // changes after every save and would otherwise blow away local edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  const selected = selectedId ? tree.findNode(selectedId) : null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const target = resolveDropTarget(tree.layout.root, String(over.id), String(active.id), {
      canvasId: CANVAS_DROPPABLE_ID,
      containerPrefix: CONTAINER_DROPPABLE_PREFIX,
    });
    if (!target) return;

    const data = active.data.current as ActiveData | undefined;

    if (isPaletteData(data)) {
      const newBlock = makeBlock(data.blockType);
      if (target.parentId === null) {
        tree.insertAtIndex(target.index, newBlock);
      } else {
        tree.insertInContainer(target.parentId, newBlock, target.index);
      }
      setSelectedId(newBlock.id);
      return;
    }

    // Moving an existing block. `moveToParent` removes then re-inserts, which
    // works uniformly for same-parent reorder and cross-parent moves, and
    // guards against dropping a container into its own subtree.
    if (active.id === over.id) return;
    tree.moveToParent(String(active.id), target.parentId, target.index);
  }

  async function handleSave() {
    setSaveError(null);
    try {
      await updateMutation.mutateAsync({ layout: tree.layout });
      setSavedAt(new Date());
    } catch (err) {
      setSaveError((err as Error).message);
    }
  }

  function removeBlock(id: string) {
    tree.remove(id);
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <BreakpointProvider>
      <div className="section-builder">
        <header className="section-builder__header">
          <div>
            <Typography variant="h2">
              {section.name.hy || section.name.en || section.slug}
            </Typography>
            <Typography variant="caption" className="section-builder__slug">
              <code>/api/{section.slug}</code>
            </Typography>
          </div>
          <div className="section-builder__actions">
            <PreviewToggle />
            {savedAt && (
              <Typography variant="caption" className="section-builder__saved">
                {t('admin:sectionBuilder.savedAt', { time: savedAt.toLocaleTimeString() })}
              </Typography>
            )}
            {saveError && (
              <Typography variant="caption" className="section-builder__error">
                ⚠ {saveError}
              </Typography>
            )}
            <Button onClick={handleSave} loading={updateMutation.isPending}>
              {t('admin:sectionBuilder.save')}
            </Button>
          </div>
        </header>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="section-builder__workspace">
            <Palette />
            <Canvas
              blocks={tree.layout.root}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRemove={removeBlock}
            />
            <PropertyPanel block={selected} onPatch={tree.update} />
          </div>
        </DndContext>
      </div>
    </BreakpointProvider>
  );
}
