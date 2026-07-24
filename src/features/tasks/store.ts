import { create } from 'zustand';
import { readCache, writeCache, type CacheShape } from '../../lib/cache';
import { subscribeToConnectivity } from '../../lib/netinfo';
import * as categoriesApi from '../categories/api';
import * as tasksApi from './api';
import { mergeRemoteTasks } from './merge';
import type {
  Category,
  CreateTaskInput,
  LocalTask,
  TaskFilters,
  TaskSort,
  UpdateTaskInput,
} from './types';

interface SyncMeta {
  lastRefreshedAt: string | null;
  isRefreshing: boolean;
  isOffline: boolean;
  error: string | null;
}

interface TaskState {
  tasks: LocalTask[];
  categories: Category[];
  filters: TaskFilters;
  sort: TaskSort;
  sync: SyncMeta;
  hydrated: boolean;

  // lifecycle
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;

  // task writes (backend first, then cache)
  createTask: (input: CreateTaskInput) => Promise<void>;
  updateTask: (id: string, patch: UpdateTaskInput) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;

  // local-only
  toggleStar: (id: string) => Promise<void>;

  // categories
  addCategory: (name: string) => Promise<void>;

  // ui state
  setFilters: (patch: Partial<TaskFilters>) => void;
  setSort: (sort: TaskSort) => void;
}

const DEFAULT_FILTERS: TaskFilters = {
  categoryId: null,
  status: 'all',
  search: '',
};

const DEFAULT_SORT: TaskSort = { sortBy: 'created', dir: 'desc' };

/**
 * Persist the current tasks/categories/meta to the local cache. Called after
 * every successful mutation so the cache always mirrors what's on screen.
 */
async function persist(state: Pick<TaskState, 'tasks' | 'categories' | 'sync'>) {
  const cache: CacheShape = {
    version: 1,
    tasks: state.tasks,
    categories: state.categories,
    meta: { lastRefreshedAt: state.sync.lastRefreshedAt },
  };
  await writeCache(cache);
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  categories: [],
  filters: DEFAULT_FILTERS,
  sort: DEFAULT_SORT,
  sync: {
    lastRefreshedAt: null,
    isRefreshing: false,
    isOffline: false,
    error: null,
  },
  hydrated: false,

  hydrate: async () => {
    const cache = await readCache();
    set({
      tasks: cache.tasks,
      categories: cache.categories,
      sync: { ...get().sync, lastRefreshedAt: cache.meta.lastRefreshedAt },
      hydrated: true,
    });

    // Keep the offline indicator in sync with connectivity.
    subscribeToConnectivity((isOnline) => {
      set((s) => ({ sync: { ...s.sync, isOffline: !isOnline } }));
    });
  },

  refresh: async () => {
    set((s) => ({ sync: { ...s.sync, isRefreshing: true, error: null } }));
    try {
      const [remoteTasks, categories] = await Promise.all([
        tasksApi.fetchTasks(),
        categoriesApi.fetchCategories(),
      ]);

      // Preserve local-only `starred` across the refresh.
      const merged = mergeRemoteTasks(remoteTasks, get().tasks);
      const lastRefreshedAt = new Date().toISOString();

      set((s) => ({
        tasks: merged,
        categories,
        sync: {
          ...s.sync,
          isRefreshing: false,
          isOffline: false,
          lastRefreshedAt,
          error: null,
        },
      }));
      await persist(get());
    } catch (err) {
      // Refresh failed — keep whatever is already cached on screen.
      set((s) => ({
        sync: {
          ...s.sync,
          isRefreshing: false,
          error: err instanceof Error ? err.message : 'Refresh failed',
        },
      }));
    }
  },

  createTask: async (input) => {
    const remote = await tasksApi.createTask(input); // throws on failure
    const task: LocalTask = { ...remote, starred: false };
    set((s) => ({ tasks: [task, ...s.tasks] }));
    await persist(get());
  },

  updateTask: async (id, patch) => {
    const remote = await tasksApi.updateTask(id, patch);
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...remote, starred: t.starred } : t,
      ),
    }));
    await persist(get());
  },

  toggleComplete: async (id) => {
    const current = get().tasks.find((t) => t.id === id);
    if (!current) return;
    const nextStatus = current.status === 'done' ? 'open' : 'done';
    await get().updateTask(id, { status: nextStatus });
  },

  removeTask: async (id) => {
    await tasksApi.deleteTask(id); // throws on failure
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    await persist(get());
  },

  toggleStar: async (id) => {
    // Local-only: never hits the backend, just flips the flag and re-persists.
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, starred: !t.starred } : t,
      ),
    }));
    await persist(get());
  },

  addCategory: async (name) => {
    const category = await categoriesApi.createCategory(name);
    set((s) => ({
      categories: [...s.categories, category].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
    await persist(get());
  },

  setFilters: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch } })),

  setSort: (sort) => set({ sort }),
}));
