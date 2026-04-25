-- ============================================================
-- ExamSeat Monitor V1 - Migration 005
-- Adds metadata jsonb to seat_observations for parser side information.
-- ============================================================

alter table public.seat_observations
  add column if not exists metadata jsonb;
