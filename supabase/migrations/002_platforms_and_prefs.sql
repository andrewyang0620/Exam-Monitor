-- ============================================================
-- ExamSeat Monitor V1 — Migration 002
-- Adds: platforms, user_preferences
-- Seeds: Alliance Française Vancouver (first real platform)
-- Run in Supabase SQL Editor after 001_initial_schema.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- platforms
-- System-wide registry of monitored exam centers.
-- Publicly readable (no auth required).
-- Written by service role only.
-- ────────────────────────────────────────────────────────────
create table public.platforms (
  id                   text        primary key,
  display_name         text        not null,
  city                 text        not null,
  province             text        not null,
  country              text        not null default 'CA',
  exam_types_supported text[]      not null default '{}',
  entry_url            text        not null,
  detection_url        text        not null,
  registration_url     text,
  health_status        text        not null default 'unknown',   -- operational | degraded | down | unknown
  monitoring_level     text        not null default 'partial',  -- full | partial | limited | none
  detection_mode       text        not null default 'html',     -- html | json-xhr | eventbrite-link | manual-only
  autofill_supported   boolean     not null default false,
  polling_interval_s   integer     not null default 300,
  last_health_check    timestamptz,
  is_active            boolean     not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.platforms enable row level security;

create policy "Anyone can read platforms"
  on public.platforms for select
  using (true);

-- ────────────────────────────────────────────────────────────
-- Seed: Alliance Française Vancouver
-- The only real platform in V1.
-- All other centers remain mock/static on the frontend.
-- ────────────────────────────────────────────────────────────
insert into public.platforms (
  id,
  display_name,
  city,
  province,
  exam_types_supported,
  entry_url,
  detection_url,
  registration_url,
  health_status,
  monitoring_level,
  detection_mode,
  autofill_supported,
  polling_interval_s
) values (
  'af-vancouver',
  'Alliance Française de Vancouver',
  'Vancouver',
  'BC',
  array['TCF Canada'],
  'https://www.alliancefrancaise.ca/products/categories/exams-and-tests/tcf-canada/',
  'https://www.alliancefrancaise.ca/en/language/exams/tcf-canada/',
  'https://www.alliancefrancaise.ca/products/categories/exams-and-tests/tcf-canada/',
  'operational',
  'full',
  'html',
  true,
  300
);


-- ────────────────────────────────────────────────────────────
-- user_preferences
-- Per-user notification and display settings.
-- Created lazily on first dashboard load.
-- ────────────────────────────────────────────────────────────
create table public.user_preferences (
  user_id          uuid        primary key references public.profiles(id) on delete cascade,
  notify_browser   boolean     not null default true,
  notify_email     boolean     not null default true,
  notify_sms       boolean     not null default false,
  cooldown_minutes integer     not null default 60,
  timezone         text        not null default 'America/Vancouver',
  language         text        not null default 'en',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can read own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);
