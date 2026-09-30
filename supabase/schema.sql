-- Zetdle account history.
--
-- Paste this whole file into the Supabase SQL editor and run it once.
-- One row per player per puzzle date, holding that day's best run.

create table public.daily_results (
  -- Defaulted so the client never has to know its own id, but still sent
  -- explicitly by the app and still checked by the policies below.
  user_id     uuid        not null default auth.uid()
                          references auth.users (id) on delete cascade,
  puzzle_date date        not null,

  -- score is the number of correct answers. total_ms is the sum of the
  -- per-answer times, which is what ties are broken on. The average seconds
  -- shown on screen is derived from these two, never stored.
  score       smallint    not null,
  total_ms    integer     not null,

  -- How many rounds were played that day. Nothing reads it; it is one line of
  -- trigger code and it tells you whether people replay.
  attempts    smallint    not null default 1,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  primary key (user_id, puzzle_date),

  -- Plausibility bounds. These do NOT prevent cheating - see the README - they
  -- just stop a forgery or a bug from writing outright nonsense.
  constraint daily_results_score_range
    check (score >= 0 and score <= 300),
  constraint daily_results_total_ms_range
    check (total_ms >= 0 and total_ms <= 130000),
  constraint daily_results_pace_plausible
    check (
      (score = 0 and total_ms = 0)
      or (score > 0 and total_ms >= score * 250)
    ),
  constraint daily_results_after_launch
    check (puzzle_date >= date '2026-09-22')
);

-- Keep the best run of the day, enforced here rather than in the browser so a
-- replay can never regress a score even via a direct API call. This is the
-- same rule as isBetterRun() in src/lib/storage.ts.
create or replace function public.daily_results_keep_best()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  kept public.daily_results;
begin
  if tg_op = 'INSERT' then
    new.attempts   := 1;
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  -- More correct answers wins; on a tie the quicker run wins. Two runs of
  -- nothing are never "better" than each other.
  if new.score > old.score
     or (new.score = old.score and new.score > 0 and new.total_ms < old.total_ms)
  then
    new.attempts   := old.attempts + 1;
    new.created_at := old.created_at;
    new.updated_at := now();
    return new;
  end if;

  -- Worse or equal: keep what is stored, just count the attempt.
  kept            := old;
  kept.attempts   := old.attempts + 1;
  kept.updated_at := now();
  return kept;
end;
$$;

create trigger daily_results_keep_best
  before insert or update on public.daily_results
  for each row execute function public.daily_results_keep_best();

-- Row-level security. Without these policies nothing is readable or writable
-- at all, and signed-out visitors get nothing whatsoever.
alter table public.daily_results enable row level security;

create policy "read own results"
  on public.daily_results for select
  to authenticated
  using (user_id = auth.uid());

create policy "insert own results"
  on public.daily_results for insert
  to authenticated
  with check (
    user_id = auth.uid()
    -- No writing tomorrow's puzzle. This lives in the policy rather than a
    -- CHECK constraint because CHECK expressions must be immutable, and
    -- now() is not.
    and puzzle_date <= (now() at time zone 'Asia/Singapore')::date
  );

-- Needed as well as the INSERT policy: an upsert is checked against both.
-- Leaving this out is the classic "works the first time, 403 on the replay".
create policy "update own results"
  on public.daily_results for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and puzzle_date <= (now() at time zone 'Asia/Singapore')::date
  );

-- Deliberately no delete policy: history is append-only from the browser.
-- Deleting the auth user cascades and removes everything.
