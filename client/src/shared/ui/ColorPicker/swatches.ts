export interface ColorSwatch {
  label: string;
  /** CSS color string — a token reference (`var(--color-primary)`) or literal hex. */
  value: string;
}

/** Brand palette from `tokens.css` (≤6 colors). Values are theme-aware vars. */
export const DEFAULT_SWATCHES: ColorSwatch[] = [
  { label: 'Primary', value: 'var(--color-primary)' },
  { label: 'Secondary', value: 'var(--color-secondary)' },
  { label: 'Success', value: 'var(--color-success)' },
  { label: 'Warning', value: 'var(--color-warning)' },
  { label: 'Error', value: 'var(--color-error)' },
  { label: 'Neutral', value: 'var(--color-neutral)' },
];
