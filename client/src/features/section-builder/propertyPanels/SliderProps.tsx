import type { SliderBlock, Slide } from '@shared/types';
import { SlidesEditor } from '../SlidesEditor';

interface Props {
  block: SliderBlock;
  onPatch: (patch: (b: SliderBlock) => SliderBlock) => void;
}

/**
 * Builder property panel for a slider block. Slides are stored in
 * `block.props.slides`; the actual editing UI is the shared {@link SlidesEditor}
 * (reused by the entry editor, where slides are per-entry content instead).
 */
export function SliderProps({ block, onPatch }: Props) {
  const slides = block.props.slides ?? [];

  function handleChange(next: Slide[]) {
    onPatch((b) => ({ ...b, props: { ...b.props, slides: next } }));
  }

  return <SlidesEditor slides={slides} onChange={handleChange} />;
}
