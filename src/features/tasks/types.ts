export type TaskStatus = 'open' | 'done';

/** A category as stored in Supabase. */
export interface Category {
  id: string;
  name: string;
  created_at: string;
}

/** A task exactly as it comes back from Supabase (no local-only fields). */
export interface RemoteTask {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  status: TaskStatus;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * A task as stored locally. Identical to {@link RemoteTask} plus the
 * device-only `starred` flag, which is never sent to the backend.
 */
export interface LocalTask extends RemoteTask {
  starred: boolean;
}

/** Fields a user can set when creating a task. */
export interface CreateTaskInput {
  title: string;
  description?: string | null;
  category_id?: string | null;
  due_at?: string | null;
}

/** Fields a user can change when editing a task. */
export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  category_id?: string | null;
  status?: TaskStatus;
  due_at?: string | null;
}

// ---- Filter / sort shapes (used by selectors + store) ----

export type StatusFilter = 'all' | TaskStatus;
export type SortBy = 'due' | 'created';
export type SortDir = 'asc' | 'desc';

export interface TaskFilters {
  categoryId: string | null; // null = all categories
  status: StatusFilter;
  search: string;
}

export interface TaskSort {
  sortBy: SortBy;
  dir: SortDir;
}
