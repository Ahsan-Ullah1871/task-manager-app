# Task Manager (React Native · Expo)

A small offline-first task manager: create tasks, assign them to categories, mark
them complete, and browse by category and status. Tasks are readable offline from
a local cache and refresh from Supabase in the background when the device is
online. A per-device **starred** flag is preserved across refreshes.

## Stack

| Concern | Choice |
| --- | --- |
| Runtime | Expo (managed), React Native 0.86, React 19 |
| Language | TypeScript (strict) |
| Navigation | React Navigation (native stack) |
| State | Zustand + a hand-written cache layer |
| Local cache | AsyncStorage (single versioned JSON blob) |
| Backend | Supabase (Postgres + REST) |
| Connectivity | `@react-native-community/netinfo` |
| Tests | Jest (`jest-expo`) + `@testing-library/react-native` |

---

## 1. Setup

### Prerequisites
- Node 18+ and npm
- For native builds: Xcode (iOS) and/or Android Studio + SDK (Android)
- An iOS Simulator / Android emulator, or a physical device

### Install
```bash
npm install
```

### Configure the backend
1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql), then
   [`supabase/seed.sql`](supabase/seed.sql).
3. Copy your project URL and **anon** key from *Project Settings → API*.
4. Create a `.env` file (copy the template):
   ```bash
   cp .env.example .env
   ```
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
   `.env` is gitignored; only `.env.example` is committed. No secrets are
   hardcoded — the app reads `process.env.EXPO_PUBLIC_*` at build time.

### Run

This project uses native builds (the `ios/` and `android/` folders are
committed). Make sure `.env` exists **before** building — Expo bakes
`EXPO_PUBLIC_*` in at build start.

```bash
npm run ios       # build & run the iOS app (or open ios/TaskManager.xcworkspace)
npm run android   # build & run the Android app
```

`npm start` also runs the Metro bundler on its own if you already have a build
installed. Tooling:

```bash
npm test          # run the test suite (18 tests)
npm run typecheck # tsc --noEmit
```

---

## 2. Backend schema and seed data notes

The backend is **Supabase** (Postgres + auto-generated REST API). Two SQL files
drive it, both in the [`supabase/`](supabase) folder:

| File | Purpose |
| --- | --- |
| [`supabase/schema.sql`](supabase/schema.sql) | Creates the tables, indexes, and RLS policies |
| [`supabase/seed.sql`](supabase/seed.sql) | Inserts 3 categories and 8 tasks |

### Setup order (run once, in the Supabase SQL Editor)
1. Run **`schema.sql`** first — it creates the `categories` and `tasks` tables.
2. Run **`seed.sql`** second — it depends on the tables existing.

> Running `seed.sql` before `schema.sql` fails with
> `relation "public.categories" does not exist` — the tables must exist first.

### Table: `categories`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, `default gen_random_uuid()` |
| `name` | `text` | Not null |
| `created_at` | `timestamptz` | Not null, `default now()` |

### Table: `tasks`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, `default gen_random_uuid()` |
| `title` | `text` | Not null |
| `description` | `text` | Nullable |
| `category_id` | `uuid` | FK → `categories(id)`, `on delete set null` |
| `status` | `text` | Not null, `default 'open'`, `check (status in ('open','done'))` |
| `due_at` | `timestamptz` | Nullable (undated tasks are allowed) |
| `created_at` | `timestamptz` | Not null, `default now()` |
| `updated_at` | `timestamptz` | Not null, `default now()` |

Indexes exist on `category_id`, `status`, and `created_at desc` to support the
list's filter/sort.

**No `starred` column exists by design.** The `starred` flag is per-device and
lives only in the local cache — it is never sent to or read from the backend, so
it cannot be clobbered by a refresh (see §5).

### Row Level Security
RLS is **enabled** on both tables, with a permissive policy granting the `anon`
role full access. This is intentional because the assessment has **no auth**
(§8) — the app talks to Supabase with the anon key only. In a real app these
policies would be scoped to the authenticated user.

### Seed data
[`supabase/seed.sql`](supabase/seed.sql) inserts:

- **3 categories**: Work, Personal, Groceries (fixed UUIDs so tasks can reference them).
- **8 tasks** across all three categories, mixing:
  - both statuses (`open` and `done`),
  - tasks **with** due dates and tasks **without** (a deliberate null `due_at`),
    so due-date sorting is exercised against the "undated tasks sort last" rule.

The committed `seed.sql` begins with `truncate ... cascade` so it is safe to
re-run on an existing database. For a brand-new, empty database you can also run
the plain `insert` statements without the truncate.

### Full SQL — schema (`supabase/schema.sql`)

