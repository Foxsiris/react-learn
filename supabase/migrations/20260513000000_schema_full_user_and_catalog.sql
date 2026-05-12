-- =========================================================================
-- React Learn — full schema migration: user-scoped state + catalog tables.
-- =========================================================================

-- ---- 1) topic_groups (public read) --------------------------------------
create table if not exists public.topic_groups (
  id           text primary key,
  title        text not null,
  emoji        text,
  description  text,
  order_index  integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.topic_groups enable row level security;

drop policy if exists topic_groups_public_read on public.topic_groups;
create policy topic_groups_public_read on public.topic_groups
  for select using (true);

-- ---- 2) topics (public read; content metadata only, no theory/examples) -
create table if not exists public.topics (
  id            text primary key,
  group_id      text not null references public.topic_groups(id) on delete cascade,
  title         text not null,
  description   text,
  order_index   integer not null default 0,
  example_count integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists topics_group_order_idx
  on public.topics (group_id, order_index);

alter table public.topics enable row level security;

drop policy if exists topics_public_read on public.topics;
create policy topics_public_read on public.topics
  for select using (true);

-- ---- 3) user_progress (replaces topic_progress; scoped by user_id) ------
create table if not exists public.user_progress (
  user_id    uuid not null references auth.users(id) on delete cascade,
  topic_id   text not null,
  status     text not null check (status in ('done','review','skip','todo')),
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create index if not exists user_progress_user_updated_idx
  on public.user_progress (user_id, updated_at desc);

alter table public.user_progress enable row level security;

drop policy if exists user_progress_own_select on public.user_progress;
drop policy if exists user_progress_own_insert on public.user_progress;
drop policy if exists user_progress_own_update on public.user_progress;
drop policy if exists user_progress_own_delete on public.user_progress;

create policy user_progress_own_select on public.user_progress
  for select using (auth.uid() = user_id);
create policy user_progress_own_insert on public.user_progress
  for insert with check (auth.uid() = user_id);
create policy user_progress_own_update on public.user_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_progress_own_delete on public.user_progress
  for delete using (auth.uid() = user_id);

-- ---- 4) user_preferences (replaces localStorage 'react-learn:tweaks') ---
create table if not exists public.user_preferences (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  accent_color       text not null default 'terracotta',
  animations_enabled boolean not null default true,
  updated_at         timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists user_preferences_own_select on public.user_preferences;
drop policy if exists user_preferences_own_insert on public.user_preferences;
drop policy if exists user_preferences_own_update on public.user_preferences;

create policy user_preferences_own_select on public.user_preferences
  for select using (auth.uid() = user_id);
create policy user_preferences_own_insert on public.user_preferences
  for insert with check (auth.uid() = user_id);
create policy user_preferences_own_update on public.user_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- 5) user_profile (replaces hardcoded src/lib/user.ts) ---------------
create table if not exists public.user_profile (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  handle       text,
  joined_at    timestamptz not null default now()
);

alter table public.user_profile enable row level security;

drop policy if exists user_profile_own_select on public.user_profile;
drop policy if exists user_profile_own_insert on public.user_profile;
drop policy if exists user_profile_own_update on public.user_profile;

create policy user_profile_own_select on public.user_profile
  for select using (auth.uid() = user_id);
create policy user_profile_own_insert on public.user_profile
  for insert with check (auth.uid() = user_id);
create policy user_profile_own_update on public.user_profile
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- 6) user_achievements (only the unlock fact; defs stay in code) -----
create table if not exists public.user_achievements (
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

drop policy if exists user_achievements_own_select on public.user_achievements;
drop policy if exists user_achievements_own_insert on public.user_achievements;
drop policy if exists user_achievements_own_delete on public.user_achievements;

create policy user_achievements_own_select on public.user_achievements
  for select using (auth.uid() = user_id);
create policy user_achievements_own_insert on public.user_achievements
  for insert with check (auth.uid() = user_id);
create policy user_achievements_own_delete on public.user_achievements
  for delete using (auth.uid() = user_id);

-- ---- 7) Drop the legacy single-tenant table ------------------------------
-- The old public.topic_progress had no user_id and a permissive RLS policy.
-- Its 5 rows were anonymous and cannot be safely attributed to a user, so
-- we drop the table. The app's one-time client-side migration (see
-- useProgress.ts) handles any leftover localStorage entries on first login.
drop table if exists public.topic_progress;
