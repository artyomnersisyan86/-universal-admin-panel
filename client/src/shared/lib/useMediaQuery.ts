import { useEffect, useState } from 'react';
import { maxWidth, type BreakpointKey } from './breakpoints';

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 * SSR-safe: returns `false` until the first client-side effect runs.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Convenience: true when the viewport is at or below the given breakpoint. */
export function useMaxWidth(bp: BreakpointKey): boolean {
  return useMediaQuery(maxWidth(bp));
}
