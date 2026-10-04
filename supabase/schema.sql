-- =====================================================================
-- Expense Tracker — Supabase schema
-- Run this whole file once in Supabase: Dashboard -> SQL Editor -> New query.
--
-- Design notes
-- * Row ids are generated on the phone (UUIDs, or fixed ids like
--   'default-food' for built-in categories), so the primary key is
--   (user_id, id): every user gets their own copy of the default categories.
-- * created_at / updated_at / deleted_at are ISO-8601 text written by the
--   app, so they round-trip exactly and "last write wins" compares them.
-- * server_updated_at is set by the database on every insert/update. The
--   app downloads rows changed since its last pull using this column, which
--   is immune to phone clocks being wrong.
-- * Deletes are soft (deleted_at is set) so they sync between devices.
-- * Money is stored as integer paisa (bigint), never as floating point.
-- =====================================================================

-- ---------- Tables ----------

create table if not exists public.categories (
  user_id           uuid        not null references auth.users (id) on delete cascade,
  id                text        not null,
  name              text        not null check (char_length(name) between 1 and 60),
  icon              text        not null,
  color             text        not null,
  monthly_budget    bigint      check (monthly_budget is null or monthly_budget >= 0),
  is_default        smallint    not null default 0,
  created_at        text        not null,
  updated_at        text        not null,
  deleted_at        text,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.expenses (
  user_id             uuid        not null references auth.users (id) on delete cascade,
  id                  text        not null,
  amount              bigint      not null check (amount >= 0),
  category_id         text        not null,
  date                text        not null,           -- 'YYYY-MM-DD'
  note                text        not null default '',
  is_recurring        smallint    not null default 0,
  recurring_day       smallint    check (recurring_day is null or recurring_day between 1 and 31),
  recurring_source_id text,
  created_at          text        not null,
  updated_at          text        not null,
  deleted_at          text,
  server_updated_at   timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists categories_user_server_updated_idx
  on public.categories (user_id, server_updated_at);
create index if not exists expenses_user_server_updated_idx
  on public.expenses (user_id, server_updated_at);

-- ---------- Keep server_updated_at fresh ----------

create or replace function public.set_server_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.server_updated_at := now();
  return new;
end;
$$;

drop trigger if exists categories_set_server_updated_at on public.categories;
create trigger categories_set_server_updated_at
  before insert or update on public.categories
  for each row execute function public.set_server_updated_at();

drop trigger if exists expenses_set_server_updated_at on public.expenses;
create trigger expenses_set_server_updated_at
  before insert or update on public.expenses
  for each row execute function public.set_server_updated_at();

-- ---------- Row Level Security: users can only touch their own rows ----------

alter table public.categories enable row level security;
alter table public.expenses   enable row level security;

drop policy if exists "categories_select_own" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;

create policy "categories_select_own" on public.categories
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "categories_insert_own" on public.categories
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "categories_update_own" on public.categories
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "categories_delete_own" on public.categories
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "expenses_select_own" on public.expenses;
drop policy if exists "expenses_insert_own" on public.expenses;
drop policy if exists "expenses_update_own" on public.expenses;
drop policy if exists "expenses_delete_own" on public.expenses;

create policy "expenses_select_own" on public.expenses
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "expenses_insert_own" on public.expenses
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "expenses_update_own" on public.expenses
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "expenses_delete_own" on public.expenses
  for delete to authenticated using ((select auth.uid()) = user_id);