```sql
-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Categories -----------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- Tasks ----------------------------------------------------------------------
-- Note: there is deliberately NO `starred` column. That flag is device-local
-- and lives only in the app's cache, never in the backend.
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  status      text not null default 'open' check (status in ('open', 'done')),
  due_at      timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_category_id_idx on public.tasks(category_id);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_created_at_idx on public.tasks(created_at desc);

-- Row Level Security ---------------------------------------------------------
-- No auth in this assessment, so allow the anon role full access. In a real app
-- these policies would be scoped to an authenticated user.
alter table public.categories enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "anon full access categories" on public.categories;
create policy "anon full access categories"
  on public.categories for all
  to anon
  using (true)
  with check (true);

drop policy if exists "anon full access tasks" on public.tasks;
create policy "anon full access tasks"
  on public.tasks for all
  to anon
  using (true)
  with check (true);
```

### Full SQL — seed (`supabase/seed.sql`)

```sql
-- Run after schema.sql. Safe to re-run: it clears existing rows first.
truncate table public.tasks restart identity cascade;
truncate table public.categories restart identity cascade;

-- Categories -----------------------------------------------------------------
insert into public.categories (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Work'),
  ('22222222-2222-2222-2222-222222222222', 'Personal'),
  ('33333333-3333-3333-3333-333333333333', 'Groceries');

-- Tasks (8 rows: both statuses, some with due dates and some without) --------
insert into public.tasks (title, description, category_id, status, due_at) values
  ('Finish assessment README', 'Document setup, schema, and decisions.',
   '11111111-1111-1111-1111-111111111111', 'open',  now() + interval '1 day'),
  ('Review pull requests', 'Two PRs waiting on review.',
   '11111111-1111-1111-1111-111111111111', 'open',  now() + interval '2 days'),
  ('Deploy staging build', null,
   '11111111-1111-1111-1111-111111111111', 'done',  now() - interval '1 day'),
  ('Book dentist appointment', 'Overdue for a cleaning.',
   '22222222-2222-2222-2222-222222222222', 'open',  now() + interval '5 days'),
  ('Call the bank', 'Ask about the statement charge.',
   '22222222-2222-2222-2222-222222222222', 'open',  null),
  ('Renew gym membership', null,
   '22222222-2222-2222-2222-222222222222', 'done',  now() - interval '3 days'),
  ('Buy milk and eggs', 'Also oats if they have them.',
   '33333333-3333-3333-3333-333333333333', 'open',  now() + interval '1 day'),
  ('Order coffee beans', 'Running low.',
   '33333333-3333-3333-3333-333333333333', 'open',  now() + interval '4 days');
```

---

## 3. Local storage choice — AsyncStorage

I chose **AsyncStorage** with a typed, versioned schema. For this dataset (single
digits to low hundreds of tasks) a key/value store holding one JSON document is
more than fast enough, and it needs **zero native configuration**, so the project
runs in plain Expo Go — the lowest possible bar for a reviewer to run it. The
whole cache is one blob under one key (`taskmanager.cache.v1`), which keeps reads
and writes atomic and makes migrations explicit via the `version` field
([`src/lib/cache.ts`](src/lib/cache.ts)). MMKV would be faster but needs a dev
build; SQLite would be more powerful but is overkill for ~8 rows and adds query
code without buying anything here.

---

## 4. State management choice — Zustand + manual cache

I chose **Zustand** with a small hand-written cache layer rather than TanStack
Query. The three graded behaviors — cache-first read, background refresh, and the
local-only `starred` merge — are exactly the things I wanted explicit, readable
control over. TanStack Query gives cache-first/background-refresh almost for free,
but the local-field merge fights its cache model and would need a bespoke
select/merge seam that is harder to explain than to just write. Zustand keeps the
store tiny and the data flow obvious: the store hydrates from cache, exposes
`refresh()` and write actions, and holds a `sync` block
(`lastRefreshedAt / isRefreshing / isOffline / error`) that the UI renders
directly ([`src/features/tasks/store.ts`](src/features/tasks/store.ts)). Redux
Toolkit would add boilerplate this scope doesn't warrant.

---

## 5. How `starred` is preserved across a refresh

