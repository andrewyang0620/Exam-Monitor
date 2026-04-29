alter table public.monitoring_rules
  alter column channels set default array['email']::text[];

update public.monitoring_rules
set channels = array_remove(channels, 'browser')
where channels @> array['browser']::text[];

update public.monitoring_rules
set channels = array['email']::text[]
where channels is null or array_length(channels, 1) is null;
