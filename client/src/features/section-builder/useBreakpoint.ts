import { createContext, useContext, useState, ReactNode, createElement } from 'react';
import type { Breakpoint } from '@shared/types';

interface BreakpointContextType {
  breakpoint: Breakpoint;
  setBreakpoint: (bp: Breakpoint) => void;
}

const BreakpointContext = createContext<BreakpointContextType | undefined>(undefined);

export function BreakpointProvider({
  children,
  initial = 'desktop',
}: {
  children: ReactNode;
  initial?: Breakpoint;
}) {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(initial);

  return createElement(
    BreakpointContext.Provider,
    { value: { breakpoint, setBreakpoint } },
    children
  );
}

export function useBreakpoint() {
  const context = useContext(BreakpointContext);
  if (!context) {
    throw new Error('useBreakpoint must be used within a BreakpointProvider');
  }
  return context;
}
