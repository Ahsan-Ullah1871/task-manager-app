import type { LocalTask, TaskFilters, TaskSort } from './types';

/**
 * Pure filter + sort logic for the task list. Kept out of the render tree so
 * it can be reasoned about and unit-tested without React.
 *
 * Filtering: by category, by status, and by a case-insensitive title search.
 * Sorting: by due date or created time, ascending or descending. Tasks with a
 * missing `due_at` always sort to the end regardless of direction, so
 * undated tasks don't crowd the top.
 */
export function selectVisibleTasks(
  tasks: LocalTask[],
  filters: TaskFilters,
  sort: TaskSort,
): LocalTask[] {
  const search = filters.search.trim().toLowerCase();

  const filtered = tasks.filter((task) => {
    if (filters.categoryId !== null && task.category_id !== filters.categoryId) {
      return false;
    }
    if (filters.status !== 'all' && task.status !== filters.status) {
      return false;
    }
    if (search.length > 0 && !task.title.toLowerCase().includes(search)) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => compare(a, b, sort));
  return sorted;
}

function compare(a: LocalTask, b: LocalTask, sort: TaskSort): number {
  if (sort.sortBy === 'due') {
    // Undated tasks always sink to the bottom.
    const aVal = a.due_at;
    const bVal = b.due_at;
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    return applyDir(aVal.localeCompare(bVal), sort.dir);
  }

  // sortBy === 'created'
  return applyDir(a.created_at.localeCompare(b.created_at), sort.dir);
}

function applyDir(result: number, dir: TaskSort['dir']): number {
  return dir === 'asc' ? result : -result;
}
