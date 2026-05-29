import { DEFAULT_SWATCHES, type ColorSwatch } from './swatches';
import './ColorPicker.css';

export interface ColorPickerProps {
  /** Current color, or `undefined` for "no color". */
  value?: string;
  onChange: (value: string | undefined) => void;
  /** Preset swatches; defaults to the brand palette. */
  swatches?: ColorSwatch[];
  /** Show the native custom-color picker. Default `true`. */
  allowCustom?: boolean;
  /** Label for the "no color" swatch and the custom picker (for a11y/tooltip). */
  noneLabel?: string;
  customLabel?: string;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * ColorPicker — a row of preset swatches plus a "none" option and an optional
 * native custom-color picker. Portable: depends only on React and theme vars.
 */
export function ColorPicker({
  value,
  onChange,
  swatches = DEFAULT_SWATCHES,
  allowCustom = true,
  noneLabel = 'None',
  customLabel = 'Custom',
}: ColorPickerProps) {
  const isNone = !value || value === 'transparent';
  const matchesSwatch = swatches.some((s) => s.value === value);
  const customValue = !isNone && !matchesSwatch ? value : undefined;
  const nativeValue = customValue && HEX.test(customValue) ? customValue : '#000000';

  return (
    <div className="color-picker">
      <button
        type="button"
        className={`color-picker__swatch color-picker__swatch--none${
          isNone ? ' color-picker__swatch--active' : ''
        }`}
        onClick={() => onChange(undefined)}
        title={noneLabel}
        aria-label={noneLabel}
        aria-pressed={isNone}
      />
      {swatches.map((s) => (
        <button
          key={s.value}
          type="button"
          className={`color-picker__swatch${
            value === s.value ? ' color-picker__swatch--active' : ''
          }`}
          style={{ backgroundColor: s.value }}
          onClick={() => onChange(s.value)}
          title={s.label}
          aria-label={s.label}
          aria-pressed={value === s.value}
        />
      ))}
      {allowCustom && (
        <label
          className={`color-picker__swatch color-picker__swatch--custom${
            customValue ? ' color-picker__swatch--active' : ''
          }`}
          style={customValue ? { backgroundColor: customValue } : undefined}
          title={customLabel}
        >
          <input
            type="color"
            className="color-picker__native"
            value={nativeValue}
            onChange={(e) => onChange(e.target.value)}
            aria-label={customLabel}
          />
        </label>
      )}
    </div>
  );
}
