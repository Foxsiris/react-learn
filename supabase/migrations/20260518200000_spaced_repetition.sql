-- Spaced repetition: each review-marked topic gets a due date and a step.
-- Step advances 1→3→7→14 on correct recall, resets to 1 on miss.
alter table public.user_progress
  add column if not exists review_interval_days integer not null default 1,
  add column if not exists next_review_at       timestamptz;

create index if not exists user_progress_review_due_idx
  on public.user_progress (user_id, next_review_at)
  where next_review_at is not null;
