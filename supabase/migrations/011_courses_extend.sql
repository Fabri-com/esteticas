-- Extend courses with additional fields for detailed landing page
alter table if exists courses
  add column if not exists start_date date,
  add column if not exists schedule_text text,
  add column if not exists teacher text,
  add column if not exists certificate_included boolean default false,
  add column if not exists seats_available int,
  add column if not exists program_md text,
  add column if not exists requirements_md text,
  add column if not exists includes_md text;
