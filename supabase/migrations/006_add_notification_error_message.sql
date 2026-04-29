alter table public.notification_deliveries
  add column if not exists error_message text;
