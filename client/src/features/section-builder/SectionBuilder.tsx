import { useEffect, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import type { BlockType, Section } from '@shared/types';
import { useUpdateSection } from '@features/sections/useSections';
import { Palette } from './Palette';
import { Canvas, CANVAS_DROPPABLE_ID } from './Canvas';
import { PropertyPanel } from './PropertyPanel';
import { useBlockTree } from './useBlockTree';
import { makeBlock, normalizeLayout } from './blockTree';
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

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

    const data = active.data.current as ActiveData | undefined;

    if (isPaletteData(data)) {
      const newBlock = makeBlock(data.blockType);
      // Drop on a specific block → insert before it; on the canvas → append.
      const overId = String(over.id);
      if (overId === CANVAS_DROPPABLE_ID) {
        tree.append(newBlock);
      } else {
        const idx = tree.layout.root.findIndex((b) => b.id === overId);
        if (idx === -1) tree.append(newBlock);
        else tree.insertAtIndex(idx, newBlock);
      }
      setSelectedId(newBlock.id);
      return;
    }

    if (active.id !== over.id) {
      tree.reorder(String(active.id), String(over.id));
    }
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
  );
}
