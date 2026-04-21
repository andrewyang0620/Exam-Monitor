-- ============================================================
-- ExamSeat Monitor V1 — Migration 003
-- Adds monitor health tracking columns to platforms table.
-- No new tables — smallest clean solution.
-- ============================================================

ALTER TABLE public.platforms
  ADD COLUMN IF NOT EXISTS last_success_at      timestamptz,
  ADD COLUMN IF NOT EXISTS last_failure_at      timestamptz,
  ADD COLUMN IF NOT EXISTS consecutive_failures integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error_message   text,
  ADD COLUMN IF NOT EXISTS latest_observed_at   timestamptz;
