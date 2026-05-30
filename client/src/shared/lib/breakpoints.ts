/**
 * Breakpoint values mirrored from `styles/tokens.css` (`--bp-*`).
 * CSS variables can't be read inside `@media`, so JS-driven responsive
 * behaviour (e.g. the sidebar drawer) uses these constants instead.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/** Media query matching viewports at or below the given breakpoint. */
export const maxWidth = (bp: BreakpointKey): string =>
  `(max-width: ${BREAKPOINTS[bp]}px)`;
