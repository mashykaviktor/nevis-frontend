import { useCallback, useState } from 'react';

/**
 * Tracks which node ids are expanded as a flat set. Toggling a node never
 * touches its descendants' ids — collapsing a parent just makes its
 * subtree unreachable via `flattenVisibleRows`, so a previously-expanded
 * descendant resumes its state if the parent is expanded again later.
 */
export function useExpandedRows(initiallyExpandedIds: string[] = []) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(initiallyExpandedIds));

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return { expandedIds, toggle };
}
