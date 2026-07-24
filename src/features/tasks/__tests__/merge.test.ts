import { mergeRemoteTasks } from '../merge';
import type { LocalTask, RemoteTask } from '../types';

function remote(id: string, overrides: Partial<RemoteTask> = {}): RemoteTask {
  return {
    id,
    title: overrides.title ?? `Task ${id}`,
    description: overrides.description ?? null,
    category_id: overrides.category_id ?? null,
    status: overrides.status ?? 'open',
    due_at: overrides.due_at ?? null,
    created_at: overrides.created_at ?? '2026-01-01T00:00:00.000Z',
    updated_at: overrides.updated_at ?? '2026-01-01T00:00:00.000Z',
  };
}

function local(id: string, starred: boolean): LocalTask {
  return { ...remote(id), starred };
}

describe('mergeRemoteTasks', () => {
  it('preserves the local starred flag for existing tasks', () => {
    const merged = mergeRemoteTasks(
      [remote('a'), remote('b')],
      [local('a', true), local('b', false)],
    );
    expect(merged.find((t) => t.id === 'a')?.starred).toBe(true);
    expect(merged.find((t) => t.id === 'b')?.starred).toBe(false);
  });

  it('defaults starred to false for tasks not seen locally', () => {
    const merged = mergeRemoteTasks([remote('new')], []);
    expect(merged[0].starred).toBe(false);
  });

  it('drops tasks that no longer exist remotely (e.g. after a delete)', () => {
    const merged = mergeRemoteTasks([remote('a')], [local('a', true), local('gone', true)]);
    expect(merged.map((t) => t.id)).toEqual(['a']);
  });

  it('takes remote values as the source of truth for backend fields', () => {
    const merged = mergeRemoteTasks(
      [remote('a', { title: 'Updated title', status: 'done' })],
      [local('a', true)], // stale local copy still says open / old title
    );
    expect(merged[0].title).toBe('Updated title');
    expect(merged[0].status).toBe('done');
    // ...but the local-only flag survives the refresh.
    expect(merged[0].starred).toBe(true);
  });

  it('does not carry a starred property onto the remote-typed output beyond the flag', () => {
    const merged = mergeRemoteTasks([remote('a')], [local('a', true)]);
    expect(Object.prototype.hasOwnProperty.call(merged[0], 'starred')).toBe(true);
  });
});
