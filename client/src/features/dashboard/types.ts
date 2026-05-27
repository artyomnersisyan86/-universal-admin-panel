export type WidgetType = 'line' | 'bar';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  /** Endpoint that returns `{ name: string; value: number }[]`. */
  dataEndpoint: string;
  /** Inline static data (used when no endpoint or for demo). */
  staticData?: { name: string; value: number }[];
  order: number;
}
