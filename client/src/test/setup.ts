import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest is configured without globals, so React Testing Library's automatic
// per-test cleanup never registers. Unmount rendered trees between tests so
// queries don't see leftover DOM from previous renders.
afterEach(() => cleanup());
