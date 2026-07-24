import { selectVisibleTasks } from '../selectors';
import type { LocalTask, TaskFilters, TaskSort } from '../types';

function makeTask(overrides: Partial<LocalTask>): LocalTask {
  return {
    id: overrides.id ?? 'id',
    title: overrides.title ?? 'Task',
    description: overrides.description ?? null,
    category_id: overrides.category_id ?? null,
    status: overrides.status ?? 'open',
    due_at: overrides.due_at ?? null,
    created_at: overrides.created_at ?? '2026-01-01T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-01-01T00:00:00.000Z',
    starred: overrides.starred ?? false,
  };
}

const ALL: TaskFilters = { categoryId: null, status: 'all', search: '' };
const CREATED_DESC: TaskSort = { sortBy: 'created', dir: 'desc' };

const tasks: LocalTask[] = [
  makeTask({
    id: 'a',
    title: 'Buy milk',
    category_id: 'groceries',
    status: 'open',
    due_at: '2026-02-10T00:00:00.000Z',
    created_at: '2026-01-01T00:00:00.000Z',
  }),
  makeTask({
    id: 'b',
    title: 'Ship release',
    category_id: 'work',
    status: 'done',
    due_at: '2026-02-01T00:00:00.000Z',
    created_at: '2026-01-03T00:00:00.000Z',
  }),
  makeTask({
    id: 'c',
    title: 'Milk the cow',
    category_id: 'work',
    status: 'open',
    due_at: null,
    created_at: '2026-01-02T00:00:00.000Z',
  }),
];

describe('selectVisibleTasks — filtering', () => {
  it('returns all tasks with the default filter', () => {
    expect(selectVisibleTasks(tasks, ALL, CREATED_DESC)).toHaveLength(3);
  });

  it('filters by category', () => {
    const result = selectVisibleTasks(
      tasks,
      { ...ALL, categoryId: 'work' },
      CREATED_DESC,
    );
    expect(result.map((t) => t.id).sort()).toEqual(['b', 'c']);
  });

  it('filters by status', () => {
    const result = selectVisibleTasks(tasks, { ...ALL, status: 'open' }, CREATED_DESC);
    expect(result.map((t) => t.id).sort()).toEqual(['a', 'c']);
  });

  it('searches by title, case-insensitively', () => {
    const result = selectVisibleTasks(tasks, { ...ALL, search: 'MILK' }, CREATED_DESC);
    expect(result.map((t) => t.id).sort()).toEqual(['a', 'c']);
  });

  it('combines category + status + search', () => {
    const result = selectVisibleTasks(
      tasks,
      { categoryId: 'work', status: 'open', search: 'milk' },
      CREATED_DESC,
    );
    expect(result.map((t) => t.id)).toEqual(['c']);
  });
});

describe('selectVisibleTasks — sorting', () => {
  it('sorts by created time descending', () => {
    const result = selectVisibleTasks(tasks, ALL, { sortBy: 'created', dir: 'desc' });
    expect(result.map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by created time ascending', () => {
    const result = selectVisibleTasks(tasks, ALL, { sortBy: 'created', dir: 'asc' });
    expect(result.map((t) => t.id)).toEqual(['a', 'c', 'b']);
  });

  it('sorts by due date ascending with undated tasks last', () => {
    const result = selectVisibleTasks(tasks, ALL, { sortBy: 'due', dir: 'asc' });
    // b (Feb 1) < a (Feb 10) < c (no due date -> last)
    expect(result.map((t) => t.id)).toEqual(['b', 'a', 'c']);
  });

  it('keeps undated tasks last even when sorting due descending', () => {
    const result = selectVisibleTasks(tasks, ALL, { sortBy: 'due', dir: 'desc' });
    // a (Feb 10) > b (Feb 1), then c (no due date) still last
    expect(result.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the input array', () => {
    const input = [...tasks];
    selectVisibleTasks(input, ALL, { sortBy: 'due', dir: 'asc' });
    expect(input.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });
});
