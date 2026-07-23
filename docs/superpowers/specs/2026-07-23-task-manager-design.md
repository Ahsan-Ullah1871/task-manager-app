# Task Manager — Design Spec

**Stack:** Expo (managed) · TypeScript · Zustand + manual cache layer · AsyncStorage · Supabase · React Navigation

## Goal
A React Native Task Manager: create tasks, assign categories, mark complete, browse by category/status. Tasks readable offline from local cache; refresh from Supabase when online. Local-only `starred` flag preserved across refreshes.

## Load-bearing requirements (graded highest)
1. **Cache-first reads + background refresh** — list renders from AsyncStorage first, then refreshes from Supabase in the background. Network failure keeps cached data visible; never a blank error screen.
2. **Writes: backend → then cache** — create/edit/complete/delete hit Supabase first; on success update cache + store so the list reflects the change immediately. On failure show error, leave cache untouched. No offline write queue.
3. **Local-only `starred` preserved on refresh** — `starred` stored only locally, never sent to backend. `mergeRemoteTasks` preserves local starred values when remote data arrives.
4. **Filter/sort outside render tree** — pure `selectVisibleTasks(...)` in `selectors.ts`; no `.filter().sort()` in JSX.
5. **Sync status in UI** — last refreshed time, offline indicator, background-refresh loading state.

## Architecture
```
src/
  lib/
    supabase.ts          // client from EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY
    cache.ts             // AsyncStorage read/write of versioned CacheShape
    netinfo.ts           // online/offline subscription (@react-native-community/netinfo)
  features/
    tasks/
      api.ts             // Supabase CRUD -> typed Task/RemoteTask
      store.ts           // Zustand: tasks, categories, syncMeta, actions
      merge.ts           // mergeRemoteTasks(remote, local) — preserves starred
      selectors.ts       // selectVisibleTasks(tasks, filters, sort) — pure
      hooks.ts           // useVisibleTasks(), useDebouncedValue()
      types.ts
    categories/
      api.ts
  screens/
    TaskListScreen.tsx
    TaskDetailScreen.tsx
    CategoriesScreen.tsx
  components/
    TaskListItem.tsx     // memoized, stable
    SyncStatusBar.tsx
  navigation/
    RootNavigator.tsx
```

## Data model
- **Category**: `id (uuid)`, `name (text)`, `created_at`
- **Task (remote)**: `id (uuid)`, `title (text)`, `description (text|null)`, `category_id (uuid|null)`, `status ('open'|'done')`, `due_at (timestamptz|null)`, `created_at`, `updated_at`
- **Task (local)** = RemoteTask + `starred: boolean` (local-only)
- **CacheShape**: `{ version: number, tasks: LocalTask[], categories: Category[], meta: { lastRefreshedAt: string|null } }`

## Merge logic (centerpiece)
```
mergeRemoteTasks(remote, local):
  localStarById = Map(local.map(t => [t.id, t.starred]))
  return remote.map(r => ({ ...r, starred: localStarById.get(r.id) ?? false }))
```
Remote is source of truth for all fields except `starred`. Tasks deleted remotely drop out (not in remote list). New remote tasks default `starred=false`.

## Filter/sort seam
`selectVisibleTasks(tasks, { categoryId, status, search }, { sortBy: 'due'|'created', dir })` — pure, no React. `useVisibleTasks()` wires store + 300ms-debounced search into it.

## State management (Zustand + manual cache)
Chosen for explicit control over cache-first read, background refresh, and starred merge — the exact graded behaviors — and because it's the easiest to point to and explain in the interview. Store hydrates from cache on init, exposes `refresh()` and write actions, holds `syncMeta { lastRefreshedAt, isRefreshing, isOffline, error }`.

## Local storage (AsyncStorage + typed schema)
Chosen for zero native config in Expo Go (trivial for reviewers to run) and sufficient speed for this dataset. Single versioned JSON blob under one key; `version` allows future migration.

## Tests (Jest + RTL, >=3)
1. `selectVisibleTasks` — filter by category/status, search by title, both sorts + direction (required).
2. `mergeRemoteTasks` — starred preserved, new remote defaults false, remote-deleted dropped.
3. `useDebouncedValue` — emits after 300ms, coalesces rapid input (fake timers).

## Env config
`.env`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. `.env.example` committed; `.env` gitignored.

## Explicitly out of scope (task's "stop" list)
Offline write queue, bidirectional sync, conflict resolution, optimistic-updates-with-rollback, auth, deep linking, dark mode, complex animations.

## README sections (required)
Setup · backend schema + seed notes · local storage choice + reasoning · state mgmt choice + reasoning · how starred is preserved · testing approach · known limitations · what I'd do differently with another day · AI usage note.
