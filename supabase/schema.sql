-- ============================================================
-- 3ToDoList — Database schema
-- Run this once in the new Supabase project's SQL Editor
-- ============================================================

-- ── PROFILES ──────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  onesignal_player_id text,
  morning_time varchar(5) default '08:00',
  evening_time varchar(5) default '20:00',
  notifications_enabled boolean default true,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- ── TASKS ─────────────────────────────────────────────────
create table public.tasks (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  created_at date not null default current_date,
  completed_at date,
  days_to_complete integer,
  inserted_at timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "tasks_select_own"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "tasks_insert_own"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "tasks_update_own"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "tasks_delete_own"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- ============================================================
-- NOTE: No auth trigger for profile creation.
-- The app (src/pages/Login.jsx) inserts the profiles row itself
-- right after supabase.auth.signUp(), so a DB trigger that also
-- creates a row would cause a duplicate-key error on every signup.
-- ============================================================
