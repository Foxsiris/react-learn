-- =========================================================================
-- Single-tenant migration: this app is personal — one owner, no auth.
--
-- The previous schema scoped every table by auth.users and relied on
-- anonymous sign-ins, which are disabled on this project. Instead of
-- authenticating, the client now writes everything under one fixed owner id
-- (see src/lib/owner.ts). This removes the auth.users dependency and the
-- per-user RLS policies.
--
-- Trade-off: with the public publishable key and permissive RLS, anyone who
-- knows the project URL can read/write these tables. That is acceptable here
-- because this is a personal learning tracker with no sensitive data.
-- =========================================================================

-- ---- 1) Drop the foreign keys to auth.users ----------------------------
alter table public.user_progress     drop constraint if exists user_progress_user_id_fkey;
alter table public.user_preferences  drop constraint if exists user_preferences_user_id_fkey;
alter table public.user_profile      drop constraint if exists user_profile_user_id_fkey;
alter table public.user_achievements drop constraint if exists user_achievements_user_id_fkey;

-- ---- 2) Default user_id to the fixed owner id --------------------------
alter table public.user_progress     alter column user_id set default '00000000-0000-0000-0000-000000000001';
alter table public.user_preferences  alter column user_id set default '00000000-0000-0000-0000-000000000001';
alter table public.user_profile      alter column user_id set default '00000000-0000-0000-0000-000000000001';
alter table public.user_achievements alter column user_id set default '00000000-0000-0000-0000-000000000001';

-- ---- 3) Replace per-user RLS with permissive policies ------------------
drop policy if exists user_progress_own_select on public.user_progress;
drop policy if exists user_progress_own_insert on public.user_progress;
drop policy if exists user_progress_own_update on public.user_progress;
drop policy if exists user_progress_own_delete on public.user_progress;
drop policy if exists user_progress_all on public.user_progress;
create policy user_progress_all on public.user_progress
  for all using (true) with check (true);

drop policy if exists user_preferences_own_select on public.user_preferences;
drop policy if exists user_preferences_own_insert on public.user_preferences;
drop policy if exists user_preferences_own_update on public.user_preferences;
drop policy if exists user_preferences_all on public.user_preferences;
create policy user_preferences_all on public.user_preferences
  for all using (true) with check (true);

drop policy if exists user_profile_own_select on public.user_profile;
drop policy if exists user_profile_own_insert on public.user_profile;
drop policy if exists user_profile_own_update on public.user_profile;
drop policy if exists user_profile_all on public.user_profile;
create policy user_profile_all on public.user_profile
  for all using (true) with check (true);

drop policy if exists user_achievements_own_select on public.user_achievements;
drop policy if exists user_achievements_own_insert on public.user_achievements;
drop policy if exists user_achievements_own_delete on public.user_achievements;
drop policy if exists user_achievements_all on public.user_achievements;
create policy user_achievements_all on public.user_achievements
  for all using (true) with check (true);
