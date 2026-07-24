-- Task Manager — schema
-- Run this in the Supabase SQL editor (or `supabase db` / psql) before seeding.

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
-- This assessment has no auth, so we allow the anon role full access. In a real
-- app you would scope these policies to an authenticated user.
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