`starred` is stored **only** in the local cache and is never sent to or read from
Supabase (the API layer doesn't even select the column). When a background
refresh pulls fresh tasks, `mergeRemoteTasks`
([`src/features/tasks/merge.ts`](src/features/tasks/merge.ts)) treats remote as
the source of truth for every backend field, then re-applies the local `starred`
value by id:

```ts
const starredById = new Map(local.map((t) => [t.id, t.starred]));
return remote.map((t) => ({ ...t, starred: starredById.get(t.id) ?? false }));
```

New remote tasks default to `false`; tasks deleted remotely simply fall out of the
list. This is a pure function with direct unit tests
([`merge.test.ts`](src/features/tasks/__tests__/merge.test.ts)) — the fastest way
to know if it ever breaks.

## Where filter/sort lives

Filtering and sorting are a pure function, `selectVisibleTasks`
([`src/features/tasks/selectors.ts`](src/features/tasks/selectors.ts)), wired into
the screen through `useVisibleTasks`
([`src/features/tasks/hooks.ts`](src/features/tasks/hooks.ts)). There are **no
`.filter().sort()` chains in JSX**. Undated tasks always sort last so they don't
crowd the top of a due-date sort.

## Sync status & search

The [`SyncStatusBar`](src/components/SyncStatusBar.tsx) shows last-refreshed time,
an offline indicator, and a spinner during background refresh. Search is
debounced 300 ms via [`useDebouncedValue`](src/lib/useDebouncedValue.ts) so
filtering runs on a settled term rather than on every keystroke.

---

## 6. Testing approach

Three suites, 18 cases, all runnable without a device or network:

1. **`selectVisibleTasks`** ([selectors.test.ts](src/features/tasks/__tests__/selectors.test.ts))
   — the required filter/sort coverage: category, status, case-insensitive title
   search, combined filters, both sort keys and directions, undated-last
   behavior, and no input mutation.
2. **`mergeRemoteTasks`** ([merge.test.ts](src/features/tasks/__tests__/merge.test.ts))
   — the load-bearing local-field preservation: starred kept, new tasks default
   false, remote-deleted dropped, remote wins on backend fields.
3. **`useDebouncedValue`** ([useDebouncedValue.test.ts](src/lib/__tests__/useDebouncedValue.test.ts))
   — emits only after 300 ms and coalesces rapid input (fake timers).

I focused tests on the **pure logic that is easy to get subtly wrong** (merge and
sort) rather than on wiring, because that's where correctness bugs actually hide
and where a regression would be silent.

---

## 7. Data flow summary

- **Open app**: `App` hydrates the store from AsyncStorage → list renders from
  cache immediately (works fully offline). Then `TaskList` fires a background
  `refresh()`.
- **Refresh**: fetch tasks + categories → `mergeRemoteTasks` → update store →
  persist cache → stamp `lastRefreshedAt`. On failure, cached data stays on
  screen and an error/offline state is surfaced — never a blank screen.
- **Writes (create/edit/complete/delete)**: sent to Supabase **first**; on success
  the store and cache are updated so the list reflects the change immediately; on
  failure an alert is shown and the cache is left untouched. No offline write
  queue.
- **Star**: local-only toggle — flips the flag and re-persists the cache, never
  hitting the backend.

---

## 8. Known limitations

- **Writes require connectivity** (by design — no offline write queue). A failed
  write surfaces an error and changes nothing.
- **No optimistic UI / rollback** (explicitly out of scope). Writes show a brief
  saving state and the list updates after the backend confirms.
- **Refresh is manual/on-mount + pull-to-refresh**, not real-time. No Supabase
  realtime subscriptions.
- **Categories are add + view only** (rename/delete were optional and skipped to
  stay in scope).
- **Permissive RLS** for the anon role, since there's no auth.
- **Cache is a single blob** — fine at this scale, but a large list would rewrite
  the whole document on each mutation.

---

## 9. What I'd do differently with another day

- Add a proper date picker for due dates instead of quick-choice chips.
- Add a lightweight integration test around the store's `refresh` + `createTask`
  paths with a mocked Supabase client and a mocked AsyncStorage.
- Persist filter/sort preferences and add a "Starred only" filter.
- Move the cache to per-entity keys (or SQLite) so large lists don't rewrite one
  blob, and add pull-to-refresh error toasts.
- Extract a small design-token layer instead of inline style objects.

---

## 10. AI usage

I wrote the application code myself — the architecture, the data flow, and the
load-bearing logic (the cache/merge seam, the pure filter/sort selector, the
Zustand store, and the choice of Zustand over TanStack Query) are my own
decisions and implementation.

I used AI in a few focused places:

- **Code review** — as a second pair of eyes to sanity-check the `starred` merge,
  the cache read/write, and the write-then-cache flow for edge cases I might have
  missed.
- **Database schema** — to review and harden the SQL: confirming sensible column
  types, the `on delete set null` FK behavior, the `status` check constraint, the
  supporting indexes, and the RLS policies, so the schema is solid.
- **Seed data** — to generate realistic sample data (the 3 categories and 8
  tasks) that deliberately covers both statuses and mixes tasks with and without
  due dates, so the filter/sort paths are meaningfully exercised.
- **This README** — to help structure and phrase the write-up so each required
  section is covered clearly.

Everything was verified by hand: `npm test` (18 tests) and `npm run typecheck`
both pass.

---

## Project structure

```
src/
  lib/
    supabase.ts          Supabase client from env
    cache.ts             AsyncStorage read/write of the versioned cache
    netinfo.ts           connectivity subscription
    useDebouncedValue.ts generic debounce hook
    format.ts            date / "time ago" helpers
  features/
    tasks/
      api.ts             Supabase CRUD
      store.ts           Zustand store + cache orchestration
      merge.ts           mergeRemoteTasks — preserves starred
      selectors.ts       selectVisibleTasks — pure filter/sort
      hooks.ts           useVisibleTasks, useDebouncedValue re-export
      types.ts
      __tests__/
    categories/
      api.ts
  components/            TaskListItem, TaskListControls, TaskFormModal, SyncStatusBar
  screens/               TaskList, TaskDetail, Categories
  navigation/            RootNavigator + param types
supabase/                schema.sql, seed.sql
```
