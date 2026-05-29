import { Select } from '@shared/ui/Select';
import type { SelectOption } from '@shared/types';

/**
 * Token-backed option lists for style controls. The empty value means "no
 * override" (the block inherits whatever the CSS default is).
 */
const SPACING_OPTIONS: SelectOption[] = [
  { value: '', label: '—' },
  { value: '0', label: '0' },
  { value: 'var(--space-1)', label: '4' },
  { value: 'var(--space-2)', label: '8' },
  { value: 'var(--space-3)', label: '12' },
  { value: 'var(--space-4)', label: '16' },
  { value: 'var(--space-5)', label: '24' },
  { value: 'var(--space-6)', label: '32' },
  { value: 'var(--space-7)', label: '48' },
];

const RADIUS_OPTIONS: SelectOption[] = [
  { value: '', label: '—' },
  { value: '0', label: '0' },
  { value: 'var(--radius-sm)', label: 'sm' },
  { value: 'var(--radius-md)', label: 'md' },
  { value: 'var(--radius-lg)', label: 'lg' },
  { value: 'var(--radius-pill)', label: 'pill' },
];

const BORDER_WIDTH_OPTIONS: SelectOption[] = [
  { value: '', label: '—' },
  { value: '1px', label: '1px' },
  { value: '2px', label: '2px' },
  { value: '3px', label: '3px' },
  { value: '4px', label: '4px' },
];

interface TokenSelectProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

function TokenSelect({ value, onChange, options }: TokenSelectProps & { options: SelectOption[] }) {
  return (
    <Select
      options={options}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
    />
  );
}

export function SpacingSelect(props: TokenSelectProps) {
  return <TokenSelect {...props} options={SPACING_OPTIONS} />;
}

export function RadiusSelect(props: TokenSelectProps) {
  return <TokenSelect {...props} options={RADIUS_OPTIONS} />;
}

export function BorderWidthSelect(props: TokenSelectProps) {
  return <TokenSelect {...props} options={BORDER_WIDTH_OPTIONS} />;
}
