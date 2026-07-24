import { useMemo } from 'react';
import { selectVisibleTasks } from './selectors';
import { useTaskStore } from './store';
import type { LocalTask } from './types';

// Re-exported so screens can import the debounce alongside the other task hooks.
export { useDebouncedValue } from '../../lib/useDebouncedValue';

/**
 * The task list as it should appear on screen: store tasks run through the pure
 * `selectVisibleTasks` filter/sort. The heavy work is memoised on its inputs so
 * the FlatList doesn't recompute on unrelated renders.
 *
 * `searchOverride` lets the screen feed in a debounced search term without
 * mutating the store's raw (per-keystroke) filter value.
 */
export function useVisibleTasks(searchOverride?: string): LocalTask[] {
  const tasks = useTaskStore((s) => s.tasks);
  const filters = useTaskStore((s) => s.filters);
  const sort = useTaskStore((s) => s.sort);

  const effectiveFilters = useMemo(
    () =>
      searchOverride === undefined
        ? filters
        : { ...filters, search: searchOverride },
    [filters, searchOverride],
  );

  return useMemo(
    () => selectVisibleTasks(tasks, effectiveFilters, sort),
    [tasks, effectiveFilters, sort],
  );
}
