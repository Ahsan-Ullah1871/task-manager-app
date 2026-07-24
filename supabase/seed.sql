-- Task Manager — seed data (3 categories, 8 tasks)
-- Run after schema.sql. Safe to re-run: it clears existing rows first.

truncate table public.tasks restart identity cascade;
truncate table public.categories restart identity cascade;

-- Categories -----------------------------------------------------------------
insert into public.categories (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Work'),
  ('22222222-2222-2222-2222-222222222222', 'Personal'),
  ('33333333-3333-3333-3333-333333333333', 'Groceries');

-- Tasks ----------------------------------------------------------------------
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
