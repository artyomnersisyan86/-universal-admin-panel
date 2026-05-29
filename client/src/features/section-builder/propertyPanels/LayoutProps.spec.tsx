import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayoutProps, WidthSelect } from './LayoutProps';

describe('WidthSelect', () => {
  it('defaults to auto and emits the chosen width', () => {
    const onChange = vi.fn();
    render(<WidthSelect value={undefined} onChange={onChange} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('auto');
    fireEvent.change(select, { target: { value: '50%' } });
    expect(onChange).toHaveBeenCalledWith('50%');
  });
});

describe('LayoutProps', () => {
  it('renders direction, gap, justify and align selects', () => {
    render(<LayoutProps layout={undefined} onChange={() => undefined} />);
    expect(screen.getAllByRole('combobox')).toHaveLength(4);
  });

  it('merges the direction change into the layout', () => {
    const onChange = vi.fn();
    render(<LayoutProps layout={{ gap: 'var(--space-2)' }} onChange={onChange} />);
    // Selects render in DOM order: direction, gap, justify, align.
    const [direction] = screen.getAllByRole('combobox');
    fireEvent.change(direction, { target: { value: 'row' } });
    expect(onChange).toHaveBeenCalledWith({ gap: 'var(--space-2)', direction: 'row' });
  });

  it('clears justify back to undefined when "—" is chosen', () => {
    const onChange = vi.fn();
    render(<LayoutProps layout={{ justifyContent: 'center' }} onChange={onChange} />);
    const justify = screen.getAllByRole('combobox')[2];
    expect((justify as HTMLSelectElement).value).toBe('center');
    fireEvent.change(justify, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith({ justifyContent: undefined });
  });
});
