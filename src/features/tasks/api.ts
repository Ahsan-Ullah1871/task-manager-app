import { supabase } from '../../lib/supabase';
import type {
  CreateTaskInput,
  RemoteTask,
  UpdateTaskInput,
} from './types';

const TABLE = 'tasks';

// Columns we read back. `starred` is deliberately absent — it's local-only.
const COLUMNS =
  'id, title, description, category_id, status, due_at, created_at, updated_at';

/** Fetch all tasks from the backend. */
export async function fetchTasks(): Promise<RemoteTask[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as RemoteTask[];
}

/** Create a task and return the persisted row. */
export async function createTask(input: CreateTaskInput): Promise<RemoteTask> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      title: input.title,
      description: input.description ?? null,
      category_id: input.category_id ?? null,
      due_at: input.due_at ?? null,
      status: 'open',
    })
    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data as RemoteTask;
}

/** Update a task and return the persisted row. */
export async function updateTask(
  id: string,
  patch: UpdateTaskInput,
): Promise<RemoteTask> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data as RemoteTask;
}

/** Delete a task. */
export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
