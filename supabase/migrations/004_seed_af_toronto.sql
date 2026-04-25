-- ============================================================
-- ExamSeat Monitor V1 - Migration 004
-- Seeds Alliance Francaise de Toronto as a real monitored platform.
-- ============================================================

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
  'af-toronto',
  'Alliance Francaise de Toronto',
  'Toronto',
  'ON',
  array['TCF Canada'],
  'https://www.alliance-francaise.ca/en/exams/tests/informations-about-tcf-canada',
  'https://www.alliance-francaise.ca/en/exams/tests/informations-about-tcf-canada/tcf-canada',
  'https://www.alliance-francaise.ca/en/exams/tests/informations-about-tcf-canada',
  'operational',
  'full',
  'html',
  true,
  300
)
on conflict (id) do update set
  display_name = excluded.display_name,
  city = excluded.city,
  province = excluded.province,
  exam_types_supported = excluded.exam_types_supported,
  entry_url = excluded.entry_url,
  detection_url = excluded.detection_url,
  registration_url = excluded.registration_url,
  health_status = excluded.health_status,
  monitoring_level = excluded.monitoring_level,
  detection_mode = excluded.detection_mode,
  autofill_supported = excluded.autofill_supported,
  polling_interval_s = excluded.polling_interval_s,
  updated_at = now();
