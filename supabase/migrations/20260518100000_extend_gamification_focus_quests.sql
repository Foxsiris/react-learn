-- =========================================================================
-- Extension: gamification (hearts, daily quests), pomodoro focus, track meta
-- Single-tenant (one owner). RLS permissive on every new table.
-- =========================================================================

-- ---- 1) topic_groups: add color/glyph/short to render as a "track" ------
alter table public.topic_groups add column if not exists color      text;
alter table public.topic_groups add column if not exists color_soft text;
alter table public.topic_groups add column if not exists short      text;

-- ---- 2) user_preferences: dashboard layout switch ----------------------
alter table public.user_preferences
  add column if not exists dashboard_layout text not null default 'balanced'
  check (dashboard_layout in ('balanced', 'focus', 'compact'));

-- ---- 3) user_state: hearts, regen clock, longest streak ----------------
create table if not exists public.user_state (
  user_id            uuid primary key default '00000000-0000-0000-0000-000000000001',
  hearts             integer not null default 5,
  hearts_max         integer not null default 5,
  hearts_updated_at  timestamptz not null default now(),
  longest_streak     integer not null default 0,
  updated_at         timestamptz not null default now()
);

alter table public.user_state enable row level security;
drop policy if exists user_state_all on public.user_state;
create policy user_state_all on public.user_state for all using (true) with check (true);

-- ---- 4) daily_quests: per-day quest state ------------------------------
create table if not exists public.daily_quests (
  user_id     uuid not null default '00000000-0000-0000-0000-000000000001',
  day         date not null,
  quest_id    text not null,
  progress    integer not null default 0,
  target      integer not null default 1,
  xp          integer not null default 0,
  completed   boolean not null default false,
  completed_at timestamptz,
  primary key (user_id, day, quest_id)
);

create index if not exists daily_quests_user_day_idx
  on public.daily_quests (user_id, day desc);

alter table public.daily_quests enable row level security;
drop policy if exists daily_quests_all on public.daily_quests;
create policy daily_quests_all on public.daily_quests for all using (true) with check (true);

-- ---- 5) focus_settings: per-user pomodoro config -----------------------
create table if not exists public.focus_settings (
  user_id              uuid primary key default '00000000-0000-0000-0000-000000000001',
  work_seconds         integer not null default 1500,
  short_seconds        integer not null default 300,
  long_seconds         integer not null default 900,
  cycles_before_long   integer not null default 4,
  auto_break           boolean not null default true,
  sound                boolean not null default true,
  updated_at           timestamptz not null default now()
);

alter table public.focus_settings enable row level security;
drop policy if exists focus_settings_all on public.focus_settings;
create policy focus_settings_all on public.focus_settings for all using (true) with check (true);

-- ---- 6) focus_sessions: each completed pomodoro phase ------------------
create table if not exists public.focus_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default '00000000-0000-0000-0000-000000000001',
  started_at       timestamptz not null default now(),
  ended_at         timestamptz not null default now(),
  duration_seconds integer not null,
  phase            text not null check (phase in ('work', 'short', 'long')),
  group_id         text references public.topic_groups(id) on delete set null,
  topic_id         text,
  topic_label      text,
  completed        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists focus_sessions_user_started_idx
  on public.focus_sessions (user_id, started_at desc);
create index if not exists focus_sessions_group_idx
  on public.focus_sessions (user_id, group_id);

alter table public.focus_sessions enable row level security;
drop policy if exists focus_sessions_all on public.focus_sessions;
create policy focus_sessions_all on public.focus_sessions for all using (true) with check (true);

-- ---- 7) Helper view: per-track work hours ------------------------------
create or replace view public.track_focus_hours as
select
  coalesce(group_id, '__none__') as group_id,
  sum(duration_seconds) / 3600.0 as hours,
  count(*) as session_count
from public.focus_sessions
where phase = 'work'
group by group_id;

-- ---- 8) Seed track colors ---------------------------------------------
update public.topic_groups set color = '#e85a2b', color_soft = '#fbe7dc', short = 'React'   where id = 'react';
update public.topic_groups set color = '#3f8a5e', color_soft = '#d8ead9', short = 'Алго'    where id = 'algorithms';
update public.topic_groups set color = '#5b6cff', color_soft = '#dfe3ff', short = 'Design'  where id = 'system-design';
update public.topic_groups set color = '#9b4faa', color_soft = '#ecd7f0', short = 'LeetCode' where id = 'leetcode';
