import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

/**
 * Shared drag-and-drop sensors for every builder surface (page/section,
 * form, table, dashboard).
 *
 * - `MouseSensor` — desktop: tiny 4px move to start, no delay.
 * - `TouchSensor` — touch: short press-and-hold so taps/scroll still work;
 *   the `tolerance` lets a finger jitter slightly during the hold.
 * - `KeyboardSensor` — accessibility: drag with Space/Enter + arrows.
 *
 * A single `PointerSensor` can't distinguish a scroll gesture from a drag on
 * touch, which is why mouse and touch are split here.
 */
export function useBuilderSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );
}
