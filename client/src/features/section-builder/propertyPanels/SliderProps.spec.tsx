import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { SliderBlock } from '@shared/types';
import { SliderProps } from './SliderProps';

function makeBlock(slideCount: number): SliderBlock {
  return {
    id: 'slider-1',
    type: 'slider',
    props: {
      slides: Array.from({ length: slideCount }, (_, i) => ({
        id: `s${i}`,
        title: `Slide ${i}`,
        image: { desktop: '' },
      })),
    },
  };
}

/** Controlled harness so patches applied via onPatch are reflected back. */
function Harness({ initial }: { initial: SliderBlock }) {
  const [block, setBlock] = useState(initial);
  return <SliderProps block={block} onPatch={(patch) => setBlock((b) => patch(b))} />;
}

describe('SliderProps', () => {
  // i18n runs in echo mode under test (no provider), so user-facing copy is
  // matched by translation key; hard-coded aria-labels/placeholders are not.
  it('shows the empty hint with no slides', () => {
    render(<Harness initial={makeBlock(0)} />);
    expect(screen.getByText('sectionBuilder.slider.noSlides')).toBeInTheDocument();
  });

  it('adds a slide', () => {
    render(<Harness initial={makeBlock(0)} />);
    fireEvent.click(screen.getByRole('button', { name: /slider\.addSlide/i }));
    // The new slide row exposes move/remove controls.
    expect(screen.getByRole('button', { name: 'Remove slide' })).toBeInTheDocument();
  });

  it('removes a slide', () => {
    render(<Harness initial={makeBlock(2)} />);
    expect(screen.getAllByRole('button', { name: 'Remove slide' })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove slide' })[0]);
    expect(screen.getAllByRole('button', { name: 'Remove slide' })).toHaveLength(1);
  });

  it('reorders slides with the move-down control', () => {
    render(<Harness initial={makeBlock(2)} />);
    const titlesBefore = screen.getAllByText(/^Slide \d$/).map((el) => el.textContent);
    expect(titlesBefore).toEqual(['Slide 0', 'Slide 1']);
    fireEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0]);
    const titlesAfter = screen.getAllByText(/^Slide \d$/).map((el) => el.textContent);
    expect(titlesAfter).toEqual(['Slide 1', 'Slide 0']);
  });

  it('opens the slide editor when a slide is selected', () => {
    render(<Harness initial={makeBlock(1)} />);
    fireEvent.click(screen.getByText('Slide 0'));
    // Editor exposes the button-URL field with the example placeholder.
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
  });
});
