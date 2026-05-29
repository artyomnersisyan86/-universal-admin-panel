import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from './ColorPicker';
import { DEFAULT_SWATCHES } from './swatches';

describe('ColorPicker', () => {
  it('renders none + brand swatches + custom picker', () => {
    const { container } = render(<ColorPicker value={undefined} onChange={() => undefined} />);
    // none + 6 brand swatches are <button>s; the custom picker is a color <input>.
    expect(screen.getAllByRole('button')).toHaveLength(1 + DEFAULT_SWATCHES.length);
    expect(container.querySelector('input[type="color"]')).not.toBeNull();
  });

  it('marks the "none" swatch active when no value is set', () => {
    render(<ColorPicker value={undefined} onChange={() => undefined} noneLabel="None" />);
    expect(screen.getByRole('button', { name: 'None' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('emits the swatch value when a brand swatch is clicked', () => {
    const onChange = vi.fn();
    render(<ColorPicker value={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Primary' }));
    expect(onChange).toHaveBeenCalledWith('var(--color-primary)');
  });

  it('marks the active swatch and clears via "none"', () => {
    const onChange = vi.fn();
    render(
      <ColorPicker value="var(--color-primary)" onChange={onChange} noneLabel="None" />,
    );
    expect(screen.getByRole('button', { name: 'Primary' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'None' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    fireEvent.click(screen.getByRole('button', { name: 'None' }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('emits a hex value from the custom color input', () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker value={undefined} onChange={onChange} />);
    const input = container.querySelector('input[type="color"]') as HTMLInputElement;
    fireEvent.input(input, { target: { value: '#abcdef' } });
    expect(onChange).toHaveBeenCalledWith('#abcdef');
  });
});
