import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { apiClient } from '@shared/lib/apiClient';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import type { DashboardWidget } from './types';
import './Widget.css';

interface WidgetProps {
  widget: DashboardWidget;
  onRemove: (id: string) => void;
}

type Point = { name: string; value: number };

export function Widget({ widget, onRemove }: WidgetProps) {
  const [data, setData] = useState<Point[]>(widget.staticData ?? []);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  useEffect(() => {
    if (!widget.dataEndpoint) return;
    setLoading(true);
    setErr(null);
    apiClient
      .get<Point[]>(widget.dataEndpoint)
      .then((r) => setData(Array.isArray(r.data) ? r.data : []))
      .catch((e: { message?: string }) => setErr(e.message ?? 'Error'))
      .finally(() => setLoading(false));
  }, [widget.dataEndpoint]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`widget${isDragging ? ' widget--dragging' : ''}`}
    >
      <div className="widget__header">
        <span className="widget__handle" {...attributes} {...listeners} aria-label="Drag">
          ⋮⋮
        </span>
        <Typography variant="h5">{widget.title}</Typography>
        <Button variant="text" size="small" onClick={() => onRemove(widget.id)}>
          ×
        </Button>
      </div>
      <div className="widget__body">
        {loading && <Typography variant="caption">Loading…</Typography>}
        {err && <Typography variant="caption">⚠ {err}</Typography>}
        {!loading && !err && (
          <ResponsiveContainer width="100%" height={220}>
            {widget.type === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--fg-muted)" />
                <YAxis stroke="var(--fg-muted)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elev)',
                    borderColor: 'var(--border)',
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--fg-muted)" />
                <YAxis stroke="var(--fg-muted)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elev)',
                    borderColor: 'var(--border)',
                  }}
                />
                <Bar dataKey="value" fill="var(--color-primary)" />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
