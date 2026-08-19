import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Not using vitest's `globals: true` (kept consistent with the server's
// explicit-import test style), so RTL can't auto-detect a global afterEach
// to register its own cleanup — without this, DOM from one test leaks into
// the next within the same file.
afterEach(() => {
  cleanup();
});
