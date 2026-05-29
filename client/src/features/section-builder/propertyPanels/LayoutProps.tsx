import { useTranslation } from 'react-i18next';
import { Select } from '@shared/ui/Select';
import { FieldShell } from '@shared/ui/_FieldShell';
import type {
  AlignItems,
  FieldWidth,
  FlexDirection,
  FlexLayout,
  JustifyContent,
  SelectOption,
} from '@shared/types';
import { SpacingSelect } from './styleControls';

const DIRECTION_OPTIONS: SelectOption[] = [
  { value: 'column', label: 'column' },
  { value: 'row', label: 'row' },
];

const JUSTIFY_OPTIONS: SelectOption[] = [
  { value: '', label: '—' },
  { value: 'flex-start', label: 'start' },
  { value: 'center', label: 'center' },
  { value: 'flex-end', label: 'end' },
  { value: 'space-between', label: 'between' },
  { value: 'space-around', label: 'around' },
  { value: 'space-evenly', label: 'evenly' },
];

const ALIGN_OPTIONS: SelectOption[] = [
  { value: '', label: '—' },
  { value: 'stretch', label: 'stretch' },
  { value: 'flex-start', label: 'start' },
  { value: 'center', label: 'center' },
  { value: 'flex-end', label: 'end' },
  { value: 'baseline', label: 'baseline' },
];

const WIDTH_OPTIONS: SelectOption[] = [
  { value: 'auto', label: 'auto' },
  { value: '100%', label: '100%' },
  { value: '50%', label: '50%' },
  { value: '33%', label: '33%' },
];

interface WidthSelectProps {
  value: FieldWidth | undefined;
  onChange: (value: FieldWidth) => void;
}

/** Width of a block as a flex child (meaningful inside a row container). */
export function WidthSelect({ value, onChange }: WidthSelectProps) {
  return (
    <Select
      options={WIDTH_OPTIONS}
      value={value ?? 'auto'}
      onChange={(e) => onChange(e.target.value as FieldWidth)}
    />
  );
}

interface LayoutPropsProps {
  layout: FlexLayout | undefined;
  onChange: (next: FlexLayout) => void;
}

/** Flex controls for a container block: direction, gap, justify, align. */
export function LayoutProps({ layout, onChange }: LayoutPropsProps) {
  const { t } = useTranslation('admin');
  const l = layout ?? {};
  const set = (patch: Partial<FlexLayout>) => onChange({ ...l, ...patch });

  return (
    <>
      <div className="property-panel__row">
        <FieldShell label={t('sectionBuilder.layout.direction')}>
          <Select
            options={DIRECTION_OPTIONS}
            value={l.direction ?? 'column'}
            onChange={(e) => set({ direction: e.target.value as FlexDirection })}
          />
        </FieldShell>
        <FieldShell label={t('sectionBuilder.layout.gap')}>
          <SpacingSelect value={l.gap} onChange={(gap) => set({ gap })} />
        </FieldShell>
      </div>

      <FieldShell label={t('sectionBuilder.layout.justify')}>
        <Select
          options={JUSTIFY_OPTIONS}
          value={l.justifyContent ?? ''}
          onChange={(e) =>
            set({ justifyContent: (e.target.value || undefined) as JustifyContent | undefined })
          }
        />
      </FieldShell>

      <FieldShell label={t('sectionBuilder.layout.align')}>
        <Select
          options={ALIGN_OPTIONS}
          value={l.alignItems ?? ''}
          onChange={(e) =>
            set({ alignItems: (e.target.value || undefined) as AlignItems | undefined })
          }
        />
      </FieldShell>
    </>
  );
}
