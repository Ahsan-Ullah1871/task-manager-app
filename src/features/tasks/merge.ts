import type { LocalTask, RemoteTask } from './types';

/**
 * Merge a fresh set of tasks from the backend with what we already have
 * locally, preserving the device-only `starred` flag.
 *
 * Rules:
 * - Remote is the source of truth for every backend field.
 * - `starred` is local-only: keep the existing local value, or default to
 *   `false` for tasks we've never seen before.
 * - Tasks that no longer exist remotely simply drop out (they aren't in
 *   `remote`), which is the correct behaviour after a delete.
 *
 * This is intentionally a pure function so it can be unit-tested in isolation.
 */
export function mergeRemoteTasks(
  remote: RemoteTask[],
  local: LocalTask[],
): LocalTask[] {
  const starredById = new Map<string, boolean>();
  for (const task of local) {
    starredById.set(task.id, task.starred);
  }

  return remote.map((task) => ({
    ...task,
    starred: starredById.get(task.id) ?? false,
  }));
}
