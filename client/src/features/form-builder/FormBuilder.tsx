import { useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import { FormGroup } from '@shared/ui/FormGroup';
import type { FieldDef, FieldType } from '@shared/types';
import { Palette } from './Palette';
import { Canvas } from './Canvas';
import { PropertyPanel } from './PropertyPanel';
import { makeFieldDef } from './types';
import './FormBuilder.css';

export function FormBuilder() {
  const { t } = useTranslation(['admin', 'common']);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const selected = fields.find((f) => f.id === selectedId) ?? null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as { source?: string; fieldType?: FieldType } | undefined;

    // Drop from palette → canvas
    if (activeData?.source === 'palette' && activeData.fieldType) {
      const newField = makeFieldDef(activeData.fieldType, fields.length);
      setFields((prev) => [...prev, newField]);
      setSelectedId(newField.id);
      return;
    }

    // Reorder canvas item
    if (active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setFields((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    }
  }

  function updateSelected(patch: Partial<FieldDef>) {
    if (!selectedId) return;
    setFields((prev) => prev.map((f) => (f.id === selectedId ? { ...f, ...patch } : f)));
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="form-builder">
      <header className="form-builder__header">
        <Typography variant="h2">{t('admin:nav.formBuilder')}</Typography>
        <div className="form-builder__actions">
          <Button variant="outlined" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? t('admin:formBuilder.canvas') : t('admin:formBuilder.preview')}
          </Button>
          <Button
            variant="text"
            onClick={() =>
              navigator.clipboard.writeText(JSON.stringify({ fields }, null, 2))
            }
          >
            {t('common:app.copyJson')}
          </Button>
        </div>
      </header>

      {showPreview ? (
        <div className="form-builder__preview">
          <FormGroup
            schema={fields}
            onSubmit={(values) =>
              window.alert(JSON.stringify(values, null, 2))
            }
          />
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="form-builder__workspace">
            <Palette />
            <Canvas
              fields={fields}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRemove={removeField}
            />
            <PropertyPanel field={selected} onChange={updateSelected} />
          </div>
        </DndContext>
      )}
    </div>
  );
}
