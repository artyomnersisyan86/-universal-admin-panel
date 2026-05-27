import { useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import { Widget } from './Widget';
import type { DashboardWidget, WidgetType } from './types';
import './Dashboard.css';

const DEMO_DATA = [
  { name: 'Mon', value: 12 },
  { name: 'Tue', value: 19 },
  { name: 'Wed', value: 7 },
  { name: 'Thu', value: 23 },
  { name: 'Fri', value: 15 },
  { name: 'Sat', value: 28 },
  { name: 'Sun', value: 11 },
];

const INITIAL: DashboardWidget[] = [
  {
    id: crypto.randomUUID(),
    type: 'line',
    title: 'Users trend',
    dataEndpoint: '',
    staticData: DEMO_DATA,
    order: 0,
  },
  {
    id: crypto.randomUUID(),
    type: 'bar',
    title: 'Daily activity',
    dataEndpoint: '',
    staticData: DEMO_DATA,
    order: 1,
  },
];

export function Dashboard() {
  const { t } = useTranslation('admin');
  const [widgets, setWidgets] = useState<DashboardWidget[]>(INITIAL);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setWidgets((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  }

  function addWidget(type: WidgetType) {
    setWidgets((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        title: type === 'line' ? 'New line chart' : 'New bar chart',
        dataEndpoint: '',
        staticData: DEMO_DATA,
        order: prev.length,
      },
    ]);
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <Typography variant="h2">{t('nav.dashboard')}</Typography>
        <div className="dashboard__actions">
          <Button size="small" variant="outlined" onClick={() => addWidget('line')}>
            + Line
          </Button>
          <Button size="small" variant="outlined" onClick={() => addWidget('bar')}>
            + Bar
          </Button>
        </div>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <div className="dashboard__grid">
            {widgets.map((w) => (
              <Widget
                key={w.id}
                widget={w}
                onRemove={(id) => setWidgets((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
