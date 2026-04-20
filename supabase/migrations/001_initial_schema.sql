-- ============================================================
-- ExamSeat Monitor V1 — Initial Schema
-- Run in Supabase SQL Editor or via supabase db push
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- profiles
-- Extends auth.users. Created automatically via trigger on signup.
-- ────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  email        text        not null,
  display_name text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile row on every new Supabase Auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- monitoring_rules
-- ────────────────────────────────────────────────────────────
create table public.monitoring_rules (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  platform_id     text        not null,
  exam_type       text        not null,
  city            text,
  date_preference text        default 'any',
  channels        text[]      not null default array['browser','email'],
  priority        integer     not null default 1,
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index monitoring_rules_user_id_idx     on public.monitoring_rules (user_id);
create index monitoring_rules_platform_id_idx on public.monitoring_rules (platform_id);

alter table public.monitoring_rules enable row level security;

create policy "Users can manage own rules"
  on public.monitoring_rules for all
  using (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- seat_observations
-- Raw scraped observations — system-wide, no per-user data.
-- Written by service role; readable by all authenticated users.
-- ────────────────────────────────────────────────────────────
create table public.seat_observations (
  id                  uuid        primary key default gen_random_uuid(),
  platform_id         text        not null,
  center_name         text        not null,
  city                text        not null,
  province            text,
  exam_type           text        not null,
  session_label       text,
  session_date        date,
  availability_status text        not null,  -- OPEN | SOLD_OUT | EXPECTED | MONITORING | UNKNOWN
  seats_text          text,
  source_url          text        not null,
  source_hash         text,                  -- SHA-256(relevant section)[:16] — for change detection
  confidence          numeric(4,3),
  observed_at         timestamptz not null default now()
);

create index seat_observations_platform_idx on public.seat_observations (platform_id, observed_at desc);

alter table public.seat_observations enable row level security;

-- Authenticated users can read observations
create policy "Authenticated users can read observations"
  on public.seat_observations for select
  using (auth.role() = 'authenticated');

-- Service role inserts via API route (bypasses RLS by default)


-- ────────────────────────────────────────────────────────────
-- change_events
-- Derived when availability_status changes between observations.
-- ────────────────────────────────────────────────────────────
create table public.change_events (
  id                  uuid        primary key default gen_random_uuid(),
  platform_id         text        not null,
  exam_type           text        not null,
  city                text        not null,
  center_name         text        not null,
  previous_status     text,
  new_status          text        not null,
  event_type          text        not null,  -- OPENED | SOLD_OUT | DATE_ADDED | STATUS_CHANGED | UNKNOWN_CHANGE
  detected_at         timestamptz not null default now(),
  confidence          numeric(4,3),
  raw_observation_id  uuid        references public.seat_observations(id) on delete set null,
  official_url        text
);

create index change_events_platform_idx  on public.change_events (platform_id, detected_at desc);
create index change_events_detected_idx  on public.change_events (detected_at desc);

alter table public.change_events enable row level security;

create policy "Authenticated users can read change events"
  on public.change_events for select
  using (auth.role() = 'authenticated');


-- ────────────────────────────────────────────────────────────
-- notification_deliveries
-- Per-user delivery records.
-- ────────────────────────────────────────────────────────────
create table public.notification_deliveries (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  change_event_id  uuid        not null references public.change_events(id) on delete cascade,
  rule_id          uuid        references public.monitoring_rules(id) on delete set null,
  channel          text        not null,   -- browser | email
  status           text        not null default 'pending',  -- pending | sent | failed
  sent_at          timestamptz,
  is_viewed        boolean     not null default false,
  viewed_at        timestamptz,
  created_at       timestamptz not null default now()
);

create index notification_deliveries_user_idx   on public.notification_deliveries (user_id, created_at desc);
create index notification_deliveries_event_idx  on public.notification_deliveries (change_event_id);

alter table public.notification_deliveries enable row level security;

create policy "Users can read own notifications"
  on public.notification_deliveries for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notification_deliveries for update
  using (auth.uid() = user_id);
